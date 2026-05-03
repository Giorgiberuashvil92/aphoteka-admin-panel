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

    const warehouseId =
      dto.warehouseId && Types.ObjectId.isValid(dto.warehouseId)
        ? new Types.ObjectId(dto.warehouseId)
        : undefined;

    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      phoneNumber: dto.phoneNumber,
      comment: dto.comment,
      warehouseId,
    });
    return order;
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
}
