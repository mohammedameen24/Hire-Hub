const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

/**
 * Express middleware that validates route params are valid MongoDB ObjectIds.
 * Usage: router.get('/:id', validateObjectId('id'), handler)
 * Or validate multiple: validateObjectId('id', 'applicantId')
 */
const validateObjectId = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const value = req.params[param];
    if (value && !mongoose.Types.ObjectId.isValid(value)) {
      return sendError(res, `Invalid ID format for parameter '${param}'.`, 400);
    }
  }
  next();
};

module.exports = { validateObjectId };
