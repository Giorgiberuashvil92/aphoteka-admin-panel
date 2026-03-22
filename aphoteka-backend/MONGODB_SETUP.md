# MongoDB Setup ინსტრუქცია macOS-ზე

## 1. Command Line Tools-ის დაყენება/განახლება

macOS Sequoia-ზე MongoDB-ს დასაყენებლად საჭიროა Command Line Tools:

```bash
xcode-select --install
```

თუ ეს არ მუშაობს, შეგიძლიათ:
1. გახსნათ System Settings → General → Software Update
2. ან გადმოწეროთ [Apple Developer](https://developer.apple.com/download/all/) საიტიდან

## 2. MongoDB-ს დაყენება

```bash
# MongoDB tap-ის დამატება
brew tap mongodb/brew

# MongoDB Community Edition-ის დაყენება
brew install mongodb-community@8.0
```

## 3. MongoDB-ს გაშვება

```bash
# MongoDB-ს გაშვება (როგორც service)
brew services start mongodb-community@8.0

# ან ხელით გაშვება
mongod --config /opt/homebrew/etc/mongod.conf
```

## 4. MongoDB-ს შემოწმება

```bash
# MongoDB Shell-ის გაშვება
mongosh

# ან შემოწმება რომ მუშაობს
mongosh --eval "db.version()"
```

## 5. MongoDB-ს გაჩერება

```bash
brew services stop mongodb-community@8.0
```

## 6. კონფიგურაცია

MongoDB კონფიგურაცია: `/opt/homebrew/etc/mongod.conf`

მონაცემთა ბაზა: `/opt/homebrew/var/mongodb`

## 7. NestJS-თან ინტეგრაცია

თუ გსურთ MongoDB-ს გამოყენება NestJS-ში PostgreSQL-ის ნაცვლად:

```bash
npm install @nestjs/mongoose mongoose
```

## ალტერნატივა: Docker-ით MongoDB

თუ Homebrew-ით დაყენება არ მუშაობს, შეგიძლიათ Docker-ით:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:8.0
```

## სასარგებლო ბრძანებები

```bash
# MongoDB-ს სტატუსი
brew services list | grep mongodb

# MongoDB-ს ლოგები
tail -f /opt/homebrew/var/log/mongodb/mongo.log

# MongoDB-ს გადატვირთვა
brew services restart mongodb-community@8.0
```
