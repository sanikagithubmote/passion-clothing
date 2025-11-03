# Sales Orders Invoice System - Complete Analysis

## Overview

The invoice viewing system in the **http://localhost:3000/sales/orders** page allows users to view, generate, and download invoices for sales orders without actually downloading them. The system supports **HTML preview in-page** and **PDF/HTML file downloads**.

---

## 📊 Frontend Architecture

### 1. **Main Sales Orders Page** (`client/src/pages/sales/SalesOrdersPage.jsx`)

#### Key Features:

- **Invoice Status Column**: Shows if invoices are pending or generated
- **Invoice Management Modal**: Click on "Invoice" action button to open modal
- **Invoice Button**: Located in the action menu (3-dot menu) for each order

#### Code Flow:

```javascript
// Line 95-96: Invoice modal state
const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);

// Line 733-735: Open invoice modal
setSelectedOrderForInvoice(order);
setShowInvoiceModal(true);

// Line 1093-1101: Render modal with order data
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

### 2. **Invoice Management Modal** (`client/src/components/sales/InvoiceManagementModal.jsx`)

#### Purpose:

Modal dialog that displays all invoices for an order and provides:

- Generate/regenerate invoice buttons
- Preview invoices
- Download invoices as PDF
- Print invoices

#### Key Endpoints Called:

```javascript
// Line 30: Fetch existing invoices for order
const response = await api.get(`/documents/timeline/${order.id}`);

// Line 47: Generate new invoice
await api.post(`/sales/orders/${order.id}/generate-invoice`, {
  orderNumber: order.order_number,
});

// Line 62: Download invoice
const response = await api.get(`/documents/download/${documentId}`, {
  responseType: "blob",
});

// Line 80: Print/preview invoice
window.open(`/documents/preview/${documentId}`, "_blank");
```

#### Modal Features:

| Feature             | Implementation                                                        |
| ------------------- | --------------------------------------------------------------------- |
| **Stats Display**   | Shows "Pending" and "Generated" invoice counts                        |
| **Generate Button** | Creates new invoice via POST to `/sales/orders/{id}/generate-invoice` |
| **Invoice List**    | Shows all generated invoices with file info                           |
| **Print Button**    | Opens `/documents/preview/{id}` in new window                         |
| **Download Button** | Downloads invoice file from `/documents/download/{id}`                |

---

### 3. **Invoice Template Component** (`client/src/components/InvoiceTemplate.jsx`)

#### Purpose:

Displays invoice preview within the Sales Order Details page (**Invoice Tab**)

#### Key Endpoints Called:

```javascript
// Line 23: Fetch invoice HTML preview
const response = await api.get(`/invoices/preview/${salesOrderId}`);

// Line 38: Download PDF
const response = await api.get(`/invoices/download-pdf/${salesOrderId}`, {
  responseType: "blob",
});

// Line 67: Download HTML
const response = await api.get(`/invoices/download-html/${salesOrderId}`, {
  responseType: "blob",
});
```

#### Display Flow:

1. **Load Invoice Data**: Fetches HTML preview from `/invoices/preview/{id}`
2. **Render HTML**: Displays using `dangerouslySetInnerHTML` (Line 160)
3. **Action Buttons**: Provides Download PDF, Download HTML, and Print options
4. **Print Styles**: CSS media queries handle print formatting (Lines 171-179)

#### Action Buttons:

```javascript
// Download PDF Button (Line 131-137)
GET / invoices / download - pdf / { salesOrderId };
// Response: PDF blob

// Download HTML Button (Line 139-145)
GET / invoices / download - html / { salesOrderId };
// Response: HTML blob

// Print Button (Line 147-152)
window.print(); // Browser's native print dialog
```

---

### 4. **Invoice Status Panel** (`client/src/components/sales/InvoiceStatusPanel.jsx`)

#### Purpose:

Compact sidebar/panel component for invoice status display

#### Features:

- Display pending/generated invoice stats
- Quick access to generate invoice
- List recent invoices
- Preview/Download buttons

---

## 🔌 Backend API Endpoints

### Invoice Routes (`server/routes/invoices.js`)

#### 1. **Generate Invoice for Sales Order**

```
POST /api/invoices/generate-from-sales-order/:salesOrderId
Headers: Authorization: Bearer {token}
Body: {
  notes: string (optional),
  terms_conditions: string (optional)
}

Response:
{
  success: boolean,
  message: string,
  invoice_id: UUID,
  invoice_number: string
}
```

**Implementation (Lines 59-215)**:

- Fetches sales order with customer details
- Generates unique invoice number
- Calculates totals (subtotal, tax, total)
- Creates Invoice record in DB
- Generates PDF using `documentService.generateInvoicePDF()`
- Creates DocumentAttachment record
- Sends notifications

---

#### 2. **Preview Invoice (HTML)**

```
GET /api/invoices/preview/:salesOrderId
Headers: Authorization: Bearer {token}

