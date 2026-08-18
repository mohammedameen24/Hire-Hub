const { body, param, validationResult } = require('express-validator');
const EmployerProfile = require('../models/EmployerProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { rankApplicants } = require('../services/rankingService');

// GET /api/employer/company (and /profile)
const getCompany = asyncHandler(async (req, res) => {
  let profile = await EmployerProfile.findOne({ userId: req.user.id });
  if (!profile) {
    profile = await EmployerProfile.create({ userId: req.user.id });
  }
  return sendSuccess(res, profile);
});

// PUT /api/employer/company (and /profile)
const updateCompany = [
  body('company_name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('industry').optional().trim().isLength({ min: 2 }).withMessage('Industry must be at least 2 characters'),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location must not be empty'),
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('Website must be a valid URL'),
  body('company_size').optional().trim(),
  body('description').optional().trim(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const { company_name, industry, location, website, company_size, description } = req.body;

    let profile = await EmployerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new EmployerProfile({ userId: req.user.id });
    }

    if (company_name !== undefined) {
      const trimmedName = company_name.trim();
      if (!trimmedName) {
        return sendError(res, 'Company name cannot be blank.', 400);
      }
      profile.company_name = trimmedName;
    }
    if (industry !== undefined) {
      const trimmedIndustry = industry.trim();
      if (trimmedIndustry) profile.industry = trimmedIndustry;
    }
    if (location !== undefined) {
      const trimmedLocation = location.trim();
      if (trimmedLocation) profile.location = trimmedLocation;
    }
    if (website !== undefined) {
      const trimmedWebsite = website.trim();
      if (trimmedWebsite) profile.website = trimmedWebsite;
    }
    if (company_size !== undefined) profile.company_size = company_size;
    if (description !== undefined) {
      const trimmedDesc = description.trim();
      if (trimmedDesc) profile.description = trimmedDesc;
    }

    await profile.save();
    return sendSuccess(res, profile);
  }),
];

// GET /api/employer/jobs
const getMyJobs = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
  let query = Job.find({ employerId: req.user.id }).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  const jobs = await query;

  // Single aggregation to get all applicant counts at once — avoids N+1 queries
  const jobIds = jobs.map((j) => j._id);
  const counts = await Application.aggregate([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: '$jobId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const jobsWithCount = jobs.map((j) => ({
    ...j.toObject(),
    applicant_count: countMap.get(String(j._id)) ?? j.applicant_count ?? 0,
  }));

  return sendSuccess(res, { jobs: jobsWithCount });
});

// POST /api/employer/jobs
const createJob = [
  body('title').notEmpty().withMessage('Job title is required').trim().isLength({ min: 3 }).withMessage('Job title must be at least 3 characters'),
  body('description').notEmpty().withMessage('Job description is required').trim().isLength({ min: 10 }).withMessage('Job description must be at least 10 characters'),
  body('requirements').optional().trim(),
  body('skills_required').optional().trim(),
  body('location').optional().trim(),
  body('job_type')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'internship', null])
    .withMessage('Invalid job type'),
  body('salary').optional().trim(),
  body('experience_level')
    .optional()
    .isIn(['entry', 'mid', 'senior', 'lead', null])
    .withMessage('Invalid experience level'),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const {
      title,
      description,
      requirements,
      skills_required,
      location,
      job_type,
      salary,
      experience_level,
    } = req.body;

    let skillsArray = skills_required;
    if (typeof skills_required === 'string') {
      skillsArray = skills_required.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const job = await Job.create({
      employerId: req.user.id,
      title,
      description,
      requirements: requirements || '',
      skills_required: skillsArray || [],
      location: location || '',
      job_type: job_type || null,
      salary: salary || '',
      experience_level: experience_level || null,
    });

    return sendSuccess(res, job, 201);
  }),
];

// PUT /api/employer/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, employerId: req.user.id });
  if (!job) return sendError(res, 'Job not found or unauthorized.', 404);

  const allowedUpdates = [
    'title',
    'description',
    'requirements',
    'skills_required',
    'location',
    'job_type',
    'salary',
    'experience_level',
    'status',
  ];

  for (const field of allowedUpdates) {
    if (req.body[field] !== undefined) {
      if (field === 'skills_required' && typeof req.body[field] === 'string') {
        job.skills_required = req.body[field].split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        job[field] = req.body[field];
      }
    }
  }

  await job.save();
  return sendSuccess(res, job);
});

