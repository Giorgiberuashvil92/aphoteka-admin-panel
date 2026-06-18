import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/schemas/category.schema';

const CATEGORY_IMAGES: Record<string, string> = {
  'დედა და ბავშვი':
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
  'კოსმეტიკა და პირადი ჰიგიენა':
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
  'პირის ღრუს მოვლა':
    'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400',
  'დეკორატიული კოსმეტიკა':
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
  'მამაკაცის ჰიგიენა':
    'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400',
  მედიკამენტები:
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
  'სტატიკური მოწყობილობა':
    'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
  'სამედიცინო მოწყობილობა':
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400',
  'სასმელები და სუპლემენტები':
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400',
  'სავარძლები და ბამბის ფუფხები':
    'https://images.unsplash.com/photo-1631217777119-ae53fede5a2e?w=400',
  'საცდელი დანიშნულების ნაწარმი':
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400',
  ვიტამინები: 'https://images.unsplash.com/photo-1550572017-4a6e96a4c1b8?w=400',
  ანტისეპტიკები:
    'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400',
  'ბრენდირებული პროდუქტები':
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400',
  'გერმანული პროდუქტები':
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400',
  აქსესუარები:
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
};

@Injectable()
export class CategoryImageSeeder implements OnModuleInit {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
  ) {}

  async onModuleInit() {
    console.log('🖼️  Updating category images...');
    await this.seedCategoryImages();
  }

  async seedCategoryImages() {
    try {
      const categories = await this.categoryModel.find({}).exec();

      let updated = 0;
      for (const category of categories) {
        const cleanName = this.cleanCategoryName(category.name);
        const imageUrl = CATEGORY_IMAGES[cleanName];

        if (imageUrl && category.imageUrl !== imageUrl) {
          await this.categoryModel.updateOne(
            { _id: category._id },
            { $set: { imageUrl } },
          );
          console.log(`✅ Updated image for: ${cleanName}`);
          updated++;
        }
      }

      console.log(`🎉 Successfully updated ${updated} category images!`);
    } catch (error) {
      console.error('❌ Error updating category images:', error);
    }
  }

  private cleanCategoryName(name: string): string {
    const trimmed = name.trim();
    // Check if name is duplicated (e.g., "CategoryCategory")
    if (trimmed.length >= 6 && trimmed.length % 2 === 0) {
      const half = trimmed.length / 2;
      if (trimmed.slice(0, half) === trimmed.slice(half)) {
        return trimmed.slice(0, half);
      }
    }
    return trimmed;
  }
}
