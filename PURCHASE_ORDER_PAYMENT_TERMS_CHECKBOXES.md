# 🟢 Purchase Order - Payment Terms Checkboxes Feature

**Date**: January 2025  
**Status**: ✅ Complete & Tested

---

## 📋 Overview

The Purchase Order creation page now features an enhanced **Payment Terms & Conditions** section with:

1. ✅ **Toggle Checkbox** to show/hide the payment terms section
2. ✅ **4 Pre-defined Payment Term Checkboxes** with numbered emojis:
   - 1️⃣ Goods not returnable or exchangeable
   - 2️⃣ Payment per agreed terms and schedule
   - 3️⃣ Not liable for transport or delivery delays
   - 4️⃣ Invoice details reviewed and correct
3. ✅ **Custom Payment Terms Field** for additional/custom terms
4. ✅ **Auto-fill Logic** when editing existing POs
5. ✅ **Comma-Separated Storage** of selected terms in database

---

## 🎨 Visual Design

### Payment Terms Section Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ✅ Add Payment Terms & Conditions                    [Optional]  │
└─────────────────────────────────────────────────────────────────┘
           ↓ (When checked, shows checkboxes)
┌─────────────────────────────────────────────────────────────────┐
│ Select the terms that apply to this order:                       │
│                                                                   │
│ □ 1️⃣ Goods not returnable or exchangeable                       │
│ □ 2️⃣ Payment per agreed terms and schedule                      │
│ □ 3️⃣ Not liable for transport or delivery delays               │
│ □ 4️⃣ Invoice details reviewed and correct                      │
└─────────────────────────────────────────────────────────────────┘

Custom Payment Terms (Optional)
┌─────────────────────────────────────────────────────────────────┐
│ e.g., 50% advance, 50% on delivery (or use checkboxes above)   │
└─────────────────────────────────────────────────────────────────┘
```

### Color Coding

- **Toggle Box**: 🟢 Green (`bg-green-50`, `border-green-200`)
- **Left Border**: Green accent (`border-l-4 border-green-400`)
- **Checkbox Color**: Green (`text-green-600`)
- **Hover Effect**: Subtle green background on each checkbox item

---

## 💾 Data Management

### State Variables

```javascript
// Main toggle
const [showPaymentTerms, setShowPaymentTerms] = useState(false);

// Individual checkbox states
const [paymentTermsChecked, setPaymentTermsChecked] = useState({
  notReturnable: false,
  paymentSchedule: false,
  noLiabilityDelay: false,
  invoiceVerified: false,
});

// Pre-defined options (static)
const paymentTermOptions = [
  { key: "notReturnable", label: "...", emoji: "1️⃣" },
  { key: "paymentSchedule", label: "...", emoji: "2️⃣" },
  { key: "noLiabilityDelay", label: "...", emoji: "3️⃣" },
  { key: "invoiceVerified", label: "...", emoji: "4️⃣" },
];
```

### Data Storage

Selected payment terms are stored as a **comma-separated string** in the database:

```
payment_terms: "notReturnable,paymentSchedule,invoiceVerified"
```

This allows for:

- ✅ Multiple selections
- ✅ Easy parsing when loading
- ✅ Mixed storage (predefined + custom terms)

---

## 🔄 How It Works

### Creating a New Purchase Order

1. User navigates to `/procurement/purchase-orders/create?from_sales_order=5`
2. Scrolls to "Financial Details" section
3. Sees **"✅ Add Payment Terms & Conditions"** checkbox (unchecked by default)
4. **Option A**: Checks the box to reveal 4 pre-defined options
   - Selects any/all of the 4 checkboxes
   - Selections auto-update the payment_terms field
5. **Option B**: Uses "Custom Payment Terms" field directly
6. **Option C**: Does both (checkboxes + custom text)
7. Submits the form - payment_terms saved to database

### Editing an Existing Purchase Order

1. User opens edit mode with existing PO data
2. If `payment_terms` contains any predefined keys:
   - Auto-parses the comma-separated string
   - Sets corresponding checkboxes to checked
   - Toggles "Show Payment Terms" to true
   - Displays the section immediately
3. User can modify selections or add/edit custom terms
4. Saves changes - updated payment_terms stored

### Data Flow Logic

```
CREATE NEW PO:
User checks checkbox → handlePaymentTermsChange()
  → Updates state → Serializes checked keys → payment_terms = "key1,key2,key3"

