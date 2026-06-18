# Saved Addresses Feature - Documentation

## Overview

The Saved Addresses feature allows users to save, manage, and quickly select delivery addresses during checkout. This improves the user experience by eliminating the need to re-enter addresses each time.

## Files Added/Modified

### New Files

1. **`src/services/savedAddresses.service.ts`**
   - Service for managing saved addresses
   - Stores addresses in AsyncStorage
   - Provides default "სახლი" (Home) and "სამსახური" (Work) addresses
   - Methods:
     - `getAll()`: Get all saved addresses
     - `save()`: Save a new address
     - `update()`: Update an existing address
     - `delete()`: Delete an address

2. **`src/screens/ManageAddressesScreen.tsx`**
   - Full-screen interface for managing saved addresses
   - Features:
     - View all saved addresses
     - Edit address details
     - Delete addresses
     - Empty state UI
     - Modal interface for editing

3. **`app/manage-addresses.tsx`**
   - Expo Router wrapper for ManageAddressesScreen

### Modified Files

1. **`src/screens/DeliveryAddressScreen.tsx`**
   - Updated to load and display saved addresses dynamically
   - Added "მართვა" (Manage) button to navigate to address management
   - Quick selection buttons now:
     - Display saved addresses with icons and labels
     - Show full address preview
     - Update form fields when clicked
   - Enhanced UI:
     - Better visual hierarchy
     - Chevron indicators
     - Improved styling

2. **`app/delivery-address.tsx`**
   - Added `handleManageAddresses` callback
   - Navigates to `/manage-addresses` route

3. **`src/screens/index.ts`**
   - Added `ManageAddressesScreen` export

## User Flow

### Delivery Address Selection

1. User goes to cart and clicks "Checkout"
2. **Delivery Address Screen** opens:
   - Shows form with City and Street inputs
   - Shows "შენახული მისამართები" (Saved Addresses) section
   - Lists saved addresses with icons, labels, and previews
   - "მართვა" (Manage) button in top-right of saved addresses section

3. User can either:
   - **Option A**: Click a saved address → fields auto-populate → edit if needed → Continue
   - **Option B**: Manually enter address → Continue
   - **Option C**: Click "მართვა" (Manage) → Go to Management Screen

### Address Management

1. User clicks "მართვა" (Manage)
2. **Manage Addresses Screen** opens:
   - Lists all saved addresses
   - Each card shows:
     - Icon (home, briefcase, etc.)
     - Label (სახლი, სამსახური, etc.)
     - Street name
     - City name
   - Actions per address:
     - ✏️ Edit button (opens modal)
     - 🗑️ Delete button (confirmation alert)

3. **Edit Modal**:
   - Edit label (e.g., "სახლი", "ბიძაშენის ბინა")
   - Edit street name
   - Edit city
   - "შენახვა" (Save) / "გაუქმება" (Cancel)

## Data Structure

```typescript
interface SavedAddress {
  id: string;
  label: string; // "სახლი", "სამსახური", etc.
  icon: string; // Ionicons name
  streetName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}
```

## Storage

- **Location**: AsyncStorage
- **Key**: `@saved_addresses`
- **Format**: JSON array of `SavedAddress` objects
- **Default addresses**: 
  - სახლი (Home) - ვაჟა-ფშაველას 45, თბილისი
  - სამსახური (Work) - რუსთაველის 15, თბილისი

## UI/UX Features

### Delivery Address Screen

- **Quick Selection Cards**:
  - Large, tappable cards with borders
  - Icon on left (home, briefcase, etc.)
  - Label and street preview
  - Chevron indicator on right
  - Purple theme (#5B5FC7)

- **Manage Button**:
  - Top-right of "შენახული მისამართები" section
  - Settings icon + "მართვა" text
  - Light purple background

### Manage Addresses Screen

- **Address Cards**:
  - Icon in circular container
  - Label, street, and city info
  - Edit and delete action buttons
  - Clean shadow effects

- **Edit Modal**:
  - iOS-style sheet presentation
  - Header with "გაუქმება" / "მისამართის რედაქტირება" / "შენახვა"
  - Form inputs for label, street, city
  - Large, accessible text inputs

- **Empty State**:
  - Location icon
  - "შენახული მისამართები არ არის" message
  - Displayed when no addresses exist

## Future Enhancements

1. **Add New Address**: Button to create entirely new addresses (not just edit existing)
2. **Icon Picker**: UI to select different icons for addresses
3. **Map Integration**: Visual map picker for precise location selection
4. **Address Verification**: Validate addresses with Quickshipper API before saving
5. **Primary Address**: Mark one address as default/primary
6. **Address Categories**: More address types beyond "Home" and "Work" (parents, friends, etc.)

## Testing

To test the feature:

1. Navigate to cart → checkout
2. Verify saved addresses are shown
3. Click a saved address → verify fields populate
4. Edit fields manually → continue
5. Click "მართვა" (Manage)
6. Edit an address → save → verify changes persist
7. Delete an address → confirm deletion
8. Return to delivery address screen → verify updated list
