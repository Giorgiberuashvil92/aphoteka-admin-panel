/**
 * BOG `completed` → Balance Exchange Sale (PUT) — კომპანიის/დოკუმენტის ნაგულისხმევები.
 * შეავსე აქ (უპირატესესობა env-ზე); ცარიელი ველი → ვეცადებთ იგივე სახელის `process.env`-ს.
 */

export type BalanceSaleInlineConfig = {
  /** ცარიელი → `BALANCE_SALE_PUT_URL` env ან `https://cloud.balance.ge/sm/.../Exchange/Sale` */
  salePutUrl: string;
  /**
   * Sale `ReceivablesAccount` — კომპანიის ნაგულისხმევი, თუ Mongo Buyer-ზე `balanceReceivablesAccount` ცარიელია.
   * მყიდველზე მიბმული ანგარიში უპირატესდება (Balance მყიდველის კატალოგი).
   */
  receivablesAccount: string;
  revenueAccount: string;
  warehouseFallback: string;
  vatTaxable: string;
  operationType: string;
  cashRegister: string;
  department: string;
  vatArticle: string;
  currency: string;
  expensesAccount: string;
  vatAccount: string;
  receivablesWriteoffAccount: string;
  paymentType: string;
  paymentAccount: string;
  /**
   * Sale `Items[].Unit` — უპირატესად **კატალოგის GUID** (`unitOfMeasure` Mongo-ში).
   * Item=ნომენკლატურის GUID-ზე ცარიელი/არა-GUID ხშირად OK (Balance: ნაგულ. Item-იდან).
   * Item=SKU/ტექსტისას ტექსტური ფოლბექი (აქ / env) — სვეტი „ერთ.“ რომ არ დარჩეს ცარიელი.
   */
  itemUnit: string;
  /**
   * `true` — `Item` კატალოგში SKU (`StringCode`);
   * `false` — სახელი (იგივე რაც ძველი `BALANCE_SALE_ITEM_USE_SKU_AS_ITEM_CATALOG=0`).
   */
  itemUseSkuAsItemCatalog: boolean;
  /**
   * Sale `Items[].VATRate` — Balance **კატალოგი** (ხშირად მხოლოდ **GUID** მუშაობს JSON-ში).
   * გლობალური fallback, როცა პროდუქტზე `balanceVatRateUid` და taxation-map-ი ცარიელია.
   * `BALANCE_SALE_ITEM_VAT_RATE` env; ტექსტური სახელი — `itemVatRateAllowNonGuid: true` ან env `BALANCE_SALE_ITEM_VAT_RATE_ALLOW_NON_GUID=1`.
   */
  itemVatRate: string;
  /**
   * `true` — `VATRate`-ზე არა-GUID ტექსტის გაგზავნა დაიშვება (სატესტოდ: "ჩვეულებრივი", "ნულოვანი" და ა.შ.).
   * პროდში გამორთული დატოვე; env გადააფარებს: `BALANCE_SALE_ITEM_VAT_RATE_ALLOW_NON_GUID=1/0`.
   */
  itemVatRateAllowNonGuid: boolean;
  /**
   * `product.taxation` ტექსტი (Balance Items → `VATRate`) → კატალოგის **GUID**.
   * გასაღები — Balance-ის ზუსტი ქართული სახელი ან ქვედარეგისტრი ლათინური alias-ი ({regular, zero, exempt, noVat}).
   * env: `BALANCE_SALE_VAT_RATE_REGULAR`, `BALANCE_SALE_VAT_RATE_ZERO`,
   *      `BALANCE_SALE_VAT_RATE_WITHOUT_VAT`, `BALANCE_SALE_VAT_RATE_EXEMPT`.
   */
  itemVatRateMap: Partial<{
    regular: string;
    zero: string;
    withoutVat: string;
    exempt: string;
  }>;
  /**
   * საქონლის ხაზი (`Item` = GUID): `Items[].AccountNumber` — თუ პროდუქტზე `balanceInventoriesAccount` ცარიელია.
   * `BALANCE_SALE_ITEM_GOODS_INVENTORY_ACCOUNT`
   */
  itemGoodsInventoryAccount: string;
  /** `Items[].ExpensesAccount` ფოლბექი; ხშირად იგივე რაც დოკუმენტის `expensesAccount`. `BALANCE_SALE_ITEM_GOODS_EXPENSES_ACCOUNT` */
  itemGoodsExpensesAccount: string;
  /** `Items[].VATPayableAccount` ფოლბექი (VAT>0); ხშირად == `vatAccount`. `BALANCE_SALE_ITEM_GOODS_VAT_PAYABLE_ACCOUNT` */
  itemGoodsVatPayableAccount: string;
  /**
   * `true` — ჩართულია `POST /api/payments/bog/test-balance-sale` (გადახდის გარეშე Balance PUT).
   * პროდში გამორთული დატოვე; ან `BALANCE_SALE_TEST_PUT_ENABLED=1`.
   */
  testPutEnabled: boolean;
  /**
   * `true` — Sale PUT-ის სრული JSON Nest ლოგში (დევში ტესტისთვის).
   * გამორთვა: `false` აქ ან `BALANCE_LOG_SALE_REQUEST=0`.
   */
  logSaleRequestBody: boolean;
};

