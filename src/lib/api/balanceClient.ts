import axios, { type AxiosInstance, isAxiosError } from 'axios';
import https from 'node:https';
import {
  BALANCE_DEV_DEFAULT_USER_NAME,
  BALANCE_DEV_DEFAULT_USER_PASSWORD,
} from '@/lib/balance-default-auth';
import { BALANCE_PUBLICATION_TARGET } from '@/lib/balancePublicationTarget';
import { getBalanceItems } from '@/lib/api/balanceSync';

const BALANCE_USER_NAME =
  process.env.BALANCE_USER_NAME?.trim() || BALANCE_DEV_DEFAULT_USER_NAME;
const BALANCE_USER_PASSWORD =
  process.env.BALANCE_USER_PASSWORD?.trim() || BALANCE_DEV_DEFAULT_USER_PASSWORD;

/**
 * ცარიელი → `Authorization: Basic …` (user/password ზემოთ).
 * სრული ჰედერი env-დან: `BALANCE_AUTHORIZATION` (მაგ. `Bearer …` — Postman-ის მიხედვით).
 */
const BALANCE_AUTHORIZATION = process.env.BALANCE_AUTHORIZATION?.trim() || '';

export const BALANCE_PUBLICATION_ID =
  process.env.BALANCE_PUBLICATION_ID?.trim() || BALANCE_PUBLICATION_TARGET;

export { BALANCE_PUBLICATION_TARGET };

export function balanceExchangeUrl(
  mode: 'a' | 'o',
  resource: string,
  publicationId: string = BALANCE_PUBLICATION_ID
): string {
  return `https://cloud.balance.ge/sm/${mode}/Balance/${publicationId}/hs/Exchange/${resource}`;
}

/**
 * ItemsSeries — იგივე ბაზა რაც Balance/Postman: `sm/a/Balance/{id}/hs/Exchange/ItemsSeries`
 * (არა `sm/o/balance/...` — იქ 403 იყო).
 * `Item` / პერიოდის query — `buildBalanceItemsSeriesUrlForBase`.
 */
export function balanceItemsSeriesCloudBaseUrl(
  publicationId: string = BALANCE_PUBLICATION_ID
): string {
  return balanceExchangeUrl('a', 'ItemsSeries', publicationId);
}

function getEncodedToken(): string {
  const token = `${BALANCE_USER_NAME}:${BALANCE_USER_PASSWORD}`;
  return Buffer.from(token).toString('base64');
}

/** პარალელური GET-ებისას ერთი აგენტი — keepAlive ნაკლებ connection reset-ს იძლევა */
const balanceHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 64,
});

/**
 * Balance cloud ხშირად უჭერს/აგდებს დროებით — რეტრაი + ტაიმაუტი.
 * env: `BALANCE_HTTP_TIMEOUT_MS` (ნაგულისხმევი 120000), `BALANCE_HTTP_RETRIES` (ნაგულისხმევი 3)
 */
