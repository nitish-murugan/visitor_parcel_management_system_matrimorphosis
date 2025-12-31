import bcrypt from "bcrypt";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/db";

export type UserRole = "admin" | "guard" | "resident";

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  passwordHash: string
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};

type UserRow = RowDataPacket & {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: UserRole;
  is_active: number;
  created_at: Date;
  updated_at: Date;
};

const mapRowToUser = (row: UserRow): User => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  passwordHash: row.password_hash,
  role: row.role,
  isActive: row.is_active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const createUser = async (input: CreateUserInput): Promise<User> => {
  const passwordHash = await hashPassword(input.password);
  const role = input.role ?? "resident";
  const isActive = input.isActive ?? true;

  const [result] = await db.execute<ResultSetHeader>(
    `INSERT INTO users (full_name, email, phone, password_hash, role, is_active)
     VALUES (:full_name, :email, :phone, :password_hash, :role, :is_active)`,
    {
      full_name: input.fullName,
      email: input.email,
      phone: input.phone || null,
      password_hash: passwordHash,
      role,
      is_active: isActive ? 1 : 0,
    }
  );

  const newId = result.insertId;
  const created = await getUserById(newId);
  if (!created) {
    throw new Error("Failed to load newly created user");
  }
  return created;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const [rows] = await db.query<UserRow[]>(
    `SELECT id, full_name, email, phone, password_hash, role, is_active, created_at, updated_at
     FROM users WHERE id = :id LIMIT 1`,
    { id }
  );
  if (!rows.length) return null;
  return mapRowToUser(rows[0]);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await db.query<UserRow[]>(
    `SELECT id, full_name, email, phone, password_hash, role, is_active, created_at, updated_at
     FROM users WHERE email = :email LIMIT 1`,
    { email }
  );
  if (!rows.length) return null;
  return mapRowToUser(rows[0]);
};

export const findUserByCredentials = async (
  email: string,
  password: string
): Promise<User | null> => {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const matches = await verifyPassword(password, user.passwordHash);
  return matches ? user : null;
};

export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const [rows] = await db.query<UserRow[]>(
    `SELECT id, full_name, email, phone, password_hash, role, is_active, created_at, updated_at
     FROM users WHERE role = :role AND is_active = 1
     ORDER BY full_name ASC`,
    { role }
  );
  return rows.map(mapRowToUser);
};
