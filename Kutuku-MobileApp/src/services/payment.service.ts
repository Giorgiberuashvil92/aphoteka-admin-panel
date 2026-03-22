import { CardData } from '@/src/screens/AddCardScreen';

class PaymentServiceClass {
  private cards: CardData[] = [
    {
      id: '1',
      type: 'mastercard',
      holderName: 'John Doe',
      cardNumber: '4827 8472 7424 ****',
      expiry: '12/25',
      cvv: '***',
    },
    {
      id: '2',
      type: 'visa',
      holderName: 'Jane Smith',
      cardNumber: '4532 **** **** 5678',
      expiry: '08/26',
      cvv: '***',
    },
  ];

  // Get all cards
  getCards(): CardData[] {
    return this.cards;
  }

  // Add new card
  addCard(card: CardData): void {
    // Mask card number (show last 4 digits)
    const maskedNumber = this.maskCardNumber(card.cardNumber);
    
    this.cards.push({
      ...card,
      cardNumber: maskedNumber,
      cvv: '***', // Never store real CVV
    });

    console.log('Card added:', card.holderName);
    console.log('Total cards:', this.cards.length);
  }

  // Remove card
  removeCard(id: string): void {
    this.cards = this.cards.filter((card) => card.id !== id);
  }

  // Mask card number
  private maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const lastFour = cleaned.slice(-4);
    const masked = cleaned.slice(0, -4).replace(/\d/g, '*');
    return this.formatCardNumber(masked + lastFour);
  }

  // Format card number with spaces
  private formatCardNumber(cardNumber: string): string {
    return cardNumber.match(/.{1,4}/g)?.join(' ') || cardNumber;
  }

  // Get card by id
  getCardById(id: string): CardData | undefined {
    return this.cards.find((card) => card.id === id);
  }
}

export const PaymentService = new PaymentServiceClass();
