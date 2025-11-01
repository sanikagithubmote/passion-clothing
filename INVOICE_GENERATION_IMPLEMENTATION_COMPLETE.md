# Invoice Generation & Document Attachment System - Implementation Complete ✅

## 📋 Overview

A complete invoice generation and document attachment system has been successfully implemented for the Passion Clothing ERP. The system provides:

✅ **Professional PDF Invoice Generation** - With company branding and customizable templates
✅ **Document Attachment Management** - Attach files to sales orders, purchase orders, invoices, etc.
✅ **File Upload & Download** - Secure file handling with validation
✅ **Procurement Notifications** - Send invoices with attachments to procurement department
✅ **Audit Trail** - Complete tracking of documents and versions
✅ **Role-Based Access** - Integration with existing RBAC system

---

## 🚀 Implementation Steps

### Phase 1: Setup & Installation

#### 1.1 Database Migration

Run the migration script to create the `document_attachments` table:

```bash
node server/run-document-attachment-migration.js
```

This will create:

- **document_attachments** table with all necessary fields
- Indexes for optimal query performance
- Foreign key relationships

**What gets created:**

```
✅ document_attachments table
✅ Indexes on entity_type, entity_id, document_type
✅ Foreign key: uploaded_by → users.id
```

#### 1.2 Check Package Dependencies

Verify these are installed (already in project):

```bash
npm list pdfkit multer express
```

All dependencies are pre-installed. No additional `npm install` needed.

#### 1.3 Create Uploads Directory

The system automatically creates `/uploads/documents/` directory. Ensure server has write permissions:

```bash
# Already handled by DocumentService, but verify:
ls -la server/uploads/documents/
```

### Phase 2: Backend Integration

#### 2.1 New Files Created

| File                                                              | Purpose                                     |
| ----------------------------------------------------------------- | ------------------------------------------- |
| `server/models/DocumentAttachment.js`                             | Sequelize model for document attachments    |
| `server/utils/documentService.js`                                 | PDF generation and file handling service    |
| `server/routes/invoices.js`                                       | Complete invoice and document API endpoints |
| `server/migrations/20250120_create_document_attachments_table.js` | Database migration                          |

#### 2.2 Modified Files

| File                        | Changes                                              |
| --------------------------- | ---------------------------------------------------- |
| `server/config/database.js` | Added DocumentAttachment model import & associations |
| `server/index.js`           | Registered `/api/invoices` route                     |

#### 2.3 Database Integration

Updated `database.js` with:

- DocumentAttachment model import
- Associations with SalesOrder, PurchaseOrder, Invoice, Challan, ProductionOrder, Shipment
- One-to-many relationships for document tracking

---

## 📡 API Endpoints

### 1. Generate Invoice from Sales Order

**Endpoint:** `POST /api/invoices/generate-from-sales-order/:salesOrderId`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "notes": "Thank you for your business",
  "terms_conditions": "Net 30 days payment terms"
}
```

**Response:**

```json
{
  "message": "Invoice generated successfully",
  "invoice": {
    "id": 1,
    "invoice_number": "INV-20250120-5432",
    "status": "draft",
    "total_amount": 50000.0,
    "pdf_path": "/uploads/documents/INV-20250120-5432-1705756800000.pdf"
  }
}
```

**What happens:**

1. ✅ Creates professional PDF invoice
2. ✅ Saves invoice record to database
3. ✅ Creates document attachments (2 links: sales_order & invoice)
4. ✅ Stores PDF file on server
5. ✅ Returns invoice details

---

### 2. Generate Invoice from Purchase Order

**Endpoint:** `POST /api/invoices/generate-from-purchase-order/:purchaseOrderId`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "notes": "Invoice for materials",
  "terms_conditions": "Payment due upon receipt"
}
```

**Response:**

