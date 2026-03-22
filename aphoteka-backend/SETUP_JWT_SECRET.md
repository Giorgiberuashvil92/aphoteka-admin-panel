# JWT Secret Setup

## როგორ დავაყენოთ JWT_SECRET

### ვარიანტი 1: .env ფაილის გამოყენება (რეკომენდებული)

1. შექმენით `.env` ფაილი `aphoteka-backend` დირექტორიაში:

```bash
cd aphoteka-backend
touch .env
```

2. დაამატეთ შემდეგი შიგთავსი `.env` ფაილში:

```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

3. Production-ისთვის გამოიყენეთ ძლიერი random string. შეგიძლიათ გენერირება:

```bash
# macOS/Linux
openssl rand -base64 32

# ან Node.js-ით
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### ვარიანტი 2: Environment Variable პირდაპირ terminal-ში

```bash
# macOS/Linux
export JWT_SECRET=your-super-secret-jwt-key
npm run start:dev

# Windows (PowerShell)
$env:JWT_SECRET="your-super-secret-jwt-key"
npm run start:dev

# Windows (CMD)
set JWT_SECRET=your-super-secret-jwt-key
npm run start:dev
```

### ვარიანტი 3: package.json script-ში

შეგიძლიათ შეცვალოთ `package.json`-ში `start:dev` script:

```json
{
  "scripts": {
    "start:dev": "JWT_SECRET=your-secret-key nest start --watch"
  }
}
```

## მნიშვნელობა

JWT_SECRET გამოიყენება:
- JWT token-ების signing-ისთვის (register/login)
- JWT token-ების verification-ისთვის (protected routes)

**⚠️ მნიშვნელოვანი**: 
- Production-ში გამოიყენეთ ძლიერი, random secret key
- არ გაუზიაროთ JWT_SECRET public repositories-ში
- `.env` ფაილი უნდა იყოს `.gitignore`-ში

## მიმდინარე კონფიგურაცია

კოდი ავტომატურად იკითხავს `JWT_SECRET`-ს:
1. `.env` ფაილიდან (თუ `ignoreEnvFile: false`)
2. Environment variable-დან
3. Fallback: `'your-secret-key-change-in-production'` (development only)
