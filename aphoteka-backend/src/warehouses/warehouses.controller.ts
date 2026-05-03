import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createWarehouseDto: CreateWarehouseDto) {
    return this.warehousesService.create(createWarehouseDto);
  }

  @Get()
  findAll(@Query() params: any) {
    return this.warehousesService.findAll(params);
  }

  /** უფრო სპეციფიკური მარშრუტი უნდა იყოს `:id`-ზე ადრე */
  @Get(':id/employees')
  getEmployees(@Param('id') id: string, @Query() params: any) {
    return this.warehousesService.getEmployees(id, params);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.warehousesService.toggleStatus(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWarehouseDto: UpdateWarehouseDto) {
    return this.warehousesService.update(id, updateWarehouseDto);
  }

  @Post('warehouse-employees')
  @HttpCode(HttpStatus.CREATED)
  createEmployee(@Body() employeeDto: any) {
    return this.warehousesService.createEmployee(employeeDto);
  }

  @Get('warehouse-employees/:id')
  getEmployeeById(@Param('id') id: string) {
    return this.warehousesService.updateEmployee(id, {});
  }

  @Patch('warehouse-employees/:id')
  updateEmployee(@Param('id') id: string, @Body() employeeDto: any) {
    return this.warehousesService.updateEmployee(id, employeeDto);
  }

  @Patch('warehouse-employees/:id/toggle-status')
  toggleEmployeeStatus(@Param('id') id: string) {
    return this.warehousesService.toggleEmployeeStatus(id);
  }
}
