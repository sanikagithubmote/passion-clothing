# Invoice System - Quick Reference Guide

## 🎯 Two Ways to View Invoices

### Method 1: From Sales Orders List

```
Sales Orders Page (http://localhost:3000/sales/orders)
         ↓
Click "..." (3-dot menu) on any order
         ↓
Click "Invoice" button
         ↓
InvoiceManagementModal opens
         ↓
See generated invoices
         ↓
Options: Print | Download | View Details
```

### Method 2: From Sales Order Details

```
Sales Orders Page
         ↓
Click view/eye icon on order
         ↓
SalesOrderDetailsPage loads
         ↓
Click "Invoice" tab
         ↓
InvoiceTemplate displays HTML preview
         ↓
Options: Download PDF | Download HTML | Print
```

---

## 📁 Frontend Components

```
client/src/
├── pages/sales/
│   ├── SalesOrdersPage.jsx           (Main list, manages modal)
│   ├── SalesOrderDetailsPage.jsx    (Details, has Invoice tab)
│   └── CreateSalesOrderPage.jsx     (Has download invoice option)
├── components/
│   ├── InvoiceTemplate.jsx          (Preview & download component)
│   └── sales/
│       ├── InvoiceManagementModal.jsx   (Modal for invoice list)
│       └── InvoiceStatusPanel.jsx      (Compact status display)
```

---

## 🔗 Backend API Endpoints

### Invoice Generation

```
POST /api/sales/orders/{id}/generate-invoice
Body: { orderNumber: "SO-001" }
Response: { invoice_id, invoice_number, status: "generated" }
```

### Invoice Preview (HTML)

```
GET /api/invoices/preview/{salesOrderId}
Response: { html: "<full invoice HTML>", invoice_number, order_number }
```

### Download Invoice

```
GET /api/invoices/download-pdf/{salesOrderId}
Response: Binary PDF file
File name: Invoice-{ORDER_NUMBER}.pdf

GET /api/invoices/download-html/{salesOrderId}
Response: Binary HTML file
File name: Invoice-{ORDER_NUMBER}.html
```

### Fetch Invoice Documents

```
GET /api/documents/timeline/{orderId}
Response: { documents: [...], pending: 5 }
```

### Download Document

```
GET /api/documents/download/{documentId}
Response: Binary file (whatever was uploaded)
```

---

## 🗂️ File Locations

### Frontend Code

- **Main Page**: `client/src/pages/sales/SalesOrdersPage.jsx`
- **Details Page**: `client/src/pages/sales/SalesOrderDetailsPage.jsx`
- **Invoice Modal**: `client/src/components/sales/InvoiceManagementModal.jsx`
- **Invoice Preview**: `client/src/components/InvoiceTemplate.jsx`

### Backend Code

- **Routes**: `server/routes/invoices.js`
- **Models**: `server/config/database.js` (Invoice, DocumentAttachment)
- **Services**: `server/utils/documentService.js`, `NotificationService.js`

---

## 💾 Database Tables

### Invoices Table

- `id`: UUID
- `invoice_number`: Unique string
- `sales_order_id`: Foreign key to SalesOrder
- `customer_id`: Foreign key to Customer
- `status`: draft | sent | paid | cancelled
- `total_amount`: Decimal
- `pdf_path`: File path to cached PDF

### DocumentAttachment Table

- `id`: UUID
- `entity_type`: sales_order | purchase_order | etc
- `entity_id`: UUID of the entity
- `document_type`: invoice | po | challan | etc
- `file_name`: Filename
- `file_path`: Server file path

---

## 🔍 State Management (React)

### SalesOrdersPage

```javascript
const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
```

### InvoiceManagementModal

```javascript
const [invoices, setInvoices] = useState([]);
const [generating, setGenerating] = useState(false);
const [stats, setStats] = useState({ pending: 0, generated: 0 });
```

### InvoiceTemplate

```javascript
const [invoice, setInvoice] = useState(null);
const [loading, setLoading] = useState(true);
const [downloading, setDownloading] = useState(false);
```

---

## 📊 Invoice HTML Content

The generated invoice includes:

1. **Header**

   - Title: "Sales Order Invoice"
   - Company Info (Passion Clothing Co.)
   - Contact Details

2. **Status Box**

   - Current order status
   - Status indicator

3. **Order Information**

   - Order Number
   - Order Date
   - Expected Delivery
   - Payment Terms

4. **Customer Information**

   - Name, ID, Email, Phone

5. **Items Table**

   - Product Name
   - Quantity
   - Unit Price (₹)
   - Total (₹)

6. **Financial Summary**

   - Sub Total
   - GST (Tax)
   - **Total Amount** (highlighted)

7. **QR Code**

   - Live tracking QR code
   - Generated via api.qrserver.com

8. **Footer**
   - Company name
   - Generation timestamp

---

## 🚀 Key Features

### ✅ View Invoice (No Download Required)

- InvoiceTemplate renders HTML directly in page
- Full invoice visible in browser
- No file needed on disk

### ✅ Generate Invoices

- Create new invoice on-demand
- Auto-create draft if viewing first time
- Support multiple versions

### ✅ Download Options

- **PDF**: Professional format, print-friendly
- **HTML**: Editable, can be opened in any browser

### ✅ Print Support

- Browser's native print dialog
- CSS media queries for proper formatting
- Print-friendly layout

