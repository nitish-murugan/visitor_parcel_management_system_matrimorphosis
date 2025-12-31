import { Request, Response, NextFunction } from "express";
import {
  CreateUserInput,
  findUserByCredentials,
  User,
  createUser,
  getUserByEmail,
  getUsersByRole,
} from "../models/user";
import { signAccessToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../middlewares/auth";
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  AppError,
} from "../utils/errors";

const toPublicUser = (user: User) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, email, password, phone, role } =
      req.body as CreateUserInput;

    // Validate required fields
    const errors: string[] = [];
    if (!fullName) errors.push("Full name is required");
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    if (errors.length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format", [
        "Email must be a valid email address",
      ]);
    }

    // Validate password strength
    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters long", [
        "Password length must be >= 6",
      ]);
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists", [
        "Email already in use",
      ]);
    }

    // Default role to 'resident' for self-registration
    const userRole =
      role && ["resident", "guard"].includes(role) ? role : "resident";

    // Create new user
    const newUser = await createUser({
      fullName,
      email,
      phone,
      password,
      role: userRole,
      isActive: true,
    });

    // Generate token
    const token = signAccessToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        token,
        user: toPublicUser(newUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as Partial<CreateUserInput>;

    const errors: string[] = [];
    if (!email) errors.push("Email is required");
    if (!password) errors.push("Password is required");

    if (errors.length > 0) {
      throw new ValidationError("Validation failed", errors);
    }

    const user = await findUserByCredentials(email!, password!);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("User account is inactive");
    }

    const token = signAccessToken(user);
    return res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("User not authenticated");
    }

    return res.json({
      success: true,
      data: {
        user: toPublicUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: AuthenticatedRequest, res: Response) => {
  // Stateless JWT logout: client should discard token; server returns success.
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const getResidents = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const residents = await getUsersByRole("resident");
    const residentsData = residents.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
    }));
    return res.json({ success: true, residents: residentsData });
  } catch (error) {
    console.error("Error fetching residents:", error);
    return res.status(500).json({ message: "Failed to fetch residents" });
  }
};
