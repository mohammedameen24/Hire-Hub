const { sendError } = require('../utils/apiResponse');

/**
 * Usage: restrict('employer') or restrict('admin') or restrict('jobseeker', 'admin')
 */
const restrict = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        403
      );
    }
    next();
  };
};

module.exports = { restrict };
