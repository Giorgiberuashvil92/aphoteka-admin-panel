"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { CartLineItem } from "@/components/cart/CartLineItem";
import {
  DeliveryOptionsSection,
  deliverySummaryLabel,
} from "@/components/checkout/DeliveryOptionsSection";
import { useAuth } from "@/contexts/AuthProvider";
import { useCart } from "@/contexts/CartProvider";
import {
  calculateDeliveryFees,
  deliveryTotal,
  geocodeAddress,
  getPharmacyAddress,
  pickCheapestProvider,
} from "@/lib/api/delivery";
import {
  buildBogRedirectUrls,
  createOrder,
  initBogPayment,
} from "@/lib/api/orders";
import { formatPrice, formatPriceSpaced } from "@/lib/format";
import type {
  DeliveryAddress,
  DeliveryProvider,
  DeliveryPrice,
  SelectedDelivery,
} from "@/types/delivery";

const MONGO_OBJECT_ID_RE = /^[a-fA-F0-9]{24}$/;

const ADDRESS_STORAGE_KEY = "norix_checkout_address";

interface CheckoutAddress {
  street: string;
  city: string;
}

function loadCheckoutAddress(): CheckoutAddress {
  if (typeof window === "undefined") {
    return { street: "", city: "თბილისი" };
  }
  try {
    const raw = localStorage.getItem(ADDRESS_STORAGE_KEY);
    if (!raw) return { street: "", city: "თბილისი" };
    const parsed = JSON.parse(raw) as Partial<CheckoutAddress>;
    return {
      street: String(parsed.street ?? ""),
      city: String(parsed.city ?? "თბილისი"),
    };
  } catch {
    return { street: "", city: "თბილისი" };
  }
}

