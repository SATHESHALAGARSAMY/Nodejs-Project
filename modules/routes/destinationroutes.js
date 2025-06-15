const express = require("express");
const destination = require("../models/destination");
const authenticateApiKey = require("../../middleware/apiKey");
const router = express.Router();

router.post('/createDestination', authenticateApiKey.authenticateApiKey, destination.createDestination);
router.get('/getAllDestinations/:accountId', authenticateApiKey.authenticateApiKey, destination.getAllDestinations);
router.get('/getDestinationById/:destinationId', authenticateApiKey.authenticateApiKey, destination.getDestinationById);
router.put('/updateDestinationById/:destinationId', authenticateApiKey.authenticateApiKey, destination.updateDestinationById);
router.post('/deleteDestinationById', authenticateApiKey.authenticateApiKey, destination.deleteDestinationById);
router.post('/deleteAllDestinationsByAccountId', authenticateApiKey.authenticateApiKey, destination.deleteAllDestinationsByAccountId);

module.exports = router;