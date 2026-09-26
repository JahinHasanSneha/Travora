const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
  getDashboardAnalytics,
  getPendingSuppliers,
  approveSupplier,
  approveCompany,
  getPendingListings,
  approveListing,
  submitListing,
} = require('../controllers/admin.controller');

// Dashboard analytics (admin only)
router.get('/dashboard', requireAuth, requireRole('admin'), getDashboardAnalytics);

// Supplier / Company Account Management (admin only)
router.get('/pending-suppliers', requireAuth, requireRole('admin'), getPendingSuppliers);
router.put('/approve-supplier/:id', requireAuth, requireRole('admin'), approveSupplier);
router.put('/approve-company/:id', requireAuth, requireRole('admin'), approveCompany);
//GET Admin gets pending:
// Supplier Listing Management (Hotels, Restaurants, Cruises) (admin only)
router.get('/pending-listings', requireAuth, requireRole('admin'), getPendingListings);
router.put('/approve-listing', requireAuth, requireRole('admin'), approveListing);

// Supplier submits a new listing for review (supplier only)
router.post('/submit-listing', requireAuth, requireRole('supplier'), submitListing);

module.exports = router;
