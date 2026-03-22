// OTP Service using Backend API
// You need to create a backend server for this

const API_URL = 'https://your-backend-url.com';

export class OTPService {
  // Send OTP to Phone or Email
  static async sendOTP(emailOrPhone: string, type: 'register' | 'forgot'): Promise<any> {
    try {
      const isEmail = emailOrPhone.includes('@');
      
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: emailOrPhone,
          type: isEmail ? 'email' : 'phone',
          purpose: type,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send verification code' 
      };
    }
  }

  // Verify OTP
  static async verifyOTP(emailOrPhone: string, code: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: emailOrPhone,
          code: code,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid verification code');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid verification code' 
      };
    }
  }

  // Register User
  static async register(username: string, emailOrPhone: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          emailOrPhone,
          password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Register Error:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  }

  // Login User
  static async login(emailOrPhone: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrPhone,
          password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Login Error:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid credentials' 
      };
    }
  }

  // Reset Password
  static async resetPassword(emailOrPhone: string, newPassword: string, resetToken: string): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrPhone,
          newPassword,
          resetToken,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Reset Password Error:', error);
      return { 
        success: false, 
        error: error.message || 'Password reset failed' 
      };
    }
  }
}
