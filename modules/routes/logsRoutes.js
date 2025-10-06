const express = require("express");
const log = require("../models/log");
const { authenticate } = require("../../middleware/auth");
const { logValidation } = require("../../middleware/validators");
const router = express.Router();

// Get logs with filtering - Requires authentication
router.get('/', authenticate, logValidation.filter, log.getLogs);

// Get log by event ID - Requires authentication
router.get('/event/:eventId', authenticate, log.getLogByEventId);

// Get log statistics - Requires authentication
router.get('/stats', authenticate, log.getLogStats);

module.exports = router;
