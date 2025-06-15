const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const apiKey = require("../../middleware/apiKey");
const { createLog } = require('./log');
const logger = require("../../middleware/logger");

const db = getDatabase();

/**
 * Create a new account
 * @param {Object} req - Email, account_id, account_name, website, app_secret_token
 * @param {Object} res - Account will be created successfully
 */
const createAccount = async (req, res) => {
    try {
        logger.logWithLabel("createAccount", req.body);
        const { accountId, email, accountName, website } = req.body;
        if (!accountId || !email || !accountName || !website || !appSecretToken) {
            throw new Error('Missing required fields');
        }
        // Check if the email already exists
        const checkEmailSql = 'SELECT COUNT(*) as count FROM accounts WHERE email = ?';
        const emailCheckResult = await db.get(checkEmailSql, [email]);
        if (emailCheckResult.count > 0) {
            throw new Error('Email already exists');
        }
        //generate app_secret_token
        let appSecretToken = apiKey.generateApiKey();
        //Insert logs
        const log = await createLog({
            accountId: accountId,
            destinationId: 1,
            receivedTimestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            receivedData: JSON.stringify({ accountId: accountId, email: email, accountName: accountName, website: website, appSecretToken: appSecretToken }),
            status: 'success'
        });
        if(log.status === 'error'){
            throw new Error('Failed to create log');
        }
        // Create a new account
        const sql = 'INSERT INTO accounts ( account_id, email, account_name, website, app_secret_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const result = await db.run(sql, [accountId, email, accountName, website, appSecretToken, new Date(), new Date()]);
        
        return res.json({
            code: 200,
            success: true,
            message: 'Account created successfully',
            result
        })
    } catch (error) {
        console.error('Error creating account:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to create account'
        })
    }
}

/**
 * Get accounts by date
 * @param {Object} req - date
 * @param {Object} res - Accounts will be fetched successfully
 * @returns {Object} - Accounts Details
 */
const getAccounts = async (req, res) => {
    try {
        logger.logWithLabel("getAccounts", req.params);
        const { date } = req.params;
        const sql = 'SELECT * FROM accounts WHERE created_at = ? AND status = "Y"';
        const result = await db.all(sql, [dayjs(date).format('YYYY-MM-DD')]);
        if (!result) {
            throw new Error('No accounts found');
        }
        let accountData = [];
        for(const data of result){
            accountData.push({
                accountId: data.account_id,
                email: data.email,
                accountName: data.account_name,
                website: data.website,
                appSecretToken: data.app_secret_token,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            });
        }   
        logger.logWithLabel("getAccounts", accountData);
        return res.json({
            code: 200,
            success: true,
            message: 'Accounts fetched successfully',
            data: accountData
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to fetch accounts'
        });
    }
}

/**
 * Get account by id
 * @param {Object} req - account_id
 * @param {Object} res - Account will be fetched successfully
 */
const getAccountById = async (req, res) => {
    try {
        logger.logWithLabel("getAccountById", req.params);
        const { accountId } = req.params;
        const sql = 'SELECT * FROM accounts WHERE account_id = ? AND status = "Y"';
        const result = await db.get(sql, [accountId]);
        if (!result) {
            throw new Error('Account not found');
        }
        let accountData = [];
        for(const data of result){
            accountData.push({
                accountId: data.account_id,
                email: data.email,
                accountName: data.account_name,
                website: data.website,
                appSecretToken: data.app_secret_token,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            });
        }
        logger.logWithLabel("getAccountById", accountData);
        return res.json({
            code: 200,
            success: true,
            message: 'Account fetched successfully',
            data: accountData
        })
    } catch (error) {
        console.error('Error fetching account:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to fetch account'
        })
    }
}

/**
 * Update account by id
 * @param {Object} req - account_id, email, account_name, website, app_secret_token
 * @param {Object} res - Account will be updated successfully
 */

const updateAccountById = async (req, res) => {
    try {
        logger.logWithLabel("updateAccountById", req.params);
        const { accountId } = req.params;
        if (!accountId) {
            throw new Error('Account ID is required');
        }

        // Prepare the fields to update
        const fields = [];
        const values = [];

        // Map of field names to request body properties
        const fieldMap = {
            email: 'email',
            account_name: 'accountName',
            website: 'website',
            app_secret_token: 'appSecretToken'
        };

        // Iterate over the field map to populate fields and values
        for (const [field, prop] of Object.entries(fieldMap)) {
            if (req.body[prop]) {
                fields.push(`${field} = ?`);
                values.push(req.body[prop]);
            }
        }

        if (fields.length === 0) {
            throw new Error('No fields to update');
        }

        // Add updated_at field
        fields.push('updated_at = ?');
        values.push(new Date());

        // Add accountId to the values array for the WHERE clause
        values.push(accountId);

        const log = await createLog({
            accountId: accountId,
            destinationId: 1,
            receivedTimestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            receivedData: JSON.stringify(req.body),
            status: 'success'
        });
        if(log.status === 'error'){
            throw new Error('Failed to create log');
        }
        const sql = `UPDATE accounts SET ${fields.join(', ')} WHERE account_id = ? AND status = "Y"`;
        const result = await db.run(sql, values);
        return res.json({
            code: 200,
            success: true,
            message: 'Account updated successfully',
            result
        });
    } catch (error) {
        console.error('Error updating account:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to update account'
        });
    }
}
/**
 * Delete account by id
 * @param {Object} req - account_id
 * @param {Object} res - Account will be deleted successfully
 */
const deleteAccountById = async (req, res) => {
    try {
        logger.logWithLabel("deleteAccountById", req.params);
        const { accountId } = req.params;
        const sql = 'UPDATE accounts SET status = "D" WHERE account_id = ?';
        const result = await db.run(sql, [accountId]);
        if (!result) {
            throw new Error('Account not found');
        }
        return res.json({
            code: 200,
            success: true,
            message: 'Account deleted successfully',
            result
        })
    } catch (error) {
        console.error('Error deleting account:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to delete account'
        })
    }
}
module.exports = {
    createAccount,
    getAccounts,
    getAccountById,
    updateAccountById,
    deleteAccountById
};