const dotenv = require('dotenv');
dotenv.config();

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

// Cloudinary is optional — when all three keys are absent the app falls back
// to local disk storage (see uploadMiddleware useCloudinary). Warn if only
// part of the config is set, since that is almost always a mistake.
const cloudinaryKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const cloudinarySet = cloudinaryKeys.filter((k) => process.env[k]);
if (cloudinarySet.length > 0 && cloudinarySet.length < cloudinaryKeys.length) {
  console.warn(
    `⚠️ Partial Cloudinary configuration detected (${cloudinarySet.join(', ')}). ` +
      'Set all of CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to use Cloudinary, ' +
      'or remove all of them to use local file storage.'
  );
}

// Gemini API is optional — services fall back to programmatic matching when absent.
if (process.env.GEMINI_API_KEY) {
  console.log('✅ Gemini API key configured.');
} else {
  console.warn('⚠️ GEMINI_API_KEY not set. AI features will use programmatic fallbacks.');
}

// FIX 3 — Enforce minimum JWT secret strength (32 chars minimum)
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}
if (process.env.JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
  console.error('❌ JWT_SECRET is set to the default placeholder value. Change it before running.');
  process.exit(1);
}

module.exports = {
  PORT: process.env.PORT || 8000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
