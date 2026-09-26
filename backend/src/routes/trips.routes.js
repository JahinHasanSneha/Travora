const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { myTrips, listPublicTrips, getTrip, createTrip, saveItinerary, updateTrip, deleteTrip } = require('../controllers/trips.controller');
const { addItem, removeItem } = require('../controllers/tripItinerary.controller');
const { createInvite, joinByToken, joinTrip, removeMember, costSplit } = require('../controllers/tripMembers.controller');
const { generateItinerary } = require('../controllers/itineraryGenerator.controller');

// All trip routes require auth (custom trips are always tied to a logged-in traveler)
router.use(requireAuth);

router.get('/mine', myTrips);
router.get('/public', listPublicTrips); // Discover public trips open to join (static route: must precede '/:id')
router.post('/', createTrip);
router.post('/generate', generateItinerary); // "Smart" DB-driven itinerary generator (AI alternative)
router.get('/:id', getTrip);
router.patch('/:id', updateTrip);
router.post('/:id/save-itinerary', saveItinerary); // organizer freezes itinerary + calculated cost
router.delete('/:id', deleteTrip);

// Itinerary items
router.post('/:id/itinerary', addItem);
router.delete('/:id/itinerary/:itemId', removeItem);

// Group travel
router.post('/:id/invite', createInvite);
router.post('/join-by-token/:token', joinByToken);
router.post('/:tripId/join', joinTrip);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/cost-split', costSplit);

module.exports = router;
