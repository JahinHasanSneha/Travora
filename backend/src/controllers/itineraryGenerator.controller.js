const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { round2 } = require('../utils/tripFlow');

/**
 * "Smart" Database-Driven Itinerary Generator (the free AI alternative).
 *
 * Inputs: destination_city, duration_days, preferences[] (+ optional title,
 * start_date, max_travelers, save). There is NO budget input: the trip cost is
 * whatever the generated plan adds up to, and it is calculated for you.
 *
 * Strategy (deterministic, so the preview and the saved trip always match):
 *  1. Pick ONE hotel for the whole stay: the highest-rated available hotel in
 *     the city (ties -> cheaper first).
 *  2. Each day, pick the best-value restaurants and attractions from the local
 *     `restaurants` / `cached_places` tables (rating + preference boost), never
 *     repeating a place across days.
 *  3. Preference matching (e.g. "vegetarian", "halal", "museum") boosts the
 *     value of matching restaurants/attractions.
 *
 * With `save: true` the plan is stored as a DRAFT trip with an UNSAVED
 * itinerary. The organizer reviews it on the trip page, then clicks
 * "Save Itinerary" (which freezes it) and books their own trip.
 */

const RESTAURANTS_PER_DAY = 2;
const ATTRACTIONS_PER_DAY = 2;

function preferenceBoost(item, preferences) {
  if (!preferences || preferences.length === 0) return 0;
  const text = `${item.name || ''} ${item.cuisine_type || ''} ${item.place_type || ''}`.toLowerCase();
  let boost = 0;
  preferences.forEach((p) => {
    if (text.includes(String(p).toLowerCase())) boost += 2; // preference match outweighs a full extra star
  });
  if (preferences.includes('vegetarian') && item.has_vegetarian) boost += 2;
  if (preferences.includes('halal') && item.has_halal) boost += 2;
  return boost;
}
//VALUE = rating + preference bonus
const byValueThenCost = (a, b) => b.value - a.value || a.cost - b.cost || a.ref_id - b.ref_id;

// 1. Higher value
//     ↓ tie
// 2. Lower cost
//       ↓ tie
// 3. Lower ID

// price_level 0-4 -> approximate dollar cost per person
const priceLevelToCost = { 0: 0, 1: 10, 2: 25, 3: 50, 4: 90 };

async function buildPlan({ destination_city, destination_country, days, preferences }) {
  // ---- 1. Hotel (whole stay) ----
  const hotelsResult = await db.query(
    `SELECT hotel_id, name, price_per_night, star_rating, rating, amenities, available_rooms
     FROM hotels WHERE city ILIKE $1 AND available_rooms > 0
     ORDER BY rating DESC NULLS LAST, price_per_night ASC, hotel_id ASC`,
    [`%${destination_city}%`]
  );
  const hotel = hotelsResult.rows[0] || null;
  const lodgingCost = hotel ? parseFloat(hotel.price_per_night) * days : 0;

  // ---- 2. Candidates ----
  const restaurantsResult = await db.query(
    `SELECT restaurant_id, name, cuisine_type, avg_meal_cost, rating, has_vegetarian, has_halal
     FROM restaurants WHERE city ILIKE $1 AND available_tables > 0`,
    [`%${destination_city}%`]
  );
  const attractionsResult = await db.query(
    `SELECT place_id, name, place_type, price_level, rating FROM cached_places
     WHERE city ILIKE $1 AND place_type = 'attraction'`,
    [`%${destination_city}%`]
  );

  const restaurantItems = restaurantsResult.rows
    .map((r) => ({
      type: 'restaurant',
      ref_id: r.restaurant_id,
      name: r.name,
      cost: parseFloat(r.avg_meal_cost) || 0,
      value: parseFloat(r.rating || 3) + preferenceBoost(r, preferences),
    }))
    .sort(byValueThenCost);

  const attractionItems = attractionsResult.rows
    .map((a) => ({
      type: 'attraction',
      ref_id: a.place_id,
      name: a.name,
      cost: priceLevelToCost[a.price_level ?? 1] ?? 15,
      value: parseFloat(a.rating || 3) + preferenceBoost(a, preferences),
    }))
    .sort(byValueThenCost);

  // ---- 3. Day by day ----
  const itineraryByDay = [];
  let ri = 0;
  let ai = 0;
  for (let day = 1; day <= days; day++) {
    const chosen = [
      ...restaurantItems.slice(ri, ri + RESTAURANTS_PER_DAY),
      ...attractionItems.slice(ai, ai + ATTRACTIONS_PER_DAY),
    ];
    ri += RESTAURANTS_PER_DAY;
    ai += ATTRACTIONS_PER_DAY;

    const dayCost = chosen.reduce((s, c) => s + c.cost, 0);
    itineraryByDay.push({
      day_number: day,
      hotel: hotel ? { hotel_id: hotel.hotel_id, name: hotel.name, price_per_night: hotel.price_per_night } : null,
      items: chosen.map((c) => ({ type: c.type, ref_id: c.ref_id, name: c.name, estimated_cost: c.cost })),
      day_activity_cost: round2(dayCost),
    });
  }

  const totalActivityCost = itineraryByDay.reduce((s, d) => s + d.day_activity_cost, 0);

  return {
    destination_city,
    destination_country,
    duration_days: days,
    hotel,
    lodging_cost: round2(lodgingCost),
    days: itineraryByDay,
    // Calculated from the plan itself (hotel nights + activities/meals), per person.
    estimated_total_cost: round2(lodgingCost + totalActivityCost),
  };
}

