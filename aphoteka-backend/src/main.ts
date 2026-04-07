import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

function normalizeOrigin(o: string): string {
  return o.trim().replace(/\/+$/, '');
}

/**
 * CORS — Vercel → Railway.
 * - `CORS_ORIGIN` ცარიელი → ნებისმიერი Origin იმეორება (`true`) — credentials-თან თავსებადი.
 * - შევსებული → მძიმით გამოყოფილი whitelist (slash-ის ნორმალიზაციით) + პროდაქშენ Vercel ყოველთვის ჩართული.
 */
function buildCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGIN?.trim();
  const fromEnv = raw
    ? raw
        .split(',')
        .map((s) => normalizeOrigin(s))
        .filter(Boolean)
    : [];
  const always = new Set(
    ['https://aphoteka-admin-panel.vercel.app', ...fromEnv].map(
      normalizeOrigin,
    ),
  );

  const origin: CorsOptions['origin'] =
    fromEnv.length === 0
      ? true
      : (reqOrigin, cb) => {
          if (!reqOrigin) {
            cb(null, true);
            return;
          }
          const o = normalizeOrigin(reqOrigin);
          if (always.has(o)) {
            cb(null, true);
            return;
          }
          // Vercel preview: *--*.vercel.app ან aphoteka-admin-panel-*.vercel.app
          if (/\.vercel\.app$/i.test(o)) {
            if (
              /^https:\/\/[\w-]+--[\w-]+\.vercel\.app$/i.test(o) ||
              /^https:\/\/aphoteka-admin-panel[\w.-]*\.vercel\.app$/i.test(o)
            ) {
              cb(null, true);
              return;
            }
          }
          if (
            o.startsWith('http://localhost:') ||
            o.startsWith('http://127.0.0.1:')
          ) {
            cb(null, true);
            return;
          }
          cb(null, false);
        };

  return {
    origin,
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
  };
}

async function bootstrap() {
  const cors = buildCorsOptions();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors,
    rawBody: true,
    logger: ['error', 'warn', 'log'],
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
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on: http://0.0.0.0:${port}/api`);
  if (process.env.CORS_ORIGIN?.trim()) {
    console.log(`🌐 CORS whitelist: ${process.env.CORS_ORIGIN}`);
  } else {
    console.log(
      '🌐 CORS: reflect request Origin (set CORS_ORIGIN for strict whitelist)',
    );
  }
}
void bootstrap();
