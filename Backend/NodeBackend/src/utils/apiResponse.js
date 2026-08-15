/**
 * Consistent API response shape.
 * Spreads data directly into the response root for frontend compatibility.
 * Guards against any data key named 'success' overriding the outer flag.
 * Success:  { success: true, ...data, message? }
 * Error:    { success: false, message, detail, errors? }
 */

const sendSuccess = (res, data, statusCode = 200, message = '') => {
  // Mongoose documents must be serialized before spreading, otherwise
  // internal properties ($__, $isNew, _doc) leak into the response and
  // actual fields like skills, location, etc. become inaccessible.
  const serialized = data && typeof data.toJSON === 'function' ? data.toJSON() : data;

  // Remove any 'success' key from the payload to prevent it from
  // overriding our outer success: true flag.
  if (serialized && typeof serialized === 'object' && 'success' in serialized) {
    const { success: _removed, ...rest } = serialized;
    return res.status(statusCode).json({
      success: true,
      ...(message && { message }),
      ...rest,
    });
  }

  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    ...serialized,
  });
};

const sendError = (res, message, statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    // Also include 'detail' for compatibility with the frontend's err.response?.data?.detail
    detail: message,
    ...(errors && { errors }),
  });
};

module.exports = { sendSuccess, sendError };
