const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Configure Cloudinary ─────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Detect whether Cloudinary is configured ──────────────────
const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

// ── Local fallback upload dir (for dev without Cloudinary) ───
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

if (!useCloudinary && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Resume storage ───────────────────────────────────────────
const resumeStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'hirehub/resumes',
        resource_type: 'raw', // PDFs must use raw
        format: 'pdf',
        use_filename: false,
        unique_filename: true,
      },
    })
  : multer.diskStorage({
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

const upload = multer({
  storage: resumeStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Certificate storage ──────────────────────────────────────
const certStorage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary,
      params: (req, file) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';
        return {
          folder: 'hirehub/certificates',
          resource_type: isPdf ? 'raw' : 'image',
          format: isPdf ? 'pdf' : undefined,
          use_filename: false,
          unique_filename: true,
        };
      },
    })
  : multer.diskStorage({
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

/**
 * Magic-bytes PDF check — used only for local disk uploads.
 * Cloudinary uploads never touch disk so this is skipped in production.
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

module.exports = { upload, uploadCert, isPdfMagicBytes, uploadDir, useCloudinary };
