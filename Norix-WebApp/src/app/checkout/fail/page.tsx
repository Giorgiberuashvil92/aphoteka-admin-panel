import { Suspense } from "react";
import { CheckoutFailView } from "@/components/checkout/CheckoutFailView";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function CheckoutFailPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="flex min-h-[50vh] items-center justify-center bg-norix-gray-100">
            <p className="text-norix-gray-600">იტვირთება...</p>
          </main>
        }
      >
        <CheckoutFailView />
      </Suspense>
    </>
  );
}
