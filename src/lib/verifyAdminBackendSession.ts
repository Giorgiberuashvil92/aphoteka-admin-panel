import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { UserRole } from "@/types";

/** @deprecated გამოიყენეთ VerifyPanelSessionResult */
export type VerifyAdminSessionResult = "ok" | "unauthorized" | "failed";

export type VerifyPanelSessionResult =
  | { status: "ok"; role: UserRole; warehouseId?: string }
  | { status: "unauthorized" }
  | { status: "failed" };

function parseWarehouseId(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    const id = (raw as { _id?: unknown })._id;
    return id != null ? String(id) : undefined;
  }
  const s = String(raw);
  return s && s !== "undefined" ? s : undefined;
}

/**
 * ადმინ პანელი + საწყობის თანამშრომელი: Nest `GET /auth/me`.
 */
export async function verifyPanelBackendSession(
  token: string,
): Promise<VerifyPanelSessionResult> {
  const t = token?.trim();
  if (!t) return { status: "unauthorized" };

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401 || res.status === 403) return { status: "unauthorized" };
    if (!res.ok) return { status: "failed" };

    const data = (await res.json()) as {
      role?: string;
      warehouseId?: unknown;
    };
    const role = data.role as UserRole | undefined;
    if (role !== UserRole.ADMIN && role !== UserRole.WAREHOUSE_STAFF) {
      return { status: "unauthorized" };
    }
    const warehouseId = parseWarehouseId(data.warehouseId);
    if (role === UserRole.WAREHOUSE_STAFF && !warehouseId) {
      return { status: "unauthorized" };
    }
    return { status: "ok", role, warehouseId };
  } catch {
    return { status: "failed" };
  }
}

/**
 * უკუთავსებადობისთვის — იგივე რაც `verifyPanelBackendSession`, მაგრამ ძველი ტიპით.
 */
export async function verifyAdminBackendSession(
  token: string,
): Promise<VerifyAdminSessionResult> {
  const r = await verifyPanelBackendSession(token);
  if (r.status === "ok") return "ok";
  if (r.status === "unauthorized") return "unauthorized";
  return "failed";
}
