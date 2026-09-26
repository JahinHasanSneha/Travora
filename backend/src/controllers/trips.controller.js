const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { round2, isBooked, isItinerarySaved, costBreakdown, sumItems, isOrganizer } = require('../utils/tripFlow');
const { tripSeatsTaken } = require('../utils/capacity');
const { recalcTripCost } = require('./tripItinerary.controller');

// GET /api/trips/mine - trips the user owns or is a member of
const myTrips = asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT DISTINCT t.*, tm.role, tm.confirmed
     FROM custom_trips t
     JOIN trip_members tm ON tm.trip_id = t.trip_id
     WHERE tm.user_id = $1
     ORDER BY t.created_at DESC`,
    [req.user.user_id]
  );
  res.json(result.rows);
});

// GET /api/trips/public - booked public trips open for others to join
const listPublicTrips = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const params = [req.user.user_id];
  let cityFilter = '';
  if (city && city.trim() !== '') {
    params.push(`%${city.trim()}%`);
    cityFilter = ` AND t.destination_city ILIKE $${params.length}`;
  }

  // Only trips the organizer has already booked (status = 'confirmed') are joinable.
  const result = await db.query(
    `SELECT t.trip_id, t.title, t.destination_city, t.destination_country, t.duration_days,
            t.start_date, t.end_date, t.max_travelers, t.status, t.is_public, t.rating,
            t.total_cost_per_person,
            u.full_name AS organizer_name,
            -- slots are occupied ONLY by travelers whose booking is confirmed
            (SELECT COALESCE(SUM(GREATEST(bk.number_of_travelers, 1)), 0) FROM bookings bk
              WHERE bk.trip_id = t.trip_id AND bk.booking_status IN ('confirmed', 'completed'))::int AS confirmed_members,
            -- joined but not confirmed yet: listed separately, do NOT occupy a slot
            (SELECT COUNT(*) FROM trip_members tm4
              WHERE tm4.trip_id = t.trip_id AND tm4.user_id IS NOT NULL AND tm4.confirmed = TRUE
                AND NOT EXISTS (SELECT 1 FROM bookings bk2 WHERE bk2.trip_id = tm4.trip_id AND bk2.user_id = tm4.user_id
                                AND bk2.booking_status IN ('confirmed', 'completed')))::int AS pending_members,
            (SELECT COUNT(*) FROM reviews rv WHERE rv.trip_id = t.trip_id)::int AS review_count,
            EXISTS(SELECT 1 FROM trip_members tm3 WHERE tm3.trip_id = t.trip_id AND tm3.user_id = $1) AS is_member
     FROM custom_trips t
     JOIN trip_members tm ON tm.trip_id = t.trip_id AND tm.role = 'organizer'
     JOIN users u ON u.user_id = tm.user_id
     WHERE t.is_public = TRUE AND t.status = 'confirmed'${cityFilter}
     ORDER BY t.created_at DESC
     LIMIT 100`,
    params
  );
  res.json(result.rows);
});

// GET /api/trips/:id - full trip with itinerary + members + CALCULATED budget
const getTrip = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const trip = await db.query('SELECT * FROM custom_trips WHERE trip_id = $1', [tripId]);
  if (!trip.rows[0]) return res.status(404).json({ error: 'Trip not found.' });
  const t = trip.rows[0];

  const memberRow = await db.query('SELECT role FROM trip_members WHERE trip_id = $1 AND user_id = $2', [tripId, req.user.user_id]);
  const isMember = !!memberRow.rows[0];
  const organizer = memberRow.rows[0]?.role === 'organizer';
  if (!isMember && !t.is_public) return res.status(403).json({ error: 'You are not a member of this trip.' });

  const itinerary = await db.query(
    `SELECT ti.*, cp.name AS place_name, h.name AS hotel_name, r.name AS restaurant_name, cr.ship_name AS cruise_name
     FROM trip_itinerary ti
     LEFT JOIN cached_places cp ON cp.place_id = ti.place_id
     LEFT JOIN hotels h ON h.hotel_id = ti.hotel_id
     LEFT JOIN restaurants r ON r.restaurant_id = ti.restaurant_id
     LEFT JOIN cruises cr ON cr.cruise_id = ti.cruise_id
     WHERE ti.trip_id = $1 ORDER BY ti.day_number, ti.visit_time, ti.itinerary_id`,
    [tripId]
  );
  const membersResult = await db.query(
    `SELECT tm.trip_member_id, tm.trip_id, tm.user_id, tm.role, tm.confirmed, tm.joined_at, u.full_name, u.email,
            (SELECT COALESCE(SUM(GREATEST(b2.number_of_travelers, 1)), 0) FROM bookings b2
              WHERE b2.trip_id = tm.trip_id AND b2.user_id = tm.user_id
                AND b2.booking_status IN ('confirmed', 'completed'))::int AS seats,
            (SELECT b.booking_status FROM bookings b
              WHERE b.trip_id = tm.trip_id AND b.user_id = tm.user_id AND b.booking_status <> 'cancelled'
              ORDER BY b.booked_at DESC LIMIT 1) AS booking_status
     FROM trip_members tm JOIN users u ON u.user_id = tm.user_id WHERE tm.trip_id = $1
     ORDER BY (tm.role = 'organizer') DESC, tm.joined_at`,
    [tripId]
  );
  // Each member is "joined" (confirmed) and, separately, "booked" once their own booking is confirmed/completed.
  // Don't leak members' emails to non-members browsing a public trip.
  const members = membersResult.rows.map((m) => {
    const out = { ...m, booked: ['confirmed', 'completed'].includes(m.booking_status) };
    if (!isMember) out.email = undefined;
    return out;
  });

  // ---- calculated budget (never a manually entered number) ----
  const saved = isItinerarySaved(t);
  const perPerson = saved ? round2(t.total_cost_per_person) : sumItems(itinerary.rows);
  // Slots are occupied ONLY by members with a confirmed booking. Members who joined but whose
  // booking isn't confirmed yet are "pending" and take no slot.
  const seatsTaken = await tripSeatsTaken(db, tripId);
  const maxTravelers = Number(t.max_travelers || 1);
  const seatsLeft = Math.max(maxTravelers - seatsTaken, 0);
  const isFull = seatsLeft <= 0;
  const pendingCount = members.filter((m) => m.confirmed && !m.booked).length;
  const groupSize = Math.max(seatsTaken, 1);
  const booked = isBooked(t);
  const iAmBooked = members.some((m) => m.user_id === req.user.user_id && m.booked);

  const { budget, ...tripFields } = t; // legacy manual budget column is never exposed

  res.json({
    ...tripFields,
    itinerary: itinerary.rows,
    members,
    // calculated figures
    per_person_cost: perPerson,
    total_group_cost: round2(perPerson * groupSize),
    cost_breakdown: costBreakdown(itinerary.rows),
    // flow state
    is_member: isMember,
    is_organizer: organizer,
    itinerary_locked: saved,
    organizer_booked: booked,
    can_edit_itinerary: organizer && !saved,
    can_save_itinerary: organizer && !saved && itinerary.rows.length > 0,
    // slot accounting (confirmed bookings only)
    seats_taken: seatsTaken,
    seats_left: seatsLeft,
    pending_members: pendingCount,
    is_full: isFull,
    can_book: !iAmBooked && !isFull && ((organizer && saved && !booked) || (isMember && !organizer && booked)),
    can_publish_or_invite: organizer && saved && booked,
  });
});

// POST /api/trips - create a custom trip (creator becomes organizer).
// No budget and no visibility here: budget is calculated from the itinerary,
// and a trip can only be made public / shared after the organizer books it.
const createTrip = asyncHandler(async (req, res) => {
  const { title, destination_city, destination_country, start_date, end_date, preferences } = req.body;
  const duration_days = parseInt(req.body.duration_days, 10);
  const max_travelers = req.body.max_travelers === undefined ? 1 : parseInt(req.body.max_travelers, 10);

  if (!title || !destination_city || !destination_country || !duration_days) {
    return res.status(400).json({ error: 'title, destination_city, destination_country, duration_days are required.' });
  }
  if (!Number.isInteger(duration_days) || duration_days < 1) {
    return res.status(400).json({ error: 'duration_days must be a positive whole number.' });
  }
  if (!Number.isInteger(max_travelers) || max_travelers < 1) {
    return res.status(400).json({ error: 'max_travelers must be a positive whole number.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const trip = await client.query(
      `INSERT INTO custom_trips (user_id, title, destination_city, destination_country, start_date, end_date,
        duration_days, preferences, is_public, max_travelers, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,$9,'draft') RETURNING *`,
      [req.user.user_id, title, destination_city, destination_country, start_date || null, end_date || null,
        duration_days, preferences || [], max_travelers]
    );
    await client.query(
      `INSERT INTO trip_members (trip_id, user_id, role, confirmed) VALUES ($1,$2,'organizer',TRUE)`,
      [trip.rows[0].trip_id, req.user.user_id]
    );
    await client.query('COMMIT');
    res.status(201).json(trip.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// POST /api/trips/:id/save-itinerary (organizer only)
// Freezes the itinerary and the calculated per-person cost. Irreversible.
const saveItinerary = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const trip = await client.query('SELECT * FROM custom_trips WHERE trip_id = $1 FOR UPDATE', [tripId]);
    if (!trip.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Trip not found.' }); }
    if (!(await isOrganizer(client, tripId, req.user.user_id))) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the trip organizer can save the itinerary.' });
    }
    if (isItinerarySaved(trip.rows[0])) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This itinerary has already been saved.' });
    }

    const count = await client.query('SELECT COUNT(*)::int AS n FROM trip_itinerary WHERE trip_id = $1', [tripId]);
    if (count.rows[0].n === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Add at least one plan to your itinerary before saving it.' });
    }

    const totals = await recalcTripCost(client, tripId); // final calculated cost
    const updated = await client.query(
      'UPDATE custom_trips SET itinerary_saved_at = CURRENT_TIMESTAMP WHERE trip_id = $1 RETURNING *',
      [tripId]
    );
    await client.query('COMMIT');

    const { budget, ...fields } = updated.rows[0];
    res.json({ ...fields, per_person_cost: round2(totals.total) });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PATCH /api/trips/:id (organizer only)
// Cost, budget, status and the saved itinerary are never editable here.
const updateTrip = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  if (!(await isOrganizer(db, tripId, req.user.user_id))) {
    return res.status(403).json({ error: 'Only the trip organizer can edit trip details.' });
  }

  const forbidden = ['budget', 'total_cost_per_person', 'platform_commission', 'status', 'itinerary_saved_at', 'budget_allocation'];
  const attempted = forbidden.filter((f) => req.body[f] !== undefined);
  if (attempted.length > 0) {
    return res.status(400).json({ error: `${attempted.join(', ')} cannot be edited: the budget is calculated automatically and the trip status is set by booking.` });
  }

  const trip = await db.query('SELECT * FROM custom_trips WHERE trip_id = $1', [tripId]);
  const t = trip.rows[0];
  if (!t) return res.status(404).json({ error: 'Trip not found.' });

  if (t.status === 'completed') {
    return res.status(409).json({ error: 'This trip is completed and can no longer be edited.' });
  }

  const body = { ...req.body };

  if (body.duration_days !== undefined) {
    if (isItinerarySaved(t)) {
      return res.status(409).json({ error: 'The itinerary is saved, so the number of days can no longer change.' });
    }
    const d = parseInt(body.duration_days, 10);
    if (!Number.isInteger(d) || d < 1) return res.status(400).json({ error: 'duration_days must be a positive whole number.' });
    const maxDay = await db.query('SELECT COALESCE(MAX(day_number), 0)::int AS m FROM trip_itinerary WHERE trip_id = $1', [tripId]);
    if (d < maxDay.rows[0].m) {
      return res.status(409).json({ error: `Remove the plans on days after day ${d} first.` });
    }
    body.duration_days = d;
  }

  if (body.is_public !== undefined) {
    body.is_public = body.is_public === true || body.is_public === 'true';
    if (body.is_public && !(isItinerarySaved(t) && isBooked(t))) {
      return res.status(409).json({ error: 'Save your itinerary and book your own trip before making it public.' });
    }
  }

  if (body.max_travelers !== undefined) {
    const m = parseInt(body.max_travelers, 10);
    if (!Number.isInteger(m) || m < 1) return res.status(400).json({ error: 'max_travelers must be a positive whole number.' });
    const joined = await db.query('SELECT COUNT(*)::int AS n FROM trip_members WHERE trip_id = $1 AND confirmed = TRUE', [tripId]);
    if (m < joined.rows[0].n) {
      return res.status(400).json({ error: `${joined.rows[0].n} travelers have already joined; max travelers can't be lower.` });
    }
    body.max_travelers = m;
  }

  const fields = ['title', 'start_date', 'end_date', 'duration_days', 'preferences', 'is_public', 'max_travelers'];
  const sets = []; const params = [];
  fields.forEach((f) => { if (body[f] !== undefined) { params.push(body[f]); sets.push(`${f} = $${params.length}`); } });
  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields to update.' });
  params.push(tripId);

  const result = await db.query(`UPDATE custom_trips SET ${sets.join(', ')} WHERE trip_id = $${params.length} RETURNING *`, params);
  const { budget, ...fieldsOut } = result.rows[0];
  res.json(fieldsOut);
});

// DELETE /api/trips/:id (organizer only, draft trips only)
// A booked/completed trip, or any trip that already has bookings, can't be deleted:
// bookings keep a reference to the trip.
const deleteTrip = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  if (!(await isOrganizer(db, tripId, req.user.user_id))) {
    return res.status(403).json({ error: 'Only the trip organizer can delete this trip.' });
  }
  const trip = await db.query('SELECT status FROM custom_trips WHERE trip_id = $1', [tripId]);
  if (!trip.rows[0]) return res.status(404).json({ error: 'Trip not found.' });
  if (trip.rows[0].status !== 'draft') {
    return res.status(409).json({ error: 'Only draft trips can be deleted.' });
  }
  const bookings = await db.query('SELECT 1 FROM bookings WHERE trip_id = $1 LIMIT 1', [tripId]);
  if (bookings.rows[0]) {
    return res.status(409).json({ error: 'This trip already has bookings, so it can no longer be deleted.' });
  }
  await db.query('DELETE FROM custom_trips WHERE trip_id = $1', [tripId]);
  res.status(204).send();
});

module.exports = { myTrips, listPublicTrips, getTrip, createTrip, saveItinerary, updateTrip, deleteTrip };
