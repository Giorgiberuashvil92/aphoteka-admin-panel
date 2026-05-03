import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const SEND_URL = 'https://sender.ge/api/send.php';

/**
 * [Sender.ge](https://sender.ge/docs/api.php) — SMS საქართველოში.
 * `apikey` იგივეა რაც პანელში გიგზავნიან (შეიძლება შეიცავდეს სენდერის სახელს).
 */
@Injectable()
export class SenderGeService {
  private readonly logger = new Logger(SenderGeService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return !!this.config.get<string>('SENDER_GE_API_KEY')?.trim();
  }

  private apiKey(): string {
    const k = this.config.get<string>('SENDER_GE_API_KEY')?.trim();
    if (!k) {
      throw new Error('SENDER_GE_API_KEY არ არის დაყენებული');
    }
    return k;
  }

  /**
   * მობილური ნომერი 9 ციფრით (5XXXXXXXX), +995 და სხვა ფორმატებიდან.
   */
  normalizeGeorgianMobile9(raw: string): string | null {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('5')) return digits;
    if (digits.length === 12 && digits.startsWith('995'))
      return digits.slice(3);
    if (digits.length === 13 && digits.startsWith('995'))
      return digits.slice(4);
    return null;
  }

  /**
   * @param smsno 1 — რეკლამა, 2 — საინფორმაციო (OTP-სთვის უკეთესია 2)
   */
  async sendSms(
    destination9: string,
    content: string,
    smsno: 1 | 2 = 2,
    priority: 0 | 1 = 0,
  ): Promise<{ ok: boolean; raw: string; messageId?: string }> {
    const body = new URLSearchParams({
      apikey: this.apiKey(),
      smsno: String(smsno),
      destination: destination9,
      content,
      priority: String(priority),
    });

    const res = await fetch(SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const raw = await res.text();
    const trimmed = raw.trim();

    if (!res.ok) {
      this.logger.warn(
        `Sender.ge HTTP ${res.status}: ${trimmed.slice(0, 200)}`,
      );
      return { ok: false, raw: trimmed };
    }

    let messageId: string | undefined;
    try {
      const j = JSON.parse(trimmed) as { messageId?: string; status?: number };
      if (typeof j.messageId === 'string') messageId = j.messageId;
      if (j.status === 1) {
        return { ok: true, raw: trimmed, messageId };
      }
    } catch {
      /* არა-JSON */
    }

    const ok =
      trimmed === '1' ||
      /^1(\s|$|,|;)/.test(trimmed) ||
      /"status"\s*:\s*1/.test(trimmed) ||
      /success/i.test(trimmed);

    if (!ok) {
      this.logger.warn(`Sender.ge უცნობი პასუხი: ${trimmed.slice(0, 200)}`);
    }

    return { ok, raw: trimmed, messageId };
  }
}
