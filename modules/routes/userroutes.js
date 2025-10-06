const express = require("express");
const user = require("../models/user");
const { authenticate, authorize } = require("../../middleware/auth");
const { userValidation } = require("../../middleware/validators");
const router = express.Router();

// Signup - Register new user (default as Admin per requirements)
router.post('/signup', userValidation.register, user.signup);

// Login
router.post('/login', userValidation.login, user.login);

// Logout
router.post('/logout', authenticate, user.logout);

// Invite user - Admin only
router.post('/invite', authenticate, authorize('Admin'), userValidation.invite, user.inviteUser);

module.exports = router;
