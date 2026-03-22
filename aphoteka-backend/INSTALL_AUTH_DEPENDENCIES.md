# Authentication Dependencies Installation

გთხოვთ დააინსტალიროთ შემდეგი dependencies authentication-ისთვის:

```bash
cd aphoteka-backend
npm install
```

ან თუ package.json-ში არ არის დამატებული, გაუშვით:

```bash
cd aphoteka-backend
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt
```

**package.json-ში უკვე დამატებულია dependencies, ასე რომ უბრალოდ გაუშვით `npm install`**

## Environment Variables

დაამატეთ `.env` ფაილში:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

ან გამოიყენეთ `process.env.JWT_SECRET` production-ში.

## API Endpoints

### Registration
```
POST /api/auth/register
Body: {
  "role": "consumer",
  "phoneNumber": "+995555123456",
  "password": "password123",
  "email": "user@example.com",
  "fullName": "გიორგი ბერიძე",
  "warehouseId": "optional-warehouse-id"
}
```

### Login
```
POST /api/auth/login
Body: {
  "phoneNumber": "+995555123456",
  "password": "password123"
}
Response: {
  "user": { ... },
  "accessToken": "jwt-token"
}
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: {
  "phoneNumber": "+995555123456"
}
Response: {
  "message": "...",
  "resetCode": "123456" // Only in development
}
```

### Reset Password
```
POST /api/auth/reset-password
Body: {
  "phoneNumber": "+995555123456",
  "resetCode": "123456",
  "newPassword": "newpassword123"
}
```

### Get Current User
```
GET /api/auth/me
Headers: {
  "Authorization": "Bearer jwt-token"
}
```