export const BALANCE_SALE_INLINE: BalanceSaleInlineConfig = {
  salePutUrl: '',
  /**
   * Sale `ReceivablesAccount` — **სტანდარტული, ყოველ დოკუმენტზე ერთი და იგივე**.
   * მოთხოვნილი საბანკო IBAN: `GE59BG0000000611719869`.
   * Buyer-ის `balanceReceivablesAccount` — იგნორირდება (ეს inline უპირატესდება).
   */
  receivablesAccount: 'GE59BG0000000611719869',
  /** დოკუმენტის RevenueAccount — ხშირად იგივე რაც პროდუქტის RevenuesAccount (მაგ. 6110). */
  revenueAccount: '6110',
  warehouseFallback: '',
  vatTaxable: '',
  operationType: '',
  cashRegister: '',
  department: '',
  vatArticle: '',
  currency: '',
  expensesAccount: '',
  vatAccount: '',
  receivablesWriteoffAccount: '',
  paymentType: '',
  paymentAccount: '',
  /** ფოლბექი `Items.Unit`-ისთვის, როცა `Item` არა-GUIDა; Item=GUID-ზე ტექსტი არ გამოიყენება (ნაგულ. Item-იდან). */
  itemUnit: 'ცალი',
  itemUseSkuAsItemCatalog: true,
  /**
   * დღგ-ის განაკვეთის კატალოგის **GUID** (ან env `BALANCE_SALE_ITEM_VAT_RATE`) — global fallback.
   * სატესტოდ Balance-ის enum ტექსტიც შეიძლება ჩაისვას (`itemVatRateAllowNonGuid: true` აუცილებელია).
   */
  itemVatRate: 'ჩვეულებრივი',
  /** სატესტო: ტექსტური „ჩვეულებრივი“ დაიშვას ზემოთ `itemVatRate`-ში. პროდზე `false`-ს დაიბრუნე და GUID ჩასვი. */
  itemVatRateAllowNonGuid: true,
  /**
   * taxation → GUID map. შეავსე Balance-ის კატალოგის GUID-ით (ხშირად საკმარისია ერთი — `regular`).
   * ცარიელი → env fallback-ები (BALANCE_SALE_VAT_RATE_REGULAR და ა.შ.) → `itemVatRate` global.
   */
  /**
   * სატესტოდ — Balance Enum-ის ქართული ტექსტები (`itemVatRateAllowNonGuid: true`-ზე).
   * პროდაქშენზე — შეცვალე Balance-ის კატალოგის **GUID**-ებით (დღგ-ის განაკვეთის ცნობარი).
   */
  itemVatRateMap: {
    regular: 'ჩვეულებრივი',
    zero: 'ნულოვანი',
    withoutVat: 'დღგ-ის გარეშე',
    exempt: 'დაუბეგრავი',
  },
  itemGoodsInventoryAccount: '',
  itemGoodsExpensesAccount: '',
  itemGoodsVatPayableAccount: '',
  /** ლოკალური დევ-ტესტი (მობილური „BOG გარეთ“, test-balance-sale). პროდაქშენზე აუცილებლად `false`. */
  testPutEnabled: true,
  logSaleRequestBody: true,
};

function envStr(key: string): string {
  return process.env[key]?.trim() ?? '';
}

/** ინლაინი თუ შევსებულია — ის; სხვა შემთხვევაში env */
function pick(inline: string, envKey: string): string {
  const i = inline?.trim() ?? '';
  if (i) return i;
  return envStr(envKey);
}

/** ინლაინი/env ცარიელია → `def` (Balance OpenAPI-ის ნაგულისხმევი enum ტექსტები). */
function pickWithDefault(inline: string, envKey: string, def: string): string {
  const p = pick(inline, envKey).trim();
  return p || def.trim();
}

/** Sale `VATTaxable` — დოკ. enum, ნაგულ. Client-ის მიხედვით / „იბეგრება დღგ-ით“. */
export const BALANCE_SALE_DEFAULT_VAT_TAXABLE = 'იბეგრება დღგ-ით';
/** Sale `OperationType` — „მიწოდება კომპენსაციით“. */
export const BALANCE_SALE_DEFAULT_OPERATION_TYPE = 'მიწოდება კომპენსაციით';
/** Sale `VATArticle` — „მიწოდება კომპენსაციით“. */
export const BALANCE_SALE_DEFAULT_VAT_ARTICLE = 'მიწოდება კომპენსაციით';

