const express = require("express");
const accountMember = require("../models/accountMember");
const { authenticate, authorize } = require("../../middleware/auth");
const { accountMemberValidation } = require("../../middleware/validators");
const router = express.Router();

// Create account member - Admin only
router.post('/create', authenticate, authorize('Admin'), accountMemberValidation.create, accountMember.createAccountMember);

// Get all account members by account ID - Requires authentication
router.get('/account/:accountId', authenticate, accountMember.getAllAccountMembers);

// Get account member by ID - Requires authentication
router.get('/:memberId', authenticate, accountMember.getAccountMemberById);

// Update account member (change role) - Admin only
router.put('/:memberId', authenticate, authorize('Admin'), accountMemberValidation.update, accountMember.updateAccountMember);

// Delete account member - Admin only
router.delete('/:memberId', authenticate, authorize('Admin'), accountMember.deleteAccountMember);

module.exports = router;

