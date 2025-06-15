const express = require("express");
const account = require("../models/account");
const authenticateApiKey = require("../../middleware/apiKey");
const router = express.Router();

// Define the POST route for creating an account
router.post('/createAccount',account.createAccount);
router.get('/getAccounts', authenticateApiKey.authenticateApiKey, account.getAccounts);
router.get('/getAccountById/:accountId', authenticateApiKey.authenticateApiKey, account.getAccountById);
router.put('/updateAccountById/:accountId', authenticateApiKey.authenticateApiKey, account.updateAccountById);
router.post('/deleteAccountById', authenticateApiKey.authenticateApiKey, account.deleteAccountById);
module.exports = router;