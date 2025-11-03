# 🚀 Complete ERP PDF Automation & Document Management System

**Build Date**: January 2025  
**Status**: Ready for Implementation  
**System**: Passion Clothing ERP

---

## 📋 Overview

This guide walks you through implementing a **complete end-to-end PDF automation system** that:

- ✅ Auto-generates PDFs at every workflow step
- ✅ Tracks all documents in a central repository
- ✅ Attaches documents to sales orders for audit trail
- ✅ Triggers next processes when previous steps complete
- ✅ Provides admin panel for document viewing/downloading

---

## 🎯 Workflow Automation Flow

```
1️⃣ SALES ORDER CREATED
   ↓
   Customer places order
   Status: Draft → Confirmed
   📄 AUTO-GENERATE: Sales Invoice (INV-YYYYMMDD-XXXX.pdf)
   📄 AUTO-GENERATE: Purchase Order (PO-YYYYMMDD-XXXX.pdf)
   ✉️  AUTO-TRIGGER: Create Purchase Order in System

2️⃣ PURCHASE ORDER SENT
   ↓
   Procurement creates PO
   Status: Draft → Sent
   📄 PDF already generated on approval
   ✉️  AUTO-TRIGGER: Notify Vendor

3️⃣ GOODS RECEIVED
   ↓
   GRN (Goods Receipt Note) created
   Status: GRN Pending → GRN Completed
   📄 AUTO-GENERATE: GRN Slip (GRN-YYYYMMDD-XXXX.pdf)
   💾 AUTO-UPDATE: Inventory Stock +X units
   ✉️  AUTO-TRIGGER: Notify Manufacturing

4️⃣ PRODUCTION STAGES
   ↓
   Production Order created & executed
   For each Stage (Cutting → Embroidery → Stitching → etc.):
   📄 AUTO-GENERATE: Stage Slip (MFG-Stage-X-YYYYMMDD-XXXX.pdf)
   ✉️  AUTO-TRIGGER: Next Stage When Complete
   Status: In Production → Completed

5️⃣ PRODUCTION COMPLETE
   ↓
   All stages finished
   Status: Completed
   📄 ALL Stage Slips collected
   ✉️  AUTO-TRIGGER: Create Shipment

6️⃣ SHIPMENT CREATED
   ↓
   Products packaged
   Status: Pending → Dispatched
   ✉️  AUTO-TRIGGER: Assign Courier
   📍 AUTO-TRACK: Real-time tracking

7️⃣ DELIVERY CONFIRMED
   ↓
   Products delivered to customer
   Status: In Transit → Delivered
   📄 AUTO-GENERATE: Delivery Invoice (DEL-INV-YYYYMMDD-XXXX.pdf)
   ✉️  AUTO-TRIGGER: Notify Customer
   ✉️  AUTO-TRIGGER: Finance for Payment Collection

📊 ADMIN PANEL VIEW
   ↓
   All Documents on Single Page:
   - Sales Invoice ✓ Download
   - Purchase Order ✓ Download
   - GRN Slip ✓ Download
   - Manufacturing Slips (7 stages) ✓ Download All
   - Delivery Invoice ✓ Download
```

---

## 📂 File Structure & New Files Created

```
server/
├── utils/
│   ├── pdfGenerator.js                    [NEW] Base PDF generator classes
│   ├── documentService.js                 [NEW] Document attachment service
│   └── workflowTriggers.js                [NEW] Automatic trigger handlers
├── routes/
│   └── documents.js                       [NEW] Document API endpoints
└── index.js                               [UPDATED] Added documents route

uploads/
├── documents/
│   ├── invoices/                          [NEW] Sales invoices directory
│   ├── purchase_orders/                   [NEW] PO directory
│   ├── grn_slips/                         [NEW] GRN slips directory
│   ├── manufacturing_slips/               [NEW] Stage slips directory
│   └── delivery_invoices/                 [NEW] Delivery invoices directory
```

---

## 🔧 Installation Steps

### Step 1: Install Required Dependencies

