const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Data',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Account validation rules
 */
const accountValidation = {
  create: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('accountName').notEmpty().withMessage('Account name is required'),
    body('website').optional().isURL().withMessage('Valid website URL is required'),
    handleValidationErrors
  ],
  update: [
    param('accountId').notEmpty().withMessage('Account ID is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('accountName').optional().notEmpty().withMessage('Account name cannot be empty'),
    body('website').optional().isURL().withMessage('Valid website URL is required'),
    handleValidationErrors
  ],
  getById: [
    param('accountId').notEmpty().withMessage('Account ID is required'),
    handleValidationErrors
  ]
};

/**
 * Destination validation rules
 */
const destinationValidation = {
  create: [
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('url').isURL().withMessage('Valid URL is required'),
    body('httpMethod').isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Valid HTTP method is required'),
    body('headers').isObject().withMessage('Headers must be an object'),
    handleValidationErrors
  ],
  update: [
    body('destinationId').notEmpty().withMessage('Destination ID is required'),
    body('url').optional().isURL().withMessage('Valid URL is required'),
    body('httpMethod').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Valid HTTP method is required'),
    body('headers').optional().isObject().withMessage('Headers must be an object'),
    handleValidationErrors
  ],
  getById: [
    param('destinationId').notEmpty().withMessage('Destination ID is required'),
    handleValidationErrors
  ],
  getByAccountId: [
    param('accountId').notEmpty().withMessage('Account ID is required'),
    handleValidationErrors
  ]
};

/**
 * User validation rules
 */
const userValidation = {
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    handleValidationErrors
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  invite: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('roleId').isIn([1, 2]).withMessage('Role ID must be 1 (Admin) or 2 (Normal user)'),
    handleValidationErrors
  ]
};

/**
 * Account Member validation rules
 */
const accountMemberValidation = {
  create: [
    body('accountId').notEmpty().withMessage('Account ID is required'),
    body('userId').notEmpty().withMessage('User ID is required'),
    body('roleId').isIn([1, 2]).withMessage('Role ID must be 1 (Admin) or 2 (Normal user)'),
    handleValidationErrors
  ],
  update: [
    param('memberId').notEmpty().withMessage('Member ID is required'),
    body('roleId').optional().isIn([1, 2]).withMessage('Role ID must be 1 (Admin) or 2 (Normal user)'),
    handleValidationErrors
  ]
};

/**
 * Data Handler validation rules
 */
const dataHandlerValidation = {
  incoming: [
    body().isObject().withMessage('Request body must be a valid JSON object'),
    handleValidationErrors
  ]
};

/**
 * Log validation rules
 */
const logValidation = {
  filter: [
    query('accountId').optional().notEmpty().withMessage('Account ID cannot be empty'),
    query('destinationId').optional().notEmpty().withMessage('Destination ID cannot be empty'),
    query('status').optional().isIn(['pending', 'success', 'failed']).withMessage('Status must be pending, success, or failed'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO 8601 date'),
    handleValidationErrors
  ]
};

module.exports = {
  accountValidation,
  destinationValidation,
  userValidation,
  accountMemberValidation,
  dataHandlerValidation,
  logValidation,
  handleValidationErrors
};