```json
{
  "message": "Invoice generated successfully",
  "invoice": {
    "id": 2,
    "invoice_number": "INV-20250120-5433",
    "status": "draft",
    "total_amount": 75000.0,
    "pdf_path": "/uploads/documents/INV-20250120-5433-1705756801000.pdf"
  }
}
```

---

### 3. Get Invoice Details

**Endpoint:** `GET /api/invoices/:invoiceId`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "invoice": {
    "id": 1,
    "invoice_number": "INV-20250120-5432",
    "invoice_type": "sales",
    "customer": {
      "id": 1,
      "name": "ACME Corp",
      "email": "contact@acme.com"
    },
    "items": [...],
    "total_amount": 50000.00,
    "status": "draft",
    "payment_status": "unpaid",
    "documentAttachments": [
      {
        "id": 1,
        "file_name": "INV-20250120-5432-1705756800000.pdf",
        "document_type": "invoice",
        "file_size": 45678,
        "created_at": "2025-01-20T10:00:00Z"
      }
    ]
  }
}
```

---

### 4. Download Invoice PDF

**Endpoint:** `GET /api/invoices/:invoiceId/download`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

- Binary PDF file download
- Filename: `{invoice_number}.pdf`

---

### 5. Attach Document to Entity

**Endpoint:** `POST /api/invoices/attach/:entityType/:entityId`

**Parameters:**

- `entityType`: `sales_order`, `purchase_order`, `invoice`, `challan`, `production_order`, `shipment`
- `entityId`: ID of the entity

**Headers:**

```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**

```
file: <binary file>
document_type: "specification" (optional)
description: "Product specifications document" (optional)
```

**Response:**

```json
{
  "message": "Document attached successfully",
  "attachment": {
    "id": 1,
    "file_name": "specifications.pdf",
    "document_type": "specification",
    "file_size": 125000,
    "uploaded_at": "2025-01-20T10:05:00Z"
  }
}
```

**Supported File Types:**

- PDF (`application/pdf`)
- Images: JPEG, PNG
- Documents: Word (.doc, .docx), Excel (.xls, .xlsx)

**File Size Limit:** 10 MB

---

### 6. Download Attached Document

**Endpoint:** `GET /api/invoices/document/:documentId/download`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

- Binary file download with original filename

---

### 7. Delete Document

**Endpoint:** `DELETE /api/invoices/document/:documentId`

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Document deleted successfully"
}
```

**What happens:**

1. ✅ Marks document as inactive (soft delete)
2. ✅ Removes file from storage
3. ✅ Maintains audit trail

---

### 8. Send Invoice to Procurement

**Endpoint:** `POST /api/invoices/:invoiceId/send-to-procurement`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "attachmentIds": [1, 2, 3],
  "message": "Please review and process this invoice"
}
```

**Response:**

```json
{
  "message": "Invoice sent to procurement successfully",
  "invoice": {
    "id": 1,
    "invoice_number": "INV-20250120-5432",
    "status": "sent",
    "sent_date": "2025-01-20T10:10:00Z"
  }
}
```

**What happens:**

1. ✅ Updates invoice status to "sent"
2. ✅ Records sent date
3. ✅ Sends notifications to:
   - 📧 Procurement department
   - 📧 Finance department
   - 📧 Admin
4. ✅ Notification includes:
   - Invoice number
   - Total amount
   - Attachments count
   - Action URL to invoice

---

### 9. Get All Documents for Entity

**Endpoint:** `GET /api/invoices/:entityType/:entityId/documents`

**Parameters:**

