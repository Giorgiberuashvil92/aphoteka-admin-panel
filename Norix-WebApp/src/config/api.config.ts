const LOCAL_API_BASE = "http://localhost:3000/api";
const PRODUCTION_API_BASE =
  "https://aphoteka-admin-panel-production.up.railway.app/api";

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");

  if (process.env.NODE_ENV === "development") {
    return LOCAL_API_BASE;
  }

  return PRODUCTION_API_BASE;
}

export const API_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl();
  },
} as const;
