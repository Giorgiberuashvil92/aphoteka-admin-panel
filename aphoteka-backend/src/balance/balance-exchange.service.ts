import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  BALANCE_DEV_DEFAULT_USER_NAME,
  BALANCE_DEV_DEFAULT_USER_PASSWORD,
} from '../config/balance-default-auth.js';
import {
  balanceSalePutUrlInline,
  balanceSaleRequestBodyLogMaxChars,
  balanceSaleShouldLogRequestBody,
} from '../config/balance-sale-inline';

/** Next admin `BALANCE_PUBLICATION_TARGET` — იგივე Application ID Exchange URL-ში */
const DEFAULT_BALANCE_PUBLICATION_ID = '7596';

/**
 * Balance.ge Exchange — `POST .../Clients` სხეული **მასივია** (ერთი ობიექტით),
 * მაგ: `https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Clients`
 */
export type CreateBalanceBuyerParams = {
  accountType: 'individual' | 'legal';
  name: string;
  fullName: string;
  idCode: string;
  email: string;
  phoneE164: string;
  legalAddress?: string;
  country?: string;
  representative?: string;
};

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : t.slice(0, max);
}

function extractUidFromJson(data: unknown): string | null {
  if (Array.isArray(data) && data.length > 0) {
    return extractUidFromJson(data[0]);
  }
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  for (const key of ['uid', 'UID', 'Uuid', 'UUID', 'Ref', 'ref']) {
    const v = o[key];
    if (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)) return v;
    if (v && typeof v === 'object' && 'uid' in v) {
      const u = (v as { uid?: string }).uid;
      if (typeof u === 'string' && /^[0-9a-f-]{36}$/i.test(u)) return u;
    }
  }
  if (Array.isArray(o.value) && o.value[0] && typeof o.value[0] === 'object') {
    return extractUidFromJson(o.value[0]);
  }
  return null;
}

/**
 * Balance Clients ერთი ჩანაწერი — `fetch` მაგალითის სტრუქტურა/ველების რიგითობა
 * (https://cloud.balance.ge/.../Exchange/Clients).
 * `Plannedaccruals` / `SettlementConditions` — ერთი ჩანაწერი ცარიელი სტრინგებით (არა `[]`).
 */
function buildClientExchangeRow(
  params: CreateBalanceBuyerParams,
  cfg: {
    legalForm: string;
    legalAddress: string;
    physicalAddress: string;
    country: string;
    groupUid: string;
    currency: string;
    vatType: string;
    /** `true` — `uid`-ში `randomUUID()` (თუ Balance ცარიელ `uid`-ს არ იღებს) */
    sendClientUid: boolean;
  },
): Record<string, unknown> {
  const name = clip(params.name, 150);
  const fullName = clip(
    params.fullName.trim() ? params.fullName : params.name,
    150,
  );
  const id = clip(params.idCode, 50);
  const email = clip(params.email, 200);
  const phone = clip(params.phoneE164, 50);
  const rep = params.representative?.trim()
    ? clip(params.representative.trim(), 500)
    : '';
  const group =
    cfg.groupUid && /^[0-9a-f-]{36}$/i.test(cfg.groupUid) ? cfg.groupUid : '';
  const uid = cfg.sendClientUid ? randomUUID() : '';

  return {
    uid,
    Name: name,
    Group: group,
    FullName: fullName,
    ID: id,
    LegalForm: cfg.legalForm,
    Currency: cfg.currency,
    VATType: cfg.vatType,
    ByAgreements: false,
    MainAgreement: '',
    ReceivablesAccount: '',
    CashFlowArticle: '',
    AdvancesAccount: '',
    SettlementByDocuments: false,
    ThisIsHeadBranch: false,
    AccordingToHeadBranches: false,
    HeadBranch: '',
    DoNotCreateWayBillAutomatically: '',
    SalesRepresentative: rep,
    IsPlannedaccruals: false,
    AdditionalRequisites3: '',
    AdditionalRequisites1: '',
    AdditionalRequisites2: '',
    VATArticle: '',
    Pricetype: '',
    LegalAddress: cfg.legalAddress,
    PhysicalAddress: cfg.physicalAddress,
    Phone: phone,
    Fax: '',
    Email: email,
    PostAddress: '',
    AdditionalInformation: rep,
    Country: cfg.country,
    ExtCode: '',
    BankAccount: '',
    ContactInformation: [{ PhysicalAddress: cfg.physicalAddress }],
    Emails: [{ Email: email }],
    Plannedaccruals: [
      {
        Date: '',
        Item: '',
        Quantity: '',
        RevenueExpensesAnalytics: '',
        Sum: '',
      },
    ],
    Phones: [{ Phone: phone }],
    SettlementConditions: [
      {
        TheCondition: '',
        Date: '',
      },
    ],
  };
}