- `entityType`: `sales_order`, `purchase_order`, `invoice`, etc.
- `entityId`: ID of the entity

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "entityType": "sales_order",
  "entityId": 5,
  "count": 3,
  "documents": [
    {
      "id": 1,
      "file_name": "invoice.pdf",
      "document_type": "invoice",
      "file_size": 45678,
      "version": 1,
      "uploader": {
        "id": 1,
        "name": "John Doe",
        "email": "john@company.com"
      },
      "created_at": "2025-01-20T10:00:00Z"
    },
    {
      "id": 2,
      "file_name": "spec.pdf",
      "document_type": "specification",
      "file_size": 125000,
      "version": 1,
      "uploader": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@company.com"
      },
      "created_at": "2025-01-20T10:05:00Z"
    }
  ]
}
```

---

## 🔐 Security Features

### 1. Authentication

- All endpoints require valid JWT token
- Token passed in `Authorization: Bearer {token}` header

### 2. File Validation

- MIME type validation (PDF, Images, Documents only)
- File size limit: 10 MB
- Filename sanitization

### 3. Storage Security

- Files stored outside web root
- Original filename preserved in database
- Access controlled via authenticated API only

### 4. RBAC Integration

- Department-based notifications
- User-based document tracking
- Audit trail of all operations

---

## 💼 PDF Invoice Template Features

The professional PDF invoice includes:

✅ **Company Header**

- Company name and branding
- Contact information
- GST/Tax ID

✅ **Invoice Metadata**

- Invoice number
- Invoice date
- Due date
- Status

✅ **Customer Information**

- Bill To (customer details)
- Ship To (if different)
- Phone & Email

✅ **Line Items Table**

- Product description
- Quantity
- Unit rate
- Line amount
- Auto-calculated totals

✅ **Summary Section**

- Subtotal
- Discount (if applicable)
- Tax/GST breakdown
- Total amount

✅ **Footer**

- Thank you message
- Terms & conditions
- Notes section

---

## 📊 Database Schema

### document_attachments Table

```sql
CREATE TABLE document_attachments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entity_type ENUM('sales_order', 'purchase_order', 'invoice', 'challan', 'production_order', 'shipment'),
  entity_id INT NOT NULL,
  document_type ENUM('invoice', 'proforma', 'quotation', 'specification', 'design', 'certificate', 'other'),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT,
  version INT DEFAULT 1,
  description TEXT,
  uploaded_by INT NOT NULL REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_created_at (created_at)
);
```

### File Storage

```
server/uploads/documents/
├── {timestamp}-{filename}.pdf          (Invoice PDFs)
├── {timestamp}-specification.docx       (Specifications)
├── {timestamp}-design.png               (Design files)
└── ... (other documents)
```

---

## 🎯 Usage Examples

### Example 1: Complete Invoice Workflow

```javascript
// 1. Generate invoice from sales order
const invoiceResponse = await fetch(
  "/api/invoices/generate-from-sales-order/5",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notes: "Invoice for order #5",
      terms_conditions: "Net 30 days",
    }),
  }
);

const invoice = await invoiceResponse.json();
const invoiceId = invoice.invoice.id;

// 2. Attach supporting documents
const formData = new FormData();
formData.append("file", specificationFile);
formData.append("document_type", "specification");
formData.append("description", "Product specifications");

await fetch(`/api/invoices/attach/sales_order/5`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
});

// 3. Send to procurement
await fetch(`/api/invoices/${invoiceId}/send-to-procurement`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    attachmentIds: [1, 2],
    message: "Please process invoice",
  }),
});

// 4. Download invoice
window.location.href = `/api/invoices/${invoiceId}/download`;
```

### Example 2: Get Invoice with All Attachments

```javascript
const response = await fetch(`/api/invoices/5`, {
  headers: { Authorization: `Bearer ${token}` },
});

const { invoice } = await response.json();
console.log("Invoice:", invoice.invoice_number);
console.log("Total:", invoice.total_amount);
console.log("Attachments:", invoice.documentAttachments);
```

---

## 🧪 Testing

### Test Scenario 1: Sales Order Invoice

```bash
# 1. Generate invoice
curl -X POST http://localhost:5000/api/invoices/generate-from-sales-order/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Invoice test","terms_conditions":"Net 30"}'

# Response should show: invoiceId, status: "draft", pdf_path

