import { env } from '../config/env.js';

export function errorHandler(err, req, res, _next) {
  // Prevent logging credentials or tokens
  const isProd = env.NODE_ENV === 'production';
  
  if (!isProd) {
    console.error(`[Error Handler] ${req.method} ${req.url}:`, err);
  } else {
    console.error(`[Error Handler] ${req.method} ${req.url}: ${err.name || 'Error'} - ${err.message}`);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: `Invalid format for field '${err.path}'.`,
    });
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `Duplicate value entered for ${field}. It must be unique.`,
    });
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join('. '),
      details: messages,
    });
  }

  // Handle JSON parse error in body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body.',
    });
  }

  // Handle explicit HTTP Status errors
  const statusCode = err.statusCode || err.status || 500;
  const message = isProd && statusCode === 500 ? 'Internal Server Error' : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
