const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { listCompanies, myCompany, updateMyCompany } = require('../controllers/companies.controller');

router.get('/', listCompanies);
router.get('/me', requireAuth, requireRole('travel_company'), myCompany);
router.patch('/me', requireAuth, requireRole('travel_company'), updateMyCompany);

module.exports = router;