const BALANCE_HTTP_TIMEOUT_MS = (() => {
  const n = Number(process.env.BALANCE_HTTP_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 5_000 ? n : 120_000;
})();

const BALANCE_HTTP_RETRIES = (() => {
  const n = Number(process.env.BALANCE_HTTP_RETRIES);
  return Number.isFinite(n) && n >= 1 ? Math.min(8, Math.floor(n)) : 3;
})();

function balanceRetryDelayMs(attemptIndex: number): number {
  const base = 350 * (attemptIndex + 1);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

function isTransientBalanceFailure(e: unknown): boolean {
  if (isAxiosError(e)) {
    const s = e.response?.status;
    if (s === 429 || s === 502 || s === 503 || s === 504) return true;
    const code = e.code;
    if (code) {
      const transient = new Set([
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNABORTED',
        'ENOTFOUND',
        'EAI_AGAIN',
        'ECONNREFUSED',
      ]);
      if (transient.has(String(code))) return true;
    }
    if (!e.response && e.message) {
      const m = e.message.toLowerCase();
      if (m.includes('socket hang up')) return true;
      if (m.includes('timeout')) return true;
      if (m.includes('network')) return true;
    }
    return false;
  }
  if (e instanceof Error) {
    const m = e.message.toLowerCase();
    if (m.includes('timeout')) return true;
    if (m.includes('socket')) return true;
    if (m.includes('econnreset')) return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function getBalanceTokenInstance(): AxiosInstance {
  const authorization = BALANCE_AUTHORIZATION.trim()
    ? BALANCE_AUTHORIZATION.trim()
    : 'Basic ' + getEncodedToken();
  return axios.create({
    httpsAgent: balanceHttpsAgent,
    timeout: BALANCE_HTTP_TIMEOUT_MS,
    headers: {
      Authorization: authorization,
    },
  });
}

export { getEncodedToken };

/** Balance Exchange – საწყობების სია */
export const BALANCE_WAREHOUSES_URL =
  process.env.BALANCE_WAREHOUSES_URL?.trim() ||
  balanceExchangeUrl('a', 'Warehouses');

export async function balanceGetJson(url: string): Promise<unknown> {
  const client = getBalanceTokenInstance();
  const getOpts = {
    /** GET-ზე `Content-Type: application/json` ზოგიერთ სერვერზე/WAF-ზე უცნაურია და 403-ს იძლევა */
    headers: { Accept: 'application/json' },
    timeout: BALANCE_HTTP_TIMEOUT_MS,
    transformResponse: [
      (raw: string | unknown) => {
        if (typeof raw !== 'string') return raw;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      },
    ],
  };

  let lastErr: unknown;
  for (let attempt = 0; attempt < BALANCE_HTTP_RETRIES; attempt++) {
    try {
      const { data } = await client.get<string | unknown>(url, getOpts);
      return data;
    } catch (e) {
      lastErr = e;
      const retry = attempt < BALANCE_HTTP_RETRIES - 1 && isTransientBalanceFailure(e);
      if (retry) {
        if (process.env.BALANCE_HTTP_DEBUG === '1') {
          const msg = isAxiosError(e)
            ? `${e.code ?? ''} ${e.response?.status ?? ''} ${e.message}`
            : e instanceof Error
              ? e.message
              : String(e);
          console.warn(
            `[Balance] GET retry ${attempt + 1}/${BALANCE_HTTP_RETRIES} ${url.slice(0, 80)}… — ${msg}`
          );
        }
        await sleep(balanceRetryDelayMs(attempt));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

/** დებაგი: ნედლი HTTP პასუხი (4xx აღარ „აგდებს“ — ყველაფერი ჩანს bodyText-ში) */
export type BalanceProbeResult = {
  url: string;
  httpStatus: number;
  httpStatusText: string;
  bodyText: string;
  contentType?: string;
  usedBasicAuth: boolean;
  axiosError?: string;
};

export async function balanceProbeGet(
  url: string,
  opts?: { skipAuth?: boolean }
): Promise<BalanceProbeResult> {
  const usedBasicAuth = !opts?.skipAuth;
  const client = opts?.skipAuth
    ? axios.create({
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 60_000,
      })
    : getBalanceTokenInstance();

  try {
    const res = await client.get<string>(url, {
      timeout: opts?.skipAuth ? 60_000 : BALANCE_HTTP_TIMEOUT_MS,
      headers: { Accept: 'application/json' },
      validateStatus: () => true,
      responseType: 'text',
      transformResponse: [(d) => d],
    });
    const bodyText =
      typeof res.data === 'string' ? res.data : String(res.data ?? '');
    const ct = res.headers['content-type'];
    const ctStr = Array.isArray(ct) ? ct[0] : ct;
    return {
      url,
      httpStatus: res.status,
      httpStatusText: res.statusText || '',
      bodyText:
        bodyText.length > 200_000
          ? `${bodyText.slice(0, 200_000)}… [truncated ${bodyText.length} chars]`
          : bodyText,
      contentType: ctStr,
      usedBasicAuth,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isAxiosError(e) && e.response) {
      const data = e.response.data;
      const bodyText =
        typeof data === 'string' ? data : JSON.stringify(data ?? {});
      const ct = e.response.headers['content-type'];
      const ctStr = Array.isArray(ct) ? ct[0] : ct;
      return {
        url,
        httpStatus: e.response.status,
        httpStatusText: e.response.statusText || '',
        bodyText,
        contentType: ctStr,
        usedBasicAuth,
        axiosError: msg,
      };
    }
    return {
      url,
      httpStatus: 0,
      httpStatusText: 'Client Error',
      bodyText: '',
      usedBasicAuth,
      axiosError: msg,
    };
  }
}

export async function fetchBalanceWarehouses(): Promise<unknown> {
  return balanceGetJson(BALANCE_WAREHOUSES_URL);
}

export const BALANCE_STOCKS_URL =
  process.env.BALANCE_STOCKS_URL ?? balanceExchangeUrl('o', 'Items');

export async function fetchBalanceStocks(): Promise<unknown> {
  return balanceGetJson(BALANCE_STOCKS_URL);
}

/** სატესტო: `sm/a/.../Exchange/Items` — `uid` ოფციონალური (არა `sm/o`) */
const BALANCE_ITEMS_TEST_PATH = balanceExchangeUrl('a', 'Items');

export function buildBalanceItemsTestUrl(uid?: string | null): string {
  const u = new URL(BALANCE_ITEMS_TEST_PATH);
  const t = uid?.trim();
  if (t) u.searchParams.set('uid', t);
  return u.toString();
}

export async function fetchBalanceItemsTest(uid?: string | null): Promise<unknown> {
  return balanceGetJson(buildBalanceItemsTestUrl(uid));
}

export const BALANCE_PRICES_URL =
  process.env.BALANCE_PRICES_URL ?? balanceExchangeUrl('a', 'Prices');

/** Balance Exchange ფასდაკლებები — `sm/a/Balance/{id}/hs/Exchange/Discounts` */
export const BALANCE_DISCOUNTS_URL =
  process.env.BALANCE_DISCOUNTS_URL?.trim() ||
  balanceExchangeUrl('a', 'Discounts');

export async function fetchBalanceDiscounts(): Promise<unknown> {
  return balanceGetJson(BALANCE_DISCOUNTS_URL);
}

/** Exchange საერთო `uid` — Prices / Stocks / სხვა */
const BALANCE_EXCHANGE_UID = 'b067980d-7eb5-11ec-80d2-000c29409daa';

function pricesUrlWithQuery(extra?: Record<string, string>): string {
  const u = new URL(BALANCE_PRICES_URL);
  u.searchParams.set('uid', BALANCE_EXCHANGE_UID);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== '') u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

export async function fetchBalancePrices(): Promise<unknown> {
  return balanceGetJson(pricesUrlWithQuery());
}

/** Prices — query `Source` = ნომენკლატურის `uid` (Items ფიდიდან) */
export async function fetchBalancePricesByUuid(uuid: string): Promise<unknown> {
  return balanceGetJson(pricesUrlWithQuery({ Source: uuid }));
}

/** ნაშთები/რაოდენობები — `sm/a/.../Exchange/Stocks` (არა Items) */
export const BALANCE_EXCHANGE_STOCKS_URL =
  process.env.BALANCE_EXCHANGE_STOCKS_URL?.trim() ||
  balanceExchangeUrl('a', 'Stocks');

export type BalanceExchangeStocksQuery = {
  uid?: string;
  StartingPeriod?: string;
  EndingPeriod?: string;
  Source?: string;
  /** დოკუმენტაცია: Total (boolean), მაგ. `false` დეტალური ხაზებისთვის */
  Total?: boolean;
  /**
   * `true` → დოკუმენტაციის URL:
   * `/Stocks?uid=&StartingPeriod=&EndingPeriod=&Source=&Total=false`
   * (ცარიელი სტრიქონები, თუ ველი არ გადაეცა)
   */
  docTemplate?: boolean;
};

export function buildBalanceExchangeStocksUrl(
  query?: BalanceExchangeStocksQuery
): string {
  const u = new URL(BALANCE_EXCHANGE_STOCKS_URL);
  const q = query ?? {};

  if (q.docTemplate) {
    /** ცარიელი uid ზოგიერ პუბლიკაციაზე Balance-ს 502/შეცდომა — იგივე სტანდარტული Exchange uid, რაც `Total=false`-ზე */
    const uidForDoc = (q.uid?.trim() ? q.uid : BALANCE_EXCHANGE_UID).trim();
    u.searchParams.set('uid', uidForDoc);
    u.searchParams.set('StartingPeriod', q.StartingPeriod ?? '');
    u.searchParams.set('EndingPeriod', q.EndingPeriod ?? '');
    u.searchParams.set('Source', q.Source ?? '');
    u.searchParams.set(
      'Total',
      q.Total === undefined ? 'false' : q.Total ? 'true' : 'false'
    );
    return u.toString();
  }

  u.searchParams.set('uid', (q.uid ?? BALANCE_EXCHANGE_UID).trim());
  if (q.StartingPeriod) u.searchParams.set('StartingPeriod', q.StartingPeriod);
  if (q.EndingPeriod) u.searchParams.set('EndingPeriod', q.EndingPeriod);
  if (q.Source) u.searchParams.set('Source', q.Source);
  u.searchParams.set(
    'Total',
    q.Total === undefined ? 'false' : q.Total ? 'true' : 'false'
  );
  return u.toString();
}

export async function fetchBalanceExchangeStocks(
  query?: BalanceExchangeStocksQuery
): Promise<unknown> {
  return balanceGetJson(buildBalanceExchangeStocksUrl(query));
}

/**
 * ItemsSeries სრული სია — GET იმავე ბაზაზე `Item` query-ის გარეშე
 * (`sm/a/Balance/.../ItemsSeries`), როგორც Postman-ში.
 */
export async function fetchBalanceItemsSeriesFullList(): Promise<unknown> {
  return balanceGetJson(balanceItemsSeriesCloudBaseUrl());
}

/** ItemsSeries: ერთი ბაზა (`balanceItemsSeriesCloudBaseUrl`), ან სრული override `BALANCE_ITEMS_SERIES_URL`. */
function balanceItemsSeriesPublicationBases(): string[] {
  const env = process.env.BALANCE_ITEMS_SERIES_URL?.trim();
  if (env) return [env];
  return [balanceItemsSeriesCloudBaseUrl()];
}

/** პირველი ბაზა (ლოგის/დოკისთვის) */
export const BALANCE_ITEMS_SERIES_URL = balanceItemsSeriesPublicationBases()[0];

/** Balance cloud ItemsSeries GET — query პარამეტრის სახელი (Theneo / პუბლიკაცია: `Item`, არა `item`). */
export const BALANCE_ITEMS_SERIES_ITEM_QUERY_PARAM = 'Item';

export function buildBalanceItemsSeriesUrlForBase(
  base: string,
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string {
  const u = new URL(base);
  u.searchParams.set(BALANCE_ITEMS_SERIES_ITEM_QUERY_PARAM, itemUid.trim());
  /** ცარიელი StartingPeriod/EndingPeriod ზოგიერთ პუბლიკაციაზე → 404 „Unknown parameter“ */
  const s = opts?.startingPeriod?.trim();
  const e = opts?.endingPeriod?.trim();
  if (s) u.searchParams.set('StartingPeriod', s);
  if (e) u.searchParams.set('EndingPeriod', e);
  return u.toString();
}

export function buildBalanceItemsSeriesUrl(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string {
  return buildBalanceItemsSeriesUrlForBase(
    balanceItemsSeriesPublicationBases()[0],
    itemUid,
    opts
  );
}

/** დებაგი: რა URL-ებს ვცდით (პარამეტრი `Item` + ერთი ბაზა, ან env) */
export function getBalanceItemsSeriesCandidateUrls(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string[] {
  return balanceItemsSeriesPublicationBases().map((base) =>
    buildBalanceItemsSeriesUrlForBase(base, itemUid, opts)
  );
}

export type FetchBalanceItemsSeriesResult = {
  data: unknown;
  /** რომელი სრული GET URL-ის body დავაბრუნეთ */
  resolvedUrl: string;
};

/**
 * ItemsSeries: ერთი ბაზის URL (`sm/a/Balance/.../ItemsSeries`) + query `Item` (ნომენკლატურის ref).
 */
export async function fetchBalanceItemsSeriesForItemDetailed(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): Promise<FetchBalanceItemsSeriesResult> {
  const bases = balanceItemsSeriesPublicationBases();
  let lastErr: unknown;
  let lastOkEmpty: { data: unknown; url: string } | undefined;

  for (let i = 0; i < bases.length; i++) {
    const url = buildBalanceItemsSeriesUrlForBase(bases[i], itemUid, opts);
    try {
      const data = await balanceGetJson(url);
      if (getBalanceItems(data).length > 0) {
        return { data, resolvedUrl: url };
      }
      lastOkEmpty = { data, url };
      if (i < bases.length - 1) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[Balance ItemsSeries] ცარიელი პასუხი, ვცდით შემდეგ ბაზას',
            url
          );
        }
        continue;
      }
      return { data, resolvedUrl: url };
    } catch (e) {
      lastErr = e;
      const is404 = isAxiosError(e) && e.response?.status === 404;
      if (is404 && i < bases.length - 1) continue;
      if (lastOkEmpty !== undefined) {
        return { data: lastOkEmpty.data, resolvedUrl: lastOkEmpty.url };
      }
      throw e;
    }
  }
  throw lastErr;
}

export async function fetchBalanceItemsSeriesForItem(
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): Promise<unknown> {
  const { data } = await fetchBalanceItemsSeriesForItemDetailed(itemUid, opts);
  return data;
}
