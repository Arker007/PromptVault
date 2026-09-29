import { User } from '@/shared/types/index.ts';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
