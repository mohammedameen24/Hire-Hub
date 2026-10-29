const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

/**
 * Express middleware that validates route params are valid MongoDB ObjectIds.
 * Usage: router.get('/:id', validateObjectId('id'), handler)
 * Or validate multiple: validateObjectId('id', 'applicantId')
 *
 * Bug #18 fixed — previously let undefined params through silently.
 * Now returns 400 for both invalid-format and missing required params.
 */
const validateObjectId = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const value = req.params[param];
    if (!value) {
      return sendError(res, `Missing required route parameter '${param}'.`, 400);
    }
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return sendError(res, `Invalid ID format for parameter '${param}'.`, 400);
    }
  }
  next();
};

module.exports = { validateObjectId };
