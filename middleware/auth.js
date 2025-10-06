const jwt = require('jsonwebtoken');
const { getDatabase } = require('../db');
const JWT_SECRET = process.env.JWT_SECRET || 'd1e622507595486ee06db24b1debf11064edd2ba';

/**
 * Middleware to authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('CL-X-TOKEN');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDatabase();

    // Get user with role information
    const sql = `
      SELECT u.*, r.role_name, am.role_id, am.account_id
      FROM users u 
      LEFT JOIN account_members am ON u.user_id = am.user_id 
      LEFT JOIN roles r ON am.role_id = r.role_id 
      WHERE u.user_id = ? AND u.status = 'Y'
    `;

    db.get(sql, [decoded.data.user_id], (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }

      req.user = {
        user_id: user.user_id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        account_id: user.account_id
      };
      next();
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Middleware to authorize based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }

    if (!roles.includes(req.user.role_name)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Forbidden. You do not have permission to perform this action.' 
      });
    }

    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign({ data: user }, JWT_SECRET, {
    expiresIn: '24h',
  });
};

module.exports = {
  authenticate,
  authorize,
  generateToken
};

