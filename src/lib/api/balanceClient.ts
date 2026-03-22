import axios, { type AxiosInstance } from 'axios';
import https from 'node:https';

const BALANCE_USER_NAME = process.env.BALANCE_USER_NAME ?? 'Ntsulik@gmail.com';
const BALANCE_USER_PASSWORD = process.env.BALANCE_USER_PASSWORD ?? '1985+Mai';

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
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Warehouses';

async function balanceGetJson(url: string): Promise<unknown> {
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

export async function fetchBalanceWarehouses(): Promise<unknown> {
  return balanceGetJson(BALANCE_WAREHOUSES_URL);
}

export const BALANCE_STOCKS_URL =
  process.env.BALANCE_STOCKS_URL ??
  'https://cloud.balance.ge/sm/o/Balance/7596/hs/Exchange/Items';

export async function fetchBalanceStocks(): Promise<unknown> {
  return balanceGetJson(BALANCE_STOCKS_URL);
}

/** Balance Exchange – ფასები (Items-ის UUID-ით უკავშირდება) */
export const BALANCE_PRICES_URL =
  process.env.BALANCE_PRICES_URL ??
  'https://cloud.balance.ge/sm/a/Balance/7596/hs/Exchange/Prices';

export async function fetchBalancePrices(): Promise<unknown> {
  return balanceGetJson(BALANCE_PRICES_URL);
}
