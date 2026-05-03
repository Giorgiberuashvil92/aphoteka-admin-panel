import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BalanceExchangeService } from '../balance/balance-exchange.service';
import { BuyersService } from '../buyers/buyers.service';
import type { OrderItem } from '../orders/schemas/order.schema';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Warehouse,
  WarehouseDocument,
} from '../warehouses/schemas/warehouse.schema';
import {
  balanceSaleCashRegister,
  balanceSaleCurrency,
  balanceSaleDepartment,
  balanceSaleDocumentExpensesAccount,
  balanceSaleDocumentVatAccount,
  balanceSaleItemUnitFallback,
  balanceSaleItemUseSkuAsItemCatalog,
  balanceSaleItemGoodsExpensesAccount,
  balanceSaleItemGoodsInventoryAccount,
  balanceSaleItemGoodsVatPayableAccount,
  balanceSaleItemVatRate,
  balanceSaleItemVatRateAllowNonGuid,
  balanceSaleVatRateUidForTaxation,
  balanceSaleStrictAssemble,
  balanceSaleOperationType,
  balanceSalePaymentAccount,
  balanceSalePaymentType,
  balanceSaleReceivablesAccount,
  balanceSaleReceivablesWriteoffAccount,
  balanceSaleRevenueAccount,
  balanceSaleVatArticle,
  balanceSaleVatTaxable,
  balanceSaleWarehouseFallback,
  balanceSaleTestPutEnabled,
} from '../config/balance-sale-inline';

/** Mongo ველზე ზედმეტად გრძელი პასუხის თავიდან აცილება */
const BALANCE_SALE_RESPONSE_BODY_MAX = 96_000;

