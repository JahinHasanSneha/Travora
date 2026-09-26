const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { packageSeatsTaken, tripSeatsTaken, syncPackageSlots, conflict } = require('../utils/capacity');
const { luhnCheck, validateExpiry, validateCVV, simulateGatewayOutcome, generateTransactionReference } = require('../utils/ledger');

// POST /api/payments/checkout - Ledger-Based Checkout Simulator
// Verifies a 16-digit card string (Luhn), expiry format, CVV -- entirely simulated, never a real gateway.
const checkout = asyncHandler(async (req, res) => {
  const { booking_id, card_number, expiry, cvv } = req.body;
  if (!booking_id || !card_number || !expiry || !cvv) {
    return res.status(400).json({ error: 'booking_id, card_number, expiry, cvv are required.' });
  }

  // Frontend-style validation performed again server-side (defense in depth)
  if (!luhnCheck(card_number)) {
    return res.status(400).json({ error: 'Invalid card number (failed Luhn / digit-count check).' });
  }
  if (!validateExpiry(expiry)) {
    return res.status(400).json({ error: 'Invalid or expired card expiry (expected MM/YY).' });
  }
  if (!validateCVV(cvv)) {
    return res.status(400).json({ error: 'Invalid CVV.' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const bookingResult = await client.query('SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE', [booking_id]);
    const booking = bookingResult.rows[0];
    if (!booking) throw Object.assign(new Error('Booking not found.'), { status: 404 });
    if (booking.user_id !== req.user.user_id) throw Object.assign(new Error('Forbidden.'), { status: 403 });
    if (booking.payment_status === 'paid') throw Object.assign(new Error('Booking is already paid.'), { status: 409 });
    if (booking.booking_status === 'cancelled') throw conflict('This booking was cancelled and can no longer be paid.');
//FOR UPDATE (inside the string)	Tells the DB to lock the row	Postgres
    // A slot is only occupied once the booking is CONFIRMED (paid). Re-check capacity under a
    // row lock so two travelers can never confirm into the last slot at the same time.
    const wantSeats = Math.max(parseInt(booking.number_of_travelers, 10) || 1, 1);
    if (booking.booking_type === 'package' && booking.package_id) {
      const pkg = (await client.query('SELECT max_group_size, slots_available, status FROM packages WHERE package_id = $1 FOR UPDATE', [booking.package_id])).rows[0];
      if (!pkg) throw Object.assign(new Error('Package not found.'), { status: 404 });
      const capacity = Number(pkg.max_group_size ?? pkg.slots_available);
      const left = capacity - (await packageSeatsTaken(client, booking.package_id));
      if (left < wantSeats) throw conflict(left <= 0 ? 'This package is fully booked, so this booking cannot be confirmed.' : `Only ${left} slot(s) are left, fewer than this booking needs.`);
    } else if (booking.booking_type === 'custom_trip' && booking.trip_id) {
      const trip = (await client.query('SELECT max_travelers FROM custom_trips WHERE trip_id = $1 FOR UPDATE', [booking.trip_id])).rows[0];
      if (!trip) throw Object.assign(new Error('Trip not found.'), { status: 404 });
      const left = Number(trip.max_travelers || 1) - (await tripSeatsTaken(client, booking.trip_id));
      if (left < wantSeats) throw conflict(left <= 0 ? 'This trip is full, so this booking cannot be confirmed.' : `Only ${left} slot(s) are left, fewer than this booking needs.`);
    }

    // Deterministic 90% success / 10% simulated bank failure
    const outcome = simulateGatewayOutcome();
    const digits = card_number.replace(/\D/g, '');
    const reference = generateTransactionReference();

    let txn;

    if (outcome.status === 'success') {
      // Multi-table workflow (ledger insert + booking update + commission split)
      // handled in one atomic step by the process_successful_payment procedure.
      await client.query(
        'CALL process_successful_payment($1,$2,$3,$4,$5,$6)',
        [
          booking_id,
          req.user.user_id,
          booking.total_amount,
          digits.slice(-4),
          reference,
          parseFloat(process.env.DEFAULT_COMMISSION_RATE || '10.00'),
        ]
      );
      const txnResult = await client.query(
        'SELECT * FROM payment_transactions WHERE transaction_reference = $1',
        [reference]
      );
      txn = txnResult;

      // The booking is now confirmed: it occupies its package slots.
      if (booking.booking_type === 'package' && booking.package_id) {
        await syncPackageSlots(client, booking.package_id);
      }
    } else {
      txn = await client.query(
        `INSERT INTO payment_transactions (booking_id, user_id, amount, currency, payment_method, card_last4, transaction_reference, status, error_message)
         VALUES ($1,$2,$3,'USD','dummy_card',$4,$5,$6,$7) RETURNING *`,
        [booking_id, req.user.user_id, booking.total_amount, digits.slice(-4), reference, outcome.status, outcome.error_message]
      );
    }

    await client.query('COMMIT');
    const statusCode = outcome.status === 'success' ? 200 : 402;
    res.status(statusCode).json({ transaction: txn.rows[0], booking_status: outcome.status === 'success' ? 'confirmed' : 'pending' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /api/payments/mine - the user's transaction ledger history
const myTransactions = asyncHandler(async (req, res) => {
  const result = await db.query('SELECT * FROM payment_transactions WHERE user_id = $1 ORDER BY created_at DESC', [req.user.user_id]);
  res.json(result.rows);
});

module.exports = { checkout, myTransactions };
