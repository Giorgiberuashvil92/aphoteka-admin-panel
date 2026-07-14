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
import { HomeCategoryCardsService } from './home-category-cards.service';
import { CreateHomeCategoryCardDto } from './dto/create-home-category-card.dto';
import { UpdateHomeCategoryCardDto } from './dto/update-home-category-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('home-category-cards')
export class HomeCategoryCardsController {
  constructor(
    private readonly homeCategoryCardsService: HomeCategoryCardsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createDto: CreateHomeCategoryCardDto) {
    return this.homeCategoryCardsService.create(createDto);
  }

  @Get()
  findAll() {
    return this.homeCategoryCardsService.findAll();
  }

  @Get('visible')
  findVisible() {
    return this.homeCategoryCardsService.findVisible();
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  reorder(@Body() updates: { id: string; order: number }[]) {
    return this.homeCategoryCardsService.reorder(updates);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const card = await this.homeCategoryCardsService.findOne(id);
    if (!card) {
      throw new NotFoundException(`Home category card ${id} not found`);
    }
    return card;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHomeCategoryCardDto,
  ) {
    const card = await this.homeCategoryCardsService.update(id, updateDto);
    if (!card) {
      throw new NotFoundException(`Home category card ${id} not found`);
    }
    return card;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    const card = await this.homeCategoryCardsService.remove(id);
    if (!card) {
      throw new NotFoundException(`Home category card ${id} not found`);
    }
    return card;
  }
}
