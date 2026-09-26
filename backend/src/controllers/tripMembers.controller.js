const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { tripSeatsTaken } = require('../utils/capacity');
const { round2, costBreakdown } = require('../utils/tripFlow');

const NOT_BOOKED_MSG = 'The organizer needs to save the itinerary and book this trip before it can be shared or joined.';

// POST /api/trips/:id/invite - organizer generates a shareable invite link
// (NULL user_id rows are permitted by the UNIQUE(trip_id, user_id) constraint in Postgres,
// since NULL is never considered equal to another NULL for uniqueness purposes.)
const createInvite = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const org = await db.query(`SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND role = 'organizer'`, [tripId, req.user.user_id]);
  if (!org.rows[0]) return res.status(403).json({ error: 'Only the organizer can generate invite links.' });

  const t = await db.query('SELECT status, itinerary_saved_at FROM custom_trips WHERE trip_id = $1', [tripId]);
  if (!t.rows[0]) return res.status(404).json({ error: 'Trip not found.' });
  if (!t.rows[0].itinerary_saved_at || t.rows[0].status !== 'confirmed') {
    return res.status(409).json({ error: 'Save your itinerary and book your own trip before inviting travelers.' });
  }

  const result = await db.query(
    `INSERT INTO trip_members (trip_id, user_id, role, confirmed)
     VALUES ($1, NULL, 'participant', FALSE) RETURNING invite_token`,
    [tripId]
  );
  res.status(201).json({ invite_link: `/trips/join/${result.rows[0].invite_token}` });
});

