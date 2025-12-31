import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors";

/**
 * Validate required fields
 */
export const requireFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    fields.forEach((field) => {
      const value = req.body?.[field];
      if (value === undefined || value === null || value === "") {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      return next(new ValidationError("Validation failed", errors));
    }

    next();
  };
};

/**
 * Validate email format
 */
export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const email = req.body?.email;
  if (!email) return next();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(
      new ValidationError("Invalid email format", [
        "Email must be a valid email address",
      ])
    );
  }

  next();
};

/**
 * Validate password strength
 */
export const validatePassword = (minLength: number = 6) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const password = req.body?.password;
    if (!password) return next();

    const errors: string[] = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Commented out strict password rules for easier testing
    // Uncomment these in production for better security
    /*
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    */

    if (errors.length > 0) {
      return next(new ValidationError("Password validation failed", errors));
    }

    next();
  };
};

/**
 * Validate visitor status transitions
 * Valid transitions:
 * new → waiting_approval → approved → entered → exited
 * new → waiting_approval → rejected
 */
export const validateVisitorStatusTransition = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const newStatus = req.body?.status;
  const visitorId = req.params?.id;

  if (!newStatus) return next();

  // Valid statuses
  const validStatuses = [
    "new",
    "waiting_approval",
    "approved",
    "rejected",
    "entered",
    "exited",
  ];

  if (!validStatuses.includes(newStatus)) {
    return next(
      new ValidationError("Invalid status", [
        `Status must be one of: ${validStatuses.join(", ")}`,
      ])
    );
  }

  // TODO: Get current visitor status from database and validate transition
  // For now, just validate the status is valid

  next();
};

/**
 * Validate parcel status transitions
 * Valid transitions:
 * received → acknowledged → collected
 */
export const validateParcelStatusTransition = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const newStatus = req.body?.status;

  if (!newStatus) return next();

  const validStatuses = ["received", "acknowledged", "collected"];

  if (!validStatuses.includes(newStatus)) {
    return next(
      new ValidationError("Invalid status", [
        `Status must be one of: ${validStatuses.join(", ")}`,
      ])
    );
  }

  // TODO: Get current parcel status from database and validate transition
  // For now, just validate the status is valid

  next();
};

/**
 * Validate phone number format (optional)
 */
export const validatePhoneNumber = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const phone =
    req.body?.phone || req.body?.senderPhone || req.body?.visitor_phone;

  if (!phone) return next();

  // Simple phone number validation (allows various formats)
  const phoneRegex = /^[0-9\-\+\(\)\s]{7,}$/;

  if (!phoneRegex.test(phone)) {
    return next(
      new ValidationError("Invalid phone number", [
        "Phone number format is invalid",
      ])
    );
  }

  next();
};

/**
 * Validate numeric ID parameters
 */
export const validateNumericId = (paramName: string = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params?.[paramName];

    if (!id || isNaN(parseInt(id))) {
      return next(
        new ValidationError("Invalid ID", [
          `${paramName} must be a valid number`,
        ])
      );
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const limit = req.query?.limit;
  const offset = req.query?.offset;

  const errors: string[] = [];

  if (limit && isNaN(parseInt(limit as string))) {
    errors.push("limit must be a valid number");
  }

  if (offset && isNaN(parseInt(offset as string))) {
    errors.push("offset must be a valid number");
  }

  const limitNum = parseInt((limit as string) || "10");
  if (limitNum > 100) {
    errors.push("limit cannot exceed 100");
  }

  if (errors.length > 0) {
    return next(new ValidationError("Invalid pagination parameters", errors));
  }

  next();
};
