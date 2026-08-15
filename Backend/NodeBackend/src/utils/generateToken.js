const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Generate a JWT token.
 * FIX 15 — Minimal payload: sub (userId), email, role only.
 * The frontend reads these via jwtDecode. authMiddleware re-fetches
 * full user data from DB on every request so the token stays lean.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = generateToken;
