import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/schemas/category.schema';

const CATEGORIES_WITH_IMAGES = [
  {
    name: 'დედა და ბავშვი',
    description: 'საბავშვო საჭიროებები, ბავშვის მოვლა',
    imageUrl:
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
    color: '#FFF0F6',
    icon: 'heart',
    sortOrder: 1,
  },
  {
    name: 'კოსმეტიკა და პირადი ჰიგიენა',
    description: 'პირადი ჰიგიენის საშუალებები',
    imageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
    color: '#FEF3E2',
    icon: 'sparkles',
    sortOrder: 2,
  },
  {
    name: 'პირის ღრუს მოვლა',
    description: 'კბილის ჯაგრისები, პასტები, ღრძილებები',
    imageUrl:
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400',
    color: '#E0F2FE',
    icon: 'happy',
    sortOrder: 3,
  },
  {
    name: 'დეკორატიული კოსმეტიკა',
    description: 'მაკიაჟის პროდუქტები',
    imageUrl:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
    color: '#FCE7F3',
    icon: 'rose',
    sortOrder: 4,
  },
  {
    name: 'მამაკაცის ჰიგიენა',
    description: 'მამაკაცის მოვლის საშუალებები',
    imageUrl:
      'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400',
    color: '#DBEAFE',
    icon: 'man',
    sortOrder: 5,
  },
  {
    name: 'მედიკამენტები',
    description: 'სამედიცინო პრეპარატები',
    imageUrl:
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    color: '#DCFCE7',
    icon: 'medical',
    sortOrder: 6,
  },
  {
    name: 'სტატიკური მოწყობილობა',
    description: 'სამედიცინო აღჭურვილობა',
    imageUrl:
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
    color: '#E0E7FF',
    icon: 'bandage',
    sortOrder: 7,
  },
  {
    name: 'სამედიცინო მოწყობილობა',
    description: 'დიაგნოსტიკური მოწყობილობები',
    imageUrl:
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400',
    color: '#CCFBF1',
    icon: 'pulse',
    sortOrder: 8,
  },
  {
    name: 'სასმელები და სუპლემენტები',
    description: 'ვიტამინები და დანამატები',
    imageUrl:
      'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400',
    color: '#FEF9C3',
    icon: 'nutrition',
    sortOrder: 9,
  },
  {
    name: 'სავარძლები და ბამბის ფუფხები',
    description: 'საწოლები და სავარძლები',
    imageUrl:
      'https://images.unsplash.com/photo-1631217777119-ae53fede5a2e?w=400',
    color: '#F3E8FF',
    icon: 'bed',
    sortOrder: 10,
  },
  {
    name: 'საცდელი დანიშნულების ნაწარმი',
    description: 'ტესტები და საცდელი აღჭურვილობა',
    imageUrl:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400',
    color: '#FFE4E6',
    icon: 'flask',
    sortOrder: 11,
  },
  {
    name: 'ვიტამინები',
    description: 'ვიტამინები და მინერალები',
    imageUrl: 'https://images.unsplash.com/photo-1550572017-4a6e96a4c1b8?w=400',
    color: '#D1FAE5',
    icon: 'nutrition',
    sortOrder: 12,
  },
  {
    name: 'ანტისეპტიკები',
    description: 'დეზინფექციის საშუალებები',
    imageUrl:
      'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400',
    color: '#DBEAFE',
    icon: 'shield-checkmark',
    sortOrder: 13,
  },
];

@Injectable()
export class CategorySeeder {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
  ) {}

  async seed() {
    console.log('🌱 Starting category seeding...');

    try {
      // Check if categories already exist
      const existingCount = await this.categoryModel.countDocuments().exec();

      if (existingCount > 0) {
        console.log(
          `⚠️  Found ${existingCount} existing categories. Updating images only...`,
        );
        await this.updateImages();
        return;
      }

      // Create all categories
      console.log('📝 Creating categories...');
      let created = 0;

      for (const categoryData of CATEGORIES_WITH_IMAGES) {
        const exists = await this.categoryModel
          .findOne({ name: categoryData.name })
          .exec();

        if (!exists) {
          await this.categoryModel.create({
            ...categoryData,
            active: true,
          });
          console.log(`✅ Created: ${categoryData.name}`);
          created++;
        } else {
          console.log(`⏭️  Skipped (exists): ${categoryData.name}`);
        }
      }

      console.log(`🎉 Successfully created ${created} categories!`);
    } catch (error) {
      console.error('❌ Error seeding categories:', error);
      throw error;
    }
  }

  async updateImages() {
    try {
      let updated = 0;

      for (const categoryData of CATEGORIES_WITH_IMAGES) {
        const category = await this.categoryModel
          .findOne({ name: categoryData.name })
          .exec();

        if (category) {
          category.imageUrl = categoryData.imageUrl;
          category.color = categoryData.color;
          category.icon = categoryData.icon;
          await category.save();
          console.log(`✅ Updated: ${categoryData.name}`);
          updated++;
        }
      }

      console.log(`🎉 Successfully updated ${updated} categories!`);
    } catch (error) {
      console.error('❌ Error updating categories:', error);
    }
  }
}
