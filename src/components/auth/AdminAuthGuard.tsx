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

type GuardState = "loading" | "ready" | "redirect";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GuardState>("loading");

  useEffect(() => {
    let cancelled = false;

    const goLogin = () => {
      clearAuthToken();
      setState("redirect");
      const from = encodeURIComponent(pathname || "/");
      router.replace(`/login?from=${from}`);
    };

    (async () => {
      ensureAuthTokenFromEnv();
      await bootstrapAdminAuth();
      if (cancelled) return;

      const token = getAuthToken();
      if (!token) {
        goLogin();
        return;
      }

      const check = await verifyPanelBackendSession(token);
      if (cancelled) return;

      if (check.status === "unauthorized" || check.status === "failed") {
        goLogin();
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
  }, [router, pathname]);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ავტორიზაციის შემოწმება…
        </p>
      </div>
    );
  }

  if (state === "redirect") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          გადამისამართება შესვლაზე…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
