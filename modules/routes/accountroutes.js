const express = require("express");
const account = require("../models/account");
const { authenticate, authorize } = require("../../middleware/auth");
const { accountValidation } = require("../../middleware/validators");
const router = express.Router();

// Create account - Admin only
router.post('/create', authenticate, authorize('Admin'), accountValidation.create, account.createAccount);

// Get all accounts with search/filter - Requires authentication
router.get('/', authenticate, account.getAllAccounts);

// Get account by ID - Requires authentication
router.get('/:accountId', authenticate, accountValidation.getById, account.getAccountById);

// Update account - Admin can update any, Normal user can update only their account
router.put('/:accountId', authenticate, accountValidation.update, account.updateAccountById);

// Delete account - Admin only
router.delete('/:accountId', authenticate, authorize('Admin'), accountValidation.getById, account.deleteAccountById);

module.exports = router;
