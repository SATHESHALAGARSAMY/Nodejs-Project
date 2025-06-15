const { getDatabase } = require('../../db');
const dayjs = require('dayjs');
const auth = require('../../middleware/apiKey');
const functions = require('../../middleware/apiKey');
const db = getDatabase();
const logger = require("../../middleware/logger");

/**
 * Get user list
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getUserList = async (req, res) => {
    try {
        logger.logWithLabel("getUserList", req.body);
        const token = req.headers['cl-x-event-id'];
        const tokenDecryptInfo = await functions.tokenDecrypt(token);
        let filter = '';
        //Restrict user to see only their own data
        if(tokenDecryptInfo.role_id !== 1) {
            filter = `AND u.user_id = ${tokenDecryptInfo.user_id}`;
        }

        const sql = `SELECT u.*, r.role_name, a.account_name FROM users u JOIN roles r ON u.role_id = r.role_id JOIN accounts a ON u.account_id = a.account_id WHERE u.status = 'Y'` + filter;
        const result = await db.all(sql);
        let userList = [];
        for(const user of result){
            userList.push({
                user_id: user.user_id,
                email: user.email,
                account_id: user.account_id,
                account_name: user.account_name,
                role_id: user.role_id,
                role_name: user.role_name
            });
        }
        logger.logWithLabel("getUserList", userList);
        return res.json({
            code: 200,
            success: true,
            message: 'User list fetched successfully',
            data: userList
        });
    } catch (error) {
        console.error(error);
        return res.json({
            code: 500,
            success: false,
            message: 'Failed to get user list',
        });
    }
}
module.exports = { getUserList };   