const { Router } = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { upload, uploadCert } = require('../middleware/uploadMiddleware');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  getProfile,
  updateProfile,
  uploadResume,
  uploadCertificate,
  getRecommendations,
  getApplications,
  withdrawApplication,
  getDashboardStats,
} = require('../controllers/jobSeekerController');

const router = Router();

router.use(protect, restrict('jobseeker'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/resume/upload', upload.single('file'), uploadResume);
router.post('/resume', upload.single('file'), uploadResume);
router.post('/certifications/:index/upload', uploadCert.single('file'), uploadCertificate);
router.get('/recommendations', getRecommendations);
router.get('/applications', getApplications);
router.delete('/applications/:id', validateObjectId('id'), withdrawApplication);
router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
