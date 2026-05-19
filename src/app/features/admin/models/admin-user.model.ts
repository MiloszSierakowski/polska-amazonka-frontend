export type UserRole = 'ADMIN' | 'WORKER';

export interface LoginResponse {
  token: string;
  id: number;
  login: string;
  role: UserRole;
}

export interface AdminUser {
  id: number;
  login: string;
  role: UserRole;
}
