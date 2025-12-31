import { Request, Response, NextFunction } from "express";
import { AppError, sendErrorResponse } from "../utils/errors";

/**
 * Error handling middleware
 * Must be registered after all other middlewares and routes
 */
export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  logError(error);

  // Send error response
  if (error instanceof AppError) {
    sendErrorResponse(res, error);
  } else {
    // Handle unknown errors
    sendErrorResponse(res, new AppError("Internal server error", 500));
  }
};

/**
 * Async error wrapper to catch promise rejections
 * Wrap route handlers with this to automatically catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log error to console and file
 */
const logError = (error: Error) => {
  const timestamp = new Date().toISOString();
  const errorLog = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  // Log to console
  console.error("❌ Error:", JSON.stringify(errorLog, null, 2));

  // TODO: Log to file (winston, bunyan, etc.)
  // logger.error(errorLog);
};
