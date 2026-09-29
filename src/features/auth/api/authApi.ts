import { apiClient } from '@/shared/api/apiClient.ts';
import { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/index.ts';
import { User } from '@/shared/types/index.ts';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/api/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    apiClient.post<AuthResponse>('/api/auth/register', credentials),

  logout: () => apiClient.post<{ success: boolean }>('/api/auth/logout'),

  getMe: () => apiClient.get<{ user: User }>('/api/auth/me'),

  updateProfile: (data: { displayName?: string; preferences?: Record<string, any> }) =>
    apiClient.patch<{ success: boolean; user: User }>('/api/auth/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<{ success: boolean; message: string }>('/api/auth/password', data),
};
