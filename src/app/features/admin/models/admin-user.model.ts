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
}

export interface UpdateUserProfilePayload {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface AdminUser {
  id: number;
  login: string;
  role: UserRole;
}
