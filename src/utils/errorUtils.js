// ==================== SRC/UTILS/ERRORUTILS.JS ====================
class AppError extends Error {
  constructor(message, statusCode, originalError= null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

     if (originalError instanceof Error) {
      this.originalError = originalError;
      this.stack = originalError.stack; // Optional: override with original stack
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = { AppError, catchAsync };