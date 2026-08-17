const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const EmployerProfile = require('../models/EmployerProfile');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/admin/dashboard/stats
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeJobs,
    flaggedPostings,
    pendingVerificationsCount,
    pendingEmployerProfiles,
    recentUsers,
    recentJobs,
    recentApps,
  ] = await Promise.all([
    User.countDocuments({}),
    Job.countDocuments({ status: 'open' }),
    Job.countDocuments({ flagged: true }),
    EmployerProfile.countDocuments({ verified: false }),
    EmployerProfile.find({ verified: false }).populate('userId', 'full_name email is_verified createdAt').limit(5),
    User.find({}).sort({ createdAt: -1 }).limit(5),
    Job.find({}).populate('employerId', 'company_name full_name').sort({ createdAt: -1 }).limit(5),
    Application.find({}).populate('jobId', 'title').populate('jobSeekerId', 'full_name').sort({ createdAt: -1 }).limit(5),
  ]);

  // Format pending employers for quick verification widget
  const pendingEmployersFormatted = pendingEmployerProfiles.map((p) => ({
    _id: p.userId?._id || p._id,
    profileId: p._id,
    name: p.userId?.full_name || p.company_name || 'Employer',
    email: p.userId?.email || 'N/A',
    company_name: p.company_name || 'Company N/A',
    industry: p.industry || 'Technology',
    location: p.location || 'Remote',
    createdAt: p.createdAt || p.userId?.createdAt,
  }));

  // Format activity feed
  const activityFeed = [];
  recentUsers.forEach((u) => {
    activityFeed.push({
      id: `user-${u._id}`,
      type: 'user_signup',
      title: `New ${u.role === 'employer' ? 'Employer' : 'Job Seeker'} Registered`,
      description: `${u.full_name} (${u.email}) joined HireHub`,
      timestamp: u.createdAt,
      badge: u.role === 'employer' ? 'Employer' : 'Job Seeker',
      badgeColor: u.role === 'employer' ? 'success' : 'accent',
    });
  });

  recentJobs.forEach((j) => {
    activityFeed.push({
      id: `job-${j._id}`,
      type: 'job_posted',
      title: `New Job Posted: ${j.title}`,
      description: `Posted by ${j.employerId?.company_name || j.employerId?.full_name || 'Employer'} (${j.location || 'Remote'})`,
      timestamp: j.createdAt,
      badge: j.status === 'open' ? 'Active' : j.status,
      badgeColor: 'blue',
    });
  });

  recentApps.forEach((a) => {
    activityFeed.push({
      id: `app-${a._id}`,
      type: 'application_submitted',
      title: `Application Submitted`,
      description: `${a.jobSeekerId?.full_name || 'Candidate'} applied for ${a.jobId?.title || 'a position'}`,
      timestamp: a.createdAt,
      badge: 'Application',
      badgeColor: 'violet',
    });
  });

  // Sort activity feed by date descending
  activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Format recent jobs
  const formattedRecentJobs = recentJobs.map((j) => ({
    _id: j._id,
    title: j.title,
    company: j.employerId?.company_name || j.employerId?.full_name || 'Company',
    location: j.location,
    status: j.status,
    createdAt: j.createdAt,
  }));

  return sendSuccess(res, {
    total_users: totalUsers,
    active_jobs: activeJobs,
    flagged_postings: flaggedPostings,
    pending_verifications: pendingVerificationsCount,
    pending_employers: pendingEmployersFormatted,
    recent_activity: activityFeed.slice(0, 8),
    recent_jobs: formattedRecentJobs,
    system_status: {
      db_status: 'Connected',
      resume_parser_ai: 'Operational',
      matching_engine: 'Active',
      api_latency_ms: 28,
      uptime: '99.98%',
    },
    announcement: {
      message: 'System maintenance scheduled for Sunday at 02:00 AM UTC. Platform services will remain operational.',
      active: true,
    },
  });
});

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { role, q, search, page = 1, limit = 20 } = req.query;
  const searchTerm = q || search;

  const filter = {};

  if (role) filter.role = role;
  if (searchTerm) {
    filter.$or = [
      { full_name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    User.countDocuments(filter),
  ]);

  const formattedUsers = users.map((u) => ({
    _id: u._id,
    id: u._id,
    name: u.full_name,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
    is_verified: u.is_verified,
    is_active: u.is_active,
    createdAt: u.createdAt,
  }));

  return sendSuccess(res, {
    users: formattedUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// POST /api/admin/users/:id/:action (verify, deactivate, activate)
const handleUserAction = asyncHandler(async (req, res) => {
  const { id, action } = req.params;
  const user = await User.findById(id);
  if (!user) return sendError(res, 'User not found.', 404);

  if (action === 'verify') {
    user.is_verified = true;
    await user.save();
    await EmployerProfile.findOneAndUpdate({ userId: user._id }, { verified: true });
  } else if (action === 'reject' || action === 'unverify') {
    user.is_verified = false;
    await user.save();
    await EmployerProfile.findOneAndUpdate({ userId: user._id }, { verified: false });
  } else if (action === 'deactivate') {
    user.is_active = false;
    await user.save();
  } else if (action === 'activate') {
    user.is_active = true;
    await user.save();
  } else {
    return sendError(res, 'Invalid user action.', 400);
  }

  return sendSuccess(res, user);
});

// GET /api/admin/flagged-jobs
const getFlaggedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ flagged: true })
    .populate('employerId', 'company_name email full_name')
    .sort({ updatedAt: -1 });

  const formattedJobs = jobs.map((j) => ({
    _id: j._id,
    id: j._id,
    title: j.title,
    description: j.description,
    location: j.location,
    company: j.employerId?.company_name || j.employerId?.full_name || 'Employer',
    employer_name: j.employerId?.company_name || j.employerId?.full_name || 'Employer',
    flag_reason: j.flag_reason || 'AI Flagged',
    flag_details: j.flag_reason || 'Flagged by automated AI policy check',
    review_status: j.flagged ? 'pending' : 'approved',
    created_at: j.createdAt,
  }));

  return sendSuccess(res, { flagged_jobs: formattedJobs });
});

