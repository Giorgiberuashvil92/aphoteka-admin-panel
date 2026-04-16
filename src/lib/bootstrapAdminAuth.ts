"use client";

import { ADMIN_PANEL_LOGIN } from "@/config/adminPanelLogin";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { ensureAuthTokenFromEnv, getAuthToken, setAuthToken } from "@/lib/authToken";
import { normalizePhoneForAdminLogin } from "@/lib/phoneLoginNormalize";

/**
 * Env / JWT fallback → localStorage, შემდეგ თუ ტოკენი კიდევ არაა — POST /auth/login.
 */
export async function bootstrapAdminAuth(): Promise<void> {
  if (typeof window === "undefined") return;

  ensureAuthTokenFromEnv();

  if (getAuthToken()) return;

  const { phoneNumber, password } = ADMIN_PANEL_LOGIN;
  if (!phoneNumber?.trim() || !password?.trim()) return;

  const base = getApiBaseUrl();
  const normalizedPhone = normalizePhoneForAdminLogin(phoneNumber);

  try {
    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: normalizedPhone,
        password,
      }),
    });

    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[admin] auto-login failed:",
          res.status,
          await res.text().catch(() => ""),
        );
      }
      return;
    }

    const data = (await res.json()) as { accessToken?: string };
    if (data.accessToken?.trim()) {
      setAuthToken(data.accessToken.trim());
    }
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin] auto-login error:", e);
    }
  }
}