### ✅ Document Tracking

- All invoices stored in database
- DocumentAttachment tracks file references
- Invoice history available

---

## 🔐 Security

### Authentication

- All endpoints require JWT token
- Middleware: `authenticateToken`

### Authorization

- Finance team: Generate and manage invoices
- Sales team: View own invoices
- Admin: Full access

### Data Protection

- Sensitive data encrypted
- Access logs available
- File storage on secure server

---

## ⚡ Performance

### Caching

- PDF files cached after generation
- Subsequent downloads serve cached file
- Reduces server load

### Database Queries

- Efficient joins with Customer/User models
- Indexed lookups on sales_order_id
- Pagination support

### Frontend

- React hooks for state management
- Modal prevents full-page reload
- Async operations with loading states

---

## 🐛 Common Scenarios

### Scenario 1: User wants to view invoice

```
1. Open Sales Orders page
2. Click order's "..." menu
3. Click "Invoice"
4. View modal with generated invoice
5. Can print or download from modal
```

### Scenario 2: User wants to download invoice

```
1. Open order details
2. Click "Invoice" tab
3. Click "Download PDF" or "Download HTML"
4. File saved to Downloads folder
5. Can open in PDF reader or browser
```

### Scenario 3: User wants to print invoice

```
1. Open invoice (either method above)
2. Click "Print" button
3. Browser print dialog opens
4. Select printer
5. Print to paper or PDF
```

### Scenario 4: First time viewing invoice

```
1. User opens invoice view
2. No invoice exists yet
3. System auto-creates draft invoice
4. HTML preview displayed immediately
5. User can generate new versions anytime
```

---

## 🔄 Data Flow

```
Frontend                          Backend                       Database
─────────────────────────────────────────────────────────────────────────
User clicks "Invoice"
                    ──────> GET /documents/timeline/{id}
                                                        Query: DocumentAttachment
Invoice list shown                                      Return: documents array
                    <──────

User clicks "Generate"
                    ──────> POST /sales/orders/{id}/generate-invoice
                                - Fetch SalesOrder
                                - Create Invoice record
                                - Generate PDF
                                - Save to DocumentAttachment
Modal refreshes
                    <──────

User clicks "Download"
                    ──────> GET /documents/download/{docId}
                                - Read file from path
                                - Send as blob
File downloaded     <──────

User clicks "Preview"
                    ──────> GET /invoices/preview/{id}
                                - Generate HTML
                                - Return HTML content
Invoice shown       <──────
```

---

## 📋 Configuration

### Company Info (Hardcoded in invoices.js)

```javascript
company_name: "Passion Clothing Co.";
company_email: "info@passion-clothing.com";
company_phone: "+91-8080659069";
company_gst: "09AAACH7409R1ZZ";
company_address: "Chakan, Pune";
```

**Note**: Should be moved to environment variables or database config.

### Invoice Number Format

```javascript
// Generated via documentService.generateInvoiceNumber()
// Typically: INV-{TIMESTAMP} or INV-{SEQUENCE}
```

### Default Invoice Terms

- **Due Date**: 30 days from invoice date
- **Payment Status**: "unpaid" (initially)
- **Invoice Status**: "draft" (initially)

---

## 🎨 Styling

### Colors Used

- **Primary**: #007bff (Blue)
- **Success**: #28a745 (Green)
- **Warning**: #ffc107 (Yellow)
- **Danger**: #dc3545 (Red)
- **Background**: #f7f9fc (Light Gray)

### Responsive

- Mobile: Single column
- Tablet: 2 columns
- Desktop: Full layout

### Print Styles

- Removes buttons (print:hidden)
- Maintains formatting
- Proper page breaks

---

## 📞 Support & Troubleshooting

### Invoice Not Showing

1. Check if order exists: `GET /sales/orders`
2. Check if invoice was created: `GET /documents/timeline/{id}`
3. Verify authentication token is valid

### Download Not Working

1. Check browser console for errors
2. Verify file path exists on server
3. Check file permissions

### PDF Generation Issues

1. Ensure pdfkit is installed: `npm list pdfkit`
2. Check server logs for errors
3. Verify Puppeteer availability (if needed)

### QR Code Not Showing

1. Check internet connectivity (uses external service)
2. Verify URL encoding in HTML
3. Check firewall rules

---

## 📚 Related Documentation

- **Sales Orders**: `/sales/orders` page documentation
- **Finance Module**: Invoice tracking and reporting
- **Document Service**: PDF generation utilities
- **Notification Service**: Invoice status notifications

---

## ✨ Summary

The invoice system provides a **complete solution** for viewing, generating, and downloading sales order invoices:

| Feature             | Status   | Location                                 |
| ------------------- | -------- | ---------------------------------------- |
| View Invoice (HTML) | ✅ Ready | InvoiceTemplate.jsx                      |
| Generate Invoice    | ✅ Ready | POST /sales/orders/{id}/generate-invoice |
| Download PDF        | ✅ Ready | GET /invoices/download-pdf/{id}          |
| Download HTML       | ✅ Ready | GET /invoices/download-html/{id}         |
| Print Invoice       | ✅ Ready | Browser print dialog                     |
| Invoice History     | ✅ Ready | DocumentAttachment table                 |
| Auto-Create         | ✅ Ready | First preview auto-creates               |
| Multiple Versions   | ✅ Ready | Can regenerate anytime                   |