Response:
{
  success: boolean,
  invoice_id: UUID,
  invoice_number: string,
  order_number: string,
  html: string (full HTML content)
}
```

**Implementation (Lines 741-817)**:

- Fetches sales order with customer
- Creates invoice if doesn't exist (auto-create)
- Generates HTML using `generateInvoiceHTML()` function
- Returns rendered HTML for browser display
- **Note**: Auto-creates draft invoice if none exists

---

#### 3. **Download PDF**

```
GET /api/invoices/download-pdf/:salesOrderId
Headers: Authorization: Bearer {token}

Response: Binary PDF file
Content-Disposition: attachment; filename="Invoice-{orderNumber}.pdf"
```

**Implementation (Lines 821-890)**:

- Checks for existing PDF in DocumentAttachment table
- If exists, serves cached file
- Otherwise, generates new PDF on-the-fly using pdfkit
- Sets proper headers for file download
- Filename: `Invoice-{ORDER_NUMBER}.pdf`

---

#### 4. **Download HTML**

```
GET /api/invoices/download-html/:salesOrderId
Headers: Authorization: Bearer {token}

Response: Text HTML file
Content-Disposition: attachment; filename="Invoice-{orderNumber}.html"
```

**Implementation (Lines 892-935)**:

- Fetches sales order
- Generates HTML using `generateInvoiceHTML()`
- Sets proper headers for HTML download
- Filename: `Invoice-{ORDER_NUMBER}.html`

---

#### 5. **Fetch Invoice Documents Timeline**

```
GET /api/documents/timeline/:entityId
Headers: Authorization: Bearer {token}

Response:
{
  documents: [
    {
      id: UUID,
      document_type: string,
      file_name: string,
      file_size: number,
      created_at: timestamp
    }
  ],
  pending: number
}
```

Used by: `InvoiceManagementModal.jsx` (Line 30)

---

#### 6. **Download Document**

```
GET /api/documents/download/:documentId
Headers: Authorization: Bearer {token}

Response: Binary file (PDF, etc.)
```

Used by: `InvoiceManagementModal.jsx` (Line 62)

---

#### 7. **Preview Document**

```
GET /api/documents/preview/:documentId
Headers: Authorization: Bearer {token}

Response:
{
  previewUrl: string (URL to open in browser)
}
```

Used by: `InvoiceManagementModal.jsx` (Line 80)

---

## 📋 Invoice HTML Structure

### Generated HTML Template (`generateInvoiceHTML()` - Lines 940-1272)

The invoice HTML includes:

**Header Section**:

```html
<h2>Sales Order Invoice</h2>
Company Info: - Passion Clothing Co. - Chakan, Pune - Email:
info@passion-clothing.com - Phone: +91-8080659069 - GSTIN: 09AAACH7409R1ZZ
```

**Status Box**:

```html
<div class="status-box">🟡 Status: {salesOrder.status}</div>
```

**Order Information**:

- Order Number
- Order Date
- Expected Delivery
- Payment Terms

**Customer Information**:

- Customer Name
- Customer ID
- Email
- Phone

**Order Details Table**:

```html
<table>
  <thead>
    <tr>
      <th>Item Description</th>
      <th>Qty</th>
      <th>Unit Price (₹)</th>
      <th>Total (₹)</th>
    </tr>
  </thead>
  <tbody>
    {items.map(item => (
    <tr>
      <td>{item.product_name}</td>
      <td>{item.quantity}</td>
      <td>₹{item.unit_price}</td>
      <td>₹{item.quantity * item.unit_price}</td>
    </tr>
    ))}
  </tbody>
</table>
```

**Financial Summary**:

```html
<div class="summary">
  <table>
    <tr>
      <td>Sub Total:</td>
      <td>₹{subtotal}</td>
    </tr>
    <tr>
      <td>GST (Tax):</td>
      <td>₹{tax}</td>
    </tr>
    <tr class="total">
      <td>Total Amount:</td>
      <td>₹{total}</td>
    </tr>
  </table>
</div>
```

**QR Code Section**:

```html
<img
  src="https://api.qrserver.com/v1/create-qr-code/?data={encodeURIComponent(...)}"
/>
```

**Styling**:

- Responsive design
- Print-friendly CSS
- Professional blue (#007bff) color scheme
- Proper spacing and typography

---

## 🔄 Complete Flow Diagram

### From Sales Order → Invoice View

```
User Views Sales Orders Page
         ↓
Clicks "Invoice" button on order row
         ↓
InvoiceManagementModal Opens
         ↓
Fetches: GET /documents/timeline/{order.id}
         ↓
Display existing invoices OR empty state
         ↓
User clicks "Generate Invoice" button
         ↓
POST /sales/orders/{id}/generate-invoice
         ↓
Backend:
  - Fetches sales order with customer
  - Generates unique invoice number
  - Creates Invoice record
  - Generates PDF via documentService
  - Creates DocumentAttachment record
         ↓
Frontend: Refreshes invoice list
         ↓
User sees generated invoice in modal
         ↓
User can:
  a) Click Print → Opens preview in new tab
  b) Click Download → Downloads PDF/HTML file
```

---

### From Sales Order Details → Invoice Tab

```
User clicks order row
         ↓
SalesOrderDetailsPage loads
         ↓