export function balanceSalePutUrlInline(): string {
  return pick(BALANCE_SALE_INLINE.salePutUrl, 'BALANCE_SALE_PUT_URL');
}

export function balanceSaleReceivablesAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.receivablesAccount,
    'BALANCE_SALE_RECEIVABLES_ACCOUNT',
  );
}

export function balanceSaleRevenueAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.revenueAccount,
    'BALANCE_SALE_REVENUE_ACCOUNT',
  );
}

export function balanceSaleWarehouseFallback(): string {
  return (
    pick(
      BALANCE_SALE_INLINE.warehouseFallback,
      'BALANCE_SALE_WAREHOUSE_FALLBACK',
    ) || envStr('BALANCE_SALE_WAREHOUSE')
  );
}

export function balanceSaleVatTaxable(): string {
  return pickWithDefault(
    BALANCE_SALE_INLINE.vatTaxable,
    'BALANCE_SALE_VAT_TAXABLE',
    BALANCE_SALE_DEFAULT_VAT_TAXABLE,
  );
}

export function balanceSaleOperationType(): string {
  return pickWithDefault(
    BALANCE_SALE_INLINE.operationType,
    'BALANCE_SALE_OPERATION_TYPE',
    BALANCE_SALE_DEFAULT_OPERATION_TYPE,
  );
}

export function balanceSaleCashRegister(): string {
  return pick(BALANCE_SALE_INLINE.cashRegister, 'BALANCE_SALE_CASH_REGISTER');
}

export function balanceSaleDepartment(): string {
  return pick(BALANCE_SALE_INLINE.department, 'BALANCE_SALE_DEPARTMENT');
}

export function balanceSaleVatArticle(): string {
  return pickWithDefault(
    BALANCE_SALE_INLINE.vatArticle,
    'BALANCE_SALE_VAT_ARTICLE',
    BALANCE_SALE_DEFAULT_VAT_ARTICLE,
  );
}

export function balanceSaleCurrency(): string {
  return pick(BALANCE_SALE_INLINE.currency, 'BALANCE_SALE_CURRENCY');
}

export function balanceSaleDocumentExpensesAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.expensesAccount,
    'BALANCE_SALE_EXPENSES_ACCOUNT',
  );
}

export function balanceSaleDocumentVatAccount(): string {
  return pick(BALANCE_SALE_INLINE.vatAccount, 'BALANCE_SALE_VAT_ACCOUNT');
}

export function balanceSaleReceivablesWriteoffAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.receivablesWriteoffAccount,
    'BALANCE_SALE_RECEIVABLES_WRITEOFF_ACCOUNT',
  );
}

export function balanceSalePaymentType(): string {
  return pick(BALANCE_SALE_INLINE.paymentType, 'BALANCE_SALE_PAYMENT_TYPE');
}

export function balanceSalePaymentAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.paymentAccount,
    'BALANCE_SALE_PAYMENT_ACCOUNT',
  );
}

export function balanceSaleItemUnitFallback(): string {
  return pick(BALANCE_SALE_INLINE.itemUnit, 'BALANCE_SALE_ITEM_UNIT');
}

export function balanceSaleItemVatRate(): string {
  return pick(BALANCE_SALE_INLINE.itemVatRate, 'BALANCE_SALE_ITEM_VAT_RATE');
}

type VatRateKey = 'regular' | 'zero' | 'withoutVat' | 'exempt';

const VAT_RATE_ENV_KEYS: Record<VatRateKey, string> = {
  regular: 'BALANCE_SALE_VAT_RATE_REGULAR',
  zero: 'BALANCE_SALE_VAT_RATE_ZERO',
  withoutVat: 'BALANCE_SALE_VAT_RATE_WITHOUT_VAT',
  exempt: 'BALANCE_SALE_VAT_RATE_EXEMPT',
};

/** taxation-key-ის შესაბამისი inline ან env GUID — რიგრიგობით. */
function vatRateMapLookup(key: VatRateKey): string {
  return pick(
    BALANCE_SALE_INLINE.itemVatRateMap?.[key] || '',
    VAT_RATE_ENV_KEYS[key],
  );
}

/**
 * `product.taxation` ტექსტი (როგორც Balance აბრუნებს) → კატალოგის GUID.
 * უცნობ taxation-ზე → ''. შეავსე map-ი balance-sale-inline.ts → itemVatRateMap ან env.
 */
