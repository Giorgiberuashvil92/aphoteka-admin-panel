import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getAuthHeaders } from '@/src/config/api.config';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Mongo `Buyer` — მყიდველის პროფილი რეგისტრაციისას */
  buyerId?: string;
  /** Balance.ge Exchange Clients `uid` */
  balanceBuyerUid?: string;
  password?: string;
  createdAt?: string;
};

/** მობილური `POST /auth/register-mobile` სხეული */
export type RegisterMobilePayload =
  | {
      accountType: 'individual';
      firstName: string;
      lastName: string;
      personalId: string;
      address: string;
      country?: string;
      email: string;
      phone: string;
      password: string;
    }
  | {
      accountType: 'legal';
      companyName: string;
      legalId: string;
      address: string;
      representative?: string;
      country?: string;
      email: string;
      phone: string;
      password: string;
    };

const USE_API = true;
const TOKEN_KEY = '@kutuku_access_token';

/** ელფოსტა ან ტელეფონი API-სთვის (GE მობილური 5XXXXXXXX → +995...) */
function normalizeLoginIdentifier(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (t.includes('@')) return t.toLowerCase();
  const digits = t.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('5')) return `+995${digits}`;
  if (digits.length === 12 && digits.startsWith('995')) return `+${digits}`;
  return t;
}

function formatApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const m = (data as { message?: unknown; error?: string }).message;
  let raw: string;
  if (Array.isArray(m)) raw = m.filter(Boolean).join(', ') || fallback;
  else if (typeof m === 'string' && m.trim()) raw = m;
  else {
    const e = (data as { error?: string }).error;
    raw = typeof e === 'string' && e.trim() ? e : fallback;
  }
  if (/invalid email\/phone or password/i.test(raw)) {
    return 'ელფოსტა/ტელეფონი ან პაროლი არასწორია';
  }
  if (/this phone number is already registered/i.test(raw)) {
    return 'ეს ტელეფონის ნომერი უკვე რეგისტრირებულია';
  }
  if (/არასწორი ტელეფონის ნომერი/i.test(raw)) {
    return 'არასწორი ტელეფონის ნომერი';
  }
  if (/personalId must be 11 digits/i.test(raw)) {
    return 'პირადი ნომერი უნდა იყოს ზუსტად 11 ციფრი';
  }
  return raw;
}

function logOutgoingAuth(
  label: string,
  url: string,
  body: Record<string, unknown>,
): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const safe = { ...body };
  if (typeof safe.password === 'string') {
    safe.password = `[${safe.password.length} სიმბოლო]`;
  }
  console.log(`[UserService] ${label}\n  URL: ${url}\n  Body: ${JSON.stringify(safe, null, 2)}`);
}

class UserServiceClass {
  private USERS_KEY = '@kutuku_users';
  private CURRENT_USER_KEY = '@kutuku_current_user';

  getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  setAccessToken(token: string): Promise<void> {
    return AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async getUsers(): Promise<User[]> {
    try {
      const usersJson = await AsyncStorage.getItem(this.USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async emailExists(email: string): Promise<boolean> {
    if (USE_API) return false;
    const users = await this.getUsers();
    return users.some((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  async register(
    data: RegisterMobilePayload,
  ): Promise<{ success: boolean; message: string; user?: User }> {
    const email = data.email.trim().toLowerCase();
    if (USE_API) {
      try {
        const url = API_CONFIG.BASE_URL + API_CONFIG.endpoints.auth.registerMobile;
        const payload: Record<string, unknown> = {
          accountType: data.accountType,
          email,
          phone: data.phone.trim(),
          password: data.password,
        };
        if (data.accountType === 'individual') {
          payload.firstName = data.firstName.trim();
          payload.lastName = data.lastName.trim();
          payload.personalId = data.personalId.replace(/\D/g, '');
          payload.address = data.address.trim();
        } else {
          payload.companyName = data.companyName.trim();
          payload.legalId = data.legalId.trim();
          payload.address = data.address.trim();
          const rep = data.representative?.trim();
          if (rep) payload.representative = rep;
        }
        const c = data.country?.trim();
        if (c) payload.country = c;
        logOutgoingAuth('POST register-mobile', url, payload);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const responseData = await res.json();
        if (!res.ok) {
          return {
            success: false,
            message: formatApiErrorMessage(responseData, 'რეგისტრაცია ვერ მოხერხდა'),
          };
        }
        const ru = responseData.user as Record<string, unknown>;
        const regBal =
          typeof ru.balanceBuyerUid === 'string' && ru.balanceBuyerUid.trim()
            ? ru.balanceBuyerUid.trim()
            : undefined;
        const user: User = {
          id: String(ru.id ?? ru._id ?? ''),
          firstName: String(ru.firstName ?? ''),
          lastName: String(ru.lastName ?? ''),
          email: String(ru.email ?? ''),
          ...(typeof ru.buyerId === 'string' && ru.buyerId ? { buyerId: ru.buyerId } : {}),
          ...(regBal ? { balanceBuyerUid: regBal } : {}),
        };
        await this.setCurrentUser(user);
        await this.setAccessToken(responseData.accessToken);
        return { success: true, message: 'Registration successful', user };
      } catch (e: any) {
        return { success: false, message: e.message || 'ქსელის შეცდომა' };
      }
    }
    try {
      const exists = await this.emailExists(email);
      if (exists) return { success: false, message: 'This email is already registered' };
      const firstName =
        data.accountType === 'individual' ? data.firstName.trim() : data.companyName.trim();
      const lastName =
        data.accountType === 'individual'
          ? data.lastName.trim()
          : (data.representative?.trim() || 'იურიდიული პირი');
      const newUser: User = {
        id: Date.now().toString(),
        firstName,
        lastName,
        email,
        password: data.password,
        createdAt: new Date().toISOString(),
      };
      const users = await this.getUsers();
      users.push(newUser);
      await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return { success: true, message: 'Registration successful', user: newUser };
    } catch {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login user (API ან ლოკალური)
  async login(emailOrPhone: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    if (USE_API) {
      try {
        const identifier = normalizeLoginIdentifier(emailOrPhone);
        const url = API_CONFIG.BASE_URL + API_CONFIG.endpoints.auth.loginMobile;
        const payload = { emailOrPhone: identifier, password };
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        let data: Record<string, unknown> = {};
        if (text) {
          try {
            data = JSON.parse(text) as Record<string, unknown>;
          } catch {
            return {
              success: false,
              message: res.ok ? 'სერვერის პასუხი არასწორია' : `HTTP ${res.status}`,
            };
          }
        }
        if (!res.ok) {
          return {
            success: false,
            message: formatApiErrorMessage(data, 'ელფოსტა/ტელეფონი ან პაროლი არასწორია'),
          };
        }
        const accessToken = data.accessToken;
        const rawUser = data.user as Record<string, unknown> | undefined;
        if (typeof accessToken !== 'string' || !accessToken.trim() || !rawUser) {
          return { success: false, message: 'სერვერის პასუხი არასრულია (token ან user)' };
        }
        const uid =
          (typeof rawUser.id === 'string' && rawUser.id) ||
          (typeof rawUser._id === 'string' && rawUser._id) ||
          '';
        const bal =
          typeof rawUser.balanceBuyerUid === 'string' && rawUser.balanceBuyerUid.trim()
            ? rawUser.balanceBuyerUid.trim()
            : undefined;
        const user: User = {
          id: uid,
          firstName: String(rawUser.firstName ?? ''),
          lastName: String(rawUser.lastName ?? ''),
          email: String(rawUser.email ?? rawUser.phoneNumber ?? identifier),
          ...(typeof rawUser.buyerId === 'string' && rawUser.buyerId
            ? { buyerId: rawUser.buyerId }
            : {}),
          ...(bal ? { balanceBuyerUid: bal } : {}),
        };
        if (!user.id) {
          return { success: false, message: 'სერვერის პასუხი არასწორია (user id)' };
        }
        await this.setCurrentUser(user);
        await this.setAccessToken(accessToken.trim());
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
    } catch {
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
      const data = (await res.json()) as Record<string, unknown>;
      const parts = String(data.fullName ?? '')
        .trim()
        .split(/\s+/);
      const uid =
        (typeof data.id === 'string' && data.id) ||
        (typeof data._id === 'string' && data._id) ||
        '';
      const meBal =
        typeof data.balanceBuyerUid === 'string' && data.balanceBuyerUid.trim()
          ? data.balanceBuyerUid.trim()
          : undefined;
      const user: User = {
        id: uid,
        firstName:
          (typeof data.firstName === 'string' && data.firstName) ||
          parts[0] ||
          String(data.fullName ?? '') ||
          '',
        lastName:
          (typeof data.lastName === 'string' && data.lastName) ||
          parts.slice(1).join(' ') ||
          '',
        email: typeof data.email === 'string' ? data.email : '',
        ...(typeof data.buyerId === 'string' && data.buyerId ? { buyerId: data.buyerId } : {}),
        ...(meBal ? { balanceBuyerUid: meBal } : {}),
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

  /** OTP-ის შემდეგ დაბრუნებული JWT — ახალი პაროლი */
  async resetPasswordWithToken(
    resetToken: string,
    newPassword: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.auth.resetPasswordWithToken}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      if (res.ok) {
        const m = data.message;
        const msg = Array.isArray(m) ? m.join(', ') : typeof m === 'string' ? m : '';
        return { ok: true, message: msg || undefined };
      }
      return {
        ok: false,
        message: formatApiErrorMessage(data, `HTTP ${res.status}`),
      };
    } catch (e: unknown) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : 'ქსელის შეცდომა',
      };
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
