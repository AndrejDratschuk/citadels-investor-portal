import { UserRole } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fundId: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Session {
  user: User;
  accessToken: string;
}

