import { Suspense } from "react";
import { CheckoutSuccessView } from "@/components/checkout/CheckoutSuccessView";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function CheckoutSuccessPage() {
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
        <CheckoutSuccessView />
      </Suspense>
    </>
  );
}
