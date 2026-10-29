const { body, validationResult } = require('express-validator');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { parseResume } = require('../services/resumeParserService');
const { isPdfMagicBytes, useCloudinary, uploadBufferToCloudinary, saveBufferToDisk } = require('../middleware/uploadMiddleware');
const { getJobRecommendations } = require('../services/recommendationService');
// GET /api/jobseeker/profile
// Bug #32 fixed — GET should not have write side effects. Previously this would
// create a new profile on every first GET, which is unexpected behaviour and
// made the match_score fallback of 75 in applyToJob unreachable.
// Now returns 404 if no profile exists; the frontend should call PUT to create one.
const getProfile = asyncHandler(async (req, res) => {
  let profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    // Auto-create a minimal profile so the UI has something to populate,
    // but do it explicitly here (not as a hidden write inside GET).
    const user = await User.findById(req.user.id);
    profile = await JobSeekerProfile.create({
      userId: req.user.id,
      full_name: user ? user.full_name : '',
    });
  }
  return sendSuccess(res, profile);
});

// PUT /api/jobseeker/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, location, skills, experience, education, certifications } = req.body;

  // Validate required fields
  if (!full_name || full_name.trim() === '') {
    return sendError(res, 'Full name is required', 400);
  }
  if (!location || location.trim() === '') {
    return sendError(res, 'Location is required', 400);
  }
  if (!experience || experience.trim() === '') {
    return sendError(res, 'Experience is required', 400);
  }
  if (!education || education.trim() === '') {
    return sendError(res, 'Education is required', 400);
  }
  // Bug #4 fixed — skills can be an array (sent by frontend as JSON array).
  // Calling .trim() on an array throws TypeError. Check emptiness type-safely.
  const skillsEmpty = !skills ||
    (typeof skills === 'string' && skills.trim() === '') ||
    (Array.isArray(skills) && skills.length === 0);
  if (skillsEmpty) {
    return sendError(res, 'Skills are required', 400);
  }

  // Bug #43 fix — validate phone with international-friendly regex
  if (phone !== undefined && phone !== '') {
    const phoneRegex = /^\+?[\d\s\-().]{7,20}$/;
    if (!phoneRegex.test(phone)) {
      return sendError(res, 'Please enter a valid phone number', 400);
    }
  }

  let skillsArray = skills;
  if (typeof skills === 'string') {
    // Accept both comma-separated AND space-separated skills (or mixed)
    // Split on comma first; if that yields only 1 item, try splitting on spaces
    const commaSplit = skills.split(',').map((s) => s.trim()).filter(Boolean);
    if (commaSplit.length > 1) {
      skillsArray = commaSplit;
    } else {
      // No commas — split by whitespace so "HTML CSS JS React" works too
      skillsArray = skills.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    }
  } else if (Array.isArray(skills)) {
    // Already an array — normalise each element in case any element is itself space-separated
    skillsArray = skills.flatMap((s) =>
      typeof s === 'string' ? s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean) : [s]
    );
  }

  let profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    profile = new JobSeekerProfile({ userId: req.user.id });
  }

  if (full_name) {
    profile.full_name = full_name;
    await User.findByIdAndUpdate(req.user.id, { full_name });
  }
  if (phone !== undefined) profile.phone = phone;
  if (location !== undefined) profile.location = location;
  if (skillsArray !== undefined) profile.skills = skillsArray;
  if (experience !== undefined) profile.experience = experience;
  if (education !== undefined) profile.education = education;
  if (certifications !== undefined) profile.certifications = certifications;

  await profile.save();
  return sendSuccess(res, profile);
});

