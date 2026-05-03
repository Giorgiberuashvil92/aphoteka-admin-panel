// OTP: მხოლოდ ბექენდი + [Sender.ge](https://sender.ge/docs/api.php) SMS — კოდი არ ჩანს აპის ეკრანზე.

import { API_CONFIG } from '@/src/config/api.config';

const SEND_OTP_PATH = '/auth/send-verification-otp';
const VERIFY_OTP_PATH = '/auth/verify-verification-otp';

export class EmailService {
  /**
   * `register` / `forgot`: SMS `phone`-ზე (`SENDER_GE_API_KEY` ბექენდზე). ლოკალური/ეკრანზე კოდის ჩვენება არ არის.
   */
  static async sendOTP(
    email: string,
    purpose: 'register' | 'forgot',
    options?: { phone?: string },
  ): Promise<{ success: boolean; error?: string; channel?: 'sms' }> {
    const phone = options?.phone?.trim();
    if (!phone) {
      return {
        success: false,
        error:
          purpose === 'forgot'
            ? 'მიუთითეთ ტელეფონი (იგივე რაც ანგარიშზეა რეგისტრაციისას).'
            : 'მიუთითეთ ტელეფონი SMS-ისთვის.',
      };
    }

    const api = await this.trySendOtpViaBackend(
      email.trim().toLowerCase(),
      phone,
      purpose,
    );
    if (api.ok) {
      return { success: true, channel: 'sms' };
    }
    return {
      success: false,
      error: api.error || 'კოდის გაგზავნა ვერ მოხერხდა',
    };
  }

  private static async trySendOtpViaBackend(
    email: string,
    phone: string,
    purpose: 'register' | 'forgot',
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${SEND_OTP_PATH}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, phone, purpose }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
      if (res.ok) {
        return { ok: true };
      }
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : typeof data.message === 'string'
          ? data.message
          : `HTTP ${res.status}`;
      return { ok: false, error: msg };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'ქსელის შეცდომა',
      };
    }
  }

  static async verifyOTP(
    email: string,
    code: string,
  ): Promise<{ success: boolean; error?: string; resetToken?: string }> {
    const emailKey = email.trim().toLowerCase();
    const trimmed = code.trim();

    const backend = await this.tryVerifyOtpViaBackend(emailKey, trimmed);
    if (backend.verified) {
      return {
        success: true,
        ...(backend.resetToken ? { resetToken: backend.resetToken } : {}),
      };
    }
    return { success: false, error: backend.error || 'ვერიფიკაცია ვერ მოხერხდა' };
  }

  private static async tryVerifyOtpViaBackend(
    email: string,
    code: string,
  ): Promise<{ verified: boolean; error?: string; resetToken?: string }> {
    try {
      const url = `${API_CONFIG.BASE_URL}${VERIFY_OTP_PATH}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string | string[];
        resetToken?: string;
      };
      if (res.ok) {
        const resetToken =
          typeof data.resetToken === 'string' && data.resetToken.length > 0
            ? data.resetToken
            : undefined;
        return { verified: true, ...(resetToken ? { resetToken } : {}) };
      }
      const msg = Array.isArray(data.message)
        ? data.message.join(', ')
        : typeof data.message === 'string'
          ? data.message
          : '';
      return { verified: false, error: msg || `HTTP ${res.status}` };
    } catch (e: unknown) {
      return {
        verified: false,
        error: e instanceof Error ? e.message : 'ქსელის შეცდომა',
      };
    }
  }
}
