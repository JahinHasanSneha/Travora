const express = require('express');
const router = express.Router();
const cruisesController = require('../controllers/cruises.controller');

router.get('/', cruisesController.getAllCruises);
router.get('/:id', cruisesController.getCruiseById);

module.exports = router;