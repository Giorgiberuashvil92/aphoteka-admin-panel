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

/** ერთი სტრიქონი Nest `shippingAddress`-ისთვის (ადმინ პანელზე წასაკითხი) */
export function formatShippingAddressLine(a: DeliveryAddress): string {
  const parts: string[] = [];
  const streetLine = [a.street.trim(), a.building?.trim(), a.floor?.trim()]
    .filter(Boolean)
    .join(', ');
  parts.push(`[${a.label.trim()}] ${streetLine}`);
  parts.push(a.city.trim());
  const phone = normalizePhone(a.phone);
  if (phone) parts.push(`ტელ: ${phone}`);
  if (a.note?.trim()) parts.push(`შენიშვნა: ${a.note.trim()}`);
  return parts.join(' | ');
}

export function isDeliveryAddressComplete(a: DeliveryAddress | null): a is DeliveryAddress {
  if (!a) return false;
  const phone = normalizePhone(a.phone);
  return (
    a.label.trim().length > 0 &&
    a.street.trim().length >= 3 &&
    a.city.trim().length >= 2 &&
    phone.replace(/\D/g, '').length >= 9
  );
}

class DeliveryAddressServiceClass {
  async get(): Promise<DeliveryAddress | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<DeliveryAddress>;
      if (!parsed || typeof parsed !== 'object') return null;
      return {
        label: String(parsed.label ?? 'სახლი'),
        street: String(parsed.street ?? ''),
        city: String(parsed.city ?? ''),
        building: parsed.building ? String(parsed.building) : undefined,
        floor: parsed.floor ? String(parsed.floor) : undefined,
        note: parsed.note ? String(parsed.note) : undefined,
        phone: String(parsed.phone ?? ''),
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
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const DeliveryAddressService = new DeliveryAddressServiceClass();
