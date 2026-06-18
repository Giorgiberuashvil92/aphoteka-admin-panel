import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { Category } from '../categories/schemas/category.schema';

// Load environment variables
dotenv.config();

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

async function seedCategories() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/aphoteka';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB!');

    // Get Category model
    const CategoryModel = mongoose.model(
      'Category',
      new mongoose.Schema(
        {
          name: { type: String, required: true },
          description: String,
          parentId: mongoose.Schema.Types.ObjectId,
          color: { type: String, default: '#E8F5E9' },
          icon: { type: String, default: 'folder' },
          imageUrl: String,
          active: { type: Boolean, default: true },
          sortOrder: { type: Number, default: 0 },
        },
        { timestamps: true },
      ),
    );

    console.log('🌱 Starting category seeding...');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const categoryData of CATEGORIES_WITH_IMAGES) {
      const existing = await CategoryModel.findOne({ name: categoryData.name });

      if (existing) {
        // Update existing category
        const hasChanges =
          existing.imageUrl !== categoryData.imageUrl ||
          existing.color !== categoryData.color ||
          existing.icon !== categoryData.icon ||
          existing.description !== categoryData.description ||
          existing.sortOrder !== categoryData.sortOrder;

        if (hasChanges) {
          await CategoryModel.updateOne(
            { name: categoryData.name },
            {
              $set: {
                imageUrl: categoryData.imageUrl,
                color: categoryData.color,
                icon: categoryData.icon,
                description: categoryData.description,
                sortOrder: categoryData.sortOrder,
              },
            },
          );
          console.log(`✅ Updated: ${categoryData.name}`);
          updated++;
        } else {
          console.log(`⏭️  No changes: ${categoryData.name}`);
          skipped++;
        }
      } else {
        // Create new category
        await CategoryModel.create({
          ...categoryData,
          active: true,
        });
        console.log(`🆕 Created: ${categoryData.name}`);
        created++;
      }
    }

    console.log(`\n🎉 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📊 Total: ${CATEGORIES_WITH_IMAGES.length}`);
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeder
seedCategories();