// POST /api/trips/join-by-token/:token - accept an invite via the generated system link
const joinByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const pending = await db.query(`SELECT trip_id FROM trip_members WHERE invite_token = $1 AND user_id IS NULL`, [token]);
  if (!pending.rows[0]) return res.status(404).json({ error: 'Invite link is invalid or already used.' });
  const tripId = pending.rows[0].trip_id;

  const trip = await db.query('SELECT max_travelers, status, itinerary_saved_at FROM custom_trips WHERE trip_id = $1', [tripId]);
  if (!trip.rows[0]) return res.status(404).json({ error: 'Trip not found.' });
  // Travelers can only join once the organizer saved the itinerary and booked their own trip
  // (status flips to 'confirmed' only when the ORGANIZER creates their booking).
  if (!trip.rows[0].itinerary_saved_at || trip.rows[0].status !== 'confirmed') {
    return res.status(409).json({ error: NOT_BOOKED_MSG });
  }
  // Slots are occupied only by CONFIRMED bookings. Once they fill the trip nobody else can join / book.
  if ((await tripSeatsTaken(db, tripId)) >= trip.rows[0].max_travelers) {
    return res.status(409).json({ error: 'This trip is full. All slots are taken by confirmed bookings.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM trip_members WHERE invite_token = $1 AND user_id IS NULL', [token]);
    const joined = await client.query(
      `INSERT INTO trip_members (trip_id, user_id, role, confirmed) VALUES ($1,$2,'participant',TRUE)
       ON CONFLICT (trip_id, user_id) DO UPDATE SET confirmed = TRUE RETURNING *`,
      [tripId, req.user.user_id]
    );
    await client.query('COMMIT');
    res.status(201).json(joined.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// POST /api/trips/join/:tripId - accept an invite by trip id (simple, robust link format)
const joinTrip = asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const trip = await db.query('SELECT trip_id, max_travelers, status, is_public, itinerary_saved_at FROM custom_trips WHERE trip_id = $1', [tripId]);
  if (!trip.rows[0]) return res.status(404).json({ error: 'Trip not found.' });
  if (!trip.rows[0].itinerary_saved_at || trip.rows[0].status !== 'confirmed') {
    return res.status(409).json({ error: NOT_BOOKED_MSG });
  }
  // Joining by trip id is only for PUBLIC trips; private trips are joined through an invite link.
  if (!trip.rows[0].is_public) {
    return res.status(403).json({ error: 'This trip is private. Ask the organizer for an invite link.' });
  }

  // Slots are occupied only by CONFIRMED bookings. Once they fill the trip nobody else can join / book.
  if ((await tripSeatsTaken(db, tripId)) >= trip.rows[0].max_travelers) {
    return res.status(409).json({ error: 'This trip is full. All slots are taken by confirmed bookings.' });
  }

  const result = await db.query(
    `INSERT INTO trip_members (trip_id, user_id, role, confirmed)
     VALUES ($1, $2, 'participant', TRUE)
     ON CONFLICT (trip_id, user_id) DO UPDATE SET confirmed = TRUE
     RETURNING *`,
    [tripId, req.user.user_id]
  );
  res.status(201).json(result.rows[0]);
});

// DELETE /api/trips/:id/members/:userId - organizer removes a member, or a member leaves themselves
const removeMember = asyncHandler(async (req, res) => {
  const { id: tripId, userId } = req.params;
  const isSelf = parseInt(userId, 10) === req.user.user_id;
  if (!isSelf) {
    const org = await db.query(`SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND role = 'organizer'`, [tripId, req.user.user_id]);
    if (!org.rows[0]) return res.status(403).json({ error: 'Only the organizer can remove other members.' });
  }
  await db.query('DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2', [tripId, userId]);
  res.status(204).send();
});

// GET /api/trips/:id/cost-split - per-person cost breakdown across confirmed members.
// Everything here is derived from the itinerary's calculated cost (never a manual budget).
const costSplit = asyncHandler(async (req, res) => {
  const tripId = req.params.id;
  const trip = await db.query('SELECT trip_id, is_public, itinerary_saved_at, total_cost_per_person FROM custom_trips WHERE trip_id = $1', [tripId]);
  if (!trip.rows[0]) return res.status(404).json({ error: 'Trip not found.' });

  const membership = await db.query('SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2', [tripId, req.user.user_id]);
  if (!membership.rows[0] && !trip.rows[0].is_public) {
    return res.status(403).json({ error: 'You are not a member of this trip.' });
  }

  const items = await db.query('SELECT * FROM trip_itinerary WHERE trip_id = $1', [tripId]);
  const calculated = round2(items.rows.reduce((s, it) => s + (Number(it.cost_per_person) || 0), 0));
  // Once saved the frozen value is authoritative; before that, the live sum of the items.
  const perPerson = trip.rows[0].itinerary_saved_at ? round2(trip.rows[0].total_cost_per_person) : calculated;

  const membersResult = await db.query(
    `SELECT tm.user_id, u.full_name, tm.role,
            EXISTS (SELECT 1 FROM bookings b WHERE b.trip_id = tm.trip_id AND b.user_id = tm.user_id
                    AND b.booking_status IN ('confirmed', 'completed')) AS booked
     FROM trip_members tm JOIN users u ON u.user_id = tm.user_id
     WHERE tm.trip_id = $1 AND tm.confirmed = TRUE`,
    [tripId]
  );
  // Only travelers with a confirmed booking hold a slot and share the cost.
  const members = membersResult.rows.filter((m) => m.booked);
  const pendingMembers = membersResult.rows.filter((m) => !m.booked);
  const memberCount = members.length;
  const totalGroupCost = round2(perPerson * memberCount);

  res.json({
    trip_id: parseInt(tripId, 10),
    itinerary_saved: !!trip.rows[0].itinerary_saved_at,
    confirmed_members: memberCount,
    pending_members: pendingMembers.length,
    total_group_cost: totalGroupCost,
    per_person_cost: perPerson,
    cost_breakdown: costBreakdown(items.rows),
    breakdown: members.map((m) => ({ ...m, owes: perPerson })),
  });
});

module.exports = { createInvite, joinByToken, joinTrip, removeMember, costSplit };
