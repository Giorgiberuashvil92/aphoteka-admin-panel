import axios, { type AxiosInstance, isAxiosError } from 'axios';
import https from 'node:https';
import { BALANCE_PUBLICATION_TARGET } from '@/lib/balancePublicationTarget';
import { getBalanceItems } from '@/lib/api/balanceSync';

const BALANCE_USER_NAME = process.env.BALANCE_USER_NAME ?? 'Ntsulik@gmail.com';
const BALANCE_USER_PASSWORD = process.env.BALANCE_USER_PASSWORD ?? '1985+Mai';

/**
 * Cloud: `.../sm/{a|o}/Balance/{ApplicationID}/hs/Exchange/...`
 * ნაგულისხმევი ApplicationID — `BALANCE_PUBLICATION_TARGET` (`balancePublicationTarget.ts`).
 * დოკუმენტაციაში სხვა რიცხვი (მაგ. 1649) ზოგადი მაგალითია.
 * სხვა გარემოსთვის: `.env.local` → `BALANCE_PUBLICATION_ID=...`
 */
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

function getEncodedToken(): string {
  const token = `${BALANCE_USER_NAME}:${BALANCE_USER_PASSWORD}`;
  return Buffer.from(token).toString('base64');
}

export function getBalanceTokenInstance(): AxiosInstance {
  const encodedToken = getEncodedToken();
  return axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
    headers: {
      Authorization: 'Basic ' + encodedToken,
      'Content-Type': 'application/x-www-form-urlencoded',
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
  const { data } = await client.get<string | unknown>(url, {
    headers: { 'Content-Type': 'application/json' },
    transformResponse: [
      (raw) => {
        if (typeof raw !== 'string') return raw;
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      },
    ],
  });
  return data;
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
      headers: { 'Content-Type': 'application/json' },
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
    u.searchParams.set('uid', q.uid ?? '');
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

/** სრული ბაზის URL (მაგ. `…/Exchange/ItemsSeries` ბოლომდე). ცარიელი env → sm/o შემდეგ sm/a (404-ზე ფოლბექი) */
function balanceItemsSeriesPublicationBases(): string[] {
  const env = process.env.BALANCE_ITEMS_SERIES_URL?.trim();
  if (env) return [env];
  /** doc ხშირად sm/a; sm/o ფოლბექი */
  return [
    balanceExchangeUrl('a', 'ItemsSeries'),
    balanceExchangeUrl('o', 'ItemsSeries'),
  ];
}

/** პირველი ბაზა (ლოგის/დოკისთვის) */
export const BALANCE_ITEMS_SERIES_URL = balanceItemsSeriesPublicationBases()[0];

export function buildBalanceItemsSeriesUrlForBase(
  base: string,
  itemUid: string,
  opts?: { startingPeriod?: string; endingPeriod?: string }
): string {
  const u = new URL(base);
  u.searchParams.set('uid', itemUid.trim());
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

/** დებაგი: რა URL-ებს ვცდით (sm/o → sm/a ან მხოლოდ env) */
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
  /** რომელი URL-ის body დავაბრუნეთ (sm/a თუ sm/o ფოლბექი) */
  resolvedUrl: string;
};

/**
 * ItemsSeries: ჯერ sm/a, შემდეგ sm/o (ან env ერთი ბაზა).
 * ცარიელ პასუხს (0 ხაზი `getBalanceItems`-ით) ვცდით შემდეგ ბაზაზე — ზოგჯერ ერთი მოდე აბრუნებს `[]`, მეორე — მონაცემს.
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
