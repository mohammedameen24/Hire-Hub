const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Upload directory ─────────────────────────────────────────
// In production on Render, set UPLOAD_DIR to the mounted disk path
// e.g. UPLOAD_DIR=/var/data/uploads  (must match your Render disk mount point)
// Locally falls back to <project-root>/uploads
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Export so other modules (e.g. app.js file server) use the same path
module.exports.uploadDir = uploadDir;

// ── Resume storage ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `resume-${uniqueSuffix}.pdf`);
  },
});

const fileFilter = (_req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');
  if (isPdfMime || isPdfExt) {
    cb(null, true);
  } else {
    const err = new Error('Only PDF files are accepted.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

/**
 * Validate that an uploaded file actually starts with PDF magic bytes (%PDF).
 */
function isPdfMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  } catch {
    return false;
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Certificate storage ──────────────────────────────────────
const certStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    cb(null, `cert-${uniqueSuffix}${ext}`);
  },
});

const certFileFilter = (_req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error('Only PDF, JPG, PNG, or WEBP files are accepted for certificates.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

const uploadCert = multer({
  storage: certStorage,
  fileFilter: certFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = { upload, uploadCert, isPdfMagicBytes, uploadDir };