```bash
npm install pdfkit
npm install sequelize
```

### Step 2: Create Directories

```powershell
# Create document storage directories
New-Item -ItemType Directory -Path "uploads/documents/invoices" -Force
New-Item -ItemType Directory -Path "uploads/documents/purchase_orders" -Force
New-Item -ItemType Directory -Path "uploads/documents/grn_slips" -Force
New-Item -ItemType Directory -Path "uploads/documents/manufacturing_slips" -Force
New-Item -ItemType Directory -Path "uploads/documents/delivery_invoices" -Force
```

### Step 3: Integrate Workflow Triggers in Existing Routes

Add triggers to your existing route files:

#### In `server/routes/sales.js` (Update Sales Order status):

```javascript
const WorkflowTriggers = require("../utils/workflowTriggers");
const models = require("../config/database");

// When confirming a sales order:
router.put("/:id/confirm", authenticateToken, async (req, res) => {
  try {
    const salesOrder = await models.SalesOrder.findByPk(req.params.id, {
      include: [{ model: models.Customer, as: "customer" }],
    });

    await salesOrder.update({ status: "confirmed" });

    // ✅ TRIGGER: Generate invoice & create PO
    const workflowTriggers = new WorkflowTriggers(models);
    const result = await workflowTriggers.onSalesOrderConfirmed(
      salesOrder,
      req.user.id
    );

    res.json({ success: true, data: salesOrder, triggered: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### In `server/routes/grn.js` (Update GRN status):

```javascript
// When GRN is completed:
router.put("/:id/complete", authenticateToken, async (req, res) => {
  try {
    const grn = await models.GoodsReceiptNote.findByPk(req.params.id);
    const po = await models.PurchaseOrder.findByPk(grn.purchase_order_id, {
      include: [{ model: models.Vendor, as: "vendor" }],
    });

    await grn.update({ status: "completed" });

    // ✅ TRIGGER: Generate GRN slip & update inventory
    const workflowTriggers = new WorkflowTriggers(models);
    const result = await workflowTriggers.onGRNCompleted(grn, po, req.user.id);

    res.json({ success: true, data: grn, triggered: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### In `server/routes/manufacturing.js` (Production Stage completion):

```javascript
// When a production stage is completed:
router.put("/stages/:stageId/complete", authenticateToken, async (req, res) => {
  try {
    const stage = await models.ProductionStage.findByPk(req.params.stageId);
    const productionOrder = await models.ProductionOrder.findByPk(
      stage.production_order_id
    );

    await stage.update({ status: "completed" });

    // ✅ TRIGGER: Generate manufacturing slip
    const workflowTriggers = new WorkflowTriggers(models);
    const result = await workflowTriggers.onProductionStageCompleted(
      stage,
      productionOrder,
      req.user.id
    );

    res.json({ success: true, data: stage, triggered: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### In `server/routes/shipments.js` (Shipment delivery):

```javascript
// When shipment is delivered:
router.put("/:id/deliver", authenticateToken, async (req, res) => {
  try {
    const shipment = await models.Shipment.findByPk(req.params.id, {
      include: [{ model: models.CourierPartner, as: "courier" }],
    });
    const salesOrder = await models.SalesOrder.findByPk(
      shipment.sales_order_id,
      {
        include: [{ model: models.Customer, as: "customer" }],
      }
    );

    await shipment.update({ status: "delivered" });

    // ✅ TRIGGER: Generate delivery invoice
    const workflowTriggers = new WorkflowTriggers(models);
    const result = await workflowTriggers.onDeliveryCompleted(
      shipment,
      salesOrder,
      req.user.id
    );

    res.json({ success: true, data: shipment, triggered: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🌐 API Endpoints Reference

### 📄 View All Documents for a Sales Order

```bash
GET /api/documents/sales-order/:salesOrderId
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sales_order": {
      "id": 1,
      "order_number": "SO-20250103-0001",
      "status": "delivered",
      "customer": "John Doe"
    },
    "documents": [
      {
        "id": 1,
        "file_name": "INV-SO-20250103-0001.pdf",
        "document_type": "invoice",
        "entity_type": "sales_order",
        "created_at": "2025-01-03T10:30:00Z",
        "size": 125000,
        "download_url": "/api/documents/1/download"
      }
    ],
    "timeline": [...],
    "stats": {
      "total_documents": 12,
      "by_type": {
        "invoice": 2,
        "certificate": 1,
        "specification": 7,
        "other": 2
      },
      "total_size": 1250000
    }
  }
}
```

### ⬇️ Download a Document

```bash
GET /api/documents/:documentId/download
```

**Response:** File download (PDF)

### 📋 View Document Metadata

```bash
GET /api/documents/:documentId/view
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "file_name": "INV-SO-20250103-0001.pdf",
    "file_type": "application/pdf",
    "file_size": 125000,
    "document_type": "invoice",
    "version": 1,
    "created_at": "2025-01-03T10:30:00Z",
    "metadata": {
      "invoice_number": "SO-20250103-0001",
      "customer_id": 1,
      "total_amount": 5000
    },
    "download_url": "/api/documents/1/download"
  }
}
```

### 📊 Admin Dashboard - All Documents

```bash
GET /api/documents/admin/dashboard?page=1&limit=50&document_type=invoice
```

**Response:**

```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 1,
        "file_name": "INV-SO-20250103-0001.pdf",
        "document_type": "invoice",
        "entity_type": "sales_order",
        "entity_id": 1,
        "size": 125000,
        "created_at": "2025-01-03T10:30:00Z",
        "uploaded_by": "Sales Manager",
        "download_url": "/api/documents/1/download"
      }
    ],
    "grouped": {
      "invoice": [...],
      "certificate": [...],
      "specification": [...]
    },
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "pages": 3
    }
  }
}
```

### 🔄 Manually Trigger PDF Generation

```bash
POST /api/documents/manual-trigger

{
  "trigger_type": "sales.confirmed",
  "entity_id": 1
}
```

**Supported Trigger Types:**

- `sales.confirmed` - Generate sales invoice & PO
- `po.approved` - Generate PO PDF
- `delivery.completed` - Generate delivery invoice
- `grn.completed` - Generate GRN slip
- `stage.completed` - Generate manufacturing slip

---

## 📄 PDF Document Formats

### 1. Sales Invoice (INV-YYYYMMDD-XXXX.pdf)

```
┌─────────────────────────────────────────────────────┐
│         PASSION CLOTHING ERP                        │
│      SALES INVOICE                                  │
├─────────────────────────────────────────────────────┤
│ Date: 01/03/2025          Status: Confirmed        │
│ Reference: SO-20250103-0001                        │
├─────────────────────────────────────────────────────┤
│ Order Details        │  Customer Details           │
│ Order ID: SO-...    │  Customer: John Doe        │
│ Order Date: 01/03   │  Email: john@example.com  │
│ Delivery: 01/10     │  Phone: +1-800-123-4567  │
│ Amount: $5,000      │  Address: 123 Main St    │
├─────────────────────────────────────────────────────┤
│ Item          │ Qty │ Unit Price │ Amount         │
├─────────────────────────────────────────────────────┤
│ Shirt         │ 100 │ $30        │ $3,000         │
│ Pants         │ 50  │ $40        │ $2,000         │
├─────────────────────────────────────────────────────┤
│ Subtotal: $5,000                                   │
│ Tax (0%): $0                                       │
│ Grand Total: $5,000                                │
│ Status: Pending Payment                            │
└─────────────────────────────────────────────────────┘
```

### 2. GRN Slip (GRN-YYYYMMDD-XXXX.pdf)

```
┌─────────────────────────────────────────────────────┐
│         GOODS RECEIPT NOTE (GRN)                    │
├─────────────────────────────────────────────────────┤
│ GRN Number: GRN-20250103-0001                      │
│ PO Number: PO-20250102-0001                        │
│ Received Date: 01/03/2025                          │
│ Total Quantity: 150 units                          │
├─────────────────────────────────────────────────────┤
│ Vendor: ABC Textiles      │ Vendor Code: VND-001  │
│ Email: vendor@abc.com     │ Phone: +1-800-ABC-1234│
├─────────────────────────────────────────────────────┤
│ Item          │ PO Qty │ Received │ Condition      │
├─────────────────────────────────────────────────────┤
│ Fabric Roll   │ 100    │ 100      │ Good           │
│ Thread Box    │ 50     │ 50       │ Good           │
├─────────────────────────────────────────────────────┤
│ Total Received: 150 units                          │
│ Status: Completed                                  │
│ Verified By: Procurement Officer                   │
└─────────────────────────────────────────────────────┘
```

### 3. Manufacturing Slip (MFG-Stage-YYYYMMDD-XXXX.pdf)

```
┌─────────────────────────────────────────────────────┐
│     MANUFACTURING SLIP - CUTTING                    │
├─────────────────────────────────────────────────────┤
│ Production Order: PO-001                            │
│ Sales Order: SO-20250103-0001                       │
│ Stage: Cutting           │ Status: Completed       │
├─────────────────────────────────────────────────────┤
│ Product: Shirt           │ Quantity: 100           │
│ Start Date: 01/03        │ End Date: 01/04         │
├─────────────────────────────────────────────────────┤
│ Processing: 100 units                              │
│ Approved: 98 units                                 │
│ Rejected: 2 units                                  │
│ Material Used: 102 meters                          │
├─────────────────────────────────────────────────────┤
│ Notes: Minor defects noted. Quality approved.      │
│                                                     │
│ Authorized By: ___________________                 │
└─────────────────────────────────────────────────────┘
```

### 4. Delivery Invoice (DEL-INV-YYYYMMDD-XXXX.pdf)

```
┌─────────────────────────────────────────────────────┐
│         DELIVERY INVOICE                            │
├─────────────────────────────────────────────────────┤
│ Shipment Number: SHP-20250104-0001                 │
│ Sales Order: SO-20250103-0001                       │
│ Delivered Date: 01/04/2025                         │
├─────────────────────────────────────────────────────┤
│ Courier: FedEx              │ Tracking: FDX123456  │
│ Customer: John Doe          │ Address: 123 Main St │
│ Delivered By: Customer      │ Status: Delivered    │
├─────────────────────────────────────────────────────┤
│ Item          │ Qty │ Unit Price │ Amount          │
├─────────────────────────────────────────────────────┤
│ Shirt         │ 100 │ $30        │ $3,000          │
│ Pants         │ 50  │ $40        │ $2,000          │
├─────────────────────────────────────────────────────┤
│ Total Quantity: 150 units                          │
│ Subtotal: $5,000                                   │
│ Tax: $0                                            │
│ Grand Total: $5,000                                │
│ Status: Delivered                                  │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing & Verification

### Test Scenario: Complete Order Flow

```bash
# 1. Create a Sales Order
POST /api/sales/orders
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 100, "unit_price": 30 }
  ],
  "final_amount": 3000
}
# Response: { "id": 1, "order_number": "SO-20250103-0001" }

# 2. Confirm the Sales Order (TRIGGERS: Invoice + PO generation)
PUT /api/sales/1/confirm
# Response: { "invoice_generated": true, "po_created": true }

# 3. View Generated Documents
GET /api/documents/sales-order/1
# Response: Shows INV-xxx.pdf and PO-xxx.pdf in timeline

# 4. Complete GRN (TRIGGERS: GRN slip + stock update)
PUT /api/grn/1/complete
# Response: { "grn_generated": true, "stock_updated": true }

# 5. Complete Production Stages (TRIGGERS: Stage slips)
PUT /api/manufacturing/stages/1/complete
# Response: { "slip_generated": true }

# 6. Mark Shipment as Delivered (TRIGGERS: Delivery invoice)
PUT /api/shipments/1/deliver
# Response: { "invoice_generated": true, "notification_sent": true }

# 7. Download All Documents
GET /api/documents/sales-order/1/download
# Response: ZIP file with all PDFs (optional)
```

---

## 🔐 Security Considerations

1. **Authentication**: All endpoints require JWT token
2. **Authorization**: Users can only download documents for orders they have access to
3. **File Storage**: PDFs stored outside webroot (`/uploads/documents/`)
4. **Soft Delete**: Documents marked inactive, not permanently deleted
5. **Audit Trail**: All document actions logged with user ID and timestamp
6. **File Validation**: Check file type & size before storage

---

## 📊 Admin Panel Integration (Frontend)

### React Component Example

```jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export function DocumentsPanel({ salesOrderId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await axios.get(
          `/api/documents/sales-order/${salesOrderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDocuments(data.data.timeline);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [salesOrderId]);

  const downloadDocument = (documentId) => {
    window.location.href = `/api/documents/${documentId}/download`;
  };

  return (
    <div className="documents-panel">
      <h2>Order Documents</h2>
      <table>
        <thead>
          <tr>
            <th>Document Type</th>
            <th>File Name</th>
            <th>Created</th>
            <th>Size</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.type}</td>
              <td>{doc.name}</td>
              <td>{new Date(doc.created_at).toLocaleDateString()}</td>
              <td>{(doc.size / 1024).toFixed(2)} KB</td>
              <td>
                <button onClick={() => downloadDocument(doc.id)}>
                  📥 Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🚨 Troubleshooting

| Issue                   | Solution                                             |
| ----------------------- | ---------------------------------------------------- |
| PDFs not generating     | Check if `pdfkit` is installed: `npm install pdfkit` |
| Directory not found     | Create directories: `node scripts/create-dirs.js`    |
| Documents not attaching | Verify `DocumentAttachment` model exists             |
| Triggers not firing     | Check workflow trigger imports and error logs        |
| File download fails     | Ensure file path is correct and file exists          |
| Permission denied       | Check file/folder permissions (755 for directories)  |

---

## ✅ Implementation Checklist

- [ ] Install `pdfkit` dependency
- [ ] Create document storage directories
- [ ] Copy PDF generator utilities to `/server/utils/`
- [ ] Copy document service to `/server/utils/`
- [ ] Copy workflow triggers to `/server/utils/`
- [ ] Create documents route file in `/server/routes/`
- [ ] Add documents route to `server/index.js`
- [ ] Integrate triggers in sales route
- [ ] Integrate triggers in GRN route
- [ ] Integrate triggers in manufacturing route
- [ ] Integrate triggers in shipments route
- [ ] Test PDF generation with manual trigger endpoint
- [ ] Create frontend components for document viewing
- [ ] Set up admin dashboard for document browsing
- [ ] Enable document download functionality
- [ ] Test complete order workflow end-to-end
- [ ] Set up backup for generated PDFs
- [ ] Configure email notifications (optional)
- [ ] Deploy to production

---

## 📞 Support & Next Steps

For additional features:

1. **Email Integration**: Send PDFs to customers automatically
2. **Batch Processing**: Generate reports for multiple orders
3. **Archive**: Auto-archive old documents
4. **Audit Logging**: Track all document views/downloads
5. **Watermarks**: Add confidentiality watermarks to PDFs
6. **E-signature**: Add digital signature support

---

## 📝 Document Generation Summary

| Document           | Trigger               | Format | Location                |
| ------------------ | --------------------- | ------ | ----------------------- |
| Sales Invoice      | Sales Order Confirmed | PDF    | `/invoices/`            |
| Purchase Order     | PO Approved           | PDF    | `/purchase_orders/`     |
| GRN Slip           | GRN Completed         | PDF    | `/grn_slips/`           |
| Manufacturing Slip | Stage Completed       | PDF    | `/manufacturing_slips/` |
| Delivery Invoice   | Shipment Delivered    | PDF    | `/delivery_invoices/`   |

---

**System Ready for Production** ✅
