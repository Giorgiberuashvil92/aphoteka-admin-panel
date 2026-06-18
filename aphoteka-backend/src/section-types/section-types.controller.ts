import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SectionTypesService } from './section-types.service';
import { CreateSectionTypeDto } from './dto/create-section-type.dto';
import { UpdateSectionTypeDto } from './dto/update-section-type.dto';

@Controller('section-types')
@UseGuards(JwtAuthGuard)
export class SectionTypesController {
  constructor(private readonly sectionTypesService: SectionTypesService) {}

  @Get()
  findAll() {
    return this.sectionTypesService.findAll();
  }

  @Get('active')
  findActive() {
    return this.sectionTypesService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const type = await this.sectionTypesService.findOne(id);
    if (!type) {
      throw new NotFoundException(`Section type with id ${id} not found`);
    }
    return type;
  }

  @Post()
  create(@Body() dto: CreateSectionTypeDto) {
    return this.sectionTypesService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSectionTypeDto) {
    const type = await this.sectionTypesService.update(id, dto);
    if (!type) {
      throw new NotFoundException(`Section type with id ${id} not found`);
    }
    return type;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const type = await this.sectionTypesService.remove(id);
    if (!type) {
      throw new NotFoundException(`Section type with id ${id} not found`);
    }
    return type;
  }
}
