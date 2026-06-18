# Delivery Integration - Mobile App

## 📱 Overview

Mobile app delivery flow integrates Quickshipper API to provide delivery options during checkout.

---

## 🔄 **User Flow:**

```
1. Cart Screen
   └─> Click "შეკვეთის გაფორმება"
   
2. Delivery Address Screen (NEW)
   - User inputs street address and city
   - Auto-geocoding (mock for now, TODO: Google Maps API)
   - Continue to delivery options
   
3. Delivery Options Screen (NEW)
   - Fetches delivery providers from Quickshipper
   - Shows available options with:
     * Provider logos
     * Delivery speed (45 min, 4 days, etc.)
     * Prices
     * Service fees
     * Features (car delivery, scheduled, cash on delivery)
   - User selects preferred provider
   - Continue to payment
   
4. Payment Screen (UPDATED)
   - Shows cart total + delivery fee
   - BOG payment integration
   - Creates order with delivery info
   
5. Order Success
   - Tracking number
   - Delivery status
```

---

## 📁 **New Files Created:**

### **1. Service:**
- `src/services/delivery.service.ts` - Delivery API client
  - `calculateDeliveryFees()` - Gets delivery options
  - `getPharmacyAddress()` - Default dispatch location
  - TypeScript interfaces for API responses

### **2. Screens:**
- `src/screens/DeliveryAddressScreen.tsx` - Address input form
  - Street name input
  - City input (default: თბილისი)
  - Quick address buttons (Home/Work)
  - Delivery info card
  
- `src/screens/DeliveryOptionsScreen.tsx` - Provider selection
  - Fetches providers from API
  - Provider cards with logos, prices, speeds
  - Radio button selection
  - Total calculation (delivery + service fee)
  - Features display (car, scheduled, COD)

### **3. Routes:**
- `app/delivery-address.tsx` - Route wrapper for address screen
- `app/delivery-options.tsx` - Route wrapper for options screen

### **4. Updated Files:**
- `app/cart.tsx` - Changed checkout flow to go to `/delivery-address` first
- `src/screens/index.ts` - Added new screen exports

---

## 🔌 **API Integration:**

### **Endpoint:**
```typescript
POST /api/quickshipper/fees
```

### **Request:**
```typescript
{
  fromStreetName: string,
  fromCityName: string,
  fromLatitude: number,
  fromLongitude: number,
  toStreetName: string,
  toCityName: string,
  toLatitude: number,
  toLongitude: number
}
```

### **Response:**
```typescript
{
  fees: [
    {
      providerName: "Wolt",
      providerId: 2,
      providerLogoUrl: "https://...",
      prices: [
        {
          amount: 5.5,
          currency: "₾",
          deliverySpeedName: "45 min ⚡"
        }
      ],
      serviceFee: 0.6,
      minPrice: 5.5,
      ...features
    }
  ],
  distance: 4.73,
  success: true
}
```

---

## 💾 **Data Flow (AsyncStorage):**

### **Step 1: Delivery Address Screen**
```typescript
// User submits address
const address = {
  streetName: "ვაჟა-ფშაველას 45",
  cityName: "თბილისი",
  latitude: 41.7151,
  longitude: 44.8271
};

await AsyncStorage.setItem('deliveryAddress', JSON.stringify(address));
router.push('/delivery-options');
```

### **Step 2: Delivery Options Screen**
```typescript
// Load address
const address = JSON.parse(await AsyncStorage.getItem('deliveryAddress'));

// User selects provider
const selectedDelivery = {
  provider: {...},
  selectedPrice: {...},
  fromAddress: pharmacyAddress,
  toAddress: address,
  distance: 4.73
};

await AsyncStorage.setItem('selectedDelivery', JSON.stringify(selectedDelivery));
router.push('/payment');
```

