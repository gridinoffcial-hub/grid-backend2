require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const { generalLimiter, orderLimiter, adminLimiter } = require('./middleware/rateLimiter');
const orderRoutes   = require('./routes/orders');
const adminRoutes   = require('./routes/admin');
const contactRoutes = require('./routes/contact');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Create data folder if it doesn't exist ──
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// ── Security headers ──
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-admin-pin'],
}));

// ── Body parsing ──
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiting ──
app.use('/api/', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/admin', adminLimiter);

// ── Logger ──
app.use((req, _res, next) => {
  const ts = new Date().toLocaleTimeString('en-IN');
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ──
app.use('/api/orders',  orderRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/contact', contactRoutes);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({
    status : 'ok',
    service: 'Grid Backend 🔱',
    version: '1.0.0',
    time   : new Date().toISOString(),
  });
});

// ── Root welcome message ──
app.get('/', (_req, res) => {
  res.json({
    message: '🔱 Grid Backend is running!',
    endpoints: {
      health  : 'GET  /api/health',
      order   : 'POST /api/orders',
      track   : 'GET  /api/orders/:id',
      contact : 'POST /api/contact',
      admin   : 'GET  /api/admin/orders  (needs x-admin-pin header)',
      stats   : 'GET  /api/admin/stats   (needs x-admin-pin header)',
    },
  });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('Server error:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    error  : process.env.NODE_ENV === 'production'
      ? 'Something went wrong.'
      : err.message,
  });
});

// ── Start server ──
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║    🔱  Grid Backend is running!      ║');
  console.log(`║    http://localhost:${PORT}              ║`);
  console.log('╚══════════════════════════════════════╝\n');
});

module.exports = app;
