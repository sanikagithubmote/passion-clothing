# GRN Procurement Document Management - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- Node.js server running on `http://localhost:5000`
- JWT authentication token
- Valid GRN/Sales Order/Purchase Order IDs

---

## 📝 Test Requests (cURL)

### 1️⃣ Create a Sales Order

```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_id": 1,
    "order_number": "SO-20240115-001",
    "delivery_date": "2024-01-20",
    "items": [
      {
        "product_name": "Cotton Fabric",
        "quantity": 100,
        "unit_price": 50,
        "total_amount": 5000
      }
    ],
    "final_amount": 5000,
    "status": "pending"
  }'
```

---

### 2️⃣ Confirm Sales Order (Generates Invoice)

```bash
curl -X POST http://localhost:5000/api/documents/manual-trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trigger_type": "sales.confirmed",
    "entity_id": 1
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Trigger 'sales.confirmed' executed successfully",
  "result": {
    "invoice": true,
    "po": {
      "id": 1,
      "po_number": "PO-1234567890",
      "status": "draft"
    }
  }
}
```

---

### 3️⃣ Approve Purchase Order (Generates PO PDF)

```bash
curl -X POST http://localhost:5000/api/documents/manual-trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trigger_type": "po.approved",
    "entity_id": 1
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Trigger 'po.approved' executed successfully",
  "result": {
    "po_generated": true,
    "notification_sent": true,
    "document": {
      "id": 1,
      "file_name": "PO-PO-1234567890.pdf",
      "file_path": "uploads/documents/purchase_orders/PO-PO-1234567890.pdf"
    }
  }
}
```

---

### 4️⃣ Create GRN (Goods Receipt Note)

```bash
curl -X POST http://localhost:5000/api/grn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "purchase_order_id": 1,
    "grn_number": "GRN-20240115-001",
    "total_quantity": 100,
    "items": [
      {
        "product_id": 1,
        "po_quantity": 100,
        "received_quantity": 100,
        "condition": "good"
      }
    ],
    "status": "pending"
  }'
```

---

### 5️⃣ GRN Pending → Notify Inspector

```bash
curl -X POST http://localhost:5000/api/documents/manual-trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trigger_type": "grn.pending",
    "entity_id": 1,
    "entity_type": "goods_receipt_note"
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Trigger 'grn.pending' executed successfully",
  "result": {
    "notification_sent": true
  }
}
```

**📢 Notification Sent To**: QA/Inspector Team

---

### 6️⃣ GRN Received → Generate Preliminary Slip

```bash
curl -X POST http://localhost:5000/api/documents/manual-trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trigger_type": "grn.received",
    "entity_id": 1,
    "entity_type": "goods_receipt_note"
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Trigger 'grn.received' executed successfully",
  "result": {
    "slip_generated": true,
    "notification_sent": true
  },
  "document": {
    "id": 2,
    "file_name": "GRN-GRN-20240115-001.pdf",
    "file_path": "uploads/documents/grn_slips/GRN-GRN-20240115-001.pdf",
    "document_type": "grn_slip"
  }
}
```

**📄 Document**: GRN Slip (Preliminary - Awaiting Inspection)
**📢 Notification Sent To**: QA Team for inspection

---

### 7️⃣ GRN Verified → Quality Check Passed

```bash
curl -X POST http://localhost:5000/api/documents/manual-trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "trigger_type": "grn.verified",
    "entity_id": 1,
    "entity_type": "goods_receipt_note"
  }'
```

**Response**:

```json
{
  "success": true,
  "message": "Trigger 'grn.verified' executed successfully",
  "result": {
    "verified": true,
    "notification_sent": true
  }
}
```

**✓ Actions**:

- Mark all items as "passed" inspection
- Items marked as inspected
- Notification sent to approver

---

### 8️⃣ GRN Approved → Auto-Update Inventory & Ready Manufacturing

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

**Response**:

