const bcrypt = require('bcrypt');
const db = require('../config/db');
const { signToken } = require('../utils/jwt');
const asyncHandler = require('../utils/asyncHandler');

const SALT_ROUNDS = parseInt(
  process.env.BCRYPT_SALT_ROUNDS || '10',
  10
);


// ============================================================
// POST /api/auth/register
// ============================================================

const register = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    full_name,
    phone,
    user_type,
  } = req.body;


  // ----------------------------------------------------------
  // Basic validation
  // ----------------------------------------------------------

  if (!email || !password || !full_name || !user_type) {
    return res.status(400).json({
      error:
        'email, password, full_name, and user_type are required.',
    });
  }


  // ----------------------------------------------------------
  // Validate email format
  // ----------------------------------------------------------

  const normalizedEmail = email.toLowerCase().trim();

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      error: 'Please provide a valid email address.',
    });
  }


  // ----------------------------------------------------------
  // Validate user role
  // ----------------------------------------------------------
  /*
   * IMPORTANT:
   * Admin should NOT normally be publicly registered.
   *
   * Admin accounts should be created separately by the
   * system/database.
   */

  const allowedRoles = [
    'traveler',
    'travel_company',
    'supplier',
  ];

  if (!allowedRoles.includes(user_type)) {
    return res.status(400).json({
      error: 'Invalid user_type.',
    });
  }


  // ----------------------------------------------------------
  // Password validation
  // ----------------------------------------------------------

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters.',
    });
  }


  // ----------------------------------------------------------
  // Full name validation
  // ----------------------------------------------------------

  if (typeof full_name !== 'string' || !full_name.trim()) {
    return res.status(400).json({
      error: 'Full name cannot be empty.',
    });
  }


  // ----------------------------------------------------------
  // Check duplicate email
  // ----------------------------------------------------------

  const existingUser = await db.query(
    `SELECT user_id
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      error: 'An account with this email already exists.',
    });
  }


  // ----------------------------------------------------------
  // Supplier-specific validation
  // ----------------------------------------------------------

  let businessType = null;

  if (user_type === 'supplier') {

    businessType = req.body.business_type;

    const allowedBusinessTypes = [
      'hotel',
      'restaurant',
      'cruise',
      'activity',
    ];

    if (!allowedBusinessTypes.includes(businessType)) {
      return res.status(400).json({
        error:
          'Supplier registration requires a valid business_type.',
      });
    }
  }


  // ----------------------------------------------------------
  // Hash password
  // ----------------------------------------------------------

  const passwordHash = await bcrypt.hash(
    password,
    SALT_ROUNDS
  );


  // ----------------------------------------------------------
  // Database transaction
  // ----------------------------------------------------------

  const client = await db.getClient();

  try {

    await client.query('BEGIN');


    // --------------------------------------------------------
    // Create user
    // --------------------------------------------------------

    const userResult = await client.query(
      `INSERT INTO users
       (
         email,
         password_hash,
         full_name,
         phone,
         user_type,
         is_verified
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         user_id,
         email,
         full_name,
         phone,
         user_type,
         is_verified,
         profile_picture,
         created_at`,
      [
        normalizedEmail,
        passwordHash,
        full_name.trim(),
        phone ? phone.trim() : null,
        user_type,

        // Travelers are immediately verified.
        // Supplier/company accounts require approval.
        user_type === 'traveler',
      ]
    );


    const user = userResult.rows[0];


    // --------------------------------------------------------
    // Travel company profile
    // --------------------------------------------------------

    if (user_type === 'travel_company') {

      const companyName =
        req.body.company_name?.trim() ||
        full_name.trim();

      await client.query(
        `INSERT INTO travel_companies
         (
           user_id,
           company_name,
           is_approved
         )
         VALUES ($1, $2, FALSE)`,
        [
          user.user_id,
          companyName,
        ]
      );
    }


    // --------------------------------------------------------
    // Supplier profile
    // --------------------------------------------------------

    if (user_type === 'supplier') {

      const supplierName =
        req.body.supplier_name?.trim() ||
        full_name.trim();

      await client.query(
        `INSERT INTO suppliers
         (
           user_id,
           supplier_name,
           business_type,
           is_approved
         )
         VALUES ($1, $2, $3, FALSE)`,
        [
          user.user_id,
          supplierName,
          businessType,
        ]
      );
    }


    // --------------------------------------------------------
    // Commit transaction
    // --------------------------------------------------------

    await client.query('COMMIT');


    // --------------------------------------------------------
    // Generate JWT
    // --------------------------------------------------------

    const token = signToken({
      user_id: user.user_id,
      email: user.email,
      user_type: user.user_type,
    });


    // --------------------------------------------------------
    // Return user + token
    // --------------------------------------------------------

    res.status(201).json({
      message: 'Registration successful.',
      user,
      token,
    });


  } catch (err) {

    await client.query('ROLLBACK');

    throw err;

  } finally {

    client.release();
  }
});


// ============================================================
// POST /api/auth/login
// ============================================================

const login = asyncHandler(async (req, res) => {

  const {
    email,
    password,
  } = req.body;


  // ----------------------------------------------------------
  // Validate input
  // ----------------------------------------------------------

  if (!email || !password) {
    return res.status(400).json({
      error: 'email and password are required.',
    });
  }


  const normalizedEmail =
    email.toLowerCase().trim();


  // ----------------------------------------------------------
  // Find user
  // ----------------------------------------------------------

  const result = await db.query(
    `SELECT
       user_id,
       email,
       password_hash,
       full_name,
       phone,
       user_type,
       is_verified,
       profile_picture,
       created_at
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );


  const user = result.rows[0];


  if (!user) {
    return res.status(401).json({
      error: 'Invalid email or password.',
    });
  }


  // ----------------------------------------------------------
  // Compare password
  // ----------------------------------------------------------

  const passwordMatches =
    await bcrypt.compare(
      password,
      user.password_hash
    );


  if (!passwordMatches) {
    return res.status(401).json({
      error: 'Invalid email or password.',
    });
  }


  // -------------------------------
  // ---------------------------
  // Check approval for supplier/company
  // ----------------------------------------------------------

  if (user.user_type === 'supplier') {

    const supplierResult = await db.query(
      `SELECT is_approved
       FROM suppliers
       WHERE user_id = $1`,
      [user.user_id]
    );

    if (
      supplierResult.rows.length === 0
    ) {
      return res.status(403).json({
        error: 'Supplier profile not found.',
      });
    }

    if (!supplierResult.rows[0].is_approved) {
      return res.status(403).json({
        error:
          'Your supplier account is awaiting admin approval.',
      });
    }
  }


  if (user.user_type === 'travel_company') {

    const companyResult = await db.query(
      `SELECT is_approved
       FROM travel_companies
       WHERE user_id = $1`,
      [user.user_id]
    );

    if (
      companyResult.rows.length === 0
    ) {
      return res.status(403).json({
        error: 'Travel company profile not found.',
      });
    }

    if (!companyResult.rows[0].is_approved) {
      return res.status(403).json({
        error:
          'Your travel company account is awaiting admin approval.',
      });
    }
  }


  // ----------------------------------------------------------
  // Generate JWT
  // ----------------------------------------------------------

  /*
   * IMPORTANT:
   *
   * user_type comes from the DATABASE record.
   *
   * We are NOT trusting a user_type sent during login.
   */

  const token = signToken({
    user_id: user.user_id,
    email: user.email,
    user_type: user.user_type,
  });


  // ----------------------------------------------------------
  // Remove password hash from response
  // ----------------------------------------------------------

  delete user.password_hash;


  // ----------------------------------------------------------
  // Return authenticated user
  // ----------------------------------------------------------

  res.json({
    message: 'Login successful.',
    user,
    token,
  });
});


