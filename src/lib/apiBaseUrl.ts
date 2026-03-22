/**
 * Nest API ბაზის URL (ბოლოში /api).
 * პრიორიტეტი: NEXT_PUBLIC_API_URL (Vercel Dashboard / vercel.json build.env).
 * შემდეგ: production ან Vercel-ზე deploy → Railway ნაგულისხმევი; dev → localhost.
 */
const PRODUCTION_DEFAULT_API_BASE =
  'https://aphoteka-backend-production.up.railway.app/api';

export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const isProdBuild = process.env.NODE_ENV === 'production';
  const onVercel = Boolean(process.env.VERCEL);
  if (isProdBuild || onVercel) {
    return PRODUCTION_DEFAULT_API_BASE.replace(/\/$/, '');
  }
  return 'http://localhost:3001/api';
}
