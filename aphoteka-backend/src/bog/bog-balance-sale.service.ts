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
  balanceSaleDeliveryItemUid,
  balanceSaleDeliveryItemCode,
  balanceSaleDeliveryProductSku,
  balanceSaleDeliveryStringCode,
  balanceSaleDeliveryIncomeAccount,
  balanceSaleDeliveryVatRate,
  balanceSalesCreditOperationType,
  balanceRefundSalesCreditOperationType,
  balanceSaleRequestBodyLogMaxChars,
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
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T00:00:00`;
}

function todayDateOnly(): string {
  return todayDateStr().slice(0, 10);
}

/** Sale Items[].uid — SalesCredit Items[].BaseDocument (დაბრუნების ხაზის მიბმა). */
function extractSaleLineUid(row: Record<string, unknown>): string {
  for (const k of ['uid', 'UID', 'Ref', 'LineUID', 'LineUid']) {
    const v = strField(row[k]);
    if (v && isUuid(v)) return v;
  }
  return '';
}

function ingestSaleLineUidLookup(
  lookup: Map<string, string>,
  row: Record<string, unknown>,
): void {
  const lineUid = extractSaleLineUid(row);
  if (!lineUid) return;
  const num = strField(row.Number);
  const item = strField(row.Item);
  if (num) lookup.set(`n:${num}`, lineUid);
  if (item) lookup.set(`i:${item.toLowerCase()}`, lineUid);
}

/** Sale GET + Sale PUT პასუხიდან — ხაზის uid Number/Item-ით. */
function buildSaleLineUidLookup(
  saleDoc: Record<string, unknown> | null | undefined,
  salePutResponseBody?: string,
): Map<string, string> {
  const lookup = new Map<string, string>();
  if (saleDoc && Array.isArray(saleDoc.Items)) {
    for (const raw of saleDoc.Items) {
      if (raw && typeof raw === 'object') {
        ingestSaleLineUidLookup(lookup, raw as Record<string, unknown>);
      }
    }
  }
  if (salePutResponseBody?.trim()) {
    try {
      const data = JSON.parse(salePutResponseBody) as unknown;
      const docs = Array.isArray(data) ? data : [data];
      for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;
        const items = (doc as Record<string, unknown>).Items;
        if (!Array.isArray(items)) continue;
        for (const raw of items) {
          if (raw && typeof raw === 'object') {
            ingestSaleLineUidLookup(lookup, raw as Record<string, unknown>);
          }
        }
      }
    } catch {
      /* ignore */
    }
  }
  return lookup;
}

function resolveSaleLineBaseDocument(
  row: Record<string, unknown>,
  lineUidLookup: Map<string, string>,
  saleDocumentUid: string,
): string {
  const direct = extractSaleLineUid(row);
  if (direct) return direct;
  const num = strField(row.Number);
  if (num) {
    const byNum = lineUidLookup.get(`n:${num}`);
    if (byNum) return byNum;
  }
  const item = strField(row.Item).toLowerCase();
  if (item) {
    const byItem = lineUidLookup.get(`i:${item}`);
    if (byItem) return byItem;
  }
  return saleDocumentUid;
}

function resolveSalesCreditDate(
  baseSaleDoc: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  const saleDate = strField(baseSaleDoc?.Date);
  if (saleDate && /^\d{4}-\d{2}-\d{2}/.test(saleDate)) {
    return saleDate.length >= 19
      ? saleDate.slice(0, 19)
      : `${saleDate.slice(0, 10)}T00:00:00`;
  }
  return fallback;
}

function pickReuseCreditUid(
  docs: Array<{ warehouse: string; uid: string }> | undefined,
  whKey: string,
): string {
  if (!docs?.length) return '';
  const want = whKey.trim().toLowerCase();
  const match = docs.find(
    (d) => d.warehouse.trim().toLowerCase() === want && d.uid?.trim(),
  );
  return match?.uid?.trim() ?? '';
}

function collectReuseCreditDocuments(order: {
  balanceRefundCreditDocuments?: Array<{ warehouse: string; uid: string }>;
  balanceRefundCreditHistory?: Array<{ warehouse: string; uid: string }>;
  balanceRefundCreditPutResponseBody?: string;
  balanceSaleDocuments?: Array<{ warehouse: string; uid: string }>;
}): Array<{ warehouse: string; uid: string }> {
  const byWh = new Map<string, { warehouse: string; uid: string }>();
  const ingest = (docs?: Array<{ warehouse: string; uid: string }>) => {
    for (const d of docs ?? []) {
      const wh = d.warehouse?.trim();
      const uid = d.uid?.trim();
      if (!wh || !uid || !isUuid(uid)) continue;
      byWh.set(wh.toLowerCase(), { warehouse: wh, uid });
    }
  };
  ingest(order.balanceRefundCreditHistory);
  ingest(order.balanceRefundCreditDocuments);
  const whFallback =
    order.balanceSaleDocuments?.find((d) => d.warehouse?.trim())?.warehouse ??
    '';
  if (order.balanceRefundCreditPutResponseBody?.trim()) {
    try {
      const data = JSON.parse(
        order.balanceRefundCreditPutResponseBody,
      ) as unknown;
      const rows = Array.isArray(data) ? data : [data];
      for (const raw of rows) {
        if (!raw || typeof raw !== 'object') continue;
        const r = raw as Record<string, unknown>;
        const uid = strField(r.uid);
        const wh = strField(r.Warehouse) || whFallback;
        if (uid && isUuid(uid) && wh) {
          byWh.set(wh.toLowerCase(), { warehouse: wh, uid });
        }
      }
    } catch {
      /* ignore */
    }
  }
  return [...byWh.values()];
}

/** Balance Exchange შეცდომის ტექსტი — admin-ში წაკითხვადი. */
function formatBalanceExchangeError(raw: string, status: number): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return `Balance პასუხი ცარიელია (HTTP ${status})`;
  }
  try {
    const parsed = JSON.parse(trimmed) as { Error?: unknown };
    const errors = Array.isArray(parsed.Error)
      ? parsed.Error.map((e) => String(e).trim()).filter(Boolean)
      : [];
    if (errors.length > 0) {
      const detail = errors.join('; ');
      if (detail.includes('ОбработкаПроведения')) {
        return (
          `Balance ვერ დააპოსტა SalesCredit (HTTP ${status}). ` +
          'შესაძლოა ამ Sale-ზე უკვe არსებობს დაბრუნება — Balance-ში შეამოწმე/წაშალე ძველი SalesCredit. ' +
          'Retry ახლა იგივე uid-ით განაახლებს წინა დოკუმენტს (თუ Mongo-ში იყო). ' +
          `დეტალი: ${detail}`
        );
      }
      return `Balance (HTTP ${status}): ${detail}`;
    }
  } catch {
    /* not JSON */
  }
  return trimmed.length > 500 ? `${trimmed.slice(0, 500)}…` : trimmed;
}

function buildDeliveryLineItem(
  amount: number,
  revenueAccount: string,
  vatTaxable: string,
  itemUid: string,
  product?: ProductForSale,
  resolveLineVatRate?: (p: Product | null) => {
    value: string;
    acceptable: boolean;
  },
  goodsInvFallback?: string,
  goodsExpItemFallback?: string,
  goodsVatPayItemFallback?: string,
  documentExpensesAccount?: string,
  documentVatAccount?: string,
): Record<string, unknown> | null {
  const uid = itemUid.trim();
  if (!uid || !isUuid(uid)) return null;
  const qty = 1;
  const price = amount;
  const stringCode = (
    product?.sku ||
    balanceSaleDeliveryStringCode() ||
    '000022'
  )
    .toString()
    .slice(0, 80);
  const row: Record<string, unknown> = {
    Item: uid,
    StringCode: stringCode,
    Quantity: String(qty),
    Price: price.toFixed(2),
    Amount: price.toFixed(2),
  };
  const uProduct = product?.unitOfMeasure?.trim() ?? '';
  const uFallback = balanceSaleItemUnitFallback().trim();
  if (uProduct && isUuid(uProduct)) {
    row.Unit = uProduct;
  } else {
    putIfNonEmpty(row, 'Unit', uProduct || uFallback || 'ც');
  }
  const lineIncomeAccount =
    cleanBalanceAccount(product?.balanceRevenuesAccount) ||
    cleanBalanceAccount(balanceSaleDeliveryIncomeAccount()) ||
    revenueAccount.trim();
  if (lineIncomeAccount) row.IncomeAccount = lineIncomeAccount;

  const invLine =
    cleanBalanceAccount(product?.balanceInventoriesAccount) ||
    goodsInvFallback?.trim();
  const expLine =
    cleanBalanceAccount(product?.balanceExpensesAccount) ||
    documentExpensesAccount?.trim() ||
    goodsExpItemFallback?.trim();
  const vpLine =
    cleanBalanceAccount(product?.balanceVatPayableAccount) ||
    documentVatAccount?.trim() ||
    goodsVatPayItemFallback?.trim();
  putIfNonEmpty(row, 'AccountNumber', invLine);
  putIfNonEmpty(row, 'ExpensesAccount', expLine);
  if (saleLineRequiresVatPayableAccount(vatTaxable)) {
    putIfNonEmpty(row, 'VATPayableAccount', vpLine);
  }

  if (resolveLineVatRate) {
    const vat = resolveLineVatRate((product as Product) ?? null);
    if (vat.acceptable) row.VATRate = vat.value;
  } else {
    const vatRate = balanceSaleDeliveryVatRate().trim();
    if (
      vatRate &&
      saleLineRequiresVatPayableAccount(vatTaxable) &&
      (isUuid(vatRate) || balanceSaleItemVatRateAllowNonGuid())
    ) {
      row.VATRate = vatRate;
    }
  }
  return row;
}

function strField(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

/** Balance Exchange/SalesCredit — ოფიციალური API ველები (არა Sale PUT). */
const SALES_CREDIT_HEADER_FROM_SALE = [
  'Agreement',
  'VATArticle',
  'VATTaxable',
  'Department',
  'PriceType',
  'Currency',
  'CurrencyRate',
  'ReceivablesWriteoffAccount',
  'PrimaryDocument',
  'RevenuesAndExpensesAnalytics',
] as const;

/** BOG refund SalesCredit — დოკუმენტის ველები ორიგინალი Sale GET-იდან (Balance UI ფორმატი). */
const SALES_CREDIT_REFUND_DOC_FROM_SALE = [
  'Branch',
  'Agreement',
  'Department',
  'PriceType',
  'Currency',
  'Multiplicity',
  'CustomersAccount',
  'DebtRepaymentAccount',
  'DownPaymentAccount',
  'NonOperatingIncomeAccount',
  'VATFinancialExpenseAccount',
  'PrimaryDocument',
  'RevenuesAndExpensesAnalytics',
] as const;

function pickSalesCreditHeaderFromSale(
  baseSaleDoc: Record<string, unknown> | null | undefined,
  fallbacks: {
    department?: string;
    currency?: string;
    receivablesWriteoffAccount?: string;
    vatTaxable?: string;
    vatArticle?: string;
  },
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (baseSaleDoc) {
    for (const f of SALES_CREDIT_HEADER_FROM_SALE) {
      const v = strField(baseSaleDoc[f]);
      if (v) out[f] = v;
    }
    if (!out.VATArticle) {
      const va = strField(baseSaleDoc.VATarticle);
      if (va) out.VATArticle = va;
    }
    if (!out.VATTaxable) {
      const vt = strField(baseSaleDoc.VATtaxable);
      if (vt) out.VATTaxable = vt;
    }
    if (typeof baseSaleDoc.AmountIncludesVAT === 'boolean') {
      out.AmountIncludesVAT = baseSaleDoc.AmountIncludesVAT;
    }
    if (
      Array.isArray(baseSaleDoc.AdditionalDetails) &&
      baseSaleDoc.AdditionalDetails.length > 0
    ) {
      out.AdditionalDetails = baseSaleDoc.AdditionalDetails;
    }
  }
  putIfNonEmpty(out, 'Department', fallbacks.department);
  putIfNonEmpty(out, 'Currency', fallbacks.currency);
  putIfNonEmpty(
    out,
    'ReceivablesWriteoffAccount',
    fallbacks.receivablesWriteoffAccount,
  );
  if (!out.VATTaxable && fallbacks.vatTaxable) {
    out.VATTaxable = fallbacks.vatTaxable;
  }
  if (!out.VATArticle && fallbacks.vatArticle) {
    out.VATArticle = fallbacks.vatArticle;
  }
  if (!('AmountIncludesVAT' in out)) out.AmountIncludesVAT = true;
  return out;
}

function pickSalesCreditRefundDocFromSale(
  baseSaleDoc: Record<string, unknown> | null | undefined,
  fallbacks: {
    department?: string;
    currency?: string;
    receivablesAccount?: string;
    vatTaxable?: string;
    vatArticle?: string;
  },
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (baseSaleDoc) {
    for (const f of SALES_CREDIT_REFUND_DOC_FROM_SALE) {
      const v = strField(baseSaleDoc[f]);
      if (v) out[f] = v;
    }
    const vatArticle =
      strField(baseSaleDoc.VATArticle) || strField(baseSaleDoc.VATarticle);
    if (vatArticle) out.VATarticle = vatArticle;
    const vatTaxable =
      strField(baseSaleDoc.VATTaxable) || strField(baseSaleDoc.VATtaxable);
    if (vatTaxable) out.VATtaxable = vatTaxable;
    const rate =
      strField(baseSaleDoc.Rate) || strField(baseSaleDoc.CurrencyRate);
    if (rate) out.Rate = rate;
    const amountIncludesVat = baseSaleDoc.AmountIncludesVAT;
    if (amountIncludesVat != null && amountIncludesVat !== '') {
      out.AmountIncludesVAT =
        typeof amountIncludesVat === 'boolean'
          ? String(amountIncludesVat)
          : String(amountIncludesVat).trim();
    }
    if (
      Array.isArray(baseSaleDoc.AdditionalDetails) &&
      baseSaleDoc.AdditionalDetails.length > 0
    ) {
      out.AdditionalDetails = baseSaleDoc.AdditionalDetails;
    }
    const customers =
      strField(baseSaleDoc.CustomersAccount) ||
      strField(baseSaleDoc.ReceivablesAccount);
    if (customers) out.CustomersAccount = customers;
  }
  putIfNonEmpty(out, 'Department', fallbacks.department);
  putIfNonEmpty(out, 'Currency', fallbacks.currency);
  if (!out.CustomersAccount && fallbacks.receivablesAccount) {
    out.CustomersAccount = fallbacks.receivablesAccount.trim();
  }
  if (!out.VATtaxable && fallbacks.vatTaxable) {
    out.VATtaxable = fallbacks.vatTaxable;
  }
  if (!out.VATarticle && fallbacks.vatArticle) {
    out.VATarticle = fallbacks.vatArticle;
  }
  if (!('AmountIncludesVAT' in out)) out.AmountIncludesVAT = 'true';
  return out;
}

/** Sale GET ხაზი → SalesCredit „დაბრუნება“ Items (Balance UI ფორმატი). */
function mapSaleLineToRefundCreditItem(
  row: Record<string, unknown>,
  goodsExpFallback: string,
  lineBaseDocumentUid?: string,
): Record<string, unknown> | null {
  const itemUid = strField(row.Item);
  if (!itemUid) return null;

  const line: Record<string, unknown> = { Item: itemUid };
  putIfNonEmpty(line, 'Number', strField(row.Number));
  putIfNonEmpty(line, 'Content', strField(row.Content));
  putIfNonEmpty(line, 'Unit', strField(row.Unit));
  putIfNonEmpty(line, 'Quantity', strField(row.Quantity) || '1');
  putIfNonEmpty(line, 'Price', strField(row.Price));
  putIfNonEmpty(line, 'Discount', strField(row.Discount) || '0');
  const amount =
    strField(row.Amount) ||
    strField(row.AmountIncludingVAT) ||
    strField(row.Price);
  putIfNonEmpty(line, 'Amount', amount);
  putIfNonEmpty(
    line,
    'VATrate',
    strField(row.VATrate) || strField(row.VATRate),
  );
  putIfNonEmpty(line, 'VAT', strField(row.VAT) || '0');
  putIfNonEmpty(
    line,
    'AmountIncludingVAT',
    strField(row.AmountIncludingVAT) || amount,
  );
  putIfNonEmpty(
    line,
    'VATArticle',
    strField(row.VATArticle) || strField(row.VATarticle),
  );

  const seriesFromSale = validSeriesRef(strField(row.Series));
  if (seriesFromSale) line.Series = seriesFromSale;

  putIfNonEmpty(
    line,
    'AccountingAccount',
    strField(row.AccountingAccount) || strField(row.AccountNumber),
  );
  putIfNonEmpty(
    line,
    'VATAccount',
    strField(row.VATAccount) || strField(row.VATPayableAccount),
  );
  putIfNonEmpty(
    line,
    'RevenueAccount',
    strField(row.RevenueAccount) || strField(row.IncomeAccount),
  );
  putIfNonEmpty(
    line,
    'ExpensesAccount',
    strField(row.ExpensesAccount) || goodsExpFallback,
  );
  putIfNonEmpty(line, 'Cost', strField(row.Cost) || '0');
  putIfNonEmpty(line, 'Excise', strField(row.Excise) || '0');
  if (lineBaseDocumentUid && isUuid(lineBaseDocumentUid)) {
    line.BaseDocument = lineBaseDocumentUid;
  }
  return line;
}

/** SalesCredit Items — API სავალდებულო/კონდიციური ველები (BaseDocument, Series, AmountIncludingVAT, ExpensesAccount). */
function finalizeSalesCreditItems(
  items: Record<string, unknown>[],
  baseDocumentUid: string,
  goodsExpFallback: string,
): Record<string, unknown>[] {
  return items.map((row) => {
    const copy: Record<string, unknown> = {
      ...row,
      BaseDocument: baseDocumentUid,
    };
    const amount = strField(copy.Amount);
    if (amount && !strField(copy.AmountIncludingVAT)) {
      copy.AmountIncludingVAT = amount;
    }
    const itemUid = strField(copy.Item);
    const accountNumber = strField(copy.AccountNumber);
    if (
      itemUid &&
      isUuid(itemUid) &&
      accountNumber &&
      !strField(copy.ExpensesAccount) &&
      goodsExpFallback.trim()
    ) {
      copy.ExpensesAccount = goodsExpFallback.trim();
    }
    return copy;
  });
}

/** Sale PUT ხაზები → SalesCredit refund Items (Mongo fallback). */
function mapSalePutLineToRefundCreditItem(
  row: Record<string, unknown>,
  goodsExpFallback: string,
  lineBaseDocumentUid?: string,
): Record<string, unknown> {
  const line: Record<string, unknown> = { Item: strField(row.Item) };
  putIfNonEmpty(line, 'StringCode', strField(row.StringCode));
  putIfNonEmpty(line, 'Quantity', strField(row.Quantity) || '1');
  putIfNonEmpty(line, 'Price', strField(row.Price));
  const amount = strField(row.Amount);
  putIfNonEmpty(line, 'Amount', amount);
  putIfNonEmpty(line, 'Unit', strField(row.Unit));
  putIfNonEmpty(line, 'Discount', '0');
  putIfNonEmpty(line, 'VAT', '0');
  putIfNonEmpty(line, 'VATrate', strField(row.VATRate));
  if (amount) line.AmountIncludingVAT = amount;
  putIfNonEmpty(line, 'Series', strField(row.Series));
  putIfNonEmpty(line, 'AccountingAccount', strField(row.AccountNumber));
  putIfNonEmpty(line, 'RevenueAccount', strField(row.IncomeAccount));
  putIfNonEmpty(line, 'VATAccount', strField(row.VATPayableAccount));
  putIfNonEmpty(
    line,
    'ExpensesAccount',
    strField(row.ExpensesAccount) || goodsExpFallback,
  );
  putIfNonEmpty(line, 'Cost', '0');
  putIfNonEmpty(line, 'Excise', '0');
  if (lineBaseDocumentUid && isUuid(lineBaseDocumentUid)) {
    line.BaseDocument = lineBaseDocumentUid;
  }
  return line;
}

function finalizeRefundSalesCreditItems(
  items: Record<string, unknown>[],
  goodsExpFallback: string,
  saleDocumentUid?: string,
): Record<string, unknown>[] {
  return items.map((row, idx) => {
    const mapped = mapSalePutLineToRefundCreditItem(
      row,
      goodsExpFallback,
      saleDocumentUid,
    );
    if (!strField(mapped.Number)) mapped.Number = String(idx + 1);
    return mapped;
  });
}

/**
 * Refund SalesCredit Items — ორიგინალი გატარებული Sale GET ხაზებიდან.
 * Items[].BaseDocument = Sale Items[].uid (ხაზი); დოკუმენტზე BaseDocument = Sale uid.
 */
function buildRefundSalesCreditItemsFromSaleGet(
  saleDoc: Record<string, unknown> | null | undefined,
  saleDocumentUid: string,
  lineUidLookup: Map<string, string>,
  deliveryItemUid: string,
  includeDelivery: boolean,
  goodsExpFallback: string,
): Record<string, unknown>[] {
  const rawItems = saleDoc?.Items;
  if (!Array.isArray(rawItems)) return [];
  const deliveryKey = deliveryItemUid.trim().toLowerCase();
  const out: Record<string, unknown>[] = [];

  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const itemUid = strField(row.Item);
    if (!itemUid) continue;
    const isDelivery = Boolean(
      deliveryKey && itemUid.toLowerCase() === deliveryKey,
    );
    if (isDelivery && !includeDelivery) {
      continue;
    }

    const lineBase = resolveSaleLineBaseDocument(
      row,
      lineUidLookup,
      saleDocumentUid,
    );
    const line = mapSaleLineToRefundCreditItem(row, goodsExpFallback, lineBase);
    if (line) out.push(line);
  }
  return out;
}

function strLogField(v: unknown, fallback = '—'): string {
  if (v == null) return fallback;
  if (typeof v === 'string') return v.trim() || fallback;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return fallback;
}

/** Balance Sale PUT — ადამინ/დევ ლოგი (გადახდის შემდეგ) */
function summarizeBalanceSaleRowsForLog(
  saleRows: Record<string, unknown>[],
): string {
  const out: string[] = [];
  saleRows.forEach((doc, docIdx) => {
    const uid = strLogField(doc.uid);
    const wh = strLogField(doc.Warehouse);
    const paymentArr = doc.Payment;
    let payAmt = '—';
    if (Array.isArray(paymentArr) && paymentArr.length > 0) {
      const p0 = paymentArr[0] as Record<string, unknown>;
      payAmt = strLogField(p0.Amount);
    }
    out.push(
      `  დოკ ${docIdx + 1}/${saleRows.length} · uid=${uid} · Warehouse=${wh} · Payment.Amount=${payAmt}`,
    );
    const items = doc.Items;
    if (!Array.isArray(items) || items.length === 0) {
      out.push('    (Items ცარიელი)');
      return;
    }
    for (const raw of items) {
      if (!raw || typeof raw !== 'object') continue;
      const it = raw as Record<string, unknown>;
      const code = strLogField(it.StringCode, strLogField(it.Item, '?'));
      const qty = strLogField(it.Quantity, '?');
      const price = strLogField(it.Price, '?');
      const amount = strLogField(it.Amount, strLogField(it.Sum, '?'));
      const seriesRaw = strLogField(it.Series, '');
      const series =
        seriesRaw && seriesRaw !== '—'
          ? ` · Series=${seriesRaw.slice(0, 8)}…`
          : '';
      out.push(
        `    · ${code} · qty=${qty} · price=${price} · amount=${amount}${series}`,
      );
    }
  });
  return out.join('\n');
}

function serializeBalanceSaleRowsForLog(
  saleRows: Record<string, unknown>[],
): string {
  try {
    const json = JSON.stringify(saleRows, null, 2);
    const max = balanceSaleRequestBodyLogMaxChars();
    if (json.length <= max) return json;
    return `${json.slice(0, max)}\n… [truncated, სულ ${json.length} სიმბოლო]`;
  } catch (e: unknown) {
    return `[JSON stringify failed: ${e instanceof Error ? e.message : String(e)}]`;
  }
}

function resolveWarehouseKeyByName(
  products: ProductForSale[],
  warehouseName: string,
  fallback: string,
): string {
  const want = warehouseName.trim().toLowerCase();
  if (!want) return fallback;
  for (const p of products) {
    for (const row of p.balanceStockBreakdown ?? []) {
      const n = row.balanceWarehouseName?.trim().toLowerCase();
      if (n === want) {
        return (
          row.balanceWarehouseUuid?.trim() ||
          row.balanceWarehouseName?.trim() ||
          warehouseName.trim()
        );
      }
    }
  }
  return warehouseName.trim() || fallback;
}

function pickBaseSaleUid(
  docs: Array<{ warehouse: string; uid: string }> | undefined,
  oldWhKey: string,
): string {
  if (!docs?.length) return '';
  const want = oldWhKey.trim().toLowerCase();
  const match = docs.find(
    (d) => d.warehouse.trim().toLowerCase() === want && d.uid?.trim(),
  );
  if (match?.uid) return match.uid.trim();
  return docs.find((d) => d.uid?.trim())?.uid?.trim() ?? '';
}

type AssembleSaleOptions = {
  /** ყველა ხაზი ამ საწყობზე (SalesCredit / delivery-only) */
  forceWarehouseName?: string;
  /** sale | salesCredit | deliveryOnly | refundCredit */
  mode?: 'sale' | 'salesCredit' | 'deliveryOnly' | 'refundCredit';
  baseDocumentUid?: string;
  /** refundCredit — ორიგინალი Sale uid-ები საწყობის მიხედვით */
  balanceSaleDocuments?: Array<{ warehouse: string; uid: string }>;
  deliveryAmount?: number;
  /** sale / refundCredit — მიტანის ხაზის გამოტოვება */
  skipDeliveryLine?: boolean;
  /** force retry — იგივე Balance SalesCredit uid (PUT update) */
  reuseCreditDocuments?: Array<{ warehouse: string; uid: string }>;
  /** Sale PUT პასუხი — Items[].uid დაბრუნების BaseDocument-ისთვის */
  balanceSalePutResponseBody?: string;
};

@Injectable()
export class BogBalanceSaleService {
  private readonly logger = new Logger(BogBalanceSaleService.name);
  /** undefined = ჯერ არ ვცადეთ; null = catalog-ში ვერ მოიძებნა */
  private deliveryItemUidFromCatalog: string | null | undefined;
  /** Mongo delivery product (SKU 000022) — undefined = ჯერ არ ვცადეთ */
  private deliveryProductCache: ProductForSale | null | undefined;

  /**
   * გადახდის/redispatch/retry შემდეგ — რა მიდის Balance Exchange/Sale PUT-ში.
   * ყოველთვის იწერება Nest ლოგში (გამორთვა: env `BALANCE_LOG_SALE_AFTER_PAYMENT=0`).
   */
  private logBalanceSaleOutgoing(
    trigger: string,
    orderId: string,
    bogOrderId: string,
    saleRows: Record<string, unknown>[],
    meta?: {
      skusMissingNomUid?: string[];
      skusMissingSeriesRef?: string[];
      warehouseGroupKeys?: string[];
    },
  ): void {
    if (process.env.BALANCE_LOG_SALE_AFTER_PAYMENT?.trim() === '0') return;

    const warnParts: string[] = [];
    if (meta?.skusMissingNomUid?.length) {
      warnParts.push(
        `nomUid აკლია: ${[...new Set(meta.skusMissingNomUid)].join(', ')}`,
      );
    }
    if (meta?.skusMissingSeriesRef?.length) {
      warnParts.push(
        `Series აკლია: ${[...new Set(meta.skusMissingSeriesRef)].join(', ')}`,
      );
    }
    const warnBlock =
      warnParts.length > 0 ? `\n⚠ ${warnParts.join(' | ')}` : '';
    const whKeys = meta?.warehouseGroupKeys?.length
      ? `\nსაწყობ(ებ)ი: ${meta.warehouseGroupKeys.join('; ')}`
      : '';

    this.logger.log(
      `[Balance Sale][${trigger}] → Balance PUT\n` +
        `შეკვეთა=${orderId} · BOG=${bogOrderId} · დოკ=${saleRows.length}${whKeys}${warnBlock}\n` +
        `--- Items შეჯამება ---\n${summarizeBalanceSaleRowsForLog(saleRows)}\n` +
        `--- PUT JSON ---\n${serializeBalanceSaleRowsForLog(saleRows)}`,
    );
  }

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
   * მიტანის Balance Items GUID — env/inline ან Exchange/Items catalog (Code/სახელი).
   */
  private async resolveDeliveryItemUid(): Promise<string> {
    const configured = balanceSaleDeliveryItemUid().trim();
    if (configured && isUuid(configured)) return configured;

    if (this.deliveryItemUidFromCatalog !== undefined) {
      return this.deliveryItemUidFromCatalog ?? '';
    }

    const pickRowStr = (row: Record<string, unknown>, ...keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    };

    const codeWant = (
      balanceSaleDeliveryItemCode() || balanceSaleDeliveryStringCode()
    )
      .trim()
      .toLowerCase();
    const nameHints = [
      'მიტან',
      'მიწოდ',
      'delivery',
      'courier',
      'quickshipper',
      'glovo',
      'wolt',
    ];

    const rows = await this.balanceExchange.fetchItemsCatalog();
    if (rows.length === 0) {
      this.deliveryItemUidFromCatalog = null;
      this.logger.warn(
        '[Balance Sale] delivery Item — Exchange/Items ცარიელია (auth/publication ID?)',
      );
      return '';
    }

    const candidates: Array<{ uid: string; code: string; name: string }> = [];
    for (const row of rows) {
      if (pickRowStr(row, 'IsGroup', 'isGroup').toLowerCase() === 'true') {
        continue;
      }
      const uid = pickRowStr(row, 'uid', 'UID', 'Uuid', 'UUID');
      if (!uid || !isUuid(uid)) continue;
      const code = pickRowStr(row, 'Code', 'SKU', 'code', 'sku');
      const name = pickRowStr(row, 'Name', 'FullName', 'Presentation');
      candidates.push({ uid, code, name });
    }

    if (codeWant) {
      const byCode = candidates.find(
        (c) => c.code.trim().toLowerCase() === codeWant,
      );
      if (byCode) {
        this.deliveryItemUidFromCatalog = byCode.uid;
        this.logger.log(
          `[Balance Sale] delivery Item catalog Code=${byCode.code} → uid=${byCode.uid}`,
        );
        return byCode.uid;
      }
    }

    for (const hint of nameHints) {
      const byName = candidates.find((c) =>
        c.name.toLowerCase().includes(hint),
      );
      if (byName) {
        this.deliveryItemUidFromCatalog = byName.uid;
        this.logger.log(
          `[Balance Sale] delivery Item catalog Name="${byName.name}" → uid=${byName.uid}`,
        );
        return byName.uid;
      }
    }

    this.deliveryItemUidFromCatalog = null;
    this.logger.warn(
      `[Balance Sale] delivery Item ვერ მოიძებნა (${candidates.length} ჩანაწერი). ` +
        'შეავსე BALANCE_SALE_DELIVERY_ITEM_UID ან Balance-ში Code=DELIVERY / სახელი „მიტანა“.',
    );
    return '';
  }

  /**
   * მიტანის Balance Items ხაზი — უპირატესობა Mongo პროდუქტს (SKU 000022 „დელივერი“),
   * ფასი = შეკვეთის მიტანა (არა კატალოგის ფიქს. ფასი). ფოლბექი: env GUID / Items catalog.
   */
  private async resolveDeliveryForLine(): Promise<{
    product?: ProductForSale;
    itemUid: string;
  }> {
    const sku = balanceSaleDeliveryProductSku().trim();
    if (sku) {
      if (this.deliveryProductCache === undefined) {
        const raw = await this.productModel
          .findOne({ sku })
          .select({
            sku: 1,
            name: 1,
            taxation: 1,
            unitOfMeasure: 1,
            balanceNomenclatureItemUid: 1,
            balanceVatRateUid: 1,
            balanceInventoriesAccount: 1,
            balanceExpensesAccount: 1,
            balanceRevenuesAccount: 1,
            balanceVatPayableAccount: 1,
          })
          .lean()
          .exec();
        if (raw) {
          const byId = new Map([[String(raw._id), raw as ProductForSale]]);
          await this.autoHealBalanceItemFieldsFromCatalog(byId);
          const healed = byId.get(String(raw._id))!;
          const uid = healed.balanceNomenclatureItemUid?.trim() ?? '';
          if (uid && isUuid(uid)) {
            this.deliveryProductCache = healed;
            this.logger.log(
              `[Balance Sale] delivery product SKU=${sku} → Item=${uid}`,
            );
          } else {
            this.deliveryProductCache = null;
            this.logger.warn(
              `[Balance Sale] delivery product SKU=${sku} — balanceNomenclatureItemUid აკლია; admin-ში „განახლება ბაზა“`,
            );
          }
        } else {
          this.deliveryProductCache = null;
          this.logger.warn(
            `[Balance Sale] delivery product SKU=${sku} Mongo-ში ვერ მოიძებნა`,
          );
        }
      }
      if (this.deliveryProductCache) {
        return {
          product: this.deliveryProductCache,
          itemUid: this.deliveryProductCache.balanceNomenclatureItemUid!.trim(),
        };
      }
    }
    const itemUid = await this.resolveDeliveryItemUid();
    return { itemUid };
  }

  /**
   * Sale დოკუმენტ(ებ)ის აგება — იგივე ლოგიკა BOG callback-სა და ტესტის ენდპოინტზე.
   */
  private async assembleSaleRowsFromOrder(
    order: {
      _id: Types.ObjectId;
      userId: Types.ObjectId;
      items: OrderItem[];
      warehouseId?: Types.ObjectId;
      deliveryPrice?: number;
      deliveryServiceFee?: number;
    },
    meta: {
      bogOrderId: string;
      inner?: Record<string, unknown>;
      commentPrefixLines: string[];
    },
    options?: AssembleSaleOptions,
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
    if (options?.forceWarehouseName?.trim()) {
      orderWarehouseName = options.forceWarehouseName.trim();
    } else if (
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
    const mode = options?.mode ?? 'sale';
    const deliveryTotal =
      (mode === 'sale' || mode === 'refundCredit') && !options?.skipDeliveryLine
        ? (Number(order.deliveryPrice) || 0) +
          (Number(order.deliveryServiceFee) || 0)
        : 0;
    let deliveryAppended = false;
    const needsDeliveryLine =
      deliveryTotal > 0 || options?.mode === 'deliveryOnly';
    const deliveryResolved = needsDeliveryLine
      ? await this.resolveDeliveryForLine()
      : { itemUid: '' as string };
    const deliveryItemUid = deliveryResolved.itemUid;
    const deliveryProduct = deliveryResolved.product;
    const deliverySkuHint = balanceSaleDeliveryProductSku().trim() || '000022';
    const deliveryItemMissingReason = `მიტანის Balance ხაზი — პროდუქტი SKU=${deliverySkuHint} (balanceNomenclatureItemUid / „განახლება ბაზა“) ან env BALANCE_SALE_DELIVERY_ITEM_UID`;

    if (mode === 'deliveryOnly') {
      const amount = Number(options?.deliveryAmount) || 0;
      const whKey =
        resolveWarehouseKeyByName(
          [...byId.values()],
          options?.forceWarehouseName ?? orderWarehouseName ?? '',
          warehouseFallback,
        ) || warehouseFallback;
      if (!whKey.trim()) {
        return {
          ok: false,
          reason: 'Balance საწყობი (მიტანა) ვერ განისაზღვრა',
        };
      }
      const dLine = buildDeliveryLineItem(
        amount,
        revenueAccount,
        vatTaxable,
        deliveryItemUid,
        deliveryProduct,
        resolveLineVatRate,
        goodsInvFallback,
        goodsExpItemFallback,
        goodsVatPayItemFallback,
        docExpTrim,
        docVatTrim,
      );
      if (!dLine || amount <= 0) {
        return {
          ok: false,
          reason:
            amount <= 0
              ? 'მიტანის Balance Sale — amountDue=0'
              : deliveryItemMissingReason,
        };
      }
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
        Items: [dLine],
      };
      putIfNonEmpty(doc, 'CashRegister', cashRegister);
      putIfNonEmpty(doc, 'Department', department);
      putIfNonEmpty(doc, 'Currency', currency);
      if (paymentType && paymentAccount && amount > 0) {
        doc.Payment = [
          {
            PaymentType: paymentType,
            PaymentAccount: paymentAccount,
            Amount: amount.toFixed(2),
          },
        ];
      }
      saleRows.push(doc);
    } else if (mode === 'salesCredit') {
      const baseDoc = options?.baseDocumentUid?.trim() ?? '';
      if (!baseDoc || !isUuid(baseDoc)) {
        return {
          ok: false,
          reason: 'SalesCredit — BaseDocument (ორიგინალი Sale uid) არ არის',
        };
      }
      const newWhKey =
        resolveWarehouseKeyByName(
          [...byId.values()],
          options?.forceWarehouseName ?? orderWarehouseName ?? '',
          warehouseFallback,
        ) || warehouseFallback;
      if (!newWhKey.trim()) {
        return {
          ok: false,
          reason: 'SalesCredit — ახალი Balance საწყობი ვერ განისაზღვრა',
        };
      }
      const creditOp = balanceSalesCreditOperationType();
      const allCtxs = [...warehouseGroups.values()].flat();
      const items = buildItemsForWarehouse(allCtxs, newWhKey);
      const doc: Record<string, unknown> = {
        uid: randomUUID(),
        BaseDocument: baseDoc,
        Date: dateStr,
        PaymentDate: dateStr,
        Warehouse: newWhKey,
        Client: balanceBuyerUid,
        ReceivablesAccount: receivablesAccount,
        RevenueAccount: revenueAccount,
        VATTaxable: vatTaxable,
        OperationType: creditOp,
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
      saleRows.push(doc);
    } else if (mode === 'refundCredit') {
      const creditOp = balanceRefundSalesCreditOperationType();
      const saleDocs = options?.balanceSaleDocuments ?? [];
      const includeDelivery = !options?.skipDeliveryLine;

      for (const [whKey, ctxs] of warehouseGroups) {
        const baseDoc =
          pickBaseSaleUid(saleDocs, whKey) ||
          options?.baseDocumentUid?.trim() ||
          '';
        if (!baseDoc || !isUuid(baseDoc)) {
          return {
            ok: false,
            reason: `Refund SalesCredit — BaseDocument (Sale uid) არ არის საწყობისთვის: ${whKey}`,
          };
        }
        const baseSaleDoc =
          await this.balanceExchange.tryFetchSaleByUid(baseDoc);
        if (baseSaleDoc) {
          const itemCount = Array.isArray(baseSaleDoc.Items)
            ? baseSaleDoc.Items.length
            : 0;
          this.logger.log(
            `[Refund SalesCredit] Sale GET ok · uid=${baseDoc} · Items=${itemCount}`,
          );
          if (Array.isArray(baseSaleDoc.Items)) {
            for (const [idx, raw] of baseSaleDoc.Items.entries()) {
              if (!raw || typeof raw !== 'object') continue;
              const r = raw as Record<string, unknown>;
              const lineUid = extractSaleLineUid(r);
              this.logger.log(
                `[Refund SalesCredit] Sale line ${idx + 1}: StringCode=${strField(r.StringCode)} · lineUid=${lineUid ? `${lineUid.slice(0, 8)}…` : '—'} · Number=${strField(r.Number)} · Series=${strField(r.Series).slice(0, 8)}…`,
              );
            }
          }
        } else {
          this.logger.warn(
            `[Refund SalesCredit] Sale GET ცარიელი/შეცდომა · uid=${baseDoc}`,
          );
        }
        const deliveryUidForFilter =
          deliveryItemUid.trim() || balanceSaleDeliveryItemUid().trim();
        const lineUidLookup = buildSaleLineUidLookup(
          baseSaleDoc ?? undefined,
          options?.balanceSalePutResponseBody,
        );
        if (lineUidLookup.size === 0) {
          this.logger.warn(
            `[Refund SalesCredit] Sale Items[].uid ვერ მოიძებნა GET/PUT-ში — Items.BaseDocument=${baseDoc.slice(0, 8)}… (დოკ. uid)`,
          );
        }
        let items = buildRefundSalesCreditItemsFromSaleGet(
          baseSaleDoc ?? undefined,
          baseDoc,
          lineUidLookup,
          deliveryUidForFilter,
          includeDelivery,
          goodsExpItemFallback,
        );
        if (!items.length) {
          this.logger.warn(
            `[Refund SalesCredit] Sale GET Items ცარიელია — fallback Mongo ხაზებზე`,
          );
          items = buildItemsForWarehouse(ctxs, whKey);
          if (includeDelivery && deliveryTotal > 0) {
            const dLine = buildDeliveryLineItem(
              deliveryTotal,
              revenueAccount,
              vatTaxable,
              deliveryItemUid,
              deliveryProduct,
              resolveLineVatRate,
              goodsInvFallback,
              goodsExpItemFallback,
              goodsVatPayItemFallback,
              docExpTrim,
              docVatTrim,
            );
            if (dLine) items = [...items, dLine];
          }
          items = finalizeRefundSalesCreditItems(
            items,
            goodsExpItemFallback,
            baseDoc,
          );
        }
        if (!items.length) {
          return {
            ok: false,
            reason: `Refund SalesCredit — ხაზები ცარიელია საწყობისთვის: ${whKey}`,
          };
        }
        for (const [idx, raw] of items.entries()) {
          if (!raw || typeof raw !== 'object') continue;
          const bd = strField(raw.BaseDocument);
          this.logger.log(
            `[Refund SalesCredit] credit line ${idx + 1}: Item=${strField(raw.Item).slice(0, 8)}… · BaseDocument=${bd ? `${bd.slice(0, 8)}…` : '—'}`,
          );
        }
        const saleHeader = pickSalesCreditRefundDocFromSale(baseSaleDoc, {
          department,
          currency,
          receivablesAccount,
          vatTaxable,
          vatArticle,
        });
        const reuseUid = pickReuseCreditUid(
          options?.reuseCreditDocuments,
          whKey,
        );
        const docUid = reuseUid && isUuid(reuseUid) ? reuseUid : randomUUID();
        if (reuseUid) {
          this.logger.warn(
            `[Refund SalesCredit] PUT update · warehouse=${whKey} · uid=${docUid}`,
          );
        }
        const doc: Record<string, unknown> = {
          ...saleHeader,
          uid: docUid,
          Date: todayDateOnly(),
          OperationType: creditOp,
          Warehouse: whKey,
          Client: balanceBuyerUid,
          Comments: comments,
          BaseDocument: baseDoc,
          Items: items,
        };
        saleRows.push(doc);
      }
    } else {
      for (const [whKey, ctxs] of warehouseGroups) {
        let items = buildItemsForWarehouse(ctxs, whKey);
        let docPaymentTotal = ctxs.reduce((s, { line }) => {
          const q = Number(line.quantity) || 0;
          const up = Number(line.unitPrice) || 0;
          const tp = Number(line.totalPrice);
          const lineAmt = Number.isFinite(tp) && tp > 0 ? tp : q * up;
          return s + lineAmt;
        }, 0);
        if (!deliveryAppended && deliveryTotal > 0) {
          const dLine = buildDeliveryLineItem(
            deliveryTotal,
            revenueAccount,
            vatTaxable,
            deliveryItemUid,
            deliveryProduct,
            resolveLineVatRate,
            goodsInvFallback,
            goodsExpItemFallback,
            goodsVatPayItemFallback,
            docExpTrim,
            docVatTrim,
          );
          if (dLine) {
            items = [...items, dLine];
            docPaymentTotal += deliveryTotal;
            deliveryAppended = true;
          } else {
            this.logger.warn(
              `[Balance Sale] მიტანის ხაზი გამოტოვებულია — ${deliveryItemMissingReason}`,
            );
          }
        }
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

        if (paymentType && paymentAccount && docPaymentTotal > 0) {
          doc.Payment = [
            {
              PaymentType: paymentType,
              PaymentAccount: paymentAccount,
              Amount: docPaymentTotal.toFixed(2),
            },
          ];
        }

        saleRows.push(doc);
      }
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
   * გაყიდვის ჩანაწერი Balance Exchange **Sale** (PUT, JSON მასივი), როცა BOG გადახდა
   * `completed`-ია (callback / mobile success fallback). `Client` = `Buyer.balanceBuyerUid`.
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
          deliveryPrice: order.deliveryPrice,
          deliveryServiceFee: order.deliveryServiceFee,
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
            {
              $set: {
                balanceSalePostError: assembled.reason.slice(0, 2000),
                balanceSalePutResponseAt: new Date(),
              },
              $unset: { balanceSalePostingLock: 1 },
            },
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

      this.logBalanceSaleOutgoing(
        'BOG completed — გადახდის შემდეგ',
        String(order._id),
        bogOrderId,
        saleRows,
        {
          skusMissingNomUid,
          skusMissingSeriesRef,
          warehouseGroupKeys,
        },
      );

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
      const balanceSaleDocuments = saleRows
        .map((row) => {
          const wh = row.Warehouse;
          const uid = row.uid;
          return {
            warehouse:
              typeof wh === 'string'
                ? wh.trim()
                : wh != null
                  ? String(wh as unknown).trim()
                  : '',
            uid:
              typeof uid === 'string'
                ? uid.trim()
                : uid != null
                  ? String(uid as unknown).trim()
                  : '',
          };
        })
        .filter((d) => d.warehouse && d.uid && isUuid(d.uid));
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              balanceSalePostedAt: new Date(),
              balanceSalePostError: '',
              balanceSaleDocuments,
              ...responseAudit,
            },
            $unset: { balanceSalePostingLock: 1 },
          },
        )
        .exec();
      this.logger.log(
        `[Balance Sale] OK შეკვეთა=${String(order._id)} Client=${balanceBuyerUid} · დოკ=${saleRows.length} (${warehouseGroupKeys.join('; ')})`,
      );
      this.logger.log(
        `[Balance Sale][BOG completed] ← Balance პასუხი HTTP ${result.status} · ${responseBodyStored.slice(0, 800)}`,
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
        deliveryPrice: order.deliveryPrice,
        deliveryServiceFee: order.deliveryServiceFee,
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

    await this.tryPostSaleAfterBogCompleted(
      { _id: orderId.toString() },
      {
        event: 'dev_simulate_bog_completed',
        source: 'dev_simulate',
      },
      bogPayId,
    );

    return {
      ok: true,
      message:
        'BOG completed სიმულაცია ჩაწერილია — Balance Sale PUT გაეშვა (ან უკვე იყო ჩაწერილი).',
    };
  }

  async tryPostWarehouseSalesCreditForRedispatch(
    orderId: string,
    params: { newWarehouseName: string; oldWarehouseName: string },
  ): Promise<{ ok: boolean; message: string; documentUid?: string }> {
    if (!Types.ObjectId.isValid(orderId)) {
      return { ok: false, message: 'შეკვეთა ვერ მოიძებნა' };
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) return { ok: false, message: 'შეკვეთა ვერ მოიძებნა' };
    if (!order.balanceSalePostedAt) {
      return {
        ok: true,
        message: 'Balance Sale ჯერ არ არის — SalesCredit არ სჭირდება',
      };
    }

    const products = await this.productModel
      .find({
        _id: {
          $in: order.items
            .map((i) => i.productId)
            .filter((id) => Types.ObjectId.isValid(String(id))),
        },
      })
      .select({ balanceStockBreakdown: 1 })
      .lean()
      .exec();
    const oldWhKey = resolveWarehouseKeyByName(
      products as ProductForSale[],
      params.oldWarehouseName,
      balanceSaleWarehouseFallback(),
    );
    const baseDoc = pickBaseSaleUid(order.balanceSaleDocuments, oldWhKey);
    if (!baseDoc) {
      const msg =
        'SalesCredit — balanceSaleDocuments/BaseDocument ვერ მოიძებნა';
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              balanceWarehouseCreditPostError: msg,
              'deliveryRedispatch.warehouseCreditPostError': msg,
            },
          },
        )
        .exec();
      return { ok: false, message: msg };
    }

    const assembled = await this.assembleSaleRowsFromOrder(
      {
        _id: order._id,
        userId: order.userId,
        items: order.items,
        warehouseId: order.warehouseId,
      },
      {
        bogOrderId: order.bogOrderId?.trim() || `REDISPATCH-CR-${orderId}`,
        inner: undefined,
        commentPrefixLines: [
          `[SalesCredit ${params.oldWarehouseName} → ${params.newWarehouseName}]`,
        ],
      },
      {
        mode: 'salesCredit',
        forceWarehouseName: params.newWarehouseName,
        baseDocumentUid: baseDoc,
      },
    );
    if (!assembled.ok) {
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              balanceWarehouseCreditPostError: assembled.reason,
              'deliveryRedispatch.warehouseCreditPostError': assembled.reason,
            },
          },
        )
        .exec();
      return { ok: false, message: assembled.reason };
    }

    const creditRows = assembled.saleRows;
    const result =
      await this.balanceExchange.putSalesCreditDocument(creditRows);
    const responseBodyStored = clipBalanceSaleResponseBody(result.raw);
    const creditUid = String(creditRows[0]?.uid ?? '').trim();
    const now = new Date();
    if (!result.ok) {
      const err = result.raw.slice(0, 500);
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              balanceWarehouseCreditPostError: err,
              balanceWarehouseCreditPutResponseStatus: result.status,
              balanceWarehouseCreditPutResponseBody: responseBodyStored,
              'deliveryRedispatch.warehouseCreditPostError': err,
            },
          },
        )
        .exec();
      return { ok: false, message: err };
    }

    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $set: {
            balanceWarehouseCreditPostedAt: now,
            balanceWarehouseCreditDocumentUid: creditUid,
            balanceWarehouseCreditPostError: '',
            balanceWarehouseCreditPutResponseStatus: result.status,
            balanceWarehouseCreditPutResponseBody: responseBodyStored,
            'deliveryRedispatch.warehouseCreditPostedAt': now,
            'deliveryRedispatch.warehouseCreditDocumentUid': creditUid,
            'deliveryRedispatch.warehouseCreditPostError': '',
          },
        },
      )
      .exec();
    return {
      ok: true,
      message: 'SalesCredit გაგზავნილია',
      documentUid: creditUid,
    };
  }

  /**
   * BOG refund-ის შემდეგ — Balance Exchange SalesCredit PUT.
   * OperationType: „დაბრუნება“ (env: BALANCE_REFUND_SALES_CREDIT_OPERATION_TYPE).
   * BaseDocument = ორიგინალი Sale uid (`balanceSaleDocuments`).
   */
  async tryPostSalesCreditForRefund(
    orderId: string,
    kind: 'products' | 'full',
    options?: {
      forceRetry?: boolean;
      reuseCreditDocuments?: Array<{ warehouse: string; uid: string }>;
    },
  ): Promise<{ ok: boolean; message: string; documentUids?: string[] }> {
    this.logger.warn(
      `[Refund SalesCredit] start · order=${orderId} · kind=${kind}` +
        (options?.forceRetry ? ' · forceRetry' : '') +
        (options?.reuseCreditDocuments?.length
          ? ` · reuseUids=${options.reuseCreditDocuments.map((d) => d.uid.slice(0, 8)).join(',')}`
          : ''),
    );
    if (!Types.ObjectId.isValid(orderId)) {
      return { ok: false, message: 'შეკვეთა ვერ მოიძებნა' };
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) return { ok: false, message: 'შეკვეთა ვერ მოიძებნა' };

    if (!order.balanceSalePostedAt) {
      return {
        ok: true,
        message: 'Balance Sale ჯერ არ არის — Refund SalesCredit გამოტოვებულია',
      };
    }
    if (order.balanceRefundCreditPostedAt && !options?.forceRetry) {
      return {
        ok: true,
        message: 'Balance Refund SalesCredit უკვe გაგზავნილია',
      };
    }
    if (!order.balanceSaleDocuments?.length) {
      const msg =
        'Refund SalesCredit — balanceSaleDocuments (Sale uid) არ არის';
      await this.orderModel
        .updateOne(
          { _id: order._id },
          { $set: { balanceRefundCreditPostError: msg } },
        )
        .exec();
      return { ok: false, message: msg };
    }

    const skipDelivery = kind === 'products';
    const assembled = await this.assembleSaleRowsFromOrder(
      {
        _id: order._id,
        userId: order.userId,
        items: order.items,
        warehouseId: order.warehouseId,
        deliveryPrice: order.deliveryPrice,
        deliveryServiceFee: order.deliveryServiceFee,
      },
      {
        bogOrderId: order.bogOrderId?.trim() || `REFUND-${orderId}`,
        inner: undefined,
        commentPrefixLines: [
          `[BOG refund ${kind} → Balance SalesCredit]`,
          order.bogProductsRefundActionId
            ? `BOG action=${order.bogProductsRefundActionId}`
            : '',
        ].filter(Boolean),
      },
      {
        mode: 'refundCredit',
        skipDeliveryLine: skipDelivery,
        balanceSaleDocuments: order.balanceSaleDocuments,
        balanceSalePutResponseBody: order.balanceSalePutResponseBody,
        reuseCreditDocuments: options?.reuseCreditDocuments,
      },
    );

    if (!assembled.ok) {
      await this.orderModel
        .updateOne(
          { _id: order._id },
          { $set: { balanceRefundCreditPostError: assembled.reason } },
        )
        .exec();
      return { ok: false, message: assembled.reason };
    }

    const creditRows = assembled.saleRows;
    this.logBalanceSaleOutgoing(
      `BOG refund ${kind} → SalesCredit`,
      orderId,
      order.bogOrderId?.trim() || `REFUND-${orderId}`,
      creditRows,
      {
        skusMissingNomUid: assembled.skusMissingNomUid,
        skusMissingSeriesRef: assembled.skusMissingSeriesRef,
        warehouseGroupKeys: assembled.warehouseGroupKeys,
      },
    );

    const result =
      await this.balanceExchange.putSalesCreditDocument(creditRows);
    const responseBodyStored = clipBalanceSaleResponseBody(result.raw);
    const now = new Date();
    const creditDocuments = creditRows
      .map((row) => {
        const wh = row.Warehouse;
        const uid = row.uid;
        return {
          warehouse:
            typeof wh === 'string'
              ? wh.trim()
              : wh != null
                ? String(wh as unknown).trim()
                : '',
          uid:
            typeof uid === 'string'
              ? uid.trim()
              : uid != null
                ? String(uid as unknown).trim()
                : '',
        };
      })
      .filter((d) => d.warehouse && d.uid && isUuid(d.uid));

    if (!result.ok) {
      const err = formatBalanceExchangeError(result.raw, result.status);
      this.logger.warn(
        `[Refund SalesCredit] Balance უარი · order=${orderId} · HTTP ${result.status}\n${result.raw.slice(0, 2000)}`,
      );
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              balanceRefundCreditPostError: err,
              balanceRefundCreditPutResponseStatus: result.status,
              balanceRefundCreditPutResponseBody: responseBodyStored,
            },
          },
        )
        .exec();
      return { ok: false, message: err };
    }

    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $set: {
            balanceRefundCreditPostedAt: now,
            balanceRefundCreditKind: kind,
            balanceRefundCreditDocuments: creditDocuments,
            balanceRefundCreditPostError: '',
            balanceRefundCreditPutResponseStatus: result.status,
            balanceRefundCreditPutResponseBody: responseBodyStored,
          },
          $push: {
            balanceRefundCreditHistory: {
              $each: creditDocuments.map((d) => ({
                warehouse: d.warehouse,
                uid: d.uid,
                postedAt: now,
              })),
            },
          },
        },
      )
      .exec();

    return {
      ok: true,
      message: `Balance Refund SalesCredit გაგზავნილია (${kind}, ${creditDocuments.length} დოკ.)`,
      documentUids: creditDocuments.map((d) => d.uid),
    };
  }

  async tryPostDeliverySaleForRedispatch(orderId: string): Promise<void> {
    if (!Types.ObjectId.isValid(orderId)) return;
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order?.deliveryRedispatch) return;
    const rd = order.deliveryRedispatch;
    if (rd.balanceDeliverySalePostedAt) return;
    if (rd.status !== 'paid' && rd.status !== 'completed') return;

    const amount = Number(rd.amountDue) || 0;
    if (amount <= 0) return;

    const lockRes = await this.orderModel
      .updateOne(
        {
          _id: order._id,
          'deliveryRedispatch.balanceDeliverySalePostedAt': { $exists: false },
        },
        {
          $set: {
            'deliveryRedispatch.balanceDeliverySalePostingLock': new Date(),
          },
        },
      )
      .exec();
    if (lockRes.modifiedCount === 0) return;

    const bogId =
      rd.bogPaymentOrderId?.trim() ||
      order.bogOrderId?.trim() ||
      `REDISPATCH-${orderId}`;

    const assembled = await this.assembleSaleRowsFromOrder(
      {
        _id: order._id,
        userId: order.userId,
        items: order.items,
        warehouseId: order.warehouseId,
      },
      {
        bogOrderId: bogId,
        inner: undefined,
        commentPrefixLines: [`[Redispatch delivery · ${rd.newWarehouseName}]`],
      },
      {
        mode: 'deliveryOnly',
        forceWarehouseName: rd.newWarehouseName,
        deliveryAmount: amount,
      },
    );
    if (!assembled.ok) {
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              'deliveryRedispatch.balanceDeliverySalePostError':
                assembled.reason,
            },
            $unset: { 'deliveryRedispatch.balanceDeliverySalePostingLock': 1 },
          },
        )
        .exec();
      return;
    }

    this.logBalanceSaleOutgoing(
      'Redispatch delivery — გადახდის შემდეგ',
      String(order._id),
      bogId,
      assembled.saleRows,
      {
        skusMissingNomUid: assembled.skusMissingNomUid,
        skusMissingSeriesRef: assembled.skusMissingSeriesRef,
        warehouseGroupKeys: assembled.warehouseGroupKeys,
      },
    );

    const result = await this.balanceExchange.putSaleDocument(
      assembled.saleRows,
    );
    const docUid = String(assembled.saleRows[0]?.uid ?? '').trim();
    const now = new Date();
    if (!result.ok) {
      await this.orderModel
        .updateOne(
          { _id: order._id },
          {
            $set: {
              'deliveryRedispatch.balanceDeliverySalePostError':
                result.raw.slice(0, 500),
              'deliveryRedispatch.balanceDeliverySalePutResponseStatus':
                result.status,
            },
            $unset: { 'deliveryRedispatch.balanceDeliverySalePostingLock': 1 },
          },
        )
        .exec();
      return;
    }

    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $set: {
            'deliveryRedispatch.balanceDeliverySalePostedAt': now,
            'deliveryRedispatch.balanceDeliverySaleDocumentUid': docUid,
            'deliveryRedispatch.balanceDeliverySalePostError': '',
            'deliveryRedispatch.balanceDeliverySalePutResponseStatus':
              result.status,
          },
          $unset: { 'deliveryRedispatch.balanceDeliverySalePostingLock': 1 },
        },
      )
      .exec();
  }

  async retryBalanceSaleForAdmin(
    orderId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) return { ok: false, message: 'შეკვეთა ვერ მოიძებნა' };
    if (order.balanceSalePostedAt) {
      return { ok: false, message: 'Balance Sale უკვე გაგზავნილია' };
    }
    if ((order.bogPaymentStatus || '').toLowerCase() !== 'completed') {
      return { ok: false, message: 'BOG completed არ არის' };
    }
    await this.orderModel
      .updateOne(
        { _id: order._id },
        { $unset: { balanceSalePostingLock: 1, balanceSalePostError: 1 } },
      )
      .exec();
    await this.tryPostSaleAfterBogCompleted(
      { _id: orderId },
      { event: 'admin_retry', source: 'admin' },
      order.bogOrderId?.trim() || `ADMIN-${orderId}`,
    );
    const fresh = await this.orderModel.findById(orderId).lean().exec();
    if (fresh?.balanceSalePostedAt) {
      return { ok: true, message: 'Balance Sale გაგზავნილია' };
    }
    return {
      ok: false,
      message: fresh?.balanceSalePostError?.slice(0, 300) || 'PUT ვერ მოხერხდა',
    };
  }

  async retryWarehouseCreditForAdmin(
    orderId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order?.deliveryRedispatch) {
      return { ok: false, message: 'Redispatch არ არის' };
    }
    if (order.deliveryRedispatch.warehouseCreditPostedAt) {
      return { ok: false, message: 'SalesCredit უკვe გაგზავნილია' };
    }
    let oldName = order.pickupAddress?.warehouseName?.trim() ?? '';
    if (!oldName && order.warehouseId) {
      const wh = await this.warehouseModel
        .findById(order.warehouseId)
        .select({ name: 1 })
        .lean()
        .exec();
      oldName = wh?.name?.trim() ?? '';
    }
    const newName = order.deliveryRedispatch.newWarehouseName?.trim() ?? '';
    if (!oldName || !newName) {
      return { ok: false, message: 'საწყობის სახელები ვერ განისაზღვრა' };
    }
    return this.tryPostWarehouseSalesCreditForRedispatch(orderId, {
      newWarehouseName: newName,
      oldWarehouseName: oldName,
    });
  }

  async retryDeliverySaleForAdmin(
    orderId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order?.deliveryRedispatch) {
      return { ok: false, message: 'Redispatch არ არის' };
    }
    if (order.deliveryRedispatch.balanceDeliverySalePostedAt) {
      return { ok: false, message: 'მიტანის Sale უკვe გაგზავნილია' };
    }
    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $unset: {
            'deliveryRedispatch.balanceDeliverySalePostingLock': 1,
            'deliveryRedispatch.balanceDeliverySalePostError': 1,
          },
        },
      )
      .exec();
    await this.tryPostDeliverySaleForRedispatch(orderId);
    const fresh = await this.orderModel.findById(orderId).lean().exec();
    if (fresh?.deliveryRedispatch?.balanceDeliverySalePostedAt) {
      return { ok: true, message: 'მიტანის Balance Sale გაგზავნილია' };
    }
    return {
      ok: false,
      message:
        fresh?.deliveryRedispatch?.balanceDeliverySalePostError?.slice(
          0,
          300,
        ) || 'PUT ვერ მოხერხდა',
    };
  }

  async retryRefundSalesCreditForAdmin(
    orderId: string,
  ): Promise<{ ok: boolean; message: string }> {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) return { ok: false, message: 'შეკვეთა ვერ მოიძებნა' };
    if (!order.bogProductsRefundAt) {
      return { ok: false, message: 'BOG refund ჯერ არ არის' };
    }
    const kind = order.bogRefundKind === 'full' ? 'full' : 'products';
    const reuseCreditDocuments = collectReuseCreditDocuments(order);
    if (reuseCreditDocuments.length > 0) {
      this.logger.warn(
        `[Refund SalesCredit] admin retry · order=${orderId} · reuse ${reuseCreditDocuments.length} uid(s): ${reuseCreditDocuments.map((d) => d.uid.slice(0, 8)).join(', ')}`,
      );
    } else {
      this.logger.warn(
        `[Refund SalesCredit] admin retry · order=${orderId} · ახალი uid (ისტორია ცარიელია — Balance-ში ხელით წაშალე ძველი SalesCredit თუ უკვe არსებობს)`,
      );
    }
    await this.orderModel
      .updateOne(
        { _id: order._id },
        {
          $unset: {
            balanceRefundCreditPostedAt: 1,
            balanceRefundCreditPostError: 1,
            balanceRefundCreditPutResponseStatus: 1,
            balanceRefundCreditPutResponseBody: 1,
          },
        },
      )
      .exec();
    return this.tryPostSalesCreditForRefund(orderId, kind, {
      forceRetry: true,
      reuseCreditDocuments,
    });
  }
}
