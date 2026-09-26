const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

/* =========================================================
   PERMISSIONS + EDITABILITY

   Only the trip ORGANIZER can build the itinerary, and only until
   they click "Save Itinerary" (custom_trips.itinerary_saved_at).
   After that the plan and the calculated cost are frozen for
   everyone, including the organizer (also enforced by DB triggers).
   Travelers can only join a trip; they never edit it.
========================================================= */

async function assertOrganizer(tripId, userId) {
  const r = await db.query(
    `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND role = 'organizer'`,
    [tripId, userId]
  );
  return !!r.rows[0];
}

async function assertEditable(tripId) {
  const r = await db.query(
    "SELECT itinerary_saved_at, duration_days FROM custom_trips WHERE trip_id = $1",
    [tripId]
  );

  if (!r.rows[0]) return { ok: false, notFound: true };
  if (r.rows[0].itinerary_saved_at) return { ok: false, notFound: false };
  return { ok: true, durationDays: r.rows[0].duration_days };
}

const LOCKED_MESSAGE =
  "This itinerary has been saved and can no longer be modified.";

/* =========================================================
   RECALCULATE TRIP COST
========================================================= */

async function recalcTripCost(client, tripId) {
  const itemsResult = await client.query(
    "SELECT calculate_trip_total_cost($1) AS total",
    [tripId]
  );

  const total = parseFloat(
    itemsResult.rows[0]?.total || 0
  );

  const commissionRate =
    parseFloat(
      process.env.DEFAULT_COMMISSION_RATE || "10.00"
    ) / 100;

  const commission =
    Math.round(total * commissionRate * 100) / 100;

  await client.query(
    `
      UPDATE custom_trips
      SET
        total_cost_per_person = $1,
        platform_commission = $2
      WHERE trip_id = $3
    `,
    [total, commission, tripId]
  );

  return {
    total,
    commission,
  };
}

/* =========================================================
   POST /api/trips/:id/itinerary
   ADD ITINERARY ITEM

   Supports:

   1. place_id
   2. hotel_id
   3. restaurant_id
   4. cruise_id

   OR

   5. custom_name
      custom_type
      estimated_cost
========================================================= */

