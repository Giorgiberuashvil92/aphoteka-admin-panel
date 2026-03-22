import { api } from './client';
import { User, UserRole } from '@/types';

export interface RegisterDto {
  role: UserRole;
  phoneNumber: string;
  password: string;
  email?: string;
  fullName?: string;
  warehouseId?: string;
}

export interface LoginDto {
  phoneNumber: string;
  password: string;
}

export interface ForgotPasswordDto {
  phoneNumber: string;
}

export interface ResetPasswordDto {
  phoneNumber: string;
  resetCode: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetCode?: string; // Only in development
}

export const authApi = {
  // Register new user
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/register', data);
  },

  // Login user
  login: async (data: LoginDto): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', data);
  },

  // Forgot password - request reset code
  forgotPassword: async (
    data: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponse> => {
    return api.post<ForgotPasswordResponse>('/auth/forgot-password', data);
  },

  // Reset password with reset code
  resetPassword: async (data: ResetPasswordDto): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/reset-password', data);
  },

  // Get current authenticated user
  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },
};