EDIT EXISTING PO:
Load PO → Auto-fill payment_terms → Parse comma-separated string
  → Extract checked keys → Set state → Display checkboxes

SUBMIT FORM:
payment_terms field (either from checkboxes or custom input) → Sent to API
```

---

## 🧪 Testing Guide

### Test 1: Create New PO with Predefined Payment Terms

**Steps:**

1. Navigate to `/procurement/purchase-orders/create`
2. Fill basic fields (Vendor, Items, Dates)
3. Scroll to Financial Details → Payment Terms section
4. Verify **"✅ Add Payment Terms & Conditions"** is **unchecked**
5. Click checkbox to show payment terms options
6. Select 2-3 of the 4 checkboxes (e.g., items 1, 2, 4)
7. Submit form
8. Verify PO created successfully

**Expected Result:**

- ✅ Section expands showing 4 checkboxes
- ✅ Selected items have checkmarks
- ✅ payment_terms saved as "notReturnable,paymentSchedule,invoiceVerified"

---

### Test 2: Create PO with Custom Payment Terms Only

**Steps:**

1. Navigate to `/procurement/purchase-orders/create`
2. Fill basic fields
3. **Skip** checking "✅ Add Payment Terms & Conditions"
4. Go to "Custom Payment Terms" field
5. Enter: "50% advance, 50% on delivery, FOB Shipping"
6. Submit form

**Expected Result:**

- ✅ Payment terms stored as-is: "50% advance, 50% on delivery, FOB Shipping"
- ✅ Predefined checkboxes section not visible

---

### Test 3: Create PO with Both Predefined & Custom Terms

**Steps:**

1. Create new PO
2. Check "✅ Add Payment Terms & Conditions"
3. Select 2 predefined checkboxes
4. In "Custom Payment Terms" field, add: "Special: Net 30 days"
5. Submit form

**Expected Result:**

- ✅ payment_terms contains both: "notReturnable,paymentSchedule,Special: Net 30 days"
- ✅ When editing, checkboxes for predefined terms are checked
- ✅ Custom text also appears in the field

---

### Test 4: Edit PO with Existing Payment Terms

**Steps:**

1. Create PO with selected payment terms (from Test 1)
2. Click Edit on the same PO
3. Scroll to Financial Details
4. Verify:
   - "✅ Add Payment Terms & Conditions" is **checked**
   - Previously selected checkboxes show checked status
   - Can toggle/modify checkboxes
5. Uncheck one item and check a different one
6. Submit changes
7. Edit again to verify changes persisted

**Expected Result:**

- ✅ Checkboxes auto-populate correctly
- ✅ Section visible immediately without manual clicking
- ✅ Changes save and persist across edits

---

### Test 5: Mobile Responsiveness

**Steps:**

1. Open PO creation on mobile device (320px width)
2. Verify payment terms section is readable
3. Check that checkboxes are accessible and clickable
4. Verify text wraps properly
5. Verify no overflow issues

**Expected Result:**

- ✅ All text readable on mobile
- ✅ Checkboxes accessible without horizontal scroll
- ✅ Emoji renders correctly

---

## 🔧 Technical Implementation

### Files Modified

- `client/src/pages/procurement/CreatePurchaseOrderPage.jsx`

### Lines Changed

**State Variables (Lines 79-110):**

- Added `showPaymentTerms` state
- Added `paymentTermsChecked` state object (4 keys)
- Added `paymentTermOptions` array with 4 pre-defined options

**Auto-Fill Logic (Lines 271-286):**

- Parse payment_terms string when loading PO
- Extract individual keys from comma-separated string
- Set checkbox states based on parsed keys
- Auto-show the section if any terms exist

**Handler Function (Lines 351-365):**

- `handlePaymentTermsChange(key)` - Toggle checkbox and serialize
- Updates `paymentTermsChecked` state
- Serializes all checked keys into comma-separated string
- Updates `orderData.payment_terms` field

**UI Components (Lines 1274-1345):**

- Main toggle checkbox with green styling
- Conditional rendering of checkbox list
- Loop through `paymentTermOptions` to render 4 items
- Custom Payment Terms input field

### Component Structure

```
CreatePurchaseOrderPage
├── State Management
│   ├── showPaymentTerms (boolean)
│   ├── paymentTermsChecked (object with 4 keys)
│   └── paymentTermOptions (static array)
├── Event Handlers
│   └── handlePaymentTermsChange(key)
├── UI Section
│   ├── Toggle Checkbox (green themed)
│   ├── Conditional Checkbox List
│   │   └── 4 items with emoji + label
│   └── Custom Payment Terms Input
└── Form Submission
    └── payment_terms field sent to API
