/**
 * ნაგულისხმევი ფილტრის ველები — ერთჯერადი გაშვება:
 * npx ts-node -r tsconfig-paths/register src/seed/seed-filter-fields.ts
 */
import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { DEFAULT_MONGODB_URI } from '../config/default-mongodb-uri';

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

const DEFAULT_FIELDS = [
  {
    key: 'promotional',
    label: 'სააქციო პროდუქტები',
    type: 'boolean',
    sortOrder: 1,
    options: [],
  },
  { key: 'brand', label: 'ბრენდები', type: 'multi', sortOrder: 3, options: [] },
  {
    key: 'product_type',
    label: 'პროდუქტის ტიპი',
    type: 'select',
    sortOrder: 4,
    options: [],
  },
  {
    key: 'country',
    label: 'ქვეყანა',
    type: 'multi',
    sortOrder: 5,
    options: ['საქართველო', 'გერმანია', 'თურქეთი', 'იტალია'],
  },
  {
    key: 'vegan',
    label: 'ვეგანური',
    type: 'boolean',
    sortOrder: 6,
    options: [],
  },
  {
    key: 'composition',
    label: 'შემადგენლობა',
    type: 'multi',
    sortOrder: 7,
    options: [],
  },
  {
    key: 'does_not_contain',
    label: 'არ შეიცავს',
    type: 'multi',
    sortOrder: 8,
    options: [],
  },
  {
    key: 'purpose',
    label: 'დანიშნულება',
    type: 'multi',
    sortOrder: 9,
    options: [],
  },
  {
    key: 'volume',
    label: 'მოცულობა',
    type: 'select',
    sortOrder: 10,
    options: [],
  },
  { key: 'weight', label: 'წონა', type: 'select', sortOrder: 11, options: [] },
  { key: 'color', label: 'ფერი', type: 'select', sortOrder: 12, options: [] },
  {
    key: 'child_gender',
    label: 'ბავშვის სქესი',
    type: 'select',
    sortOrder: 13,
    options: ['გოგო', 'ბიჭი', 'უნისექსი'],
  },
  {
    key: 'bio',
    label: 'ბიო პროდუქტი',
    type: 'boolean',
    sortOrder: 14,
    options: [],
  },
  {
    key: 'texture',
    label: 'ტექსტურა',
    type: 'select',
    sortOrder: 15,
    options: [],
  },
  {
    key: 'usage_rules',
    label: 'გამოყენების წესი',
    type: 'select',
    sortOrder: 16,
    options: [],
  },
  {
    key: 'prescription',
    label: 'გაიცემა რეცეპტით',
    type: 'boolean',
    sortOrder: 17,
    options: [],
  },
  {
    key: 'age',
    label: 'ასაკი',
    type: 'select',
    sortOrder: 18,
    options: ['0-6 თვე', '6-12 თვე', '1-3 წელი', '3+ წელი'],
  },
  {
    key: 'vitamins_minerals',
    label: 'ვიტამინები და მინერალები',
    type: 'multi',
    sortOrder: 19,
    options: [],
  },
  { key: 'price', label: 'ფასი', type: 'range', sortOrder: 2, options: [] },
];

async function seed() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('filterfields');

  for (const field of DEFAULT_FIELDS) {
    await col.updateOne(
      { key: field.key },
      {
        $setOnInsert: {
          ...field,
          isActive: true,
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  const count = await col.countDocuments();
  console.log(`Filter fields ready (${count} total)`);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
