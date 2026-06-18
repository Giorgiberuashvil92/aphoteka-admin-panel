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
import { BogBalanceSaleService } from '../bog/bog-balance-sale.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { QuickshipperService } from '../quickshipper/quickshipper.service';

/** საწყობის თანამშრომლისთვის დაშვებული სტატუსის გადასვლები (Nest enum) */
const WAREHOUSE_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private readonly bogBalanceSale: BogBalanceSaleService,
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

    // Auto-assign warehouse based on delivery location
    let warehouseId: Types.ObjectId | undefined;

    if (dto.warehouseId && Types.ObjectId.isValid(dto.warehouseId)) {
      // Manual warehouse assignment (if provided)
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

    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      phoneNumber: dto.phoneNumber,
      comment: dto.comment,
      warehouseId,
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
      `[Orders DEV] BOG completed სიმულაცია შესრულდა: order=${orderId} user=${userId} (Balance გაგზავნა გამორთულია)`,
    );

    return updated;
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
    const updated = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { warehouseId: new Types.ObjectId(warehouseId) },
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

    if (nextStatus === OrderStatus.SHIPPED) {
      const bogOrderId = updated.bogOrderId?.trim() || `WH-${orderId}`;
      await this.bogBalanceSale.tryPostSaleAfterBogCompleted(
        { _id: orderId },
        {
          event: 'warehouse_status_change',
          source: 'warehouse_staff',
          nextStatus,
        },
        bogOrderId,
      );
    }

    return this.findOneForAdmin(orderId);
  }

  async findOneForAdmin(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
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
    const triggerBalance = status === OrderStatus.SHIPPED;
    this.logger.log(
      `[Orders Admin] სტატუსის ცვლილება შეკვეთაზე ${orderId}: ${prevStatus} -> ${status} | balance_trigger=${triggerBalance ? 'yes' : 'no'}`,
    );

    const updated = await this.orderModel
      .findByIdAndUpdate(orderId, { status }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    if (status === OrderStatus.SHIPPED) {
      const bogOrderId = updated.bogOrderId?.trim() || `ADMIN-${orderId}`;
      await this.bogBalanceSale.tryPostSaleAfterBogCompleted(
        { _id: orderId },
        {
          event: 'admin_status_change',
          source: 'admin_panel',
          nextStatus: status,
        },
        bogOrderId,
      );
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

    // Check if already sent
    if (order.quickshipperOrderId) {
      throw new BadRequestException(
        `შეკვეთა უკვე გაგზავნილია Quickshipper-ზე: ${order.quickshipperOrderId}`,
      );
    }

    try {
      // TODO: Get actual pharmacy/warehouse address
      // For now, using mock address
      const pickupAddress = {
        address: 'კოსტავას 71',
        city: 'თბილისი',
        latitude: 41.7151,
        longitude: 44.7664,
      };

      this.logger.log(
        `Sending order ${orderId} to Quickshipper (provider: ${order.deliveryProvider.providerName})`,
      );

      const response = await this.quickshipperService.createOrder({
        carDelivery: false,
        comment: `Aphoteka Order ${orderId}`,
        parcelDimensionId: '0',
        scheduledTime: undefined,
        dropOffInfo: {
          address: order.deliveryAddress.streetName,
          longitude: order.deliveryAddress.longitude,
          latitude: order.deliveryAddress.latitude,
          addressComment: order.comment || '',
          name: 'Customer', // TODO: Get actual customer name
          phonePrefix: '+995',
          phone: order.phoneNumber || '',
          city: order.deliveryAddress.cityName,
          country: 'Georgia',
        },
        pickUpInfo: {
          address: pickupAddress.address,
          longitude: pickupAddress.longitude,
          latitude: pickupAddress.latitude,
          addressComment: 'Aphoteka Pharmacy',
          name: 'Aphoteka',
          phonePrefix: '+995',
          phone: '555422634', // TODO: Get from config
          city: pickupAddress.city,
          country: 'Georgia',
        },
        provider: {
          providerId: order.deliveryProvider.providerId,
          providerFeeId: order.deliveryProvider.providerId.toString(),
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
      await this.orderModel.findByIdAndUpdate(orderId, {
        quickshipperOrderId: trackingId,
        quickshipperStatus: 'sent',
        quickshipperSentAt: new Date(),
      });

      this.logger.log(
        `Order ${orderId} successfully sent to Quickshipper. Tracking: ${trackingId}`,
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
