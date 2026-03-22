# Environment Variables Setup

## Required Environment Variables

შექმენით `.env.local` ფაილი პროექტის root დირექტორიაში:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Production-ში:
# NEXT_PUBLIC_API_URL=https://your-api-domain.com/api

# Admin panel (სრული URL — metadata / absolute ლინკები; Railway-ზე ნაგულისხმევად კოდში არის ეს დომენი)
# NEXT_PUBLIC_SITE_URL=https://aphoteka-admin-panel-production.up.railway.app
```

## Environment Variables Structure

### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Production (Vercel)
Vercel Dashboard → Project Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` = შენი Nest API (Railway), მაგ. `https://aphoteka-backend-production.up.railway.app/api`

თუ ეს variable არ დააყენე, production build იყენებს ნაგულისხმევს `src/lib/apiBaseUrl.ts`-ში — შეცვალე იქ თუ Railway სერვისის სახელი სხვაა.

## Usage

Environment variables `NEXT_PUBLIC_` prefix-ით ხელმისაწვდომია client-side-ზე:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

## Important Notes

- `.env.local` არის gitignore-ში და არ იტვირთება Git-ში
- Production-ში დაამატეთ environment variables Vercel Dashboard-ში
- ყველა `NEXT_PUBLIC_` variable ხელმისაწვდომია browser-ში
