const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const { generateApiKey } = require("../../middleware/apiKey");
const { v4: uuidv4 } = require('uuid');

const db = getDatabase();

/**
 * Create a new account
 * @param {Object} req - Email, account_name, website
 * @param {Object} res - Account will be created successfully
 */
const createAccount = async (req, res) => {
    try {
        const { email, accountName, website } = req.body;
        const createdBy = req.user?.user_id;
        
        if (!email || !accountName) {
            return res.status(400).json({
                success: false,
                message: 'Email and account name are required'
            });
        }

        // Check if the email already exists
        const checkEmailSql = 'SELECT COUNT(*) as count FROM accounts WHERE email = ?';
        db.get(checkEmailSql, [email], (err, emailCheckResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (emailCheckResult.count > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            // Generate unique account_id and app_secret_token
            const accountId = uuidv4();
            const appSecretToken = generateApiKey();
            const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

            // Create a new account
            const sql = 'INSERT INTO accounts (account_id, email, account_name, app_secret_token, website, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            db.run(sql, [accountId, email, accountName, appSecretToken, website, timestamp, timestamp, createdBy], function(err) {
                if (err) {
                    console.error('Error creating account:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create account'
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Account created successfully',
                    data: {
                        accountId,
                        email,
                        accountName,
                        appSecretToken,
                        website
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error creating account:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create account'
        });
    }
};

/**
 * Get all accounts with search and filter
 * @param {Object} req - Query parameters
 * @param {Object} res - Accounts will be fetched successfully
 * @returns {Object} - Accounts Details
 */
const getAllAccounts = async (req, res) => {
    try {
        const { search, startDate, endDate, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = ['status = "Y"'];
        let params = [];

        if (search) {
            whereClauses.push('(account_name LIKE ? OR email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (startDate && endDate) {
            whereClauses.push('DATE(created_at) BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }

        const whereClause = whereClauses.join(' AND ');

        // Get total count
        const countSql = `SELECT COUNT(*) as count FROM accounts WHERE ${whereClause}`;
        db.get(countSql, params, (err, countResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            const totalCount = countResult.count;

            // Get paginated results
            const sql = `SELECT account_id, email, account_name, app_secret_token, website, created_at, updated_at 
                         FROM accounts 
                         WHERE ${whereClause} 
                         ORDER BY created_at DESC 
                         LIMIT ? OFFSET ?`;
            
            db.all(sql, [...params, parseInt(limit), parseInt(offset)], async (err, accounts) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }

                const accountData = accounts.map(data => ({
                    accountId: data.account_id,
                    email: data.email,
                    accountName: data.account_name,
                    appSecretToken: data.app_secret_token,
                    website: data.website,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                }));

                const response = {
                    data: accountData,
                    pagination: {
                        total: totalCount,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalCount / limit)
                    }
                };

                return res.json({
                    success: true,
                    message: 'Accounts fetched successfully',
                    ...response
                });
            });
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch accounts'
        });
    }
};

/**
 * Get account by id
 * @param {Object} req - account_id
 * @param {Object} res - Account will be fetched successfully
 */
const getAccountById = async (req, res) => {
    try {
        const { accountId } = req.params;

        const sql = 'SELECT account_id, email, account_name, app_secret_token, website, created_at, updated_at FROM accounts WHERE account_id = ? AND status = "Y"';
        db.get(sql, [accountId], async (err, account) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!account) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            const accountData = {
                accountId: account.account_id,
                email: account.email,
                accountName: account.account_name,
                appSecretToken: account.app_secret_token,
                website: account.website,
                createdAt: account.created_at,
                updatedAt: account.updated_at
            };

            return res.json({
                success: true,
                message: 'Account fetched successfully',
                data: accountData
            });
        });
    } catch (error) {
        console.error('Error fetching account:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch account'
        });
    }
};

/**
 * Update account by id
 * @param {Object} req - account_id, email, account_name, website
 * @param {Object} res - Account will be updated successfully
 */
const updateAccountById = async (req, res) => {
    try {
        const { accountId } = req.params;
        const updatedBy = req.user?.user_id;
        
        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }

        // Prepare the fields to update
        const fields = [];
        const values = [];

        const fieldMap = {
            email: 'email',
            account_name: 'accountName',
            website: 'website'
        };

        for (const [field, prop] of Object.entries(fieldMap)) {
            if (req.body[prop]) {
                fields.push(`${field} = ?`);
                values.push(req.body[prop]);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add updated_at and updated_by fields
        fields.push('updated_at = ?');
        fields.push('updated_by = ?');
        values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
        values.push(updatedBy);

        // Add accountId to the values array for the WHERE clause
        values.push(accountId);

        const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE account_id = ? AND status = "Y"`;
        db.run(sql, values, async function(err) {
            if (err) {
                console.error('Error updating account:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update account'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Account not found'
                });
            }

            return res.json({
                success: true,
                message: 'Account updated successfully'
            });
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update account'
        });
    }
};

/**
 * Delete account by id (soft delete with cascade)
 * @param {Object} req - account_id
 * @param {Object} res - Account will be deleted successfully
 */
const deleteAccountById = async (req, res) => {
    try {
        const { accountId } = req.params;
        const updatedBy = req.user?.user_id;
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            // Soft delete account
            db.run('UPDATE accounts SET status = "D", updated_at = ?, updated_by = ? WHERE account_id = ?', 
                [timestamp, updatedBy, accountId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    console.error('Error deleting account:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete account'
                    });
                }

                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    return res.status(404).json({
                        success: false,
                        message: 'Account not found'
                    });
                }

                // Soft delete associated destinations
                db.run('UPDATE destinations SET status = "D", updated_at = ?, updated_by = ? WHERE account_id = ?', 
                    [timestamp, updatedBy, accountId]);

                // Soft delete associated account members
                db.run('UPDATE account_members SET status = "D", updated_at = ?, updated_by = ? WHERE account_id = ?', 
                    [timestamp, updatedBy, accountId]);

                db.run('COMMIT', async (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        console.error('Error committing transaction:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to delete account'
                        });
                    }

                    return res.json({
                        success: true,
                        message: 'Account and associated data deleted successfully'
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    }
};

module.exports = {
    createAccount,
    getAllAccounts,
    getAccountById,
    updateAccountById,
    deleteAccountById
};
