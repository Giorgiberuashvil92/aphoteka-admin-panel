/**
 * Nest API ბაზის URL (ბოლოში /api).
 *
 * ლოკალურად (localhost/127.0.0.1) ყოველთვის ვამჯობინებთ localhost API-ს,
 * რომ Next-ის `start` production რეჟიმშიც Railway-ზე არ გადავიდეს.
 */
export const LOCAL_NEST_API_DEFAULT = 'http://localhost:3001/api';
export const RAILWAY_NEST_API_DEFAULT =
  'https://aphoteka-admin-panel-production.up.railway.app/api';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_NEST_API_DEFAULT;
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_URL);
  if (onVercel) {
    return RAILWAY_NEST_API_DEFAULT.replace(/\/$/, '');
  }
  return LOCAL_NEST_API_DEFAULT;
}
