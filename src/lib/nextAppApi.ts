/**
 * Next.js იმავე აპის Route Handlers (`/api/balance/...` და სხვა).
 * არა Nest API (`getApiBaseUrl` → :3001 / Railway) — იმისთვის `api.get` / `apiRequest` გამოიყენე.
 *
 * **ბრაუზერი:** `window.location.origin`
 * **სერვერი (RSC / route):** `NEXT_PUBLIC_APP_ORIGIN`, ან `VERCEL_URL`, ან `http://127.0.0.1:${PORT|3000}`
 */
export function getNextAppOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  const explicit = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim();
  if (explicit) {
    return (explicit.startsWith('http') ? explicit : `https://${explicit}`).replace(
      /\/$/,
      ''
    );
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return (vercel.startsWith('http') ? vercel : `https://${vercel}`).replace(/\/$/, '');
  }
  const port = process.env.PORT?.trim() || '3000';
  return `http://127.0.0.1:${port}`;
}

export function nextAppApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getNextAppOrigin()}${p}`;
}

/** იგივე რაც `fetch(fullUrl)`, მაგრამ path ყოველთვის ამ Next აპზე მიბმულია */
export async function nextAppFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(nextAppApiUrl(path), {
    cache: 'no-store',
    ...init,
  });
}

export async function nextAppJson<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await nextAppFetch(path, init);
  const text = await res.text();
  let data: unknown;
  if (!text) {
    data = {};
  } else {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { raw: text };
    }
  }
  if (!res.ok) {
    const msg =
      data &&
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error?: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data as T;
}
