"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

export function CheckoutFailView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId")?.trim();

  return (
    <main className="w-full flex-1 bg-norix-gray-100">
      <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <XCircle className="h-16 w-16 text-norix-magenta" />
        <h1 className="mt-6 text-2xl font-bold text-foreground">
          გადახდა ვერ დასრულდა
        </h1>
        <p className="mt-3 text-norix-gray-600">
          სცადეთ ხელახლა ან გადახდა „ჩემი შეკვეთებიდან“.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="inline-flex h-11 items-center rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white"
          >
            ხელახლა ცდა
          </Link>
          {orderId ? (
            <Link
              href="/account/orders"
              className="inline-flex h-11 items-center rounded-xl border border-norix-border px-6 text-sm font-semibold text-norix-gray-600"
            >
              ჩემი შეკვეთები
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
