import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { DeliveryRedispatchApplyDto } from './dto/delivery-redispatch.dto';
import { UpdateDeliveryAddressDto } from './dto/update-delivery-address.dto';
import { BogBalanceSaleService } from '../bog/bog-balance-sale.service';
import { BogPaymentsService } from '../bog/bog-payments.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { QuickshipperService } from '../quickshipper/quickshipper.service';

const WAREHOUSE_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

type PickupAddress = {
  streetName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  warehouseName?: string;
  phone?: string;
};

const DEFAULT_PICKUP: PickupAddress = {
  streetName: 'კოსტავას 71',
  cityName: 'თბილისი',
  latitude: 41.7151,
  longitude: 44.7664,
  warehouseName: 'Aphoteka (default)',
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private readonly bogBalanceSale: BogBalanceSaleService,
    private readonly bogPayments: BogPaymentsService,
    private readonly warehousesService: WarehousesService,
    private readonly quickshipperService: QuickshipperService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const items = dto.items.map((item) => ({
      productId: new Types.ObjectId(item.productId),
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      imageUrl: item.imageUrl,
      packSize: item.packSize,
      balanceSeriesUuid: item.balanceSeriesUuid?.trim() || undefined,
    }));
    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

    let warehouseId: Types.ObjectId | undefined;

    if (dto.warehouseId && Types.ObjectId.isValid(dto.warehouseId)) {
      warehouseId = new Types.ObjectId(dto.warehouseId);
    } else if (
      dto.deliveryAddress?.latitude &&
      dto.deliveryAddress?.longitude
    ) {
      // Auto-assign based on closest warehouse
      try {
        const closestWarehouse = await this.findClosestWarehouse(
          dto.deliveryAddress.latitude,
          dto.deliveryAddress.longitude,
        );
        if (closestWarehouse) {
          warehouseId = new Types.ObjectId(closestWarehouse.id);
          this.logger.log(
            `Auto-assigned order to closest warehouse: ${closestWarehouse.name} (${closestWarehouse.distance?.toFixed(2)}km away)`,
          );
        }
      } catch (error) {
        this.logger.error('Error finding closest warehouse:', error);
        // Continue without warehouse assignment
      }
    }

    let dispatchWarehouseId: Types.ObjectId | undefined;
    let pickupAddress: PickupAddress | undefined;
    if (warehouseId) {
      dispatchWarehouseId = warehouseId;
      try {
        const whRes = await this.warehousesService.findOne(
          warehouseId.toString(),
        );
        pickupAddress = this.warehouseRecordToPickup(whRes.data);
      } catch {
        pickupAddress = { ...DEFAULT_PICKUP };
      }
    }

    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      phoneNumber: dto.phoneNumber,
      comment: dto.comment,
      warehouseId,
      dispatchWarehouseId,
      pickupAddress,
      deliveryProvider: dto.deliveryProvider,
      deliveryAddress: dto.deliveryAddress,
      deliveryPrice: dto.deliveryPrice,
      deliveryServiceFee: dto.deliveryServiceFee,
      deliverySpeed: dto.deliverySpeed,
    });
    return order;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find the closest active warehouse to a delivery location
   */
  private async findClosestWarehouse(
    deliveryLat: number,
    deliveryLon: number,
  ): Promise<{ id: string; name: string; distance: number } | null> {
    // Get all active warehouses with coordinates
    const { data: warehouses } = await this.warehousesService.findAll({
      active: true,
    });

    const warehousesWithCoordinates = warehouses.filter(
      (w: any) => w.latitude != null && w.longitude != null,
    );

    if (warehousesWithCoordinates.length === 0) {
      this.logger.warn('No warehouses with coordinates found');
      return null;
    }

    const warehousesWithDistances = warehousesWithCoordinates.map((w: any) => ({
      id: w.id,
      name: w.name,
      distance: this.calculateDistance(
        deliveryLat,
        deliveryLon,
        w.latitude,
        w.longitude,
      ),
    }));

    // Sort by distance and return closest
    warehousesWithDistances.sort((a, b) => a.distance - b.distance);

    return warehousesWithDistances[0] || null;
  }

  private warehouseRecordToPickup(warehouse: {
    name?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    phoneNumber?: string;
  }): PickupAddress {
    const lat = warehouse.latitude;
    const lon = warehouse.longitude;
    if (lat == null || lon == null) {
      this.logger.warn(
        `Warehouse "${warehouse.name}" has no coordinates — using default pickup`,
      );
      return {
        ...DEFAULT_PICKUP,
        warehouseName: warehouse.name || DEFAULT_PICKUP.warehouseName,
        phone: warehouse.phoneNumber,
      };
    }
    return {
      streetName: (warehouse.address || '').trim() || DEFAULT_PICKUP.streetName,
      cityName: (warehouse.city || '').trim() || DEFAULT_PICKUP.cityName,
      latitude: lat,
      longitude: lon,
      warehouseName: warehouse.name,
      phone: warehouse.phoneNumber,
    };
  }

  private async loadWarehousePickup(
    warehouseId: string,
  ): Promise<{ warehouseId: string; pickup: PickupAddress; name: string }> {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new BadRequestException('warehouseId არასწორია');
    }
    const whRes = await this.warehousesService.findOne(warehouseId);
    const wh = whRes.data as {
      id?: string;
      name?: string;
      address?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      phoneNumber?: string;
      active?: boolean;
    };
    if (wh.active === false) {
      throw new BadRequestException('საწყობი არააქტიურია');
    }
    return {
      warehouseId,
      name: wh.name || 'საწყობი',
      pickup: this.warehouseRecordToPickup(wh),
    };
  }

  private async resolvePickupForOrder(order: {
    pickupAddress?: PickupAddress;
    dispatchWarehouseId?: Types.ObjectId;
    warehouseId?: Types.ObjectId;
    deliveryRedispatch?: {
      status?: string;
      newPickupAddress?: PickupAddress;
    };
  }): Promise<PickupAddress> {
    if (
      order.deliveryRedispatch?.status === 'paid' &&
      order.deliveryRedispatch.newPickupAddress
    ) {
      return order.deliveryRedispatch.newPickupAddress;
    }
    if (order.pickupAddress?.latitude != null) {
      return order.pickupAddress;
    }
    const whId =
      order.dispatchWarehouseId?.toString() || order.warehouseId?.toString();
    if (whId) {
      const loaded = await this.loadWarehousePickup(whId);
      return loaded.pickup;
    }
    return { ...DEFAULT_PICKUP };
  }

  private pickProviderPrice(
    fees: Array<Record<string, unknown>>,
    preferredProviderId?: number,
    preferredSpeed?: string,
    providerPriceId?: string,
  ): {
    providerId: number;
    providerName: string;
    providerLogoUrl?: string;
    priceAmount: number;
    serviceFee: number;
    deliverySpeedName: string;
    priceId: string;
  } | null {
    if (!fees.length) return null;

    let provider: Record<string, unknown> | undefined;
    if (preferredProviderId != null) {
      provider = fees.find((f) => Number(f.providerId) === preferredProviderId);
    }
    if (!provider) {
      provider = fees.find((f) => f.isActive !== false) ?? fees[0];
    }

    const prices = (provider.prices as Array<Record<string, unknown>>) || [];
    if (!prices.length) return null;

    let price = prices[0];
    if (providerPriceId) {
      const byId = prices.find((p) => String(p.id) === providerPriceId);
      if (byId) price = byId;
    } else if (preferredSpeed) {
      const bySpeed = prices.find(
        (p) =>
          String(p.deliverySpeedName || '').trim() === preferredSpeed.trim(),
      );
      if (bySpeed) price = bySpeed;
    }

    const serviceFee = Number(provider.serviceFee ?? 0) || 0;

    return {
      providerId: Number(provider.providerId),
      providerName: String(provider.providerName || 'Provider'),
      providerLogoUrl:
        typeof provider.providerLogoUrl === 'string'
          ? provider.providerLogoUrl
          : undefined,
      priceAmount: Number(price.amount) || 0,
      serviceFee,
      deliverySpeedName: String(price.deliverySpeedName || ''),
      priceId: String(price.id || ''),
    };
  }

  async previewDeliveryRedispatch(orderId: string, warehouseId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (!order.deliveryAddress) {
      throw new BadRequestException('შეკვეთას არ აქვს მიტანის მისამართი');
    }

    const { pickup, name: warehouseName } =
      await this.loadWarehousePickup(warehouseId);

    const feesResponse = await this.quickshipperService.calculateDeliveryFee({
      fromStreetName: pickup.streetName,
      fromCityName: pickup.cityName,
      fromLatitude: pickup.latitude,
      fromLongitude: pickup.longitude,
      toStreetName: order.deliveryAddress.streetName,
      toCityName: order.deliveryAddress.cityName,
      toLatitude: order.deliveryAddress.latitude,
      toLongitude: order.deliveryAddress.longitude,
    });

    const rawFees = (feesResponse.fees || []) as unknown as Array<
      Record<string, unknown>
    >;
    const picked = this.pickProviderPrice(
      rawFees,
      order.deliveryProvider?.providerId,
      order.deliverySpeed,
    );
    if (!picked) {
      throw new BadRequestException(
        'Quickshipper-მა ფასები ვერ დააბრუნა ამ საწყობიდან',
      );
    }

    const previousTotal =
      (order.deliveryPrice ?? 0) + (order.deliveryServiceFee ?? 0);
    const newTotal = picked.priceAmount + picked.serviceFee;

    const currentPickup = await this.resolvePickupForOrder(order);

    return {
      ok: true,
      warehouseId,
      warehouseName,
      pickupAddress: pickup,
      currentPickupAddress: currentPickup,
      distanceKm: feesResponse.distance,
      previousDeliveryTotal: previousTotal,
      newDeliveryPrice: picked.priceAmount,
      newDeliveryServiceFee: picked.serviceFee,
      amountDue: newTotal,
      newDeliveryProvider: {
        providerId: picked.providerId,
        providerName: picked.providerName,
        providerLogoUrl: picked.providerLogoUrl,
      },
      newDeliverySpeed: picked.deliverySpeedName,
      providerPriceId: picked.priceId,
      note: 'მომხმარებელი ძველ მიტანის თანხას არ იღებს უკან — გადასახდელია ახალი მიტანის სრული ფასი.',
    };
  }

  async applyDeliveryRedispatch(
    orderId: string,
    dto: DeliveryRedispatchApplyDto,
  ) {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const preview = await this.previewDeliveryRedispatch(
      orderId,
      dto.warehouseId,
    );

    if (preview.providerPriceId && dto.providerPriceId) {
      if (order?.deliveryAddress) {
        const { pickup } = await this.loadWarehousePickup(dto.warehouseId);
        const feesResponse =
          await this.quickshipperService.calculateDeliveryFee({
            fromStreetName: pickup.streetName,
            fromCityName: pickup.cityName,
            fromLatitude: pickup.latitude,
            fromLongitude: pickup.longitude,
            toStreetName: order.deliveryAddress.streetName,
            toCityName: order.deliveryAddress.cityName,
            toLatitude: order.deliveryAddress.latitude,
            toLongitude: order.deliveryAddress.longitude,
          });
        const picked = this.pickProviderPrice(
          (feesResponse.fees || []) as unknown as Array<
            Record<string, unknown>
          >,
          order.deliveryProvider?.providerId,
          order.deliverySpeed,
          dto.providerPriceId,
        );
        if (picked) {
          preview.newDeliveryPrice = picked.priceAmount;
          preview.newDeliveryServiceFee = picked.serviceFee;
          preview.amountDue = picked.priceAmount + picked.serviceFee;
          preview.newDeliverySpeed = picked.deliverySpeedName;
          preview.providerPriceId = picked.priceId;
        }
      }
    }

    let cancelledQuickshipperOrderId: string | undefined;
    let quickshipperCancelledAt: Date | undefined;

    const existingQsId = order.quickshipperOrderId?.trim();
    if (existingQsId) {
      try {
        await this.quickshipperService.cancelOrder(existingQsId);
        cancelledQuickshipperOrderId = existingQsId;
        quickshipperCancelledAt = new Date();
        this.logger.log(
          `[Delivery redispatch] Quickshipper DELETE OK — cancelled=${existingQsId}`,
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(
          `Quickshipper-ზე ძველი შეკვეთის გაუქმება (DELETE v1/order) ვერ მოხერხდა: ${existingQsId}. ` +
            'როცა კურიერი უკვე მიბმულია, DELETE v1/order ვერ მოხერხდება. დეტალი: ' +
            msg.slice(0, 300),
        );
      }
    }

    const redispatch = {
      status: 'pending_payment' as const,
      previousDeliveryTotal: preview.previousDeliveryTotal,
      newDeliveryPrice: preview.newDeliveryPrice,
      newDeliveryServiceFee: preview.newDeliveryServiceFee,
      amountDue: preview.amountDue,
      newWarehouseId: dto.warehouseId,
      newWarehouseName: preview.warehouseName,
      newPickupAddress: {
        streetName: preview.pickupAddress.streetName,
        cityName: preview.pickupAddress.cityName,
        latitude: preview.pickupAddress.latitude,
        longitude: preview.pickupAddress.longitude,
      },
      newDeliveryProvider: preview.newDeliveryProvider,
      newDeliverySpeed: preview.newDeliverySpeed,
      distanceKm: preview.distanceKm,
      createdAt: new Date(),
      ...(cancelledQuickshipperOrderId
        ? { cancelledQuickshipperOrderId, quickshipperCancelledAt }
        : {}),
    };

    await this.orderModel
      .findByIdAndUpdate(orderId, {
        $set: { deliveryRedispatch: redispatch },
        $unset: {
          quickshipperOrderId: 1,
          quickshipperStatus: 1,
          quickshipperSentAt: 1,
        },
      })
      .exec();

    let oldWarehouseName = order.pickupAddress?.warehouseName?.trim() ?? '';
    if (!oldWarehouseName && order.warehouseId) {
      try {
        const { pickup } = await this.loadWarehousePickup(
          String(order.warehouseId),
        );
        oldWarehouseName = pickup.warehouseName ?? '';
      } catch {
        /* ignore */
      }
    }
    const oldWhId = String(
      order.dispatchWarehouseId || order.warehouseId || '',
    );
    const warehouseChanged =
      Boolean(oldWhId && dto.warehouseId && oldWhId !== dto.warehouseId) ||
      Boolean(
        oldWarehouseName &&
        preview.warehouseName &&
        oldWarehouseName.toLowerCase() !== preview.warehouseName.toLowerCase(),
      );

    let warehouseCreditResult: { ok: boolean; message: string } | undefined;
    if (warehouseChanged && order.balanceSalePostedAt) {
      warehouseCreditResult =
        await this.bogBalanceSale.tryPostWarehouseSalesCreditForRedispatch(
          orderId,
          {
            oldWarehouseName: oldWarehouseName || 'unknown',
            newWarehouseName: preview.warehouseName,
          },
        );
      this.logger.log(
        `[Delivery redispatch] SalesCredit order=${orderId} ok=${warehouseCreditResult.ok}`,
      );
    }

    this.logger.log(
      `[Delivery redispatch] order=${orderId} warehouse=${dto.warehouseId} amountDue=${preview.amountDue}`,
    );

    return {
      ok: true,
      message: existingQsId
        ? `Quickshipper-ზე ძველი შეკვეთა (${existingQsId}) გაუქმდა. მომხმარებელს გადასახდელია ₾${preview.amountDue.toFixed(2)} — შემდეგ POST v1/order ახალი pickup-ით.`
        : 'მომხმარებელს ეკრანზე გამოჩნდება გადასახდელი ახალი მიტანის თანხა. გადახდის შემდეგ გაუშვით Quickshipper-ზე (POST v1/order).',
      deliveryRedispatch: redispatch,
      quickshipperCancelled: Boolean(cancelledQuickshipperOrderId),
      warehouseCredit: warehouseCreditResult,
    };
  }

  /** ადმინი/ტესტი — გადახდის სიმულაცია (BOG-ის ნაცვლად) */
  async markDeliveryRedispatchPaid(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.deliveryRedispatch?.status !== 'pending_payment') {
      throw new BadRequestException(
        'აქტიური pending_payment redispatch არ არის',
      );
    }
    const rd = order.deliveryRedispatch;
    await this.orderModel
      .findByIdAndUpdate(orderId, {
        $set: {
          'deliveryRedispatch.status': 'paid',
          'deliveryRedispatch.paidAt': new Date(),
        },
      })
      .exec();
    await this.bogBalanceSale.tryPostDeliverySaleForRedispatch(orderId);
    return {
      ok: true,
      message: `გადახდა მონიშნულია. ახლა დააჭირე „გაგზავნა Quickshipper-ზე“ — შეიქმნება ახალი POST v1/order (${rd.newWarehouseName}).`,
    };
  }

  /** მობილური fallback — BOG callback-ის შემდეგ redispatch paid სტატუსის სინქრონიზაცია */
  async ensureDeliveryRedispatchPaidForUser(orderId: string, userId: string) {
    const order = await this.findOne(orderId, userId);
    const rd = order.deliveryRedispatch;
    if (!rd) {
      throw new BadRequestException('redispatch მოთხოვნა არ არის');
    }
    if (rd.status === 'paid' || rd.status === 'completed') {
      return { ok: true, status: rd.status as string };
    }
    const bogSt = (rd.bogPaymentStatus || '').toLowerCase();
    if (
      ['completed', 'success', 'paid', 'captured'].some((k) =>
        bogSt.includes(k),
      )
    ) {
      await this.orderModel
        .findByIdAndUpdate(orderId, {
          $set: {
            'deliveryRedispatch.status': 'paid',
            'deliveryRedispatch.paidAt': new Date(),
          },
        })
        .exec();
      await this.bogBalanceSale.tryPostDeliverySaleForRedispatch(orderId);
      return { ok: true, status: 'paid' };
    }
    return {
      ok: false,
      status: rd.status,
      message: 'გადახდა ჯერ არ დასრულებულა',
    };
  }

  async previewProductsRefundForAdmin(orderId: string) {
    const order = await this.findOneForAdmin(orderId);
    return this.bogPayments.previewProductsRefund(order);
  }

  async refundProductsForAdmin(orderId: string) {
    const order = await this.findOneForAdmin(orderId);
    return this.bogPayments.refundProductsExcludingDelivery(order);
  }

  async retryBalanceSaleForAdmin(orderId: string) {
    await this.findOneForAdmin(orderId);
    return this.bogBalanceSale.retryBalanceSaleForAdmin(orderId);
  }

  async retryWarehouseCreditForAdmin(orderId: string) {
    await this.findOneForAdmin(orderId);
    return this.bogBalanceSale.retryWarehouseCreditForAdmin(orderId);
  }

  async retryDeliveryBalanceSaleForAdmin(orderId: string) {
    await this.findOneForAdmin(orderId);
    return this.bogBalanceSale.retryDeliverySaleForAdmin(orderId);
  }

  private assertCanChangeDeliveryAddress(order: {
    quickshipperOrderId?: string;
    deliveryRedispatch?: { status?: string };
  }) {
    if (order.quickshipperOrderId?.trim()) {
      throw new BadRequestException(
        'Quickshipper-ზე უკვე გაგზავნილია — მისამართის შესაცვლელად გამოიყენე redispatch ან გააუქმე QS შეკვეთა',
      );
    }
    if (order.deliveryRedispatch?.status === 'pending_payment') {
      throw new BadRequestException(
        'აქტიური redispatch გადახდის მოლოდინშია — ჯერ დაასრულე ან გააუქმე',
      );
    }
  }

  private async quoteDeliveryToAddress(
    order: {
      deliveryProvider?: {
        providerId: number;
        providerName: string;
        providerLogoUrl?: string;
      };
      deliverySpeed?: string;
    },
    pickup: PickupAddress,
    to: {
      streetName: string;
      cityName: string;
      latitude: number;
      longitude: number;
    },
  ) {
    const feesResponse = await this.quickshipperService.calculateDeliveryFee({
      fromStreetName: pickup.streetName,
      fromCityName: pickup.cityName,
      fromLatitude: pickup.latitude,
      fromLongitude: pickup.longitude,
      toStreetName: to.streetName,
      toCityName: to.cityName,
      toLatitude: to.latitude,
      toLongitude: to.longitude,
    });

    const rawFees = (feesResponse.fees || []) as unknown as Array<
      Record<string, unknown>
    >;
    const picked = this.pickProviderPrice(
      rawFees,
      order.deliveryProvider?.providerId,
      order.deliverySpeed,
    );
    if (!picked) {
      throw new BadRequestException(
        'Quickshipper-მა ფასები ვერ დააბრუნა ამ მისამართისთვის',
      );
    }

    return {
      distanceKm: feesResponse.distance,
      pickupAddress: pickup,
      newDeliveryPrice: picked.priceAmount,
      newDeliveryServiceFee: picked.serviceFee,
      newDeliveryTotal: picked.priceAmount + picked.serviceFee,
      newDeliveryProvider: {
        providerId: picked.providerId,
        providerName: picked.providerName,
        providerLogoUrl: picked.providerLogoUrl,
      },
      newDeliverySpeed: picked.deliverySpeedName,
      providerPriceId: picked.priceId,
    };
  }

  async previewDeliveryAddressUpdate(
    orderId: string,
    dto: UpdateDeliveryAddressDto,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertCanChangeDeliveryAddress(order);

    const pickup = await this.resolvePickupForOrder(order);
    const to = {
      streetName: dto.streetName.trim(),
      cityName: dto.cityName.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
    };

    const quote = await this.quoteDeliveryToAddress(order, pickup, to);
    const previousTotal =
      (order.deliveryPrice ?? 0) + (order.deliveryServiceFee ?? 0);

    return {
      ok: true,
      deliveryAddress: to,
      pickupAddress: quote.pickupAddress,
      distanceKm: quote.distanceKm,
      previousDeliveryTotal: previousTotal,
      newDeliveryPrice: quote.newDeliveryPrice,
      newDeliveryServiceFee: quote.newDeliveryServiceFee,
      newDeliveryTotal: quote.newDeliveryTotal,
      newDeliveryProvider: quote.newDeliveryProvider,
      newDeliverySpeed: quote.newDeliverySpeed,
      providerPriceId: quote.providerPriceId,
      note: 'მისამართის შენახვის შემდეგ Quickshipper fees განახლდება. გაგზავნამდე დააჭირე „გაგზავნა Quickshipper-ზე“.',
    };
  }

  async applyDeliveryAddressUpdate(
    orderId: string,
    dto: UpdateDeliveryAddressDto,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    this.assertCanChangeDeliveryAddress(order);

    const pickup = await this.resolvePickupForOrder(order);
    const to = {
      streetName: dto.streetName.trim(),
      cityName: dto.cityName.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
    };
    const quote = await this.quoteDeliveryToAddress(order, pickup, to);
    const shippingAddress =
      dto.shippingAddress?.trim() || `${to.streetName}, ${to.cityName}`;

    await this.orderModel
      .findByIdAndUpdate(orderId, {
        $set: {
          deliveryAddress: to,
          shippingAddress,
          deliveryPrice: quote.newDeliveryPrice,
          deliveryServiceFee: quote.newDeliveryServiceFee,
          deliverySpeed: quote.newDeliverySpeed,
          deliveryProvider: quote.newDeliveryProvider,
        },
      })
      .exec();

    this.logger.log(
      `[Delivery address] order=${orderId} → ${to.streetName}, ${to.cityName} (${quote.distanceKm}km) ₾${quote.newDeliveryTotal}`,
    );

    return {
      ok: true,
      message: `მისამართი განახლდა. ახალი მიტანა: ₾${quote.newDeliveryTotal.toFixed(2)} (${quote.distanceKm.toFixed(1)} კმ)`,
      deliveryAddress: to,
      shippingAddress,
      ...quote,
    };
  }

  async findAllByUser(userId: string) {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async simulateBogCompletedForUser(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const userObjectId = new Types.ObjectId(userId);
    const bogOrderId = `dev-sim-${orderId.slice(-12)}`;
    const now = new Date();
    const callbackSnapshot = {
      event: 'dev_simulate_bog_completed',
      body: {
        order_id: bogOrderId,
        external_order_id: orderId,
        order_status: { key: 'completed' },
        payment_detail: {
          auth_code: 'DEV-SIM-OK',
          pg_trx_id: 'DEV-SIM-PG',
          transaction_id: 'DEV-SIM-TXN',
        },
      },
    };

    const updated = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, userId: userObjectId },
        {
          $set: {
            status: OrderStatus.CONFIRMED,
            bogOrderId,
            bogPaymentStatus: 'completed',
            bogLastCallbackAt: now,
            bogLastCallbackRaw: callbackSnapshot,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    this.logger.log(
      `[Orders DEV] BOG completed სიმულაცია შესრულდა: order=${orderId} user=${userId}`,
    );

    await this.bogBalanceSale.tryPostSaleAfterBogCompleted(
      { _id: orderId },
      {
        event: 'dev_simulate_bog_completed',
        source: 'orders_dev_simulate',
      },
      bogOrderId,
    );

    return updated;
  }

  /**
   * მობილური success / fallback — გადახდა completed-ის შემდეგ Balance Sale (იდემპოტენტური).
   */
  async ensureBalanceSalePostedForUser(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    const order = await this.orderModel
      .findOne({ _id: orderId, userId: new Types.ObjectId(userId) })
      .lean()
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const bogSt = (order.bogPaymentStatus || '').toLowerCase();
    if (bogSt !== 'completed') {
      return {
        ok: false as const,
        message: 'გადახდა ჯერ არ არის დასრულებული',
      };
    }

    if (order.balanceSalePostedAt) {
      return {
        ok: true as const,
        alreadyPosted: true,
        message: 'Balance-ში უკვე ჩაწერილია',
      };
    }

    const bogOrderId = order.bogOrderId?.trim() || `MOBILE-${orderId}`;
    await this.bogBalanceSale.tryPostSaleAfterBogCompleted(
      { _id: orderId },
      {
        event: 'mobile_payment_success',
        source: 'mobile_app',
      },
      bogOrderId,
    );

    const fresh = await this.orderModel.findById(orderId).lean().exec();
    return {
      ok: true as const,
      alreadyPosted: Boolean(fresh?.balanceSalePostedAt),
      message: fresh?.balanceSalePostedAt
        ? 'Balance-ში ჩაწერილია'
        : fresh?.balanceSalePostError?.slice(0, 200) ||
          'Balance PUT შესრულდა — შეამოწმე balanceSalePostError',
    };
  }

  async findAllForAdmin() {
    return this.orderModel
      .find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email phoneNumber role status')
      .populate({
        path: 'items.productId',
        select: 'name packSize sku imageUrl',
      })
      .lean()
      .exec();
  }

  async findAllForAdminByWarehouse(warehouseId: string) {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new BadRequestException('Invalid warehouse id');
    }
    return this.orderModel
      .find({ warehouseId: new Types.ObjectId(warehouseId) })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email phoneNumber role status')
      .populate({
        path: 'items.productId',
        select: 'name packSize sku imageUrl',
      })
      .lean()
      .exec();
  }

  async assignWarehouseForAdmin(orderId: string, warehouseId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new BadRequestException('Invalid warehouse id');
    }
    await this.warehousesService.findOne(warehouseId);
    const { pickup } = await this.loadWarehousePickup(warehouseId);
    const whOid = new Types.ObjectId(warehouseId);
    const updated = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        {
          warehouseId: whOid,
          dispatchWarehouseId: whOid,
          pickupAddress: pickup,
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    this.logger.log(
      `[Orders Admin] შეკვეთა ${orderId} მისაინდა საწყობზე ${warehouseId}`,
    );
    return this.findOneForAdmin(orderId);
  }

  async findAllForWarehouse(warehouseId: string) {
    if (!Types.ObjectId.isValid(warehouseId)) {
      throw new BadRequestException('Invalid warehouse id');
    }
    return this.orderModel
      .find({ warehouseId: new Types.ObjectId(warehouseId) })
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email phoneNumber role status')
      .populate({
        path: 'items.productId',
        select: 'name packSize sku imageUrl',
      })
      .lean()
      .exec();
  }

  async updateStatusForWarehouse(
    orderId: string,
    staffWarehouseId: string,
    nextStatus: OrderStatus,
  ) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    if (!Types.ObjectId.isValid(staffWarehouseId)) {
      throw new BadRequestException('Invalid warehouse context');
    }
    if (!Object.values(OrderStatus).includes(nextStatus)) {
      throw new BadRequestException('Invalid order status');
    }
    const current = await this.orderModel.findById(orderId).lean().exec();
    if (!current) {
      throw new NotFoundException('Order not found');
    }
    const assigned = current.warehouseId?.toString();
    if (!assigned || assigned !== staffWarehouseId) {
      throw new ForbiddenException(
        'ეს შეკვეთა არ არის მისაინდ თქვენს საწყობზე',
      );
    }
    const allowed = WAREHOUSE_STATUS_FLOW[current.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `სტატუსის ცვლილება არ დასაშვებია: ${current.status} → ${nextStatus}`,
      );
    }

    const prevStatus = current.status;
    this.logger.log(
      `[Orders Warehouse] ${orderId}: ${prevStatus} -> ${nextStatus} (warehouse=${staffWarehouseId})`,
    );

    const updated = await this.orderModel
      .findByIdAndUpdate(orderId, { status: nextStatus }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    return this.findOneForAdmin(orderId);
  }

  async findOneForAdmin(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    await this.reconcileBalanceSaleOnAdminView(orderId);
    const order = await this.orderModel
      .findById(orderId)
      .populate('userId', 'fullName email phoneNumber role status')
      .populate({
        path: 'items.productId',
        select: 'name packSize sku imageUrl',
      })
      .lean()
      .exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  /**
   * BOG callback გამოტოვებული/ჩავარდნული შემთხვევაში — ადმინში შეკვეთის გახსნისას
   * იდემპოტენტურად ცდილობს Balance Sale-ს (completed + ჯერ არ ჩაწერილი).
   */
  private async reconcileBalanceSaleOnAdminView(orderId: string): Promise<void> {
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) return;

    const bogSt = (order.bogPaymentStatus || '').toLowerCase();
    if (bogSt !== 'completed') return;
    if (order.balanceSalePostedAt) return;

    const lockAt = order.balanceSalePostingLock;
    if (lockAt) {
      const ageMs = Date.now() - new Date(lockAt).getTime();
      if (ageMs >= 0 && ageMs < 120_000) return;
      await this.orderModel
        .updateOne({ _id: order._id }, { $unset: { balanceSalePostingLock: 1 } })
        .exec();
    }

    this.logger.log(
      `[Orders Admin] Balance Sale reconcile — order=${orderId} (BOG completed, postedAt არაა)`,
    );
    await this.bogBalanceSale.tryPostSaleAfterBogCompleted(
      { _id: orderId },
      { event: 'admin_view_reconcile', source: 'admin_order_detail' },
      order.bogOrderId?.trim() || `ADMIN-${orderId}`,
    );
  }

  /** საწყობის თანამშრომელი: ერთი შეკვეთის ნახვა მხოლოდ თავისი საწყობისთვის */
  async findOneForWarehouseStaff(orderId: string, staffWarehouseId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    if (!Types.ObjectId.isValid(staffWarehouseId)) {
      throw new BadRequestException('Invalid warehouse context');
    }
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const assigned = order.warehouseId?.toString();
    if (!assigned || assigned !== staffWarehouseId) {
      throw new ForbiddenException(
        'ეს შეკვეთა არ არის მისაინდ თქვენს საწყობზე',
      );
    }
    return this.findOneForAdmin(orderId);
  }

  async updateForAdmin(orderId: string, status: OrderStatus) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException('Invalid order status');
    }
    const current = await this.orderModel.findById(orderId).lean().exec();
    if (!current) {
      throw new NotFoundException('Order not found');
    }

    const prevStatus = current.status;
    this.logger.log(
      `[Orders Admin] სტატუსის ცვლილება შეკვეთაზე ${orderId}: ${prevStatus} -> ${status}`,
    );

    const updated = await this.orderModel
      .findByIdAndUpdate(orderId, { status }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    return this.findOneForAdmin(orderId);
  }

  /**
   * Send order to Quickshipper delivery service
   * Called when order status is changed to "ready" (CONFIRMED)
   */
  async sendToQuickshipper(orderId: string): Promise<void> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if delivery info exists
    if (
      !order.deliveryProvider ||
      !order.deliveryAddress ||
      !order.deliveryPrice
    ) {
      throw new BadRequestException(
        'შეკვეთას არ აქვს მიტანის ინფორმაცია (Quickshipper)',
      );
    }

    if (order.deliveryRedispatch?.status === 'pending_payment') {
      throw new BadRequestException(
        'მომხმარებელმა ჯერ უნდა გადაიხადოს ახალი მიტანის ღირებულება',
      );
    }

    // Check if already sent
    if (order.quickshipperOrderId) {
      throw new BadRequestException(
        `შეკვეთა უკვე გაგზავნილია Quickshipper-ზე: ${order.quickshipperOrderId}`,
      );
    }

    try {
      const pickup = await this.resolvePickupForOrder(order);
      const rd = order.deliveryRedispatch;
      const useRedispatch = rd?.status === 'paid';
      const provider = useRedispatch
        ? (rd.newDeliveryProvider ?? order.deliveryProvider)
        : order.deliveryProvider;

      if (!provider) {
        throw new BadRequestException('delivery provider აკლია');
      }

      this.logger.log(
        `Quickshipper POST v1/order — mongo=${orderId} provider=${provider.providerName} pickup=${pickup.warehouseName || pickup.streetName}${useRedispatch ? ' (redispatch)' : ''}`,
      );

      const response = await this.quickshipperService.createOrder({
        carDelivery: false,
        comment: useRedispatch
          ? `Aphoteka Order ${orderId} (redispatch)`
          : `Aphoteka Order ${orderId}`,
        parcelDimensionId: '0',
        scheduledTime: undefined,
        dropOffInfo: {
          address: order.deliveryAddress.streetName,
          longitude: order.deliveryAddress.longitude,
          latitude: order.deliveryAddress.latitude,
          addressComment: order.comment || '',
          name: 'Customer',
          phonePrefix: '+995',
          phone: (order.phoneNumber || '').replace(/^\+995/, ''),
          city: order.deliveryAddress.cityName,
          country: 'Georgia',
        },
        pickUpInfo: {
          address: pickup.streetName,
          longitude: pickup.longitude,
          latitude: pickup.latitude,
          addressComment: pickup.warehouseName || 'Aphoteka',
          name: pickup.warehouseName || 'Aphoteka',
          phonePrefix: '+995',
          phone: (pickup.phone || '555422634').replace(/^\+995/, ''),
          city: pickup.cityName,
          country: 'Georgia',
        },
        provider: {
          providerId: provider.providerId,
          providerFeeId: provider.providerId.toString(),
        },
        parcels: [
          {
            fields: [
              {
                id: '0',
                value: `${order.items.length} items`,
                type: 'string',
              },
            ],
          },
        ],
        generalFields: [],
      });

      // Check if API returned explicit error (only for responses with success field)
      if (response.success === false) {
        throw new Error(
          `Quickshipper API returned error: ${response.userMessage || response.developerMessage || 'Unknown error'}`,
        );
      }

      // Update order with tracking info
      // Note: 204 responses don't have trackingNumber, so generate a fallback ID
      const trackingId =
        response.trackingNumber ||
        response.orderId ||
        `QS-${orderId.slice(-12)}`;

      const updateSet: Record<string, unknown> = {
        quickshipperOrderId: trackingId,
        quickshipperStatus: 'sent',
        quickshipperSentAt: new Date(),
      };

      if (useRedispatch && rd) {
        updateSet.deliveryPrice = rd.newDeliveryPrice;
        updateSet.deliveryServiceFee = rd.newDeliveryServiceFee;
        updateSet.deliveryProvider = rd.newDeliveryProvider;
        updateSet.deliverySpeed = rd.newDeliverySpeed;
        updateSet.dispatchWarehouseId = new Types.ObjectId(rd.newWarehouseId);
        updateSet.pickupAddress = {
          ...rd.newPickupAddress,
          warehouseName: rd.newWarehouseName,
        };
        updateSet['deliveryRedispatch.status'] = 'completed';
      }

      await this.orderModel
        .findByIdAndUpdate(orderId, { $set: updateSet })
        .exec();

      this.logger.log(
        `Quickshipper POST OK — mongo=${orderId} tracking=${trackingId}${useRedispatch ? ' (redispatch completed)' : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order ${orderId} to Quickshipper:`,
        error,
      );
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Quickshipper-ზე გაგზავნა ვერ მოხერხდა',
      );
    }
  }
}