### **Step 3: Payment Screen (TODO - UPDATE)**
```typescript
// Load delivery info
const delivery = JSON.parse(await AsyncStorage.getItem('selectedDelivery'));

// Calculate total
const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
const deliveryTotal = delivery.selectedPrice.amount + delivery.provider.serviceFee;
const grandTotal = cartTotal + deliveryTotal;

// Create order with delivery info
const order = {
  items: cart,
  deliveryProvider: delivery.provider,
  deliveryFee: delivery.selectedPrice.amount,
  deliveryServiceFee: delivery.provider.serviceFee,
  deliveryAddress: delivery.toAddress,
  deliverySpeed: delivery.selectedPrice.deliverySpeedName,
  total: grandTotal
};
```

---

## 🎨 **UI Features:**

### **Delivery Address Screen:**
- Clean form design
- Info card explaining what's needed
- Quick address buttons (Home/Work)
- Delivery info preview (time, cost ranges)
- Disabled state for empty fields
- Loading state during geocoding

### **Delivery Options Screen:**
- Provider cards with:
  - Logo images
  - Provider name
  - Delivery speeds with icons (⚡ for fast, ⏱ for slow)
  - Price display
  - Service fee breakdown
  - Feature badges (car, scheduled, COD)
  - Radio button selection
- Address display with "Change" button
- Distance indicator
- Total calculation in footer
- Empty state for no providers
- Loading state during API call

---

## 🚧 **TODO - Next Steps:**

### **1. Payment Screen Update (CRITICAL)**
- [ ] Read `selectedDelivery` from AsyncStorage
- [ ] Display delivery info in summary
- [ ] Add delivery fee to total amount
- [ ] Include delivery data in order creation API call

### **2. Backend Order Schema Update**
- [ ] Add delivery fields to Order model:
  ```typescript
  {
    deliveryAddress: { streetName, city, lat, lng },
    deliveryProvider: { id, name, logoUrl },
    deliveryFee: number,
    deliveryServiceFee: number,
    deliverySpeed: string,
    quickshipperTrackingNumber?: string,
    deliveryStatus?: string
  }
  ```

### **3. Geocoding Integration**
- [ ] Replace mock geocoding with Google Maps Geocoding API
- [ ] Add location picker (map view)
- [ ] Save favorite addresses

### **4. Admin Panel Updates**
- [ ] Display delivery info in order details
- [ ] "Send to Quickshipper" button
- [ ] Auto-create delivery order when status = "Ready"
- [ ] Show tracking number and courier info

### **5. Order Tracking**
- [ ] Create delivery tracking screen in mobile app
- [ ] Integrate `GET /api/quickshipper/order/status`
- [ ] Show delivery timeline
- [ ] Display courier info (name, phone)

---

## 📝 **Current Status:**

### ✅ **Completed:**
- Backend Quickshipper integration
- OAuth authentication & token caching
- Delivery fees API endpoint
- Mobile delivery service client
- Delivery address input screen
- Delivery options selection screen
- Routing & navigation flow
- AsyncStorage data persistence
- UI/UX design
- TypeScript types & interfaces

### 🚧 **In Progress:**
- Payment screen update (needs delivery info integration)
- Order creation with delivery data

### 📋 **Pending:**
- Backend Order schema update
- Real geocoding integration
- Admin panel delivery management
- Mobile order tracking

---

## 🧪 **Testing:**

### **Test Flow:**
1. Open mobile app
2. Add products to cart
3. Click "შეკვეთის გაფორმება"
4. Enter delivery address (e.g., "ვაჟა-ფშაველას 45, თბილისი")
5. Click "გაგრძელება"
6. View delivery providers (Wolt, Glovo, GeorgianPost, etc.)
7. Select a provider
8. Check total calculation (cart + delivery + service fee)
9. Click "გაგრძელება გადახდაზე"
10. Verify data in AsyncStorage:
    ```javascript
    AsyncStorage.getItem('deliveryAddress')
    AsyncStorage.getItem('selectedDelivery')
    ```

---

## 🔗 **API Reference:**

- Backend Quickshipper Service: `aphoteka-backend/src/quickshipper/`
- Test Environment:
  - Auth: `https://test-auth.quickshipper.ge`
  - API: `https://delivery-test.quickshipper.ge`
- Credentials: Stored in `.env` file
