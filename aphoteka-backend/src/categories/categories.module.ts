import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { ProductsModule } from '../products/products.module';
import { CategoryImageSeeder } from '../seed/seed-category-images';
import { CategorySeeder } from '../seed/seed-categories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
    ProductsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryImageSeeder, CategorySeeder],
  exports: [CategoriesService, CategorySeeder],
})
export class CategoriesModule {}
