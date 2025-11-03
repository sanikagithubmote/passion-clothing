# Procurement Document Management System

## PDF Generation & Auto-Workflow Triggers

---

## 📋 Overview

This system provides automated PDF document generation and workflow triggering for the Procurement Module. It enables:

1. **Automatic PDF Generation** for key documents (GRN, Invoice, Manufacturing Slips)
2. **Status-Based Triggers** that auto-execute next workflow steps
3. **Document Timeline** linking all PDFs to a Sales Order
4. **Admin Dashboard** for viewing and managing all documents

---

## 🔄 Document Workflow

### Procurement Process Flow

```
Sales Order Confirmed
    ↓
Generate Sales Invoice PDF
    ↓
Purchase Order Created
    ↓
PO Approved (admin)
    ↓
Generate PO PDF
    ↓
GRN Pending
    ↓
GRN Received (goods arrived)
    ↓
Generate GRN Slip PDF
    ↓
GRN Verified (quality check)
    ↓
GRN Approved
    ↓
Update Inventory Stock
    ↓
Manufacturing Ready
    ↓
Generate Manufacturing Slip PDFs
    ↓
Production Complete
    ↓
Delivery Initiated
    ↓
Generate Delivery Invoice PDF
    ↓
Delivery Completed ✓
```

---

## 📂 PDF Storage Structure

```
server/uploads/documents/
├── invoices/
│   └── INV-SO-YYYYMMDD-XXXX.pdf
├── grn_slips/
│   └── GRN-GRN-YYYYMMDD-XXXX.pdf
├── purchase_orders/
│   └── PO-PO-YYYYMMDD-XXXX.pdf
├── manufacturing_slips/
│   └── MFG-STAGE-PO-YYYYMMDD-XXXX.pdf
└── delivery_invoices/
    └── DEL-INV-SHP-YYYYMMDD-XXXX.pdf
```

**Naming Convention**:

- Invoices: `INV-{SO-Number}`
- GRN Slips: `GRN-{GRN-Number}`
- POs: `PO-{PO-Number}`
- Manufacturing: `MFG-{StageName}-{ProductionOrderID}`
- Delivery: `DEL-INV-{ShipmentNumber}`

---

## 🚀 Manual Trigger Endpoint

### Base URL

```
POST http://localhost:5000/api/documents/manual-trigger
```

### Request Format

```json
{
  "trigger_type": "grn.completed",
  "entity_id": 123,
  "entity_type": "goods_receipt_note"
}
```

### Trigger Types

#### 1. **GRN Triggers**

**grn.pending** - GRN Created

```json
{
  "trigger_type": "grn.pending",
  "entity_id": 456,
  "entity_type": "goods_receipt_note"
}
```

**Actions**:

- Create GRN document record
- Send notification to inspector

---

**grn.received** - Goods Physically Received

```json
{
  "trigger_type": "grn.received",
  "entity_id": 456,
  "entity_type": "goods_receipt_note"
}
```

**Actions**:

- Update GRN status to "received"
- Send notification to QA team
- Generate GRN Slip PDF (preliminary)

---

**grn.verified** - Quality Inspection Passed

```json
{
  "trigger_type": "grn.verified",
  "entity_id": 456,
  "entity_type": "goods_receipt_note"
}
```

**Actions**:

- Update GRN status to "verified"
- Mark all items as inspected
- Update inventory with "received" status

---

**grn.approved** - Final Approval (Auto-triggers stock update)

```json
{
  "trigger_type": "grn.approved",
  "entity_id": 456,
  "entity_type": "goods_receipt_note"
}
```

**Actions**:

- Update GRN status to "approved"
- Update sales order status to "procurement_completed"
- Add items to active inventory stock
- Generate final GRN Slip PDF with signatures
- Trigger next workflow: Manufacturing ready
- Send notification to manufacturing

---

#### 2. **Purchase Order Triggers**

**po.approved** - PO Approved

```json
{
  "trigger_type": "po.approved",
  "entity_id": 789,
  "entity_type": "purchase_order"
}
```

**Actions**:

- Generate Purchase Order PDF
- Send to vendor (email)
- Update sales order to "procurement_created"

---

#### 3. **Sales Order Triggers**

**sales.confirmed** - Sales Order Confirmed

```json
{
  "trigger_type": "sales.confirmed",
  "entity_id": 123,
  "entity_type": "sales_order"
}
```

**Actions**:

- Generate Sales Invoice PDF
- Create Purchase Order
- Send confirmation email to customer

---

#### 4. **Delivery Triggers**

**delivery.completed** - Shipment Delivered

```json
{
  "trigger_type": "delivery.completed",
  "entity_id": 321,
  "entity_type": "shipment"
}
```

**Actions**:

- Generate Delivery Invoice PDF
- Update sales order to "delivered"
- Send delivery confirmation to customer

---

## 📊 Response Format

### Success Response (200)

