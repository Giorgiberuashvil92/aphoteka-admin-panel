# აფოთეკა Admin Portal - განხორციელება

## მიმოხილვა

ეს არის ფარმაცევტული e-commerce პლატფორმის Admin & Operations Portal-ის განხორციელება. სისტემა მოიცავს:

- **Product Management** - პროდუქტების კატალოგის მენეჯმენტი
- **Inventory Management** - batch-level ინვენტარის მენეჯმენტი expiry tracking-ით
- **Order Management** - შეკვეთების lifecycle მენეჯმენტი
- **User Management** - მომხმარებლების მენეჯმენტი როლებით (RBAC)
- **Reporting & Audit** - რეპორტები და აუდიტის ლოგი

## სტრუქტურა

### TypeScript ტიპები (`src/types/index.ts`)

შექმნილია სრული ტიპების სისტემა:
- `User` - მომხმარებლები როლებით (Consumer, Operations, Delivery, Admin)
- `Product` - პროდუქტები
- `Inventory` - batch-level ინვენტარი expiry tracking-ით
- `Order` - შეკვეთები lifecycle states-ით
- `OrderItem` - შეკვეთის პროდუქტები
- `InventoryAdjustment` - ინვენტარის რეგულირებები
- `AuditLog` - აუდიტის ლოგები
- `StockMovement` - მარაგის მოძრაობები

### გვერდები

#### Product Management (`src/app/(admin)/(products)/`)
- `/products` - პროდუქტების სია (ძიება, ფილტრაცია, CRUD)
- `/products/new` - ახალი პროდუქტის დამატება
- `/products/[id]` - პროდუქტის დეტალები (TODO)
- `/products/[id]/edit` - პროდუქტის რედაქტირება (TODO)

#### Inventory Management (`src/app/(admin)/(inventory)/`)
- `/inventory` - ინვენტარის სია (batch-level, expiry tracking)
- `/inventory/receive` - ინვენტარის მიღება (batch, expiry, quantity)
- `/inventory/[id]` - batch-ის დეტალები (TODO)
- `/inventory/[id]/adjust` - ინვენტარის რეგულირება (TODO)

#### Order Management (`src/app/(admin)/(orders)/`)
- `/orders` - შეკვეთების სია (ფილტრაცია სტატუსით, გადახდის სტატუსით)
- `/orders/[id]` - შეკვეთის დეტალები და სტატუსის განახლება

#### User Management (`src/app/(admin)/(users)/`)
- `/users` - მომხმარებლების სია (ფილტრაცია როლით და სტატუსით)
- `/users/new` - ახალი მომხმარებლის დამატება (TODO)
- `/users/[id]` - მომხმარებლის დეტალები (TODO)
- `/users/[id]/edit` - მომხმარებლის რედაქტირება (TODO)

#### Reporting & Audit (`src/app/(admin)/(reports)/`)
- `/reports/sales` - გაყიდვების რეპორტი
- `/reports/inventory` - ინვენტარის რეპორტი (stock movements, expiry tracking)
- `/reports/audit` - აუდიტის ლოგი (immutable audit trail)

### Navigation

განახლებულია `AppSidebar` ახალი სექციებით:
- პროდუქტები
- ინვენტარი
- შეკვეთები
- მომხმარებლები
- რეპორტები

## Inventory Management - დეტალური ლოგიკა

### Inventory States
1. **Received (Blocked)** - მიღებული, მაგრამ დაბლოკილი
2. **Available** - ხელმისაწვდომი გაყიდვისთვის
3. **Reserved** - დაჯავშნილი შეკვეთისთვის
4. **Picked** - ამოღებულია fulfillment-ისთვის
5. **Dispatched** - გაგზავნილია
6. **Consumed** - გაყიდული და მიწოდებული
7. **Expired** - ვადა გაუვიდა
8. **Rejected** - უარყოფილი

### Expiry Control
- ვადის გასვლის თარიღის tracking batch-ის დონეზე
- Near-expiry alerts (60 დღე)
- FEFO (First-Expiry-First-Out) allocation logic

### Availability Calculation
```
Available Quantity = Total Available Stock - Reserved Stock - Blocked Stock - Expired Stock
```

## Order Lifecycle

1. **Created** - შექმნილია
2. **Confirmed** - დადასტურებულია
3. **Packed** - დაფასულია
4. **Out for Delivery** - გზაშია
5. **Delivered** - მიწოდებულია
6. **Cancelled** - გაუქმებულია
7. **Failed** - შეცდომა

## User Roles & RBAC

- **Consumer** - მომხმარებელი (mobile app)
- **Operations** - ოპერაციების მენეჯერი (inventory, orders)
- **Delivery** - მიტანის მენეჯერი (delivery status updates)
- **Admin** - სისტემის ადმინისტრატორი (full access)

## შემდეგი ნაბიჯები

1. **API Integration** - Backend API-სთან ინტეგრაცია
2. **Authentication** - OTP-based authentication
3. **Real-time Updates** - WebSocket ან Server-Sent Events
4. **Advanced Filtering** - მეტი ფილტრაციის ოფციები
5. **Export Functionality** - Excel/PDF export რეპორტებისთვის
6. **Notifications** - Real-time notifications
7. **Dashboard Analytics** - მეტი analytics და charts

## ტექნოლოგიები

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Hooks** - State management

## გაშვება

```bash
npm install
npm run dev
```

გახსენით [http://localhost:3000](http://localhost:3000) ბრაუზერში.
