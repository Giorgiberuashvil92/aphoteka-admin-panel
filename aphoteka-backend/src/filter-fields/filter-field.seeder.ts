import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_FILTER_FIELDS } from './default-filter-fields';
import { FilterField } from './schemas/filter-field.schema';

@Injectable()
export class FilterFieldSeeder implements OnModuleInit {
  constructor(
    @InjectModel(FilterField.name)
    private filterFieldModel: Model<FilterField>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultFields();
  }

  async seedDefaultFields() {
    try {
      let inserted = 0;
      for (const field of DEFAULT_FILTER_FIELDS) {
        const result = await this.filterFieldModel.updateOne(
          { key: field.key },
          {
            $setOnInsert: {
              ...field,
              isActive: true,
              description: '',
            },
          },
          { upsert: true },
        );
        if (result.upsertedCount > 0) inserted++;
      }
      const total = await this.filterFieldModel.countDocuments();
      console.log(
        `🔎 Filter fields ready (${total} total${inserted ? `, +${inserted} new` : ''})`,
      );
    } catch (error) {
      console.error('❌ Error seeding filter fields:', error);
    }
  }
}
