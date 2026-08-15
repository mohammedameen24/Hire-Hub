const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// ── Configure Cloudinary ─────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// ── Local fallback upload dir (dev without Cloudinary) ───────
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// ── Resume upload ────────────────────────────────────────────
// Always use memoryStorage so pdf-parse can read the buffer,
// then we upload to Cloudinary (or save to disk) in the controller.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Uploads a buffer to Cloudinary and returns the secure URL.
 * Uses resource_type 'raw' for proper PDF storage.
 * Adds fl_attachment:false transformation to display PDF inline in browser instead of downloading.
 */
function uploadBufferToCloudinary(buffer, folder, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        public_id: filename,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        // Add transformation to display PDF inline: fl_attachment:false
        // Insert transformation between /raw/upload/ and /version/
        const url = result.secure_url.replace(
          /\/raw\/upload\/v/,
          '/raw/upload/fl_attachment:false/v'
        );
        resolve(url);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Saves a buffer to local disk and returns the filename.
 */
function saveBufferToDisk(buffer, filename) {
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  return filename;
}

// ── Certificate upload ───────────────────────────────────────
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
  storage: multer.memoryStorage(),
  fileFilter: certFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/**
 * Magic-bytes PDF check on a Buffer.
 */
function isPdfMagicBytes(bufferOrPath) {
  try {
    let buf;
    if (Buffer.isBuffer(bufferOrPath)) {
      buf = bufferOrPath.slice(0, 4);
    } else {
      const fd = fs.openSync(bufferOrPath, 'r');
      buf = Buffer.alloc(4);
      fs.readSync(fd, buf, 0, 4, 0);
      fs.closeSync(fd);
    }
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  } catch {
    return false;
  }
}

module.exports = {
  upload,
  uploadCert,
  isPdfMagicBytes,
  uploadDir,
  useCloudinary,
  uploadBufferToCloudinary,
  saveBufferToDisk,
  cloudinary,
};