function clipBalanceSaleResponseBody(raw: string): string {
  const t = raw ?? '';
  if (t.length <= BALANCE_SALE_RESPONSE_BODY_MAX) return t;
  return `${t.slice(0, BALANCE_SALE_RESPONSE_BODY_MAX)}\n… [truncated, სულ ${t.length} სიმბოლო]`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NULL_GUID_RE = /^0{8}-0{4}-0{4}-0{4}-0{12}$/i;

/**
 * Balance `Items[].VATPayableAccount` — დღგ-ის ანგარიში (Pattern: Account).
 * OpenAPI: სავალდებულია თუ **VAT > 0**; ნაგულისხმევი — **Item**-ის მიხედვით.
 * აქ: ხაზზე ვაგზავნით მხოლოდ თუ გვაქვს ჩანაწერი (`putIfNonEmpty`); დოკ. `VATTaxable` ≠ „არ იბეგრება დღგ-ით“ → ველის შევსება/ფოლბექები (სხვა შემთხვევაში Item-ის ნაგულ. ან ცარიელი PUT).
 */
function saleLineRequiresVatPayableAccount(vatTaxable: string): boolean {
  return vatTaxable.trim() !== 'არ იბეგრება დღგ-ით';
}

function isUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

/** Balance ItemsSeries / Stocks `Series` — ref, არა ტექსტური „007“ */
function validSeriesRef(raw: string | undefined): string {
  const u = raw?.trim() ?? '';
  if (!u || NULL_GUID_RE.test(u)) return '';
  return isUuid(u) ? u : '';
}

function warehouseMatches(
  warehouseKey: string,
  uuid?: string,
  name?: string,
): boolean {
  const k = warehouseKey.trim().toLowerCase();
  if (!k) return true;
  if (uuid?.trim() && uuid.trim().toLowerCase() === k) return true;
  if (name?.trim() && name.trim().toLowerCase() === k) return true;
  return false;
}

type SeriesPickProduct = {
  balanceStockBreakdown?: Array<{
    balanceWarehouseUuid: string;
    balanceWarehouseName?: string;
    quantity: number;
    reserve: number;
    seriesUuid?: string;
  }>;
  balanceItemSeries?: Array<{
    seriesNumber?: string;
    seriesUuid?: string;
    quantity?: number;
    warehouseUuid?: string;
  }>;
  serialNumber?: string;
};

/** სერიის № (მაგ. 007) → ItemsSeries `seriesUuid` Mongo-დან */
function seriesUuidByNumber(
  p: SeriesPickProduct,
  seriesNumber: string,
): string {
  const want = seriesNumber.trim().toLowerCase();
  if (!want) return '';
  for (const row of p.balanceItemSeries ?? []) {
    const n = row.seriesNumber?.trim().toLowerCase() ?? '';
    if (n === want) {
      const ref = validSeriesRef(row.seriesUuid);
      if (ref) return ref;
    }
  }
  return '';
}

/** `serialNumber` შეჯამებიდან პირველი ტოკენი (მაგ. `007 · ვადა` → `007`) */
function primarySeriesNumberFromSerial(serial: string | undefined): string {
  const t = serial?.trim() ?? '';
  if (!t) return '';
  const head = t.split(/[·•|]/)[0]?.trim() ?? t;
  return (head.split(/\s+/)[0] ?? head).trim();
}

/**
 * რეალიზაციის ხაზის `Series` — ItemsSeries ჩანაწერის `uid` (Stocks `Series`).
 * ჯერ საწყობი+რაოდენობა; თუ ცარიელია — `serialNumber`/სერიის №-ით შესაბამებობა.
 */
function pickSeriesForSaleLine(
  p: SeriesPickProduct,
  warehouseKey: string,
  lineQty: number,
): string {
  const breakdown = p.balanceStockBreakdown ?? [];
  const whRows = breakdown.filter((row) =>
    warehouseMatches(
      warehouseKey,
      row.balanceWarehouseUuid,
      row.balanceWarehouseName,
    ),
  );
  const pool = whRows.length > 0 ? whRows : breakdown;

  const sorted = [...pool].sort((a, b) => b.quantity - a.quantity);
  for (const row of sorted) {
    const ref = validSeriesRef(row.seriesUuid);
    if (!ref) continue;
    if (lineQty <= 0 || row.quantity >= lineQty || row.quantity > 0) return ref;
  }

  const label = primarySeriesNumberFromSerial(p.serialNumber);
  if (label) {
    const byNum = seriesUuidByNumber(p, label);
    if (byNum) return byNum;
  }

  for (const row of p.balanceItemSeries ?? []) {
    const w = row.warehouseUuid;
    if (
      warehouseKey.trim() &&
      w?.trim() &&
      w.trim().toLowerCase() !== warehouseKey.trim().toLowerCase()
    ) {
      continue;
    }
    const ref = validSeriesRef(row.seriesUuid);
    if (ref) return ref;
  }
  for (const row of p.balanceItemSeries ?? []) {
    const ref = validSeriesRef(row.seriesUuid);
    if (ref) return ref;
  }
  return '';
}

/** პროდუქტი Sale-ისთვის — Mongo-დან სინქირებული Balance ველები */
type ProductForSale = SeriesPickProduct & {
  _id?: Types.ObjectId | string;
  sku?: string;
  name?: string;
  taxation?: string;
  balanceNomenclatureItemUid?: string;
  balanceVatRateUid?: string;
  unitOfMeasure?: string;
  balanceInventoriesAccount?: string;
  balanceExpensesAccount?: string;
  balanceRevenuesAccount?: string;
  balanceVatPayableAccount?: string;
};

function isNullBalanceGuid(s: string): boolean {
  return /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(s.trim());
}

/** Balance ანგარიში — ცარიელი / null-GUID არ გავატანოთ JSON-ში */
function cleanBalanceAccount(raw: string | undefined): string | undefined {
  const t = raw?.trim();
  if (!t || isNullBalanceGuid(t)) return undefined;
  return t;
}

/** ცარიელ სტრინგს არ ვამატებთ — Balance-ში მხოლოდ რაც რეალურად გვაქვს */
function putIfNonEmpty(
  o: Record<string, unknown>,
  key: string,
  value: string | undefined | null,
): void {
  if (value == null) return;
  const t = String(value).trim();
  if (t !== '') o[key] = t;
}

/**
 * Balance `Warehouse` — `balanceStockBreakdown`-იდან;
 * თუ შეკვეთას აქვს `warehouseId`, უპირატესდება ხაზი, სადაც `balanceWarehouseName` ემთხვევა ამ საწყობის სახელს.
 */
function resolveBalanceWarehouseKeyForLine(
  p: ProductForSale | undefined,
  orderWarehouseName: string | undefined,
): string {
  const br = p?.balanceStockBreakdown;
  if (!br?.length) return '';
  const want = orderWarehouseName?.trim().toLowerCase();
  if (want) {
    for (const row of br) {
      const n = row.balanceWarehouseName?.trim().toLowerCase();
      if (n && n === want) {
        return (
          row.balanceWarehouseUuid?.trim() ||
          row.balanceWarehouseName?.trim() ||
          ''
        );
      }
    }
  }
  const sorted = [...br].sort((a, b) => b.quantity - a.quantity);
  const top = sorted[0];
  return (
    top?.balanceWarehouseUuid?.trim() || top?.balanceWarehouseName?.trim() || ''
  );
}

function readDetailString(
  detail: Record<string, unknown> | undefined,
  ...keys: string[]
): string {
  if (!detail) return '';
  for (const k of keys) {
    const v = detail[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

const PAYMENT_DETAIL_PRIMARY_KEYS = new Set([
  'auth_code',
  'authorization_code',
  'authorizationcode',
  'pg_trx_id',
  'pg_transaction_id',
  'transaction_id',
]);

function paymentDetailExtraPairs(
  detail: Record<string, unknown> | undefined,
): string[] {
  if (!detail) return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(detail)) {
    if (PAYMENT_DETAIL_PRIMARY_KEYS.has(k.toLowerCase())) continue;
    if (v == null) continue;
    let s = '';
    if (typeof v === 'string') s = v.trim();
    else if (typeof v === 'number' && Number.isFinite(v)) s = String(v);
    else if (typeof v === 'boolean') s = v ? 'true' : 'false';
    else continue;
    if (s) out.push(`${k}: ${s}`);
  }
  return out;
}

/**
 * BOG `body` — `payment_detail` სრულად (ცნობილი ველები ქართულად + დანარჩენი key:value) Comments-ისთვის.
 */
function formatBogPaymentForComments(
  inner: Record<string, unknown> | undefined,
): string {
  if (!inner) return '';
  const detail =
    inner.payment_detail && typeof inner.payment_detail === 'object'
      ? (inner.payment_detail as Record<string, unknown>)
      : undefined;
  const auth = readDetailString(
    detail,
    'auth_code',
    'authorization_code',
    'AuthorizationCode',
  );
  const pg = readDetailString(
    detail,
    'pg_trx_id',
    'pg_transaction_id',
    'PG_TRX_ID',
  );
  const txn = readDetailString(detail, 'transaction_id', 'TransactionId');

  const parts: string[] = [];
  if (auth) parts.push(`ავტორიზაციის კოდი ${auth}`);
  if (pg && pg !== auth) parts.push(`PG ტრანზაქცია ${pg}`);
  if (txn && txn !== auth && txn !== pg) parts.push(`ტრანზაქციის ID ${txn}`);

  for (const line of paymentDetailExtraPairs(detail)) {
    parts.push(line);
  }

  if (parts.length > 0) return parts.join(' | ');
  return extractBogPaymentRefFallback(inner);
}

/** ღრმა ძებნა — მხოლოდ თუ `payment_detail` არ იყო სასარგებლო */
function extractBogPaymentRefFallback(
  inner: Record<string, unknown> | undefined,
): string {
  if (!inner) return '';
  const keys = new Set([
    'auth_code',
    'authorization_code',
    'authcode',
    'approval_code',
    'approvalcode',
    'rrn',
    'pg_trx_id',
    'provider_payment_id',
    'payment_id',
    'transaction_id',
  ]);
  const stack: unknown[] = [inner];
  const seen = new Set<unknown>();
  while (stack.length) {
    const cur = stack.pop();
    if (cur == null || typeof cur !== 'object') continue;
    if (seen.has(cur)) continue;
    seen.add(cur);
    if (Array.isArray(cur)) {
      for (const el of cur) stack.push(el);
      continue;
    }
    const o = cur as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) {
      if (keys.has(k.toLowerCase())) {
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (typeof v === 'number' && Number.isFinite(v)) return String(v);
      }
      if (v && typeof v === 'object') stack.push(v);
    }
  }
  return '';
}

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class BogBalanceSaleService {
  private readonly logger = new Logger(BogBalanceSaleService.name);

  constructor(
    private readonly balanceExchange: BalanceExchangeService,
    private readonly buyersService: BuyersService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Warehouse.name)
    private readonly warehouseModel: Model<WarehouseDocument>,
  ) {}

  /**
   * Sale დოკუმენტ(ებ)ის აგება — იგივე ლოგიკა BOG callback-სა და ტესტის ენდპოინტზე.
   */
  private async assembleSaleRowsFromOrder(
    order: {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      items: OrderItem[];
      warehouseId?: Types.ObjectId;
    },
    meta: {
      bogOrderId: string;
      inner?: Record<string, unknown>;
      commentPrefixLines: string[];
    },
  ): Promise<
    | { ok: false; reason: string }
    | {
        ok: true;
        saleRows: Record<string, unknown>[];
        balanceBuyerUid: string;
        skusMissingNomUid: string[];
        skusMissingSeriesRef: string[];
        skusMissingVatRate: string[];
        warehouseGroupKeys: string[];
      }
  > {
    const buyer = await this.buyersService.findByUserId(order.userId);
    const balanceBuyerUid = buyer?.balanceBuyerUid?.trim();
    if (!balanceBuyerUid) {
      return {
        ok: false,
        reason: `buyer.balanceBuyerUid არ არის — userId=${order.userId.toString()}`,
      };
    }

    const productIds = order.items
      .map((i) => i.productId)
      .filter((id) => Types.ObjectId.isValid(String(id)));
    const products = await this.productModel
      .find({ _id: { $in: productIds } })
      .select({
        sku: 1,
        name: 1,
        serialNumber: 1,
        taxation: 1,
        unitOfMeasure: 1,
        balanceNomenclatureItemUid: 1,
        balanceVatRateUid: 1,
        balanceInventoriesAccount: 1,
        balanceExpensesAccount: 1,
        balanceRevenuesAccount: 1,
        balanceVatPayableAccount: 1,
        balanceStockBreakdown: 1,
        balanceItemSeries: 1,
      })
      .lean()
      .exec();
    const byId = new Map(
      products.map((p) => [String(p._id), p as ProductForSale] as const),
    );

    /**
     * Auto-heal: თუ Product-ში Balance-ის UID/ანგარიშები/VATRate ცარიელია,
     * Balance `Exchange/Items`-ს მოვითხოვოთ ერთხელ, Mongo-ში შევავსოთ
     * (ისევე, როგორც admin „განახლება ბაზა“ აკეთებს) და `byId`-ში in-place განვახლდეთ.
     * ეს გვაძლევს რომ mobile-იდან შემოსულ შეკვეთაზე Balance Sale სწორად აეწყოს
     * მაშინაც, როცა სინქი წინასწარ არ გაშვებულა.
     */
    await this.autoHealBalanceItemFieldsFromCatalog(byId);

    /**
     * დიაგნოსტიკა: Mongo-დან წამოღებული ყოველი პროდუქტის Balance-თან დაკავშირებული ველები.
     * ეფექტური სანამ PUT აეწყოს — ვნახოთ რა არის შენახული და რა აკლია (სინქის პრობლემის ლოკალიზაცია).
     * გამორთვა: env `BALANCE_SALE_DEBUG_PRODUCT_LOG=0`.
     */
    const logProductDump =
      (process.env.BALANCE_SALE_DEBUG_PRODUCT_LOG?.trim() ?? '') !== '0';
    if (logProductDump) {
      for (const line of order.items) {
        const pid = String(line.productId);
        const p = byId.get(pid);
        const seriesCount = Array.isArray(p?.balanceItemSeries)
          ? p.balanceItemSeries.length
          : 0;
        const stockCount = Array.isArray(p?.balanceStockBreakdown)
          ? p.balanceStockBreakdown.length
          : 0;
        const dump = {
          productId: pid,
          qty: line.quantity,
          sku: p?.sku ?? null,
          name: p?.name ?? null,
          taxation: (p as { taxation?: unknown } | undefined)?.taxation ?? null,
          unitOfMeasure: p?.unitOfMeasure ?? null,
          balanceNomenclatureItemUid: p?.balanceNomenclatureItemUid ?? null,
          balanceNomenclatureItemUid_isUuid: isUuid(
            (p?.balanceNomenclatureItemUid ?? '').toString(),
          ),
          balanceVatRateUid:
            (p as { balanceVatRateUid?: string } | undefined)
              ?.balanceVatRateUid ?? null,
          balanceInventoriesAccount: p?.balanceInventoriesAccount ?? null,
          balanceExpensesAccount: p?.balanceExpensesAccount ?? null,
          balanceRevenuesAccount: p?.balanceRevenuesAccount ?? null,
          balanceVatPayableAccount: p?.balanceVatPayableAccount ?? null,
          balanceItemSeries_count: seriesCount,
          balanceItemSeries_sample: Array.isArray(p?.balanceItemSeries)
            ? p.balanceItemSeries.slice(0, 3)
            : null,
          balanceStockBreakdown_count: stockCount,
          balanceStockBreakdown_sample: Array.isArray(p?.balanceStockBreakdown)
            ? p.balanceStockBreakdown.slice(0, 3)
            : null,
          orderItem_balanceSeriesUuid:
            (line as { balanceSeriesUuid?: string }).balanceSeriesUuid ?? null,
        };
        this.logger.log(
          `[Balance Sale][DEBUG] Mongo პროდუქტი შეკვეთის ხაზზე:\n${JSON.stringify(dump, null, 2)}`,
        );
      }
    }

    let orderWarehouseName: string | undefined;
    if (
      order.warehouseId &&
      Types.ObjectId.isValid(String(order.warehouseId))
    ) {
      const whDoc = await this.warehouseModel
        .findById(order.warehouseId)
        .select({ name: 1 })
        .lean()
        .exec();
      orderWarehouseName = whDoc?.name?.trim() || undefined;
    }

    const warehouseFallback = balanceSaleWarehouseFallback();

    type LineCtx = {
      line: OrderItem;
      p: ProductForSale | undefined;
      whKey: string;
    };
    const lineContexts: LineCtx[] = order.items.map((line) => {
      const p = byId.get(String(line.productId));
      let whKey = resolveBalanceWarehouseKeyForLine(p, orderWarehouseName);
      if (!whKey) whKey = warehouseFallback;
      return { line, p, whKey };
    });

    const unresolvedWarehouse = lineContexts.filter((c) => !c.whKey.trim());
    if (unresolvedWarehouse.length > 0) {
      const skus = unresolvedWarehouse.map((c) =>
        (c.p?.sku || c.line.productName || '?').toString(),
      );
      return {
        ok: false,
        reason: `Balance საწყობი ვერ განისაზღვრა: ${[...new Set(skus)].join(', ')}`,
      };
    }

    const warehouseGroups = new Map<string, LineCtx[]>();
    for (const ctx of lineContexts) {
      const list = warehouseGroups.get(ctx.whKey) ?? [];
      list.push(ctx);
      warehouseGroups.set(ctx.whKey, list);
    }

    const skusMissingNomBefore: string[] = [];
    for (const ctx of lineContexts) {
      const p = ctx.p;
      const sc = (p?.sku || ctx.line.productName || '').toString().slice(0, 80);
      const nu = p?.balanceNomenclatureItemUid?.trim() ?? '';
      if (!nu || !isUuid(nu)) skusMissingNomBefore.push(sc);
    }
    if (balanceSaleStrictAssemble() && skusMissingNomBefore.length > 0) {
      return {
        ok: false,
        reason:
          `ნომენკლატურა (Sale Items \`Item\` — კატალოგის GUID): პროდუქტ(ებ)ზე დაამატე balanceNomenclatureItemUid: ${[...new Set(skusMissingNomBefore)].join(', ')}. ` +
          'ნაგულისხმევად PUT მაინც იგზავნება — Balance დააბრუნებს შეცდომას; წინასწარი ბლოკისთვის: BALANCE_SALE_STRICT_ASSEMBLE=1.',
      };
    }

    const vatTaxable = balanceSaleVatTaxable();
    const operationType = balanceSaleOperationType();
    const cashRegister = balanceSaleCashRegister();
    const department = balanceSaleDepartment();
    const receivablesCompany = balanceSaleReceivablesAccount();
    const receivablesFromBuyer = cleanBalanceAccount(
      buyer?.balanceReceivablesAccount,
    );
    const receivablesAccount = (
      receivablesCompany ||
      receivablesFromBuyer ||
      ''
    ).trim();
    const revenueAccount = balanceSaleRevenueAccount();
    const vatArticle = balanceSaleVatArticle();
    const currency = balanceSaleCurrency();
    const documentExpensesAccount = balanceSaleDocumentExpensesAccount();
    const documentVatAccount = balanceSaleDocumentVatAccount();
    const receivablesWriteoffAccount = balanceSaleReceivablesWriteoffAccount();
    const paymentType = balanceSalePaymentType();
    const paymentAccount = balanceSalePaymentAccount();

    if (!receivablesAccount && !revenueAccount) {
      return {
        ok: false,
        reason:
          'ReceivablesAccount და RevenueAccount ორივე ცარიელია — შეავსე balance-sale-inline.ts (receivablesAccount, revenueAccount) ან Buyer.balanceReceivablesAccount + revenueAccount',
      };
    }
    if (!receivablesAccount) {
      return {
        ok: false,
        reason:
          'ReceivablesAccount ცარიელია — Buyer.balanceReceivablesAccount ან balance-sale-inline.ts → receivablesAccount',
      };
    }
    if (!revenueAccount) {
      return {
        ok: false,
        reason:
          'RevenueAccount ცარიელია — balance-sale-inline.ts → revenueAccount',
      };
    }

    const goodsInvFallback = balanceSaleItemGoodsInventoryAccount().trim();
    const goodsExpItemFallback = balanceSaleItemGoodsExpensesAccount().trim();
    const goodsVatPayItemFallback =
      balanceSaleItemGoodsVatPayableAccount().trim();
    const goodsAccountErrors: string[] = [];
    for (const ctx of lineContexts) {
      const p = ctx.p;
      const sc = (p?.sku || ctx.line.productName || '').toString().slice(0, 80);
      const nomUid = p?.balanceNomenclatureItemUid?.trim() ?? '';
      const nomOk = Boolean(nomUid && isUuid(nomUid));
      if (!nomOk) continue;
      const inv =
        cleanBalanceAccount(p?.balanceInventoriesAccount) || goodsInvFallback;
      const exp =
        cleanBalanceAccount(p?.balanceExpensesAccount) ||
        documentExpensesAccount.trim() ||
        goodsExpItemFallback;
      const vp =
        cleanBalanceAccount(p?.balanceVatPayableAccount) ||
        documentVatAccount.trim() ||
        goodsVatPayItemFallback;
      if (!inv) {
        goodsAccountErrors.push(`${sc}: Items.AccountNumber`);
      }
      if (!exp) {
        goodsAccountErrors.push(`${sc}: Items.ExpensesAccount`);
      }
      if (saleLineRequiresVatPayableAccount(vatTaxable) && !vp) {
        goodsAccountErrors.push(`${sc}: Items.VATPayableAccount`);
      }
    }
    if (balanceSaleStrictAssemble() && goodsAccountErrors.length > 0) {
      return {
        ok: false,
        reason:
          `საქონლის სავალდებული ანგარიში(ები) — ${goodsAccountErrors.join('; ')}. ` +
          'პროდუქტზე / itemGoods* / expensesAccount, vatAccount. ნაგულისხმევად PUT მაინც იგზავნება — BALANCE_SALE_STRICT_ASSEMBLE=1 წინასწარი შემოწმებისთვის.',
      };
    }

    const bankPaymentText = formatBogPaymentForComments(meta.inner);
    const commentParts = [
      ...meta.commentPrefixLines,
      `შეკვეთა ${String(order._id)}`,
      meta.bogOrderId ? `BOG order_id: ${meta.bogOrderId}` : '',
      bankPaymentText,
    ].filter(Boolean);
    /** Balance Comments — BOG `payment_detail` სრულად ერთ სტრიქონში */
    const comments = commentParts.join(' | ').slice(0, 1000);

    const dateStr = todayDateStr();
    const itemUnitFallback = balanceSaleItemUnitFallback();
    const itemVatRateGlobal = balanceSaleItemVatRate();
    const allowNonGuidVat = balanceSaleItemVatRateAllowNonGuid();
    const skusMissingNomUid: string[] = [];
    const skusMissingSeriesRef: string[] = [];
    const skusMissingVatRate: string[] = [];
    const docExpTrim = documentExpensesAccount.trim();
    const docVatTrim = documentVatAccount.trim();

    /**
     * ხაზის `VATRate`-ის რეზოლვი:
     * 1) პროდუქტზე `balanceVatRateUid` (GUID)
     * 2) `product.taxation` → `balanceSaleVatRateUidForTaxation()` (inline/env map)
     * 3) global `balanceSaleItemVatRate()` fallback
     * 4) ცარიელი — Balance შეცდომა
     */
    const resolveLineVatRate = (
      p: Product | null,
    ): { value: string; acceptable: boolean } => {
      const productUid = p?.balanceVatRateUid?.trim() ?? '';
      if (productUid && (isUuid(productUid) || allowNonGuidVat)) {
        return { value: productUid, acceptable: true };
      }
      const byTaxation = balanceSaleVatRateUidForTaxation(p?.taxation).trim();
      if (byTaxation && (isUuid(byTaxation) || allowNonGuidVat)) {
        return { value: byTaxation, acceptable: true };
      }
      const globalTrim = itemVatRateGlobal.trim();
      if (globalTrim && (isUuid(globalTrim) || allowNonGuidVat)) {
        return { value: globalTrim, acceptable: true };
      }
      return { value: '', acceptable: false };
    };

    const buildItemsForWarehouse = (
      ctxs: LineCtx[],
      whKey: string,
    ): Record<string, unknown>[] =>
      ctxs.map(({ line, p }) => {
        const stringCode = (p?.sku || line.productName || '')
          .toString()
          .slice(0, 80);
        const nomUid = p?.balanceNomenclatureItemUid?.trim() ?? '';
        const itemCatalog = balanceSaleItemUseSkuAsItemCatalog()
          ? stringCode
          : (p?.name || stringCode).toString().slice(0, 120);
        const itemField = nomUid && isUuid(nomUid) ? nomUid : itemCatalog;
        if (!nomUid || !isUuid(nomUid)) skusMissingNomUid.push(stringCode);
        const qty = Number(line.quantity) || 0;
        const price = Number(line.unitPrice) || 0;
        const amount = Number(line.totalPrice) || qty * price;
        const seriesRef = p
          ? pickSeriesForSaleLine(p as SeriesPickProduct, whKey, qty)
          : '';
        if (
          p &&
          (p.balanceItemSeries?.length || p.balanceStockBreakdown?.length) &&
          !seriesRef
        ) {
          skusMissingSeriesRef.push(stringCode);
        }
        const row: Record<string, unknown> = {
          StringCode: stringCode,
          Price: String(price),
          Quantity: String(qty),
          Item: itemField,
          Amount: String(amount),
        };
        const nomOk = Boolean(nomUid && isUuid(nomUid));
        const uProduct = p?.unitOfMeasure?.trim() ?? '';
        const uFallback = itemUnitFallback.trim();
        /**
         * `Unit` — კატალოგი (ხშირად GUID). Item=ნომენკლატურის GUID-ზე ტექსტური „ცალი“ ხშირად ზედმეტია (Balance აიღებს Item-იდან).
         * Item როცა არა-GUIDა (SKU), Balance ნაგულ. ერთეულს ვერ ავსებს — სვეტი „ერთ.“ ცარიელი რჩება და +1 შეცდომა; ამიტომ აქ ტექსტური ფოლბექი რჩება.
         */
        if (uProduct && isUuid(uProduct)) {
          row.Unit = uProduct;
        } else if (nomOk) {
          /* ცარიელი — Balance-ის ნაგულ. Item-ის მიხედვით */
        } else {
          const unitText = uProduct || uFallback;
          putIfNonEmpty(row, 'Unit', unitText);
        }
        putIfNonEmpty(row, 'Series', seriesRef);
        const invLine =
          cleanBalanceAccount(p?.balanceInventoriesAccount) || goodsInvFallback;
        const expLine =
          cleanBalanceAccount(p?.balanceExpensesAccount) ||
          docExpTrim ||
          goodsExpItemFallback;
        /** `VATPayableAccount` — დღგ-ის ანგარიში; ფოლბექი: პროდუქტი → დოკ. `VATAccount` → itemGoodsVatPayableAccount. ცარიელი + სწორი Item → Balance შეიძლება აიღოს Item-იდან. */
        const vpLine =
          cleanBalanceAccount(p?.balanceVatPayableAccount) ||
          docVatTrim ||
          goodsVatPayItemFallback;
        if (nomOk) {
          putIfNonEmpty(row, 'AccountNumber', invLine);
          putIfNonEmpty(row, 'ExpensesAccount', expLine);
          if (saleLineRequiresVatPayableAccount(vatTaxable)) {
            putIfNonEmpty(row, 'VATPayableAccount', vpLine);
          }
        } else {
          putIfNonEmpty(
            row,
            'AccountNumber',
            cleanBalanceAccount(p?.balanceInventoriesAccount),
          );
          putIfNonEmpty(
            row,
            'ExpensesAccount',
            cleanBalanceAccount(p?.balanceExpensesAccount),
          );
          if (saleLineRequiresVatPayableAccount(vatTaxable)) {
            putIfNonEmpty(row, 'VATPayableAccount', vpLine);
          } else {
            putIfNonEmpty(
              row,
              'VATPayableAccount',
              cleanBalanceAccount(p?.balanceVatPayableAccount),
            );
          }
        }
        /** Balance Sale Items: `IncomeAccount` სავალდებულოა — პროდუქტი ან დოკუმენტის `RevenueAccount` (არა მხოლოდ `putIfNonEmpty`). */
        const lineIncomeAccount =
          cleanBalanceAccount(p?.balanceRevenuesAccount) ||
          revenueAccount.trim();
        if (lineIncomeAccount) {
          row.IncomeAccount = lineIncomeAccount;
        }
        if (saleLineRequiresVatPayableAccount(vatTaxable)) {
          const vat = resolveLineVatRate(p as Product | null);
          if (vat.acceptable) {
            row.VATRate = vat.value;
          } else {
            skusMissingVatRate.push(stringCode);
          }
        }
        return row;
      });

    const saleRows: Record<string, unknown>[] = [];
    for (const [whKey, ctxs] of warehouseGroups) {
      const items = buildItemsForWarehouse(ctxs, whKey);
      const itemsTotal = ctxs.reduce((s, { line }) => {
        const q = Number(line.quantity) || 0;
        const up = Number(line.unitPrice) || 0;
        const tp = Number(line.totalPrice);
        const lineAmt = Number.isFinite(tp) && tp > 0 ? tp : q * up;
        return s + lineAmt;
      }, 0);
      const doc: Record<string, unknown> = {
        uid: randomUUID(),
        Date: dateStr,
        PaymentDate: dateStr,
        Warehouse: whKey,
        Client: balanceBuyerUid,
        ReceivablesAccount: receivablesAccount,
        RevenueAccount: revenueAccount,
        VATTaxable: vatTaxable,
        OperationType: operationType,
        VATArticle: vatArticle,
        AmountIncludesVAT: true,
        DoesNotAffectReceivables: false,
        SubjetToIncomeTax: false,
        TheMarketPriceShouldAppearInTheInvoice: false,
        Comments: comments,
        Items: items,
      };
      putIfNonEmpty(doc, 'CashRegister', cashRegister);
      putIfNonEmpty(doc, 'Department', department);
      putIfNonEmpty(doc, 'Currency', currency);
      putIfNonEmpty(doc, 'ExpensesAccount', documentExpensesAccount);
      putIfNonEmpty(doc, 'VATAccount', documentVatAccount);
      putIfNonEmpty(
        doc,
        'ReceivablesWriteoffAccount',
        receivablesWriteoffAccount,
      );

      if (paymentType && paymentAccount && itemsTotal > 0) {
        doc.Payment = [
          {
            PaymentType: paymentType,
            PaymentAccount: paymentAccount,
            Amount: itemsTotal.toFixed(2),
          },
        ];
      }

      saleRows.push(doc);
    }

    if (skusMissingVatRate.length > 0) {
      this.logger.warn(
        `[Balance Sale] Items.VATRate ვერ მოიძებნა ${skusMissingVatRate.length} ხაზისთვის (${skusMissingVatRate.slice(0, 10).join(', ')}${skusMissingVatRate.length > 10 ? '…' : ''}). ` +
          'აიღე Balance კატალოგიდან „დღგ-ის განაკვეთი“ GUID და ჩასვი პროდუქტზე `balanceVatRateUid` ან balance-sale-inline.ts → itemVatRateMap.regular / env BALANCE_SALE_VAT_RATE_REGULAR (ან global BALANCE_SALE_ITEM_VAT_RATE); დროებითი ტექსტი: BALANCE_SALE_ITEM_VAT_RATE_ALLOW_NON_GUID=1.',
      );
    }

    return {
      ok: true,
      saleRows,
      balanceBuyerUid,
      skusMissingNomUid,
      skusMissingSeriesRef,
      skusMissingVatRate,
      warehouseGroupKeys: [...warehouseGroups.keys()],
    };
  }

  /**
   * Auto-heal: თუ რომელიმე პროდუქტს აკლია `balanceNomenclatureItemUid` ან ანგარიშები,
   * Balance `Exchange/Items` catalog-ს ერთხელ ვცდით და SKU-ით ვუხვდებით GUID-ს
   * და `InventoriesAccount` / `ExpensesAccount` / `RevenuesAccount` / `VATPayableAccount` / `VATRate` (taxation)-ს.
   * ნაპოვნი ველებით ვანახლებთ Mongo-ს Product-ს (`updateOne`) და `byId` Map-ს,
   * რომ მობილურში შემდეგი GET-ი უკვე სრულ ინფოს დააბრუნებს (ისევე, როგორც admin „განახლება ბაზა“).
   */
  private async autoHealBalanceItemFieldsFromCatalog(
    byId: Map<string, ProductForSale>,
  ): Promise<void> {
    if (byId.size === 0) return;

    const safeStr = (v: unknown): string => {
      if (v == null) return '';
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'number' || typeof v === 'boolean')
        return String(v).trim();
      return '';
    };

    const pickStr = (
      row: Record<string, unknown>,
      ...keys: string[]
    ): string => {
      for (const k of keys) {
        const s = safeStr(row[k]);
        if (s) return s;
      }
      return '';
    };

    const needsHeal: ProductForSale[] = [];
    for (const p of byId.values()) {
      const uid = safeStr(p.balanceNomenclatureItemUid);
      const missingUid = !uid || !isUuid(uid);
      const missingInv = !cleanBalanceAccount(p.balanceInventoriesAccount);
      const missingRev = !cleanBalanceAccount(p.balanceRevenuesAccount);
      const missingVatAcc = !cleanBalanceAccount(p.balanceVatPayableAccount);
      const missingTaxation = !safeStr(p.taxation);
      if (
        missingUid ||
        missingInv ||
        missingRev ||
        missingVatAcc ||
        missingTaxation
      ) {
        needsHeal.push(p);
      }
    }

    if (needsHeal.length === 0) return;

    this.logger.log(
      `[Balance Sale][Heal] ${needsHeal.length}/${byId.size} პროდუქტს აკლია ველები — Exchange/Items catalog-ს ვითხოვ`,
    );

    const rows = await this.balanceExchange.fetchItemsCatalog();
    if (rows.length === 0) {
      this.logger.warn(
        '[Balance Sale][Heal] Exchange/Items ცარიელი დაბრუნდა — auto-heal გამოტოვებული',
      );
      return;
    }

    const bySku = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const isGroup = pickStr(row, 'IsGroup', 'isGroup').toLowerCase();
      if (isGroup === 'true') continue;
      const code = pickStr(row, 'Code', 'SKU', 'sku', 'code');
      if (code) bySku.set(code, row);
    }

    let healed = 0;
    for (const p of needsHeal) {
      const sku = safeStr(p.sku);
      if (!sku) continue;
      const row = bySku.get(sku);
      if (!row) continue;

      const newUid = pickStr(row, 'uid', 'UID', 'Uuid', 'UUID', 'Ref');
      const newInv = pickStr(row, 'InventoriesAccount', 'inventoriesAccount');
      const newExp = pickStr(row, 'ExpensesAccount', 'expensesAccount');
      const newRev = pickStr(row, 'RevenuesAccount', 'revenuesAccount');
      const newVatAcc = pickStr(row, 'VATPayableAccount', 'vatPayableAccount');
      const newVatRate = pickStr(row, 'VATRate', 'vatRate');

      const patch: Record<string, unknown> = {};
      const curUid = safeStr(p.balanceNomenclatureItemUid);
      if (newUid && isUuid(newUid) && (!curUid || !isUuid(curUid))) {
        patch.balanceNomenclatureItemUid = newUid;
      }
      if (newInv && !cleanBalanceAccount(p.balanceInventoriesAccount)) {
        patch.balanceInventoriesAccount = newInv;
      }
      if (newExp && !cleanBalanceAccount(p.balanceExpensesAccount)) {
        patch.balanceExpensesAccount = newExp;
      }
      if (newRev && !cleanBalanceAccount(p.balanceRevenuesAccount)) {
        patch.balanceRevenuesAccount = newRev;
      }
      if (newVatAcc && !cleanBalanceAccount(p.balanceVatPayableAccount)) {
        patch.balanceVatPayableAccount = newVatAcc;
      }
      if (newVatRate && !safeStr(p.taxation)) {
        patch.taxation = newVatRate;
      }

      if (Object.keys(patch).length === 0) continue;

      const pid = p._id;
      if (!pid) continue;

      try {
        await this.productModel.updateOne({ _id: pid }, { $set: patch }).exec();
        Object.assign(p, patch);
        byId.set(String(pid), p);
        healed++;
        this.logger.log(
          `[Balance Sale][Heal] SKU=${sku} განახლდა Mongo-ში: ${Object.keys(patch).join(', ')}`,
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(
          `[Balance Sale][Heal] Mongo update ვერ მოხერხდა SKU=${sku} — ${msg}`,
        );
      }
    }

    this.logger.log(
      `[Balance Sale][Heal] სულ განახლდა ${healed}/${needsHeal.length} პროდუქტი`,
    );
  }

  /**
   * გაყიდვის ჩანაწერი Balance Exchange **Sale** (PUT, JSON მასივი), როცა გადახდა დასრულებულია
   * და შეკვეთა **გაგზავნილია** (`shipped`). `Client` = `Buyer.balanceBuyerUid`.
   */
  async tryPostSaleAfterBogCompleted(
    filter: { _id: string } | { bogOrderId: string },
    inner: Record<string, unknown> | undefined,
    bogOrderId: string,
  ): Promise<void> {
    try {
      const order = await this.orderModel.findOne(filter).lean().exec();
      if (!order) {
        this.logger.warn('[Balance Sale] შეკვეთა ვერ ჩაიტვირთა ფილტრით');
        return;
      }
      if (order.balanceSalePostedAt) {
        this.logger.log(
          `[Balance Sale] უკვე გაგზავნილია — შეკვეთა=${String(order._id)}`,
        );
        return;
      }

      const lockRes = await this.orderModel
        .updateOne(
          {
            _id: order._id,
            balanceSalePostedAt: { $exists: false },
            balanceSalePostingLock: { $exists: false },
          },
          { $set: { balanceSalePostingLock: new Date() } },
        )
        .exec();
      if (lockRes.modifiedCount === 0) {
        this.logger.log(
          `[Balance Sale] lock არ აიღო (უკვე იგზავნება) — ${String(order._id)}`,
        );
        return;
      }

      const assembled = await this.assembleSaleRowsFromOrder(
        {
          _id: order._id,
          userId: order.userId,
          items: order.items,
          warehouseId: order.warehouseId,
        },
        {
          bogOrderId,
          inner,
          commentPrefixLines: [],
        },
      );
      if (!assembled.ok) {
        this.logger.warn(`[Balance Sale] ${assembled.reason}`);
        await this.orderModel
          .updateOne(
            { _id: order._id },
            { $unset: { balanceSalePostingLock: 1 } },
          )
          .exec();
        return;
      }
      const {
        saleRows,
        balanceBuyerUid,
        skusMissingNomUid,
        skusMissingSeriesRef,
        warehouseGroupKeys,
      } = assembled;

      if (skusMissingNomUid.length > 0) {
        this.logger.warn(
          `[Balance Sale] balanceNomenclatureItemUid აკლია ან არა-GUIDა (გაუშვი „განახლება ბაზა“): ${[...new Set(skusMissingNomUid)].join(', ')}`,
        );
      }
      if (skusMissingSeriesRef.length > 0) {
        this.logger.warn(
          `[Balance Sale] Series (ItemsSeries uid) ვერ მოიძებნა — შეამოწმე სერიის № ↔ balanceItemSeries სინქი: ${[...new Set(skusMissingSeriesRef)].join(', ')}`,
        );
      }

      const result = await this.balanceExchange.putSaleDocument(saleRows);
      const responseBodyStored = clipBalanceSaleResponseBody(result.raw);
      const responseAudit = {
        balanceSalePutResponseAt: new Date(),
        balanceSalePutResponseStatus: result.status,
        balanceSalePutResponseBody: responseBodyStored,
      };
      if (!result.ok) {
        const errSnippet = result.raw.slice(0, 500);
        await this.orderModel
          .updateOne(
            { _id: order._id },
            {
              $set: {
                balanceSalePostError: errSnippet,
                ...responseAudit,
              },
              $unset: { balanceSalePostingLock: 1 },
            },
          )
          .exec();
        this.logger.warn(
          `[Balance Sale] HTTP ${result.status} — ${result.raw.slice(0, 400)}`,
        );
        return;
      }
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              balanceSalePostedAt: new Date(),
              balanceSalePostError: '',
              ...responseAudit,
            },
            $unset: { balanceSalePostingLock: 1 },
          },
        )
        .exec();
      this.logger.log(
        `[Balance Sale] OK შეკვეთა=${String(order._id)} Client=${balanceBuyerUid} · დოკ=${saleRows.length} (${warehouseGroupKeys.join('; ')})`,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[Balance Sale] გამონაკლისი: ${msg}`);
      try {
        const oid =
          '_id' in filter && typeof filter._id === 'string'
            ? filter._id
            : undefined;
        if (oid && Types.ObjectId.isValid(oid)) {
          await this.orderModel
            .updateOne(
              { _id: new Types.ObjectId(oid) },
              { $unset: { balanceSalePostingLock: 1 } },
            )
            .exec();
        } else if ('bogOrderId' in filter && filter.bogOrderId) {
          await this.orderModel
            .updateOne(
              { bogOrderId: filter.bogOrderId },
              { $unset: { balanceSalePostingLock: 1 } },
            )
            .exec();
        }
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * დროებითი ტესტი: იგივე Sale JSON რაც BOG `completed`-ზე, გადახდის გარეშე.
   * არ წერს `balanceSalePostedAt` / lock-ს — რეალური callback მერე კვლავ შეეძლება.
   */
  async testPutSaleToBalance(orderId: Types.ObjectId): Promise<{
    ok: boolean;
    httpStatus: number;
    message: string;
    preview: string;
  }> {
    if (!balanceSaleTestPutEnabled()) {
      return {
        ok: false,
        httpStatus: 403,
        message:
          'გამორთულია — `balance-sale-inline.ts` → testPutEnabled: true ან BALANCE_SALE_TEST_PUT_ENABLED=1',
        preview: '',
      };
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      return {
        ok: false,
        httpStatus: 404,
        message: 'შეკვეთა ვერ მოიძებნა',
        preview: '',
      };
    }
    const assembled = await this.assembleSaleRowsFromOrder(
      {
        _id: order._id,
        userId: order.userId,
        items: order.items,
        warehouseId: order.warehouseId,
      },
      {
        bogOrderId: 'TEST-NO-BOG',
        inner: undefined,
        commentPrefixLines: [
          `[TEST PUT ${new Date().toISOString()} — Balance შემოწმება, BOG არაა]`,
        ],
      },
    );
    if (!assembled.ok) {
      return {
        ok: false,
        httpStatus: 400,
        message: assembled.reason,
        preview: '',
      };
    }
    const {
      saleRows,
      skusMissingNomUid,
      skusMissingSeriesRef,
      skusMissingVatRate,
    } = assembled;
    if (skusMissingNomUid.length > 0) {
      this.logger.warn(
        `[Balance Sale TEST] balanceNomenclatureItemUid: ${[...new Set(skusMissingNomUid)].join(', ')}`,
      );
    }
    if (skusMissingSeriesRef.length > 0) {
      this.logger.warn(
        `[Balance Sale TEST] Series: ${[...new Set(skusMissingSeriesRef)].join(', ')}`,
      );
    }
    if (skusMissingVatRate.length > 0) {
      this.logger.warn(
        `[Balance Sale TEST] VATRate: ${[...new Set(skusMissingVatRate)].join(', ')}`,
      );
    }
    const result = await this.balanceExchange.putSaleDocument(saleRows);
    const responseBodyStored = clipBalanceSaleResponseBody(result.raw);
    const responseAudit = {
      balanceSalePutResponseAt: new Date(),
      balanceSalePutResponseStatus: result.status,
      balanceSalePutResponseBody: responseBodyStored,
      balanceSaleTestPutAt: new Date(),
    };
    if (!result.ok) {
      await this.orderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            balanceSalePostError: `[TEST] ${result.raw.slice(0, 500)}`,
            ...responseAudit,
          },
        },
      );
      return {
        ok: false,
        httpStatus: result.status || 502,
        message: result.raw.slice(0, 600),
        preview: result.raw.slice(0, 2000),
      };
    }
    await this.orderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          balanceSalePostError: '',
          ...responseAudit,
        },
      },
    );
    return {
      ok: true,
      httpStatus: result.status,
      message:
        'OK — იხილე შეკვეთაზე balanceSalePutResponseBody / balanceSaleTestPutAt',
      preview: result.raw.slice(0, 2000),
    };
  }

  /**
   * მობილური დევ-ტესტი: იგივე Mongo განახლება + Balance Sale, რაც BOG callback `completed`-ზე,
   * სტატიკური `payment_detail` / `order_id` (რეალური BOG გარეშე).
   * იგივე გამორთვა რაც test-balance-sale: `balanceSaleTestPutEnabled()`.
   */
  async applyDevSimulatedBogCompleted(
    orderId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<{ ok: boolean; message: string }> {
    if (!balanceSaleTestPutEnabled()) {
      return {
        ok: false,
        message:
          'გამორთულია — balance-sale-inline.ts → testPutEnabled ან BALANCE_SALE_TEST_PUT_ENABLED=1',
      };
    }
    const order = await this.orderModel
      .findOne({ _id: orderId, userId })
      .lean();
    if (!order) {
      return { ok: false, message: 'შეკვეთა ვერ მოიძებნა ან არა თქვენია' };
    }
    if (order.balanceSalePostedAt) {
      return {
        ok: false,
        message:
          'შეკვეთა უკვე ჩაიწერა Balance-ში — ხელახალი ტესტი სხვა შეკვეთით',
      };
    }

    const bogPayId =
      (typeof order.bogOrderId === 'string' && order.bogOrderId.trim()) ||
      `dev-sim-${orderId.toString().slice(-12)}`;
    const inner: Record<string, unknown> = {
      order_id: bogPayId,
      external_order_id: orderId.toString(),
      order_status: { key: 'completed' },
      payment_detail: {
        auth_code: 'DEV-SIM-OK',
        pg_trx_id: 'DEV-SIM-PG',
        transaction_id: 'DEV-SIM-TXN',
      },
    };

    this.logger.log(
      `[Balance Sale DEV] dev-simulate: order=${orderId.toString()} user=${userId.toString()} · ყალბი BOG inner:\n${JSON.stringify(inner, null, 2)}`,
    );

    const callbackSnapshot: Record<string, unknown> = {
      event: 'dev_simulate_bog_completed',
      body: inner,
    };
    const now = new Date();
    await this.orderModel
      .updateOne(
        { _id: orderId },
        {
          $set: {
            bogPaymentStatus: 'completed',
            bogLastCallbackAt: now,
            bogLastCallbackRaw: callbackSnapshot,
            bogOrderId: bogPayId,
            status: OrderStatus.CONFIRMED,
          },
        },
      )
      .exec();

    this.logger.log(
      `[Balance Sale DEV] Mongo განახლდა (completed + bogLastCallbackRaw). Balance PUT გაეშვება მხოლოდ შეკვეთის სტატუსზე „გაგზავნილი“ (shipped) — განაახლე სტატუსი ადმინიდან/საწყობიდან.`,
    );

    return {
      ok: true,
      message:
        'BOG completed სიმულაცია ჩაწერილია. Balance-ზე გაყიდვის ჩასაწერად დააყენე შეკვეთის სტატუსი „გზაში“ (shipped).',
    };
  }
}
