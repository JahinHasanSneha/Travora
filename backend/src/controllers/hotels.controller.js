const db = require('../config/db');

/* =========================================================
   GET ALL HOTELS
   Supports search, price/rating/star filters, amenities,
   geo-radius, and sorting.
   Only approved hotels are returned.
========================================================= */
exports.getAllHotels = async (req, res, next) => {
  try {
    const {
      search,
      destination,
      city,
      minPrice,
      maxPrice,
      minRating,
      starRating,
      amenities,
      sort,
      lat,
      lng,
      radiusKm,
    } = req.query;
//dynamically construct the 
// WHERE clause depending on what filters the user sends.
    // Only approved hotels are public
    const where = ['is_approved = TRUE'];
    const params = [];

    const searchTerm = (search || destination || city || '').trim();
    if (searchTerm) {
      params.push(`%${searchTerm}%`);
      const idx = params.length;
      where.push(
        `(name ILIKE $${idx} OR city ILIKE $${idx} OR country ILIKE $${idx} OR address ILIKE $${idx})`
      );
    }

    if (minPrice) {
      params.push(Number(minPrice));
      where.push(`price_per_night >= $${params.length}`);
    }
    if (maxPrice) {
      params.push(Number(maxPrice));
      where.push(`price_per_night <= $${params.length}`);
    }
    if (minRating) {
      params.push(Number(minRating));
      where.push(`rating >= $${params.length}`);
    }
    if (starRating) {
      params.push(Number(starRating));
      where.push(`star_rating = $${params.length}`);
    }
    if (amenities) {
      const list = amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      if (list.length > 0) {
        params.push(list);
        where.push(`amenities @> $${params.length}::text[]`);
      }
    }

    // Optional geo radius filter (haversine, in km)
    let havingRadius = '';
    if (lat && lng && radiusKm) {
      params.push(Number(lat));
      const latIdx = params.length;
      params.push(Number(lng));
      const lngIdx = params.length;
      params.push(Number(radiusKm));
      const radiusIdx = params.length;
      havingRadius = `
        AND (
          6371 * acos(  //prithibi 
            LEAST(1, GREATEST(-1,
              cos(radians($${latIdx})) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($${lngIdx})) +
              sin(radians($${latIdx})) * sin(radians(latitude))
            ))
          )
        ) <= $${radiusIdx}
      `;
    }

    let orderBy = 'ORDER BY rating DESC NULLS LAST, star_rating DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY price_per_night ASC NULLS LAST';
    else if (sort === 'price_desc') orderBy = 'ORDER BY price_per_night DESC NULLS LAST';
    else if (sort === 'rating_desc') orderBy = 'ORDER BY rating DESC NULLS LAST';

    const query = `
      SELECT * FROM hotels
      WHERE ${where.join(' AND ')}
      ${havingRadius}
      ${orderBy}
    `;

    const result = await db.query(query, params);
    res.json(result.rows || result);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SINGLE HOTEL BY ID
   Only returns the hotel if it's approved.
   Returns 404 for both "not found" and "not approved" so we
   don't leak the existence of pending listings.
========================================================= */
exports.getHotelById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT h.*,
              (SELECT COUNT(*) FROM reviews rv WHERE rv.hotel_id = h.hotel_id)::int AS review_count
       FROM hotels h
       WHERE h.hotel_id = $1 AND h.is_approved = TRUE`,
      [id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};