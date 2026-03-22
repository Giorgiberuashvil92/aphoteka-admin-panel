# მობილური აპის API (Kutuku / Aphoteka)

ბაზის მისამართი: `http://localhost:3002/api` (ან `process.env.API_URL`)

## ავთენტიფიკაცია

### შესვლა (ელფოსტა ან ტელეფონი)
```
POST /api/auth/login-mobile
Body: { "emailOrPhone": "user@example.com", "password": "***" }
Response: { "user": { "id", "firstName", "lastName", "email", "phoneNumber", "role", ... }, "accessToken": "..." }
```

### რეგისტრაცია
```
POST /api/auth/register-mobile
Body: { "firstName": "...", "lastName": "...", "email": "user@example.com", "password": "***" }
Response: { "user": { "id", "firstName", "lastName", "email", ... }, "accessToken": "..." }
```

### პროფილი (JWT საჭირო)
```
GET /api/auth/me
Headers: Authorization: Bearer <accessToken>
Response: { "id", "fullName", "firstName", "lastName", "email", "phoneNumber", "role", ... }
```

---

## პროდუქტები

### სია (ფილტრი, ძებნა, პაგინაცია)
```
GET /api/products?page=1&limit=20&search=პარაცეტამოლი&category=OTC
Response: { "data": [...], "total", "page", "limit" }
```

### კატეგორიები
```
GET /api/products/categories
Response: [ { "id": "1", "name": "OTC" }, { "id": "2", "name": "Rx" }, ... ]
```

### ერთი პროდუქტი
```
GET /api/products/:id
Response: { "id", "name", "description", "price", "imageUrl", "category", "sku", "barcode", "packSize", "genericName", "manufacturer", "strength", "dosageForm", ... }
```

---

## შეკვეთები (JWT საჭირო)

### შეკვეთის შექმნა
```
POST /api/orders
Headers: Authorization: Bearer <accessToken>
Body: {
  "items": [
    { "productId": "...", "productName": "...", "quantity": 2, "unitPrice": 5.00, "imageUrl": "...", "packSize": "20 ცალი" }
  ],
  "shippingAddress": "...",
  "phoneNumber": "+995...",
  "comment": "..."
}
Response: Order object
```

### ჩემი შეკვეთები
```
GET /api/orders
Headers: Authorization: Bearer <accessToken>
Response: [ { "id", "items", "totalAmount", "status", "createdAt", ... }, ... ]
```

### შეკვეთის დეტალი
```
GET /api/orders/:id
Headers: Authorization: Bearer <accessToken>
Response: { "id", "items", "totalAmount", "status", "shippingAddress", "createdAt", ... }
```

---

## სტატუსები

- **Order status:** `pending` | `confirmed` | `shipped` | `delivered` | `cancelled`
- **User role (mobile):** `consumer`

Token-ის შენახვა და ყოველ მოთხოვნაზე გაგზავნა: `Authorization: Bearer <accessToken>`
