import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilterFieldsController } from './filter-fields.controller';
import { FilterFieldsService } from './filter-fields.service';
import { FilterFieldSeeder } from './filter-field.seeder';
import { FilterField, FilterFieldSchema } from './schemas/filter-field.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FilterField.name, schema: FilterFieldSchema },
    ]),
  ],
  controllers: [FilterFieldsController],
  providers: [FilterFieldsService, FilterFieldSeeder],
  exports: [FilterFieldsService],
})
export class FilterFieldsModule {}
