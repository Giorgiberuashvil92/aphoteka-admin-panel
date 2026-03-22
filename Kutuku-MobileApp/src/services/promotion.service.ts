import { API_CONFIG } from '@/src/config/api.config';
import { ImageSourcePropType } from 'react-native';

export interface PromotionProduct {
  id: string;
  name: string;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  image: string | null;
}

export interface PromotionFromApi {
  id: string;
  name: string;
  description?: string;
  backgroundColor: string;
  logoUrl?: string | null;
  products: PromotionProduct[];
}

const USE_API = true;

export class PromotionServiceClass {
  /** აქტიური აქციები მობილურისთვის (ბაზიდან / ადმინ პანელიდან) */
  async getActivePromotions(): Promise<PromotionFromApi[]> {
    if (!USE_API) return [];
    try {
      const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.promotions.active);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching promotions:', e);
      return [];
    }
  }
}

export const PromotionService = new PromotionServiceClass();

/** BrandsSlider-ის ფორმატში გადასაყვანი ტიპი (logo = ImageSourcePropType) */
export function mapPromotionToBrandSlide(p: PromotionFromApi): {
  id: string;
  backgroundColor: string;
  description?: string;
  name?: string;
  logo?: ImageSourcePropType;
  products: Array<{
    id: string;
    name: string;
    currentPrice: number;
    originalPrice: number;
    discount: number;
    image: string;
  }>;
} {
  return {
    id: p.id,
    backgroundColor: '#F5F5FF', // სტანდარტული; ადმინის ფერი არ გამოიყენება
    description: p.description,
    name: p.name,
    logo: p.logoUrl ? { uri: p.logoUrl } : undefined,
    products: p.products.map((prod) => ({
      id: prod.id,
      name: prod.name,
      currentPrice: prod.currentPrice,
      originalPrice: prod.originalPrice,
      discount: prod.discount,
      image: prod.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    })),
  };
}
