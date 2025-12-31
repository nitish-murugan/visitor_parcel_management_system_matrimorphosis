import dotenv from "dotenv";

dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: numberFromEnv(process.env.PORT, 3000),
  jwtSecret: process.env.JWT_SECRET || "change-me",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: numberFromEnv(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vpms",
  },
};
