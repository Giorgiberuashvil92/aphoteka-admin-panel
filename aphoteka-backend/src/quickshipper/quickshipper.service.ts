import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  QuickshipperAuthResponse,
  DeliveryFeeRequest,
  DeliveryFeeResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderResponse,
} from './interfaces/quickshipper.interface';

@Injectable()
export class QuickshipperService {
  private readonly logger = new Logger(QuickshipperService.name);
  private accessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor(private readonly config: ConfigService) {}

  private getAuthBaseUrl(): string {
    return (
      this.config.get<string>('QUICKSHIPPER_AUTH_BASE_URL') ||
      'https://test-auth.quickshipper.ge'
    );
  }

  private getApiBaseUrl(): string {
    return (
      this.config.get<string>('QUICKSHIPPER_API_BASE_URL') ||
      'https://delivery.quickshipper.app'
    );
  }

  private getUsername(): string {
    const username = this.config.get<string>('QUICKSHIPPER_USERNAME');
    if (!username) {
      throw new Error('QUICKSHIPPER_USERNAME is not configured');
    }
    return username;
  }

  private getPassword(): string {
    const password = this.config.get<string>('QUICKSHIPPER_PASSWORD');
    if (!password) {
      throw new Error('QUICKSHIPPER_PASSWORD is not configured');
    }
    return password;
  }

  /**
   * Get OAuth access token (with caching)
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiryTime) {
      return this.accessToken;
    }

    try {
      const url = `${this.getAuthBaseUrl()}/connect/token`;

      // Basic Auth: DeliveryApiClient:DeliveryApiSecret
      const basicAuth = Buffer.from(
        'DeliveryApiClient:DeliveryApiSecret',
      ).toString('base64');

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('scope', 'DeliveryApi');
      params.append('username', this.getUsername());
      params.append('password', this.getPassword());

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Quickshipper auth failed: ${response.status} - ${error}`,
        );
        throw new Error(
          `Quickshipper authentication failed: ${response.status}`,
        );
      }

      const data: QuickshipperAuthResponse = await response.json();

      // Cache token (subtract 60 seconds for safety margin)
      this.accessToken = data.access_token;
      this.tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;

      this.logger.log('Quickshipper access token obtained successfully');

      return this.accessToken;
    } catch (error) {
      this.logger.error('Error getting Quickshipper access token:', error);
      throw error;
    }
  }

  /**
   * Calculate delivery fees
   */
  async calculateDeliveryFee(
    request: DeliveryFeeRequest,
  ): Promise<DeliveryFeeResponse> {
    try {
      const token = await this.getAccessToken();

      // Build query parameters
      const params = new URLSearchParams({
        FromStreetName: request.fromStreetName,
        FromCityName: request.fromCityName,
        FromLatitude: request.fromLatitude.toString(),
        FromLongitude: request.fromLongitude.toString(),
        ToStreetName: request.toStreetName,
        ToCityName: request.toCityName,
        ToLatitude: request.toLatitude.toString(),
        ToLongitude: request.toLongitude.toString(),
      });

      const url = `${this.getApiBaseUrl()}/v1/order/fees?${params.toString()}`;

      this.logger.log(`Calculating delivery fees: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Quickshipper fees calculation failed: ${response.status} - ${error}`,
        );
        throw new Error(`Failed to calculate delivery fee: ${response.status}`);
      }

      const data: DeliveryFeeResponse = await response.json();

      this.logger.log(
        `Delivery fees calculated: ${data.fees?.length || 0} providers, distance: ${data.distance}km`,
      );

      return data;
    } catch (error) {
      this.logger.error('Error calculating delivery fee:', error);
      throw error;
    }
  }

  /**
   * Create delivery order in Quickshipper
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const token = await this.getAccessToken();
      const url = `${this.getApiBaseUrl()}/v1/order`;

      this.logger.log(`Creating Quickshipper order: ${url}`);
      this.logger.log(`Request body: ${JSON.stringify(request, null, 2)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const responseText = await response.text();
      this.logger.log(`Response status: ${response.status}`);
      this.logger.log(`Response body: ${responseText || '(empty)'}`);

      if (!response.ok) {
        this.logger.error(
          `Quickshipper order creation failed: ${response.status} - ${responseText}`,
        );
        throw new Error(
          `Failed to create delivery order: ${response.status} - ${responseText}`,
        );
      }

      // HTTP 204 No Content means success without response body
      if (response.status === 204) {
        this.logger.log(
          'Quickshipper order created successfully (204 No Content)',
        );
        return {
          success: true,
          userMessage: 'Order sent to Quickshipper successfully',
          httpStatusCode: 204,
        };
      }

      if (!responseText || responseText.trim() === '') {
        this.logger.warn('Empty response body but request succeeded');
        return {
          success: true,
          userMessage:
            'Order sent to Quickshipper successfully (empty response)',
          httpStatusCode: response.status,
        };
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(
          `Failed to parse Quickshipper response: ${responseText}`,
        );
        throw new Error(
          `Invalid JSON response from Quickshipper: ${parseError.message}`,
        );
      }

      this.logger.log(
        `Quickshipper order created: ${data.orderId || 'N/A'} / ${data.trackingNumber || 'N/A'}`,
      );
      return data;
    } catch (error) {
      this.logger.error('Error creating Quickshipper order:', error);
      throw error;
    }
  }

  /**
   * Cancel/delete delivery order in Quickshipper (DELETE v1/order).
   * Works when no courier is assigned or provider allows integration cancel.
   */
  async cancelOrder(quickshipperOrderId: string): Promise<CancelOrderResponse> {
    const id = quickshipperOrderId?.trim();
    if (!id) {
      throw new Error('Quickshipper orderId is required for cancel');
    }

    try {
      const token = await this.getAccessToken();
      const url = `${this.getApiBaseUrl()}/v1/order?orderId=${encodeURIComponent(id)}`;

      this.logger.log(`Cancelling Quickshipper order: ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      this.logger.log(
        `Quickshipper cancel status: ${response.status} body: ${responseText || '(empty)'}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to cancel Quickshipper order: ${response.status} - ${responseText}`,
        );
      }

      if (response.status === 204 || !responseText.trim()) {
        return {
          success: true,
          httpStatusCode: response.status,
          userMessage: 'Quickshipper order cancelled',
        };
      }

      try {
        return JSON.parse(responseText) as CancelOrderResponse;
      } catch {
        return {
          success: true,
          httpStatusCode: response.status,
          userMessage: responseText,
        };
      }
    } catch (error) {
      this.logger.error('Error cancelling Quickshipper order:', error);
      throw error;
    }
  }

  /**
   * Get order status/tracking
   */
  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const url = `${this.getApiBaseUrl()}/v1/order?orderId=${encodeURIComponent(orderId)}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(
          `Quickshipper order status failed: ${response.status} - ${error}`,
        );
        throw new Error(`Failed to get order status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Error getting order status:', error);
      throw error;
    }
  }
}
