const express = require("express");
const user = require("../models/user");
const userList = require("../models/userList");
const router = express.Router();

router.post('/createUser', user.createUser);
router.post('/createAdmin', user.createAdmin);
router.post('/login', user.login);
router.get('/userList', userList.getUserList);
module.exports = router;