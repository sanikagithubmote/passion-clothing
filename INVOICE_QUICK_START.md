# 🚀 Invoice Generation System - Quick Start

## 5-Minute Setup

### Step 1: Run Migration

```bash
cd server
node run-document-attachment-migration.js
```

**Expected Output:**

```
Starting Document Attachment table migration...
✅ Document Attachment table created successfully!
✅ Table verification successful!
```

### Step 2: Start Server

```bash
npm start
# Server runs on http://localhost:5000
```

### Step 3: Test Generation

Use any REST client (Postman, VS Code REST Client, curl):

```bash
POST http://localhost:5000/api/invoices/generate-from-sales-order/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "notes": "Thank you for your order",
  "terms_conditions": "Payment due within 30 days"
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

✅ **Done!** Invoice system is working.

---

## 🎯 Common Workflows

### Workflow 1: Generate & Send Invoice

```bash
# 1. Generate invoice from sales order #5
POST /api/invoices/generate-from-sales-order/5
Body: {"notes": "Invoice for SO#5"}
Response: invoiceId = 1

# 2. Attach supporting document
POST /api/invoices/attach/sales_order/5
Form-Data:
  - file: <select specification.pdf>
  - document_type: specification
Response: attachmentId = 1

# 3. Send to procurement
POST /api/invoices/1/send-to-procurement
Body: {"attachmentIds": [1], "message": "Please process"}
Response: status = "sent" ✅

# 4. Download invoice
GET /api/invoices/1/download
```

### Workflow 2: View Invoice & Attachments

```bash
# Get full invoice with all attachments
GET /api/invoices/1
Response includes:
  - invoice_number, total_amount
  - customer details
  - all documentAttachments
```

### Workflow 3: Manage Documents

```bash
# List all documents for a sales order
GET /api/invoices/sales_order/5/documents
Response: [document1, document2, ...]

# Download specific document
GET /api/invoices/document/1/download

# Delete document
DELETE /api/invoices/document/1
```

---

## 📁 Project Structure

```
passion-clothing/
├── server/
│   ├── models/
│   │   └── DocumentAttachment.js          ← New model
│   ├── routes/
│   │   └── invoices.js                    ← New routes (8 endpoints)
│   ├── utils/
│   │   └── documentService.js             ← New service (PDF generation)
│   ├── migrations/
│   │   └── 20250120_create_document_attachments_table.js ← New migration
│   ├── config/
│   │   └── database.js                    ← Modified (added DocumentAttachment)
│   ├── index.js                           ← Modified (added route)
│   └── run-document-attachment-migration.js ← New script
│
├── uploads/
│   └── documents/                         ← Auto-created on first use
│       ├── INV-20250120-5432-1705756800000.pdf
│       ├── specification-1705756801000.pdf
│       └── ...
│
└── docs/
    ├── INVOICE_GENERATION_IMPLEMENTATION_COMPLETE.md ← Full docs
    └── INVOICE_QUICK_START.md ← This file
```

---

## 🔑 API Endpoints Summary

| Method | Endpoint                                         | Purpose                    |
| ------ | ------------------------------------------------ | -------------------------- |
| POST   | `/api/invoices/generate-from-sales-order/:id`    | Generate invoice from SO   |
| POST   | `/api/invoices/generate-from-purchase-order/:id` | Generate invoice from PO   |
| GET    | `/api/invoices/:id`                              | Get invoice details        |
| GET    | `/api/invoices/:id/download`                     | Download invoice PDF       |
| POST   | `/api/invoices/attach/:type/:id`                 | Attach document to entity  |
| GET    | `/api/invoices/document/:id/download`            | Download attached file     |
| DELETE | `/api/invoices/document/:id`                     | Delete document            |
| POST   | `/api/invoices/:id/send-to-procurement`          | Send invoice + attachments |
| GET    | `/api/invoices/:type/:id/documents`              | List all documents         |

---

## 🧪 Quick Tests

### Test 1: Invoice Generation

```bash
# Generate invoice
curl -X POST http://localhost:5000/api/invoices/generate-from-sales-order/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test"}'

# Should return: invoice_number, pdf_path, status: "draft"
```

### Test 2: File Upload

```bash
# Upload document
curl -X POST http://localhost:5000/api/invoices/attach/sales_order/1 \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.pdf" \
  -F "document_type=specification"

# Should return: attachment id, file_name, file_size
```

### Test 3: PDF Download

```bash
# Download invoice
curl -X GET http://localhost:5000/api/invoices/1/download \
  -H "Authorization: Bearer TOKEN" \
  --output downloaded_invoice.pdf

