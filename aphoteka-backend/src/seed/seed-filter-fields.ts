/**
 * ნაგულისხმევი ფილტრის ველები — ერთჯერადი გაშვება:
 * npm run seed:filters
 */
import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { DEFAULT_MONGODB_URI } from '../config/default-mongodb-uri';
import { DEFAULT_FILTER_FIELDS } from '../filter-fields/default-filter-fields';

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

async function seed() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
  await mongoose.connect(uri);
  const col = mongoose.connection.collection('filterfields');

  for (const field of DEFAULT_FILTER_FIELDS) {
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
