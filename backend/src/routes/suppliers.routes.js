const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { listSuppliers, mySupplier, updateMySupplier } = require('../controllers/suppliers.controller');

router.get('/', listSuppliers);
router.get('/me', requireAuth, requireRole('supplier'), mySupplier);
router.patch('/me', requireAuth, requireRole('supplier'), updateMySupplier);

module.exports = router;
