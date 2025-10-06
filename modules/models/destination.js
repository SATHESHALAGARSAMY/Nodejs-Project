const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');

const db = getDatabase();

/**
 * Create a new destination
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const createDestination = async (req, res) => {
    try {
        const { accountId, url, httpMethod, headers } = req.body;
        const createdBy = req.user?.user_id;
        
        if (!accountId || !url || !httpMethod || !headers) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate headers is an object
        if (typeof headers !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Headers must be an object'
            });
        }

        const destinationId = uuidv4();
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
        const headersString = JSON.stringify(headers);

        const sql = 'INSERT INTO destinations (destination_id, account_id, url, http_method, headers, created_at, updated_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        db.run(sql, [destinationId, accountId, url, httpMethod.toUpperCase(), headersString, timestamp, timestamp, createdBy], async function(err) {
            if (err) {
                console.error('Error creating destination:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create destination'
                });
            }

            return res.json({
                success: true,
                message: 'Destination created successfully',
                data: {
                    destinationId,
                    accountId,
                    url,
                    httpMethod: httpMethod.toUpperCase(),
                    headers
                }
            });
        });
    } catch (error) {
        console.error('Error creating destination:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create destination'
        });
    }
};

/**
 * Get all destinations for an account
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getDestinationsByAccountId = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Get total count
        const countSql = 'SELECT COUNT(*) as count FROM destinations WHERE account_id = ? AND status = "Y"';
        db.get(countSql, [accountId], (err, countResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            const totalCount = countResult.count;

            // Get destinations
            const sql = `
                SELECT d.* 
                FROM destinations d 
                WHERE d.account_id = ? AND d.status = "Y"
                ORDER BY d.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            db.all(sql, [accountId, parseInt(limit), parseInt(offset)], async (err, destinations) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }

                const destinationList = destinations.map(destination => ({
                    destinationId: destination.destination_id,
                    accountId: destination.account_id,
                    url: destination.url,
                    httpMethod: destination.http_method,
                    headers: JSON.parse(destination.headers),
                    createdAt: destination.created_at,
                    updatedAt: destination.updated_at
                }));

                const response = {
                    data: destinationList,
                    pagination: {
                        total: totalCount,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalCount / limit)
                    }
                };

                return res.json({
                    success: true,
                    message: 'Destinations fetched successfully',
                    ...response
                });
            });
        });
    } catch (error) {
        console.error('Error fetching destinations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch destinations'
        });
    }
};

/**
 * Get destination by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getDestinationById = async (req, res) => {
    try {
        const { destinationId } = req.params;

        const sql = 'SELECT * FROM destinations WHERE destination_id = ? AND status = "Y"';
        db.get(sql, [destinationId], async (err, destination) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!destination) {
                return res.status(404).json({
                    success: false,
                    message: 'Destination not found'
                });
            }

            const destinationData = {
                destinationId: destination.destination_id,
                accountId: destination.account_id,
                url: destination.url,
                httpMethod: destination.http_method,
                headers: JSON.parse(destination.headers),
                createdAt: destination.created_at,
                updatedAt: destination.updated_at
            };

            return res.json({
                success: true,
                message: 'Destination fetched successfully',
                data: destinationData
            });
        });
    } catch (error) {
        console.error('Error fetching destination:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch destination'
        });
    }
};

/**
 * Update destination by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const updateDestinationById = async (req, res) => {
    try {
        const { destinationId } = req.params;
        const updatedBy = req.user?.user_id;

        if (!destinationId) {
            return res.status(400).json({
                success: false,
                message: 'Missing destinationId'
            });
        }

        // Build the SQL query dynamically
        const fieldsToUpdate = [];
        const values = [];

        const fieldMappings = {
            url: 'url',
            httpMethod: 'http_method',
            headers: 'headers'
        };

        for (const [key, field] of Object.entries(fieldMappings)) {
            if (req.body[key]) {
                if (key === 'headers') {
                    fieldsToUpdate.push(`${field} = ?`);
                    values.push(JSON.stringify(req.body[key]));
                } else if (key === 'httpMethod') {
                    fieldsToUpdate.push(`${field} = ?`);
                    values.push(req.body[key].toUpperCase());
                } else {
                    fieldsToUpdate.push(`${field} = ?`);
                    values.push(req.body[key]);
                }
            }
        }

        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Always update the updated_at field
        fieldsToUpdate.push('updated_at = ?');
        fieldsToUpdate.push('updated_by = ?');
        values.push(dayjs().format('YYYY-MM-DD HH:mm:ss'));
        values.push(updatedBy);
        values.push(destinationId);

        const sql = `UPDATE destinations SET ${fieldsToUpdate.join(', ')} WHERE destination_id = ? AND status = "Y"`;

        db.run(sql, values, async function(err) {
            if (err) {
                console.error('Error updating destination:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update destination'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Destination not found'
                });
            }

            return res.json({
                success: true,
                message: 'Destination updated successfully'
            });
        });
    } catch (error) {
        console.error('Error updating destination:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update destination'
        });
    }
};

/**
 * Delete destination by id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const deleteDestinationById = async (req, res) => {
    try {
        const { destinationId } = req.params;
        const updatedBy = req.user?.user_id;
        const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');

        if (!destinationId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const sql = 'UPDATE destinations SET status = "D", updated_at = ?, updated_by = ? WHERE destination_id = ?';
        db.run(sql, [timestamp, updatedBy, destinationId], async function(err) {
            if (err) {
                console.error('Error deleting destination:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete destination'
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Destination not found'
                });
            }

            return res.json({
                success: true,
                message: 'Destination deleted successfully'
            });
        });
    } catch (error) {
        console.error('Error deleting destination:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete destination'
        });
    }
};

module.exports = {
    createDestination,
    getDestinationsByAccountId,
    getDestinationById,
    updateDestinationById,
    deleteDestinationById
};
