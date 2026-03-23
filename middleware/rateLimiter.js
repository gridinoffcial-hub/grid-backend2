const rateLimit = require('express-rate-limit');

// General — 100 requests per 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again later.' },
});

// Orders — max 5 orders per hour (stops spam)
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many orders from this device. Wait 1 hour.' },
  skip: (req) => req.method === 'GET',
});

// Admin — max 20 requests per 15 min (brute-force protection)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many admin requests. Slow down.' },
});

module.exports = { generalLimiter, orderLimiter, adminLimiter };
