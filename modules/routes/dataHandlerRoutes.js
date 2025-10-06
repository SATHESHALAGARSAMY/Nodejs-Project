const express = require("express");
const dataHandler = require("../models/dataHandler");
const { dataHandlerRateLimiter } = require("../../middleware/rateLimiter");
const { dataHandlerValidation } = require("../../middleware/validators");
const router = express.Router();

// Incoming data endpoint - Requires CL-X-TOKEN and CL-X-EVENT-ID headers
// Rate limited to 5 requests/second per account
router.post('/incoming_data', dataHandlerValidation.incoming, dataHandlerRateLimiter, dataHandler.handleIncomingData);

module.exports = router;

