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
   * Sender.ge send პასუხები:
   * - ტექსტი `1`
   * - `{ messageId, status: 1 }`
   * - `{ data: [{ messageId, statusId: 1, qnt }] }` — ფაქტობრივი API ფორმატი
   */
  private parseSendResponse(raw: string): { ok: boolean; messageId?: string } {
    if (raw === '1' || /^1(\s|$|,|;)/.test(raw)) {
      return { ok: true };
    }

    try {
      const j = JSON.parse(raw) as Record<string, unknown>;

      const topMessageId =
        typeof j.messageId === 'string' ? j.messageId : undefined;
      const topStatus = j.status ?? j.statusId;
      if (topStatus === 1 || topStatus === '1') {
        return { ok: true, messageId: topMessageId };
      }

      const data = j.data;
      if (Array.isArray(data) && data.length > 0) {
        const row = data[0] as Record<string, unknown>;
        const messageId =
          typeof row.messageId === 'string' ? row.messageId : topMessageId;
        const statusId = row.statusId ?? row.status;
        if (statusId === 1 || statusId === '1') {
          return { ok: true, messageId };
        }
      }
    } catch {
      /* არა-JSON */
    }

    const ok =
      /"statusId"\s*:\s*1/.test(raw) ||
      /"status"\s*:\s*1/.test(raw) ||
      /success/i.test(raw);

    return { ok };
  }

  /** @param smsno 1 — რეკლამა, 2 — საინფორმაციო (OTP-სთვის უკეთესია 2) */
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

    const parsed = this.parseSendResponse(trimmed);
    if (parsed.ok) {
      return { ok: true, raw: trimmed, messageId: parsed.messageId };
    }

    this.logger.warn(`Sender.ge უცნობი პასუხი: ${trimmed.slice(0, 200)}`);
    return { ok: false, raw: trimmed, messageId: parsed.messageId };
  }
}
