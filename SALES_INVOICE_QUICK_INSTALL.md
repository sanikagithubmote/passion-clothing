# ⚡ Sales Invoice - Quick Install (10 Minutes)

## ✅ What's Ready

3 files created:

- ✅ `client/src/components/sales/InvoiceStatusPanel.jsx`
- ✅ `client/src/components/sales/InvoiceManagementModal.jsx`
- ✅ `server/routes/sales.js` - endpoint added

---

## 🎯 ONE Thing to Do: Update SalesOrdersPage.jsx

File: `client/src/pages/sales/SalesOrdersPage.jsx`

### Step 1️⃣: Add Imports (Line 1-33)

Find this section:

```javascript
import {
  FaPlus,
  FaSearch,
  // ... other imports ...
  FaCalendarAlt,
} from "react-icons/fa";
```

**Add before the closing brace:**

```javascript
import InvoiceStatusPanel from "../../components/sales/InvoiceStatusPanel";
import InvoiceManagementModal from "../../components/sales/InvoiceManagementModal";
```

### Step 2️⃣: Add State Variables (After Line 81)

Find:

```javascript
const [showActionMenu, setShowActionMenu] = useState(null);
const [showColumnMenu, setShowColumnMenu] = useState(false);
```

**Add after:**

```javascript
const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
```

### Step 3️⃣: Add Summary Card (Around Line 318)

Find this array:

```javascript
{
  [
    {
      label: "Total Orders",
      value: summary.total_orders,
      icon: FaShoppingCart,
      color: "blue",
    },
    {
      label: "Pending",
      value: summary.pending_orders,
      icon: FaClock,
      color: "amber",
    },
    {
      label: "In Production",
      value: summary.in_production_orders,
      icon: FaCog,
      color: "orange",
    },
    {
      label: "Delivered",
      value: summary.delivered_orders,
      icon: FaCheck,
      color: "green",
    },
  ];
}
```

**Change to:**

```javascript
{
  [
    {
      label: "Total Orders",
      value: summary.total_orders,
      icon: FaShoppingCart,
      color: "blue",
    },
    {
      label: "Pending",
      value: summary.pending_orders,
      icon: FaClock,
      color: "amber",
    },
    {
      label: "In Production",
      value: summary.in_production_orders,
      icon: FaCog,
      color: "orange",
    },
    {
      label: "Delivered",
      value: summary.delivered_orders,
      icon: FaCheck,
      color: "green",
    },
    {
      label: "Invoices",
      value: summary.invoices_generated || 0,
      icon: FaFileInvoice,
      color: "indigo",
    },
  ];
}
```

**Update color mapping (around line 320):**

Find:

```javascript
const bgColor = {
  blue: "bg-blue-50",
  amber: "bg-amber-50",
  orange: "bg-orange-50",
  green: "bg-green-50",
}[card.color];
const iconBg = {
  blue: "bg-blue-100",
  amber: "bg-amber-100",
  orange: "bg-orange-100",
  green: "bg-green-100",
}[card.color];
const iconColor = {
  blue: "text-blue-600",
  amber: "text-amber-600",
  orange: "text-orange-600",
  green: "text-green-600",
}[card.color];
```

**Change to:**

```javascript
const bgColor = {
  blue: "bg-blue-50",
  amber: "bg-amber-50",
  orange: "bg-orange-50",
  green: "bg-green-50",
  indigo: "bg-indigo-50",
}[card.color];
const iconBg = {
  blue: "bg-blue-100",
  amber: "bg-amber-100",
  orange: "bg-orange-100",
  green: "bg-green-100",
  indigo: "bg-indigo-100",
}[card.color];
const iconColor = {
  blue: "text-blue-600",
  amber: "text-amber-600",
  orange: "text-orange-600",
  green: "text-green-600",
  indigo: "text-indigo-600",
}[card.color];
```

### Step 4️⃣: Add Invoice Button to Table (In table rendering)

Find where action buttons are rendered in the table. Add this button:

```javascript
<button
  onClick={() => {
    setSelectedOrderForInvoice(order);
    setShowInvoiceModal(true);
  }}
  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
  title="Manage Invoices"
>
  <FaFileInvoice size={16} />
</button>
```

### Step 5️⃣: Add Invoice Modal (End of Return)

Find the end of the main return statement (around line 850+).

**Before the last closing tag `</div>`, add:**

```javascript
{
  /* Invoice Management Modal */
}
<InvoiceManagementModal
  order={selectedOrderForInvoice}
  isOpen={showInvoiceModal}
  onClose={() => {
    setShowInvoiceModal(false);
    setSelectedOrderForInvoice(null);
  }}
/>;
```

---

## 🧪 Test It (3 Steps)

### 1. Start Backend

```bash
cd server
npm start
```

### 2. Start Frontend

```bash
cd client
npm start
```

### 3. Test Invoice Feature

```
1. Go to http://localhost:3000/sales/dashboard
2. Should see new "Invoices" card in summary
3. Find any order in table
4. Click invoice button (📄 icon)
5. Modal opens
6. Click "Generate Invoice"
7. Wait for "Invoice generation initiated"
8. Should see invoice in list
9. Click Download button
```

---

## ✅ Checklist

- [ ] Copied `InvoiceStatusPanel.jsx` to `client/src/components/sales/`
- [ ] Copied `InvoiceManagementModal.jsx` to `client/src/components/sales/`
- [ ] Added imports to SalesOrdersPage
- [ ] Added state variables
- [ ] Added invoice summary card
- [ ] Added invoice button to table
- [ ] Added invoice modal to page
- [ ] Backend server running
- [ ] Frontend running
- [ ] Tested: Click invoice button
- [ ] Tested: Generate invoice
- [ ] Tested: Download invoice

---

## 🎉 Result

**Invoice Status showing on Sales Dashboard:**

```
📊 Summary Cards (5 cards now):
├─ Total Orders: 12
├─ Pending: 3
├─ In Production: 2
├─ Delivered: 4
└─ Invoices: 7  ✨ NEW

📋 Each Order Row:
├─ Order Info (SO number, customer, amount)
├─ Status badges
└─ [Action Buttons] - now includes 📄 Invoices button

🗂️ Invoice Management Modal:
├─ Pending count
├─ Generated count
├─ [Generate Invoice] button
└─ List of generated documents with Download/Print
```

---

## 🐛 Troubleshooting

**Problem:** Invoice button not visible

- ✅ Did you add import?
- ✅ Did you add state variables?
- ✅ Did you add button to table?

**Problem:** Modal won't open

- ✅ Check browser console for errors
- ✅ Verify button click handler added correctly

**Problem:** Generate button doesn't work

- ✅ Check backend is running
- ✅ Check server console for errors
- ✅ Verify API endpoint at `/sales/orders/:id/generate-invoice`

**Problem:** No invoices showing

- ✅ Check database has DocumentAttachment records
- ✅ Check `/documents/timeline/:id` returns data

---

## 📍 File Locations

**New Components:**

```
client/
├── src/
│   └── components/
│       └── sales/
│           ├── InvoiceStatusPanel.jsx ✅ NEW
│           └── InvoiceManagementModal.jsx ✅ NEW
```

**Modified:**

```
client/src/pages/sales/SalesOrdersPage.jsx
server/routes/sales.js
```

---

## ⏱️ Time Required

- Read this guide: **2 min**
- Copy components: **1 min**
- Edit SalesOrdersPage: **5 min**
- Test: **2 min**

**Total: ~10 minutes ✨**

---

## 🎓 What It Does

1. **Shows Invoice Status** on dashboard summary
2. **Adds Invoice Button** to each order
3. **Opens Modal** with full invoice management
4. **Generates PDFs** automatically
5. **Downloads/Prints** invoices
6. **Tracks Document Timeline** for order

---

**Ready to install?** Follow the 5 steps above! 🚀