```json
{
  "success": true,
  "message": "Trigger 'grn.approved' executed successfully",
  "result": {
    "grn_approved": true,
    "stock_updated": true,
    "document_generated": true,
    "notifications_sent": 2,
    "next_workflow": "manufacturing_ready",
    "document": {
      "id": 3,
      "file_name": "GRN-GRN-20240115-001-FINAL.pdf",
      "file_path": "uploads/documents/grn_slips/GRN-GRN-20240115-001-FINAL.pdf",
      "document_type": "grn_slip"
    }
  }
}
```

**✅ Actions**:

- ✓ GRN status updated to "approved"
- ✓ Inventory stock updated (+100 units)
- ✓ Purchase Order marked as "received"
- ✓ Sales Order status changed to "procurement_completed"
- ✓ Final GRN Slip PDF generated with signatures
- ✓ 2 notifications sent:
  - To Procurement Team
  - To Manufacturing Team
- ✓ Manufacturing workflow triggered

---

### 9️⃣ View All Documents for Sales Order

```bash
curl -X GET "http://localhost:5000/api/documents/sales-order/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:

```json
{
  "success": true,
  "data": {
    "sales_order": {
      "id": 1,
      "order_number": "SO-20240115-001",
      "customer": "Acme Corp",
      "status": "procurement_completed"
    },
    "documents": [
      {
        "id": 1,
        "entity_type": "sales_order",
        "document_type": "invoice",
        "file_name": "INV-SO-20240115-001.pdf",
        "file_path": "uploads/documents/invoices/INV-SO-20240115-001.pdf",
        "created_at": "2024-01-15T08:00:00Z"
      },
      {
        "id": 2,
        "entity_type": "purchase_order",
        "document_type": "po_document",
        "file_name": "PO-PO-1234567890.pdf",
        "file_path": "uploads/documents/purchase_orders/PO-PO-1234567890.pdf",
        "created_at": "2024-01-15T09:30:00Z"
      },
      {
        "id": 3,
        "entity_type": "goods_receipt_note",
        "document_type": "grn_slip",
        "file_name": "GRN-GRN-20240115-001.pdf",
        "file_path": "uploads/documents/grn_slips/GRN-GRN-20240115-001.pdf",
        "created_at": "2024-01-15T14:00:00Z"
      }
    ],
    "stats": {
      "total_documents": 3,
      "document_types": {
        "invoice": 1,
        "purchase_order": 1,
        "grn_slip": 1
      }
    }
  }
}
```

---

## 🔄 Complete Workflow Sequence

### Timeline for One Sales Order:

```
┌─ T=0:00 ────────────────────────────────────────────────────────┐
│ 1. Sales Order Confirmed                                         │
│    ✓ Generate Sales Invoice PDF                                 │
│    ✓ Auto-create Purchase Order (draft)                         │
│    ✓ Notification: Sales Team                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─ T=0:30 ────────────────────────────────────────────────────────┐
│ 2. Purchase Order Approved (Admin)                              │
│    ✓ Generate Purchase Order PDF                                │
│    ✓ Update PO status to "sent"                                 │
│    ✓ Notification: Procurement Team                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─ T=0:45 ────────────────────────────────────────────────────────┐
│ 3. GRN Created & Pending                                         │
│    ✓ GRN status: "pending"                                      │
│    ✓ Notification: Inspector Team                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─ T=1:00 ────────────────────────────────────────────────────────┐
│ 4. Goods Physically Received                                    │
│    ✓ GRN status: "received"                                     │
│    ✓ Generate Preliminary GRN Slip PDF                          │
│    ✓ Notification: QA Team for inspection                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─ T=2:00 ────────────────────────────────────────────────────────┐
│ 5. Quality Inspection Passed                                    │
│    ✓ GRN status: "verified"                                     │
│    ✓ All items marked as "passed"                               │
│    ✓ Notification: Approver for final approval                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─ T=2:30 ────────────────────────────────────────────────────────┐
│ 6. GRN Approved - AUTO-WORKFLOW TRIGGERED                       │
│    ✓ GRN status: "approved"                                     │
│    ✓ Generate Final GRN Slip PDF with signatures                │
│    ✓ UPDATE: Inventory stock +100 units                         │
│    ✓ UPDATE: Purchase Order status → "received"                 │
│    ✓ UPDATE: Sales Order status → "procurement_completed"      │
│    ✓ Notifications sent:                                        │
│      - Procurement Team (GRN approved)                          │
│      - Manufacturing Team (Materials ready)                     │
│    ✓ NEXT WORKFLOW: Manufacturing Ready                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ✨ READY FOR PRODUCTION ✨
```

---

## 📊 Document Timeline for Admin Dashboard

### API Response Structure

**GET /api/documents/sales-order/:id/timeline**

```json
{
  "timeline": [
    {
      "timestamp": "2024-01-15T08:00:00Z",
      "event": "Sales Order Confirmed",
      "document": { ... }
    },
    {
      "timestamp": "2024-01-15T09:30:00Z",
      "event": "Purchase Order Approved",
      "document": { ... }
    },
    {
      "timestamp": "2024-01-15T14:00:00Z",
      "event": "GRN Received",
      "document": { ... }
    },
    {
      "timestamp": "2024-01-15T15:30:00Z",
      "event": "GRN Approved",
      "document": { ... }
    }
  ]
}
```

---

## 🎯 Key Features

### Auto-Triggers

- ✅ When GRN approved → Automatically updates inventory
- ✅ When GRN approved → Automatically updates sales order status
- ✅ When GRN approved → Automatically notifies manufacturing
- ✅ No manual intervention needed after approval

### PDF Documents Generated

- 📄 Sales Invoice (on SO confirmed)
- 📄 Purchase Order (on PO approved)
- 📄 GRN Slip Preliminary (on goods received)
- 📄 GRN Slip Final (on approval)
- 📄 Manufacturing Slips (on stage completion)
- 📄 Delivery Invoice (on delivery)

### Notifications Sent

- 📧 Inspector: New GRN awaiting inspection
- 📧 QA Team: Goods received for quality check
- 📧 Approver: Quality check passed, ready for approval
- 📧 Procurement: GRN approved, stock updated
- 📧 Manufacturing: Materials ready for production

---

## 🔑 Environment Setup

Create `.env` in server directory:

```
PDF_OUTPUT_DIR=uploads/documents
PDF_COMPANY_NAME=Passion Clothing ERP
PDF_COMPANY_EMAIL=info@passionclothing.com
PDF_COMPANY_PHONE=+1-800-PASSION

