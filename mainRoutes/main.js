// main.js
const express = require("express");
const router = express.Router();
const account = require("../modules/routes/accountroutes");
const destination = require("../modules/routes/destinationroutes");
const user = require("../modules/routes/userroutes");
const log = require("../modules/routes/logsRoutes");
// Define the POST route for creating an account
router.use('/account', account);
router.use('/destination', destination);
router.use('/user', user);
router.use('/log', log);
// Export the router
module.exports = router;