import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
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
    }));
    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const order = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items,
      totalAmount,
      status: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      phoneNumber: dto.phoneNumber,
      comment: dto.comment,
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

  /** ადმინ პანელი: ყველა შეკვეთა მომხმარებლის მონაცემებით */
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

  async updateForAdmin(orderId: string, status: OrderStatus) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException('Order not found');
    }
    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException('Invalid order status');
    }
    const updated = await this.orderModel
      .findByIdAndUpdate(orderId, { status }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return this.findOneForAdmin(orderId);
  }
}
