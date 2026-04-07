import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { BOG_INLINE } from '../config/bog-inline';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { BogPaymentInitDto } from './dto/bog-payment-init.dto';
import { buildBogExternalOrderIdForStatement } from './bog-external-order-id';

const TOKEN_URL =
  'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const ORDERS_URL = 'https://api.bog.ge/payments/v1/ecommerce/orders';

/** ტერმინალისთვის: გრძელი URL/სურათები არ გააფუჭოს წაკითხვადობა */
function cloneBodyForBogLog(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const o = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
  const pu = o.purchase_units as Record<string, unknown> | undefined;
  const basket = pu?.basket as Record<string, unknown>[] | undefined;
  if (Array.isArray(basket)) {
    for (const row of basket) {
      const img = row.image;
      if (typeof img === 'string' && img.length > 90) {
        row.image = `${img.slice(0, 90)}…`;
      }
    }
  }
  const redir = o.redirect_urls as Record<string, string> | undefined;
  if (redir && typeof redir === 'object') {
    for (const k of Object.keys(redir)) {
      const v = redir[k];
      if (typeof v === 'string' && v.length > 120) {
        redir[k] = `${v.slice(0, 120)}…`;
      }
    }
  }
  return o;
}

/**
 * BOG დოკში `expires_in` ტექსტურად „წამებია“, მაგალითში კი ხშირად იგივე ველი აბსოლუტური დროა (ms).
 * OIDC სტანდარტი: expires_in = TTL წამებში (მცირე რიცხვი).
 */
function bogTokenExpiresAtMs(now: number, expiresIn: unknown): number {
  if (
    typeof expiresIn !== 'number' ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0
  ) {
    return now + 300_000;
  }
  const v = expiresIn;
  if (v >= 1_000_000_000_000) {
    return Math.floor(v);
  }
  if (v >= 1_000_000_000) {
    return Math.floor(v) * 1000;
  }
  return now + Math.floor(v) * 1000;
}

export type BogInitOrder = Order & { _id: Types.ObjectId };

type BogEnvSlice = {
  clientId: string;
  clientSecret: string;
  publicBaseUrl: string;
  callbackUrlFull: string;
};

@Injectable()
export class BogPaymentsService {
  private readonly logger = new Logger(BogPaymentsService.name);
  private cachedToken: { value: string; expiresAtMs: number } | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Client ID/Secret მოდის მხოლოდ AppModule `registerAs('bog')`-დან (არა .env).
   * URL-ები: config → env → bog-inline.ts
   */
  private bogEnv(): BogEnvSlice {
    const ns = this.config.get<BogEnvSlice>('bog');
    const normBase = (s: string) => s.trim().replace(/\/+$/, '');
    return {
      clientId: (
        ns?.clientId?.trim() ||
        BOG_INLINE.clientId.trim() ||
        ''
      ).trim(),
      clientSecret: (
        ns?.clientSecret?.trim() ||
        BOG_INLINE.clientSecret.trim() ||
        ''
      ).trim(),
      publicBaseUrl: normBase(
        ns?.publicBaseUrl?.trim() ||
          process.env.NEST_PUBLIC_URL?.trim() ||
          BOG_INLINE.publicBaseUrl ||
          '',
      ),
      callbackUrlFull: normBase(
        ns?.callbackUrlFull?.trim() ||
          process.env.BOG_CALLBACK_URL?.trim() ||
          BOG_INLINE.callbackUrlFull ||
          '',
      ),
    };
  }

  private get clientId(): string | undefined {
    const v = this.bogEnv().clientId;
    return v || undefined;
  }

  private get clientSecret(): string | undefined {
    const v = this.bogEnv().clientSecret;
    return v || undefined;
  }

  /**
   * სატესტო: თუ `.env`-ში დაყენებულია `BOG_TEST_PAY_AMOUNT_GEL`, BOG-ს იგზავნება ეს თანხა (₾) და ერთი ხაზიანი basket.
   * შეკვეთის `totalAmount` MongoDB-ში არ იცვლება — მხოლოდ ბანკის მოთხოვნაა სატესტოდ 1₾-ით და ა.შ.
   * პროდაქშენზე ცვლადი არ უნდა იყოს დაყენებული.
   */
  private bogSandboxAmountGel(): number | null {
    const raw = process.env.BOG_TEST_PAY_AMOUNT_GEL?.trim();
    if (raw === undefined || raw === '') return null;
    const n = Number(String(raw).replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0 || n > 999_999.99) return null;
    return Math.round(n * 100) / 100;
  }

  private callbackUrl(): string {
    const full = this.bogEnv().callbackUrlFull?.trim();
    if (full) {
      return full;
    }
    const base = this.bogEnv().publicBaseUrl;
    if (!base) {
      this.logger.error(
        'BOG callback URL ცარიელია — .env: NEST_PUBLIC_URL ან BOG_CALLBACK_URL, ან src/config/bog-inline.ts',
      );
      throw new BadRequestException(
        'გადახდის სერვერი არ არის მომზადებული (საჯარო HTTPS მისამართი). დეველოპერს: NEST_PUBLIC_URL — იხ. aphoteka-backend/env.example',
      );
    }
    if (base.startsWith('http://')) {
      this.logger.warn(
        'BOG: NEST_PUBLIC_URL იწყება http:// — ბანკი ხშირად callback-ს უარყოფს; სცადეთ HTTPS (ngrok ან Railway).',
      );
    }
    return `${base}/api/payments/bog/callback`;
  }

