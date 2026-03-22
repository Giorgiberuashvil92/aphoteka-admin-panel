# Authentication API Endpoints

ყველა endpoint მდებარეობს `/api/auth` prefix-ით.

## Base URL
```
http://localhost:3002/api/auth
```

---

## 1. რეგისტრაცია (Registration)

**Endpoint:** `POST /api/auth/register`

**Description:** ახალი მომხმარებლის რეგისტრაცია

**Request Body:**
```json
{
  "role": "consumer",              // Required: "consumer" | "operations" | "delivery" | "admin"
  "phoneNumber": "+995555123456",  // Required: unique phone number
  "password": "password123",        // Required: minimum 6 characters
  "email": "user@example.com",      // Optional
  "fullName": "გიორგი ბერიძე",      // Optional
  "warehouseId": "698b5196a51dc3e19a6d5cce"  // Optional: MongoDB ObjectId
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "698b57ba9bbb24add01764db",
    "role": "consumer",
    "phoneNumber": "+995555123456",
    "email": "user@example.com",
    "fullName": "გიორგი ბერიძე",
    "warehouseId": "698b5196a51dc3e19a6d5cce",
    "status": "active",
    "permissions": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400 Bad Request` - Validation error ან user already exists
- `500 Internal Server Error` - Server error

---

## 2. ავტორიზაცია (Login)

**Endpoint:** `POST /api/auth/login`

**Description:** მომხმარებლის ავტორიზაცია phone number და password-ით

**Request Body:**
```json
{
  "phoneNumber": "+995555123456",  // Required
  "password": "password123"        // Required
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "698b57ba9bbb24add01764db",
    "role": "consumer",
    "phoneNumber": "+995555123456",
    "email": "user@example.com",
    "fullName": "გიორგი ბერიძე",
    "warehouseId": "698b5196a51dc3e19a6d5cce",
    "warehouse": { ... },  // Populated warehouse data if exists
    "status": "active",
    "permissions": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid phone number or password
- `401 Unauthorized` - User account is not active
- `401 Unauthorized` - Password not set

---

## 3. პაროლის აღდგენა (Forgot Password)

**Endpoint:** `POST /api/auth/forgot-password`

**Description:** გენერირებს 6-digit reset code და აგზავნის SMS-ით (development-ში console-ში)

**Request Body:**
```json
{
  "phoneNumber": "+995555123456"  // Required
}
```

**Response (200 OK):**
```json
{
  "message": "If a user with this phone number exists, a reset code has been sent.",
  "resetCode": "123456"  // Only in development mode (NODE_ENV=development)
}
```

**Note:** Production-ში `resetCode` არ მოდის response-ში, მხოლოდ SMS-ით იგზავნება.

**Error Responses:**
- `500 Internal Server Error` - Server error

---

## 4. პაროლის განახლება (Reset Password)

**Endpoint:** `POST /api/auth/reset-password`

**Description:** აღადგენს პაროლს reset code-ის გამოყენებით

**Request Body:**
```json
{
  "phoneNumber": "+995555123456",  // Required
  "resetCode": "123456",          // Required: 6-digit code from forgot-password
  "newPassword": "newpassword123"  // Required: minimum 6 characters
}
```

**Response (200 OK):**
```json
{
  "message": "Password has been reset successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired reset code
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

**Note:** Reset code expires in 15 minutes.

---

## 5. მიმდინარე მომხმარებელი (Get Current User)

**Endpoint:** `GET /api/auth/me`

**Description:** აბრუნებს მიმდინარე authenticated მომხმარებლის ინფორმაციას

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
  "id": "698b57ba9bbb24add01764db",
  "role": "consumer",
  "phoneNumber": "+995555123456",
  "email": "user@example.com",
  "fullName": "გიორგი ბერიძე",
  "warehouseId": "698b5196a51dc3e19a6d5cce",
  "warehouse": { ... },  // Populated warehouse data if exists
  "status": "active",
  "permissions": [],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token
- `401 Unauthorized` - User not found or inactive

---

## Authentication Flow

### რეგისტრაცია:
1. `POST /api/auth/register` - შექმნის user-ს და აბრუნებს `accessToken`
2. შეინახეთ `accessToken` localStorage-ში ან secure storage-ში
3. გამოიყენეთ `accessToken` შემდეგი requests-ისთვის `Authorization: Bearer {token}` header-ით

### ავტორიზაცია:
1. `POST /api/auth/login` - ავტორიზაცია და აბრუნებს `accessToken`
2. შეინახეთ `accessToken` localStorage-ში ან secure storage-ში
3. გამოიყენეთ `accessToken` შემდეგი requests-ისთვის

### პაროლის აღდგენა:
1. `POST /api/auth/forgot-password` - გენერირებს reset code
2. მომხმარებელმა მიიღოს reset code SMS-ით (development-ში console-ში)
3. `POST /api/auth/reset-password` - განაახლოს პაროლი reset code-ით

### Protected Routes:
- გამოიყენეთ `Authorization: Bearer {accessToken}` header ყველა protected endpoint-ზე
- Token expires in 7 days (configurable in `auth.module.ts`)

---

## Frontend Integration Example

### TypeScript/JavaScript Example:

```typescript
// API Base URL
const API_BASE_URL = 'http://localhost:3002/api';

// Register
const register = async (data: {
  role: string;
  phoneNumber: string;
  password: string;
  email?: string;
  fullName?: string;
  warehouseId?: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return await response.json();
};

// Login
const login = async (phoneNumber: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumber, password }),
  });
  const data = await response.json();
  if (data.accessToken) {
    localStorage.setItem('accessToken', data.accessToken);
  }
  return data;
};

// Forgot Password
const forgotPassword = async (phoneNumber: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumber }),
  });
  return await response.json();
};

// Reset Password
const resetPassword = async (
  phoneNumber: string,
  resetCode: string,
  newPassword: string,
) => {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumber, resetCode, newPassword }),
  });
  return await response.json();
};

// Get Current User
const getCurrentUser = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return await response.json();
};
```

---

## Error Handling

ყველა endpoint აბრუნებს standard HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation error or bad request
- `401 Unauthorized` - Authentication failed or token invalid
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

Error response format:
```json
{
  "statusCode": 400,
  "message": "Error message or array of validation errors",
  "error": "Bad Request"
}
```
