const { getDatabase } = require('../../db');
const dayjs = require('dayjs');

const db = getDatabase();

/**
 * Create a log
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object
 */
const createLog = async (req) => {
    try{
        logger.logWithLabel("createLog", req.body);
        const { accountId, destinationId, receivedTimestamp, receivedData, status } = req.body;
        const sql = 'INSERT INTO logs (account_id, destination_id, received_timestamp, received_data, status) VALUES (?, ?, ?, ?, ?)';
        const result = await db.run(sql, [accountId, destinationId, receivedTimestamp, receivedData, status]);
        return {
            status: 'success',
            result: result
        };
    } catch (error) {
        console.error(error);
        return {
            status: 'error',
            result: null
        };
    }
}

/**
 * Get logs
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Object} - The response object
 */
const getLogs = async (req, res) => {
    try{
        logger.logWithLabel("getLogs", req.body);
        const { accountId, destinationId, startDate, endDate } = req.body;
        let filter = '';
        if(accountId){
            filter += ` AND account_id = ${accountId}`;
        }
        if(destinationId){
            filter += ` AND destination_id = ${destinationId}`;
        }
        if(startDate && endDate){
            filter += ` AND received_timestamp BETWEEN ${startDate} AND ${endDate}`;
        }
        const sql = 'SELECT * FROM logs WHERE 1' + filter;
        const result = await db.all(sql);
        if(!result){
            throw new Error('No logs found');
        }
        let logData = [];
        for(const data of result){
            logData.push({
                logId: data.log_id,
                accountId: data.account_id,
                destinationId: data.destination_id,
                receivedTimestamp: data.received_timestamp,
                receivedData: JSON.parse(data.received_data),
                status: data.status
            });
        }   
        logger.logWithLabel("getLogs", logData);
        return res.json({
            code: 200,
            success: true,
            message: 'Logs fetched successfully',
            data: logData
        });
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to fetch logs',
            error: error.message
        });
    }
}

module.exports = {
    createLog,
    getLogs
}
