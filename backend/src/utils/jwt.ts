import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/user";

export interface JwtPayload {
  sub: number;
  role: User["role"];
  email: string;
}

const ACCESS_TOKEN_EXPIRES_IN = "1d";

export const signAccessToken = (user: User): string => {
  const payload: JwtPayload = {
    sub: user.id,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.jwtSecret) as unknown as JwtPayload;
  } catch (_err) {
    return null;
  }
};
