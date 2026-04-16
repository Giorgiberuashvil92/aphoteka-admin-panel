"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { getApiBaseUrl } from "@/lib/apiBaseUrl";
import { ADMIN_PANEL_LOGIN } from "@/config/adminPanelLogin";
import { getAuthToken, setAuthToken } from "@/lib/authToken";
import { normalizePhoneForAdminLogin } from "@/lib/phoneLoginNormalize";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from")?.trim() || "/";

  const [phoneNumber, setPhoneNumber] = useState(
    ADMIN_PANEL_LOGIN.phoneNumber || ""
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) return;
    const safeFrom =
      from.startsWith("/") && !from.startsWith("//") ? from : "/";
    router.replace(safeFrom);
  }, [from, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const base = getApiBaseUrl();
      const normalizedPhone = normalizePhoneForAdminLogin(phoneNumber);
      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: normalizedPhone,
          password,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        accessToken?: string;
        message?: string | string[];
      };

      if (!res.ok) {
        const msg = data.message;
        const text = Array.isArray(msg)
          ? msg.filter(Boolean).join(", ")
          : typeof msg === "string"
            ? msg
            : "";
        setError(text || `შეცდომა (${res.status})`);
        return;
      }

      if (!data.accessToken?.trim()) {
        setError("სერვერმა accessToken არ დააბრუნა.");
        return;
      }

      setAuthToken(data.accessToken.trim());
      const safeFrom =
        from.startsWith("/") && !from.startsWith("//") ? from : "/";
      router.replace(safeFrom);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ქსელის შეცდომა");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col px-4 py-10 sm:mx-auto">
      <div className="mb-8">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
          ადმინ პანელი — შესვლა
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          მიუთითე ტელეფონი და პაროლი (იგივე რაც Nest / Mongo ადმინისთვის).
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <div>
          <Label>ტელეფონი</Label>
          <Input
            type="tel"
            name="phoneNumber"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+995555000000"
            required
          />
        </div>

        <div>
          <Label>პაროლი</Label>
          <Input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <Button className="w-full" size="sm" disabled={loading}>
          {loading ? "იტვირთება…" : "შესვლა"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        <Link href="/" className="text-brand-500 hover:underline">
          მთავარი
        </Link>
      </p>
    </div>
  );
}
