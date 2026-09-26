const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendations.controller');

router.get('/', getRecommendations);

module.exports = router;