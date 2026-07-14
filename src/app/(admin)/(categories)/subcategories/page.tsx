"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** ძველი საბკატეგორიების სია → ერთიანი drill-down კატეგორიები */
export default function SubcategoriesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/categories");
  }, [router]);
  return (
    <div className="py-12 text-center text-sm text-gray-500">
      გადამისამართება კატეგორიებზე…
    </div>
  );
}
