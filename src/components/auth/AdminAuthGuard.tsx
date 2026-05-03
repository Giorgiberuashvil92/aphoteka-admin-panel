"use client";

import { bootstrapAdminAuth } from "@/lib/bootstrapAdminAuth";
import {
  clearAuthToken,
  ensureAuthTokenFromEnv,
  getAuthToken,
} from "@/lib/authToken";
import { verifyPanelBackendSession } from "@/lib/verifyAdminBackendSession";
import { UserRole } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

type GuardState = "loading" | "ready" | "redirect" | "error";

/**
 * ადმინ layout-ისთვის: JWT + `GET /auth/me` — `admin` ან `warehouse_staff`.
 * საწყობის თანამშრომელი მხოლოდ თავისი საწყობის გვერდებსა და `/orders/:id` დეტალზე.
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("loading");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      ensureAuthTokenFromEnv();
      await bootstrapAdminAuth();
      if (cancelled) return;

      const token = getAuthToken();
      if (!token) {
        setState("redirect");
        const from = encodeURIComponent(pathname || "/");
        router.replace(`/login?from=${from}`);
        return;
      }

      const check = await verifyPanelBackendSession(token);
      if (cancelled) return;

      if (check.status === "unauthorized") {
        clearAuthToken();
        setState("redirect");
        const from = encodeURIComponent(pathname || "/");
        router.replace(`/login?from=${from}`);
        return;
      }

      if (check.status === "failed") {
        setState("error");
        return;
      }

      if (check.role === UserRole.WAREHOUSE_STAFF && check.warehouseId) {
        const wid = check.warehouseId;
        const path = pathname || "";
        const isOrderDetail = /^\/orders\/[^/]+$/.test(path);
        const isWarehouseArea = path.startsWith(`/warehouses/${wid}`);

        if (path === "/orders" || path.startsWith("/orders?")) {
          setState("redirect");
          router.replace(`/warehouses/${wid}/orders`);
          return;
        }

        if (!isOrderDetail && !isWarehouseArea) {
          setState("redirect");
          router.replace(`/warehouses/${wid}/orders`);
          return;
        }
      }

      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [router, pathname, retryKey]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-gray-600 dark:text-gray-400">ავტორიზაციის შემოწმება…</p>
      </div>
    );
  }

  if (state === "redirect") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400">გადამისამართება შესვლაზე…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 dark:bg-gray-900">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          სერვერთან დაკავშირება ვერ მოხერხდა. შეამოწმეთ ქსელი ან სცადეთ თავიდან.
        </p>
        <button
          type="button"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          onClick={() => {
            setState("loading");
            setRetryKey((k) => k + 1);
          }}
        >
          თავიდან
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
