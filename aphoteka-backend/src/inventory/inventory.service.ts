import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Inventory,
  InventoryDocument,
  InventoryAdjustment,
  InventoryAdjustmentDocument,
  InventoryState,
} from './schemas/inventory.schema';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name)
    private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryAdjustment.name)
    private adjustmentModel: Model<InventoryAdjustmentDocument>,
  ) {}

  async findAll(params?: {
    warehouseId?: string;
    productId?: string;
    state?: string;
    search?: string;
  }) {
    const filter: any = {};

    if (params?.warehouseId) {
      filter.warehouseLocation = params.warehouseId;
    }

    if (params?.productId) {
      // Convert string to ObjectId for MongoDB query
      try {
        filter.productId = new Types.ObjectId(params.productId);
        console.log(
          'Searching inventory with productId:',
          params.productId,
          'as ObjectId:',
          filter.productId,
        );
      } catch (error) {
        console.error('Invalid productId:', params.productId, error);
        // If invalid ObjectId, set to null to return empty results
        filter.productId = null;
      }
    }

    if (params?.state) {
      filter.state = params.state;
    }

    if (params?.search) {
      filter.$or = [{ batchNumber: { $regex: params.search, $options: 'i' } }];
    }

    console.log('Inventory filter:', JSON.stringify(filter, null, 2));

    const [data, total] = await Promise.all([
      this.inventoryModel
        .find(filter)
        .populate('productId')
        .populate('warehouseId')
        .exec(),
      this.inventoryModel.countDocuments(filter).exec(),
    ]);

    console.log('Found inventory items:', data.length, 'total:', total);
    if (data.length > 0) {
      console.log('First inventory item:', JSON.stringify(data[0], null, 2));
    }

    return { data, total };
  }

  async findOne(id: string) {
    const inventory = await this.inventoryModel
      .findById(id)
      .populate('productId')
      .populate('warehouseId')
      .exec();

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return { data: inventory };
  }

  async receive(receiveDto: ReceiveInventoryDto) {
    console.log('Receive DTO:', JSON.stringify(receiveDto, null, 2));
    
    // Validate that warehouseId is provided (required in schema)
    if (!receiveDto.warehouseId) {
      throw new NotFoundException('warehouseId is required');
    }

    const inventoryItems: Inventory[] = [];

    // Convert warehouseId and productId strings to ObjectId
    const warehouseId = new Types.ObjectId(receiveDto.warehouseId);
    console.log('Converted warehouseId:', warehouseId.toString());

    for (const item of receiveDto.items) {
      const productId = item.productId
        ? new Types.ObjectId(item.productId)
        : undefined;

      const inventory = new this.inventoryModel({
        productId: productId,
        warehouseId: warehouseId, // Required field
        batchNumber: item.batchNumber,
        expiryDate: new Date(item.expiryDate),
        quantity: item.quantity,
        availableQuantity: item.quantity,
        reservedQuantity: 0,
        state: InventoryState.RECEIVED_BLOCKED,
        warehouseLocation: receiveDto.warehouseId, // Keep as string for reference
        receivedDate: new Date(receiveDto.receivedDate),
        supplier: receiveDto.supplierInvoiceNumber,
      });

      inventoryItems.push(await inventory.save());
    }

    return {
      data: {
        id: 'receipt-' + Date.now(),
        receiptNumber: receiveDto.receiptNumber,
        warehouseId: receiveDto.warehouseId,
        status: 'received',
        receivedDate: new Date(receiveDto.receivedDate),
        items: inventoryItems,
      },
    };
  }

  async dispatch(dispatchDto: any) {
    return { data: { id: 'dispatch-' + Date.now(), ...dispatchDto } };
  }

  async adjust(adjustmentDto: any) {
    const adjustment = new this.adjustmentModel({
      inventoryId: adjustmentDto.inventoryId,
      adjustmentType: adjustmentDto.adjustmentType,
      quantity: adjustmentDto.quantity,
      reason: adjustmentDto.reason,
      authorizedBy: adjustmentDto.authorizedBy,
    });

    const savedAdjustment = await adjustment.save();

    // Update inventory quantity
    const inventory = await this.inventoryModel
      .findById(adjustmentDto.inventoryId)
      .exec();

    if (inventory) {
      inventory.quantity += adjustmentDto.quantity;
      inventory.availableQuantity += adjustmentDto.quantity;
      await inventory.save();
    }

    return { data: savedAdjustment };
  }

  async getAdjustments(inventoryId?: string) {
    const filter: any = {};
    if (inventoryId) {
      filter.inventoryId = inventoryId;
    }

    const data = await this.adjustmentModel
      .find(filter)
      .populate('inventoryId')
      .exec();

    return { data };
  }
}
