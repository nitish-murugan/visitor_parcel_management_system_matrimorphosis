export type UserRole = 'admin' | 'guard' | 'resident';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  token?: string;
  user?: User;
  data?: {
    token: string;
    user: User;
  };
}
