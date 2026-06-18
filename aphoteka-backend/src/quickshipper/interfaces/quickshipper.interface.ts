export interface QuickshipperAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface DeliveryFeeRequest {
  fromStreetName: string;
  fromCityName: string;
  fromLatitude: number;
  fromLongitude: number;
  toStreetName: string;
  toCityName: string;
  toLatitude: number;
  toLongitude: number;
}

export interface DeliveryPrice {
  amount: number;
  currency: string;
  deliverySpeedName: string;
  deliverySpeedDescription: string;
  deliveryTime: string;
  timeEstimateMinutes: number | null;
  validUntil: string;
  id: string;
  markup: string;
}

export interface DeliveryProvider {
  providerName: string;
  providerLogoUrl: string;
  providerId: number;
  providerNote: string;
  isActive: boolean;
  prices: DeliveryPrice[];
  orderBy: string;
  hasScheduledDelivery: string;
  minPrice: number;
  hasWeight: boolean;
  hasCarDelivery: boolean;
  minWeightForCarDelivery: number | null;
}

export interface DeliveryFeeResponse {
  httpStatusCode: number;
  userMessage: string;
  developerMessage: string;
  success: boolean;
  errors: string[];
  fees: DeliveryProvider[];
  distance: number;
  serviceFee: number;
  serviceFeeCurrency: string;
}

export interface CreateOrderRequest {
  carDelivery: boolean;
  comment?: string;
  parcelDimensionId: string;
  scheduledTime?: string;
  dropOffInfo: {
    address: string;
    longitude: number | null;
    latitude: number | null;
    addressComment?: string;
    name: string;
    phonePrefix: string;
    phone: string;
    city: string;
    country: string;
  };
  pickUpInfo: {
    address: string;
    longitude: number | null;
    latitude: number | null;
    addressComment?: string;
    name: string;
    phonePrefix: string;
    phone: string;
    city: string;
    country: string;
  };
  provider: {
    providerId: number | null;
    providerFeeId: string;
  };
  parcels: Array<{
    fields: Array<{
      id: string;
      value: string;
      type: string;
    }>;
  }>;
  generalFields: Array<{
    id: number | null;
    value: string;
    type: string;
  }>;
}

export interface CreateOrderResponse {
  httpStatusCode: number;
  userMessage?: string;
  developerMessage?: string;
  success?: boolean;
  errors?: string[];
  trackingNumber?: string;
  orderId?: string;
}
