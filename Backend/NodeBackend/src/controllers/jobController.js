const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { calculateMatchScore } = require('../services/matchScoreService');

// GET /api/jobs (public search/filter)
const getJobs = asyncHandler(async (req, res) => {
  const { q, location, job_type, page = 1, limit = 12 } = req.query;

  const filter = { status: 'open', flagged: false };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { skills_required: { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
  }

  if (location) {
    filter.location = { $regex: location, $options: 'i' };
  }

  if (job_type) {
    filter.job_type = job_type;
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 12;
  const skip = (pageNum - 1) * limitNum;

  const totalJobs = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .populate('employerId', 'company_name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const formattedJobs = jobs.map((job) => ({
    _id: job._id,
    id: job._id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    skills_required: job.skills_required,
    location: job.location,
    job_type: job.job_type,
    salary: job.salary,
    experience_level: job.experience_level,
    company: job.employerId?.company_name || 'Employer',
    createdAt: job.createdAt,
  }));

  return sendSuccess(res, {
    jobs: formattedJobs,
    total_jobs: totalJobs,
    page: pageNum,
    total_pages: Math.ceil(totalJobs / limitNum) || 1,
  });
});

// GET /api/jobs/:id (public details)
const getJobById = asyncHandler(async (req, res) => {
  // FIX 16 — only return open, unflagged jobs publicly
  const job = await Job.findOne({ _id: req.params.id, status: 'open', flagged: false })
    .populate('employerId', 'company_name');
  if (!job) return sendError(res, 'Job not found.', 404);

  return sendSuccess(res, {
    _id: job._id,
    id: job._id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    skills_required: job.skills_required,
    location: job.location,
    job_type: job.job_type,
    salary: job.salary,
    experience_level: job.experience_level,
    status: job.status,
    company: job.employerId?.company_name || 'Employer',
    createdAt: job.createdAt,
  });
});

// POST /api/jobs/:id/apply (protected, jobseeker only)
const applyToJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found.', 404);
  if (job.status !== 'open') return sendError(res, 'This job is closed for applications.', 400);

  const existingApp = await Application.findOne({
    jobId: job._id,
    jobSeekerId: req.user.id,
  });

  if (existingApp) {
    return sendError(res, 'You have already applied for this job.', 409);
  }

  // Calculate match score on application submit
  const profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  let matchScoreData = { match_score: 75, matched_skills: [], missing_skills: [] };

  if (profile) {
    matchScoreData = await calculateMatchScore(profile, job);
  }

  const application = await Application.create({
    jobId: job._id,
    jobSeekerId: req.user.id,
    status: 'pending',
    match_score: matchScoreData.match_score,
    matched_skills: matchScoreData.matched_skills,
    missing_skills: matchScoreData.missing_skills,
  });

  // FIX 2 — applicant_count removed from schema; no increment needed

  return sendSuccess(res, application, 201, 'Application submitted successfully!');
});

// GET /api/jobs/:id/match-score (protected, jobseeker)
const getJobMatchScore = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return sendError(res, 'Job not found.', 404);

  const profile = await JobSeekerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    return sendSuccess(res, {
      match_score: 50,
      score: 50,
      matched_skills: [],
      missing_skills: job.skills_required || [],
    });
  }

  const matchData = await calculateMatchScore(profile, job);

  return sendSuccess(res, {
    match_score: matchData.match_score,
    score: matchData.match_score,
    matched_skills: matchData.matched_skills,
    missing_skills: matchData.missing_skills,
  });
});

module.exports = {
  getJobs,
  getJobById,
  applyToJob,
  getJobMatchScore,
};
