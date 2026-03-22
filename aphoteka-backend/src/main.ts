import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

/**
 * CORS Express ფენაზე, პირველი middleware — OPTIONS / preflight Railway-ზეც საიმედოდ მუშაობს.
 * (მხოლოდ enableCors ზოგჯერ არ ემთხვევა proxy-ს ან რიგს.)
 * CORS_STRICT=1 — მხოლოდ CORS_ORIGINS (კომით) + localhost + Expo tunnel + 10.0.2.2
 */
function isExpoTunnelOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return (
      host.endsWith('.expo.dev') ||
      host.endsWith('.exp.direct') ||
      host === 'exp.host'
    );
  } catch {
    return false;
  }
}

function isOriginAllowedInStrictMode(origin: string): boolean {
  const extra = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra.includes(origin)) return true;
  if (isExpoTunnelOrigin(origin)) return true;
  return (
    /^https?:\/\/localhost(?::\d+)?$/.test(origin) ||
    /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin) ||
    /^https?:\/\/10\.0\.2\.2(?::\d+)?$/.test(origin)
  );
}

function applyCorsHeaders(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const strict =
    process.env.CORS_STRICT === '1' || process.env.CORS_STRICT === 'true';
  const rawOrigin = req.headers.origin;
  const origin: string | undefined =
    typeof rawOrigin === 'string'
      ? rawOrigin
      : Array.isArray(rawOrigin)
        ? rawOrigin[0]
        : undefined;

  if (strict && origin && !isOriginAllowedInStrictMode(origin)) {
    next();
    return;
  }

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
    'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
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

  app.use(applyCorsHeaders);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
void bootstrap();
