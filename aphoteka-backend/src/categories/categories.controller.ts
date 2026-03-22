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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** მობილური: აქტიური კატეგორიები productCount, color, icon-ით */
  @Get('mobile')
  findForMobile() {
    return this.categoriesService.findForMobile();
  }

  /** ადმინი: ყველა კატეგორია (?active=true|false) */
  @Get()
  findAll(@Query('active') active?: string) {
    const activeFilter =
      active === 'true' ? true : active === 'false' ? false : undefined;
    return this.categoriesService.findAll(activeFilter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
