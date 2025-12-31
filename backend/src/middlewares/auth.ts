import { NextFunction, Request, Response } from "express";
import { getUserById, User } from "../models/user";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
  user?: User;
  tokenPayload?: JwtPayload;
}

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await getUserById(payload.sub);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "User not found or inactive" });
  }

  req.user = user;
  req.tokenPayload = payload;
  return next();
};

export const requireRoles = (...roles: User["role"][]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
};
