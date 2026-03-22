// Email Service using EmailJS (Free!)
// Setup: https://www.emailjs.com/

import { Alert } from 'react-native';

// EmailJS Configuration
// Get these from https://dashboard.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_4u25e5x'; // e.g., 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_rd5ddnt';
const EMAILJS_PUBLIC_KEY = 'O7H_6kbnqZJLF0BVb'; 

// Mock Mode for testing without EmailJS setup
const MOCK_MODE = true; // 🔧 Temporarily enabled for debugging

export class EmailService {
  // Generate 4-digit OTP
  private static generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Store OTP temporarily (in-memory, for demo)
  private static otpStore = new Map<string, { code: string; expiresAt: number }>();

  // Send OTP to Email
  static async sendOTP(email: string, purpose: 'register' | 'forgot'): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      
      // Store OTP with 10 minute expiration
      this.otpStore.set(email, {
        code: otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });

      // MOCK MODE - for testing without EmailJS
      if (MOCK_MODE) {
        console.log('='.repeat(60));
        console.log('📧 MOCK EMAIL SENT');
        console.log('='.repeat(60));
        console.log('To:', email);
        console.log('Purpose:', purpose === 'register' ? 'Registration' : 'Password Reset');
        console.log('OTP Code:', otp);
        console.log('Expires in: 10 minutes');
        console.log('='.repeat(60));
        
        // Show OTP in alert for easy testing
        setTimeout(() => {
          Alert.alert(
            '🔢 Test Mode - OTP Code',
            `Email: ${email}\n\nYour verification code is:\n\n${otp}\n\n(This is test mode. In production, you'll receive this via email)`,
            [{ text: 'OK' }]
          );
        }, 500);
        
        return { success: true };
      }

      // REAL MODE - EmailJS via REST API
      const templateParams = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          otp_code: otp,
          purpose: purpose === 'register' ? 'Registration' : 'Password Reset',
          app_name: 'Kutuku',
          expiry_time: '10 minutes',
        }
      };

      console.log('Sending email with params:', templateParams);
      
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateParams),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('EmailJS Error Response:', errorText);
        throw new Error(`EmailJS Error: ${errorText}`);
      }

      console.log('Email sent successfully!');
      return { success: true };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { 
        success: false, 
        error: error.text || 'Failed to send verification email' 
      };
    }
  }

  // Verify OTP
  static verifyOTP(email: string, code: string): { success: boolean; error?: string } {
    const stored = this.otpStore.get(email);

    if (!stored) {
      return { 
        success: false, 
        error: 'No verification code found. Please request a new one.' 
      };
    }

    // Check expiration
    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(email);
      return { 
        success: false, 
        error: 'Verification code has expired. Please request a new one.' 
      };
    }

    // Verify code
    if (stored.code !== code) {
      return { 
        success: false, 
        error: 'Invalid verification code. Please try again.' 
      };
    }

    // Success - remove OTP
    this.otpStore.delete(email);
    return { success: true };
  }

  // Get stored OTP (for testing/debugging only)
  static getStoredOTP(email: string): string | null {
    const stored = this.otpStore.get(email);
    return stored ? stored.code : null;
  }

  // Clear expired OTPs (cleanup)
  static clearExpiredOTPs(): void {
    const now = Date.now();
    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(email);
      }
    }
  }
}

// Auto-cleanup expired OTPs every 5 minutes
setInterval(() => {
  EmailService.clearExpiredOTPs();
}, 5 * 60 * 1000);
