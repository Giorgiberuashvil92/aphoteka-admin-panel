/**
 * Nest API ბაზის URL (ბოლოში `/api` არ უნდა იყოს დუბლირებული endpoint-ში).
 *
 * **Vercel + ბრაუზერი:** პირდაპირ Railway → CORS. ამიტომ ნაგულისხმევად
 * `https://<შენი-ვერსელი>/api/nest` — `next.config.ts` rewrite-ით პროქსირდება Railway-ზე.
 *
 * **სერვერი** (Next Route Handlers, sync): `NEST_API_DIRECT_URL` ან Railway პირდაპირ.
 *
 * `NEXT_PUBLIC_API_URL` — თუ დაყენებულია, ბრაუზერიც იქ მიდის (გინდა პირდაპირ Nest დომენზე).
 */
export const LOCAL_NEST_API_DEFAULT = 'http://localhost:3001/api';
export const RAILWAY_NEST_API_DEFAULT =
  'https://aphoteka-admin-panel-production.up.railway.app/api';

/** სერვერული მოთხოვნებისთვის (Vercel functions → Nest პირდაპირ, ციკლის გარეშე) */
export function getServerNestApiBaseUrl(): string {
  const direct =
    process.env.NEST_API_DIRECT_URL?.trim() ||
    process.env.RAILWAY_NEST_API_URL?.trim() ||
    RAILWAY_NEST_API_DEFAULT;
  return direct.replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_NEST_API_DEFAULT;
    }
    if (fromPublic) {
      return fromPublic.replace(/\/$/, '');
    }
    return `${window.location.origin}/api/nest`.replace(/\/$/, '');
  }

  if (fromPublic) {
    return fromPublic.replace(/\/$/, '');
  }

  if (process.env.VERCEL) {
    return getServerNestApiBaseUrl();
  }

  return LOCAL_NEST_API_DEFAULT;
}
