"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** ძველი „ახალი საბკატეგორია“ → /categories/new (შიგნიდან parentId-ით ჯობს) */
export default function NewSubcategoryRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/categories/new");
  }, [router]);
  return (
    <div className="py-12 text-center text-sm text-gray-500">
      გადამისამართება…
    </div>
  );
}
