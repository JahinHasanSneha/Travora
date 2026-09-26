const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/dashboard
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const statsResult = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM suppliers) AS suppliers,
      (SELECT COUNT(*) FROM suppliers WHERE is_approved = TRUE) AS active_suppliers,
      (SELECT COUNT(*) FROM suppliers WHERE is_approved = FALSE OR is_approved IS NULL) AS pending_suppliers,
      (SELECT COUNT(*) FROM travel_companies) AS companies,
      (SELECT COUNT(*) FROM travel_companies WHERE is_approved = TRUE) AS active_companies,
      (SELECT COUNT(*) FROM travel_companies WHERE is_approved = FALSE OR is_approved IS NULL) AS pending_companies,
      (SELECT COUNT(*) FROM packages) AS packages,
      (SELECT COUNT(*) FROM packages WHERE status = 'active') AS active_packages,
      (SELECT COUNT(*) FROM bookings) AS bookings,
      (SELECT COUNT(*) FROM hotels) AS hotels,
      (SELECT COUNT(*) FROM hotels WHERE is_approved = TRUE) AS approved_hotels,
      (SELECT COUNT(*) FROM hotels WHERE is_approved = FALSE OR is_approved IS NULL) AS pending_hotels,
      (SELECT COUNT(*) FROM restaurants) AS restaurants,
      (SELECT COUNT(*) FROM restaurants WHERE is_approved = TRUE) AS approved_restaurants,
      (SELECT COUNT(*) FROM restaurants WHERE is_approved = FALSE OR is_approved IS NULL) AS pending_restaurants,
      (SELECT COUNT(*) FROM cruises) AS cruises,
      (SELECT COUNT(*) FROM cruises WHERE is_approved = TRUE) AS approved_cruises,
      (SELECT COUNT(*) FROM cruises WHERE is_approved = FALSE OR is_approved IS NULL) AS pending_cruises
  `);

  const supplierRequests = await db.query(`
    SELECT u.user_id, u.email, u.full_name, u.user_type, u.created_at,
           s.supplier_id, s.supplier_name, s.business_type,
           s.is_approved AS supplier_approved
    FROM users u
    INNER JOIN suppliers s ON s.user_id = u.user_id
    WHERE s.is_approved = FALSE OR s.is_approved IS NULL
    ORDER BY u.created_at DESC
    LIMIT 10
  `);

  const companyRequests = await db.query(`
    SELECT u.user_id, u.email, u.full_name, u.user_type, u.created_at,
           tc.company_id, tc.company_name, tc.company_address,
           tc.website, tc.rating, tc.is_approved AS company_approved
    FROM users u
    INNER JOIN travel_companies tc ON tc.user_id = u.user_id
    WHERE tc.is_approved = FALSE OR tc.is_approved IS NULL
    ORDER BY u.created_at DESC
    LIMIT 10
  `);

  const hotels = await db.query(`
    SELECT hotel_id AS id, name, address, city, country, latitude, longitude,
           star_rating, price_per_night AS price, description, image_url,
           supplier_id, 'hotel' AS type
    FROM hotels
    WHERE is_approved = FALSE OR is_approved IS NULL
    ORDER BY hotel_id DESC
    LIMIT 10
  `);

  const restaurants = await db.query(`
    SELECT restaurant_id AS id, name, cuisine_type, address, city, country,
           latitude, longitude, avg_meal_cost AS price, has_vegetarian,
           has_halal, image_url, supplier_id, 'restaurant' AS type
    FROM restaurants
    WHERE is_approved = FALSE OR is_approved IS NULL
    ORDER BY restaurant_id DESC
    LIMIT 10
  `);

  const cruises = await db.query(`
    SELECT cruise_id AS id, company_name, ship_name AS name,
           departure_port AS city, arrival_port AS country,
           price_per_person AS price, image_url, available_tickets,
           supplier_id, 'cruise' AS type
    FROM cruises
    WHERE is_approved = FALSE OR is_approved IS NULL
    ORDER BY cruise_id DESC
    LIMIT 10
  `);

  const recentUsers = await db.query(`
    SELECT user_id, full_name, email, user_type, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 10
  `);

  const recentSuppliers = await db.query(`
    SELECT s.supplier_id, s.supplier_name, s.business_type,
           s.is_approved, s.user_id, u.email, u.created_at
    FROM suppliers s
    LEFT JOIN users u ON u.user_id = s.user_id
    ORDER BY u.created_at DESC
    LIMIT 10
  `);

  const recentCompanies = await db.query(`
    SELECT tc.company_id, tc.company_name, tc.is_approved,
           tc.user_id, u.email, u.created_at
    FROM travel_companies tc
    LEFT JOIN users u ON u.user_id = tc.user_id
    ORDER BY u.created_at DESC
    LIMIT 10
  `);

  res.json({
    stats: statsResult.rows[0],
    supplier_requests: supplierRequests.rows,
    company_requests: companyRequests.rows,
    pending_listings: {
      hotels: hotels.rows,
      restaurants: restaurants.rows,
      cruises: cruises.rows
    },
    recent_users: recentUsers.rows,
    recent_suppliers: recentSuppliers.rows,
    recent_companies: recentCompanies.rows
  });
});


// GET /api/admin/pending-suppliers
const getPendingSuppliers = asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT u.user_id, u.email, u.full_name, u.user_type, u.created_at,
           s.supplier_id, s.supplier_name, s.business_type,
           s.is_approved AS supplier_approved,
           tc.company_id, tc.company_name,
           tc.is_approved AS company_approved
    FROM users u
    LEFT JOIN suppliers s ON s.user_id = u.user_id
    LEFT JOIN travel_companies tc ON tc.user_id = u.user_id
    WHERE
      (s.supplier_id IS NOT NULL AND
       (s.is_approved = FALSE OR s.is_approved IS NULL))
      OR
      (tc.company_id IS NOT NULL AND
       (tc.is_approved = FALSE OR tc.is_approved IS NULL))
    ORDER BY u.created_at DESC
  `);

  res.json(result.rows);
});


