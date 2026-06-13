export type UserRole = 'ADMIN' | 'WORKER';

export interface LoginResponse {
  token: string;
  id: number;
  login: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface UserProfile {
  id: number;
  login: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: UserRole;
  token?: string | null;
}

export interface UpdateUserProfilePayload {
  login: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  currentPassword: string | null;
  newPassword: string | null;
}

export interface AdminUser {
  id: number;
  login: string;
  role: UserRole;
  email: string | null;
  isBlocked: boolean;
}

export interface CreateAdminUserPayload {
  login: string;
  password: string;
  role: UserRole;
  email?: string | null;
}

export interface UpdateUserBlockedPayload {
  isBlocked: boolean;
}

export interface ResetUserPasswordResponse {
  userId: number;
  generatedPassword: string;
}
