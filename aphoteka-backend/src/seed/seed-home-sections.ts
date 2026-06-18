/**
 * სიდ სკრიპტი მთავარი გვერდის სექციებისთვის
 * გაშვება: npx ts-node src/seed/seed-home-sections.ts
 */

import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { DEFAULT_MONGODB_URI } from '../config/default-mongodb-uri';
import {
  HomeSection,
  HomeSectionSchema,
  HomeSectionType,
} from '../home-sections/schemas/home-section.schema';

function loadDotenv() {
  const cwd = process.cwd();
  const paths = [
    resolve(cwd, '.env'),
    resolve(cwd, '..', '.env'),
    resolve(cwd, '..', '.env.local'),
    resolve(cwd, '..', '.env.development.local'),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      config({ path: p, override: false });
    }
  }
}

loadDotenv();

const defaultSections = [
  {
    title: 'მედიკამენტი',
    type: 'category',
    categoryFilter: '',
    searchQuery: '',
    order: 1,
    isVisible: true,
    limit: 12,
  },
  {
    title: 'კოსმეტიკა',
    type: 'category',
    categoryFilter: 'კოსმეტიკა',
    searchQuery: '',
    order: 2,
    isVisible: true,
    limit: 12,
  },
  {
    title: 'შენი რჩეული',
    type: 'favorites',
    categoryFilter: '',
    searchQuery: '',
    order: 3,
    isVisible: true,
    limit: 12,
  },
  {
    title: 'ფასდაკლებული',
    type: 'discounted',
    categoryFilter: '',
    searchQuery: '',
    order: 4,
    isVisible: true,
    limit: 12,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI?.trim() || DEFAULT_MONGODB_URI;

  await mongoose.connect(uri);

  const HomeSectionModel =
    mongoose.models[HomeSection.name] ||
    mongoose.model(HomeSection.name, HomeSectionSchema);

  // წაშლა ძველი სექციების
  await HomeSectionModel.deleteMany({});
  console.log('ძველი home sections წაიშალა');

  // ახალი სექციების ჩაწერა
  const inserted = await HomeSectionModel.insertMany(defaultSections);
  console.log(`${inserted.length} home section ჩაიწერა`);

  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log('✅ Home sections seed დასრულდა წარმატებით');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed შეცდომა:', err);
    process.exit(1);
  });
