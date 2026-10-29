const { Router } = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
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
} = require('../controllers/employerController');

const router = Router();

router.use(protect, restrict('employer'));

router.get('/company', getCompany);
router.put('/company', updateCompany);
router.get('/profile', getCompany);
router.put('/profile', updateCompany);

router.get('/jobs', getMyJobs);
router.post('/jobs', createJob);
router.put('/jobs/:id', validateObjectId('id'), updateJob);
router.delete('/jobs/:id', validateObjectId('id'), deleteJob);

router.get('/jobs/:id/applicants', validateObjectId('id'), getJobApplicants);
router.post('/jobs/:id/applicants/:applicantId/:action', validateObjectId('id', 'applicantId'), updateApplicantStatus);
router.put('/applications/:id/status', validateObjectId('id'), async (req, res, next) => {
  // Bug #5 fixed — the old code set req.params.id = req.body.jobId which becomes
  // undefined when jobId is not supplied, breaking Job.findOne({ _id: undefined }).
  // The correct pattern: :id IS the applicationId; look up the job from the application.
  req.params.action = req.body.action || req.body.status;
  req.params.applicantId = req.params.id;
  // Leave req.params.id intact — updateApplicantStatus will resolve the job
  // from the application document itself (it already does Application.findOne({ _id: applicantId }))
  return updateApplicantStatus(req, res, next);
});
router.put('/applications/:id/interview', validateObjectId('id'), scheduleInterview);

router.get('/candidates/:id', validateObjectId('id'), getCandidateProfile);
router.get('/dashboard/stats', getDashboardStats);
router.get('/interviews', getEmployerInterviews);

module.exports = router;