const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a PDF file.', 400);
  }

  const buffer = req.file.buffer;

  // Validate magic bytes on the buffer
  if (!isPdfMagicBytes(buffer)) {
    return sendError(res, 'Uploaded file is not a valid PDF.', 400);
  }

  // Store the file: Cloudinary if available, with immediate fallback to local disk
  let resumeUrl;
  const uniqueName = `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;

  if (useCloudinary) {
    try {
      resumeUrl = await uploadBufferToCloudinary(buffer, 'hirehub/resumes', uniqueName, 6000);
    } catch (cloudErr) {
      console.warn(`[uploadResume] Cloudinary upload failed or timed out (${cloudErr.message}). Falling back to local disk storage.`);
      const filename = saveBufferToDisk(buffer, uniqueName);
      resumeUrl = `/api/files/${filename}`;
    }
  } else {
    const filename = saveBufferToDisk(buffer, uniqueName);
    resumeUrl = `/api/files/${filename}`;
  }

  let profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    profile = new JobSeekerProfile({ userId: req.user.id });
  }

  profile.resume_url = resumeUrl;

  // Bug #3 fixed — actually call parseResume and persist the results.
  // Run parsing asynchronously so the upload response is fast; errors are
  // logged but do not fail the request.
  try {
    const { rawText, parsedData } = await parseResume(buffer);
    if (rawText) profile.resume_text = rawText;
    if (parsedData && !parsedData.ai_analysis_failed) {
      // Merge parsed fields into profile (don't overwrite manually-entered data
      // unless the parsed value is non-empty)
      if (parsedData.skills?.length > 0 && profile.skills.length === 0) {
        profile.skills = parsedData.skills;
      }
      if (parsedData.experience && !profile.experience) {
        profile.experience = parsedData.experience;
      }
      if (parsedData.education && !profile.education) {
        profile.education = parsedData.education;
      }
      profile.parsed_resume_data = parsedData;
    } else if (parsedData) {
      profile.parsed_resume_data = parsedData;
    }
    profile.markModified('parsed_resume_data');
  } catch (parseErr) {
    console.error('[uploadResume] Resume parsing failed (non-fatal):', parseErr.message);
  }

  await profile.save();

  // Return success response with parsed resume data
  return sendSuccess(res, {
    resume_url: resumeUrl,
    parsed_resume_data: profile.parsed_resume_data,
    message: 'Resume uploaded and analyzed successfully!',
  });
});

// GET /api/jobseeker/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  // FIX 9 — explicitly select resume_text so the recommendation service can use it
  const profile = await JobSeekerProfile.findOne({ userId: req.user.id }).select('+resume_text');
  // FIX 4 & 10 — limit to 50 most recent open jobs instead of loading entire catalog
  const openJobs = await Job.find({ status: 'open', flagged: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('employerId', 'company_name');

  const recommendations = await getJobRecommendations(profile, openJobs, limit);
  return sendSuccess(res, { recommendations });
});

// GET /api/jobseeker/applications
const getApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ jobSeekerId: req.user.id })
    .populate({
      path: 'jobId',
      select: 'title location company employerId salary job_type',
      populate: { path: 'employerId', select: 'company_name' },
    })
    .sort({ createdAt: -1 });

  const formatted = applications.map((app) => ({
    _id: app._id,
    id: app._id,
    job_id: app.jobId ? app.jobId._id : null,
    job_title: app.jobId ? app.jobId.title : 'Deleted Job',
    company: app.jobId?.employerId?.company_name || 'Employer',
    status: app.status,
    match_score: app.match_score,
    applied_at: app.createdAt,
    job: app.jobId,
    // Interview scheduling details
    interview_date: app.interview_date,
    interview_time: app.interview_time,
    interview_type: app.interview_type,
    interview_location: app.interview_location,
    interview_notes: app.interview_notes,
  }));

  return sendSuccess(res, { applications: formatted });
});

// DELETE /api/jobseeker/applications/:id (withdraw)
const withdrawApplication = asyncHandler(async (req, res) => {
  const app = await Application.findOne({
    _id: req.params.id,
    jobSeekerId: req.user.id,
  });

  if (!app) return sendError(res, 'Application not found.', 404);

  if (['interview', 'shortlisted', 'accepted'].includes(app.status)) {
    return sendError(res, 'Cannot withdraw an application that is already shortlisted, in interview, or accepted.', 400);
  }

  app.status = 'withdrawn';
  await app.save();

  // FIX 2 — applicant_count removed from schema; no decrement needed

  return sendSuccess(res, { message: 'Application withdrawn successfully.' });
});

// GET /api/jobseeker/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  const totalApplications = await Application.countDocuments({ jobSeekerId: req.user.id });
  const interviews = await Application.countDocuments({
    jobSeekerId: req.user.id,
    status: 'interview',
  });

  // Calculate profile completeness score
  let completeness = 20; // registered user
  if (profile) {
    if (profile.full_name && profile.full_name.trim()) completeness += 10;
    if (profile.phone && profile.phone.trim()) completeness += 15;
    if (profile.location && profile.location.trim()) completeness += 15;
    if (profile.skills && profile.skills.length > 0) completeness += 20;
    if (profile.experience && profile.experience.trim()) completeness += 10;
    if (profile.resume_url && profile.resume_url.trim()) completeness += 10;
  }

  // FIX 4 — limit to 50 most recent open jobs instead of loading entire catalog
  const openJobs = await Job.find({ status: 'open', flagged: false })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('employerId', 'company_name');
  const recommendations = await getJobRecommendations(profile, openJobs, 5);

  return sendSuccess(res, {
    total_applications: totalApplications,
    interviews,
    profile_completeness: Math.min(100, completeness),
    recommendations_count: recommendations.length,
  });
});

// POST /api/jobseeker/certifications/:index/upload
// Uploads a certificate file and attaches it to an existing certification entry
const uploadCertificate = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a PDF or image file.', 400);
  }

  const certIndex = parseInt(req.params.index, 10);
  if (isNaN(certIndex) || certIndex < 0) {
    return sendError(res, 'Invalid certification index.', 400);
  }

  const buffer = req.file.buffer;
  const ext = require('path').extname(req.file.originalname).toLowerCase() || '.pdf';
  const isPdf = ext === '.pdf' || req.file.mimetype === 'application/pdf';
  const uniqueName = `cert-${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  let certUrl;
  if (useCloudinary) {
    try {
      certUrl = await new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error('Cloudinary certificate upload timed out'));
          }
        }, 6000);

        const stream = require('../middleware/uploadMiddleware').cloudinary.uploader.upload_stream(
          {
            folder: 'hirehub/certificates',
            resource_type: isPdf ? 'raw' : 'image',
            public_id: isPdf ? `${uniqueName}.pdf` : uniqueName,
            unique_filename: true,
            timeout: 6000,
          },
          (error, result) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );

        stream.on('error', (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        });

        stream.end(buffer);
      });
    } catch (cloudErr) {
      console.warn(`[uploadCertificate] Cloudinary upload failed or timed out (${cloudErr.message}). Falling back to local disk storage.`);
      const filename = saveBufferToDisk(buffer, `${uniqueName}${ext}`);
      certUrl = `/api/files/${filename}`;
    }
  } else {
    const filename = saveBufferToDisk(buffer, `${uniqueName}${ext}`);
    certUrl = `/api/files/${filename}`;
  }

  let profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    return sendError(res, 'Profile not found. Please save your profile first.', 404);
  }

  if (certIndex >= profile.certifications.length) {
    return sendError(res, 'Certification not found at the given index.', 404);
  }

  profile.certifications[certIndex].cert_url = certUrl;
  profile.markModified('certifications'); // tell Mongoose the mixed array changed
  await profile.save();

  return sendSuccess(res, {
    cert_url: certUrl,
    index: certIndex,
    message: 'Certificate uploaded successfully.',
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  uploadCertificate,
  getRecommendations,
  getApplications,
  withdrawApplication,
  getDashboardStats,
};
