import { Response } from "express";

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}

export class AppError extends Error {
  statusCode: number;
  errors: string[];

  constructor(
    message: string,
    statusCode: number = 500,
    errors: string[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errors: string[] = []) {
    super(message, 400, errors);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, errors: string[] = []) {
    super(message, 409, errors);
    this.name = "ConflictError";
  }
}

export const sendErrorResponse = (
  res: Response,
  error: AppError | Error
): Response => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors.length > 0 ? error.errors : undefined,
    });
  }

  // Handle unexpected errors
  console.error("Unexpected error:", error);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
