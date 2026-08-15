const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

const { FRONTEND_ORIGIN, NODE_ENV } = require('./config/env');
const { errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const jobSeekerRoutes = require('./routes/jobSeekerRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ── Trust proxy (required for Render/cloud deployments) ──────
// Render sits behind a load balancer that sets X-Forwarded-For.
// Without this, express-rate-limit throws a validation error.
app.set('trust proxy', 1);

// ── Security Headers ────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── Body Size Limits (FIX 8) ────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Rate Limiting ────────────────────────────────────────────
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// FIX 1 — Tight limiter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed/error responses
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// ── CORS (FIX 10) ────────────────────────────────────────────
const allowedOrigins = FRONTEND_ORIGIN
  ? FRONTEND_ORIGIN.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman in dev)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // In development, also allow localhost variants
      if (NODE_ENV === 'development' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Dev Logging ──────────────────────────────────────────────
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Serve resume files with auth check (FIX 6) ──────────────
// Moved to a protected route — see below

// ── Health Check — shows server + DB status ──────────────────
app.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';

  const healthy = dbState === 1;
  return res.status(healthy ? 200 : 503).json({
    status: healthy ? 'OK' : 'DEGRADED',
    database: dbStatus,
    timestamp: new Date(),
  });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);

// ── Protected file serving (FIX 6) ──────────────────────────
// Resume files require a valid JWT — served via /api/files/:filename
const { protect } = require('./middleware/authMiddleware');
const { uploadDir } = require('./middleware/uploadMiddleware');
const fs = require('fs');

app.get('/api/files/:filename', protect, (req, res) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found.' });
  }

  if (filename.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
  } else if (/\.(jpg|jpeg)$/i.test(filename)) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (/\.png$/i.test(filename)) {
    res.setHeader('Content-Type', 'image/png');
  } else if (/\.webp$/i.test(filename)) {
    res.setHeader('Content-Type', 'image/webp');
  }

  res.sendFile(filePath);
});

// ── Fallback unhandled route handler ─────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ── Centralized Error Handler ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
