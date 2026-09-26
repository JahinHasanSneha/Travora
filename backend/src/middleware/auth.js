const db = require('../config/db');
const { verifyToken } = require('../utils/jwt');

// Extract Bearer token from Authorization header
function getToken(req) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice(7).trim();
}


// Requires a valid JWT
async function requireAuth(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Missing bearer token.',
    });
  }

  try {
    // First verify JWT signature and expiration
    const decoded = verifyToken(token);

    // Check whether token has been revoked by logout
    const revoked = await db.query(
      `SELECT id
       FROM revoked_tokens
       WHERE token = $1
       LIMIT 1`,
      [token]
    );

    if (revoked.rows.length > 0) {
      return res.status(401).json({
        error: 'Token has been revoked. Please log in again.',
      });
    }

    /*
     * Store both decoded JWT information and the
     * original token in req.
     */
    req.user = decoded;
    req.token = token;

    next();

  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token.',
    });
  }
}


// Optional authentication
async function optionalAuth(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);

    const revoked = await db.query(
      `SELECT id
       FROM revoked_tokens
       WHERE token = $1
       LIMIT 1`,
      [token]
    );

    if (revoked.rows.length === 0) {
      req.user = decoded;
      req.token = token;
    }

  } catch (err) {
    // Ignore invalid token for optional authentication
  }

  next();
}


module.exports = {
  requireAuth,
  optionalAuth,
};
// ┌─────────────────────────────────────────────────────────────┐
// │                    CLIENT SENDS REQUEST                     │
// │         Authorization: Bearer eyJhbGciOiJIUzI1...           │
// └──────────────────────────┬──────────────────────────────────┘
//                            │
//                            ▼
//               ┌────────────────────────┐
//               │   Route middleware     │
//               │   (requireAuth /       │
//               │    optionalAuth)       │
//               └────────────┬───────────┘
//                            │
//                            ▼
//               ┌────────────────────────┐
//               │  getToken(req)         │
//               │  Read Authorization    │
//               │  header                │
//               └────────────┬───────────┘
//                            │
//                            ▼
//                  ┌───────────────────┐
//                  │ Starts with       │
//                  │ "Bearer " ?       │
//                  └─────┬────────┬────┘
//                        │        │
//                     NO │        │ YES
//                        │        │
//                        ▼        ▼
//         ┌──────────────────┐  ┌────────────────────────┐
//         │  token = null    │  │  token = slice(7)      │
//         │                  │  │          .trim()       │
//         └────────┬─────────┘  └───────────┬────────────┘
//                  │                        │
//                  ▼                        ▼
//       ┌──────────────────┐    ┌────────────────────────┐
//       │ Which middleware?│    │  verifyToken(token)    │
//       └───┬──────────┬───┘    │  ─ Check signature     │
//           │          │        │  ─ Check exp           │
//      requireAuth  optionalAuth└───────────┬───────────┘
//           │          │                     │
//           ▼          ▼                     ▼
//    ┌──────────┐  ┌─────────┐      ┌───────────────────┐
//    │  401     │  │ next()  │      │ Valid signature   │
//    │ Missing  │  │ as      │      │ and not expired?  │
//    │ bearer   │  │ anon    │      └────┬─────────┬────┘
//    └──────────┘  └─────────┘           │         │
//                                     NO │         │ YES
//                                        │         │
//                                        ▼         ▼
//                               ┌──────────────┐  ┌─────────────────────────┐
//                               │  throw err   │  │  Query revoked_tokens   │
//                               └──────┬───────┘  │  WHERE token = $1       │
//                                      │          │  LIMIT 1                │
//                                      │          └────────────┬────────────┘
//                                      │                       │
//                                      │                       ▼
//                                      │          ┌────────────────────────┐
//                                      │          │  Row found?            │
//                                      │          │  (token revoked?)      │
//                                      │          └────┬──────────────┬────┘
//                                      │               │              │
//                                      │            YES│              │NO
//                                      │               │              │
//                                      │               ▼              ▼
//                                      │    ┌──────────────┐  ┌─────────────────┐
//                                      │    │ requireAuth? │  │ Attach:         │
//                                      │    └───┬──────┬───┘  │ req.user        │
//                                      │        │      │      │ req.token       │
//                                      │  require│  opt │      └────────┬────────┘
//                                      │  Auth   │ Auth │               │
//                                      │        ▼      ▼               │
//                                      │  ┌─────────┐ ┌──────────┐      │
//                                      │  │  401    │ │ next()   │      │
//                                      │  │ Revoked │ │ as anon  │      │
//                                      │  └─────────┘ └──────────┘      │
//                                      │                               │
//                                      ▼                               ▼
//                           ┌────────────────────┐         ┌────────────────────┐
//                           │  requireAuth: 401  │         │  next()            │
//                           │  Invalid/expired   │         │  → route handler   │
//                           │  optionalAuth:     │         │    can read        │
//                           │  next() as anon    │         │    req.user        │
//                           └────────────────────┘         └────────────────────┘