// PUT /api/admin/approve-supplier/:id
const approveSupplier = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE suppliers
      SET is_approved = TRUE
      WHERE supplier_id = $1
      RETURNING supplier_id, user_id, supplier_name, business_type, is_approved
    `, [id]);
    await client.query('COMMIT');

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    res.json({
      message: 'Supplier approved successfully!',
      supplier: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});


// PUT /api/admin/approve-company/:id
const approveCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE travel_companies
      SET is_approved = TRUE
      WHERE company_id = $1
      RETURNING company_id, user_id, company_name, is_approved
    `, [id]);
    await client.query('COMMIT');

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Travel company not found.' });
    }

    res.json({
      message: 'Travel company approved successfully!',
      company: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});


// GET /api/admin/pending-listings
const getPendingListings = asyncHandler(async (req, res) => {
  const hotels = await db.query(`
    SELECT hotel_id AS id, name, address, city, country, latitude, longitude,
           star_rating, price_per_night AS price, description, image_url,
           supplier_id, 'hotel' AS type
    FROM hotels
    WHERE is_approved = FALSE OR is_approved IS NULL
  `);

  const restaurants = await db.query(`
    SELECT restaurant_id AS id, name, cuisine_type, address, city, country,
           latitude, longitude, avg_meal_cost AS price, has_vegetarian,
           has_halal, image_url, supplier_id, 'restaurant' AS type
    FROM restaurants
    WHERE is_approved = FALSE OR is_approved IS NULL
  `);

  const cruises = await db.query(`
    SELECT cruise_id AS id, company_name, ship_name AS name,
           departure_port AS city, arrival_port AS country,
           price_per_person AS price, image_url, available_tickets,
           supplier_id, 'cruise' AS type
    FROM cruises
    WHERE is_approved = FALSE OR is_approved IS NULL
  `);

  res.json({
    hotels: hotels.rows,
    restaurants: restaurants.rows,
    cruises: cruises.rows
  });
});


