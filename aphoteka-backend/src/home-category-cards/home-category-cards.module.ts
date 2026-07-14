import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeCategoryCardsService } from './home-category-cards.service';
import { HomeCategoryCardsController } from './home-category-cards.controller';
import {
  HomeCategoryCard,
  HomeCategoryCardSchema,
} from './schemas/home-category-card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HomeCategoryCard.name, schema: HomeCategoryCardSchema },
    ]),
  ],
  controllers: [HomeCategoryCardsController],
  providers: [HomeCategoryCardsService],
  exports: [HomeCategoryCardsService],
})
export class HomeCategoryCardsModule {}
