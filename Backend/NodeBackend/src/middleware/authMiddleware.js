const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const { sendError } = require('../utils/apiResponse');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return sendError(res, 'Not authorized — no token', 401);
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.sub || decoded.user_id || decoded.id;

    // FIX 4 — Re-check user existence and active status on every request
    // Use lean() for performance — we only need is_active and role
    const user = await User.findById(userId).select('is_active role email full_name').lean();

    if (!user) {
      return sendError(res, 'Not authorized — user no longer exists', 401);
    }

    if (!user.is_active) {
      return sendError(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    req.user = {
      id: userId,
      email: user.email,
      name: user.full_name,
      role: user.role,
    };

    next();
  } catch (err) {
    return sendError(res, 'Not authorized — token invalid or expired', 401);
  }
};

module.exports = { protect };
