import { API_CONFIG } from "@/config/api.config";
import { getAccessToken } from "@/lib/auth/session";
import type { AuthUser, RegisterPayload } from "@/types/auth";

function normalizeLoginIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 9 && digits.startsWith("5")) return `+995${digits}`;
  if (digits.length === 12 && digits.startsWith("995")) return `+${digits}`;
  return trimmed;
}

function formatApiErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const message = (data as { message?: unknown }).message;
  let raw: string;
  if (Array.isArray(message)) raw = message.filter(Boolean).join(", ") || fallback;
  else if (typeof message === "string" && message.trim()) raw = message;
  else {
    const error = (data as { error?: string }).error;
    raw = typeof error === "string" && error.trim() ? error : fallback;
  }
  if (/invalid email\/phone or password/i.test(raw)) {
    return "ელ.ფოსტა/ტელეფონი ან პაროლი არასწორია";
  }
  if (/personalId must be 11 digits/i.test(raw)) {
    return "პირადი ნომერი უნდა იყოს ზუსტად 11 ციფრი";
  }
  return raw;
}

function mapUser(raw: Record<string, unknown>): AuthUser {
  const parts = String(raw.fullName ?? "")
    .trim()
    .split(/\s+/);

  return {
    id: String(raw.id ?? raw._id ?? ""),
    firstName:
      (typeof raw.firstName === "string" && raw.firstName) ||
      parts[0] ||
      String(raw.fullName ?? ""),
    lastName:
      (typeof raw.lastName === "string" && raw.lastName) ||
      parts.slice(1).join(" ") ||
      "",
    email: typeof raw.email === "string" ? raw.email : "",
    ...(typeof raw.phoneNumber === "string" && raw.phoneNumber
      ? { phone: raw.phoneNumber }
      : {}),
    phoneVerified: Boolean(raw.phoneVerified ?? raw.isPhoneVerified),
    ...(typeof raw.buyerId === "string" && raw.buyerId
      ? { buyerId: raw.buyerId }
      : {}),
    ...(typeof raw.balanceBuyerUid === "string" && raw.balanceBuyerUid.trim()
      ? { balanceBuyerUid: raw.balanceBuyerUid.trim() }
      : {}),
  };
}

export async function loginMobile(
  emailOrPhone: string,
  password: string,
): Promise<{ success: boolean; message: string; user?: AuthUser; accessToken?: string }> {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/login-mobile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        emailOrPhone: normalizeLoginIdentifier(emailOrPhone),
        password,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        success: false,
        message: formatApiErrorMessage(data, "ავტორიზაცია ვერ მოხერხდა"),
      };
    }

    return {
      success: true,
      message: "ავტორიზაცია წარმატებულია",
      user: mapUser((data.user as Record<string, unknown>) ?? {}),
      accessToken: String(data.accessToken ?? ""),
    };
  } catch {
    return { success: false, message: "ქსელის შეცდომა" };
  }
}

export async function registerMobile(
  payload: RegisterPayload,
): Promise<{ success: boolean; message: string; user?: AuthUser; accessToken?: string }> {
  try {
    const body: Record<string, unknown> = {
      accountType: payload.accountType,
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password,
    };

    if (payload.accountType === "individual") {
      body.firstName = payload.firstName.trim();
      body.lastName = payload.lastName.trim();
      body.personalId = payload.personalId.replace(/\D/g, "");
      body.address = payload.address.trim();
    } else {
      body.companyName = payload.companyName.trim();
      body.legalId = payload.legalId.trim();
      body.address = payload.address.trim();
      const rep = payload.representative?.trim();
      if (rep) body.representative = rep;
    }

    if (payload.country?.trim()) body.country = payload.country.trim();

    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/register-mobile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        success: false,
        message: formatApiErrorMessage(data, "რეგისტრაცია ვერ მოხერხდა"),
      };
    }

    return {
      success: true,
      message: "რეგისტრაცია წარმატებულია",
      user: mapUser((data.user as Record<string, unknown>) ?? {}),
      accessToken: String(data.accessToken ?? ""),
    };
  } catch {
    return { success: false, message: "ქსელის შეცდომა" };
  }
}

export async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const user = mapUser(data);
    return user.id ? user : null;
  } catch {
    return null;
  }
}

function authHeaders(token?: string | null): HeadersInit {
  const accessToken = token ?? getAccessToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
}

export async function updateProfile(
  userId: string,
  updates: Pick<AuthUser, "firstName" | "lastName" | "email">,
): Promise<{ success: boolean; message: string }> {
  try {
    const fullName = [updates.firstName, updates.lastName]
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" ");

    const res = await fetch(`${API_CONFIG.BASE_URL}/users/${userId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        email: updates.email.trim(),
        fullName,
      }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        success: false,
        message: formatApiErrorMessage(data, "პროფილის განახლება ვერ მოხერხდა"),
      };
    }

    return { success: true, message: "შენახულია" };
  } catch {
    return { success: false, message: "ქსელის შეცდომა" };
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      return {
        success: false,
        message: formatApiErrorMessage(data, "პაროლის შეცვლა ვერ მოხერხდა"),
      };
    }

    return { success: true, message: "პაროლი შეცვლილია" };
  } catch {
    return { success: false, message: "ქსელის შეცდომა" };
  }
}
