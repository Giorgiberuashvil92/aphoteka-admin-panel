import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeSectionsService } from './home-sections.service';
import { HomeSectionsController } from './home-sections.controller';
import { HomeSection, HomeSectionSchema } from './schemas/home-section.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HomeSection.name, schema: HomeSectionSchema },
    ]),
  ],
  controllers: [HomeSectionsController],
  providers: [HomeSectionsService],
  exports: [HomeSectionsService],
})
export class HomeSectionsModule {}