@Injectable()
export class BalanceExchangeService {
  private readonly logger = new Logger(BalanceExchangeService.name);

  constructor(private readonly config: ConfigService) {}

  /** ConfigService + `process.env` (Railway/CLI ზოგჯერ მხოლოდ იქ აყენებს Balance-ს) */
  private env(key: string): string | undefined {
    const raw = this.config.get<string>(key) ?? process.env[key];
    if (raw == null) return undefined;
    const t = String(raw).trim();
    return t.length > 0 ? t : undefined;
  }

  /**
   * Next `balanceClient`-თან იგივე ჯაჭვი; ბოლოს `src/lib/balance-default-auth.ts` ნაგულისხმევები.
   * პაროლში `+`, `#` — `.env`-ში ბრჭყალებში: BALANCE_USER_PASSWORD="1985+Mai"
   */
  private balanceBasicUser(): string | undefined {
    return (
      this.env('BALANCE_API_USER') ||
      this.env('BALANCE_USER_NAME') ||
      this.env('BALANCE_USERNAME') ||
      this.env('BALANCE_USER') ||
      BALANCE_DEV_DEFAULT_USER_NAME
    );
  }

  private balanceBasicPassword(): string | undefined {
    return (
      this.env('BALANCE_API_PASSWORD') ||
      this.env('BALANCE_USER_PASSWORD') ||
      this.env('BALANCE_PASSWORD') ||
      BALANCE_DEV_DEFAULT_USER_PASSWORD
    );
  }

  private hasCredentials(): boolean {
    if (this.env('BALANCE_AUTHORIZATION')) return true;
    const u = this.balanceBasicUser();
    const p = this.balanceBasicPassword();
    return !!(u && p);
  }

  /** `BALANCE_PUBLICATION_ID` env ან ნაგულისხმევი `7596` (იგივე რაც ადმინის `balancePublicationTarget.ts`) */
  private resolvedPublicationId(): string {
    return this.env('BALANCE_PUBLICATION_ID') || DEFAULT_BALANCE_PUBLICATION_ID;
  }

  /** `BALANCE_LOG_EXCHANGE_CLIENTS=0` — გამორთავს გამომავალი/შემომავალი JSON-ის ლოგს */
  private shouldLogClientsExchange(): boolean {
    return (
      this.config.get<string>('BALANCE_LOG_EXCHANGE_CLIENTS')?.trim() !== '0'
    );
  }

  /**
   * მობილური რეგისტრაცია: ჯერ Balance Clients, მერე Mongo — სინქი სავალდებულოა.
   * `BALANCE_REGISTER_SYNC` აღარ გამოიყენება ამ ნაკადისთვის.
   */
  requireBalanceConfiguredForMobileRegister(): void {
    if (!this.hasCredentials()) {
      throw new BadRequestException(
        'რეგისტრაცია შეუძლებელია: Balance ავთენტიკაცია (ნაგულისხმევებიც კი ვერ იტვირთა). შეამოწმეთ `src/lib/balance-default-auth.ts` ან env: BALANCE_USER_NAME + BALANCE_USER_PASSWORD / BALANCE_AUTHORIZATION.',
      );
    }
  }

  private clientsPostUrl(): string {
    const full = this.env('BALANCE_CLIENTS_POST_URL');
    if (full) return full;
    const pub = this.resolvedPublicationId();
    const resource =
      this.config.get<string>('BALANCE_EXCHANGE_CLIENTS_RESOURCE')?.trim() ||
      'Clients';
    const mode =
      this.config.get<string>('BALANCE_EXCHANGE_MODE')?.trim() === 'o'
        ? 'o'
        : 'a';
    return `https://cloud.balance.ge/sm/${mode}/Balance/${pub}/hs/Exchange/${resource}`;
  }

