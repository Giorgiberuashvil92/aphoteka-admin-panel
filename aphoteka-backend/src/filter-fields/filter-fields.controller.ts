import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterFieldsService } from './filter-fields.service';
import { CreateFilterFieldDto } from './dto/create-filter-field.dto';
import { UpdateFilterFieldDto } from './dto/update-filter-field.dto';

@Controller('filter-fields')
export class FilterFieldsController {
  constructor(private readonly filterFieldsService: FilterFieldsService) {}

  /** მობაილი + ადმინი */
  @Get('active')
  findActive() {
    return this.filterFieldsService.findActive();
  }

  @Get()
  findAll() {
    return this.filterFieldsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const field = await this.filterFieldsService.findOne(id);
    if (!field) {
      throw new NotFoundException(`Filter field ${id} not found`);
    }
    return field;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFilterFieldDto) {
    return this.filterFieldsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateFilterFieldDto) {
    const field = await this.filterFieldsService.update(id, dto);
    if (!field) {
      throw new NotFoundException(`Filter field ${id} not found`);
    }
    return field;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const field = await this.filterFieldsService.remove(id);
    if (!field) {
      throw new NotFoundException(`Filter field ${id} not found`);
    }
    return field;
  }
}