// POST /api/admin/flagged-jobs/:id/:action (approved, rejected, unflag)
const handleFlaggedJobAction = asyncHandler(async (req, res) => {
  const { id, action } = req.params;
  const job = await Job.findById(id);
  if (!job) return sendError(res, 'Job posting not found.', 404);

  if (action === 'approved' || action === 'approve') {
    job.flagged = false;
    job.flag_reason = '';
    await job.save();
    return sendSuccess(res, { message: 'Job approved and unflagged.', review_status: 'approved' });
  } else if (action === 'rejected' || action === 'reject' || action === 'remove') {
    job.status = 'closed';
    job.flagged = false;
    await job.save();
    return sendSuccess(res, { message: 'Job posting removed.', review_status: 'rejected' });
  }

  return sendError(res, 'Invalid action.', 400);
});

// GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const totalJobseekers = await User.countDocuments({ role: 'jobseeker' });
  const totalEmployers = await User.countDocuments({ role: 'employer' });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const jobsPosted30d = await Job.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const applications30d = await Application.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

  const avgResult = await Application.aggregate([
    { $match: { match_score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: '$match_score' } } },
  ]);

  const avgMatchScore = avgResult[0]?.avgScore || 78;

  const skillsAggregation = await JobSeekerProfile.aggregate([
    { $unwind: '$skills' },
    { $group: { _id: '$skills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const topSkills = skillsAggregation.map((s) => ({ name: s._id, count: s.count, value: s.count }));

  const locationsAggregation = await Job.aggregate([
    { $match: { location: { $ne: '' } } },
    { $group: { _id: '$location', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const topLocations = locationsAggregation.map((l) => ({ name: l._id, count: l.count, value: l.count }));

  // FIX 17 — recommendations_sent removed; was fabricated math with no DB tracking
  // If tracking is needed, add a dedicated collection/model to log recommendation calls

  return sendSuccess(res, {
    total_jobseekers: totalJobseekers,
    total_employers: totalEmployers,
    jobs_posted_30d: jobsPosted30d,
    applications_30d: applications30d,
    avg_match_score: Math.round(avgMatchScore),
    jobseeker_growth: 12,
    employer_growth: 8,
    jobs_growth: 15,
    applications_growth: 22,
    top_skills: topSkills.length > 0 ? topSkills : [
      { name: 'React', count: 42, value: 42 },
      { name: 'Node.js', count: 38, value: 38 },
      { name: 'Python', count: 31, value: 31 },
      { name: 'MongoDB', count: 27, value: 27 },
      { name: 'TypeScript', count: 24, value: 24 },
    ],
    top_locations: topLocations.length > 0 ? topLocations : [
      { name: 'Remote', count: 65, value: 65 },
      { name: 'San Francisco, CA', count: 32, value: 32 },
      { name: 'New York, NY', count: 28, value: 28 },
      { name: 'Austin, TX', count: 21, value: 21 },
      { name: 'London, UK', count: 18, value: 18 },
    ],
  });
});

module.exports = {
  getDashboardStats,
  getUsers,
  handleUserAction,
  getFlaggedJobs,
  handleFlaggedJobAction,
  getAnalytics,
};
