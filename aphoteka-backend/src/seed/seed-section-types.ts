/**
 * Seed script for Section Types
 * Run: npx ts-node src/seed/seed-section-types.ts
 */

import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { DEFAULT_MONGODB_URI } from '../config/default-mongodb-uri';
import {
  SectionType,
  SectionTypeSchema,
} from '../section-types/schemas/section-type.schema';

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

const defaultTypes = [
  {
    key: 'category',
    label: 'კატეგორია',
    description: 'პროდუქტები კონკრეტული კატეგორიიდან',
    isBuiltIn: true,
    isActive: true,
  },
  {
    key: 'discounted',
    label: 'ფასდაკლებული',
    description: 'ფასდაკლებული პროდუქტები',
    isBuiltIn: true,
    isActive: true,
  },
  {
    key: 'favorites',
    label: 'რჩეული',
    description: 'მომხმარებლის რჩეული პროდუქტები',
    isBuiltIn: true,
    isActive: true,
  },
  {
    key: 'all',
    label: 'ყველა',
    description: 'ყველა აქტიური პროდუქტი',
    isBuiltIn: true,
    isActive: true,
  },
];

async function main() {
  const uri = process.env.MONGODB_URI?.trim() || DEFAULT_MONGODB_URI;

  await mongoose.connect(uri);

  const SectionTypeModel =
    mongoose.models[SectionType.name] ||
    mongoose.model(SectionType.name, SectionTypeSchema);

  // Check if types already exist
  const existing = await SectionTypeModel.find({ isBuiltIn: true }).exec();
  if (existing.length > 0) {
    console.log(`✅ Built-in types already exist (${existing.length})`);
    await mongoose.disconnect();
    return;
  }

  // Insert built-in types
  const inserted = await SectionTypeModel.insertMany(defaultTypes);
  console.log(`✅ ${inserted.length} built-in section types created`);

  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log('✅ Section types seed completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
