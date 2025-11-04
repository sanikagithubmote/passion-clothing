# ⚡ Activity Logging Quick Start

## 🎯 In 5 Minutes: Get Activity Logging Working

### Step 1️⃣: Run the Migration (1 minute)

```bash
node run-activities-migration.js
```

**Output:**

```
✅ Activities table migration completed successfully!
```

### Step 2️⃣: Restart Application (1 minute)

```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend
cd client
npm start
```

### Step 3️⃣: Create a Purchase Order (1 minute)

1. Go to **Procurement → Purchase Orders → Create New**
2. Fill form and click **Create PO & Send for Approval**
3. ✅ Done!

### Step 4️⃣: View Recent Activities (1 minute)

1. Go to **Sales Dashboard** (or any dashboard)
2. Scroll to **Recent Activities** section
3. **✅ Your PO creation should appear!**

### Step 5️⃣: Verify in Database (1 minute)

```sql
SELECT * FROM activities ORDER BY created_at DESC LIMIT 1;
```

**Expected Output:**

```
id: 1
type: purchase_order_created
title: Purchase Order Created: PO-20251115-00001
message: Purchase Order PO-20251115-00001 has been created...
department: procurement
order_number: PO-20251115-00001
amount: 45000.00
created_at: 2025-11-15 14:32:00
```

---

## 🔥 For Developers: Add Activity Logging Anywhere

### Pattern 1: After Creating Any Entity

```javascript
// Step 1: Import ActivityService
const ActivityService = require('../utils/ActivityService');

// Step 2: After entity creation
const newEntity = await MyModel.create({...});

// Step 3: Log the activity
await ActivityService.logActivity({
  type: 'entity_created',
  title: `Entity Created: ${newEntity.id}`,
  message: `New entity has been created`,
  department: 'procurement',
  order_number: 'SO-123',
  related_entity_id: newEntity.id,
  related_entity_type: 'my_entity',
  amount: 1000,
  created_by: req.user.id,
  metadata: {
    entity_id: newEntity.id,
    entity_name: newEntity.name
  }
});
```

### Pattern 2: Using Pre-Built Methods

```javascript
const ActivityService = require("../utils/ActivityService");

// Log PO creation
await ActivityService.logPurchaseOrderCreated(
  purchaseOrder,
  userId,
  vendorName,
  linkedSalesOrderNumber
);

// Log invoice creation
await ActivityService.logInvoiceCreated(
  invoice,
  userId,
  salesOrderNumber,
  amount
);

// Log manufacturing start
await ActivityService.logManufacturingStarted(
  productionOrder,
  userId,
  salesOrderNumber,
  amount
);
```

### Pattern 3: Fetching Activities

```javascript
const ActivityService = require("../utils/ActivityService");

// Get last 20 activities
const result = await ActivityService.getRecentActivities({
  limit: 20,
  offset: 0,
});

// Get only procurement activities
const procActivities = await ActivityService.getRecentActivities({
  limit: 10,
  department: "procurement",
});

// Get activities for specific order
const orderActivities = await ActivityService.getActivitiesByOrderNumber(
  "SO-123"
);

// Get activities for specific entity
const entityActivities = await ActivityService.getActivitiesByEntity(
  "purchase_order",
  5
);
```

---

## 🎨 Activity Logging by Department

### Sales Department

```javascript
await ActivityService.logActivity({
  type: "sales_order_created",
  department: "sales",
  // ...
});
```

### Procurement Department

```javascript
await ActivityService.logPurchaseOrderCreated(po, userId, vendor, linkedSO);
```

### Manufacturing

```javascript
await ActivityService.logManufacturingStarted(
  prodOrder,
  userId,
  soNumber,
  amount
);
```

### Finance

```javascript
await ActivityService.logInvoiceCreated(invoice, userId, soNumber, amount);
```

### Shipment

```javascript
await ActivityService.logShipmentDispatched(shipment, userId, soNumber, amount);
```

---

## 📊 Activity Type Reference

| Type                     | When to Use            | Example                                              |
| ------------------------ | ---------------------- | ---------------------------------------------------- |
| `purchase_order_created` | When PO is created     | `await ActivityService.logPurchaseOrderCreated(...)` |
| `purchase_order_updated` | When PO is edited      | `await ActivityService.logPurchaseOrderUpdated(...)` |
| `purchase_order_sent`    | When PO sent to vendor | Add logging in send endpoint                         |
| `invoice_created`        | When invoice generated | `await ActivityService.logInvoiceCreated(...)`       |
| `manufacturing_started`  | When production begins | `await ActivityService.logManufacturingStarted(...)` |
| `shipment_dispatched`    | When shipment sent     | `await ActivityService.logShipmentDispatched(...)`   |
| `shipment_delivered`     | When order delivered   | `await ActivityService.logOrderDelivered(...)`       |

