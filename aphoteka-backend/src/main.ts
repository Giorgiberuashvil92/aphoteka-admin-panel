import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

function getRequestOrigin(req: Request): string | undefined {
  const raw = req.headers.origin;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

/**
 * CORS: არა `*` + credentials (ბრაუზერი უარს ამბობს).
 * თითო მოთხოვნაზე ვაბრუნებთ კონკრეტულ Origin-ს — preflight OPTIONS სრულად აქ.
 */
function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = getRequestOrigin(req);

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  const reqHdrs = req.headers['access-control-request-headers'];
  if (typeof reqHdrs === 'string' && reqHdrs.length > 0) {
    res.setHeader('Access-Control-Allow-Headers', reqHdrs);
  } else {
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Accept, Origin, X-Requested-With',
    );
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(corsMiddleware);

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
