// Slot / capacity rules (single source of truth)
//
//   * A slot is occupied ONLY by a booking whose booking_status is
//     'confirmed' (or 'completed'). Pending bookings never occupy a slot.
//   * Once confirmed travelers fill the capacity, nobody else can book
//     (checked when the booking is created AND again at payment/confirmation).
//   * Cancelling a confirmed booking frees its slots automatically.

const OCCUPYING = ['confirmed', 'completed'];

const seats = (n) => Math.max(parseInt(n, 10) || 1, 1);

// Travelers (seats) held by confirmed bookings of a package.
async function packageSeatsTaken(q, packageId) {
  const r = await q.query(
    `SELECT COALESCE(SUM(GREATEST(number_of_travelers, 1)), 0)::int AS n
       FROM bookings
      WHERE package_id = $1 AND booking_status IN ('confirmed', 'completed')`,
    [packageId]
  );
  return r.rows[0].n;
}

// Travelers (seats) held by confirmed bookings of a custom trip.
async function tripSeatsTaken(q, tripId) {
  const r = await q.query(
    `SELECT COALESCE(SUM(GREATEST(number_of_travelers, 1)), 0)::int AS n
       FROM bookings
      WHERE trip_id = $1 AND booking_status IN ('confirmed', 'completed')`,
    [tripId]
  );
  return r.rows[0].n;
}

// Re-derives packages.slots_available (and the active <-> fully_booked flag)
// from confirmed bookings. Inactive packages stay inactive.
async function syncPackageSlots(q, packageId) {
  const r = await q.query(
    `UPDATE packages p
        SET slots_available = GREATEST(COALESCE(p.max_group_size, p.slots_available + c.n) - c.n, 0),
            status = CASE
              WHEN p.status = 'inactive' THEN 'inactive'
              WHEN COALESCE(p.max_group_size, p.slots_available + c.n) - c.n <= 0 THEN 'fully_booked'
              ELSE 'active'
            END,
            updated_at = CURRENT_TIMESTAMP
       FROM (
         SELECT COALESCE(SUM(GREATEST(number_of_travelers, 1)), 0)::int AS n
           FROM bookings
          WHERE package_id = $1 AND booking_status IN ('confirmed', 'completed')
       ) c
      WHERE p.package_id = $1
      RETURNING p.*`,
    [packageId]
  );
  return r.rows[0];
}

const conflict = (message) => Object.assign(new Error(message), { status: 409 });

module.exports = { OCCUPYING, seats, packageSeatsTaken, tripSeatsTaken, syncPackageSlots, conflict };