export function CheckoutView() {
  const {
    items,
    itemCount,
    totalPrice,
    totalOldPrice,
    totalDiscount,
    removeFromCart,
    updateQuantity,
    openDrawer,
    clearCart,
  } = useCart();
  const { isAuthenticated, openAuth, user } = useAuth();
  const searchParams = useSearchParams();
  const buyNow = searchParams.get("buyNow") === "1";
  const autoPayAttempted = useRef(false);

  const [street, setStreet] = useState(() => loadCheckoutAddress().street);
  const [city, setCity] = useState(() => loadCheckoutAddress().city);
  const [notes, setNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [deliveryProviders, setDeliveryProviders] = useState<DeliveryProvider[]>([]);
  const [deliveryDistance, setDeliveryDistance] = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<SelectedDelivery | null>(
    null,
  );
  const [deliveryToAddress, setDeliveryToAddress] = useState<DeliveryAddress | null>(
    null,
  );
  const deliveryRequestId = useRef(0);

  const deliveryFee = selectedDelivery ? deliveryTotal(selectedDelivery) : 0;
  const grandTotal = totalPrice + deliveryFee;
  const addressReady = street.trim().length > 0 && city.trim().length > 0;
  const addressLabel = addressReady ? `${street.trim()}, ${city.trim()}` : "";

  const loadDeliveryOptions = useCallback(async () => {
    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    if (!trimmedStreet || !trimmedCity) {
      setDeliveryProviders([]);
      setDeliveryDistance(0);
      setSelectedDelivery(null);
      setDeliveryToAddress(null);
      setDeliveryError(null);
      setDeliveryLoading(false);
      return;
    }

    const requestId = ++deliveryRequestId.current;
    setDeliveryLoading(true);
    setDeliveryError(null);
    setSelectedDelivery(null);
    setDeliveryToAddress(null);

    try {
      const coords = await geocodeAddress(trimmedStreet, trimmedCity);
      if (requestId !== deliveryRequestId.current) return;

      const toAddress = {
        streetName: trimmedStreet,
        cityName: trimmedCity,
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
      const fromAddress = getPharmacyAddress();
      const { providers, distance } = await calculateDeliveryFees(
        fromAddress,
        toAddress,
      );

      if (requestId !== deliveryRequestId.current) return;

      setDeliveryProviders(providers);
      setDeliveryDistance(distance);
      setDeliveryToAddress(toAddress);

      const cheapest = pickCheapestProvider(providers);
      if (cheapest) {
        setSelectedDelivery({
          provider: cheapest,
          selectedPrice: cheapest.prices[0],
          fromAddress,
          toAddress,
          distance,
        });
      }
    } catch {
      if (requestId !== deliveryRequestId.current) return;
      setDeliveryProviders([]);
      setDeliveryDistance(0);
      setDeliveryToAddress(null);
      setDeliveryError("მიტანის ვარიანტების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      if (requestId === deliveryRequestId.current) {
        setDeliveryLoading(false);
      }
    }
  }, [street, city]);

  useEffect(() => {
    localStorage.setItem(
      ADDRESS_STORAGE_KEY,
      JSON.stringify({ street, city }),
    );
  }, [street, city]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDeliveryOptions();
    }, addressReady ? 600 : 0);

    return () => clearTimeout(timer);
  }, [addressReady, loadDeliveryOptions]);

  function handleSelectProvider(provider: DeliveryProvider, price: DeliveryPrice) {
    if (!deliveryToAddress) return;
    setSelectedDelivery({
      provider,
      selectedPrice: price,
      fromAddress: getPharmacyAddress(),
      toAddress: deliveryToAddress,
      distance: deliveryDistance,
    });
  }

  async function handlePay() {
    if (paying) return;
    setPayError(null);

    if (!isAuthenticated) {
      openAuth("login");
      return;
    }

    if (!items.length) return;

    const trimmedStreet = street.trim();
    const trimmedCity = city.trim();
    if (!trimmedStreet) {
      setPayError("შეიყვანეთ ქუჩის მისამართი");
      return;
    }
    if (!trimmedCity) {
      setPayError("შეიყვანეთ ქალაქი");
      return;
    }
    if (!selectedDelivery) {
      setPayError("აირჩიეთ მიტანის ვარიანტი");
      return;
    }

    for (const item of items) {
      if (!MONGO_OBJECT_ID_RE.test(item.id.trim())) {
        setPayError(
          `პროდუქტი „${item.name}“ ვერ მოიძებნა — გახსენით კატალოგიდან და თავიდან დაამატეთ.`,
        );
        return;
      }
      if (!Number.isFinite(item.price) || item.price < 0) {
        setPayError(`პროდუქტი „${item.name}“ — ფასი არასწორია.`);
        return;
      }
    }

    setPaying(true);
    try {
      const shippingAddress = `${trimmedStreet}, ${trimmedCity}`;
      const deliveryLabel = deliverySummaryLabel(selectedDelivery);
      const commentParts = [
        notes.trim(),
        "გადახდა: ონლაინ (საქართველოს ბანკი)",
        `მიტანა: ${deliveryLabel} — ${deliveryFee.toFixed(2)}₾`,
        `ჯამი (პროდუქტები+მიტანა): ${grandTotal.toFixed(2)}₾`,
      ].filter(Boolean);

      const orderResult = await createOrder({
        items: items.map((item) => ({
          productId: item.id.trim(),
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          imageUrl: item.imageUrl || undefined,
          unitLabel: item.unitLabel,
        })),
        shippingAddress,
        phoneNumber: user?.phone,
        comment: commentParts.join("; "),
        delivery: {
          provider: {
            providerId: selectedDelivery.provider.providerId,
            providerName: selectedDelivery.provider.providerName,
            providerLogoUrl: selectedDelivery.provider.providerLogoUrl,
          },
          address: selectedDelivery.toAddress,
          deliveryPrice: selectedDelivery.selectedPrice.amount,
          deliveryServiceFee: selectedDelivery.provider.serviceFee,
          deliverySpeed: selectedDelivery.selectedPrice.deliverySpeedName,
        },
      });

      if (!orderResult.ok) {
        if (orderResult.error === "auth") {
          openAuth("login");
          return;
        }
        setPayError(orderResult.message ?? "შეკვეთა ვერ შეიქმნა");
        return;
      }

      clearCart();

      const payResult = await initBogPayment(
        orderResult.orderId,
        buildBogRedirectUrls(orderResult.orderId),
      );

      if (!payResult.ok) {
        if (payResult.error === "auth") {
          openAuth("login");
          return;
        }
        setPayError(
          payResult.message ??
            "გადახდა ვერ დაიწყო. შეკვეთა შექმნილია — სცადეთ „ჩემი შეკვეთებიდან“.",
        );
        return;
      }

      window.location.href = payResult.redirectUrl;
    } finally {
      setPaying(false);
    }
  }

  const handlePayRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    handlePayRef.current = handlePay;
  });

  useEffect(() => {
    if (!buyNow || autoPayAttempted.current) return;
    if (!items.length || !addressReady || deliveryLoading || !selectedDelivery) {
      return;
    }
    autoPayAttempted.current = true;
    void handlePayRef.current?.();
  }, [buyNow, items.length, addressReady, deliveryLoading, selectedDelivery]);

  return (
    <main className="w-full flex-1 bg-norix-gray-100">
      <div className="mx-auto w-full px-4 py-6 md:px-8 md:py-8 lg:px-12 xl:px-16">
        <Link
          href="/"
          onClick={(event) => {
            event.preventDefault();
            openDrawer();
          }}
          className="mb-6 inline-flex items-center gap-2 text-[15px] font-medium text-norix-gray-600 hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
          კალათაში დაბრუნება
        </Link>

        {items.length === 0 ? (
          <section className="rounded-2xl border border-norix-border bg-white p-10 text-center">
            <h1 className="text-2xl font-bold text-foreground">კალათა ცარიელია</h1>
            <p className="mt-3 text-norix-gray-600">
              დაამატეთ პროდუქტები გადასახდელად.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-norix-blue px-6 text-sm font-semibold text-white"
            >
              მთავარ გვერდზე
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-norix-border bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">მისამართი</h2>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="checkout-street"
                      className="mb-2 block text-sm font-medium text-norix-gray-600"
                    >
                      ქუჩის მისამართი *
                    </label>
                    <textarea
                      id="checkout-street"
                      value={street}
                      onChange={(event) => setStreet(event.target.value)}
                      placeholder="მაგ. ვაჟა-ფშაველას გამზ. 29, ბ. 2, ბინა 15"
                      rows={3}
                      className="w-full rounded-xl border border-norix-border bg-norix-gray-100 px-4 py-3 text-[15px] outline-none transition-colors placeholder:text-norix-gray-400 focus:border-norix-blue-light focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="checkout-city"
                      className="mb-2 block text-sm font-medium text-norix-gray-600"
                    >
                      ქალაქი *
                    </label>
                    <input
                      id="checkout-city"
                      type="text"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="თბილისი"
                      className="h-12 w-full rounded-xl border border-norix-border bg-norix-gray-100 px-4 text-[15px] outline-none transition-colors placeholder:text-norix-gray-400 focus:border-norix-blue-light focus:bg-white"
                    />
                  </div>
                </div>

                <p className="mt-4 rounded-xl bg-norix-gray-100 px-4 py-3 text-sm font-medium text-norix-gray-600">
                  მისამართის შევსების შემდეგ გამოჩნდება QuickShipper-ის მიტანის
                  ვარიანტები
                </p>
              </section>

              {addressReady ? (
                <DeliveryOptionsSection
                  addressLabel={addressLabel}
                  distance={deliveryDistance}
                  providers={deliveryProviders}
                  loading={deliveryLoading}
                  error={deliveryError}
                  selectedProviderId={selectedDelivery?.provider.providerId ?? null}
                  selectedPriceId={selectedDelivery?.selectedPrice.id ?? null}
                  onSelectProvider={handleSelectProvider}
                  onRetry={() => void loadDeliveryOptions()}
                />
              ) : null}

              <section className="rounded-2xl border border-norix-border bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  დამატებითი ინფორმაცია
                </h2>
                <textarea
                  placeholder="შეიყვანეთ ტექსტი"
                  maxLength={125}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-28 w-full rounded-xl border border-norix-border bg-norix-gray-100 px-4 py-3 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
                />
                <p className="mt-2 text-right text-sm text-norix-gray-400">
                  {notes.length} / 125
                </p>
              </section>

              <section className="rounded-2xl border border-norix-border bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">
                  გადახდის მეთოდი
                </h2>
                <div className="flex items-center gap-3 rounded-xl border border-norix-blue bg-norix-gray-100 px-4 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6600] text-xs font-bold text-white">
                    BOG
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-foreground">
                      საქართველოს ბანკი
                    </p>
                    <p className="text-sm text-norix-gray-600">
                      უსაფრთხო ონლაინ გადახდა
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-2xl border border-norix-border bg-white p-6">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">პროდუქცია</h2>
                  <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-norix-blue px-2 text-sm font-bold text-white">
                    {itemCount}
                  </span>
                </div>

                {items.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    onRemove={removeFromCart}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </section>

              <section className="rounded-2xl border border-norix-border bg-white p-6">
                <h2 className="mb-4 text-xl font-bold text-foreground">გადახდა</h2>

                <div className="mb-5 flex gap-2">
                  <input
                    placeholder="შეიყვანეთ პრომო კოდი"
                    className="h-12 flex-1 rounded-xl border border-norix-border bg-norix-gray-100 px-4 text-[15px] outline-none focus:border-norix-blue-light focus:bg-white"
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-norix-border px-4 text-sm font-semibold text-norix-gray-600"
                  >
                    გააქტიურება
                  </button>
                </div>

                <div className="space-y-2 text-[15px] text-norix-gray-600">
                  <div className="flex justify-between">
                    <span>პროდუქციის რ-ბა</span>
                    <span>{itemCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ღირებულება</span>
                    <span>{formatPrice(totalOldPrice)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-norix-magenta">
                      <span>ფასდაკლება</span>
                      <span>(-{formatPrice(totalDiscount)})</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>მიწოდება</span>
                    <span>
                      {deliveryLoading
                        ? "..."
                        : selectedDelivery
                          ? formatPrice(deliveryFee)
                          : addressReady
                            ? "—"
                            : formatPrice(0)}
                    </span>
                  </div>
                  {selectedDelivery ? (
                    <p className="text-xs text-norix-gray-500">
                      {deliverySummaryLabel(selectedDelivery)}
                    </p>
                  ) : null}
                  <div className="flex justify-between pt-2 text-xl font-bold text-foreground">
                    <span>ჯამში გადასახდელი</span>
                    <span>{formatPriceSpaced(grandTotal)}</span>
                  </div>
                </div>

                {payError ? (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {payError}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={paying || deliveryLoading || !selectedDelivery}
                  onClick={() => void handlePay()}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-norix-green text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      მიმდინარეობს...
                    </>
                  ) : (
                    <>გადახდა {formatPriceSpaced(grandTotal)}</>
                  )}
                </button>

                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-norix-green">
                  <ShieldCheck className="h-4 w-4" />
                  დაცული გადახდა საქართველოს ბანკით
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
