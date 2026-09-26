const router = require('express').Router();
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { listReviews, createReview } = require('../controllers/reviews.controller');

// optionalAuth: public listings are readable by anyone; trip reviews check membership for private trips
router.get('/', optionalAuth, listReviews);
router.post('/', requireAuth, requireRole('traveler'), createReview);

module.exports = router;
