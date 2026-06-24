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
import {
  buildBogExternalOrderIdForStatement,
  buildBogExternalOrderIdForDeliveryRedispatch,
} from './bog-external-order-id';
import {
  computeBogFullRefundAmount,
  computeBogProductsRefundAmount,
  computeOrderDeliveryTotal,
  computeOrderGrandTotal,
  parseBogChargedAmountFromCallback,
} from './bog-order-amounts';
import { BogBalanceSaleService } from './bog-balance-sale.service';

const TOKEN_URL =
  'https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token';
const ORDERS_URL = 'https://api.bog.ge/payments/v1/ecommerce/orders';
const REFUND_URL = 'https://api.bog.ge/payments/v1/payment/refund';

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
    private readonly bogBalanceSale: BogBalanceSaleService,
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
    const grandTotal = computeOrderGrandTotal(order);
    if (grandTotal <= 0) {
      throw new BadRequestException('შეკვეთის თანხა არასწორია');
    }
    const mongoOrderId = order._id.toString();
    /** იგივე რაც აპში ORD-XXXXXX (ბოლო 6 ჰექსი _id-დან) */
    const externalId = buildBogExternalOrderIdForStatement(mongoOrderId);
    const token = await this.getAccessToken();
    const sandboxGel = this.bogSandboxAmountGel();
    const deliveryTotal = computeOrderDeliveryTotal(order);
    /** BOG-ზე იხდის პროდუქტები + მიტანა (არა მხოლოდ totalAmount, რომელიც ძველ შეკვეთებში მხოლოდ პროდუქტია) */
    let purchaseTotal = computeOrderGrandTotal(order);
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
    if (deliveryTotal > 0) {
      basket.push({
        product_id: 'delivery',
        quantity: 1,
        unit_price: deliveryTotal,
        total_price: deliveryTotal,
      });
    }
    if (sandboxGel != null) {
      this.logger.warn(
        `BOG სატესტო თანხა ${sandboxGel}₾ (BOG_TEST_PAY_AMOUNT_GEL) — შეკვეთის ჯამი (პროდ.+მიტანა): ${purchaseTotal}₾`,
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
        {
          $set: {
            bogOrderId,
            bogPaymentStatus: 'created',
            bogChargedAmountGel: purchaseTotal,
          },
        },
      )
      .exec();
    return {
      bogOrderId,
      redirectUrl,
      callbackUrl: this.callbackUrl(),
    };
  }

  /**
   * JWT — მიტანის redispatch: მხოლოდ deliveryRedispatch.amountDue (ძველი მიტანის თანხა არ ბრუნდება).
   */
  async initPaymentForDeliveryRedispatch(
    order: Pick<OrderDocument, '_id' | 'deliveryRedispatch'>,
    dto: BogPaymentInitDto,
  ) {
    const rd = order.deliveryRedispatch;
    if (!rd || rd.status !== 'pending_payment') {
      throw new BadRequestException(
        'აქტიური pending_payment redispatch არ არის',
      );
    }
    const amountDue = Number(rd.amountDue);
    if (!Number.isFinite(amountDue) || amountDue <= 0) {
      throw new BadRequestException('გადასახდელი თანხა არასწორია');
    }
    const mongoOrderId = order._id.toString();
    const externalId =
      buildBogExternalOrderIdForDeliveryRedispatch(mongoOrderId);
    const token = await this.getAccessToken();
    const sandboxGel = this.bogSandboxAmountGel();
    let purchaseTotal = amountDue;
    let basket = [
      {
        product_id: 'delivery-redispatch',
        quantity: 1,
        unit_price: amountDue,
        total_price: amountDue,
      },
    ];
    if (sandboxGel != null) {
      this.logger.warn(
        `BOG redispatch სატესტო თანხა ${sandboxGel}₾ — DB amountDue: ${amountDue}₾`,
      );
      purchaseTotal = sandboxGel;
      basket = [
        {
          product_id: 'delivery-redispatch-sandbox',
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
      `[BOG redispatch] POST ${ORDERS_URL} — order _id=${mongoOrderId}\n${JSON.stringify(logPayload, null, 2)}`,
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
      this.logger.warn(`BOG redispatch create failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException(
        'redispatch გადახდის შექმნა BOG-ზე ვერ მოხერხდა',
      );
    }
    const created = (await res.json()) as Record<string, unknown> & {
      id?: string;
      _links?: { redirect?: { href?: string } };
    };
    const bogOrderId = created.id;
    const redirectUrl = created._links?.redirect?.href;
    if (!bogOrderId || !redirectUrl) {
      this.logger.warn(
        `BOG redispatch unexpected response: ${JSON.stringify(created)}`,
      );
      throw new ServiceUnavailableException('BOG პასუხი არასრულია');
    }
    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $set: {
            'deliveryRedispatch.bogPaymentOrderId': bogOrderId,
            'deliveryRedispatch.bogPaymentStatus': 'created',
          },
        },
      )
      .exec();
    return {
      bogOrderId,
      redirectUrl,
      callbackUrl: this.callbackUrl(),
      amountDue: purchaseTotal,
    };
  }

  /**
   * BOG refund — მხოლოდ პროდუქტების თანხა (partial). მიტანა არ ბრუნდება.
   * @see https://api.bog.ge/docs/payments/refund
   */
  async refundProductsExcludingDelivery(
    order: Pick<
      OrderDocument,
      | '_id'
      | 'bogOrderId'
      | 'bogPaymentStatus'
      | 'bogProductsRefundAt'
      | 'bogChargedAmountGel'
      | 'bogLastCallbackRaw'
      | 'items'
      | 'deliveryPrice'
      | 'deliveryServiceFee'
    >,
  ) {
    const productsAmount = computeBogProductsRefundAmount(order);
    const deliveryTotal = computeOrderDeliveryTotal(order);
    if (productsAmount <= 0) {
      throw new BadRequestException('დასაბრუნებელი პროდუქტების თანხა 0-ია');
    }

    return this.executeBogRefund(order, {
      kind: 'products',
      amount: productsAmount,
      logDetail: `products=${productsAmount}₾ delivery_kept=${deliveryTotal}₾`,
      successMessage: (refundedAmount) =>
        `BOG-ზე დაბრუნდა ₾${refundedAmount.toFixed(2)} (პროდუქტები). მიტანა ₾${deliveryTotal.toFixed(2)} არ ბრუნდება.`,
      extra: {
        deliveryKeptAmount: deliveryTotal,
      },
    });
  }

  /**
   * BOG refund — სრული თანხა (პროდუქტები + მიტანა).
   * @see https://api.bog.ge/docs/payments/refund
   */
  async refundFullIncludingDelivery(
    order: Pick<
      OrderDocument,
      | '_id'
      | 'bogOrderId'
      | 'bogPaymentStatus'
      | 'bogProductsRefundAt'
      | 'bogChargedAmountGel'
      | 'bogLastCallbackRaw'
      | 'items'
      | 'deliveryPrice'
      | 'deliveryServiceFee'
    >,
  ) {
    const fullAmount = computeBogFullRefundAmount(order);
    const deliveryTotal = computeOrderDeliveryTotal(order);
    const productsAmount = computeBogProductsRefundAmount(order);
    if (fullAmount <= 0) {
      throw new BadRequestException('დასაბრუნებელი თანხა 0-ია');
    }

    return this.executeBogRefund(order, {
      kind: 'full',
      amount: fullAmount,
      logDetail: `full=${fullAmount}₾ products=${productsAmount}₾ delivery=${deliveryTotal}₾`,
      successMessage: (refundedAmount) =>
        `BOG-ზე სრულად დაბრუნდა ₾${refundedAmount.toFixed(2)} (პროდუქტები + მიტანა).`,
      extra: {
        productsAmount,
        deliveryRefundedAmount: deliveryTotal,
      },
    });
  }

  private assertCanBogRefund(
    order: Pick<
      OrderDocument,
      'bogOrderId' | 'bogPaymentStatus' | 'bogProductsRefundAt'
    >,
  ) {
    if (order.bogProductsRefundAt) {
      throw new BadRequestException('თანხა უკვე დაბრუნებულია BOG-ზე');
    }
    const bogOrderId = order.bogOrderId?.trim();
    if (!bogOrderId) {
      throw new BadRequestException('BOG შეკვეთის ID არ არის');
    }
    const bogSt = (order.bogPaymentStatus || '').toLowerCase();
    if (
      !['completed', 'success', 'paid', 'captured'].some((k) =>
        bogSt.includes(k),
      )
    ) {
      throw new BadRequestException(
        'refund მხოლოდ წარმატებით გადახდილი BOG შეკვეთისთვისაა',
      );
    }
    return bogOrderId;
  }

  /** BOG-ზე რეალურად ჩამოჭრილი თანხა — შეკვეთაზე, callback-ში ან env-ში */
  private resolveBogChargedAmountGel(
    order: Pick<OrderDocument, 'bogChargedAmountGel' | 'bogLastCallbackRaw'>,
  ): number | null {
    if (
      typeof order.bogChargedAmountGel === 'number' &&
      Number.isFinite(order.bogChargedAmountGel) &&
      order.bogChargedAmountGel > 0
    ) {
      return order.bogChargedAmountGel;
    }
    const fromCallback = parseBogChargedAmountFromCallback(
      order.bogLastCallbackRaw,
    );
    if (fromCallback != null) {
      return fromCallback;
    }
    return this.bogSandboxAmountGel();
  }

  private buildBogRefundRequest(
    chargedGel: number | null,
    opts: { kind: 'products' | 'full'; amount: number },
  ): { body: Record<string, unknown>; refundedAmount: number } {
    if (chargedGel == null || !Number.isFinite(chargedGel) || chargedGel <= 0) {
      return { body: { amount: opts.amount }, refundedAmount: opts.amount };
    }
    const refundAmount =
      opts.kind === 'full' ? chargedGel : Math.min(opts.amount, chargedGel);
    return { body: { amount: refundAmount }, refundedAmount: refundAmount };
  }

  private async executeBogRefund(
    order: Pick<
      OrderDocument,
      | '_id'
      | 'bogOrderId'
      | 'bogPaymentStatus'
      | 'bogProductsRefundAt'
      | 'bogChargedAmountGel'
      | 'bogLastCallbackRaw'
      | 'items'
      | 'deliveryPrice'
      | 'deliveryServiceFee'
    >,
    opts: {
      kind: 'products' | 'full';
      amount: number;
      logDetail: string;
      successMessage: (refundedAmount: number) => string;
      extra?: Record<string, unknown>;
    },
  ) {
    const bogOrderId = this.assertCanBogRefund(order);
    const chargedGel = this.resolveBogChargedAmountGel(order);
    const { body, refundedAmount: plannedRefund } = this.buildBogRefundRequest(
      chargedGel,
      opts,
    );
    const token = await this.getAccessToken();
    const url = `${REFUND_URL}/${encodeURIComponent(bogOrderId)}`;

    this.logger.log(
      `[BOG refund:${opts.kind}] POST ${url} order=${String(order._id)} ${opts.logDetail} charged=${chargedGel ?? '—'}₾ request=${JSON.stringify(body)}`,
    );

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'ka',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      parsed = { raw: text };
    }

    if (!res.ok) {
      this.logger.warn(`BOG refund failed: ${res.status} ${text}`);
      throw new ServiceUnavailableException(
        typeof parsed.message === 'string'
          ? parsed.message
          : 'BOG refund ვერ მოხერხდა',
      );
    }

    const actionId =
      typeof parsed.action_id === 'string' ? parsed.action_id : undefined;
    const refundStatus =
      typeof parsed.key === 'string' ? parsed.key : 'request_received';
    const refundedAmount = plannedRefund;

    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $set: {
            bogProductsRefundAmount: refundedAmount,
            bogProductsRefundAt: new Date(),
            bogProductsRefundActionId: actionId,
            bogProductsRefundStatus: refundStatus,
            bogProductsRefundResponse: parsed,
            bogRefundKind: opts.kind,
            bogPaymentStatus: 'refunded',
          },
        },
      )
      .exec();

    let balanceCreditMessage = '';
    try {
      const balanceCredit =
        await this.bogBalanceSale.tryPostSalesCreditForRefund(
          String(order._id),
          opts.kind,
        );
      if (balanceCredit.message) {
        balanceCreditMessage = balanceCredit.ok
          ? ` ${balanceCredit.message}`
          : ` Balance SalesCredit: ${balanceCredit.message}`;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[BOG refund] Balance SalesCredit გამონაკლისი: ${msg}`);
      balanceCreditMessage = ` Balance SalesCredit შეცდომა: ${msg}`;
    }

    return {
      ok: true,
      message: opts.successMessage(refundedAmount) + balanceCreditMessage,
      refundKind: opts.kind,
      productsRefundAmount: refundedAmount,
      actionId,
      bogResponse: parsed,
      ...opts.extra,
    };
  }

  /** ადმინ UI — preview დაბრუნების თანხის */
  previewProductsRefund(
    order: Pick<
      Order,
      | 'items'
      | 'deliveryPrice'
      | 'deliveryServiceFee'
      | 'bogOrderId'
      | 'bogPaymentStatus'
      | 'bogProductsRefundAt'
      | 'bogRefundKind'
    >,
  ) {
    const productsAmount = computeBogProductsRefundAmount(order);
    const deliveryTotal = computeOrderDeliveryTotal(order);
    const fullAmount = computeBogFullRefundAmount(order);
    const paid =
      Boolean(order.bogOrderId?.trim()) &&
      ['completed', 'success', 'paid', 'captured'].some((k) =>
        (order.bogPaymentStatus || '').toLowerCase().includes(k),
      );
    const alreadyRefunded = Boolean(order.bogProductsRefundAt);

    return {
      productsAmount,
      deliveryTotal,
      fullAmount,
      deliveryNotRefunded: deliveryTotal,
      canRefundProducts: paid && !alreadyRefunded && productsAmount > 0,
      canRefundFull: paid && !alreadyRefunded && fullAmount > 0,
      canRefund: paid && !alreadyRefunded && productsAmount > 0,
      alreadyRefunded,
      refundKind: order.bogRefundKind ?? null,
      bogOrderId: order.bogOrderId?.trim() || null,
    };
  }
}
