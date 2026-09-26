const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const { city } = req.query;

  let cityFilter = '';
  const params = [];

  // Only attach parameter if a non-empty city search string is provided
  if (city && city.trim() !== '') {
    params.push(`%${city.trim()}%`);
    cityFilter = ` AND city ILIKE $1`;
  }

  // 1. Featured / Top-Rated Hotels
  const hotelsQuery = `
    SELECT 
      hotel_id AS id, 
      name, 
      city, 
      country, 
      price_per_night AS price, 
      star_rating, 
      rating, 
      image_url, 
      'hotel' AS place_type
    FROM hotels
    WHERE (is_approved = true OR is_approved IS NULL)${cityFilter}
    ORDER BY rating DESC NULLS LAST, star_rating DESC
    LIMIT 6;
  `;

  // 2. Recommended Restaurants
  const restaurantsQuery = `
    SELECT 
      restaurant_id AS id, 
      name, 
      city, 
      country, 
      avg_meal_cost AS price, 
      cuisine_type, 
      rating, 
      image_url, 
      'restaurant' AS place_type
    FROM restaurants
    WHERE (is_approved = true OR is_approved IS NULL)${cityFilter}
    ORDER BY rating DESC NULLS LAST
    LIMIT 6;
  `;

  // 3. Featured Packages / Cruises
  const cruisesQuery = `
    SELECT 
      cruise_id AS id, 
      ship_name AS name, 
      departure_port AS city, 
      arrival_port AS country, 
      price_per_person AS price, 
      rating, 
      image_url, 
      'cruise' AS place_type
    FROM cruises
    WHERE (is_approved = true OR is_approved IS NULL)${cityFilter}
    ORDER BY rating DESC NULLS LAST
    LIMIT 6;
  `;

  // Pass undefined if no params are present to prevent PostgreSQL bind errors
  const queryArgs = params.length > 0 ? params : undefined;

  const [hotels, restaurants, cruises] = await Promise.all([
    db.query(hotelsQuery, queryArgs),
    db.query(restaurantsQuery, queryArgs),
    db.query(cruisesQuery, queryArgs),
  ]);

  res.json({
    topHotels: hotels.rows,
    popularRestaurants: restaurants.rows,
    famousCruises: cruises.rows,
  });
});

module.exports = { getRecommendations };