// DELETE /api/employer/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndDelete({ _id: req.params.id, employerId: req.user.id });
  if (!job) return sendError(res, 'Job not found or unauthorized.', 404);

  // Also remove applications associated with this job
  await Application.deleteMany({ jobId: req.params.id });

  // Applicant counts are gone with the job; no need to decrement

  return sendSuccess(res, { message: 'Job deleted successfully.' });
});

// GET /api/employer/jobs/:id/applicants
const getJobApplicants = asyncHandler(async (req, res) => {
  // FIX 11 — verify employer owns the job before fetching applicants
  const job = await Job.findOne({ _id: req.params.id, employerId: req.user.id });
  if (!job) return sendError(res, 'Job not found.', 404);

  // FIX 3 — use $lookup aggregation to fetch profiles in one query instead of N+1
  const appsWithProfiles = await Application.aggregate([
    { $match: { jobId: job._id } },
    // Populate jobSeekerId user
    {
      $lookup: {
        from: 'users',
        localField: 'jobSeekerId',
        foreignField: '_id',
        as: 'userArr',
        pipeline: [{ $project: { full_name: 1, email: 1 } }],
      },
    },
    // Populate jobseeker profile
    {
      $lookup: {
        from: 'jobseekerprofiles',
        localField: 'jobSeekerId',
        foreignField: 'userId',
        as: 'profileArr',
        pipeline: [{ $project: { full_name: 1, skills: 1, experience: 1, resume_url: 1, resume_text: 1, location: 1 } }],
      },
    },
    // FIX 18 — skip applications where the user was deleted (empty userArr)
    { $match: { 'userArr.0': { $exists: true } } },
    {
      $addFields: {
        jobSeekerId: { $arrayElemAt: ['$userArr', 0] },
        profile: { $arrayElemAt: ['$profileArr', 0] },
      },
    },
    { $project: { userArr: 0, profileArr: 0 } },
  ]);

  const rankedApplicants = await rankApplicants(job, appsWithProfiles);

  return sendSuccess(res, {
    job_id: job._id,
    job_title: job.title,
    applicants: rankedApplicants,
  });
});

// POST /api/employer/jobs/:id/applicants/:applicantId/:action
const updateApplicantStatus = asyncHandler(async (req, res) => {
  const { id: jobId, applicantId, action } = req.params;

  const validActions = ['shortlist', 'shortlisted', 'rejected', 'interview', 'pending'];
  const normalizedAction = action === 'shortlist' ? 'shortlisted' : action;

  if (!normalizedAction || !validActions.includes(normalizedAction)) {
    return sendError(res, 'Invalid action status.', 400);
  }

  // FIX 11 — verify the employer owns the job before updating applicant status
  const job = await Job.findOne({ _id: jobId, employerId: req.user.id });
  if (!job) return sendError(res, 'Job not found or unauthorized.', 404);

  let app = await Application.findOne({ _id: applicantId, jobId });
  if (!app) {
    app = await Application.findOne({ jobSeekerId: applicantId, jobId });
  }

  if (!app) return sendError(res, 'Application not found.', 404);

  app.status = normalizedAction;
  await app.save();

  return sendSuccess(res, app);
});

// PUT /api/employer/applications/:id/interview
// Full interview scheduling with date/time/type/location/notes
const scheduleInterview = asyncHandler(async (req, res) => {
  const { id: applicationId } = req.params;
  const { interview_date, interview_time, interview_type, interview_location, interview_notes } = req.body;

  const app = await Application.findById(applicationId).populate('jobId');
  if (!app) return sendError(res, 'Application not found.', 404);

  // FIX 5 — guard against deleted job (jobId null after populate)
  if (!app.jobId) {
    return sendError(res, 'The associated job no longer exists.', 404);
  }

  // Verify this employer owns the job
  if (String(app.jobId.employerId) !== String(req.user.id)) {
    return sendError(res, 'Unauthorized.', 403);
  }

  app.status = 'interview';
  if (interview_date) app.interview_date = new Date(interview_date);
  if (interview_time !== undefined) app.interview_time = interview_time;
  if (interview_type !== undefined) app.interview_type = interview_type;
  if (interview_location !== undefined) app.interview_location = interview_location;
  if (interview_notes !== undefined) app.interview_notes = interview_notes;

  await app.save();

  return sendSuccess(res, app);
});

