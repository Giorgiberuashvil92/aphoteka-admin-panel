import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { UserRole } from "@/types";

/** `ok` — JWT სწორია და მომხმარებელი `admin` არის */
export type VerifyAdminSessionResult = "ok" | "unauthorized" | "failed";

/**
 * ადმინ პანელისთვის: Nest `GET /auth/me` + როლი `admin`.
 * `failed` — ქსელი / 5xx (არა სესიის პირდაპირი უარი).
 */
export async function verifyAdminBackendSession(
  token: string,
): Promise<VerifyAdminSessionResult> {
  const t = token?.trim();
  if (!t) return "unauthorized";

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401 || res.status === 403) return "unauthorized";
    if (!res.ok) return "failed";

    const data = (await res.json()) as { role?: string };
    if (data.role !== UserRole.ADMIN) return "unauthorized";
    return "ok";
  } catch {
    return "failed";
  }
}
