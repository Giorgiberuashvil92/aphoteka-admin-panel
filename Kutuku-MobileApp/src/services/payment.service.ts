import {
  BUILTIN_PAYMENT_METHODS,
  type PaymentMethodIconName,
} from '@/src/config/paymentMethods.config';
import type { CardData } from '@/src/screens/AddCardScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CARDS_STORAGE_KEY = '@kutuku_payment_cards_v1';

export type PaymentMethodRow = {
  id: string;
  name: string;
  number: string;
  icon: PaymentMethodIconName;
  kind: 'builtin' | 'card';
};

function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return cardNumber;
  const lastFour = cleaned.slice(-4);
  const masked = cleaned.slice(0, -4).replace(/\d/g, '*');
  const joined = masked + lastFour;
  return joined.match(/.{1,4}/g)?.join(' ') ?? joined;
}

async function loadCardsRaw(): Promise<CardData[]> {
  try {
    const raw = await AsyncStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CardData[]) : [];
  } catch {
    return [];
  }
}

async function saveCardsRaw(cards: CardData[]): Promise<void> {
  await AsyncStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
}

function cardTypeLabel(type: CardData['type']): string {
  if (type === 'visa') return 'Visa';
  if (type === 'paypal') return 'PayPal';
  return 'Mastercard';
}

class PaymentServiceClass {
  /** სრული სია: ჩასმული მეთოდები (კონფიგი) + მომხმარებლის ბარათები */
  async getPaymentRows(): Promise<PaymentMethodRow[]> {
    const builtin: PaymentMethodRow[] = BUILTIN_PAYMENT_METHODS.filter(
      (b) => b.enabled !== false,
    ).map((b) => ({
      id: b.id,
      name: b.name,
      number: b.subtitle,
      icon: b.icon,
      kind: 'builtin',
    }));

    const cards = await loadCardsRaw();
    const fromCards: PaymentMethodRow[] = cards.map((card) => ({
      id: `card:${card.id}`,
      name: cardTypeLabel(card.type),
      number: card.cardNumber,
      icon: 'card-outline',
      kind: 'card',
    }));

    return [...builtin, ...fromCards];
  }

  async getCards(): Promise<CardData[]> {
    return loadCardsRaw();
  }

  async addCard(card: CardData): Promise<void> {
    const cards = await loadCardsRaw();
    const masked: CardData = {
      ...card,
      cardNumber: maskCardNumber(card.cardNumber),
      cvv: '***',
    };
    cards.push(masked);
    await saveCardsRaw(cards);
  }

  async removeCard(cardId: string): Promise<void> {
    const cards = await loadCardsRaw();
    await saveCardsRaw(cards.filter((c) => c.id !== cardId));
  }

  /** row.id = card:xxx */
  async removeCardByRowId(rowId: string): Promise<void> {
    if (!rowId.startsWith('card:')) return;
    const id = rowId.slice('card:'.length);
    await this.removeCard(id);
  }
}

export const PaymentService = new PaymentServiceClass();
