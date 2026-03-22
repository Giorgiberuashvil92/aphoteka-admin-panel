# Backend Setup ინსტრუქცია

## 1. Dependencies-ების დაყენება

```bash
cd aphoteka-backend
npm install
```

## 2. Environment Variables

შექმენით `.env` ფაილი root დირექტორიაში:

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

## 3. PostgreSQL Database Setup

```bash
# შექმენით ბაზა
createdb aphoteka_db

# ან psql-ით:
psql -U postgres
CREATE DATABASE aphoteka_db;
\q
```

## 4. გაშვება

```bash
# Development mode (hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 5. API Testing

Backend გაშვებულია: `http://localhost:3001/api`

### მაგალითი Request:

```bash
# პროდუქტების სია
curl http://localhost:3001/api/products

# პროდუქტი ID-ით
curl http://localhost:3001/api/products/{id}

# ახალი პროდუქტი
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "productStrengthId": "uuid",
    "name": "Test Product",
    "price": 10.50,
    "sku": "TEST-001"
  }'
```

## შექმნილი Modules

✅ **Products Module** - პროდუქტების CRUD
✅ **Inventory Module** - ინვენტარის მენეჯმენტი
✅ **Warehouses Module** - საწყობების მენეჯმენტი

## შემდეგი ნაბიჯები

- Orders Module
- Categories Module  
- Promotions Module
- Suppliers Module
- Delivery Zones Module
- Invoices Module (Purchase & Sales)