```json
{
  "success": true,
  "message": "Trigger 'grn.approved' executed successfully",
  "result": {
    "status_updated": true,
    "document_generated": true,
    "inventory_updated": true,
    "notifications_sent": 2,
    "next_workflow": "manufacturing_ready"
  },
  "document": {
    "id": 456,
    "file_name": "GRN-GRN-YYYYMMDD-XXXX.pdf",
    "file_path": "uploads/documents/grn_slips/GRN-GRN-YYYYMMDD-XXXX.pdf",
    "document_type": "grn_slip",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "message": "Failed to execute trigger",
  "error": "Entity not found or invalid trigger type",
  "code": "INVALID_TRIGGER"
}
```

---

## 🗄️ Database Schema

### DocumentAttachment Table

```sql
CREATE TABLE document_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_type ENUM('sales_order', 'purchase_order', 'goods_receipt_note', 'production_order', 'shipment') NOT NULL,
  entity_id INT NOT NULL,
  document_type ENUM('invoice', 'grn_slip', 'po_document', 'manufacturing_slip', 'delivery_invoice', 'challan') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) DEFAULT 'application/pdf',
  file_size INT,
  version INT DEFAULT 1,
  uploaded_by INT,
  description TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (entity_id) REFERENCES sales_orders(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_doc_type (document_type),
  INDEX idx_created (created_at)
);
```

### GRN Status Enum

```
'pending'      → GRN created, awaiting goods
'received'     → Goods physically received
'verified'     → Quality inspection passed
'approved'     → Final approval, stock added
'rejected'     → Quality issues
'partial'      → Partial quantity received
'cancelled'    → Cancelled
```

---

## 🎯 Admin Dashboard API

### Get Document Timeline for Sales Order

```
GET /api/documents/sales-order/:salesOrderId/timeline
```

**Response**:

```json
{
  "success": true,
  "sales_order": {
    "id": 123,
    "order_number": "SO-20240115-001",
    "customer": "Acme Corp",
    "status": "delivered"
  },
  "timeline": [
    {
      "timestamp": "2024-01-15T08:00:00Z",
      "event": "Sales Order Confirmed",
      "document": {
        "type": "sales_invoice",
        "name": "INV-SO-20240115-001.pdf",
        "path": "/uploads/documents/invoices/INV-SO-20240115-001.pdf"
      }
    },
    {
      "timestamp": "2024-01-15T09:30:00Z",
      "event": "Purchase Order Approved",
      "document": {
        "type": "purchase_order",
        "name": "PO-PO-20240115-001.pdf",
        "path": "/uploads/documents/purchase_orders/PO-PO-20240115-001.pdf"
      }
    },
    {
      "timestamp": "2024-01-15T14:00:00Z",
      "event": "GRN Received",
      "document": {
        "type": "grn_slip",
        "name": "GRN-GRN-20240115-001.pdf",
        "path": "/uploads/documents/grn_slips/GRN-GRN-20240115-001.pdf"
      }
    },
    {
      "timestamp": "2024-01-15T15:30:00Z",
      "event": "GRN Approved",
      "document": {
        "type": "grn_slip",
        "name": "GRN-GRN-20240115-001-FINAL.pdf",
        "path": "/uploads/documents/grn_slips/GRN-GRN-20240115-001-FINAL.pdf"
      }
    }
  ],
  "stats": {
    "total_documents": 4,
    "document_types": {
      "invoice": 1,
      "purchase_order": 1,
      "grn_slip": 2,
      "manufacturing_slip": 0,
      "delivery_invoice": 0
    }
  }
}
```

---

## 💾 Implementation Steps

### Step 1: Database Migration

Run the migration to add `DocumentAttachment` table if not exists:

```bash
node server/scripts/runCreateDocumentAttachmentTable.js
```

### Step 2: Update GRN Route

Add trigger calls to GRN status change endpoints:

```javascript
// When GRN approved
const workflowTriggers = new WorkflowTriggers(models);
await workflowTriggers.onGRNApproved(grn, purchaseOrder, req.user.id);
```

### Step 3: Test Manual Trigger

```bash
curl -X POST http://localhost:5000/api/documents/manual-trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trigger_type": "grn.approved",
    "entity_id": 1,
    "entity_type": "goods_receipt_note"
  }'
```

### Step 4: View Documents in Admin Dashboard

Navigate to: `http://localhost:3000/admin/documents/sales-order/1`

---

## 📝 PDF Templates

### GRN Slip Template (A4)

