import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Warehouse, WarehouseDocument, WarehouseEmployee, WarehouseEmployeeDocument } from './schemas/warehouse.schema';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectModel(Warehouse.name)
    private warehouseModel: Model<WarehouseDocument>,
    @InjectModel(WarehouseEmployee.name)
    private employeeModel: Model<WarehouseEmployeeDocument>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto) {
    const warehouse = new this.warehouseModel(createWarehouseDto);
    return await warehouse.save();
  }

  async findAll(params?: { city?: string; active?: boolean; search?: string }) {
    const filter: any = {};

    if (params?.city) {
      filter.city = params.city;
    }

    if (params?.active !== undefined) {
      filter.active = params.active;
    }

    if (params?.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { address: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      this.warehouseModel.find(filter).exec(),
      this.warehouseModel.countDocuments(filter).exec(),
    ]);

    // Transform _id to id for each warehouse
    const data = warehouses.map((w) => {
      const obj = w.toObject() as any;
      // Ensure id field is set
      if (obj._id) {
        obj.id = obj._id.toString();
      }
      // Use object destructuring to remove _id and __v
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id: _unusedId, __v: _unusedV, ...rest } = obj;
      console.log('Transformed warehouse:', { id: rest.id, name: rest.name, hasId: !!rest.id });
      return rest;
    });

    return { data, total };
  }

  async findOne(id: string) {
    // Validate that id is provided and not undefined
    if (!id || id === 'undefined' || id === 'null') {
      throw new NotFoundException('Warehouse ID is required');
    }

    const warehouse = await this.warehouseModel.findById(id).exec();

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    // Get employees for this warehouse
    const employees = await this.employeeModel.find({ warehouseId: id }).exec();

    // Transform _id to id
    const warehouseObj = warehouse.toObject() as any;
    // Ensure id field is set
    if (warehouseObj._id) {
      warehouseObj.id = warehouseObj._id.toString();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _unusedId, __v: _unusedV, ...rest } = warehouseObj;
    
    console.log('Transformed warehouse in findOne:', { id: rest.id, name: rest.name, hasId: !!rest.id });

    return { data: { ...rest, employees } };
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto) {
    const warehouse = await this.warehouseModel
      .findByIdAndUpdate(id, updateWarehouseDto, { new: true })
      .exec();

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async toggleStatus(id: string) {
    const warehouse = await this.warehouseModel.findById(id).exec();
    
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    warehouse.active = !warehouse.active;
    return await warehouse.save();
  }

  async getEmployees(warehouseId: string, params?: {
    role?: string;
    active?: boolean;
    search?: string;
  }) {
    const filter: any = { warehouseId };

    if (params?.role) {
      filter.role = params.role;
    }

    if (params?.active !== undefined) {
      filter.active = params.active;
    }

    const [data, total] = await Promise.all([
      this.employeeModel.find(filter).exec(),
      this.employeeModel.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async createEmployee(employeeDto: any) {
    const employee = new this.employeeModel(employeeDto);
    return await employee.save();
  }

  async updateEmployee(id: string, employeeDto: any) {
    const employee = await this.employeeModel
      .findByIdAndUpdate(id, employeeDto, { new: true })
      .exec();
      
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    return employee;
  }

  async toggleEmployeeStatus(id: string) {
    const employee = await this.employeeModel.findById(id).exec();
    
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    
    employee.active = !employee.active;
    return await employee.save();
  }
}