---

## 🧪 Test It Yourself

### Test 1: Simple Activity Log

```javascript
// In any route file:
const ActivityService = require("../utils/ActivityService");

router.post("/test-activity", authenticateToken, async (req, res) => {
  await ActivityService.logActivity({
    type: "other",
    title: "Test Activity",
    message: "This is a test activity",
    department: "admin",
    created_by: req.user.id,
  });

  res.json({ message: "Activity logged" });
});

// Then call: POST /test-activity
// And check: SELECT * FROM activities ORDER BY created_at DESC LIMIT 1;
```

### Test 2: View All Activities

```javascript
router.get("/activities-list", authenticateToken, async (req, res) => {
  const result = await ActivityService.getRecentActivities({ limit: 50 });
  res.json(result);
});

// Then navigate to: /activities-list
```

---

## ✅ Verification Checklist

After implementing, check:

- [ ] Migration ran successfully: `node run-activities-migration.js`
- [ ] Activities table exists: `SHOW TABLES LIKE 'activities';`
- [ ] App restarted: `npm start`
- [ ] Can create PO: Go to Create PO page
- [ ] PO created successfully: Check success toast
- [ ] Activity logged: Check Recent Activities dashboard
- [ ] Database has record: `SELECT * FROM activities LIMIT 1;`

---

## 🚀 Implementation Roadmap

### Phase 1: ✅ DONE

- [x] Activity model created
- [x] ActivityService implemented
- [x] PO creation logging
- [x] API endpoint for activities
- [x] Frontend integration

### Phase 2: Ready to Implement

- [ ] Log invoice creation
- [ ] Log manufacturing start
- [ ] Log shipment dispatch
- [ ] Log order delivery
- [ ] Log GRN creation

### Phase 3: Future Features

- [ ] Activity filters by user
- [ ] Activity export/reporting
- [ ] Activity timeline visualization
- [ ] Department-wise activity dashboards
- [ ] Real-time activity notifications

---

## 💡 Tips & Tricks

### Tip 1: Non-Blocking Logging

```javascript
// Activity logging should never fail the main operation
// It's already handled with try-catch in ActivityService
// Just call it and forget!
await ActivityService.logActivity({...}); // Never throws
```

### Tip 2: Batch Logging

```javascript
// Log multiple activities if needed
const activities = [
  { type: 'event1', ... },
  { type: 'event2', ... }
];

for (const activity of activities) {
  await ActivityService.logActivity(activity);
}
```

### Tip 3: Get User Info

```javascript
// Always include user info
const activity = {
  created_by: req.user.id, // ✅ Include this
  metadata: {
    user_name: req.user.name,
    user_department: req.user.department,
  },
};
```

---

## ❓ FAQ

**Q: Will activity logging slow down my app?**
A: No! It's async and non-blocking. Even if it fails, your main operation succeeds.

**Q: Can I log activities without a linked order?**
A: Yes! `order_number` is optional. Just omit it if not applicable.

**Q: How long are activities stored?**
A: Forever! There's no auto-deletion. Archive old activities if needed.

**Q: Can I edit an activity after logging?**
A: Not recommended. It's an audit trail. Create new activity instead.

**Q: How do I export activities?**
A: Use ActivityService: `await ActivityService.getRecentActivities({ limit: 1000 })`

---

## 🎯 Common Implementations

### Log PO Sent to Vendor

```javascript
// In send-to-vendor endpoint
await ActivityService.logActivity({
  type: "purchase_order_sent",
  title: `PO Sent to Vendor: ${po.po_number}`,
  message: `PO ${po.po_number} sent to vendor ${vendor.name}`,
  department: "procurement",
  order_number: po.po_number,
  related_entity_id: po.id,
  related_entity_type: "purchase_order",
  created_by: req.user.id,
});
```

### Log Invoice Generation

```javascript
// In invoice generation endpoint
await ActivityService.logInvoiceCreated(
  invoice,
  req.user.id,
  salesOrder.order_number,
  salesOrder.total_amount
);
```

### Log Material Received

```javascript
// In GRN creation endpoint
await ActivityService.logActivity({
  type: "grn_created",
  title: `GRN Created: ${grn.grn_number}`,
  message: `Goods receipt note created for PO ${po.po_number}`,
  department: "procurement",
  order_number: po.po_number,
  related_entity_id: grn.id,
  related_entity_type: "grn",
  created_by: req.user.id,
});
```

---

## 📞 Need Help?

1. **Check the Activity Service:** `/server/utils/ActivityService.js`
2. **See an Example:** `/server/routes/procurement.js` (lines 442-452)
3. **Test the Endpoint:** `/server/routes/sales.js` (lines 2099-2127)

---

**Ready to log activities everywhere? Start with the 5-minute setup! 🚀**
