import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * CORS — ბრაუზერი Vercel-იდან Railway API-ზე „განსხვავებული origin“-ია → სავალდებულია სწორი preflight (OPTIONS).
 *
 * `CORS_ORIGIN` — მძიმით გამოყოფილი სია (მკაცრი რეჟიმი). ცარიელი/არააქტიური → `origin: true`
 * (თითო მოთხოვნაზე იგივე `Origin` ჰედერი ბრუნდება — credentials-თან თავსებადი).
 */
function resolveCorsOrigin(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) return true;
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : true;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: resolveCorsOrigin(),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: [],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86_400,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
void bootstrap();
