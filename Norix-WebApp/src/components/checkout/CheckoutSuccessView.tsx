"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "@/contexts/CartProvider";
import {
  ensureBalanceSalePosted,
  waitForOrderPaymentConfirmed,
} from "@/lib/api/orders";

type VerifyState = "loading" | "confirmed" | "pending" | "error";

export function CheckoutSuccessView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim() ?? "";
  const { clearCart } = useCart();
  const [state, setState] = useState<VerifyState>("loading");

  useEffect(() => {
    if (!orderId) {
      setState("error");
      return;
    }

    let cancelled = false;

    async function verify() {
      const result = await waitForOrderPaymentConfirmed(orderId);
      if (cancelled) return;

      if (result === "confirmed") {
        void ensureBalanceSalePosted(orderId);
        clearCart();
        setState("confirmed");
        return;
      }

      if (result === "auth" || result === "error") {
        setState("error");
        return;
      }

      setState("pending");
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [orderId, clearCart]);

  return (
    <main className="w-full flex-1 bg-norix-gray-100">
      <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-norix-blue" />
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              გადახდის დადასტურება...
            </h1>
            <p className="mt-3 text-norix-gray-600">
              რამდენიმე წამი შეიძლება დასჭირდეს
            </p>
          </>
        )}

        {state === "confirmed" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-norix-green" />
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              გადახდა მიღებულია
            </h1>
            <p className="mt-3 text-norix-gray-600">
              თქვენი შეკვეთა წარმატებით გაფორმდა.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/account/orders"
                className="inline-flex h-11 items-center rounded-xl bg-norix-green px-6 text-sm font-semibold text-white"
              >
                ჩემი შეკვეთები
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center rounded-xl border border-norix-border px-6 text-sm font-semibold text-norix-gray-600"
              >
                მთავარ გვერდზე
              </Link>
            </div>
          </>
        )}

        {state === "pending" && (
          <>
            <CheckCircle2 className="h-16 w-16 text-norix-blue" />
            <h1 className="mt-6 text-2xl font-bold text-foreground">
              გადახდა მიღებულია
            </h1>
            <p className="mt-3 text-norix-gray-600">
              შეკვეთის სტატუსი განახლდება რამდენიმე წუთში. შეგიძლიათ შეამოწმოთ
              „ჩემი შეკვეთებში“.
            </p>
            <Link
              href="/account/orders"
              className="mt-8 inline-flex h-11 items-center rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white"
            >
              ჩემი შეკვეთები
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              შეცდომა დადასტურებისას
            </h1>
            <p className="mt-3 text-norix-gray-600">
              {orderId
                ? "ვერ მოხერხდა შეკვეთის სტატუსის შემოწმება. გადადით „ჩემი შეკვეთებში“."
                : "შეკვეთის იდენტიფიკატორი არ მოიძებნა."}
            </p>
            <Link
              href="/account/orders"
              className="mt-8 inline-flex h-11 items-center rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white"
            >
              ჩემი შეკვეთები
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
