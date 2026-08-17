const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Shared strong password regex (mirrors frontend requirements)
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400, errors.array());
  }

  const { full_name, email, password, role } = req.body;

  // FIX 9 — Never allow admin self-registration regardless of what was sent
  const safeRole = role === 'employer' ? 'employer' : 'jobseeker';

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 'An account with this email already exists.', 409);
  }

  const user = await User.create({ full_name, email, password, role: safeRole });
  const token = generateToken(user);

  return sendSuccess(
    res,
    {
      access_token: token,
      token_type: 'bearer',
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    },
    201
  );
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, errors.array()[0].msg, 400, errors.array());
  }

  const { email, password } = req.body;

  // FIX 2 — Select lockout fields alongside password
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
  if (!user) {
    return sendError(res, 'No account found with this email address. Please create an account to get started.', 404);
  }

  // FIX 2 — Check account lockout
  if (user.isLocked) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return sendError(
      res,
      `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      429
    );
  }

  // FIX 4 — Check active status on every login (not just at JWT decode time)
  if (!user.is_active) {
    return sendError(res, 'Your account has been deactivated. Please contact support.', 403);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    // FIX 2 — Increment failure counter
    await user.incLoginAttempts();
    return sendError(res, 'Invalid email or password.', 401);
  }

  // Successful login — reset counter
  await user.resetLoginAttempts();

  const token = generateToken(user);

  return sendSuccess(res, {
    access_token: token,
    token_type: 'bearer',
    role: user.role,
    full_name: user.full_name,
    email: user.email,
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  // FIX 13 — Validate ObjectId before DB query
  if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
    return sendError(res, 'Invalid user ID.', 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) return sendError(res, 'User not found.', 404);

  // FIX 4 — If user was deactivated after their token was issued, reject here
  if (!user.is_active) {
    return sendError(res, 'Your account has been deactivated. Please contact support.', 403);
  }

  return sendSuccess(res, {
    user: {
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    },
  });
});

// POST /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return sendError(res, 'All password fields are required.', 400);
  }

  if (new_password !== confirm_password) {
    return sendError(res, 'New password and confirm password do not match.', 400);
  }

  // FIX 7 — Enforce strong password policy on the backend
  if (!STRONG_PASSWORD_REGEX.test(new_password)) {
    return sendError(
      res,
      'New password must be at least 8 characters and include uppercase, lowercase, a digit, and a special character.',
      400
    );
  }

  // FIX 13 — Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
    return sendError(res, 'Invalid user ID.', 400);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) return sendError(res, 'User not found.', 404);

  const isMatch = await user.matchPassword(current_password);
  if (!isMatch) {
    return sendError(res, 'Invalid current password.', 401);
  }

  user.password = new_password;
  await user.save();

  return sendSuccess(res, { message: 'Password changed successfully.' });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return sendError(res, 'Email address is required.', 400);
  }

  // Always return the same message to prevent user enumeration
  await User.findOne({ email: email.toLowerCase() });

  // TODO: Integrate an email provider (e.g. SendGrid/Resend) to send a real
  // password-reset link. For now this endpoint is a stub.
  return sendSuccess(res, {
    message: 'If an account exists with this email, password reset instructions have been sent.',
  });
});

module.exports = { register, login, getMe, changePassword, forgotPassword };
