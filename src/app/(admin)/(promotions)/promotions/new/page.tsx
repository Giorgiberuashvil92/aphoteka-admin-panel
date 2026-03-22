"use client";

import React from "react";
import { useRouter } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PromotionForm from "@/components/promotions/PromotionForm";
import { promotionsApi, type CreatePromotionPayload } from "@/lib/api";

export default function NewPromotionPage() {
  const router = useRouter();

  const handleSubmit = async (payload: CreatePromotionPayload) => {
    await promotionsApi.create(payload);
    alert("აქცია წარმატებით შეიქმნა!");
    router.push("/promotions");
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="ახალი ფასდაკლება" />

      <PromotionForm onSubmit={handleSubmit} submitLabel="შექმნა" />
    </div>
  );
}
