"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PromotionForm from "@/components/promotions/PromotionForm";
import {
  promotionsApi,
  type CreatePromotionPayload,
  type AdminPromotion,
} from "@/lib/api";

export default function EditPromotionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [promotion, setPromotion] = useState<AdminPromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    promotionsApi
      .getById(id)
      .then((data) => setPromotion(data ?? null))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "ჩატვირთვა ვერ მოხერხდა");
        setPromotion(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (payload: CreatePromotionPayload) => {
    if (!id) return;
    await promotionsApi.update(id, payload);
    alert("აქცია განახლდა!");
    router.push("/promotions");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="ფასდაკლების რედაქტირება" />
        <p className="text-gray-500">იტვირთება...</p>
      </div>
    );
  }

  if (error || !promotion) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="ფასდაკლების რედაქტირება" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error || "აქცია არ მოიძებნა"}
        </div>
        <a
          href="/promotions"
          className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm text-white hover:bg-brand-600"
        >
          დაბრუნება სიაში
        </a>
      </div>
    );
  }

  const initial: Partial<CreatePromotionPayload> & { id?: string } = {
    name: promotion.name,
    description: promotion.description ?? undefined,
    backgroundColor: promotion.backgroundColor ?? undefined,
    logoUrl: promotion.logoUrl ?? undefined,
    productIds: promotion.productIds ?? [],
    discountPercent: promotion.discountPercent,
    startDate: promotion.startDate
      ? new Date(promotion.startDate).toISOString()
      : undefined,
    endDate: promotion.endDate
      ? new Date(promotion.endDate).toISOString()
      : undefined,
    active: promotion.active,
    order: promotion.order ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="ფასდაკლების რედაქტირება" />

      <PromotionForm
        initial={initial}
        onSubmit={handleSubmit}
        submitLabel="ცვლილებების შენახვა"
      />
    </div>
  );
}
