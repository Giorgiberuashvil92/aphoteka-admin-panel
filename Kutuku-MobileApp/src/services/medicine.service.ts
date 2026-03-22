// Medicine Service - Mock Implementation
import { Medicine, PaginatedResponse } from '@/src/types/medicine.types';

// Mock Medicine Data
const mockMedicines: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol',
    nameGeo: 'პარაცეტამოლი',
    brand: 'Panadol',
    price: 4.50,
    thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'],
    description: 'Pain reliever and fever reducer',
    descriptionGeo: 'ტკივილგამაყუჩებელი და ცხელების დამწევი',
    category: 'Pain Relief',
    dosageForm: 'Tablet',
    prescriptionRequired: false,
    manufacturer: 'GSK',
    stockQuantity: 150,
    lowStockThreshold: 20,
    inStock: true,
    rating: 4.5,
    reviewCount: 320,
  },
  {
    id: '2',
    name: 'Ibuprofen',
    nameGeo: 'იბუპროფენი',
    brand: 'Nurofen',
    price: 6.50,
    thumbnail: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400',
    images: ['https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400'],
    description: 'Anti-inflammatory pain reliever',
    descriptionGeo: 'ანთების საწინააღმდეგო ტკივილგამაყუჩებელი',
    category: 'Pain Relief',
    dosageForm: 'Tablet',
    prescriptionRequired: false,
    manufacturer: 'Reckitt Benckiser',
    stockQuantity: 200,
    lowStockThreshold: 30,
    inStock: true,
    rating: 4.7,
    reviewCount: 450,
  },
  {
    id: '3',
    name: 'Vitamin C',
    nameGeo: 'ვიტამინი C',
    brand: 'Supradyn',
    price: 12.99,
    discountPrice: 9.99,
    discountPercentage: 23,
    thumbnail: 'https://images.unsplash.com/photo-1550572017-4a6e8e0b4794?w=400',
    images: ['https://images.unsplash.com/photo-1550572017-4a6e8e0b4794?w=400'],
    description: 'Vitamin C supplement for immune support',
    descriptionGeo: 'ვიტამინი C იმუნიტეტის გასაძლიერებლად',
    category: 'Vitamins',
    dosageForm: 'Tablet',
    prescriptionRequired: false,
    manufacturer: 'Bayer',
    stockQuantity: 80,
    lowStockThreshold: 15,
    inStock: true,
    rating: 4.8,
    reviewCount: 890,
  },
  {
    id: '4',
    name: 'Coldrex',
    nameGeo: 'კოლდრექსი',
    brand: 'Coldrex',
    price: 8.99,
    thumbnail: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
    images: ['https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400'],
    description: 'Cold and flu relief',
    descriptionGeo: 'გაციებისა და გრიპის საწინააღმდეგო',
    category: 'Cold & Flu',
    dosageForm: 'Powder',
    prescriptionRequired: false,
    manufacturer: 'GSK',
    stockQuantity: 120,
    lowStockThreshold: 25,
    inStock: true,
    rating: 4.6,
    reviewCount: 560,
  },
  {
    id: '5',
    name: 'Omeprazole',
    nameGeo: 'ომეპრაზოლი',
    brand: 'Losec',
    price: 15.50,
    thumbnail: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400',
    images: ['https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400'],
    description: 'Stomach acid reducer',
    descriptionGeo: 'კუჭის მჟავიანობის შემამცირებელი',
    category: 'Digestive Health',
    dosageForm: 'Capsule',
    prescriptionRequired: true,
    manufacturer: 'AstraZeneca',
    stockQuantity: 15,
    lowStockThreshold: 20,
    inStock: true,
    rating: 4.9,
    reviewCount: 1200,
  },
];

class MedicineServiceClass {
  // Simulate network delay
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get popular medicines
  async getPopularMedicines(limit: number = 10): Promise<Medicine[]> {
    await this.delay();
    return mockMedicines.slice(0, limit);
  }

  // Get all medicines with pagination
  async getMedicines(params?: { limit?: number; page?: number; category?: string; inStock?: boolean }): Promise<PaginatedResponse<Medicine>> {
    await this.delay();
    
    let filtered = [...mockMedicines];
    
    if (params?.category) {
      filtered = filtered.filter(m => m.category === params.category);
    }
    
    if (params?.inStock !== undefined) {
      filtered = filtered.filter(m => m.inStock === params.inStock);
    }
    
    const limit = params?.limit || 10;
    const page = params?.page || 1;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      data: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit,
    };
  }

  // Get medicine by ID
  async getMedicineById(id: string): Promise<Medicine> {
    await this.delay();
    const medicine = mockMedicines.find(m => m.id === id);
    if (!medicine) {
      throw new Error('Medicine not found');
    }
    return medicine;
  }

  // Search medicines
  async searchMedicines(query: string): Promise<Medicine[]> {
    await this.delay();
    const lowerQuery = query.toLowerCase();
    return mockMedicines.filter(m => 
      m.name.toLowerCase().includes(lowerQuery) ||
      m.nameGeo.includes(query) ||
      m.brand.toLowerCase().includes(lowerQuery) ||
      m.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get categories
  async getCategories(): Promise<string[]> {
    await this.delay();
    const categories = [...new Set(mockMedicines.map(m => m.category))];
    return categories;
  }
}

export const MedicineService = new MedicineServiceClass();