export function balanceSaleVatRateUidForTaxation(
  taxation: string | null | undefined,
): string {
  if (!taxation) return '';
  const t = taxation.trim();
  if (!t) return '';
  const lower = t.toLowerCase();
  if (
    t === 'ჩვეულებრივი' ||
    lower === 'regular' ||
    /^\d+\s*%?$/.test(lower) ||
    lower === '18' ||
    lower === '18%'
  ) {
    return vatRateMapLookup('regular');
  }
  if (t === 'ნულოვანი' || lower === 'zero' || lower === '0' || lower === '0%') {
    return vatRateMapLookup('zero');
  }
  if (
    t === 'დღგ-ის გარეშე' ||
    t === 'დღგ–ის გარეშე' ||
    lower === 'withoutvat' ||
    lower === 'without vat' ||
    lower === 'no vat' ||
    lower === 'novat'
  ) {
    return vatRateMapLookup('withoutVat');
  }
  if (t === 'დაუბეგრავი' || lower === 'exempt') {
    return vatRateMapLookup('exempt');
  }
  return '';
}

export function balanceSaleItemGoodsInventoryAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.itemGoodsInventoryAccount,
    'BALANCE_SALE_ITEM_GOODS_INVENTORY_ACCOUNT',
  );
}

export function balanceSaleItemGoodsExpensesAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.itemGoodsExpensesAccount,
    'BALANCE_SALE_ITEM_GOODS_EXPENSES_ACCOUNT',
  );
}

export function balanceSaleItemGoodsVatPayableAccount(): string {
  return pick(
    BALANCE_SALE_INLINE.itemGoodsVatPayableAccount,
    'BALANCE_SALE_ITEM_GOODS_VAT_PAYABLE_ACCOUNT',
  );
}

/**
 * `VATRate`-ზე არა-GUID სტრიქონის გაგზავნა (რისკიანია; Balance ხშირად მაინც არ იღებს).
 * ჯერ env (`1`/`0` აშკარად გადააფარებს), მერე inline `itemVatRateAllowNonGuid`.
 */
export function balanceSaleItemVatRateAllowNonGuid(): boolean {
  const envRaw = envStr('BALANCE_SALE_ITEM_VAT_RATE_ALLOW_NON_GUID');
  if (envRaw === '1') return true;
  if (envRaw === '0') return false;
  return BALANCE_SALE_INLINE.itemVatRateAllowNonGuid === true;
}

/**
 * `true` — assemble-ში წინასწარი შემოწმება (ნომენკლატურის GUID, საქონლის ანგარიშები) — PUT არ გაიგზავნება ცარიელი ველებით.
 * ნაგულისხმევად `false` — PUT მიდის Balance-ზე, შეცდომა იქ ჩანს (`balanceSalePostError` / ლოგი).
 * `BALANCE_SALE_STRICT_ASSEMBLE=1`
 */
export function balanceSaleStrictAssemble(): boolean {
  return envStr('BALANCE_SALE_STRICT_ASSEMBLE') === '1';
}

/** `true` = SKU კატალოგი; `false` = სახელი. env `BALANCE_SALE_ITEM_USE_SKU_AS_ITEM_CATALOG=0` იგივეა რაც `false` */
export function balanceSaleItemUseSkuAsItemCatalog(): boolean {
  const envRaw = envStr('BALANCE_SALE_ITEM_USE_SKU_AS_ITEM_CATALOG');
  if (envRaw === '0') return false;
  if (envRaw === '1') return true;
  return BALANCE_SALE_INLINE.itemUseSkuAsItemCatalog;
}

/** დროებითი ტესტი — Balance Sale PUT BOG-ის გარეშე */
export function balanceSaleTestPutEnabled(): boolean {
  if (envStr('BALANCE_SALE_TEST_PUT_ENABLED') === '1') return true;
  return BALANCE_SALE_INLINE.testPutEnabled === true;
}

/** Sale PUT სხეულის დალოგვა — `BALANCE_LOG_SALE_REQUEST=1` იძლევა ძალას env-ითაც */
export function balanceSaleShouldLogRequestBody(): boolean {
  if (envStr('BALANCE_LOG_SALE_REQUEST') === '0') return false;
  if (envStr('BALANCE_LOG_SALE_REQUEST') === '1') return true;
  return BALANCE_SALE_INLINE.logSaleRequestBody === true;
}

/** სიმბოლოების ლიმიტი ერთ ლოგ ბლოკზე; `BALANCE_LOG_SALE_REQUEST_MAX_CHARS` */
export function balanceSaleRequestBodyLogMaxChars(): number {
  const raw = envStr('BALANCE_LOG_SALE_REQUEST_MAX_CHARS');
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 2000) return Math.min(n, 200_000);
  return 32_000;
}
