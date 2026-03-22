import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  /** მობილური: აქტიური აქციები პროდუქტებით */
  @Get('active')
  findActive() {
    return this.promotionsService.findActive();
  }

  /** ადმინი: ყველა აქცია (?active=true|false) */
  @Get()
  findAll(@Query('active') active?: string) {
    const activeFilter =
      active === 'true' ? true : active === 'false' ? false : undefined;
    return this.promotionsService.findAll(activeFilter);
  }

  /** ადმინი: ერთი აქცია */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const doc = await this.promotionsService.findOne(id);
    if (!doc) throw new NotFoundException(`Promotion ${id} not found`);
    return doc;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