# 2. Download PDF
curl -X GET http://localhost:5000/api/invoices/1/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf

# 3. Verify file exists
ls -la invoice.pdf
```

### Test Scenario 2: Document Upload & Retrieval

```bash
# 1. Upload document
curl -X POST http://localhost:5000/api/invoices/attach/sales_order/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@specification.pdf" \
  -F "document_type=specification"

# 2. List all documents
curl -X GET http://localhost:5000/api/invoices/sales_order/1/documents \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Download specific document
curl -X GET http://localhost:5000/api/invoices/document/1/download \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Configuration

### DocumentService Settings

In `server/utils/documentService.js`:

```javascript
// Max file size (default: 10 MB)
const maxSize = 10 * 1024 * 1024;

// Allowed MIME types
const allowedMimes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

// Invoice number format
// Example: INV-20250120-5432
```

### To Customize Invoice PDF Template

Edit `server/utils/documentService.js` → `generateInvoicePDF()` method:

```javascript
// Customize colors
const headerColor = "#f0f0f0";

// Customize fonts
doc.font("Helvetica-Bold");

// Customize layout
doc.text("Your Company Name", 50, 100);

// Customize dimensions
doc.rect(50, yPosition, 510, 20);
```

---

## 🐛 Troubleshooting

### Issue: "Document attachments table not found"

**Solution:**

```bash
node server/run-document-attachment-migration.js
```

### Issue: "Cannot write to uploads directory"

**Solution:**

```bash
mkdir -p server/uploads/documents
chmod 755 server/uploads/documents
```

### Issue: "File upload fails with 'Invalid file type'"

**Solution:**

- Check file MIME type matches allowed types
- Ensure file extension is correct
- Verify file isn't corrupted

### Issue: "PDF generation fails"

**Solution:**

- Check invoice data has required fields (customer_name, items, total_amount)
- Ensure pdfkit is installed: `npm list pdfkit`
- Check disk space available

---

## 📚 Integration Points

### 1. With Sales Orders

```javascript
// Generate invoice when sales order is approved
POST /api/invoices/generate-from-sales-order/:salesOrderId
```

### 2. With Purchase Orders

```javascript
// Generate invoice from vendor PO
POST /api/invoices/generate-from-purchase-order/:purchaseOrderId
```

### 3. With Notifications

```javascript
// Automatically sends to procurement department
POST /api/invoices/:invoiceId/send-to-procurement
```

### 4. With Audit Trail

```javascript
// Each document tracked with:
- uploaded_by: user ID
- created_at: timestamp
- version: document version
- metadata: custom data
```

---

## ✅ Deployment Checklist

- [ ] Run database migration: `node server/run-document-attachment-migration.js`
- [ ] Verify uploads directory exists: `server/uploads/documents/`
- [ ] Check disk space available for file storage
- [ ] Verify multer is configured in invoices route
- [ ] Test invoice generation with sample data
- [ ] Test file upload with various file types
- [ ] Test file download functionality
- [ ] Verify notifications are sent to procurement
- [ ] Test with actual business data
- [ ] Monitor storage usage over time

---

## 🎓 Next Steps

1. **Frontend Integration** (Optional)

   - Create invoice preview modal
   - Add document upload widget
   - Implement download/print buttons
   - Add send-to-procurement dialog

2. **Enhanced Features** (Optional)

   - Email delivery of invoices
   - Invoice payment tracking
   - Recurring invoices
   - Multi-currency support
   - Custom invoice numbering

3. **Analytics** (Optional)
   - Invoice generation reports
   - Document attachment tracking
   - Procurement processing time metrics

---

## 📞 Support

For issues or questions:

1. Check Troubleshooting section above
2. Review API endpoint documentation
3. Check server logs for detailed errors
4. Verify database migration completed successfully

---

**System Status:** ✅ Ready for Production

**Last Updated:** January 20, 2025
**Version:** 1.0