// POST /api/trips/generate
const generateItinerary = asyncHandler(async (req, res) => {
  const { destination_city, destination_country, preferences = [], title, start_date, save } = req.body;
  const days = parseInt(req.body.duration_days, 10);
  const maxTravelers = req.body.max_travelers === undefined ? 1 : parseInt(req.body.max_travelers, 10);

  if (!destination_city || !days) {
    return res.status(400).json({ error: 'destination_city and duration_days are required.' });
  }
  if (!Number.isInteger(days) || days < 1) {
    return res.status(400).json({ error: 'duration_days must be a positive whole number.' });
  }
  if (!Number.isInteger(maxTravelers) || maxTravelers < 1) {
    return res.status(400).json({ error: 'max_travelers must be a positive whole number.' });
  }

  const summary = await buildPlan({ destination_city, destination_country, days, preferences });

  // ---- Optionally persist as a real custom_trip + trip_itinerary rows (still an editable DRAFT) ----
  if (save) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const trip = await client.query(
        `INSERT INTO custom_trips (user_id, title, destination_city, destination_country, start_date, duration_days, preferences, max_travelers, is_public, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,'draft') RETURNING *`,
        [req.user.user_id, title || `${destination_city} Trip`, destination_city, destination_country || '', start_date || null, days, preferences, maxTravelers]
      );
      const tripId = trip.rows[0].trip_id;
      await client.query(`INSERT INTO trip_members (trip_id, user_id, role, confirmed) VALUES ($1,$2,'organizer',TRUE)`, [tripId, req.user.user_id]);

      for (const d of summary.days) {
        if (d.hotel) {
          await client.query(
            `INSERT INTO trip_itinerary (trip_id, day_number, hotel_id, cost_per_person, notes) VALUES ($1,$2,$3,$4,'Auto-generated lodging')`,
            [tripId, d.day_number, d.hotel.hotel_id, d.hotel.price_per_night]
          );
        }
        for (const item of d.items) {
          if (item.type === 'restaurant') {
            await client.query(
              `INSERT INTO trip_itinerary (trip_id, day_number, restaurant_id, cost_per_person, notes) VALUES ($1,$2,$3,$4,'Auto-generated')`,
              [tripId, d.day_number, item.ref_id, item.estimated_cost]
            );
          } else {
            await client.query(
              `INSERT INTO trip_itinerary (trip_id, day_number, place_id, cost_per_person, notes) VALUES ($1,$2,$3,$4,'Auto-generated')`,
              [tripId, d.day_number, item.ref_id, item.estimated_cost]
            );
          }
        }
      }
      const totalResult = await client.query('SELECT calculate_trip_total_cost($1) AS total', [tripId]);
      const total = parseFloat(totalResult.rows[0].total);
      const commission = Math.round(total * (parseFloat(process.env.DEFAULT_COMMISSION_RATE || '10') / 100) * 100) / 100;
      await client.query('UPDATE custom_trips SET total_cost_per_person = $1, platform_commission = $2 WHERE trip_id = $3', [total, commission, tripId]);

      await client.query('COMMIT');
      summary.saved_trip_id = tripId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  res.json(summary);
});

module.exports = { generateItinerary };
