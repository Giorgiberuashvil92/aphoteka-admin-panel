# Quickshipper Integration Guide

## 📦 Overview

Quickshipper integration provides delivery management for Aphoteka orders. The system handles:
- Delivery fee calculation
- Order creation in Quickshipper
- Order tracking and status updates

---

## 🔐 Authentication

Quickshipper uses **OAuth 2.0 Password Grant** flow.

### Required Credentials:

Add these to your `.env` file:

```env
QUICKSHIPPER_BASE_URL=https://api.quickshipper.ge
QUICKSHIPPER_USERNAME=your-username-here
QUICKSHIPPER_PASSWORD=your-password-here
```

### How Authentication Works:

1. **Client Credentials** (hardcoded in service):
   - Client ID: `DeliveryApiClient`
   - Client Secret: `DeliveryApiSecret`
   - Sent as Basic Auth header

2. **User Credentials** (from `.env`):
   - Username and Password
   - Sent in request body

3. **Token Management**:
   - Access token is cached
   - Auto-refreshed before expiry
   - 60-second safety margin

---

## 📡 API Endpoints

### 1️⃣ **Calculate Delivery Fee**

**POST** `/quickshipper/fees`

**Access:** Public (no auth required)

**Request Body:**
```json
{
  "fromAddress": {
    "city": "თბილისი",
    "address": "რუსთაველის 15"
  },
  "toAddress": {
    "city": "თბილისი",
    "address": "ვაჟა-ფშაველას 45"
  },
  "weight": 0.5,
  "dimensions": {
    "length": 20,
    "width": 15,
    "height": 10
  }
}
```

**Response:**
```json
{
  "fee": 5.50,
  "currency": "GEL",
  "estimatedDeliveryTime": "2024-06-17T15:00:00Z",
  "deliveryOptions": [
    {
      "type": "standard",
      "fee": 5.50,
      "estimatedTime": "3-5 hours"
    },
    {
      "type": "express",
      "fee": 8.00,
      "estimatedTime": "1-2 hours"
    }
  ]
}
```

---

### 2️⃣ **Create Delivery Order**

**POST** `/quickshipper/order`

**Access:** Admin only (requires JWT auth)

**Request Body:**
```json
{
  "orderId": "ORD-123456",
  "fromAddress": {
    "city": "თბილისი",
    "address": "რუსთაველის 15",
    "contactName": "აფთიაქი აფოთეკა",
    "contactPhone": "+995555123456"
  },
  "toAddress": {
    "city": "თბილისი",
    "address": "ვაჟა-ფშაველას 45",
    "contactName": "გიორგი ბერუაშვილი",
    "contactPhone": "+995555987654"
  },
  "items": [
    {
      "name": "პარაცეტამოლი 500მგ",
      "quantity": 2,
      "price": 3.50
    }
  ],
  "totalAmount": 7.00,
  "deliveryFee": 5.50,
  "paymentMethod": "paid",
  "notes": "დარეკეთ ადრე"
}
```

**Response:**
```json
{
  "orderId": "ORD-123456",
  "trackingNumber": "QS-789456123",
  "status": "pending_pickup",
  "estimatedDeliveryDate": "2024-06-17T15:00:00Z"
}
```

---

### 3️⃣ **Track Order Status**

**GET** `/quickshipper/order/status?orderId=ORD-123456`

**Access:** Public (no auth required)

**Query Parameters:**
- `orderId` (required): Your internal order ID

**Response:**
```json
{
  "orderId": "ORD-123456",
  "trackingNumber": "QS-789456123",
  "status": "in_transit",
  "currentLocation": "ვაკე რაიონი",
  "estimatedDelivery": "2024-06-17T15:00:00Z",
  "courierName": "ლაშა გ.",
  "courierPhone": "+995555111222",
  "history": [
    {
      "status": "pending_pickup",
      "timestamp": "2024-06-17T10:00:00Z"
    },
    {
      "status": "picked_up",
      "timestamp": "2024-06-17T11:30:00Z"
    },
    {
      "status": "in_transit",
      "timestamp": "2024-06-17T12:00:00Z"
    }
  ]
}
```

---

## 🔄 Integration Flow

### **Mobile App (Checkout):**

1. User fills delivery address
2. App calls `POST /quickshipper/fees` with address
3. Display delivery options and fees
4. User selects delivery option
5. Total = Product Price + Delivery Fee
6. User pays via BOG
7. Order created in database

### **Admin Panel (Order Management):**

1. Admin sees new order with status "Pending"
2. Admin prepares order, changes status to "Ready for Delivery"
3. System automatically calls `POST /quickshipper/order`
4. Quickshipper tracking number saved to order
5. Courier picks up from pharmacy
6. Admin and user can track delivery status

### **Mobile App (Tracking):**

1. User opens "My Orders"
2. Clicks on order to see details
3. App calls `GET /quickshipper/order/status?orderId=XXX`
4. Display tracking timeline and courier info

---

## 🏗️ Implementation Status

### ✅ **Completed:**
- Quickshipper service with OAuth authentication
- Token caching and auto-refresh
- API endpoints for fees, order creation, tracking
- TypeScript interfaces
- Error handling and logging

### 🚧 **Next Steps:**

1. **Get Credentials:**
   - Obtain Quickshipper username and password
   - Update `.env` file
   - Test authentication

2. **Mobile App:**
   - Create delivery selection screen
   - Integrate fee calculation API
   - Update checkout flow

3. **Admin Panel:**
   - Add delivery management UI
   - Auto-create Quickshipper order on status change
   - Display tracking info

4. **Order Schema:**
   - Add delivery fields (address, fee, tracking number)
   - Update order status enum

---

## 🧪 Testing

### Test Authentication:
```bash
# Test via backend logs
curl -X POST http://localhost:3000/quickshipper/fees \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": {"city": "თბილისი", "address": "test"},
    "toAddress": {"city": "თბილისი", "address": "test"}
  }'
```

If credentials are correct, you'll see in logs:
```
[QuickshipperService] Quickshipper access token obtained successfully
```

---

## 📞 Support

- Quickshipper API Docs: https://app.theneo.io/quickshipper/delivery
- Contact Quickshipper support for credentials