  private async getAccessToken(): Promise<string> {
    const id = this.clientId;
    const secret = this.clientSecret;
    if (!id || !secret) {
      throw new ServiceUnavailableException(
        'BOG_CLIENT_ID / BOG_CLIENT_SECRET არ არის კონფიგურირებული',
      );
    }
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAtMs > now + 30_000) {
      return this.cachedToken.value;
    }
    const basic = Buffer.from(`${id}:${secret}`, 'utf8').toString('base64');
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`BOG token failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException('BOG ავთენტიფიკაცია ვერ მოხერხდა');
    }
    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) {
      throw new ServiceUnavailableException('BOG token response არასწორია');
    }
    const expiresAtMs = bogTokenExpiresAtMs(now, data.expires_in);
    this.cachedToken = {
      value: data.access_token,
      expiresAtMs,
    };
    return data.access_token;
  }

  private redirectUrls(
    dto: BogPaymentInitDto,
  ): Record<string, string> | undefined {
    const out: Record<string, string> = {};
    const ok = (u?: string) =>
      typeof u === 'string' && u.trim().toLowerCase().startsWith('https://');
    if (ok(dto.successRedirectUrl)) {
      out.success = dto.successRedirectUrl!.trim();
    }
    if (ok(dto.failRedirectUrl)) {
      out.fail = dto.failRedirectUrl!.trim();
    }
    return Object.keys(out).length ? out : undefined;
  }

  /**
   * JWT-ით დაცული — მხოლოდ შეკვეთის მფლობელს.
   */
  async initPaymentForOrder(order: BogInitOrder, dto: BogPaymentInitDto) {
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'გადახდა მხოლოდ მოლოდინში მყოფი შეკვეთისთვისაა ხელმისაწვდომი',
      );
    }
    if (!order.totalAmount || order.totalAmount <= 0) {
      throw new BadRequestException('შეკვეთის თანხა არასწორია');
    }
    const mongoOrderId = order._id.toString();
    /** იგივე რაც აპში ORD-XXXXXX (ბოლო 6 ჰექსი _id-დან) */
    const externalId = buildBogExternalOrderIdForStatement(mongoOrderId);
    const token = await this.getAccessToken();
    const sandboxGel = this.bogSandboxAmountGel();
    let purchaseTotal = order.totalAmount;
    /**
     * basket[].description არ ვაგზავნით — BOG მობილბანკში ხშირად ერთ სტრინგში აერთებს სახელს,
     * პროდუქტის აღწერას და საკუთარ ტექსტებს (თარიღი, ტერმინალი და ა.შ.).
     * buyer არ ვაგზავნით — external_order_id მხოლოდ ORD-XXXXXX (აპის შეკვეთის ნომერი).
     */
    let basket = order.items.map((item) => ({
      product_id: item.productId?.toString() ?? 'item',
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      ...(item.imageUrl ? { image: item.imageUrl } : {}),
    }));
    if (sandboxGel != null) {
      this.logger.warn(
        `BOG სატესტო თანხა ${sandboxGel}₾ (BOG_TEST_PAY_AMOUNT_GEL) — შეკვეთის ჯამი DB-ში: ${order.totalAmount}₾`,
      );
      purchaseTotal = sandboxGel;
      basket = [
        {
          product_id: 'sandbox-test',
          quantity: 1,
          unit_price: sandboxGel,
          total_price: sandboxGel,
        },
      ];
    }
    const body: Record<string, unknown> = {
      application_type: 'mobile',
      callback_url: this.callbackUrl(),
      external_order_id: externalId,
      capture: 'automatic',
      purchase_units: {
        currency: 'GEL',
        total_amount: purchaseTotal,
        basket,
      },
    };
    const redir = this.redirectUrls(dto);
    if (redir) {
      body.redirect_urls = redir;
    }

    const logPayload = cloneBodyForBogLog(body);
    this.logger.log(
      `[BOG] POST ${ORDERS_URL} — შეკვეთა _id=${mongoOrderId}\n${JSON.stringify(logPayload, null, 2)}`,
    );

    const res = await fetch(ORDERS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'ka',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`BOG create order failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException(
        'შეკვეთის შექმნა BOG-ზე ვერ მოხერხდა',
      );
    }
    const created = (await res.json()) as Record<string, unknown> & {
      id?: string;
      _links?: { redirect?: { href?: string } };
    };
    const bogOrderId = created.id;
    const redirectUrl = created._links?.redirect?.href;
    if (!bogOrderId || !redirectUrl) {
      this.logger.warn(`BOG unexpected response: ${JSON.stringify(created)}`);
      throw new ServiceUnavailableException('BOG პასუხი არასრულია');
    }
    const redirShort =
      redirectUrl.length > 100 ? `${redirectUrl.slice(0, 100)}…` : redirectUrl;
    this.logger.log(
      `[BOG] პასუხი OK — bogOrderId=${bogOrderId} redirectUrl=${redirShort}\n[BOG] პასუხის სრული JSON:\n${JSON.stringify(created, null, 2)}`,
    );
    await this.orderModel
      .updateOne(
        { _id: order._id },
        { $set: { bogOrderId, bogPaymentStatus: 'created' } },
      )
      .exec();
    return {
      bogOrderId,
      redirectUrl,
      callbackUrl: this.callbackUrl(),
    };
  }
}
