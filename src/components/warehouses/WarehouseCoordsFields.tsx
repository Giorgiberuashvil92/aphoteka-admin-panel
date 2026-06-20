"use client";

import React from "react";

type Props = {
  latitude: string;
  longitude: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
};

export function WarehouseCoordsFields({
  latitude,
  longitude,
  onLatitudeChange,
  onLongitudeChange,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
        კოორდინატები (latitude / longitude)
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        შეკვეთის მისამართთან ყველაზე ახლო საწყობის ავტომატური არჩევისთვის. Google
        Maps-ზე მარჯვენა ღილაკი → კოორდინატების კოპირება.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Latitude (განედი)
          </label>
          <input
            type="number"
            step="any"
            min={-90}
            max={90}
            value={latitude}
            onChange={(e) => onLatitudeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="41.7151"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Longitude (გრძედი)
          </label>
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={longitude}
            onChange={(e) => onLongitudeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="44.8271"
          />
        </div>
      </div>
    </div>
  );
}

export function parseWarehouseCoords(latitude: string, longitude: string): {
  latitude?: number;
  longitude?: number;
  error?: string;
} {
  const latTrim = latitude.trim();
  const lonTrim = longitude.trim();
  if (!latTrim && !lonTrim) {
    return {};
  }
  if (!latTrim || !lonTrim) {
    return { error: "latitude და longitude ორივე უნდა შეივსოს, ან ორივე ცარიელი დატოვეთ" };
  }
  const lat = Number(latTrim);
  const lon = Number(lonTrim);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { error: "კოორდინატები უნდა იყოს რიცხვი" };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { error: "latitude: -90…90, longitude: -180…180" };
  }
  return { latitude: lat, longitude: lon };
}

export function warehouseHasCoords(w: {
  latitude?: number | null;
  longitude?: number | null;
}): boolean {
  return (
    w.latitude != null &&
    w.longitude != null &&
    Number.isFinite(w.latitude) &&
    Number.isFinite(w.longitude)
  );
}
