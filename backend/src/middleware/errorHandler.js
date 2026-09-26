// Central error handler: normalizes DB / validation / unexpected errors into JSON responses
function errorHandler(err, req, res, next) {
  console.error(err);

  // PostgreSQL unique violation HTTP 409 Conflict
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry.', detail: err.detail });
  }
  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Invalid reference.', detail: err.detail });
  }
  // PostgreSQL check constraint violation 400 Bad Request
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Constraint violation.', detail: err.detail });
  }

  // Business-rule violations raised by the DB guard triggers (RAISE EXCEPTION)
  if (err.code === 'P0001') {
    return res.status(409).json({ error: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
}

module.exports = errorHandler;
// //Database error
// Validation error
// Unexpected error
//    ↓
// JSON error response