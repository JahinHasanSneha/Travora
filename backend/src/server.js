const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');//Morgan is an HTTP request logger.
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/users.routes');
const companyRoutes = require('./routes/companies.routes');
const supplierRoutes = require('./routes/suppliers.routes');
const placeRoutes = require('./routes/places.routes');
const recommendationRoutes = require('./routes/recommendations.routes');
const hotelRoutes = require('./routes/hotels.routes');
const restaurantRoutes = require('./routes/restaurants.routes');
const packageRoutes = require('./routes/packages.routes');
const cruiseRoutes = require('./routes/cruises.routes');
const tripRoutes = require('./routes/trips.routes');
const bookingRoutes = require('./routes/bookings.routes');
const reviewRoutes = require('./routes/reviews.routes');
const adminRoutes = require('./routes/admin.routes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '6mb' })); // package photos are uploaded as compressed data URLs

// Healthcheck route
app.get('/', (req, res) => {
  res.send('API Server is running...');
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/cruises', cruiseRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Central error handler (must be registered last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
