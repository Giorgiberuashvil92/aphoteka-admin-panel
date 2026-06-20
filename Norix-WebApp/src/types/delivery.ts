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
