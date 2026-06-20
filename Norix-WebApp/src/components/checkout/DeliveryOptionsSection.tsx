"use client";

import { Car, Calendar, Clock, Loader2, MapPin, Zap } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { DeliveryProvider, DeliveryPrice, SelectedDelivery } from "@/types/delivery";

interface DeliveryOptionsSectionProps {
  addressLabel: string;
  distance: number;
  providers: DeliveryProvider[];
  loading: boolean;
  error: string | null;
  selectedProviderId: number | null;
  selectedPriceId: string | null;
  onSelectProvider: (provider: DeliveryProvider, price: DeliveryPrice) => void;
  onRetry: () => void;
}

export function DeliveryOptionsSection({
  addressLabel,
  distance,
  providers,
  loading,
  error,
  selectedProviderId,
  selectedPriceId,
  onSelectProvider,
  onRetry,
}: DeliveryOptionsSectionProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-norix-border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-foreground">მიტანის არჩევანი</h2>
        <div className="flex flex-col items-center gap-3 py-8 text-norix-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-norix-blue" />
          <p className="text-[15px]">ვიძებნით მიტანის ვარიანტებს...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-norix-border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-foreground">მიტანის არჩევანი</h2>
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 h-11 rounded-xl bg-norix-blue px-5 text-sm font-semibold text-white"
        >
          ხელახლა ცდა
        </button>
      </section>
    );
  }

  if (!providers.length) {
    return (
      <section className="rounded-2xl border border-norix-border bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-foreground">მიტანის არჩევანი</h2>
        <div className="py-6 text-center">
          <MapPin className="mx-auto h-12 w-12 text-norix-gray-400" />
          <p className="mt-4 text-lg font-semibold text-foreground">
            მიტანა მიუწვდომელია
          </p>
          <p className="mt-2 text-sm text-norix-gray-600">
            სამწუხაროდ, თქვენს მისამართზე მიტანა ამჟამად შეუძლებელია
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-norix-border bg-white p-6">
      <h2 className="mb-4 text-xl font-bold text-foreground">მიტანის არჩევანი</h2>

      <div className="mb-5 rounded-xl bg-norix-gray-100 px-4 py-3">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-norix-blue" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-norix-gray-600">მიტანის მისამართი</p>
            <p className="text-[15px] font-medium text-foreground">{addressLabel}</p>
          </div>
        </div>
        {distance > 0 ? (
          <p className="mt-2 border-t border-norix-border pt-2 text-sm text-norix-gray-600">
            მანძილი: {distance.toFixed(2)} კმ
          </p>
        ) : null}
      </div>

      <p className="mb-3 text-sm font-medium text-norix-gray-600">
        ხელმისაწვდომი სერვისები ({providers.length})
      </p>

      <div className="space-y-3">
        {providers.map((provider) => {
          const isSelected = selectedProviderId === provider.providerId;

          return (
            <button
              key={provider.providerId}
              type="button"
              onClick={() => onSelectProvider(provider, provider.prices[0])}
              className={`w-full rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-norix-blue bg-norix-gray-100"
                  : "border-norix-border bg-white hover:border-norix-blue-light"
              }`}
            >
              <div className="flex items-center gap-3">
                {provider.providerLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={provider.providerLogoUrl}
                    alt={provider.providerName}
                    className="h-12 w-12 rounded-lg bg-white object-contain p-1"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-norix-gray-100 text-xs font-bold text-norix-gray-600">
                    QS
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-foreground">
                    {provider.providerName}
                  </p>
                  {provider.providerNote ? (
                    <p className="text-xs text-norix-gray-600">{provider.providerNote}</p>
                  ) : null}
                </div>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-norix-blue" : "border-norix-gray-400"
                  }`}
                >
                  {isSelected ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-norix-blue" />
                  ) : null}
                </span>
              </div>

              {provider.prices.map((price) => {
                const priceSelected =
                  isSelected && selectedPriceId === price.id;
                const isFast = price.deliverySpeedName.toLowerCase().includes("min");

                return (
                  <div
                    key={price.id}
                    className={`mt-3 flex items-center justify-between border-t border-norix-border pt-3 ${
                      provider.prices.length > 1 ? "cursor-pointer" : ""
                    }`}
                    onClick={(event) => {
                      if (provider.prices.length <= 1) return;
                      event.stopPropagation();
                      onSelectProvider(provider, price);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isFast ? (
                        <Zap className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-norix-gray-600" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {price.deliverySpeedName}
                        </p>
                        {price.deliverySpeedDescription ? (
                          <p className="text-xs text-norix-gray-600">
                            {price.deliverySpeedDescription}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-base font-bold ${
                          priceSelected ? "text-norix-blue" : "text-foreground"
                        }`}
                      >
                        {formatPrice(price.amount)}
                      </p>
                      {price.oldAmount ? (
                        <p className="text-xs text-norix-gray-400 line-through">
                          {formatPrice(price.oldAmount)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <p className="mt-2 text-xs text-norix-gray-600">
                + სერვისის საფასური: {formatPrice(provider.serviceFee)}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {provider.hasCarDelivery ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-norix-gray-100 px-2 py-1 text-xs text-norix-blue">
                    <Car className="h-3 w-3" />
                    მანქანით
                  </span>
                ) : null}
                {provider.hasScheduledDelivery ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-norix-gray-100 px-2 py-1 text-xs text-norix-blue">
                    <Calendar className="h-3 w-3" />
                    დაგეგმილი
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function deliverySummaryLabel(delivery: SelectedDelivery): string {
  return `${delivery.provider.providerName} (${delivery.selectedPrice.deliverySpeedName})`;
}
