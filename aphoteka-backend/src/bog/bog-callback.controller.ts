import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Headers,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { createVerify } from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request } from 'express';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { BOG_CALLBACK_PUBLIC_KEY_PEM } from './bog-public-key';
import { parseMongoOrderIdFromBogExternal } from './bog-external-order-id';

type BogCallbackPayload = {
  event?: string;
  body?: {
    order_id?: string;
    external_order_id?: string;
    order_status?: { key?: string };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/** Mongo-სთვის უსაფრთხო plain object (Date-ებიც JSON-ით იკონვერტება string-ად) */
function snapshotForDb(value: unknown): Record<string, unknown> {
  try {
    return JSON.parse(JSON.stringify(value ?? {})) as Record<string, unknown>;
  } catch {
    return { _serializeError: true };
  }
}

@Controller('payments/bog')
export class BogCallbackController {
  private readonly logger = new Logger(BogCallbackController.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  /**
   * BOG redirect_urls.success / fail — მხოლოდ HTTPS.
   * მომხმარებელი იხსნის ბმულს და ბრუნდება აპში `kutuku://` სქემით (app.json scheme).
   */
  @Get('mobile-return/success')
  @Header('Content-Type', 'text/html; charset=utf-8')
  mobileReturnSuccess(): string {
    return this.mobileReturnPage(true);
  }

  @Get('mobile-return/fail')
  @Header('Content-Type', 'text/html; charset=utf-8')
  mobileReturnFail(): string {
    return this.mobileReturnPage(false);
  }

  private mobileReturnPage(ok: boolean): string {
    const status = ok ? 'success' : 'fail';
    /** `/payment` აპში checkout-ია — ბრუნდებით „ჩემი შეკვეთების“ ეკრანზე (app.json scheme: kutuku) */
    const deepLink = `kutuku://my-order?bogReturn=${status}`;
    const title = ok ? 'გადახდა მიღებულია' : 'გადახდა ვერ დასრულდა';
    const hint = ok
      ? 'შეკვეთის სტატუსი განახლდება რამდენიმე წამში.'
      : 'სცადეთ ხელახლა აპიდან ან დაუკავშირდით მხარდაჭერას.';
    return `<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 1.5rem; max-width: 28rem; margin: 0 auto; }
    a { display: inline-block; margin-top: 1rem; padding: 0.75rem 1.25rem; background: #0a7; color: #fff; text-decoration: none; border-radius: 8px; }
    p { color: #444; line-height: 1.5; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${hint}</p>
  <p><a href="${deepLink}">დაბრუნება აპში</a></p>
</body>
</html>`;
  }

  private verifySignature(rawBody: Buffer | undefined, signatureB64: string) {
    if (!rawBody?.length) {
      return false;
    }
    let sig: Buffer;
    try {
      sig = Buffer.from(signatureB64, 'base64');
    } catch {
      return false;
    }
    const verify = createVerify('RSA-SHA256');
    verify.update(rawBody);
    verify.end();
    try {
      return verify.verify(BOG_CALLBACK_PUBLIC_KEY_PEM, sig);
    } catch {
      return false;
    }
  }

  @Post('callback')
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('callback-signature') callbackSignature: string | undefined,
    @Body() body: BogCallbackPayload,
  ) {
    const sig = callbackSignature?.trim();
    if (sig) {
      const ok = this.verifySignature(req.rawBody, sig);
      if (!ok) {
        this.logger.warn('BOG callback: ხელმოწერა არ ემთხვევა');
        throw new UnauthorizedException('Invalid callback signature');
      }
    }
    const inner = body?.body;
    const externalRaw = inner?.external_order_id;
    const mongoOrderId = parseMongoOrderIdFromBogExternal(externalRaw);
    const statusKey = inner?.order_status?.key;
    const bogPayId =
      typeof inner?.order_id === 'string' ? inner.order_id.trim() : '';
    const callbackSnapshot = snapshotForDb(body);
    const now = new Date();

    if (!statusKey) {
      this.logger.warn(`BOG callback: არასრული body — ${JSON.stringify(body)}`);
      return { ok: true, ignored: true };
    }

    let filter: { _id: string } | { bogOrderId: string } | null = null;
    if (mongoOrderId && Types.ObjectId.isValid(mongoOrderId)) {
      filter = { _id: mongoOrderId };
    } else if (bogPayId) {
      filter = { bogOrderId: bogPayId };
    }
    if (!filter) {
      this.logger.warn(
        `BOG callback: არც Mongo id (external), არც order_id — ${JSON.stringify(body)}`,
      );
      return { ok: true, ignored: true };
    }

    const update: Record<string, unknown> = {
      bogPaymentStatus: statusKey,
      bogLastCallbackAt: now,
      bogLastCallbackRaw: callbackSnapshot,
    };
    if (bogPayId) {
      update.bogOrderId = bogPayId;
    }
    if (statusKey === 'completed') {
      update.status = OrderStatus.CONFIRMED;
    }
    const res = await this.orderModel
      .updateOne(filter, { $set: update })
      .exec();
    if (res.matchedCount === 0) {
      this.logger.warn(
        `BOG callback: შეკვეთა ვერ მოიძებნა ${JSON.stringify(filter)} external=${String(externalRaw)}`,
      );
    }
    return { ok: true };
  }
}
