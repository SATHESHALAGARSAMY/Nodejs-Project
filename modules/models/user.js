const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const { encryptData, decryptData } = require('../../middleware/apiKey');
const { generateToken } = require('../../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = getDatabase();

// Common function to create user with specified role
const createUserWithRole = async (email, password, accountId, roleId, userType, createdBy = null) => {
    return new Promise((resolve, reject) => {
        if (!email || !password) {
            reject(new Error('Email and password are required'));
            return;
        }
        
        // Check if email already exists
        const checkEmailSql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        db.get(checkEmailSql, [email], (err, emailCheckResult) => {
            if (err) {
                reject(err);
                return;
            }
            if (emailCheckResult.count > 0) {
                reject(new Error('Email already exists'));
                return;
            }
            
            const encryptedPassword = encryptData(password);
            const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
            
            // Insert user
            const userSql = 'INSERT INTO users (email, password, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?)';
            db.run(userSql, [email, encryptedPassword, timestamp, timestamp, createdBy], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                const userId = this.lastID;
                
                // If accountId is provided, insert account member
                if (accountId) {
                    const accountMemberSql = 'INSERT INTO account_members (account_id, user_id, role_id, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?)';
                    db.run(accountMemberSql, [accountId, userId, roleId, timestamp, timestamp, createdBy], function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        resolve({
                            code: 200,
                            success: true,
                            message: `${userType} created successfully`,
                            userId: userId,
                            memberId: this.lastID
                        });
                    });
                } else {
                    // For signup, create account first with default role
                    resolve({
                        code: 200,
                        success: true,
                        message: `${userType} created successfully`,
                        userId: userId
                    });
                }
            });
        });
    });
};
/**
 * Signup - Register new user (default as Admin)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const signup = async (req, res) => {
    try {
        const { email, password } = req.body;
        // New signups are Admin by default as per requirements
        const response = await createUserWithRole(email, password, null, 1, 'User');
        
        // Generate token
        const token = generateToken({
            user_id: response.userId,
            email: email,
            role_id: 1,
            role_name: 'Admin'
        });
        
        return res.json({
            ...response,
            token
        });
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Signup failed',
            error: error.message
        });
    }
};

/**
 * Invite user to account (Admin only)
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const inviteUser = async (req, res) => {
    try {
        const { email, password, accountId, roleId } = req.body;
        const createdBy = req.user?.user_id;
        
        const roleName = roleId === 1 ? 'Admin' : 'Normal user';
        const response = await createUserWithRole(email, password, accountId, roleId, roleName, createdBy);
        return res.json(response);
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to invite user',
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
        const { email, password } = req.body;
        
        // Get user with role information
        const sql = `
            SELECT u.*, r.role_name, am.role_id, am.account_id
            FROM users u 
            LEFT JOIN account_members am ON u.user_id = am.user_id 
            LEFT JOIN roles r ON am.role_id = r.role_id 
            WHERE u.email = ? AND u.status = 'Y'
        `;
        
        db.get(sql, [email], (err, user) => {
            if (err) {
                return res.json({
                    code: 500,
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }
            
            if (!user) {
                return res.json({
                    code: 401,
                    success: false,
                    message: 'Invalid email or password'
                });
            }
            
            const decryptedPassword = decryptData(user.password);
            if (password !== decryptedPassword) {
                return res.json({
                    code: 401,
                    success: false,
                    message: 'Invalid email or password'
                });
            } 
            
            if(user.status !== 'Y') {
                return res.json({
                    code: 403,
                    success: false,
                    message: 'Account is not active'
                });
            }
            
            const userData = {
                user_id: user.user_id,
                email: user.email,
                account_id: user.account_id,
                role_id: user.role_id,
                role_name: user.role_name
            };
            
            const token = generateToken(userData);
            
            return res.json({
                code: 200,
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    role: user.role_name
                }
            });
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
};

/**
 * Logout
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const logout = async (req, res) => {
    try {
        // In a stateless JWT system, logout is handled client-side by removing the token
        // Optionally, implement token blacklisting here if needed
        return res.json({
            code: 200,
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};
module.exports = {
    signup,
    inviteUser,
    login,
    logout
}
