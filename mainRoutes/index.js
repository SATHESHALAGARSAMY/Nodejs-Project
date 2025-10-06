const express = require("express");
const router = express.Router();
const account = require("../modules/routes/accountroutes");
const destination = require("../modules/routes/destinationroutes");
const user = require("../modules/routes/userroutes");
const log = require("../modules/routes/logsRoutes");
const accountMember = require("../modules/routes/accountMemberRoutes");
const dataHandler = require("../modules/routes/dataHandlerRoutes");

// Define routes
router.use('/account', account);
router.use('/destination', destination);
router.use('/user', user);
router.use('/log', log);
router.use('/account-member', accountMember);
router.use('/server', dataHandler);

// Export the router
module.exports = router;
