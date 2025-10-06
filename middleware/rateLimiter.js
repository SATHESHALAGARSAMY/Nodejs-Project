const rateLimit = require('express-rate-limit');

// In-memory storage for rate limiting
const requestStore = new Map();

/**
 * Custom in-memory rate limiter for data handler
 * Limits requests per account_id to 5 requests per second
 */
const dataHandlerRateLimiter = async (req, res, next) => {
  try {
    const accountId = req.account_id; // Set by the authentication middleware
    
    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: 'Account not identified'
      });
    }

    const key = `rate_limit:${accountId}`;
    const currentTime = Date.now();
    const windowSize = 1000; // 1 second in milliseconds
    const maxRequests = 5;

    // Get or create request array for this account
    if (!requestStore.has(key)) {
      requestStore.set(key, []);
    }

    const requests = requestStore.get(key);

    // Remove timestamps older than the window
    const recentRequests = requests.filter(timestamp => currentTime - timestamp < windowSize);
    
    // Count requests in the current window
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Maximum 5 requests per second per account allowed.'
      });
    }

    // Add current request timestamp
    recentRequests.push(currentTime);
    requestStore.set(key, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanupOldEntries();
    }

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // If rate limiter fails, allow the request to proceed
    next();
  }
};

/**
 * Cleanup old entries from the in-memory store
 */
function cleanupOldEntries() {
  const currentTime = Date.now();
  const expiryTime = 2000; // 2 seconds

  for (const [key, timestamps] of requestStore.entries()) {
    const recentTimestamps = timestamps.filter(timestamp => currentTime - timestamp < expiryTime);
    
    if (recentTimestamps.length === 0) {
      requestStore.delete(key);
    } else {
      requestStore.set(key, recentTimestamps);
    }
  }
}

/**
 * General API rate limiter
 * Limits to 100 requests per 15 minutes per IP
 */
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  dataHandlerRateLimiter,
  generalRateLimiter
};
