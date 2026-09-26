const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  geocode,
  nearby,
  photo,        // <-- add
  listPlaces,
  createPlace,
} = require('../controllers/places.controller');

router.get('/geocode', geocode);
router.get('/nearby', nearby);
router.get('/photo', photo);           // <-- add (public, no auth)
router.get('/', listPlaces);
router.post('/', requireAuth, requireRole('admin'), createPlace);

module.exports = router;