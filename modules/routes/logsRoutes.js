const express = require("express");
const log = require("../models/log");
const authenticateApiKey = require("../../middleware/apiKey");
const router = express.Router();

router.post('/incoming_data', authenticateApiKey.authenticateApiKey, log.createLog);
router.get('/getLogs', authenticateApiKey.authenticateApiKey, log.getLogs);

module.exports = router;