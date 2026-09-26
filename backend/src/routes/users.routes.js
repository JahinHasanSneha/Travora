const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getUser, updateUser } = require('../controllers/users.controller');

router.get('/:id', requireAuth, getUser);
router.patch('/:id', requireAuth, updateUser);

module.exports = router;