// GET /api/employer/candidates/:id
const getCandidateProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let profile = await JobSeekerProfile.findOne({ userId: id });
  let user = await User.findById(id);

  if (!user && profile) {
    user = await User.findById(profile.userId);
  }

  if (!user && !profile) {
    // Check if id was a Profile ID instead
    profile = await JobSeekerProfile.findById(id).catch(() => null);
    if (profile) user = await User.findById(profile.userId);
  }

  if (!user && !profile) {
    // Check if id was an Application ID instead
    const app = await Application.findById(id).catch(() => null);
    if (app && app.jobSeekerId) {
      user = await User.findById(app.jobSeekerId);
      profile = await JobSeekerProfile.findOne({ userId: app.jobSeekerId });
    }
  }

  if (!user) return sendError(res, 'Candidate not found.', 404);

  return sendSuccess(res, {
    _id: user._id,
    id: user._id,
    name: profile?.full_name || user.full_name,
    full_name: profile?.full_name || user.full_name,
    email: user.email,
    phone: profile?.phone || '',
    location: profile?.location || '',
    skills: profile?.skills || [],
    experience: profile?.experience || '',
    education: profile?.education || '',
    resume_url: profile?.resume_url || '',
    certifications: profile?.certifications || [],
  });
});

// GET /api/employer/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  // FIX 2 — use aggregation to get stats without loading all jobs into memory
  const jobStats = await Job.aggregate([
    { $match: { employerId: new (require('mongoose').Types.ObjectId)(req.user.id) } },
    {
      $group: {
        _id: null,
        jobIds: { $push: '$_id' },
        activeJobs: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
      },
    },
  ]);

  if (!jobStats.length) {
    return sendSuccess(res, { active_jobs: 0, total_applicants: 0, shortlisted: 0, interviews: 0 });
  }

  const { jobIds, activeJobs } = jobStats[0];

  const [totalApplicants, shortlisted, interviews] = await Promise.all([
    Application.countDocuments({ jobId: { $in: jobIds } }),
    Application.countDocuments({ jobId: { $in: jobIds }, status: 'shortlisted' }),
    Application.countDocuments({ jobId: { $in: jobIds }, status: 'interview' }),
  ]);

  return sendSuccess(res, {
    active_jobs: activeJobs,
    total_applicants: totalApplicants,
    shortlisted,
    interviews,
  });
});

// GET /api/employer/interviews
const getEmployerInterviews = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ employerId: req.user.id }).select('_id title');
  const jobIds = jobs.map((j) => j._id);
  const jobMap = new Map(jobs.map((j) => [String(j._id), j.title]));

  const applications = await Application.find({
    jobId: { $in: jobIds },
    status: 'interview',
  })
    .populate('jobSeekerId', 'full_name email')
    .sort({ interview_date: 1, createdAt: -1 });

  const formatted = applications.map((app) => ({
    _id: app._id,
    id: app._id,
    job_id: app.jobId,
    job_title: jobMap.get(String(app.jobId)) || 'Job Position',
    candidate_id: app.jobSeekerId?._id,
    candidate_name: app.jobSeekerId?.full_name || 'Candidate',
    candidate_email: app.jobSeekerId?.email || '',
    interview_date: app.interview_date,
    interview_time: app.interview_time,
    interview_type: app.interview_type,
    interview_location: app.interview_location,
    interview_notes: app.interview_notes,
    status: app.status,
  }));

  return sendSuccess(res, { interviews: formatted });
});

module.exports = {
  getCompany,
  updateCompany,
  getMyJobs,
  createJob,
  updateJob,
  deleteJob,
  getJobApplicants,
  updateApplicantStatus,
  scheduleInterview,
  getCandidateProfile,
  getDashboardStats,
  getEmployerInterviews,
};