// ============================================================
// POST /api/auth/logout
// ============================================================

const logout = asyncHandler(async (req, res) => {

  /*
   * requireAuth middleware has already:
   *
   * 1. Verified the JWT
   * 2. Checked that it isn't revoked
   * 3. Stored it in req.token
   */

  if (!req.token) {
    return res.status(401).json({
      error: 'Authentication required.',
    });
  }


  // ----------------------------------------------------------
  // Decode token to get expiration time
  // ----------------------------------------------------------

  const { verifyToken } = require('../utils/jwt');

  let decoded;

  try {
    decoded = verifyToken(req.token);
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token.',
    });
  }


  const expiresAt =
    new Date(decoded.exp * 1000);


  // ----------------------------------------------------------
  // Store token in blacklist
  // ----------------------------------------------------------

  await db.query(
    `INSERT INTO revoked_tokens
     (
       token,
       expires_at
     )
     VALUES ($1, $2)
     ON CONFLICT (token) DO NOTHING`,
    [
      req.token,
      expiresAt,
    ]
  );


  // ----------------------------------------------------------
  // Successful logout
  // ----------------------------------------------------------

  res.json({
    message: 'Logout successful.',
  });
});


// ============================================================
// GET /api/auth/me
// ============================================================

const me = asyncHandler(async (req, res) => {

  /*
   * requireAuth guarantees that:
   *
   * req.user.user_id exists
   * token is valid
   * token has not been revoked
   */

  const result = await db.query(
    `SELECT
       user_id,
       email,
       full_name,
       phone,
       user_type,
       is_verified,
       profile_picture,
       created_at
     FROM users
     WHERE user_id = $1`,
    [req.user.user_id]
  );


  if (!result.rows[0]) {
    return res.status(404).json({
      error: 'User not found.',
    });
  }


  res.json(result.rows[0]);
});


module.exports = {
  register,
  login,
  logout,
  me,
};