# Invoice & Document Attachment System - Analysis & Implementation Plan

## 📊 CURRENT PROCESS ANALYSIS

### Existing Features

1. **Attachment Fields**: Present in models but underutilized

   - GRN (Goods Receipt Notes) - `attachments` field (JSON array)
   - VendorReturns - `attachments` field (JSON array)
   - PurchaseOrder - `attachments` field (JSON array)

2. **PDF Generation**: Only for Challans

   - Route: `POST /api/challans/:id/download-pdf`
   - Uses: PDFDocument library
   - Output: Stream to browser

3. **Invoice Model**: Exists but limited implementation
   - Fields: id, payment_id, shipment_id, total_amount, etc.
   - No PDF generation
   - No attachment linking

### Current Workflow Gaps

❌ No professional invoice generation  
❌ No PDF/document attachment to orders  
❌ No invoice sending to procurement  
❌ No document versioning  
❌ No attachment download capability  
❌ No attachment validation (file type, size)  
❌ No audit trail for attached documents

---

## 🎯 PROPOSED SOLUTION ARCHITECTURE

### 1. Document Management Service

- Professional PDF generation with templates
- File storage (local or cloud)
- Attachment metadata tracking
- Document versioning

### 2. Enhanced Models

```
SalesOrder
├── invoices (relation)
├── attachments (JSON array)
└── document_metadata

Invoice
├── pdf_path (generated)
├── attachments (relation)
├── generated_at
└── sent_to_procurement

DocumentAttachment (NEW)
├── entity_id (SalesOrder, PurchaseOrder, etc.)
├── entity_type
├── file_path
├── file_name
├── file_type (invoice, po, challan, etc.)
├── uploaded_by
└── created_at
```

### 3. API Endpoints

```
POST   /api/sales/orders/:id/generate-invoice
GET    /api/sales/orders/:id/invoice
POST   /api/sales/orders/:id/attach-document
GET    /api/documents/:id/download
DELETE /api/documents/:id
POST   /api/sales/orders/:id/send-to-procurement
```

### 4. Frontend Components

- Invoice preview modal
- Document upload widget
- Download/print buttons
- Send to procurement dialog
- Document history

---

## 📋 IMPLEMENTATION STEPS

### Phase 1: Database Setup

- Create `DocumentAttachment` table
- Add indexes on entity_id, entity_type
- Migration script included

### Phase 2: Document Service

- Professional PDF generation with company branding
- Template system for different document types
- File storage management

### Phase 3: API Routes

- Invoice generation endpoint
- Document upload/download
- Send to procurement workflow
- Attachment management CRUD

### Phase 4: Frontend Integration

- Invoice display modal
- Document attachment UI
- Download functionality
- Send workflow

---

## 🛠️ TECH STACK FOR IMPLEMENTATION

- **PDF Generation**: `pdfkit` + `html-pdf` (already have pdfkit)
- **File Storage**: Local filesystem in `/uploads/documents/`
- **File Upload**: Multer middleware
- **File Validation**: Type & size checks
- **Database**: Sequelize model for DocumentAttachment

---

## 💾 DELIVERABLES

1. ✅ Migration script for DocumentAttachment table
2. ✅ DocumentAttachment Sequelize model
3. ✅ DocumentService utility (PDF generation, file handling)
4. ✅ Enhanced sales.js routes (invoice generation, send to procurement)
5. ✅ New documents.js routes (upload, download, delete)
6. ✅ Frontend components (invoice modal, upload widget)
7. ✅ Configuration for file upload/storage

---

## 🚀 NEXT STEPS

Ready to implement:

1. Backend API routes for invoice generation & document management
2. Professional PDF templates
3. Frontend UI components
4. Database migration & models

**Proceed with implementation?** ✨
