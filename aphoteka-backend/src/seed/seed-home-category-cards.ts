/**
 * Seed: მთავარი გვერდის 3 კატეგორიის ბარათი
 * გაშვება: npx ts-node src/seed/seed-home-category-cards.ts
 */
import { connect, connection, model, Schema, Types } from 'mongoose';
import { DEFAULT_MONGODB_URI } from '../config/default-mongodb-uri';

const CategorySchema = new Schema({
  name: String,
  parentId: { type: Types.ObjectId, default: null },
});

const HomeCategoryCardSchema = new Schema(
  {
    title: String,
    subtitle: String,
    backgroundColor: String,
    iconKey: String,
    iconUrl: String,
    iconColor: String,
    categoryId: { type: Types.ObjectId, ref: 'Category' },
    order: Number,
    isVisible: Boolean,
  },
  { timestamps: true },
);

const DEFAULTS = [
  {
    matchName: 'მედიკამენტები',
    title: 'მედიკამენტები',
    subtitle: 'სრულყოფილი ასორტიმენტი',
    backgroundColor: '#EAF7FF',
    iconKey: 'pills',
    iconColor: '#24B7B4',
    order: 1,
  },
  {
    matchName: 'კოსმეტიკა და პირადი ჰიგიენა',
    title: 'კოსმეტიკა',
    subtitle: 'ზრუნვა თქვენი სილამაზისთვის',
    backgroundColor: '#FFEAF5',
    iconKey: 'flower-outline',
    iconColor: '#E24D9A',
    order: 2,
  },
  {
    matchName: 'დედა და ბავშვი',
    title: 'დედა და ბავშვი',
    subtitle: 'მოვლა და ზრუნვა პატარებისთვის',
    backgroundColor: '#FFF2D9',
    iconKey: 'heart',
    iconColor: '#F5A018',
    order: 3,
  },
];

async function run() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await connect(uri);

  const Category = model('Category', CategorySchema);
  const HomeCategoryCard = model('HomeCategoryCard', HomeCategoryCardSchema);

  const existing = await HomeCategoryCard.countDocuments();
  if (existing > 0) {
    console.log(`უკვე არსებობს ${existing} ბარათი — seed გამოტოვებულია`);
    await connection.close();
    return;
  }

  for (const item of DEFAULTS) {
    const category = await Category.findOne({
      name: item.matchName,
      $or: [{ parentId: null }, { parentId: { $exists: false } }],
    });
    if (!category) {
      console.warn(`კატეგორია ვერ მოიძებნა: ${item.matchName}`);
      continue;
    }
    await HomeCategoryCard.create({
      title: item.title,
      subtitle: item.subtitle,
      backgroundColor: item.backgroundColor,
      iconKey: item.iconKey,
      iconUrl: '',
      iconColor: item.iconColor,
      categoryId: category._id,
      order: item.order,
      isVisible: true,
    });
    console.log(`შეიქმნა: ${item.title}`);
  }

  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
