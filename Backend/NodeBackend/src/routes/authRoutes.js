const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe, changePassword, forgotPassword, getEmailStatus } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = Router();

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 100 }),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
  body('role')
    .optional()
    .isIn(['jobseeker', 'employer']).withMessage('Role must be jobseeker or employer'),
];

const loginValidation = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.get('/email-status', getEmailStatus);

module.exports = router;
