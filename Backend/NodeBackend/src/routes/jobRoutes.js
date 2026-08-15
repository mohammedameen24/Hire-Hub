const { Router } = require('express');
const { protect } = require('../middleware/authMiddleware');
const { restrict } = require('../middleware/roleMiddleware');
const { validateObjectId } = require('../middleware/validateObjectId');
const {
  getJobs,
  getJobById,
  applyToJob,
  getJobMatchScore,
} = require('../controllers/jobController');

const router = Router();

router.get('/', getJobs);
router.get('/:id', validateObjectId('id'), getJobById);
router.post('/:id/apply', validateObjectId('id'), protect, restrict('jobseeker'), applyToJob);
router.get('/:id/match-score', validateObjectId('id'), protect, restrict('jobseeker'), getJobMatchScore);

module.exports = router;
