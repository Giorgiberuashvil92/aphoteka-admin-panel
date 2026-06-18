# Section Types Management - დინამიური ტიპების სისტემა

## 🎯 რა არის?

**Section Types** არის ცალკე entity, რომლითაც მართავთ სექციების ტიპებს. მსგავსია Categories-ის - ჯერ ქმნით ტიპებს, მერე აირჩევთ მათ Home Sections-ში.

---

## 🏗️ სტრუქტურა

### **ნაბიჯ 1: ტიპების შექმნა** 
→ `/section-types`

### **ნაბიჯ 2: სექციების შექმნა**  
→ `/home-sections` (dropdown-იდან აირჩევთ ტიპს)

---

## 📊 Schema

```typescript
{
  key: string;              // 'new-arrivals', 'bestsellers'
  label: string;            // 'ახალი პროდუქტები', 'ბესტსელერები'
  description: string;      // ოფციონალური
  isActive: boolean;        // აქტიური/გამორთული
  isBuiltIn: boolean;       // ჩაშენებული (წაშლა აკრძალულია)
}
```

---

## 🎬 როგორ გამოვიყენოთ

### **1. გახსენით** `/section-types`

### **2. დააჭირეთ** "+ ახალი ტიპი"

### **3. შეავსეთ ფორმა:**
```
Key:         new-arrivals
Label:       ახალი პროდუქტები
Description: ბოლო 30 დღის განმავლობაში დამატებული
Active:      ✅ (ჩართული)
```

### **4. შენახვა**

### **5. გადადით** `/home-sections`

### **6. შექმენით სექცია:**
```
სახელი:  ახალი პროდუქტები
ტიპი:    new-arrivals (dropdown-დან)  ← აქ ავტომატურად გამოჩნდება!
ლიმიტი:  12
```

---

## ✅ ჩაშენებული ტიპები

Seed script ქმნის 4 ჩაშენებულ ტიპს:

| Key | Label | აღწერა |
|-----|-------|--------|
| `category` | კატეგორია | კონკრეტული კატეგორიის პროდუქტები |
| `discounted` | ფასდაკლებული | ფასდაკლებული პროდუქტები |
| `favorites` | რჩეული | მომხმარებლის favorites |
| `all` | ყველა | ყველა აქტიური პროდუქტი |

**შენიშვნა:** ჩაშენებული ტიპები `isBuiltIn: true` - **წაშლა შეუძლებელია**

---

## 🚀 Seed Command

```bash
cd aphoteka-backend
npx ts-node src/seed/seed-section-types.ts
```

---

## 📡 API Endpoints

### Backend (NestJS)

```
GET    /section-types           - ყველა ტიპი
GET    /section-types/active    - მხოლოდ აქტიური
GET    /section-types/:id       - ერთი ტიპი
POST   /section-types           - ახალი ტიპი
PATCH  /section-types/:id       - განახლება
DELETE /section-types/:id       - წაშლა (თუ არ არის built-in)
```

---

## 🎨 Admin UI

### `/section-types` - ტიპების მართვა

**ფუნქციები:**
- ✅ **დამატება** - ახალი ტიპი
- ✏️ **რედაქტირება** - არსებული ტიპი
- 🗑️ **წაშლა** - კასტომური ტიპები (built-in არა)
- 🔄 **აქტიური/გამორთული** - toggle
- 📋 **სია** - ყველა ტიპი ცხრილში

### `/home-sections` - სექციების მართვა

**Dropdown:**
- ავტომატურად იტვირთება აქტიური ტიპები
- ფორმატი: `ახალი პროდუქტები (new-arrivals)`

---

## 🔒 Validation

### Key Requirements:
- **დაბალი რეგისტრი**: `new-arrivals` ✅ არა `New-Arrivals`
- **tire-case**: `summer-special` ✅ არა `summer_special`
- **უნიკალური**: თითოეული `key` უნდა იყოს უნიკალური

### Backend Validation:
```typescript
// ConflictException თუ key უკვე არსებობს
if (existing) {
  throw new ConflictException(
    `Section type with key "${dto.key}" already exists`
  );
}

// Built-in ტიპების დაცვა წაშლისგან
if (type.isBuiltIn) {
  throw new ConflictException(
    'Cannot delete built-in section type'
  );
}
```

---

## 💡 მაგალითები

### ახალი ტიპის შექმნა:

```typescript
POST /section-types
{
  "key": "bestsellers",
  "label": "ბესტსელერები",
  "description": "ყველაზე გაყიდვადი პროდუქტები",
  "isActive": true
}
```

### Dropdown-დან არჩევა:

```typescript
// Home Sections ფორმა
{
  title: "ბესტსელერები",
  type: "bestsellers",  ← აირჩია dropdown-დან
  limit: 12
}
```

---

## 📱 Mobile App Integration

მობილურ აპში **არაფერი შეცვლილა** - ისევ იყენებს `type` string-ს როგორც identifier:

```typescript
switch (section.type.toLowerCase()) {
  case 'bestsellers':  // Custom type
    return products.slice(0, limit);
  default:
    return products.slice(0, limit);
}
```

---

## 🎉 უპირატესობები

### **Before** (ძველი):
❌ ტიპები hardcoded კოდში  
❌ ახალი ტიპი = კოდის შეცვლა  
❌ არაა centralized management  

### **After** (ახალი):
✅ ტიპები DB-ში (ცალკე entity)  
✅ ახალი ტიპი = Admin UI-დან  
✅ Centralized management (`/section-types`)  
✅ Reusable dropdown (`/home-sections`)  

---

**გამოცადეთ!** 🚀

1. გახსენით `/section-types`
2. დაამატეთ `bestsellers` ტიპი
3. გადადით `/home-sections`
4. შექმენით სექცია ტიპით `bestsellers`
5. ნახეთ dropdown-ში როგორ გამოჩნდა!
