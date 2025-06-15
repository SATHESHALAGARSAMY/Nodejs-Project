const { getDatabase } = require('../../db');
const dayjs = require('dayjs');

const db = getDatabase();

/**
 * Create a new destination
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const createDestination = async (req, res) => {
    try {
        const { accountId, url, httpMethod } = req.body;
        if (!accountId || !url || !httpMethod) {
            throw new Error('Missing required fields');
        }
        //Insert logs
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
        const sql = 'INSERT INTO destinations (account_id, url, http_method, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)';
        const result = await db.run(sql, [accountId, url, httpMethod, dayjs().format('YYYY-MM-DD HH:mm:ss'), dayjs().format('YYYY-MM-DD HH:mm:ss')]);
        return res.json({
            code: 200,
            success: true,
            message: 'Destination created successfully',
            result
        })
    } catch (error) {
        console.error('Error creating destination:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to create destination'
        })
    }
}

/**
 * Get all destinations
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getAllDestinations = async (req, res) => {
    try {
        const sql = 'SELECT d.*, a.* FROM destinations AS d INNER JOIN accounts AS a ON d.account_id = a.account_id WHERE d.account_id = ? AND d.status = "Y" AND a.status = "Y"';
        const result = await db.all(sql, [req.params.accountId]);
        if(!result){
            throw new Error('No destinations found');
        }
        let destinationList = [];   
        for(const destination of result){
            destinationList.push({
                destinationId: destination.destination_id,
                accountId: destination.account_id,
                url: destination.url,
                httpMethod: destination.http_method,
                headers: destination.headers,
                createdAt: destination.created_at,
                updatedAt: destination.updated_at
            });
        }
        return res.json({
            code: 200,
            success: true,
            message: 'Destinations fetched successfully',
            data: destinationList
        })
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to fetch destinations'
        })
    }
}

/**
 * Get destination by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getDestinationById = async (req, res) => {
    try {
        const sql = 'SELECT d.*, a.* FROM destinations AS d INNER JOIN accounts AS a ON d.account_id = a.account_id WHERE d.destination_id = ? AND d.status = "Y" AND a.status = "Y"';
        const result = await db.get(sql, [req.params.destinationId]);
        if(!result){
            throw new Error('Destination not found');
        }
        let destinationData = [];
        for(const data of result){
            let destinations = {
                destinationId: data.destination_id,
                accountId: data.account_id,
                url: data.url,
                httpMethod: data.http_method,
                headers: data.headers,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            }
            destinationData.push(destinations);
        }
        return res.json({
            code: 200,
            success: true,
            message: 'Destination fetched successfully',
            data: destinationData
        })
    } catch (error) {
        console.error('Error fetching destination:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to fetch destination'
        })
    }
}

/**
 * Update destination by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const updateDestinationById = async (req, res) => {
        try {
        const { destinationId } = req.body;
        if (!destinationId) {
            throw new Error('Missing destinationId');
        }

        // Build the SQL query dynamically
        const fieldsToUpdate = [];
        const values = [];

        const fieldMappings = {
            accountId: 'account_id',
            url: 'url',
            httpMethod: 'http_method',
        };

        for (const [key, field] of Object.entries(fieldMappings)) {
            if (req.body[key]) {
                fieldsToUpdate.push(`${field} = ?`);
                values.push(req.body[key]);
            }
        }

        // Always update the updated_at field
        fieldsToUpdate.push('updated_at = ?');
        values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));

        if (fieldsToUpdate.length === 0) {
            throw new Error('No fields to update');
        }
        //Insert logs
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
        const sql = `UPDATE destinations SET ${fieldsToUpdate.join(', ')} WHERE destination_id = ? AND status = "Y"`;
        values.push(destinationId);

        const result = await db.run(sql, values);
        return res.json({
            code: 200,
            success: true,
            message: 'Destination updated successfully',
            result
        });
    } catch (error) {
        console.error('Error updating destination:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to update destination'
        });
    }
}

/**
 * Delete destination by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */

const deleteDestinationById = async (req, res) => {
    try {
        const { destinationId } = req.body;
        if (!destinationId) {
            throw new Error('Missing required fields');
        }
        const sql = 'UPDATE destinations SET status = "D" WHERE destination_id = ?';
        const result = await db.run(sql, [destinationId]);
        return res.json({
            code: 200,
            success: true,
            message: 'Destination deleted successfully',
            result
        })
    } catch (error) {
        console.error('Error deleting destination:', error);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to delete destination'
        })
    }
}

/**
 * Delete all destinations by account id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */

const deleteAllDestinationsByAccountId = async (req, res) => {
    try {
        const { accountId } = req.body;
        if (!accountId) {
            throw new Error('Missing required fields');
        }
        const sql = 'UPDATE destinations SET status = "D" WHERE account_id = ?';
        const result = await db.run(sql, [accountId]);
        return res.json({
            code: 200,
            success: true,
            message: 'All destinations deleted successfully',
            result
        })
    } catch (error) {
        console.error('Error deleting all destinations by account id:', error.message);
        return res.json({
            code: 500,
            success: false,
            message: error.message || 'Failed to delete all destinations by account id'
        })
    }
}

module.exports = {
    createDestination,
    getAllDestinations,
    getDestinationById,
    updateDestinationById,
    deleteDestinationById,
    deleteAllDestinationsByAccountId
}
