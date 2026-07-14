"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** ძველი edit გზა → ერთიანი კატეგორიის რედაქტირება */
export default function EditSubcategoryRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  useEffect(() => {
    if (id) {
      router.replace(`/categories/${id}/edit`);
    } else {
      router.replace("/categories");
    }
  }, [router, id]);

  return (
    <div className="py-12 text-center text-sm text-gray-500">
      გადამისამართება…
    </div>
  );
}