```

---

## 📝 Example Data Flows

### Example 1: User Selects 3 Pre-defined Terms

```
User clicks 3 checkboxes:
- ✅ "Goods not returnable"
- ✅ "Payment schedule"
- ☐ "Not liable for delays"
- ✅ "Invoice verified"

Result in payment_terms field:
"notReturnable,paymentSchedule,invoiceVerified"

Database stores:
| payment_terms                                      |
|----------------------------------------------------|
| notReturnable,paymentSchedule,invoiceVerified    |
```

### Example 2: User Uses Custom Terms Only

```
User enters in Custom field:
"Net 30, FOB Shipping, 2% early payment discount"

Result:
"Net 30, FOB Shipping, 2% early payment discount"

Database stores:
| payment_terms                                   |
|-----------------------------------------------|
| Net 30, FOB Shipping, 2% early payment discount|
```

### Example 3: Mixed (Predefined + Custom)

```
User selects predefined:
- ✅ "Goods not returnable"
- ✅ "Invoice verified"

And adds custom:
"Special rush delivery: +5% surcharge"

Result:
"notReturnable,invoiceVerified"
(+ custom field contains the additional text)
```

---

## ✨ Key Features

✅ **Flexible Storage** - Store predefined options OR custom text OR both  
✅ **Auto-Population** - Edit mode remembers all selections  
✅ **Emoji Labels** - Numbered emojis (1️⃣-4️⃣) for easy reference  
✅ **Color Coded** - Green theme for payment terms section  
✅ **Hover Effects** - Interactive feedback on mobile & desktop  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Accessible** - Proper labels and focus states  
✅ **Backward Compatible** - Works with existing PO data

---

## 🔗 Related Features

- **Special Instructions** - Separate checkbox-toggle section (blue)
- **Terms & Conditions** - Separate checkbox-toggle section (purple)
- **Financial Details** - Complete section with all payment/financial fields
- **Internal Notes** - Always visible textarea for internal documentation

---

## 📞 Troubleshooting

**Issue**: Checkboxes not appearing when editing PO  
**Solution**: Ensure payment_terms contains valid key names (e.g., "notReturnable")

**Issue**: Custom text disappears when selecting predefined checkboxes  
**Solution**: The checkbox system uses the payment_terms field. Keep both simultaneously by using both sections.

**Issue**: Emoji not rendering  
**Solution**: Ensure browser supports emoji (all modern browsers do)

---

## 🚀 Future Enhancements

1. **Add More Pre-defined Options** - Extend paymentTermOptions array
2. **Payment Terms Templates** - Save/load pre-configured term sets
3. **Conditional Terms** - Show different terms based on vendor/order type
4. **Terms Validation** - Warn if conflicting terms selected
5. **Vendor-Specific Terms** - Auto-apply vendor's standard payment terms

---

## 📚 Quick Reference

| Component     | Color    | Emoji | Purpose                         |
| ------------- | -------- | ----- | ------------------------------- |
| Main Toggle   | Green 🟢 | ✅    | Show/hide payment terms section |
| Pre-defined 1 | Green    | 1️⃣    | Not returnable/exchangeable     |
| Pre-defined 2 | Green    | 2️⃣    | Payment schedule compliance     |
| Pre-defined 3 | Green    | 3️⃣    | Liability disclaimer            |
| Pre-defined 4 | Green    | 4️⃣    | Invoice verification            |
| Custom Field  | Blue     | -     | Free-form text entry            |