ENABLE_AUTO_TRIGGERS=true
TRIGGER_DELAY_MS=1000

NOTIFY_ON_PDF_GENERATED=true
NOTIFY_ON_GRN_APPROVED=true
```

---

## 🚨 Error Handling

### Common Errors

**Error**: "Unknown trigger type"

```json
{
  "success": false,
  "message": "Unknown trigger type: invalid_type",
  "supported_types": [
    "sales.confirmed",
    "po.approved",
    "grn.pending",
    "grn.received",
    "grn.verified",
    "grn.approved",
    "delivery.completed"
  ]
}
```

**Solution**: Use a supported trigger type from the list

---

**Error**: "Entity not found"

```json
{
  "success": false,
  "message": "Failed to execute trigger",
  "error": "Cannot read property 'update' of null"
}
```

**Solution**: Verify entity_id is valid and exists in database

---

## 📞 Support

For questions or issues:

1. Check server logs: `tail -f server/logs/*`
2. Verify JWT token is valid
3. Check permissions in database
4. Test with Postman: Import requests from docs

---

## 🎓 Next Steps

1. ✅ Test all trigger types with your data
2. ✅ Integrate into frontend dashboard
3. ✅ Set up email notifications
4. ✅ Configure auto-trigger on GRN status change
5. ✅ View document timeline in admin dashboard
6. ✅ Set up PDF archival/retention policy
