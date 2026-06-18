import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { HomeSectionsService } from './home-sections.service';
import { CreateHomeSectionDto } from './dto/create-home-section.dto';
import { UpdateHomeSectionDto } from './dto/update-home-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('home-sections')
export class HomeSectionsController {
  constructor(private readonly homeSectionsService: HomeSectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateHomeSectionDto) {
    return this.homeSectionsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.homeSectionsService.findAll();
  }

  @Get('visible')
  findVisible() {
    return this.homeSectionsService.findVisible();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const section = await this.homeSectionsService.findOne(id);
    if (!section) {
      throw new NotFoundException(`Home section with id ${id} not found`);
    }
    return section;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHomeSectionDto,
  ) {
    const section = await this.homeSectionsService.update(id, updateDto);
    if (!section) {
      throw new NotFoundException(`Home section with id ${id} not found`);
    }
    return section;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const section = await this.homeSectionsService.remove(id);
    if (!section) {
      throw new NotFoundException(`Home section with id ${id} not found`);
    }
    return section;
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() updates: { id: string; order: number }[]) {
    return this.homeSectionsService.reorder(updates);
  }
}
