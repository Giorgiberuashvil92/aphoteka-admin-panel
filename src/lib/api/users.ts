import { User } from '@/types';
import { api } from './client';

export interface UsersResponse {
  data: User[];
}

export interface UserResponse {
  data: User;
}

export const usersApi = {
  // Get all users
  // Backend returns User[] directly, not { data: User[] }
  getAll: async (): Promise<User[] | UsersResponse> => {
    return api.get<User[] | UsersResponse>('/users');
  },

  // Get user by ID
  // Backend returns User directly, not { data: User }
  getById: async (id: string): Promise<User | UserResponse> => {
    return api.get<User | UserResponse>(`/users/${id}`);
  },

  // Create user
  create: async (user: Partial<User>): Promise<UserResponse> => {
    return api.post<UserResponse>('/users', user);
  },

  // Update user
  update: async (id: string, user: Partial<User>): Promise<UserResponse> => {
    return api.patch<UserResponse>(`/users/${id}`, user);
  },

  // Delete user
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/users/${id}`);
  },

  // Toggle user status
  toggleStatus: async (id: string): Promise<UserResponse> => {
    return api.patch<UserResponse>(`/users/${id}/toggle-status`);
  },
};
