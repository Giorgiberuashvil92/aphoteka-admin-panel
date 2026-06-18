import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategorySeeder } from './seed-categories';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const seeder = app.get(CategorySeeder);

  try {
    await seeder.seed();
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
