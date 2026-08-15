/**
 * One-time migration: upload local uploads/* files (resumes + certificates)
 * to Cloudinary and update the database URLs to the new public URLs.
 *
 * Requirements:
 *   - Cloudinary env vars set (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
 *   - MONGO_URI + JWT_SECRET set
 *
 * Run from Backend/NodeBackend:
 *   node scripts/migrateLocalUploadsToCloudinary.js
 *
 * Dry-run first (no DB writes, no uploads):
 *   node scripts/migrateLocalUploadsToCloudinary.js --dry-run
 */
require('../src/config/env');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('../src/config/env');
const JobSeekerProfile = require('../src/models/JobSeekerProfile');

const DRY_RUN = process.argv.includes('--dry-run');
const uploadDir = path.join(__dirname, '..', 'uploads');

function isLocalPath(url) {
  return !!url && !/^https?:/.test(url);
}

function fileNameFromUrl(url) {
  const m = String(url).match(/\/([^/?]+)$/);
  return m ? m[1] : null;
}

function uploadToCloudinary(filePath, folder, isImage) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        folder,
        resource_type: isImage ? 'image' : 'raw',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
  });
}

async function migrateUrl(url, label, log) {
  if (!url) return { action: 'skip', reason: 'empty' };
  if (!isLocalPath(url)) return { action: 'skip', reason: 'already absolute (cloudinary/external)' };

  const fname = fileNameFromUrl(url);
  if (!fname) return { action: 'skip', reason: `no filename in ${url}` };

  const filePath = path.join(uploadDir, fname);
  if (!fs.existsSync(filePath)) {
    return { action: 'skip', reason: `file missing on disk: ${fname}` };
  }

  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(fname);
  const folder = isImage ? 'hirehub/certificates' : label === 'resume' ? 'hirehub/resumes' : 'hirehub/certificates';

  log(`  upload ${label}: ${fname} -> Cloudinary (${folder})`);
  if (DRY_RUN) return { action: 'dry-run' };

  const newUrl = await uploadToCloudinary(filePath, folder, isImage);
  log(`    => ${newUrl}`);
  return { action: 'migrated', newUrl };
}

async function main() {
  if (DRY_RUN) console.log('DRY RUN — no uploads, no DB writes.\n');
  else console.log('LIVE RUN — uploading files and updating the database.\n');

  if (!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)) {
    console.error('❌ Cloudinary credentials missing. Add these to .env (or the host):');
    console.error('   CLOUDINARY_CLOUD_NAME');
    console.error('   CLOUDINARY_API_KEY');
    console.error('   CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB.\n');

  const profiles = await JobSeekerProfile.find();
  console.log(`Profiles found: ${profiles.length}\n`);

  let migrated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const who = profile.full_name || String(profile.userId);
    let changed = false;

    const log = (msg) => console.log(`[${who}] ${msg}`);

    // Resume
    const resume = await migrateUrl(profile.resume_url, 'resume', log);
    if (resume.action === 'migrated') {
      profile.resume_url = resume.newUrl;
      changed = true;
      migrated++;
    } else if (resume.reason !== 'empty') {
      skipped++;
      log(`  resume SKIPPED: ${resume.reason}`);
    }

    // Certificates
    const certs = profile.certifications || [];
    for (let i = 0; i < certs.length; i++) {
      const cert = await migrateUrl(certs[i].cert_url, 'cert', log);
      if (cert.action === 'migrated') {
        certs[i].cert_url = cert.newUrl;
        changed = true;
        migrated++;
      } else if (cert.reason !== 'empty') {
        skipped++;
        log(`  cert[${i}] SKIPPED: ${cert.reason}`);
      }
    }

    if (changed && !DRY_RUN) {
      profile.markModified('certifications');
      await profile.save();
      log('  ✅ saved');
    }
    if (changed && DRY_RUN) {
      log('  (would be saved)');
    }
    console.log('');
  }

  console.log(`Done. Migrated: ${migrated}, Skipped: ${skipped}${DRY_RUN ? ' (DRY RUN — nothing written)' : ''}.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
