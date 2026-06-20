import { Suspense } from "react";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={null}>
        <CheckoutView />
      </Suspense>
    </>
  );
}
