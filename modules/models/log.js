const { getDatabase } = require('../../db');
const dayjs = require('dayjs');

const db = getDatabase();

/**
 * Get logs with advanced filtering
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object
 */
const getLogs = async (req, res) => {
    try {
        const { accountId, destinationId, status, startDate, endDate, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let whereClauses = ['1=1'];
        let params = [];

        if (accountId) {
            whereClauses.push('l.account_id = ?');
            params.push(accountId);
        }

        if (destinationId) {
            whereClauses.push('l.destination_id = ?');
            params.push(destinationId);
        }

        if (status) {
            whereClauses.push('l.status = ?');
            params.push(status);
        }

        if (startDate && endDate) {
            whereClauses.push('DATE(l.received_timestamp) BETWEEN ? AND ?');
            params.push(startDate, endDate);
        }

        if (search) {
            whereClauses.push('(l.event_id LIKE ? OR l.received_data LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = whereClauses.join(' AND ');

        // Get total count
        const countSql = `SELECT COUNT(*) as count FROM logs l WHERE ${whereClause}`;
        db.get(countSql, params, (err, countResult) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            const totalCount = countResult.count;

            // Get logs with joins
            const sql = `
                SELECT 
                    l.*,
                    a.account_name,
                    a.email as account_email,
                    d.url as destination_url,
                    d.http_method
                FROM logs l
                LEFT JOIN accounts a ON l.account_id = a.account_id
                LEFT JOIN destinations d ON l.destination_id = d.destination_id
                WHERE ${whereClause}
                ORDER BY l.received_timestamp DESC
                LIMIT ? OFFSET ?
            `;

            db.all(sql, [...params, parseInt(limit), parseInt(offset)], async (err, logs) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }

                const logData = logs.map(data => ({
                    eventId: data.event_id,
                    accountId: data.account_id,
                    accountName: data.account_name,
                    accountEmail: data.account_email,
                    destinationId: data.destination_id,
                    destinationUrl: data.destination_url,
                    httpMethod: data.http_method,
                    receivedTimestamp: data.received_timestamp,
                    processedTimestamp: data.processed_timestamp,
                    receivedData: JSON.parse(data.received_data),
                    status: data.status,
                    errorMessage: data.error_message
                }));

                const response = {
                    data: logData,
                    pagination: {
                        total: totalCount,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalCount / limit)
                    }
                };

                return res.json({
                    success: true,
                    message: 'Logs fetched successfully',
                    ...response
                });
            });
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch logs',
            error: error.message
        });
    }
};

/**
 * Get log by event ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getLogByEventId = async (req, res) => {
    try {
        const { eventId } = req.params;

        const sql = `
            SELECT 
                l.*,
                a.account_name,
                a.email as account_email,
                d.url as destination_url,
                d.http_method
            FROM logs l
            LEFT JOIN accounts a ON l.account_id = a.account_id
            LEFT JOIN destinations d ON l.destination_id = d.destination_id
            WHERE l.event_id = ?
        `;

        db.all(sql, [eventId], async (err, logs) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!logs || logs.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Log not found'
                });
            }

            const logData = logs.map(data => ({
                eventId: data.event_id,
                accountId: data.account_id,
                accountName: data.account_name,
                accountEmail: data.account_email,
                destinationId: data.destination_id,
                destinationUrl: data.destination_url,
                httpMethod: data.http_method,
                receivedTimestamp: data.received_timestamp,
                processedTimestamp: data.processed_timestamp,
                receivedData: JSON.parse(data.received_data),
                status: data.status,
                errorMessage: data.error_message
            }));

            return res.json({
                success: true,
                message: 'Log fetched successfully',
                data: logData
            });
        });
    } catch (error) {
        console.error('Error fetching log:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch log',
            error: error.message
        });
    }
};

/**
 * Get log statistics
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getLogStats = async (req, res) => {
    try {
        const { accountId } = req.query;

        let whereClause = '1=1';
        let params = [];

        if (accountId) {
            whereClause = 'account_id = ?';
            params = [accountId];
        }

        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
            FROM logs
            WHERE ${whereClause}
        `;

        db.get(sql, params, async (err, stats) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            const statsData = {
                total: stats.total,
                success: stats.success_count,
                failed: stats.failed_count,
                pending: stats.pending_count,
                successRate: stats.total > 0 ? ((stats.success_count / stats.total) * 100).toFixed(2) : 0
            };

            return res.json({
                success: true,
                message: 'Log statistics fetched successfully',
                data: statsData
            });
        });
    } catch (error) {
        console.error('Error fetching log statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch log statistics',
            error: error.message
        });
    }
};

module.exports = {
    getLogs,
    getLogByEventId,
    getLogStats
};
