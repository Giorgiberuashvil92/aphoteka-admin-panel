# Aphoteka Backend API

NestJS backend API აფთიაქის ადმინ პანელისთვის.

## მონტაჟი

```bash
npm install
```

## Environment Variables

შექმენით `.env` ფაილი:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=aphoteka_db

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Database Setup

1. დააინსტალირეთ PostgreSQL
2. შექმენით ბაზა:
```sql
CREATE DATABASE aphoteka_db;
```

3. TypeORM ავტომატურად შექმნის ცხრილებს development mode-ში

## გაშვება

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Endpoints

### Products
- `GET /api/products` - პროდუქტების სია
- `GET /api/products/:id` - პროდუქტი ID-ით
- `POST /api/products` - ახალი პროდუქტი
- `PATCH /api/products/:id` - პროდუქტის განახლება
- `DELETE /api/products/:id` - პროდუქტის წაშლა
- `PATCH /api/products/:id/toggle-status` - სტატუსის შეცვლა

### Inventory
- `GET /api/inventory` - ინვენტარის სია
- `GET /api/inventory/:id` - ინვენტარი ID-ით
- `POST /api/inventory/receive` - საწყობში აყვანა
- `POST /api/inventory/dispatch` - საწყობიდან გაცემა
- `POST /api/inventory/adjust` - ინვენტარის კორექტირება
- `GET /api/inventory/adjustments` - კორექტირებების სია

### Warehouses
- `GET /api/warehouses` - საწყობების სია
- `GET /api/warehouses/:id` - საწყობი ID-ით
- `POST /api/warehouses` - ახალი საწყობი
- `PATCH /api/warehouses/:id` - საწყობის განახლება
- `PATCH /api/warehouses/:id/toggle-status` - სტატუსის შეცვლა
- `GET /api/warehouses/:id/employees` - საწყობის თანამშრომლები

## სტრუქტურა

```
src/
├── products/          # Products Module
├── inventory/         # Inventory Module
├── warehouses/       # Warehouses Module
├── app.module.ts     # Main App Module
└── main.ts           # Bootstrap
```

## Development

API გაშვებულია `http://localhost:3001/api`
