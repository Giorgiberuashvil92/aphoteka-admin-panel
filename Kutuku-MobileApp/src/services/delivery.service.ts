import { API_CONFIG } from '../config/api.config';

export interface DeliveryAddress {
  streetName: string;
  cityName: string;
  latitude: number;
  longitude: number;
}

export interface DeliveryPrice {
  amount: number;
  oldAmount: number | null;
  currency: string;
  currencyName: string;
  deliverySpeedId: number | null;
  deliverySpeedName: string;
  deliverySpeedDescription: string | null;
  deliveryTime: string | null;
  id: string;
  hasCarDelivery: boolean;
}

export interface DeliveryProvider {
  providerName: string;
  providerCode: string;
  providerLogoUrl: string;
  providerId: number;
  providerNote: string;
  isActive: boolean;
  prices: DeliveryPrice[];
  serviceFee: number;
  serviceFeeCurrency: string;
  hasCashOnDelivery: boolean;
  hasCarDelivery: boolean;
  hasScheduledDelivery: boolean;
  minPrice: number;
  hasWeight: boolean;
}

export interface DeliveryFeesResponse {
  fees: DeliveryProvider[];
  distance: number;
  httpStatusCode: number;
  userMessage: string;
  developerMessage: string;
  success: boolean;
  errors: string[];
}

export interface SelectedDelivery {
  provider: DeliveryProvider;
  selectedPrice: DeliveryPrice;
  fromAddress: DeliveryAddress;
  toAddress: DeliveryAddress;
  distance: number;
}

class DeliveryService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Calculate delivery fees from pharmacy to user address
   */
  async calculateDeliveryFees(
    fromAddress: DeliveryAddress,
    toAddress: DeliveryAddress,
  ): Promise<DeliveryFeesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/quickshipper/fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delivery fees API error:', response.status, errorText);
        throw new Error(`Failed to calculate delivery fees: ${response.status}`);
      }

      const data: DeliveryFeesResponse = await response.json();
      
      // Filter only active providers with prices
      data.fees = data.fees.filter(
        (provider) => provider.isActive && provider.prices.length > 0,
      );

      console.log('Delivery fees calculated:', {
        providers: data.fees.length,
        distance: data.distance,
      });

      return data;
    } catch (error) {
      console.error('Error calculating delivery fees:', error);
      throw error;
    }
  }

  /**
   * Get pharmacy default address (from where orders are dispatched)
   * TODO: This should come from backend/config in the future
   */
  getPharmacyAddress(): DeliveryAddress {
    return {
      streetName: 'კოსტავას 17, თბილისი',
      cityName: 'თბილისი',
      latitude: 41.7332044,
      longitude: 44.7413653,
    };
  }
}

export const deliveryService = new DeliveryService();
