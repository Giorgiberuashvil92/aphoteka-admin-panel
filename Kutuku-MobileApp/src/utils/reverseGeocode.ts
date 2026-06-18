import * as Location from 'expo-location';

export type ReverseGeocodeResult = {
  streetName: string;
  cityName: string;
};

function buildStreetLine(
  place: Location.LocationGeocodedAddress,
): string {
  const parts = [
    place.street,
    place.streetNumber,
    place.name && place.name !== place.street ? place.name : null,
  ].filter((p): p is string => Boolean(p?.trim()));

  const unique = [...new Set(parts.map((p) => p.trim()))];
  if (unique.length > 0) return unique.join(' ');

  return place.formattedAddress?.trim() || '';
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results.length) return null;

    const place = results[0];
    const streetName = buildStreetLine(place);
    const cityName =
      place.city?.trim() ||
      place.subregion?.trim() ||
      place.region?.trim() ||
      '';

    if (!streetName && !cityName) return null;

    return { streetName, cityName };
  } catch (error) {
    console.error('Reverse geocode failed:', error);
    return null;
  }
}
