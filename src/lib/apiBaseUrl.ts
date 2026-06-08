/**
 * Nest API ბაზის URL (endpoint-ში `/api` არ დაიმატო ორჯერ).
 *
 * **ბრაუზერი (localhost):** `origin/api/nest` — Next rewrite → Nest (პორტის კონფლიქტი არაა).
 * **ბრაუზერი (Vercel):** იგივე `/api/nest` ან `NEXT_PUBLIC_API_URL`.
 * **სერვერი:** `NEST_API_DIRECT_URL` → ლოკალურად ნაგულ. `127.0.0.1:3000/api`.
 */
/** Nest `PORT` ლოკალურად 3000 (Next dev → :3001) — `.env.local` → `NEST_API_DIRECT_URL` */
export const LOCAL_NEST_API_DEFAULT = 'http://127.0.0.1:3000/api';
export const RAILWAY_NEST_API_DEFAULT =
  'https://aphoteka-admin-panel-production.up.railway.app/api';

export function getServerNestApiBaseUrl(): string {
  const direct =
    process.env.NEST_API_DIRECT_URL?.trim() ||
    process.env.RAILWAY_NEST_API_URL?.trim();
  if (direct) return direct.replace(/\/$/, '');
  if (process.env.VERCEL) return RAILWAY_NEST_API_DEFAULT;
  return LOCAL_NEST_API_DEFAULT;
}

export function getApiBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== 'undefined') {
    if (fromPublic) {
      return fromPublic.replace(/\/$/, '');
    }
    return `${window.location.origin}/api/nest`.replace(/\/$/, '');
  }

  if (fromPublic) {
    return fromPublic.replace(/\/$/, '');
  }

  return getServerNestApiBaseUrl();
}