  private authorizationHeader(): string {
    const full = this.env('BALANCE_AUTHORIZATION');
    if (full) return full;
    const u = this.balanceBasicUser();
    const p = this.balanceBasicPassword();
    if (!u || !p) {
      throw new BadRequestException(
        'Balance API ავთენტიფიკაცია არ არის კონფიგურირებული',
      );
    }
    return 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');
  }

  private legalFormFor(accountType: 'individual' | 'legal'): string {
    if (accountType === 'individual') {
      return (
        this.config.get<string>('BALANCE_LEGAL_FORM_INDIVIDUAL')?.trim() ||
        'ფიზიკური პირი'
      );
    }
    return (
      this.config.get<string>('BALANCE_LEGAL_FORM_LEGAL')?.trim() ||
      'შეზღუდული პასუხისმგებლობის საზოგადოება'
    );
  }

  private resolvedLegalAddress(params: CreateBalanceBuyerParams): string {
    const fromReg = params.legalAddress?.trim();
    if (fromReg) return clip(fromReg, 400);
    const def =
      this.config
        .get<string>('BALANCE_DEFAULT_LEGAL_ADDRESS_FALLBACK')
        ?.trim() || '—';
    return clip(def, 400);
  }

  private resolvedCountry(params: CreateBalanceBuyerParams): string {
    if (params.country?.trim()) {
      return clip(params.country.trim(), 100);
    }
    return clip(
      this.config.get<string>('BALANCE_CLIENT_COUNTRY')?.trim() || 'საქართველო',
      100,
    );
  }

