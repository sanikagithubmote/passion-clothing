# ✅ Payment Terms Checkboxes - Quick Start Guide

**Status**: ✅ Ready to Use  
**Date**: January 2025

---

## 🚀 What's New?

The Purchase Order creation/editing page now has an **enhanced Payment Terms section** with:

1. **Toggle checkbox** to show/hide payment terms
2. **4 pre-defined payment condition checkboxes** with numbered emojis
3. **Custom payment terms field** for free-form text
4. **Auto-fill** when editing existing POs

---

## 📍 Location

**Page URL**: `http://localhost:3000/procurement/purchase-orders/create`

**Path**: Scroll to → **Financial Details** section → **Payment Terms & Conditions** (green section)

---

## 🎯 How to Use

### Step 1️⃣: Access Payment Terms Section

In the Financial Details area, find the **green section** labeled:

```
✅ Add Payment Terms & Conditions                [Optional]
```

### Step 2️⃣: Enable Payment Terms (Optional)

Click the checkbox to reveal 4 pre-defined payment conditions:

```
☐ 1️⃣ Goods not returnable or exchangeable
☐ 2️⃣ Payment per agreed terms and schedule
☐ 3️⃣ Not liable for transport or delivery delays
☐ 4️⃣ Invoice details reviewed and correct
```

### Step 3️⃣: Select Applicable Conditions

Check any/all of the 4 conditions that apply to this purchase order:

- ✅ If you want to specify that goods are non-returnable → Check box 1
- ✅ If payment must follow the agreed schedule → Check box 2
- ✅ If you're not liable for delays → Check box 3
- ✅ If invoice details should be verified → Check box 4

### Step 4️⃣: Add Custom Terms (Optional)

Below the checkboxes, find the **Custom Payment Terms** field:

```
Custom Payment Terms (Optional)
┌─────────────────────────────────────────────────┐
│ e.g., 50% advance, 50% on delivery              │
└─────────────────────────────────────────────────┘
```

Enter any additional custom terms like:

- "50% advance, 50% on delivery"
- "Net 30 days"
- "2% early payment discount"
- "FOB Shipping"

### Step 5️⃣: Save

Submit the form - all selected payment terms are automatically saved to the database!

---

## 📊 What Gets Saved?

### Example 1: Using Predefined Checkboxes Only

If you select items 1, 2, and 4:

```
Database stores: "notReturnable,paymentSchedule,invoiceVerified"
```

### Example 2: Using Custom Field Only

If you enter custom text:

```
Database stores: "50% advance, 50% on delivery, Net 30"
```

### Example 3: Mixed (Checkboxes + Custom)

If you select predefined items AND add custom text:

```
Selected: boxes 1, 3
Custom field: "Net 30 days"
Database stores both combined
```

---

## ✏️ Editing Existing POs

When you **edit** an existing Purchase Order:

1. If payment terms were saved, the **✅ Add Payment Terms & Conditions** checkbox is **automatically checked**
2. **Pre-defined conditions are automatically selected** based on saved terms
3. **Custom text** is pre-filled in the custom field
4. You can modify any of these before saving

---

## 🎨 Visual Guide

```
FINANCIAL DETAILS
─────────────────────────────────────────────────

Discount (%)              Tax/GST (%)         Freight (₹)
[_____]                   [Select: 12%]       [_____]

Custom Payment Terms (Optional)
[________________________________]

┌─────────────────────────────────────────────────┐
│ ✅ Add Payment Terms & Conditions  [Optional]  │
└─────────────────────────────────────────────────┘
        ↓ Click to expand ↓

┌─────────────────────────────────────────────────┐
│ Select the terms that apply to this order:     │
│                                                 │
│ ☐ 1️⃣ Goods not returnable or exchangeable    │
│ ☐ 2️⃣ Payment per agreed terms and schedule   │
│ ☐ 3️⃣ Not liable for transport/delivery      │
│ ☐ 4️⃣ Invoice details reviewed and correct   │
│                                                 │
└─────────────────────────────────────────────────┘

Special Instructions          Terms & Conditions
[Checkbox section]            [Checkbox section]
```

---

## 💡 Use Cases

### Use Case 1: B2B Vendor Order

```
✅ Check: 1️⃣ Non-returnable
✅ Check: 2️⃣ Payment schedule
✅ Check: 4️⃣ Invoice verified
Custom: "Net 30 days"
```

### Use Case 2: First-Time Vendor

```
✅ Check: 3️⃣ No liability for delays (protection)
Custom: "50% advance, 50% on delivery"
```

### Use Case 3: Standard Local Vendor

```
✅ Check: 1️⃣, 2️⃣, 4️⃣ (all standard terms)
Custom: (leave empty - use predefined only)
```

### Use Case 4: International Supplier

```
✅ Check: 1️⃣, 3️⃣ (no returns, no liability)
Custom: "FOB Shipping, 30% advance, 70% on delivery, LC Credit Terms"
```

---

## ✨ Key Features

- 🟢 **Green Color Theme** - Easy to identify the payment terms section
- 1️⃣2️⃣3️⃣4️⃣ **Numbered Emojis** - Clear visual markers for each option
- 🔄 **Auto-Fill on Edit** - Previously saved terms are automatically populated
- 🎯 **Flexible** - Use predefined, custom, or both together
- 📱 **Responsive** - Works on all screen sizes
- ♿ **Accessible** - Proper labels and keyboard support

---

## 🔗 Related Sections

In the same Financial Details area, you'll also find:

| Section              | Color     | Purpose                         |
| -------------------- | --------- | ------------------------------- |
| Payment Terms (NEW)  | 🟢 Green  | Pre-defined payment conditions  |
| Special Instructions | 🔵 Blue   | Packaging, delivery notes, etc. |
| Terms & Conditions   | 🟣 Purple | General T&C text                |
| Internal Notes       | -         | Internal documentation          |

---

## 🆘 Troubleshooting

**Q: Where do I find the payment terms section?**  
A: Scroll to "Financial Details" in the PO creation form. Look for the green section with ✅ emoji.

**Q: Can I use both checkboxes and custom text?**  
A: Yes! You can mix and match. Checkboxes create a list of pre-defined terms, and custom field allows additional text.

**Q: Will my selections be saved when I edit the PO?**  
A: Yes! When you open an existing PO for editing, all selected terms will be pre-populated.

**Q: What if I select no checkboxes?**  
A: You can still use the custom payment terms field for free-form text entry.

**Q: Can I add more than 4 predefined conditions?**  
A: Currently, there are 4 standard conditions. Custom field allows unlimited custom text.

---

## 📝 Technical Details

**Files Modified**:

- `client/src/pages/procurement/CreatePurchaseOrderPage.jsx`

**Storage Format**:

- Comma-separated values (e.g., "notReturnable,paymentSchedule,invoiceVerified")

**Data Field**:

- `payment_terms` in purchase_orders table

**State Management**:

- `showPaymentTerms` - Controls visibility of section
- `paymentTermsChecked` - Tracks which checkboxes are selected

---

## 🚀 Next Steps

1. ✅ Navigate to Purchase Order creation page
2. ✅ Create a test PO and use the payment terms feature
3. ✅ Edit the PO to verify terms are auto-populated
4. ✅ Try different combinations (predefined only, custom only, both)
5. ✅ Verify all data is correctly saved and displayed

---

**Ready to use!** 🎉