```
┌─────────────────────────────────────────┐
│   PASSION CLOTHING ERP                  │
│   www.passionclothing.com               │
│   Email: info@passionclothing.com       │
├─────────────────────────────────────────┤
│   GOODS RECEIPT NOTE (GRN)              │
│                                         │
│   GRN Number: GRN-YYYYMMDD-XXXX        │
│   Date: DD/MM/YYYY                      │
│   Status: [PENDING/RECEIVED/VERIFIED]   │
├─────────────────────────────────────────┤
│ ORDER DETAILS         │ VENDOR DETAILS  │
│ ─────────────────────┼─────────────────│
│ PO Number: ........  │ Vendor: ........ │
│ SO Number: ........  │ Vendor Code: ... │
│ PO Date: ..........  │ Email: ........ │
│ Expected Date: ....  │ Phone: ........ │
├─────────────────────────────────────────┤
│ ITEMS RECEIVED                          │
│ ─────────────────────────────────────   │
│ Item | PO Qty | Received | Condition   │
│ ─────────────────────────────────────   │
│ ...  | ...    | ...      | ...         │
├─────────────────────────────────────────┤
│ SUMMARY                                 │
│ ─────────────────────────────────────   │
│ Total Ordered: XXX units               │
│ Total Received: XXX units              │
│ Discrepancies: 0                        │
│ Status: ✓ APPROVED                      │
├─────────────────────────────────────────┤
│ Authorized By: _____________ Date: ___  │
│ Inspected By: _____________ Date: ___   │
│ Approved By: _____________ Date: ___    │
└─────────────────────────────────────────┘
```

### Invoice Template (A4)

```
┌─────────────────────────────────────────┐
│   PASSION CLOTHING ERP                  │
│   INVOICE                               │
│                                         │
│   Invoice #: INV-SO-YYYYMMDD-XXXX     │
│   Date: DD/MM/YYYY                      │
│   Status: [DRAFT/SENT/PAID]             │
├─────────────────────────────────────────┤
│ BILL TO                 │ DETAILS       │
│ ──────────────────────┼───────────────│
│ Customer Name: .....  │ Order: ........ │
│ Email: .............  │ Delivery: .... │
│ Phone: .............  │ Terms: ....... │
│ Address: ...........  │ Total: ........ │
├─────────────────────────────────────────┤
│ ITEMS                                   │
│ ──────────────────────────────────────  │
│ Item | Qty | Unit Price | Amount       │
│ ──────────────────────────────────────  │
│ ...  | ... | ...        | ...          │
├─────────────────────────────────────────┤
│ TOTALS                                  │
│ ──────────────────────────────────────  │
│ Subtotal: ................. $X,XXX.XX   │
│ Tax (18%): ................ $X,XXX.XX   │
│ TOTAL DUE: ................ $X,XXX.XX   │
├─────────────────────────────────────────┤
│ Terms & Conditions                      │
│ Payment due within 30 days              │
│ Late payment: 2% per month interest     │
└─────────────────────────────────────────┘
```

---

## 🔌 Integration Points

### Frontend (React)

1. **Admin Dashboard**: View all PDFs for a sales order
2. **ProcurementDashboard**: Download GRN slips
3. **SalesOrder Detail**: View linked documents
4. **GRN Detail Page**: Manual trigger buttons

### Backend Routes

1. `GET /api/documents/sales-order/:id` - Get all docs for SO
2. `POST /api/documents/manual-trigger` - Trigger PDF generation
3. `GET /api/documents/:docId/download` - Download PDF
4. `DELETE /api/documents/:docId` - Delete document
5. `PUT /api/documents/:docId/version` - Create new version

---

## ⚙️ Configuration

### Environment Variables (.env)

```
# PDF Generation
PDF_OUTPUT_DIR=uploads/documents
PDF_COMPANY_NAME=Passion Clothing ERP
PDF_COMPANY_EMAIL=info@passionclothing.com
PDF_COMPANY_PHONE=+1-800-PASSION

# Auto-triggers
ENABLE_AUTO_TRIGGERS=true
TRIGGER_DELAY_MS=1000

# Notifications
NOTIFY_ON_PDF_GENERATED=true
NOTIFY_ON_GRN_APPROVED=true
```

---

## 🐛 Troubleshooting

### PDFs not generating

1. Check `/server/uploads/documents/` directory exists
2. Verify Node.js has write permissions
3. Check `server/logs/pdf-generation.log`

### Triggers not executing

1. Verify JWT token is valid
2. Check user has required permissions
3. View error logs for entity validation

### Documents not linking to SO

1. Ensure DocumentAttachment table exists
2. Verify foreign key relationships
3. Check entity_type and entity_id match

---

## 📞 Support & Maintenance

For issues or enhancements:

1. Check logs: `server/logs/document-service.log`
2. Review database: `SELECT * FROM document_attachments`
3. Test manually: Use manual-trigger endpoint

---

## 🎯 Future Enhancements

- [ ] Email PDF delivery to vendors/customers
- [ ] Digital signatures on PDFs
- [ ] OCR for manual GRN uploads
- [ ] Barcode/QR code on all PDFs
- [ ] Batch PDF generation
- [ ] PDF versioning and archival
- [ ] Advanced search for documents
- [ ] Audit trail for PDF modifications