User clicks "Invoice" tab
         ↓
InvoiceTemplate component mounts
         ↓
Fetches: GET /invoices/preview/{salesOrderId}
         ↓
Backend generates/retrieves invoice & HTML
         ↓
HTML rendered in browser using dangerouslySetInnerHTML
         ↓
User can:
  a) Download PDF → GET /invoices/download-pdf/{id}
  b) Download HTML → GET /invoices/download-html/{id}
  c) Print → Browser print dialog
```

---

## 🎯 Key Implementation Details

### 1. **Invoice Auto-Creation**

```javascript
// invoices.js lines 767-794
if (!invoice) {
  // Auto-create draft invoice if none exists
  invoice = await Invoice.create({...})
}
```

**Behavior**: When viewing invoice preview, if no invoice exists, one is automatically created.

### 2. **File Download Handling** (Frontend)

```javascript
// InvoiceTemplate.jsx lines 36-52
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement("a");
link.href = url;
link.setAttribute("download", fileName);
document.body.appendChild(link);
link.click();
```

**Behavior**: Creates a temporary blob URL, simulates link click for download.

### 3. **Print Styling**

```css
@media print {
  .print\:hidden {
    display: none;
  }
  .invoice-preview {
    page-break-after: always;
  }
}
```

**Behavior**: Hides action buttons when printing, maintains proper page breaks.

### 4. **Invoice Number Generation**

```javascript
// documentService.generateInvoiceNumber()
// Returns unique invoice number (format: INV-XXXXXXXX or similar)
```

---

## 📊 Database Records

### Invoice Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  invoice_number VARCHAR UNIQUE,
  invoice_type ENUM('sales', 'purchase'),
  sales_order_id UUID FOREIGN KEY,
  customer_id UUID FOREIGN KEY,
  invoice_date TIMESTAMP,
  due_date TIMESTAMP,
  items JSON,
  subtotal DECIMAL,
  total_tax_amount DECIMAL,
  total_amount DECIMAL,
  status ENUM('draft', 'sent', 'paid', 'cancelled'),
  payment_status ENUM('unpaid', 'partial', 'paid'),
  pdf_path VARCHAR,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### DocumentAttachment Table

```sql
CREATE TABLE document_attachments (
  id UUID PRIMARY KEY,
  entity_type VARCHAR,
  entity_id UUID,
  document_type VARCHAR (e.g., 'invoice'),
  file_name VARCHAR,
  file_path VARCHAR,
  file_size NUMBER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🔐 Security & Access Control

### Authentication

- All endpoints require: `Authorization: Bearer {token}` header
- Middleware: `authenticateToken` (Lines 19 in invoices.js)

### Authorization

- Finance department: Can generate and view invoices
- Sales department: Can view their order invoices
- Admin: Full access

---

## ⚠️ Current Limitations & Notes

1. **PDF Generation**: Uses pdfkit for simple text-based PDF. Complex layouts may need improvement.
2. **QR Code**: Generated externally via `api.qrserver.com` - requires internet connectivity.
3. **Auto-Create**: Invoice preview auto-creates draft invoice if none exists.
4. **File Caching**: PDF files are cached in DocumentAttachment table.
5. **Company Info**: Hardcoded in template - should be moved to configuration.

---

## 🔧 Integration Points

### Connected Systems

1. **Sales Orders**: `/api/sales/orders/{id}`
2. **Customers**: `/api/customers/{id}`
3. **Document Service**: PDF generation, file handling
4. **Notifications**: Invoice status updates
5. **Finance Module**: Invoice tracking and reporting

---

## 📝 Data Flow Summary

| Component              | Purpose                      | Key Endpoint                             |
| ---------------------- | ---------------------------- | ---------------------------------------- |
| SalesOrdersPage        | Main dashboard               | GET /sales/orders                        |
| InvoiceManagementModal | Modal for invoice management | GET /documents/timeline                  |
| InvoiceTemplate        | Invoice preview & download   | GET /invoices/preview                    |
| Backend API            | Invoice processing           | POST /invoices/generate-from-sales-order |
| DocumentService        | File generation & storage    | Internal utility                         |
| Database               | Invoice & document storage   | Invoice, DocumentAttachment tables       |

---

## 🎬 Quick User Journey

```
1. User opens http://localhost:3000/sales/orders
2. Sees list of all sales orders
3. Clicks "Invoice" button on desired order
4. InvoiceManagementModal opens
5. Clicks "Generate Invoice" (if none exist)
6. Backend creates invoice record, generates PDF
7. Invoice appears in modal list
8. User can:
   - Print (opens print dialog)
   - Download (saves file locally)
   - View again later (invoice persists in DB)
```

---

## ✅ Conclusion

The invoice viewing system is a **non-destructive, browser-based preview and download system**:

- ✅ View invoices in-page without download
- ✅ Generate new invoice versions
- ✅ Download as PDF or HTML
- ✅ Print directly from browser
- ✅ Track invoice history
- ✅ Secure with authentication/authorization

No file downloads are **required** - the invoice HTML can be viewed entirely in the browser using the InvoiceTemplate component.
