import { BOG_INLINE } from './bog-inline';

/** იგივე Nest API რაც მობილური/ადმინი იყენებს (Railway). */
export const PRODUCTION_NEST_PUBLIC_URL =
  'https://aphoteka-admin-panel-production.up.railway.app';

function normOrigin(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

function withHttps(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return normOrigin(t);
  return `https://${normOrigin(t)}`;
}

/**
 * საჯარო Nest-ის ბაზა (უპრეფიქსო, არა `/api`) — BOG callback, mobile-return redirect-ები.
 * პრიორიტეტი: NEST_PUBLIC_URL → BOG_CALLBACK_URL-დან → Railway env → prod fallback.
 */
export function resolveNestPublicBaseUrl(): string {
  const explicit = process.env.NEST_PUBLIC_URL?.trim();
  if (explicit) return normOrigin(explicit);

  const bogCallbackFull = process.env.BOG_CALLBACK_URL?.trim();
  if (bogCallbackFull) {
    const derived = bogCallbackFull.replace(
      /\/api\/payments\/bog\/callback\/?$/i,
      '',
    );
    if (derived) return normOrigin(derived);
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) return withHttps(railwayDomain);

  const railwayStatic = process.env.RAILWAY_STATIC_URL?.trim();
  if (railwayStatic) return withHttps(railwayStatic);

  const railwayServiceUrl =
    process.env.RAILWAY_SERVICE_APHOTEKA_ADMIN_PANEL_PRODUCTION_URL?.trim() ||
    process.env.RAILWAY_SERVICE_URL?.trim();
  if (railwayServiceUrl) return withHttps(railwayServiceUrl);

  if (
    process.env.NODE_ENV === 'production' ||
    process.env.RAILWAY_ENVIRONMENT === 'production'
  ) {
    return PRODUCTION_NEST_PUBLIC_URL;
  }

  const inline = BOG_INLINE.publicBaseUrl.trim();
  return inline ? normOrigin(inline) : '';
}

/** BOG server-to-server callback — `{base}/api/payments/bog/callback` */
export function resolveBogCallbackUrl(): string {
  const full = process.env.BOG_CALLBACK_URL?.trim();
  if (full) return normOrigin(full);

  const base = resolveNestPublicBaseUrl();
  if (!base) return '';
  return `${base}/api/payments/bog/callback`;
}
