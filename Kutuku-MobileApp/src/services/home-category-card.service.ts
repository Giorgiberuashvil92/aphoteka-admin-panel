import { API_CONFIG } from '../config/api.config';

export type HomeCategoryCardItem = {
  id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  iconKey: string;
  iconUrl: string;
  iconColor: string;
  categoryId: string;
  order: number;
};

type ApiCard = {
  _id?: string;
  id?: string;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  iconKey?: string;
  iconUrl?: string;
  iconColor?: string;
  categoryId?: string | { _id?: string; $oid?: string };
  order?: number;
};

function resolveCategoryId(raw: ApiCard['categoryId']): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  return String(raw._id || raw.$oid || '');
}

function mapCard(raw: ApiCard): HomeCategoryCardItem | null {
  const id = raw._id || raw.id;
  const categoryId = resolveCategoryId(raw.categoryId);
  if (!id || !categoryId) return null;
  return {
    id: String(id),
    title: raw.title?.trim() || 'კატეგორია',
    subtitle: raw.subtitle?.trim() || '',
    backgroundColor: raw.backgroundColor || '#EAF7FF',
    iconKey: raw.iconKey || 'pills',
    iconUrl: raw.iconUrl?.trim() || '',
    iconColor: raw.iconColor || '#24B7B4',
    categoryId,
    order: raw.order ?? 1,
  };
}

/** Fallback თუ API ცარიელია / offline */
export const FALLBACK_HOME_CATEGORY_CARDS: HomeCategoryCardItem[] = [
  {
    id: 'fallback-medications',
    title: 'მედიკამენტები',
    subtitle: 'სრულყოფილი ასორტიმენტი',
    backgroundColor: '#EAF7FF',
    iconKey: 'pills',
    iconUrl: '',
    iconColor: '#24B7B4',
    categoryId: '',
    order: 1,
  },
  {
    id: 'fallback-cosmetics',
    title: 'კოსმეტიკა',
    subtitle: 'ზრუნვა თქვენი სილამაზისთვის',
    backgroundColor: '#FFEAF5',
    iconKey: 'flower-outline',
    iconUrl: '',
    iconColor: '#E24D9A',
    categoryId: '',
    order: 2,
  },
  {
    id: 'fallback-mother-child',
    title: 'დედა და ბავშვი',
    subtitle: 'მოვლა და ზრუნვა პატარებისთვის',
    backgroundColor: '#FFF2D9',
    iconKey: 'heart',
    iconUrl: '',
    iconColor: '#F5A018',
    categoryId: '',
    order: 3,
  },
];

export const HomeCategoryCardService = {
  getVisible: async (): Promise<HomeCategoryCardItem[]> => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.homeCategoryCards.visible}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const mapped = list
        .map(mapCard)
        .filter((c): c is HomeCategoryCardItem => c !== null);
      return mapped.length > 0 ? mapped : FALLBACK_HOME_CATEGORY_CARDS;
    } catch (error) {
      console.error('[HomeCategoryCardService]', error);
      return FALLBACK_HOME_CATEGORY_CARDS;
    }
  },
};
