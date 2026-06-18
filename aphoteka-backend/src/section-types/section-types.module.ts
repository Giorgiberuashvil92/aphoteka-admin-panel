import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SectionTypesController } from './section-types.controller';
import { SectionTypesService } from './section-types.service';
import { SectionType, SectionTypeSchema } from './schemas/section-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SectionType.name, schema: SectionTypeSchema },
    ]),
  ],
  controllers: [SectionTypesController],
  providers: [SectionTypesService],
  exports: [SectionTypesService],
})
export class SectionTypesModule {}
