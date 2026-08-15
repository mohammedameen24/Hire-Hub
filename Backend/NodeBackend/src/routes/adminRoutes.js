const { Router } = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  getDashboardStats,
  getUsers,
  handleUserAction,
  getFlaggedJobs,
  handleFlaggedJobAction,
  getAnalytics,
} = require('../controllers/adminController');

const router = Router();

router.use(protect, restrict('admin'));

router.get('/dashboard/stats', getDashboardStats);

router.get('/users', getUsers);
router.post('/users/:id/:action', validateObjectId('id'), handleUserAction);
router.put('/users/:id/status', validateObjectId('id'), async (req, res, next) => {
  req.params.action = req.body.action || req.body.status;
  return handleUserAction(req, res, next);
});

router.get('/flagged-jobs', getFlaggedJobs);
router.post('/flagged-jobs/:id/:action', validateObjectId('id'), handleFlaggedJobAction);
router.put('/jobs/:id/review', validateObjectId('id'), handleFlaggedJobAction);
router.put('/flagged-jobs/:id', validateObjectId('id'), async (req, res, next) => {
  req.params.action = req.body.action;
  return handleFlaggedJobAction(req, res, next);
});

router.get('/analytics', getAnalytics);

module.exports = router;
