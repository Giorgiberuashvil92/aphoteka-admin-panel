/** საჯარო საიტის ბაზის URL (metadata, absolute ლინკები). Railway / env: NEXT_PUBLIC_SITE_URL */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    return 'https://aphoteka-admin-panel-production.up.railway.app';
  }
  return 'http://localhost:3000';
}
