const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const axios = require('axios');

const db = getDatabase();

/**
 * Handle incoming data
 * Receives JSON data, validates headers, and queues for async processing
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const handleIncomingData = async (req, res) => {
    try {
        // Get headers
        const appSecretToken = req.header('CL-X-TOKEN');
        const eventId = req.header('CL-X-EVENT-ID');

        // Validate headers
        if (!appSecretToken) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Data - Missing CL-X-TOKEN header'
            });
        }

        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Data - Missing CL-X-EVENT-ID header'
            });
        }

        // Validate request body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Data - Empty request body'
            });
        }

        // Get account by app_secret_token
        const accountSql = 'SELECT account_id, account_name FROM accounts WHERE app_secret_token = ? AND status = "Y"';
        db.get(accountSql, [appSecretToken], (err, account) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Invalid Data - Database error'
                });
            }

            if (!account) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid Data - Invalid app secret token'
                });
            }

            const accountId = account.account_id;
            req.account_id = accountId; // Set for rate limiter

            // Check if event_id already exists (duplicate check)
            const checkEventSql = 'SELECT COUNT(*) as count FROM logs WHERE event_id = ?';
            db.get(checkEventSql, [eventId], (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Invalid Data - Database error'
                    });
                }

                if (result.count > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid Data - Duplicate event ID'
                    });
                }

                // Get destinations for this account
                const destinationsSql = 'SELECT * FROM destinations WHERE account_id = ? AND status = "Y"';
                db.all(destinationsSql, [accountId], async (err, destinations) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Invalid Data - Database error'
                        });
                    }

                    if (!destinations || destinations.length === 0) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid Data - No destinations configured for this account'
                        });
                    }

                    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
                    const receivedData = JSON.stringify(req.body);

                    // Insert log entry for each destination
                    // Process webhooks synchronously
                    const processWebhooks = async () => {
                        for (const destination of destinations) {
                            try {
                                // Insert log entry
                                const logSql = `
                                    INSERT INTO logs (event_id, account_id, destination_id, received_timestamp, received_data, status) 
                                    VALUES (?, ?, ?, ?, ?, 'pending')
                                `;
                                
                                await new Promise((resolve, reject) => {
                                    db.run(logSql, [eventId, accountId, destination.destination_id, timestamp, receivedData], (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    });
                                });

                                // Parse headers
                                const headers = typeof destination.headers === 'string' 
                                    ? JSON.parse(destination.headers) 
                                    : destination.headers;

                                // Send webhook request
                                const response = await axios({
                                    method: destination.http_method.toLowerCase(),
                                    url: destination.url,
                                    data: req.body,
                                    headers: headers,
                                    timeout: 30000 // 30 seconds timeout
                                });

                                // Update log with success status
                                const updateSql = `
                                    UPDATE logs 
                                    SET status = ?, processed_timestamp = ?, error_message = NULL 
                                    WHERE event_id = ? AND destination_id = ?
                                `;
                                
                                await new Promise((resolve, reject) => {
                                    db.run(updateSql, ['success', dayjs().format('YYYY-MM-DD HH:mm:ss'), eventId, destination.destination_id], (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    });
                                });

                                console.log(`Successfully sent webhook to ${destination.url}`);
                            } catch (error) {
                                // Update log with failed status
                                const errorMessage = error.response 
                                    ? `HTTP ${error.response.status}: ${error.response.statusText}` 
                                    : error.message;

                                const updateSql = `
                                    UPDATE logs 
                                    SET status = ?, processed_timestamp = ?, error_message = ? 
                                    WHERE event_id = ? AND destination_id = ?
                                `;
                                
                                await new Promise((resolve, reject) => {
                                    db.run(updateSql, ['failed', dayjs().format('YYYY-MM-DD HH:mm:ss'), errorMessage, eventId, destination.destination_id], (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    });
                                });

                                console.error(`Failed to send webhook to ${destination.url}:`, errorMessage);
                            }
                        }
                    };

                    try {
                        // Process webhooks synchronously
                        await processWebhooks();

                        // Send success response
                        return res.status(200).json({
                            success: true,
                            message: 'Data Received'
                        });
                    } catch (error) {
                        console.error('Error processing incoming data:', error);
                        return res.status(500).json({
                            success: false,
                            message: 'Invalid Data - Failed to process request'
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Error handling incoming data:', error);
        return res.status(500).json({
            success: false,
            message: 'Invalid Data'
        });
    }
};

module.exports = {
    handleIncomingData
};

