const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const packagesController = require('../controllers/packages.controller');

router.get('/', packagesController.getAllPackages);

// Specific/static routes must be registered before the '/:id' param route below
router.get('/mine/list', requireAuth, requireRole('travel_company'), packagesController.myPackages);
router.post('/', requireAuth, requireRole('travel_company'), packagesController.createPackage);

router.get('/:id/enrollments', requireAuth, requireRole('travel_company'), packagesController.packageEnrollments);

router.get('/:id', packagesController.getPackageById);
router.patch('/:id', requireAuth, requireRole('travel_company'), packagesController.updatePackage);

module.exports = router;