const addItem = asyncHandler(async (req, res) => {
  const tripId = req.params.id;

  /* -------------------------------------------------------
     CHECK MEMBER
  ------------------------------------------------------- */

  if (!(await assertOrganizer(tripId, req.user.user_id))) {
    return res.status(403).json({
      error: "Only the trip organizer can edit the itinerary.",
    });
  }

  /* -------------------------------------------------------
     CHECK ITINERARY IS NOT SAVED YET
  ------------------------------------------------------- */

  const editable = await assertEditable(tripId);
  if (!editable.ok) {
    if (editable.notFound) {
      return res.status(404).json({ error: "Trip not found." });
    }
    return res.status(409).json({ error: LOCKED_MESSAGE });
  }

  /* -------------------------------------------------------
     GET REQUEST BODY
  ------------------------------------------------------- */

  const {
    day_number,

    /* Existing database references */
    place_id,
    hotel_id,
    restaurant_id,
    cruise_id,

    /* Existing optional fields */
    visit_time,
    duration_hours,
    notes,

    /* NEW CUSTOM PLAN FIELDS */
    custom_name,
    custom_type,
    estimated_cost,
  } = req.body;

  /* -------------------------------------------------------
     VALIDATE DAY
  ------------------------------------------------------- */

  if (
    day_number === undefined ||
    day_number === null ||
    day_number === ""
  ) {
    return res.status(400).json({
      error: "day_number is required.",
    });
  }

  const dayNumber = Number(day_number);

  if (
    !Number.isInteger(dayNumber) ||
    dayNumber < 1
  ) {
    return res.status(400).json({
      error:
        "day_number must be a positive integer.",
    });
  }

  if (dayNumber > Number(editable.durationDays)) {
    return res.status(400).json({
      error: `day_number must be between 1 and ${editable.durationDays}.`,
    });
  }

  /* -------------------------------------------------------
     DETERMINE ITEM TYPE
  ------------------------------------------------------- */

  const hasPlace =
    place_id !== undefined &&
    place_id !== null;

  const hasHotel =
    hotel_id !== undefined &&
    hotel_id !== null;

  const hasRestaurant =
    restaurant_id !== undefined &&
    restaurant_id !== null;

  const hasCruise =
    cruise_id !== undefined &&
    cruise_id !== null;

  const hasCustomName =
    typeof custom_name === "string" &&
    custom_name.trim().length > 0;

  const referenceCount = [
    hasPlace,
    hasHotel,
    hasRestaurant,
    hasCruise,
  ].filter(Boolean).length;

  /* -------------------------------------------------------
     CUSTOM PLAN
  ------------------------------------------------------- */

  if (hasCustomName) {
    /*
     * A custom plan must NOT also have a database
     * reference such as hotel_id/place_id.
     */
    if (referenceCount > 0) {
      return res.status(400).json({
        error:
          "A custom plan cannot be combined with a place, hotel, restaurant, or cruise.",
      });
    }

    const cleanName = custom_name.trim();

    const allowedTypes = [
      "attraction",
      "hotel",
      "restaurant",
      "transportation",
      "accommodation",
      "activity",
      "food",
    ];

    const normalizedType = String(
      custom_type || "attraction"
    )
      .trim()
      .toLowerCase();

    if (!allowedTypes.includes(normalizedType)) {
      return res.status(400).json({
        error:
          "Invalid custom_type. Use attraction, hotel, restaurant, transportation, accommodation, activity, or food.",
      });
    }

    let customCost = 0;

    if (
      estimated_cost !== undefined &&
      estimated_cost !== null &&
      estimated_cost !== ""
    ) {
      customCost = Number(estimated_cost);

      if (
        Number.isNaN(customCost) ||
        customCost < 0
      ) {
        return res.status(400).json({
          error:
            "estimated_cost must be a valid non-negative number.",
        });
      }
    }

    const client = await db.getClient();

    try {
      await client.query("BEGIN");

      /*
       * IMPORTANT:
       *
       * This requires these columns in trip_itinerary:
       *
       * custom_name
       * custom_type
       * estimated_cost
       */

      const item = await client.query(
        `
          INSERT INTO trip_itinerary (
            trip_id,
            day_number,
            place_id,
            hotel_id,
            restaurant_id,
            cruise_id,
            visit_time,
            duration_hours,
            notes,
            cost_per_person,
            custom_name,
            custom_type,
            estimated_cost
          )
          VALUES (
            $1,
            $2,
            NULL,
            NULL,
            NULL,
            NULL,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9
          )
          RETURNING *
        `,
        [
          tripId,
          dayNumber,
          visit_time || null,
          duration_hours || null,
          notes || null,

          /*
           * Keep cost_per_person synchronized with
           * estimated_cost because the existing
           * calculate_trip_total_cost() function
           * may use cost_per_person.
           */
          customCost,

          cleanName,
          normalizedType,
          customCost,
        ]
      );

      const totals = await recalcTripCost(
        client,
        tripId
      );

      await client.query("COMMIT");

      return res.status(201).json({
        item: item.rows[0],
        trip_totals: totals,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /* -------------------------------------------------------
     EXISTING MAP ITEM
  ------------------------------------------------------- */

  if (referenceCount !== 1) {
    return res.status(400).json({
      error:
        "Exactly one of place_id, hotel_id, restaurant_id, cruise_id, or custom_name must be provided.",
    });
  }

  /* -------------------------------------------------------
     CALCULATE COST FOR MAP ITEM
  ------------------------------------------------------- */

  let cost = 0;

  /* HOTEL */

  if (hasHotel) {
    const h = await db.query(
      `
        SELECT price_per_night
        FROM hotels
        WHERE hotel_id = $1
      `,
      [hotel_id]
    );

    if (!h.rows[0]) {
      return res.status(404).json({
        error: "Hotel not found.",
      });
    }

    cost = parseFloat(
      h.rows[0].price_per_night || 0
    );
  }

  /* RESTAURANT */

  else if (hasRestaurant) {
    const r = await db.query(
      `
        SELECT avg_meal_cost
        FROM restaurants
        WHERE restaurant_id = $1
      `,
      [restaurant_id]
    );

    if (!r.rows[0]) {
      return res.status(404).json({
        error: "Restaurant not found.",
      });
    }

    cost = parseFloat(
      r.rows[0].avg_meal_cost || 0
    );
  }

  /* CRUISE */

  else if (hasCruise) {
    const c = await db.query(
      `
        SELECT price_per_person
        FROM cruises
        WHERE cruise_id = $1
      `,
      [cruise_id]
    );

    if (!c.rows[0]) {
      return res.status(404).json({
        error: "Cruise not found.",
      });
    }

    cost = parseFloat(
      c.rows[0].price_per_person || 0
    );
  }

  /* PLACE / ATTRACTION */

  else if (hasPlace) {
    /*
     * Places currently don't have a direct cost
     * in this controller, so keep it at 0.
     */
    cost = 0;
  }

  /* -------------------------------------------------------
     INSERT EXISTING ITEM
  ------------------------------------------------------- */

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const item = await client.query(
      `
        INSERT INTO trip_itinerary (
          trip_id,
          day_number,
          place_id,
          hotel_id,
          restaurant_id,
          cruise_id,
          visit_time,
          duration_hours,
          notes,
          cost_per_person,
          custom_name,
          custom_type,
          estimated_cost
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          NULL,
          NULL,
          NULL
        )
        RETURNING *
      `,
      [
        tripId,
        dayNumber,
        hasPlace ? place_id : null,
        hasHotel ? hotel_id : null,
        hasRestaurant
          ? restaurant_id
          : null,
        hasCruise ? cruise_id : null,
        visit_time || null,
        duration_hours || null,
        notes || null,
        cost,
      ]
    );

    const totals = await recalcTripCost(
      client,
      tripId
    );

    await client.query("COMMIT");

    res.status(201).json({
      item: item.rows[0],
      trip_totals: totals,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

/* =========================================================
   DELETE /api/trips/:id/itinerary/:itemId
========================================================= */

const removeItem = asyncHandler(async (req, res) => {
  const {
    id: tripId,
    itemId,
  } = req.params;

  /* -------------------------------------------------------
     CHECK MEMBER
  ------------------------------------------------------- */

  if (!(await assertOrganizer(tripId, req.user.user_id))) {
    return res.status(403).json({
      error: "Only the trip organizer can edit the itinerary.",
    });
  }

  /* -------------------------------------------------------
     CHECK ITINERARY IS NOT SAVED YET
  ------------------------------------------------------- */

  const editable = await assertEditable(tripId);
  if (!editable.ok) {
    if (editable.notFound) {
      return res.status(404).json({ error: "Trip not found." });
    }
    return res.status(409).json({ error: LOCKED_MESSAGE });
  }

  /* -------------------------------------------------------
     DELETE
  ------------------------------------------------------- */

  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    const deleted = await client.query(
      `
        DELETE FROM trip_itinerary
        WHERE itinerary_id = $1
          AND trip_id = $2
        RETURNING *
      `,
      [itemId, tripId]
    );

    if (!deleted.rows[0]) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error:
          "Itinerary item not found.",
      });
    }

    /* -----------------------------------------------------
       RECALCULATE COST
    ----------------------------------------------------- */

    const totals = await recalcTripCost(
      client,
      tripId
    );

    await client.query("COMMIT");

    res.json({
      deleted: true,
      item: deleted.rows[0],
      trip_totals: totals,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  addItem,
  removeItem,
  recalcTripCost,
};