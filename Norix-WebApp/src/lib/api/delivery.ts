import { API_CONFIG } from "@/config/api.config";
import type {
  DeliveryAddress,
  DeliveryFeesResponse,
  DeliveryProvider,
} from "@/types/delivery";

/** თბილისის ცენტრი — fallback როცა geocode ვერ მოხერხდა */
export const TBILISI_DEFAULT_COORDS = {
  latitude: 41.7151,
  longitude: 44.8271,
};

export function getPharmacyAddress(): DeliveryAddress {
  return {
    streetName: "კოსტავას 17, თბილისი",
    cityName: "თბილისი",
    latitude: 41.7332044,
    longitude: 44.7413653,
  };
}

export async function geocodeAddress(
  streetName: string,
  cityName: string,
): Promise<{ latitude: number; longitude: number }> {
  const query = `${streetName}, ${cityName}, Georgia`;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Language": "ka",
          "User-Agent": "Norix-WebApp/1.0 (checkout)",
        },
      },
    );

    if (!res.ok) return TBILISI_DEFAULT_COORDS;

    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const first = data[0];
    if (!first?.lat || !first?.lon) return TBILISI_DEFAULT_COORDS;

    const latitude = parseFloat(first.lat);
    const longitude = parseFloat(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return TBILISI_DEFAULT_COORDS;
    }

    return { latitude, longitude };
  } catch {
    return TBILISI_DEFAULT_COORDS;
  }
}

export async function calculateDeliveryFees(
  fromAddress: DeliveryAddress,
  toAddress: DeliveryAddress,
): Promise<{ providers: DeliveryProvider[]; distance: number }> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/quickshipper/fees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      fromStreetName: fromAddress.streetName,
      fromCityName: fromAddress.cityName,
      fromLatitude: fromAddress.latitude,
      fromLongitude: fromAddress.longitude,
      toStreetName: toAddress.streetName,
      toCityName: toAddress.cityName,
      toLatitude: toAddress.latitude,
      toLongitude: toAddress.longitude,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as DeliveryFeesResponse;
  const providers = (data.fees ?? []).filter(
    (provider) => provider.isActive && provider.prices.length > 0,
  );

  return {
    providers,
    distance: data.distance ?? 0,
  };
}

export function pickCheapestProvider(
  providers: DeliveryProvider[],
): DeliveryProvider | null {
  if (!providers.length) return null;
  return providers.reduce((prev, curr) =>
    curr.minPrice < prev.minPrice ? curr : prev,
  );
}

export function deliveryTotal(delivery: {
  selectedPrice: { amount: number };
  provider: { serviceFee: number };
}): number {
  return delivery.selectedPrice.amount + delivery.provider.serviceFee;
}
