const JobSeekerProfile = require('../models/JobSeekerProfile');
const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const fs = require('fs');
const { parseResume } = require('../services/resumeParserService');
const { isPdfMagicBytes } = require('../middleware/uploadMiddleware');
const { getJobRecommendations } = require('../services/recommendationService');
// GET /api/jobseeker/profile
const getProfile = asyncHandler(async (req, res) => {
  let profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    const user = await User.findById(req.user.id);
    profile = await JobSeekerProfile.create({
      userId: req.user.id,
      full_name: user ? user.full_name : req.user.name,
    });
  }
  return sendSuccess(res, profile);
});

// PUT /api/jobseeker/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { full_name, phone, location, skills, experience, education, certifications } = req.body;

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

// POST /api/jobseeker/resume/upload
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'Please upload a PDF file.', 400);
  }

  // FIX 5 — Validate magic bytes to prevent spoofed MIME uploads
  if (!isPdfMagicBytes(req.file.path)) {
    fs.unlinkSync(req.file.path); // delete the invalid file
    return sendError(res, 'Uploaded file is not a valid PDF.', 400);
  }

  const filePath = req.file.path;
  const resumeUrl = `/api/files/${req.file.filename}`;

  // Parse resume with pdf-parse and Gemini
  const { rawText, parsedData } = await parseResume(filePath);

  let profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    profile = new JobSeekerProfile({ userId: req.user.id });
  }

  profile.resume_url = resumeUrl;
  profile.resume_text = rawText;
  profile.parsed_resume_data = parsedData;

  if (parsedData.skills && parsedData.skills.length > 0) {
    // Merge new skills with existing skills without duplicates
    const combinedSkills = new Set([...(profile.skills || []), ...parsedData.skills]);
    profile.skills = Array.from(combinedSkills);
  }

  await profile.save();

  // Return the analysis structure expected by ResumeUpload.jsx
  return sendSuccess(res, {
    resume_url: resumeUrl,
    match_score: parsedData.match_score || 80,
    score: parsedData.match_score || 80,
    matched_skills: parsedData.matched_skills || parsedData.skills || [],
    missing_skills: parsedData.missing_skills || [],
    suggestions: parsedData.suggestions || [],
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

  const certUrl = `/api/files/${req.file.filename}`;

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
