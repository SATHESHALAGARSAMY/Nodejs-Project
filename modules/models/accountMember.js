const { getDatabase } = require('../../db');
const dayjs = require('dayjs');

const db = getDatabase();

/**
 * Create account member
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const createAccountMember = async (req, res) => {
    try {
        const { accountId, userId, roleId } = req.body;
        const createdBy = req.user?.user_id;
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

        // Check if user already exists in account
        const checkSql = 'SELECT COUNT(*) as count FROM account_members WHERE account_id = ? AND user_id = ? AND status = "Y"';
        db.get(checkSql, [accountId, userId], (err, result) => {
            if (err) {
                return res.json({
                    code: 500,
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (result.count > 0) {
                return res.json({
                    code: 400,
                    success: false,
                    message: 'User is already a member of this account'
                });
            }

            const sql = 'INSERT INTO account_members (account_id, user_id, role_id, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?)';
            db.run(sql, [accountId, userId, roleId, timestamp, timestamp, createdBy], function(err) {
                if (err) {
                    return res.json({
                        code: 500,
                        success: false,
                        message: 'Failed to create account member',
                        error: err.message
                    });
                }

                return res.json({
                    code: 200,
                    success: true,
                    message: 'Account member created successfully',
                    memberId: this.lastID
                });
            });
        });
    } catch (error) {
        console.error('Error creating account member:', error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to create account member',
            error: error.message
        });
    }
};

/**
 * Get all account members
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getAllAccountMembers = async (req, res) => {
    try {
        const { accountId } = req.params;
        
        const sql = `
            SELECT am.*, u.email, r.role_name 
            FROM account_members am 
            INNER JOIN users u ON am.user_id = u.user_id 
            INNER JOIN roles r ON am.role_id = r.role_id 
            WHERE am.account_id = ? AND am.status = 'Y'
        `;
        
        db.all(sql, [accountId], (err, members) => {
            if (err) {
                return res.json({
                    code: 500,
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            const membersList = members.map(member => ({
                memberId: member.member_id,
                accountId: member.account_id,
                userId: member.user_id,
                email: member.email,
                roleId: member.role_id,
                roleName: member.role_name,
                createdAt: member.created_at,
                updatedAt: member.updated_at
            }));

            return res.json({
                code: 200,
                success: true,
                message: 'Account members fetched successfully',
                data: membersList
            });
        });
    } catch (error) {
        console.error('Error fetching account members:', error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to fetch account members',
            error: error.message
        });
    }
};

/**
 * Get account member by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getAccountMemberById = async (req, res) => {
    try {
        const { memberId } = req.params;
        
        const sql = `
            SELECT am.*, u.email, r.role_name 
            FROM account_members am 
            INNER JOIN users u ON am.user_id = u.user_id 
            INNER JOIN roles r ON am.role_id = r.role_id 
            WHERE am.member_id = ? AND am.status = 'Y'
        `;
        
        db.get(sql, [memberId], (err, member) => {
            if (err) {
                return res.json({
                    code: 500,
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (!member) {
                return res.json({
                    code: 404,
                    success: false,
                    message: 'Account member not found'
                });
            }

            return res.json({
                code: 200,
                success: true,
                message: 'Account member fetched successfully',
                data: {
                    memberId: member.member_id,
                    accountId: member.account_id,
                    userId: member.user_id,
                    email: member.email,
                    roleId: member.role_id,
                    roleName: member.role_name,
                    createdAt: member.created_at,
                    updatedAt: member.updated_at
                }
            });
        });
    } catch (error) {
        console.error('Error fetching account member:', error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to fetch account member',
            error: error.message
        });
    }
};

/**
 * Update account member
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const updateAccountMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { roleId } = req.body;
        const updatedBy = req.user?.user_id;
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

        const sql = 'UPDATE account_members SET role_id = ?, updated_at = ?, updated_by = ? WHERE member_id = ? AND status = "Y"';
        db.run(sql, [roleId, timestamp, updatedBy, memberId], function(err) {
            if (err) {
                return res.json({
                    code: 500,
                    success: false,
                    message: 'Failed to update account member',
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.json({
                    code: 404,
                    success: false,
                    message: 'Account member not found'
                });
            }

            // Clear cache
            // deleteCachedByPattern(`account_members:*`);

            return res.json({
                code: 200,
                success: true,
                message: 'Account member updated successfully'
            });
        });
    } catch (error) {
        console.error('Error updating account member:', error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to update account member',
            error: error.message
        });
    }
};

/**
 * Delete account member
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const deleteAccountMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const updatedBy = req.user?.user_id;
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

        const sql = 'UPDATE account_members SET status = "D", updated_at = ?, updated_by = ? WHERE member_id = ?';
        db.run(sql, [timestamp, updatedBy, memberId], function(err) {
            if (err) {
                return res.json({
                    code: 500,
                    success: false,
                    message: 'Failed to delete account member',
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.json({
                    code: 404,
                    success: false,
                    message: 'Account member not found'
                });
            }

            // Clear cache
            // deleteCachedByPattern(`account_members:*`);

            return res.json({
                code: 200,
                success: true,
                message: 'Account member deleted successfully'
            });
        });
    } catch (error) {
        console.error('Error deleting account member:', error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to delete account member',
            error: error.message
        });
    }
};

module.exports = {
    createAccountMember,
    getAllAccountMembers,
    getAccountMemberById,
    updateAccountMember,
    deleteAccountMember
};