  /**
   * POST — JSON **მასივი** `[ { ... } ]`; აბრუნებს შექმნილი ჩანაწერის `uid`.
   */
  async createBuyer(params: CreateBalanceBuyerParams): Promise<string> {
    const url = this.clientsPostUrl();
    const groupUid =
      this.config.get<string>('BALANCE_CLIENT_GROUP_UID')?.trim() || '';
    const currency =
      this.config.get<string>('BALANCE_CLIENT_CURRENCY')?.trim() || '';
    const vatType =
      this.config.get<string>('BALANCE_CLIENT_VAT_TYPE')?.trim() || '';
    const sendClientUidRaw = this.config
      .get<string>('BALANCE_CLIENT_SEND_UID')
      ?.trim()
      .toLowerCase();
    const sendClientUid =
      sendClientUidRaw === '1' ||
      sendClientUidRaw === 'true' ||
      sendClientUidRaw === 'yes' ||
      sendClientUidRaw === 'on';

    const legalAddress = this.resolvedLegalAddress(params);
    const physicalAddress = clip(
      params.legalAddress?.trim() || legalAddress,
      400,
    );

    const row = buildClientExchangeRow(params, {
      legalForm: this.legalFormFor(params.accountType),
      legalAddress,
      physicalAddress,
      country: this.resolvedCountry(params),
      groupUid,
      currency,
      vatType,
      sendClientUid,
    });

    const payload = [row];

    if (this.shouldLogClientsExchange()) {
      this.logger.log(
        `[Balance Clients] → POST ${url}\n(Authorization ჰედერი არ ლოგდება)\nგამომავალი სხეული:\n${JSON.stringify(payload, null, 2)}`,
      );
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 45_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: this.authorizationHeader(),
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Balance POST Clients: ქსელი/აბორტი — ${msg}`);
      throw new BadRequestException(
        `Balance-თან დაკავშირება ვერ მოხერხდა: ${msg}`,
      );
    } finally {
      clearTimeout(t);
    }

    const text = await res.text();
    const maxBodyLog = 8000;
    const bodyPreview =
      text.length > maxBodyLog
        ? `${text.slice(0, maxBodyLog)}\n… [truncated, სულ ${text.length} სიმბოლო]`
        : text;

    if (this.shouldLogClientsExchange()) {
      const loc = res.headers.get('location');
      this.logger.log(
        `[Balance Clients] ← HTTP ${res.status} ${res.statusText}` +
          (loc ? `\nLocation: ${loc}` : '') +
          `\nპასუხის სხეული (ნედლი ტექსტი):\n${bodyPreview || '(ცარიელი)'}`,
      );
    }
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      parsed = { raw: text };
    }

    if (!res.ok) {
      const hint =
        typeof parsed === 'object' &&
        parsed &&
        'message' in parsed &&
        typeof (parsed as { message: unknown }).message === 'string'
          ? (parsed as { message: string }).message
          : text.slice(0, 400);
      this.logger.warn(
        `[Balance Clients] შეცდომა HTTP ${res.status}: ${hint}\nპასუხის ნაწილი: ${text.slice(0, 1200)}`,
      );
      throw new BadRequestException(
        `Balance-ში მყიდველის შექმნა ვერ მოხერხდა (HTTP ${res.status}). ${hint}`,
      );
    }

    const fromJson = extractUidFromJson(parsed);
    if (fromJson) {
      if (this.shouldLogClientsExchange()) {
        this.logger.log(
          `[Balance Clients] წარმატება — Balance uid: ${fromJson}`,
        );
      }
      return fromJson;
    }

    const locHeader = res.headers.get('location');
    const fromLoc = locHeader?.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    if (fromLoc) {
      if (this.shouldLogClientsExchange()) {
        this.logger.log(
          `[Balance Clients] წარმატება — uid Location-იდან: ${fromLoc[1]}`,
        );
      }
      return fromLoc[1];
    }

    this.logger.warn(
      `[Balance Clients] HTTP OK მაგრამ uid ვერ მოიძებნა. პასუხი: ${text.slice(0, 500)}`,
    );
    throw new BadRequestException(
      'Balance-მა მყიდველი შექმნა, მაგრამ uid ვერ წავიკითხეთ — შეამოწმეთ API პასუხის ფორმატი.',
    );
  }

  private salePutUrl(): string {
    const full = balanceSalePutUrlInline() || this.env('BALANCE_SALE_PUT_URL');
    if (full) return full;
    const pub = this.resolvedPublicationId();
    const resource =
      this.config.get<string>('BALANCE_EXCHANGE_SALE_RESOURCE')?.trim() ||
      'Sale';
    const mode =
      this.config.get<string>('BALANCE_EXCHANGE_MODE')?.trim() === 'o'
        ? 'o'
        : 'a';
    return `https://cloud.balance.ge/sm/${mode}/Balance/${pub}/hs/Exchange/${resource}`;
  }

  private itemsCatalogUrl(): string {
    const full =
      this.env('BALANCE_ITEMS_CATALOG_URL') || this.env('BALANCE_ITEMS_URL');
    if (full) return full;
    const pub = this.resolvedPublicationId();
    const resource =
      this.config.get<string>('BALANCE_EXCHANGE_ITEMS_RESOURCE')?.trim() ||
      'Items';
    const mode =
      this.config.get<string>('BALANCE_EXCHANGE_MODE')?.trim() === 'o'
        ? 'o'
        : 'a';
    return `https://cloud.balance.ge/sm/${mode}/Balance/${pub}/hs/Exchange/${resource}`;
  }

  /**
   * Balance `Exchange/Items` — ნომენკლატურის სრული სია (იგივე რასაც admin „განახლება ბაზა“).
   * საჭიროა auto-heal-ისთვის: sale-ის აწყობამდე Product-ში ცარიელი `balanceNomenclatureItemUid`
   * და ანგარიშები Balance-იდან ხელახლა ავსდება.
   *
   * აბრუნებს ნედლ ცხრილს; parsing Next `balanceSync.ts`-ის მსგავსად.
   */
  async fetchItemsCatalog(): Promise<Record<string, unknown>[]> {
    if (!this.hasCredentials()) {
      this.logger.warn(
        '[Balance Items] ავთენტიკაცია არ არის — catalog სინქი გამოტოვებული',
      );
      return [];
    }
    const url = this.itemsCatalogUrl();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.authorizationHeader(),
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[Balance Items] ქსელი/აბორტი — ${msg}`);
      return [];
    } finally {
      clearTimeout(t);
    }

    if (!res.ok) {
      this.logger.warn(
        `[Balance Items] HTTP ${res.status} ${res.statusText} — catalog ვერ იქნა მიღებული`,
      );
      return [];
    }

    const text = await res.text();
    if (!text) return [];
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      this.logger.warn('[Balance Items] JSON parse ვერ მოხერხდა');
      return [];
    }

    if (Array.isArray(json)) return json as Record<string, unknown>[];
    if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>;
      for (const key of ['Items', 'items', 'value', 'Value', 'data', 'Data']) {
        const v = obj[key];
        if (Array.isArray(v)) return v as Record<string, unknown>[];
      }
    }
    return [];
  }

  /**
   * PUT — JSON **მასივი** `[ { ... } ]` (Exchange Sale).
   * არ აგდებს `BadRequestException`-ს — callback-მა უნდა დააბრუნოს 200 BOG-ს მაინც.
   */
  async putSaleDocument(
    rows: Record<string, unknown>[],
  ): Promise<{ ok: boolean; status: number; raw: string }> {
    const url = this.salePutUrl();
    if (!this.hasCredentials()) {
      this.logger.warn('[Balance Sale] ავთენტიკაცია არ არის — გამოტოვება');
      return { ok: false, status: 0, raw: 'no_balance_auth' };
    }
    if (balanceSaleShouldLogRequestBody()) {
      try {
        const serialized = JSON.stringify(rows, null, 2);
        const max = balanceSaleRequestBodyLogMaxChars();
        const block =
          serialized.length > max
            ? `${serialized.slice(0, max)}\n… [truncated, სულ ${serialized.length} სიმბოლო]`
            : serialized;
        this.logger.log(
          `[Balance Sale] → გამოსავალი PUT სხეული (${serialized.length} სიმბოლო)\nURL: ${url}\n${block}`,
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(`[Balance Sale] JSON stringify ვერ მოხერხდა: ${msg}`);
      }
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 60_000);
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: this.authorizationHeader(),
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rows),
        signal: controller.signal,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[Balance Sale] ქსელი/აბორტი — ${msg}`);
      return { ok: false, status: 0, raw: msg };
    } finally {
      clearTimeout(t);
    }
    const text = await res.text();
    const ok = res.ok;
    const logBodyDisabled =
      this.config.get<string>('BALANCE_LOG_EXCHANGE_SALE')?.trim() === '0';
    const loc = res.headers.get('location');
    const maxBody = 24_000;
    const bodyBlock = logBodyDisabled
      ? '(სხეულის დალოგვა გამორთულია — BALANCE_LOG_EXCHANGE_SALE=0)'
      : text.length > maxBody
        ? `${text.slice(0, maxBody)}\n… [truncated, სულ ${text.length} სიმბოლო]`
        : text || '(ცარიელი)';
    this.logger.log(
      `[Balance Sale] PUT ${url}` +
        (loc ? `\nLocation: ${loc}` : '') +
        `\n← HTTP ${res.status} ${res.statusText}` +
        `\nBalance პასუხის სხეული:\n${bodyBlock}`,
    );
    return { ok, status: res.status, raw: text };
  }

  private discountsGetUrl(): string {
    const full = this.env('BALANCE_DISCOUNTS_URL');
    if (full) return full;
    const mode =
      this.config.get<string>('BALANCE_EXCHANGE_MODE')?.trim() === 'o'
        ? 'o'
        : 'a';
    const pub = this.resolvedPublicationId();
    return `https://cloud.balance.ge/sm/${mode}/Balance/${pub}/hs/Exchange/Discounts`;
  }

  /**
   * GET Exchange/Discounts — პროდუქტების სიაში ცოცხალი ფასდაკლების ველების შესავსებად (არ აგდებს Exception-ს).
   */
  async tryFetchExchangeDiscounts(): Promise<unknown | null> {
    if (!this.hasCredentials()) {
      return null;
    }
    const url = this.discountsGetUrl();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.authorizationHeader(),
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(
          `[Balance Discounts] HTTP ${res.status} — ${text.slice(0, 240)}`,
        );
        return null;
      }
      if (!text?.trim()) return null;
      try {
        return JSON.parse(text) as unknown;
      } catch {
        this.logger.warn('[Balance Discounts] პასუხი არაა სწორი JSON');
        return null;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`[Balance Discounts] ${msg}`);
      return null;
    } finally {
      clearTimeout(t);
    }
  }
}
