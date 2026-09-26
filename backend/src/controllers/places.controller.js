
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { boundingBox, haversineKm } = require('../utils/geo');

/**
 * GET /api/places/geocode?q=Tokyo
 * Uses OpenStreetMap Nominatim API (100% Free, no API key needed).
 * Turns city/place queries into lat/lng coordinates.
 */
const geocode = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" (min 2 chars) is required.' });
  }

  // 1. Fetch Geocode location from free OpenStreetMap Nominatim API
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
  
  const response = await fetch(nominatimUrl, {
    headers: {
      'User-Agent': 'TripCloneApp/1.0 (university-project)',
    },
  });

  if (!response.ok) {
    return res.status(502).json({ error: 'Geocoding service unavailable.' });
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Location not found.' });
  }

  // Format Nominatim search results
  const results = data.map((r) => {
    const city = r.address?.city || r.address?.town || r.address?.village || r.address?.state || q;
    const country = r.address?.country || 'Unknown';

    return {
      display_name: r.display_name,
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      city,
      country,
    };
  });

  res.json(results);
});

/**
 * GET /api/places/nearby?lat=..&lng=..&radius_km=10&type=hotel,restaurant,attraction
 * LOCAL SQL query against local PostgreSQL database. Powers map markers.
 */
const nearby = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radius_km) || 15;
  const types = req.query.type ? req.query.type.split(',') : null;

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng are required numeric query params.' });
  }

  const { minLat, maxLat, minLng, maxLng } = boundingBox(lat, lng, radiusKm);

  const results = { hotels: [], restaurants: [], cruises: [], attractions: [] };

  if (!types || types.includes('hotel')) {
    const r = await db.query(
      `SELECT hotel_id AS id, name, address, city, country, latitude, longitude, star_rating,
              price_per_night, available_rooms, rating, 'hotel' AS place_type
       FROM hotels
       WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4`,
      [minLat, maxLat, minLng, maxLng]
    );
    results.hotels = r.rows;
  }
  if (!types || types.includes('restaurant')) {
    const r = await db.query(
      `SELECT restaurant_id AS id, name, cuisine_type, address, city, country, latitude, longitude,
              avg_meal_cost, rating, has_vegetarian, has_halal, 'restaurant' AS place_type
       FROM restaurants
       WHERE latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4`,
      [minLat, maxLat, minLng, maxLng]
    );
    results.restaurants = r.rows;
  }
  if (!types || types.includes('cruise')) {
    const r = await db.query(
      `SELECT cr.cruise_id AS id, cr.ship_name AS name, cr.departure_port, cr.arrival_port,
              cp.latitude, cp.longitude, cr.price_per_person, cr.rating, 'cruise' AS place_type
       FROM cruises cr
       JOIN cached_places cp ON cp.place_id = cr.place_id
       WHERE cp.latitude BETWEEN $1 AND $2 AND cp.longitude BETWEEN $3 AND $4`,
      [minLat, maxLat, minLng, maxLng]
    );
    results.cruises = r.rows;
  }
  if (!types || types.includes('attraction')) {
    const r = await db.query(
      `SELECT place_id AS id, name, address, city, country, latitude, longitude, rating,
              price_level, place_type
       FROM cached_places
       WHERE place_type = 'attraction' AND latitude BETWEEN $1 AND $2 AND longitude BETWEEN $3 AND $4`,
      [minLat, maxLat, minLng, maxLng]
    );
    results.attractions = r.rows;
  }

  // Distance sort + trim bounding box to true circle radius
  for (const key of Object.keys(results)) {
    results[key] = results[key]
      .map((row) => ({ ...row, distance_km: haversineKm(lat, lng, row.latitude, row.longitude) }))
      .filter((row) => row.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  res.json({ center: { lat, lng }, radius_km: radiusKm, results });
});

/**
 * GET /api/places/photo?q=Paris
 * Looks up the main Wikipedia thumbnail for a place/city name.
 * No API key required. Returns { image: string|null }.
 *
 * Uses Wikipedia's "pageimages" prop, which returns the lead image
 * for a page. Fails soft: on any error or missing page we return
 * { image: null } so the frontend can render a placeholder.
 */
const photo = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ image: null });

  const wikiUrl =
    'https://en.wikipedia.org/w/api.php' +
    '?action=query' +
    '&prop=pageimages' +
    '&format=json' +
    '&origin=*' +
    '&pithumbsize=600' +
    '&redirects=1' +
    `&titles=${encodeURIComponent(q)}`;

  try {
    const response = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'TripCloneApp/1.0 (university-project)',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return res.json({ image: null });
    }

    const data = await response.json();
    const pages = data?.query?.pages || {};
    const page = Object.values(pages)[0];

    // page.missing is present when the title doesn't exist on Wikipedia
    if (!page || page.missing) {
      return res.json({ image: null });
    }

    return res.json({ image: page?.thumbnail?.source || null });
  } catch (error) {
    console.error('Photo lookup failed:', error?.message || error);
    return res.json({ image: null });
  }
});

/**
 * GET /api/places (browse cached places, filter by city)
 */
const listPlaces = asyncHandler(async (req, res) => {
  const { city, place_type } = req.query;
  const params = [];
  let sql = 'SELECT * FROM cached_places WHERE 1=1';
  if (city) {
    params.push(`%${city}%`);
    sql += ` AND city ILIKE $${params.length}`;
  }
  if (place_type) {
    params.push(place_type);
    sql += ` AND place_type = $${params.length}`;
  }
  sql += ' ORDER BY rating DESC NULLS LAST LIMIT 100';
  const result = await db.query(sql, params);
  res.json(result.rows);
});

/**
 * POST /api/places (admin manual insertion)
 */
const createPlace = asyncHandler(async (req, res) => {
  const { name, address, city, country, latitude, longitude, rating, price_level, place_type, phone_number, website } = req.body;
  if (!name || !city || !country || latitude === undefined || longitude === undefined || !place_type) {
    return res.status(400).json({ error: 'name, city, country, latitude, longitude, place_type are required.' });
  }
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO cached_places (name, address, city, country, latitude, longitude, rating, price_level, place_type, phone_number, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, address, city, country, latitude, longitude, rating, price_level, place_type, phone_number, website]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { geocode, nearby, photo, listPlaces, createPlace };