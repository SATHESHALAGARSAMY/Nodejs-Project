const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const auth = require('../../middleware/apiKey');
const { v4: uuidv4 } = require('uuid');
const db = getDatabase();
const logger = require("../../middleware/logger");

// Common function to create user with specified role
const createUserWithRole = async (email, password, accountId, roleId, userType) => {
    if (!email || !password || !accountId) {
        throw new Error('Missing required fields');
    }
    logger.logWithLabel("createUserWithRole", { email, password, accountId, roleId, userType });
    // Check if email already exists
    const checkEmailSql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
    const emailCheckResult = await db.get(checkEmailSql, [email]);
    if (emailCheckResult.count > 0) {
        throw new Error('Email already exists');
    }
    const encryptedPassword = auth.encryptData(password);
    // const userId = uuidv4();
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    
    // Insert user
    const userSql = 'INSERT INTO users (account_id, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)';
    const userResult = await db.run(userSql, [accountId, email, encryptedPassword, timestamp, timestamp]);
    
    // Insert account member
    const accountMemberSql = 'INSERT INTO account_members (member_id, account_id, user_id, role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)';
    const accountMemberResult = await db.run(accountMemberSql, [uuidv4(), accountId, userResult.lastID, roleId, timestamp, timestamp]);
    
    return {
        code: 200,
        success: true,
        message: `${userType} created successfully`,
        result: userResult,
        accountMemberResult
    };
};
/**
 * Create user
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createUser = async (req, res) => {
    try {
        logger.logWithLabel("createUser", req.body);
        const { email, password, accountId } = req.body;
        const response = await createUserWithRole(email, password, accountId, 2, 'User');
        return res.json(response);
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};
/**
 * Create admin user
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const createAdmin = async (req, res) => {
    try {
        logger.logWithLabel("createAdmin", req.body);
        const { email, password, accountId } = req.body;
        const response = await createUserWithRole(email, password, accountId, 1, 'Admin');
        return res.json(response);
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to create admin',
            error: error.message
        });
    }
};
/**
 * Login
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const login = async (req, res) => {
    try {
        logger.logWithLabel("login", req.body);
        const { email, password } = req.body;
        
        // Get user with role information
        const sql = `
            SELECT u.*, r.role_name 
            FROM users u 
            JOIN account_members am ON u.user_id = am.user_id 
            JOIN roles r ON am.role_id = r.role_id 
            WHERE u.email = ? AND u.status = 'Y'
        `;
        const user = await db.get(sql, [email]);
        
        if (!user) {
            throw new Error('Invalid email');
        }
        const decryptedPassword = auth.decryptData(user.password);
        if (password !== decryptedPassword) {
            throw new Error('Invalid password');
        } 
        if(user.status !== 'Y') {
            throw new Error('Account is not active');
        }
        let userData = {
            user_id: user.user_id,
            email: user.email,
            account_id: user.account_id,
            role_id: user.role_id,
            user_type: user.user_type,
            account_name: user.account_name
        }
        let token = auth.tokenEncrypt(userData);
        return res.json({
            code: 200,
            success: true,
            message: 'Login successful',
            "CL-X-EVENT-ID": token
        });
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
}
module.exports = {
    createUser,
    createAdmin,
    login
}