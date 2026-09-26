const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { createBooking, myBookings, getBooking, cancelBooking } = require('../controllers/bookings.controller');
const { checkout, myTransactions } = require('../controllers/payments.controller');

router.use(requireAuth);

// Specific/static routes must be registered before the '/:id' param route below
router.post('/', createBooking);
router.get('/mine', myBookings);
router.post('/checkout', checkout);
router.get('/transactions/mine', myTransactions);
router.get('/:id', getBooking);
router.post('/:id/cancel', cancelBooking);

module.exports = router;



// GET	Retrieve data	
// POST	Create data
// PUT	Replace/update data