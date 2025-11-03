# 🔧 EXACT CODE MODIFICATIONS - Copy & Paste

This file shows EXACTLY where and how to modify your existing routes.

---

## FILE 1: server/routes/sales.js

### FIND THIS:

```javascript
router.put("/orders/:id", authenticateToken, async (req, res) => {
  try {
    const salesOrder = await db.SalesOrder.findByPk(req.params.id);

    if (!salesOrder) {
      return res.status(404).json({ error: "Sales Order not found" });
    }

    await salesOrder.update(req.body);

    res.json({ success: true, salesOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH THIS:

```javascript
const WorkflowIntegration = require("../services/workflowIntegration"); // ADD THIS LINE

router.put("/orders/:id", authenticateToken, async (req, res) => {
  try {
    const salesOrder = await db.SalesOrder.findByPk(req.params.id);

    if (!salesOrder) {
      return res.status(404).json({ error: "Sales Order not found" });
    }

    const oldStatus = salesOrder.status;
    const newStatus = req.body.status;

    await salesOrder.update(req.body);

    // 🎯 AUTOMATION TRIGGER - ADD THESE LINES
    if (newStatus !== oldStatus) {
      try {
        await WorkflowIntegration.onSalesOrderStatusChange(
          salesOrder.id,
          newStatus,
          db
        );
      } catch (workflowError) {
        console.error("Workflow error (non-blocking):", workflowError);
        // Don't fail the main request if workflow fails
      }
    }

    res.json({ success: true, salesOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## FILE 2: server/routes/grn.js

### FIND THIS:

```javascript
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const grn = await db.GoodsReceiptNote.findByPk(req.params.id);

    if (!grn) {
      return res.status(404).json({ error: "GRN not found" });
    }

    await grn.update(req.body);

    res.json({ success: true, grn });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH THIS:

```javascript
const WorkflowIntegration = require("../services/workflowIntegration"); // ADD THIS LINE

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const grn = await db.GoodsReceiptNote.findByPk(req.params.id);

    if (!grn) {
      return res.status(404).json({ error: "GRN not found" });
    }

    const oldStatus = grn.status;
    const newStatus = req.body.status;

    await grn.update(req.body);

    // 🎯 AUTOMATION TRIGGER - ADD THESE LINES
    if (newStatus === "completed" && oldStatus !== "completed") {
      try {
        await WorkflowIntegration.onGRNStatusChange(grn.id, "completed", db);
      } catch (workflowError) {
        console.error("Workflow error (non-blocking):", workflowError);
      }
    }

    res.json({ success: true, grn });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## FILE 3: server/routes/manufacturing.js

### FIND THIS (Production Order Creation):

```javascript
router.post("/orders", authenticateToken, async (req, res) => {
  try {
    const productionOrder = await db.ProductionOrder.create(req.body);

    res.json({ success: true, productionOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH THIS:

```javascript
const WorkflowIntegration = require("../services/workflowIntegration"); // ADD THIS LINE

router.post("/orders", authenticateToken, async (req, res) => {
  try {
    const productionOrder = await db.ProductionOrder.create(req.body);

    // 🎯 AUTOMATION TRIGGER - ADD THESE LINES
    try {
      await WorkflowIntegration.onProductionOrderCreated(
        productionOrder.id,
        db
      );
    } catch (workflowError) {
      console.error("Workflow error (non-blocking):", workflowError);
    }

    res.json({ success: true, productionOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### FIND THIS (Stage Completion):

```javascript
router.put("/stages/:stageId/complete", authenticateToken, async (req, res) => {
  try {
    const stage = await db.ProductionStage.findByPk(req.params.stageId);

    if (!stage) {
      return res.status(404).json({ error: "Stage not found" });
    }

    await stage.update({ status: "completed" });

    res.json({ success: true, stage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH THIS:

```javascript
const WorkflowIntegration = require("../services/workflowIntegration"); // ADD THIS LINE

router.put("/stages/:stageId/complete", authenticateToken, async (req, res) => {
  try {
    const stage = await db.ProductionStage.findByPk(req.params.stageId, {
      include: [{ model: db.ProductionOrder, as: "production_order" }],
    });

    if (!stage) {
      return res.status(404).json({ error: "Stage not found" });
    }

    await stage.update({ status: "completed" });

    // 🎯 AUTOMATION TRIGGER - ADD THESE LINES
    if (stage.production_order) {
      try {
        await WorkflowIntegration.onProductionStageCompleted(
          stage.production_order.id,
          stage.id,
          db
        );
      } catch (workflowError) {
        console.error("Workflow error (non-blocking):", workflowError);
      }
    }

    res.json({ success: true, stage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## FILE 4: server/routes/shipments.js

### FIND THIS (Shipment Creation):

```javascript
router.post("/", authenticateToken, async (req, res) => {
  try {
    const shipment = await db.Shipment.create(req.body);

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH THIS:

```javascript
const WorkflowIntegration = require("../services/workflowIntegration"); // ADD THIS LINE

router.post("/", authenticateToken, async (req, res) => {
  try {
    const shipment = await db.Shipment.create(req.body);

    // 🎯 AUTOMATION TRIGGER - ADD THESE LINES
    try {
      await WorkflowIntegration.onShipmentCreated(shipment.id, db);
    } catch (workflowError) {
      console.error("Workflow error (non-blocking):", workflowError);
    }

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### FIND THIS (Delivery/Mark as Delivered):

```javascript
router.put("/:id/delivered", authenticateToken, async (req, res) => {
  try {
    const shipment = await db.Shipment.findByPk(req.params.id);

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    await shipment.update({
      status: "delivered",
      delivered_at: new Date(),
    });

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### REPLACE WITH THIS:

```javascript
const WorkflowIntegration = require("../services/workflowIntegration"); // ADD THIS LINE

router.put("/:id/delivered", authenticateToken, async (req, res) => {
  try {
    const shipment = await db.Shipment.findByPk(req.params.id);

    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    const oldStatus = shipment.status;

    await shipment.update({
      status: "delivered",
      delivered_at: new Date(),
    });

    // 🎯 AUTOMATION TRIGGER - ADD THESE LINES
    if (oldStatus !== "delivered") {
      try {
        await WorkflowIntegration.onDeliveryConfirmed(shipment.id, db);
      } catch (workflowError) {
        console.error("Workflow error (non-blocking):", workflowError);
      }
    }

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## FILE 5: server/index.js

### ADD THESE LINES:

```javascript
// At the top with other imports
const documentManagementRoutes = require("./routes/documentManagement");

// Before app.listen()
app.use("/api/documents", documentManagementRoutes);
```

---

## FILE 6: client/src/App.js

### FIND THIS (in your router):

```javascript
import AdminDashboard from "./pages/admin/AdminDashboard";

<Route path="/admin/dashboard" element={<AdminDashboard />} />;
```

### ADD AFTER IT:

```javascript
import AdminDashboard from './pages/admin/AdminDashboard';
import DocumentManagementPanel from './pages/admin/DocumentManagementPanel'; // ADD THIS

<Route path="/admin/dashboard" element={<AdminDashboard />} />
<Route path="/admin/documents" element={<DocumentManagementPanel />} /> // ADD THIS
```

---

## QUICK INTEGRATION CHECKLIST

1. **server/routes/sales.js**

   - [ ] Add import: `const WorkflowIntegration = require('../services/workflowIntegration');`
   - [ ] Add automation trigger to sales order update

2. **server/routes/grn.js**

   - [ ] Add import: `const WorkflowIntegration = require('../services/workflowIntegration');`
   - [ ] Add automation trigger to GRN update

3. **server/routes/manufacturing.js**

   - [ ] Add import: `const WorkflowIntegration = require('../services/workflowIntegration');`
   - [ ] Add automation trigger to production order creation
   - [ ] Add automation trigger to stage completion

4. **server/routes/shipments.js**

   - [ ] Add import: `const WorkflowIntegration = require('../services/workflowIntegration');`
   - [ ] Add automation trigger to shipment creation
   - [ ] Add automation trigger to delivery confirmation

5. **server/index.js**

   - [ ] Add import for documentManagement routes
   - [ ] Register the routes with app.use()

6. **client/src/App.js**

   - [ ] Add import for DocumentManagementPanel
   - [ ] Add route `/admin/documents`

7. **npm install**

   - [ ] `npm install puppeteer`

8. **Create directories**
   - [ ] `mkdir -p server/uploads/documents/{invoices,grn_slips,stock_slips,manufacturing_slips,shipment_slips,delivery_invoices}`

---

## ✅ YOU'RE DONE!

Your complete 6-module ERP automation is now integrated. Test the workflow from Sales Order confirmation to Delivery confirmation!
