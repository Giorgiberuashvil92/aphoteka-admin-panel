import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kutuku_delivery_address_v1';

export type DeliveryAddress = {
  /** მაგ. სახლი / სამსახური / სხვა */
  label: string;
  /** ქუჩა, სახლის ნომერი */
  street: string;
  /** ქალაქი / რაიონი */
  city: string;
  /** სადაბე, კორპუსი (ოფციონალური) */
  building?: string;
  /** სართული, ბინა (ოფციონალური) */
  floor?: string;
  /** კომენტარი კურიერისთვის */
  note?: string;
  /** მიტანის ტელეფონი (+995 / 5XX…) */
  phone: string;
  /** რუკაზე არჩეული წერტილი (WGS84) */
  latitude?: number;
  longitude?: number;
};

export const DELIVERY_LABEL_PRESETS = [
  { id: 'home', title: 'სახლი' },
  { id: 'work', title: 'სამსახური' },
  { id: 'other', title: 'სხვა' },
] as const;

export const GEORGIA_CITY_SUGGESTIONS = [
  'თბილისი',
  'ბათუმი',
  'ქუთაისი',
  'რუსთავი',
  'ზუგდიდი',
  'გორი',
  'ფოთი',
  'ხაშური',
] as const;

function normalizePhone(raw: string): string {
  return raw.replace(/\s/g, '').trim();
}

/** სწორი WGS84 წერტილი რუკიდან */
export function hasValidDeliveryGps(a: DeliveryAddress | null | undefined): boolean {
  if (!a) return false;
  return (
    typeof a.latitude === 'number' &&
    Number.isFinite(a.latitude) &&
    typeof a.longitude === 'number' &&
    Number.isFinite(a.longitude)
  );
}

/** ერთი სტრიქონი Nest `shippingAddress`-ისთვის (ადმინ პანელზე წასაკითხი) */
export function formatShippingAddressLine(a: DeliveryAddress): string {
  const parts: string[] = [];
  const hasGps = hasValidDeliveryGps(a);
  let streetLine = [a.street.trim(), a.building?.trim(), a.floor?.trim()]
    .filter(Boolean)
    .join(', ');
  if (!streetLine && hasGps) {
    streetLine = 'რუკის წერტილი';
  }
  parts.push(`[${a.label.trim()}] ${streetLine || '—'}`);
  parts.push(a.city.trim());
  const phone = normalizePhone(a.phone);
  if (phone) parts.push(`ტელ: ${phone}`);
  if (a.note?.trim()) parts.push(`შენიშვნა: ${a.note.trim()}`);
  if (hasGps) {
    parts.push(
      `GPS: ${Number(a.latitude).toFixed(6)}, ${Number(a.longitude).toFixed(6)}`,
    );
  }
  return parts.join(' | ');
}

class DeliveryAddressServiceClass {
  async get(): Promise<DeliveryAddress | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<DeliveryAddress>;
      if (!parsed || typeof parsed !== 'object') return null;
      const lat = parsed.latitude;
      const lng = parsed.longitude;
      return {
        label: String(parsed.label ?? 'სახლი'),
        street: String(parsed.street ?? ''),
        city: String(parsed.city ?? ''),
        building: parsed.building ? String(parsed.building) : undefined,
        floor: parsed.floor ? String(parsed.floor) : undefined,
        note: parsed.note ? String(parsed.note) : undefined,
        phone: String(parsed.phone ?? ''),
        latitude: typeof lat === 'number' && Number.isFinite(lat) ? lat : undefined,
        longitude: typeof lng === 'number' && Number.isFinite(lng) ? lng : undefined,
      };
    } catch {
      return null;
    }
  }

  async save(address: DeliveryAddress): Promise<void> {
    const payload: DeliveryAddress = {
      label: address.label.trim(),
      street: address.street.trim(),
      city: address.city.trim(),
      building: address.building?.trim() || undefined,
      floor: address.floor?.trim() || undefined,
      note: address.note?.trim() || undefined,
      phone: normalizePhone(address.phone),
      latitude:
        typeof address.latitude === 'number' && Number.isFinite(address.latitude)
          ? address.latitude
          : undefined,
      longitude:
        typeof address.longitude === 'number' && Number.isFinite(address.longitude)
          ? address.longitude
          : undefined,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const DeliveryAddressService = new DeliveryAddressServiceClass();
