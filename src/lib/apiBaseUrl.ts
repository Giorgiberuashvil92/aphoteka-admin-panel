/**
 * Nest API ბაზის URL (ბოლოში /api).
 * იგივე ნაგულისხმევი რაც Kutuku-MobileApp/src/config/api.config.ts (Railway).
 * პრიორიტეტი: NEXT_PUBLIC_API_URL. შემდეგ: production/Vercel → Railway; dev → localhost.
 */
export const RAILWAY_NEST_API_DEFAULT =
  'https://aphoteka-admin-panel-production.up.railway.app/api';

export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const isProdBuild = process.env.NODE_ENV === 'production';
  const onVercel = Boolean(process.env.VERCEL);
  if (isProdBuild || onVercel) {
    return RAILWAY_NEST_API_DEFAULT.replace(/\/$/, '');
  }
  return 'http://localhost:3001/api';
}
