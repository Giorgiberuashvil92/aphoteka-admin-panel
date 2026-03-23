/**
 * ადმინ იუზერის upsert MongoDB-ში (login: phoneNumber + bcrypt password).
 *
 * ნაგულისხმევი ტელეფონი/პაროლი ემთხვევა ადმინ პანელის
 * `aphoteka-admin/src/config/adminPanelLogin.ts` default-ებს.
 *
 * გაშვება (aphoteka-backend საქაღალდიდან): npm run seed
 * .env: aphoteka-backend/.env ან მშობლის aphoteka-admin/.env / .env.local (MONGODB_URI).
 * თუ არც ერთი არაა — იგივე DEFAULT რაც Nest `app.module` (src/config/default-mongodb-uri.ts).
 */

import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';
import * as bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { DEFAULT_MONGODB_URI } from '../config/default-mongodb-uri';
import {
  User,
  UserSchema,
  UserRole,
  UserPermission,
} from '../users/schemas/user.schema';

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

const DEFAULT_PHONE = '+995555000000';
const DEFAULT_PASSWORD = 'ChangeMe_Admin1!';

function allPermissions(): UserPermission[] {
  return Object.values(UserPermission).filter(
    (v): v is UserPermission => typeof v === 'string',
  );
}

async function main() {
  const uri =
    process.env.MONGODB_URI?.trim() || DEFAULT_MONGODB_URI;

  const phoneNumber =
    process.env.SEED_ADMIN_PHONE?.trim() || DEFAULT_PHONE;
  const plainPassword =
    process.env.SEED_ADMIN_PASSWORD?.trim() || DEFAULT_PASSWORD;

  if (plainPassword.length < 6) {
    console.error('პაროლი მინიმუმ 6 სიმბოლო (როგორც RegisterDto-ში).');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const UserModel =
    mongoose.models[User.name] || mongoose.model(User.name, UserSchema);

  const password = await bcrypt.hash(plainPassword, 10);

  const doc = await UserModel.findOneAndUpdate(
    { phoneNumber },
    {
      $set: {
        phoneNumber,
        password,
        role: UserRole.ADMIN,
        status: 'active',
        fullName: 'Admin (seed)',
        permissions: allPermissions(),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  console.log(
    'შექმნილი/განახლებული ადმინი:',
    doc.phoneNumber,
    'role=',
    doc.role,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
