const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { packageSeatsTaken, tripSeatsTaken, syncPackageSlots, conflict } = require('../utils/capacity');

const COMMISSION_RATE = () => parseFloat(process.env.DEFAULT_COMMISSION_RATE || '10.00') / 100;

// POST /api/bookings - creates a pending booking with ATOMIC inventory reduction
// Wrapped in a DB transaction with row locking (SELECT ... FOR UPDATE) to prevent overselling.
const createBooking = asyncHandler(async (req, res) => {
  const { booking_type, package_id, trip_id, number_of_travelers = 1 } = req.body;

  if (!['package', 'custom_trip'].includes(booking_type)) {
    return res.status(400).json({ error: 'booking_type must be "package" or "custom_trip".' });
  }
  if (booking_type === 'package' && !package_id) return res.status(400).json({ error: 'package_id is required.' });
  if (booking_type === 'custom_trip' && !trip_id) return res.status(400).json({ error: 'trip_id is required.' });

  if (!Number.isInteger(Number(number_of_travelers)) || Number(number_of_travelers) < 1) {
    return res.status(400).json({ error: 'number_of_travelers must be a positive whole number.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    let isOrganizerBooking = false;

    if (booking_type === 'package') {
      // Lock the package row to prevent concurrent overselling of slots_available
      const pkgResult = await client.query('SELECT * FROM packages WHERE package_id = $1 FOR UPDATE', [package_id]);
      const pkg = pkgResult.rows[0];
      if (!pkg) throw Object.assign(new Error('Package not found.'), { status: 404 });
      if (pkg.status === 'inactive') throw conflict('Package is not currently bookable.');

      // Only CONFIRMED bookings occupy slots. A pending booking reserves nothing,
      // but nobody can book once the confirmed travelers fill the package.
      const capacity = pkg.max_group_size ?? pkg.slots_available;
      const taken = await packageSeatsTaken(client, package_id);
      const remaining = Math.max(Number(capacity) - taken, 0);
      if (remaining <= 0) throw conflict('This package is fully booked.');
      if (remaining < Number(number_of_travelers)) {
        throw conflict(`Only ${remaining} slot${remaining === 1 ? '' : 's'} left for this package.`);
      }
      totalAmount = parseFloat(pkg.base_price) * number_of_travelers;
    } else {
      // custom_trip flow: organizer saves itinerary -> organizer books -> travelers join & book.
      // Lock the trip row so two concurrent bookings can't race on the status flip.
      const tripResult = await client.query('SELECT * FROM custom_trips WHERE trip_id = $1 FOR UPDATE', [trip_id]);
      const trip = tripResult.rows[0];
      if (!trip) throw Object.assign(new Error('Trip not found.'), { status: 404 });

      const memberResult = await client.query(
        'SELECT role, confirmed FROM trip_members WHERE trip_id = $1 AND user_id = $2', [trip_id, req.user.user_id]
      );
      const member = memberResult.rows[0];
      if (!member || !member.confirmed) throw Object.assign(new Error('You are not a member of this trip.'), { status: 403 });
      isOrganizerBooking = member.role === 'organizer';

      if (!trip.itinerary_saved_at) {
        throw Object.assign(new Error('Save the itinerary before booking this trip.'), { status: 409 });
      }
      if (!isOrganizerBooking && !['confirmed'].includes(trip.status)) {
        throw Object.assign(new Error('The organizer must book this trip before travelers can book.'), { status: 409 });
      }
      if (trip.status === 'completed') {
        throw Object.assign(new Error('This trip is already completed.'), { status: 409 });
      }

      // Only CONFIRMED bookings occupy trip slots; once they fill the trip, no one else can book.
      const tripTaken = await tripSeatsTaken(client, trip_id);
      const tripRemaining = Math.max(Number(trip.max_travelers || 1) - tripTaken, 0);
      if (tripRemaining <= 0) throw conflict('This trip is full. All slots are taken by confirmed bookings.');
      if (tripRemaining < Number(number_of_travelers)) {
        throw conflict(`Only ${tripRemaining} slot${tripRemaining === 1 ? '' : 's'} left on this trip.`);
      }

      const existing = await client.query(
        `SELECT 1 FROM bookings WHERE trip_id = $1 AND user_id = $2 AND booking_status <> 'cancelled'`, [trip_id, req.user.user_id]
      );
      if (existing.rows[0]) throw Object.assign(new Error('You already have a booking for this trip.'), { status: 409 });

      // Reserve inventory for every hotel/restaurant/cruise item in the itinerary
      const items = await client.query('SELECT * FROM trip_itinerary WHERE trip_id = $1', [trip_id]);
      for (const item of items.rows) {
        if (item.hotel_id) {
          const h = await client.query('SELECT available_rooms FROM hotels WHERE hotel_id = $1 FOR UPDATE', [item.hotel_id]);
          if (!h.rows[0] || h.rows[0].available_rooms < 1) {
            throw Object.assign(new Error(`Hotel (id ${item.hotel_id}) has no available rooms.`), { status: 409 });
          }
          await client.query('UPDATE hotels SET available_rooms = available_rooms - 1 WHERE hotel_id = $1', [item.hotel_id]);
        } else if (item.restaurant_id) {
          const r = await client.query('SELECT available_tables FROM restaurants WHERE restaurant_id = $1 FOR UPDATE', [item.restaurant_id]);
          if (!r.rows[0] || r.rows[0].available_tables < 1) {
            throw Object.assign(new Error(`Restaurant (id ${item.restaurant_id}) has no available tables.`), { status: 409 });
          }
          await client.query('UPDATE restaurants SET available_tables = available_tables - 1 WHERE restaurant_id = $1', [item.restaurant_id]);
        } else if (item.cruise_id) {
          const c = await client.query('SELECT available_tickets FROM cruises WHERE cruise_id = $1 FOR UPDATE', [item.cruise_id]);
          if (!c.rows[0] || c.rows[0].available_tickets < number_of_travelers) {
            throw Object.assign(new Error(`Cruise (id ${item.cruise_id}) does not have enough tickets.`), { status: 409 });
          }
          await client.query('UPDATE cruises SET available_tickets = available_tickets - $1 WHERE cruise_id = $2', [number_of_travelers, item.cruise_id]);
        }
      }

      // Amount always comes from the calculated (and now frozen) trip cost - never a manual budget.
      totalAmount = parseFloat(trip.total_cost_per_person) * number_of_travelers;
    }

    const commission = Math.round(totalAmount * COMMISSION_RATE() * 100) / 100;

    const booking = await client.query(
      `INSERT INTO bookings (user_id, booking_type, package_id, trip_id, number_of_travelers, total_amount, platform_commission, booking_status, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','unpaid') RETURNING *`,
      [req.user.user_id, booking_type, package_id || null, trip_id || null, number_of_travelers, totalAmount, commission]
    );

    // Only the ORGANIZER's booking opens the trip to public listing / invites / joins.
    if (booking_type === 'custom_trip' && isOrganizerBooking) {
      await client.query(`UPDATE custom_trips SET status = 'confirmed' WHERE trip_id = $1 AND status IN ('draft', 'published')`, [trip_id]);
    }

    await client.query('COMMIT');
    res.status(201).json(booking.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// Shared SELECT that enriches a booking row with the package / custom-trip
// details it belongs to, so the frontend can show a name and details instead
// of just a bare booking record.
const BOOKING_SELECT = `
  SELECT
    b.*,
    p.title AS package_title,
    p.description AS package_description,
    p.destination_city AS package_destination_city,
    p.destination_country AS package_destination_country,
    p.duration_days AS package_duration_days,
    p.image_url AS package_image,
    tc.company_name AS package_company_name,
    t.title AS trip_title,
    t.destination_city AS trip_destination_city,
    t.destination_country AS trip_destination_country,
    t.duration_days AS trip_duration_days,
    COALESCE(p.title, t.title) AS title,
    p.image_url AS image_url,
    (tm.role = 'organizer') AS is_organizer_booking
  FROM bookings b
  LEFT JOIN packages p ON p.package_id = b.package_id
  LEFT JOIN travel_companies tc ON tc.company_id = p.company_id
  LEFT JOIN custom_trips t ON t.trip_id = b.trip_id
  LEFT JOIN trip_members tm ON tm.trip_id = b.trip_id AND tm.user_id = b.user_id
`;

// GET /api/bookings/mine
const myBookings = asyncHandler(async (req, res) => {
  const result = await db.query(
    `${BOOKING_SELECT} WHERE b.user_id = $1 ORDER BY b.booked_at DESC`,
    [req.user.user_id]
  );
  res.json(result.rows);
});

// GET /api/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const result = await db.query(`${BOOKING_SELECT} WHERE b.booking_id = $1`, [req.params.id]);
  const booking = result.rows[0];
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.user_id !== req.user.user_id && req.user.user_type !== 'admin') {
    return res.status(403).json({ error: 'Forbidden.' });
  }
  res.json(booking);
});

// POST /api/bookings/:id/cancel - full cancellation cycle: refund ledger + restore inventory
const cancelBooking = asyncHandler(async (req, res) => {
  const bookingId = req.params.id;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const bookingResult = await client.query('SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE', [bookingId]);
    const booking = bookingResult.rows[0];
    if (!booking) throw Object.assign(new Error('Booking not found.'), { status: 404 });
    if (booking.user_id !== req.user.user_id && req.user.user_type !== 'admin') {
      throw Object.assign(new Error('Forbidden.'), { status: 403 });
    }
    if (booking.booking_status === 'cancelled') {
      throw Object.assign(new Error('Booking is already cancelled.'), { status: 409 });
    }

    // The organizer cannot cancel their own trip booking (other travelers on the
    // trip, and admins, still can). This keeps a shared/public trip from being
    // pulled out from under members who already joined and booked.
    if (booking.booking_type === 'custom_trip' && booking.trip_id && req.user.user_type !== 'admin') {
      const org = await client.query(
        `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND role = 'organizer'`,
        [booking.trip_id, booking.user_id]
      );
      if (org.rows[0]) {
        throw Object.assign(
          new Error('As the organizer, you cannot cancel your own trip booking.'),
          { status: 403 }
        );
      }
    }

    // Restore inventory
    if (booking.booking_type === 'package' && booking.package_id) {
      // Package slots are derived from confirmed bookings; re-synced below once this one is cancelled.
    } else if (booking.booking_type === 'custom_trip' && booking.trip_id) {
      const items = await client.query('SELECT * FROM trip_itinerary WHERE trip_id = $1', [booking.trip_id]);
      for (const item of items.rows) {
        if (item.hotel_id) await client.query('UPDATE hotels SET available_rooms = available_rooms + 1 WHERE hotel_id = $1', [item.hotel_id]);
        else if (item.restaurant_id) await client.query('UPDATE restaurants SET available_tables = available_tables + 1 WHERE restaurant_id = $1', [item.restaurant_id]);
        else if (item.cruise_id) await client.query('UPDATE cruises SET available_tickets = available_tickets + $1 WHERE cruise_id = $2', [booking.number_of_travelers, item.cruise_id]);
      }
    }

    await client.query(`UPDATE bookings SET booking_status = 'cancelled' WHERE booking_id = $1`, [bookingId]);

    // A cancelled confirmed booking frees its package slots (trip slots are derived the same way).
    if (booking.booking_type === 'package' && booking.package_id) {
      await syncPackageSlots(client, booking.package_id);
    }

    // If the ORGANIZER cancels their own trip booking, the trip is no longer "booked":
    // it stops being public and closes to new invites/joins until they book again.
    // The saved itinerary and its calculated cost stay frozen.
    if (booking.booking_type === 'custom_trip' && booking.trip_id) {
      const org = await client.query(
        `SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND role = 'organizer'`,
        [booking.trip_id, booking.user_id]
      );
      if (org.rows[0]) {
        await client.query(
          `UPDATE custom_trips SET status = 'draft', is_public = FALSE WHERE trip_id = $1 AND status = 'confirmed'`,
          [booking.trip_id]
        );
      }
    }

    // If paid, mark the ledger as refunded
    if (booking.payment_status === 'paid') {
      await client.query(`UPDATE bookings SET payment_status = 'refunded' WHERE booking_id = $1`, [bookingId]);
      await client.query(
        `UPDATE payment_transactions SET status = 'refunded' WHERE booking_id = $1 AND status = 'success'`,
        [bookingId]
      );
    }

    await client.query('COMMIT');
    res.json({ booking_id: parseInt(bookingId, 10), booking_status: 'cancelled', payment_status: booking.payment_status === 'paid' ? 'refunded' : booking.payment_status });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { createBooking, myBookings, getBooking, cancelBooking };

// confirmed
// → booked/active
// → participants may book

// completed
// → trip has finished
// → nobody can newly book it