# File downloaded to current directory
```

### Test 4: Send to Procurement

```bash
# Send invoice
curl -X POST http://localhost:5000/api/invoices/1/send-to-procurement \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"attachmentIds":[1]}'

# Should return: status: "sent", sent_date
# Notifications sent to: procurement, finance, admin
```

---

## 💾 Data Storage

**Invoice PDFs:** `server/uploads/documents/`

```
INV-20250120-5432-1705756800000.pdf (45 KB)
INV-20250120-5433-1705756801000.pdf (48 KB)
specification-1705756802000.docx (125 KB)
```

**Database:** `document_attachments` table

```
id | entity_type | entity_id | file_name | file_path | ...
1  | sales_order | 5         | INV-...   | /uploads/... | ...
2  | sales_order | 5         | spec.pdf  | /uploads/... | ...
```

---

## 🔐 Security Notes

✅ **All endpoints require JWT authentication**
✅ **File uploads validated** (MIME type, size limit 10MB)
✅ **Files stored outside web root** (not directly accessible)
✅ **Access controlled via API** (no directory browsing)
✅ **Filenames sanitized** (special chars removed)
✅ **Soft delete** (documents marked inactive, not destroyed)

---

## ⚠️ Common Issues & Fixes

| Issue                    | Solution                                                   |
| ------------------------ | ---------------------------------------------------------- |
| "Table doesn't exist"    | Run: `node server/run-document-attachment-migration.js`    |
| "Can't write files"      | Ensure `server/uploads/documents/` has write permissions   |
| "Invalid file type"      | Use: PDF, JPEG, PNG, Word, Excel files only                |
| "File too large"         | Max size: 10 MB                                            |
| "Invoice PDF blank"      | Ensure sales order has: customer_name, items, total_amount |
| "Notifications not sent" | Check procurement department exists in users table         |

---

## 📊 What Gets Created

### 1. Database Table

```sql
document_attachments (
  id, entity_type, entity_id, document_type,
  file_name, file_path, file_type, file_size,
  version, description, uploaded_by, is_active,
  metadata, created_at, updated_at
)
```

### 2. Server Models

- `DocumentAttachment` - Sequelize model for attachments

### 3. Services

- `DocumentService` - PDF generation, file handling

### 4. API Routes (8 endpoints)

- Generate from sales order
- Generate from purchase order
- Get invoice details
- Download invoice PDF
- Attach documents
- Download attachments
- Delete attachments
- Send to procurement

### 5. File Storage

- PDFs saved to `/uploads/documents/`
- Automatic directory creation
- Timestamped filenames to prevent conflicts

### 6. Notifications

- Automatic alerts to procurement department
- Email-ready (integrates with NotificationService)

---

## 🎓 Invoice PDF Contents

**Generated PDF includes:**

- ✅ Company header with branding
- ✅ Invoice number and date
- ✅ Customer billing/shipping address
- ✅ Line items table with amounts
- ✅ Subtotal, tax, discounts
- ✅ Total amount highlighted
- ✅ Payment terms and notes
- ✅ Professional footer

---

## 🚀 Next: Frontend Integration (Optional)

If you want to add UI components:

```javascript
// React component example
function InvoiceGenerator({ salesOrderId }) {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);

  const generateInvoice = async () => {
    setLoading(true);
    const response = await fetch(
      `/api/invoices/generate-from-sales-order/${salesOrderId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: "Thank you for your business",
          terms_conditions: "Net 30 days",
        }),
      }
    );
    const data = await response.json();
    setInvoice(data.invoice);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={generateInvoice} disabled={loading}>
        {loading ? "Generating..." : "Generate Invoice"}
      </button>

      {invoice && (
        <div>
          <p>Invoice: {invoice.invoice_number}</p>
          <p>Total: ₹{invoice.total_amount}</p>
          <a href={invoice.pdf_path} download>
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Migration completed without errors
- [ ] `document_attachments` table exists in database
- [ ] `/uploads/documents/` directory created
- [ ] Server starts without errors
- [ ] Can generate invoice from sales order
- [ ] PDF file created in uploads directory
- [ ] Can download invoice PDF
- [ ] Can attach documents to orders
- [ ] Can send invoice to procurement
- [ ] Notifications received by procurement department

---

## 📞 Need Help?

1. **Check full documentation:** `INVOICE_GENERATION_IMPLEMENTATION_COMPLETE.md`
2. **Review API endpoints:** Each endpoint fully documented
3. **Check troubleshooting section:** Common issues and solutions
4. **Verify database:** `SELECT * FROM document_attachments;`
5. **Check server logs:** Look for error messages

---

**Status:** ✅ Ready to use!

**All 8 API endpoints working and documented.**
