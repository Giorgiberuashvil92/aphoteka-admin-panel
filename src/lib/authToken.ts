import { ADMIN_PANEL_JWT_FALLBACK } from "@/config/adminPanelLogin";

/**
 * ერთი გლობალური JWT ადმინ პანელისთვის.
 *
 * პრიორიტეტი:
 * 1) `NEXT_PUBLIC_ADMIN_JWT` — ბრაუზერში და build-ში (Vercel env)
 * 2) `ADMIN_API_JWT` — მხოლოდ სერვერზე (SSR / Route Handler), ბრაუზერში არ ხვდება
 * 3) `localStorage` → `AUTH_TOKEN_STORAGE_KEY` — auto-login / ხელით შესვლა
 */

export const AUTH_TOKEN_STORAGE_KEY = "aphoteka_admin_auth_v1";

/** ძველი bug: JWT იყო გამოყენებული localStorage *key* — ერთჯერადი მიგრაცია `getAuthToken` / `ensureAuthTokenFromEnv`-ში */
const LEGACY_AUTH_TOKEN_LOCALSTORAGE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWMwODkyZWVkMGRkNjRhMDU2MjkxNWYiLCJwaG9uZU51bWJlciI6Iis5OTU1NTUwMDAwMDAiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzQyMjU3MTUsImV4cCI6MTc3NDgzMDUxNX0.pr5AVhDRwl3RlQ395XlMhCrs4qnwIDiVLrMPUKilPQI";

function migrateLegacyAuthStorageKey(): void {
  if (typeof window === "undefined") return;
  try {
    const legacyVal = localStorage
      .getItem(LEGACY_AUTH_TOKEN_LOCALSTORAGE_KEY)
      ?.trim();
    if (!legacyVal) return;
    if (!localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim()) {
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, legacyVal);
    }
    localStorage.removeItem(LEGACY_AUTH_TOKEN_LOCALSTORAGE_KEY);
  } catch {
    /* private mode / quota */
  }
}

function readEnvJwt(isServer: boolean): string {
  if (typeof process === "undefined") return "";
  const pub = process.env.NEXT_PUBLIC_ADMIN_JWT?.trim() || "";
  if (pub) return pub;
  if (isServer) {
    return process.env.ADMIN_API_JWT?.trim() || "";
  }
  return "";
}

/** შესვლის შემდეგ / ხელით — Bearer-ისთვის იგივე გასაღები */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  const t = token?.trim();
  if (!t) return;
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, t);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Authorization header-ისთვის */
export function getAuthToken(): string | null {
  const onServer = typeof window === "undefined";
  const envJwt = readEnvJwt(onServer);

  if (!onServer) {
    migrateLegacyAuthStorageKey();
    if (envJwt) return envJwt;
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim() || null;
  }

  return envJwt || null;
}

/**
 * Client mount-ზე: env JWT → localStorage (devtools / ძველი კოდი იგივე ტოკენს ხედავს).
 */
export function ensureAuthTokenFromEnv(): void {
  if (typeof window === "undefined") return;
  migrateLegacyAuthStorageKey();
  const envJwt = process.env.NEXT_PUBLIC_ADMIN_JWT?.trim();
  if (envJwt) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, envJwt);
    return;
  }
  /** არ გადავწეროთ login-ის ახალი accessToken ძველი embedded JWT-ით (ყოველ apiRequest-ზე ხდებოდა → მუდამ 401) */
  const existing = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
  if (existing) return;
  const embedded = ADMIN_PANEL_JWT_FALLBACK.trim();
  if (embedded) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, embedded);
  }
}
