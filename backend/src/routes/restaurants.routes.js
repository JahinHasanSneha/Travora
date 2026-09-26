const express = require('express');
const router = express.Router();
const restaurantsController = require('../controllers/restaurants.controller');

router.get('/', restaurantsController.getAllRestaurants);
router.get('/:id', restaurantsController.getRestaurantById);

module.exports = router;