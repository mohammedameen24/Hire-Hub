const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // FIX 5 — Always force .pdf extension regardless of original filename
    cb(null, `resume-${uniqueSuffix}.pdf`);
  },
});

// FIX 5 — Validate by magic bytes after upload, reject if not a real PDF
const fileFilter = (_req, file, cb) => {
  // Only accept files claiming to be PDF — magic byte check happens post-upload
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
 * FIX 5 — Validate that an uploaded file actually starts with the PDF magic bytes (%PDF).
 * Call this after multer has saved the file. Returns true if valid.
 */
function isPdfMagicBytes(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    // PDF magic bytes: 25 50 44 46 = %PDF
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  } catch {
    return false;
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ── Certificate upload (PDF or image) ───────────────────────
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

module.exports = { upload, uploadCert, isPdfMagicBytes };
