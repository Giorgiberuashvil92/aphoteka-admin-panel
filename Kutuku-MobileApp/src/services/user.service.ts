import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getAuthHeaders } from '@/src/config/api.config';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  createdAt?: string;
};

const USE_API = true;
const TOKEN_KEY = '@kutuku_access_token';

class UserServiceClass {
  private USERS_KEY = '@kutuku_users';
  private CURRENT_USER_KEY = '@kutuku_current_user';

  getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  setAccessToken(token: string): Promise<void> {
    return AsyncStorage.setItem(TOKEN_KEY, token);
  }

  // Get all registered users (local only)
  async getUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Check if email exists (local list when !USE_API; when USE_API backend returns error on register)
  async emailExists(email: string): Promise<boolean> {
    if (USE_API) return false;
    const users = await this.getUsers();
    return users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  // Register new user (API ან ლოკალური)
  async register(firstName: string, lastName: string, email: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    if (USE_API) {
      try {
        const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.auth.registerMobile, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ firstName, lastName, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message || data.error || 'რეგისტრაცია ვერ მოხერხდა' };
        }
        const user: User = { id: data.user.id, firstName: data.user.firstName, lastName: data.user.lastName, email: data.user.email };
        await this.setCurrentUser(user);
        await this.setAccessToken(data.accessToken);
        return { success: true, message: 'Registration successful', user };
      } catch (e: any) {
        return { success: false, message: e.message || 'ქსელის შეცდომა' };
      }
    }
    try {
      const exists = await this.emailExists(email);
      if (exists) return { success: false, message: 'This email is already registered' };
      const newUser: User = { id: Date.now().toString(), firstName, lastName, email: email.toLowerCase(), password: password, createdAt: new Date().toISOString() };
      const users = await this.getUsers();
      users.push(newUser);
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return { success: true, message: 'Registration successful', user: newUser };
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login user (API ან ლოკალური)
  async login(emailOrPhone: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    if (USE_API) {
      try {
        const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.auth.loginMobile, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ emailOrPhone: emailOrPhone.trim(), password }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, message: data.message || data.error || 'Invalid email or password' };
        }
        const user: User = { id: data.user.id, firstName: data.user.firstName, lastName: data.user.lastName, email: data.user.email };
        await this.setCurrentUser(user);
        await this.setAccessToken(data.accessToken);
        return { success: true, message: 'Login successful', user };
      } catch (e: any) {
        return { success: false, message: e.message || 'ქსელის შეცდომა' };
      }
    }
    try {
      const users = await this.getUsers();
      const user = users.find((u) => u.email.toLowerCase() === emailOrPhone.toLowerCase() && u.password === password);
      if (!user) return { success: false, message: 'Invalid email or password' };
      await this.setCurrentUser(user);
      return { success: true, message: 'Login successful', user };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Set current logged in user
  async setCurrentUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  // Get current logged in user (from cache)
  async getCurrentUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /** JWT-ით პაროლის შეცვლა (POST /auth/change-password) */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!USE_API) {
      return {
        ok: false,
        message: 'პაროლის შეცვლა მხოლოდ სერვერთან კავშირისასაა ხელმისაწვდომი',
      };
    }
    try {
      const token = await this.getAccessToken();
      if (!token) {
        return { ok: false, message: 'საჭიროა შესვლა' };
      }
      const res = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.auth.changePassword}`,
        {
          method: 'POST',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ currentPassword, newPassword }),
        },
      );
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (!res.ok) {
        const msg =
          body && typeof body === 'object' && 'message' in body
            ? Array.isArray((body as { message: unknown }).message)
              ? (body as { message: string[] }).message.join(', ')
              : String((body as { message: string }).message)
            : `HTTP ${res.status}`;
        return { ok: false, message: msg };
      }
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'ქსელის შეცდომა',
      };
    }
  }

  /** ბაზიდან პროფილის ჩატვირთვა (GET /auth/me) */
  async fetchProfile(): Promise<User | null> {
    if (!USE_API) return this.getCurrentUser();
    try {
      const token = await this.getAccessToken();
      if (!token) return this.getCurrentUser();
      const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.auth.me, {
        headers: getAuthHeaders(token),
      });
      if (!res.ok) return this.getCurrentUser();
      const data = await res.json();
      const parts = (data.fullName || '').trim().split(/\s+/);
      const user: User = {
        id: data.id,
        firstName: data.firstName ?? parts[0] ?? data.fullName ?? '',
        lastName: data.lastName ?? parts.slice(1).join(' ') ?? '',
        email: data.email ?? '',
      };
      await this.setCurrentUser(user);
      return user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return this.getCurrentUser();
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
      if (USE_API) await AsyncStorage.removeItem(TOKEN_KEY);
      console.log('User logged out');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
    if (USE_API) {
      try {
        const token = await this.getAccessToken();
        if (!token) return false;

        const fullName = [updates.firstName, updates.lastName]
          .filter((s) => (s ?? '').trim())
          .join(' ')
          .trim();

        const payload: { email?: string; fullName?: string } = {};
        if (updates.email != null && updates.email.trim()) {
          payload.email = updates.email.trim();
        }
        if (fullName) {
          payload.fullName = fullName;
        }

        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.users.update(userId)}`;
        const res = await fetch(url, {
          method: 'PATCH',
          headers: getAuthHeaders(token),
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          return false;
        }

        const currentUser = await this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          await this.setCurrentUser({
            ...currentUser,
            firstName: updates.firstName ?? currentUser.firstName,
            lastName: updates.lastName ?? currentUser.lastName,
            email: updates.email != null ? updates.email.trim() : currentUser.email,
          });
        }
        return true;
      } catch (error) {
        console.error('Error updating profile:', error);
        return false;
      }
    }

    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        return false;
      }

      users[userIndex] = { ...users[userIndex], ...updates };
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        await this.setCurrentUser(users[userIndex]);
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  // Clear all users (for testing)
  async clearAllUsers(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USERS_KEY);
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
      console.log('All users cleared');
    } catch (error) {
      console.error('Error clearing users:', error);
    }
  }
}

export const UserService = new UserServiceClass();
