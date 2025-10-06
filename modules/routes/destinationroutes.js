const express = require("express");
const destination = require("../models/destination");
const { authenticate, authorize } = require("../../middleware/auth");
const { destinationValidation } = require("../../middleware/validators");
const router = express.Router();

// Create destination - Admin only
router.post('/create', authenticate, authorize('Admin'), destinationValidation.create, destination.createDestination);

// Get destinations by account ID - Requires authentication
router.get('/account/:accountId', authenticate, destinationValidation.getByAccountId, destination.getDestinationsByAccountId);

// Get destination by ID - Requires authentication
router.get('/:destinationId', authenticate, destinationValidation.getById, destination.getDestinationById);

// Update destination - Admin can update any, Normal user can update only their account's destinations
router.put('/:destinationId', authenticate, destinationValidation.update, destination.updateDestinationById);

// Delete destination - Admin only
router.delete('/:destinationId', authenticate, authorize('Admin'), destinationValidation.getById, destination.deleteDestinationById);

module.exports = router;