// PUT /api/admin/approve-listing
const approveListing = asyncHandler(async (req, res) => {
  const { type, id } = req.body;

  if (!type || !id) {
    return res.status(400).json({
      error: 'Both type and id are required.'
    });
  }

  let table, idCol;

  if (type === 'hotel') {
    table = 'hotels';
    idCol = 'hotel_id';
  } else if (type === 'restaurant') {
    table = 'restaurants';
    idCol = 'restaurant_id';
  } else if (type === 'cruise') {
    table = 'cruises';
    idCol = 'cruise_id';
  } else {
    return res.status(400).json({
      error: 'Invalid listing type.'
    });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE ${table}
      SET is_approved = TRUE
      WHERE ${idCol} = $1
      RETURNING *
    `, [id]);
    await client.query('COMMIT');

    if (!result.rows.length) {
      return res.status(404).json({
        error: `${type} not found.`
      });
    }

    res.json({
      message: `${type} approved successfully!`,
      listing: result.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});


// POST /api/admin/submit-listing
const submitListing = asyncHandler(async (req, res) => {
  const { type, ...data } = req.body;

  const supplierResult = await db.query(`
    SELECT supplier_id, supplier_name, business_type
    FROM suppliers
    WHERE user_id = $1
  `, [req.user.user_id]);

  const supplier = supplierResult.rows[0];

  if (!supplier) {
    return res.status(403).json({
      error: 'Only registered suppliers can submit listings.'
    });
  }

  const supplierId = supplier.supplier_id;
  const price = parseFloat(data.price_per_night);

  // HOTEL / RESTAURANT need a valid pinned location before we touch the DB
  if (type === 'hotel' || type === 'restaurant') {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        error: 'Please pick a location from the search suggestions (latitude/longitude required).'
      });
    }
  }

  if (!['hotel', 'restaurant', 'cruise'].includes(type)) {
    return res.status(400).json({
      error: 'Invalid submission type. Use hotel, restaurant, or cruise.'
    });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    let result;
    let message;

    if (type === 'hotel') {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      result = await client.query(`
        INSERT INTO hotels (
          name, address, city, country, latitude, longitude,
          star_rating, price_per_night, description, image_url,
          supplier_id, total_rooms, available_rooms, is_approved
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,20,20,FALSE)
        RETURNING *
      `, [
        data.name,
        data.address,
        data.city,
        data.country,
        lat,
        lng,
        parseInt(data.star_rating, 10) || 4,
        price || 100,
        data.description || '',
        data.image_url || null,
        supplierId
      ]);
      message = 'Hotel submitted for approval!';
    } else if (type === 'restaurant') {
      const lat = parseFloat(data.latitude);
      const lng = parseFloat(data.longitude);

      result = await client.query(`
        INSERT INTO restaurants (
          name, cuisine_type, address, city, country, latitude, longitude,
          avg_meal_cost, has_vegetarian, has_halal, image_url, supplier_id,
          total_tables, available_tables, is_approved
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,15,15,FALSE)
        RETURNING *
      `, [
        data.name,
        data.cuisine_type || 'General',
        data.address,
        data.city,
        data.country,
        lat,
        lng,
        price || 25,
        !!data.has_vegetarian,
        !!data.has_halal,
        data.image_url || null,
        supplierId
      ]);
      message = 'Restaurant submitted for approval!';
    } else {
      // CRUISE
      result = await client.query(`
        INSERT INTO cruises (
          supplier_id, company_name, ship_name, departure_port,
          arrival_port, price_per_person, image_url,
          available_tickets, is_approved
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,100,FALSE)
        RETURNING *
      `, [
        supplierId,
        supplier.supplier_name,
        data.name,
        data.city,
        data.country,
        price || 200,
        data.image_url || null
      ]);
      message = 'Cruise submitted for approval!';
    }

    await client.query('COMMIT');
    res.status(201).json({ message, listing: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});


module.exports = {
  getDashboardAnalytics,
  getPendingSuppliers,
  approveSupplier,
  approveCompany,
  getPendingListings,
  approveListing,
  submitListing
};