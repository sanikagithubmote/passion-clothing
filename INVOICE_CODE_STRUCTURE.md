# Invoice System - Code Structure & Key Snippets

## 📦 File Organization

```
passion-clothing/
├── client/src/
│   ├── pages/sales/
│   │   ├── SalesOrdersPage.jsx (1107 lines)
│   │   │   ├── Imports InvoiceManagementModal
│   │   │   ├── State: showInvoiceModal, selectedOrderForInvoice
│   │   │   └── Renders modal at bottom (line 1093)
│   │   ├── SalesOrderDetailsPage.jsx (1036 lines)
│   │   │   ├── Imports InvoiceTemplate
│   │   │   ├── Tab: "invoice" (line 482)
│   │   │   ├── Renders InvoiceTemplate when tab selected (line 878)
│   │   │   └── Handles invoice download callback
│   │   └── CreateSalesOrderPage.jsx
│   │       └── handleDownloadInvoice() method (line 274)
│   ├── components/
│   │   ├── InvoiceTemplate.jsx (183 lines)
│   │   │   ├── Fetch invoice preview: GET /invoices/preview/{id}
│   │   │   ├── Download PDF: GET /invoices/download-pdf/{id}
│   │   │   ├── Download HTML: GET /invoices/download-html/{id}
│   │   │   ├── Print: window.print()
│   │   │   └── Render: dangerouslySetInnerHTML with HTML content
│   │   └── sales/
│   │       ├── InvoiceManagementModal.jsx (230 lines)
│   │       │   ├── Fetch invoices: GET /documents/timeline/{id}
│   │       │   ├── Generate invoice: POST /sales/orders/{id}/generate-invoice
│   │       │   ├── Download: GET /documents/download/{docId}
│   │       │   ├── Print: window.open() for preview
│   │       │   └── Display: Invoice list with stats
│   │       └── InvoiceStatusPanel.jsx (197 lines)
│   │           └── Compact version of InvoiceManagementModal
│   ├── utils/
│   │   └── api.js
│   │       └── axios instance with auth headers
│   └── index.js
│       └── App entry point
├── server/
│   ├── routes/
│   │   ├── invoices.js (1350+ lines)
│   │   │   ├── POST /api/invoices/generate-from-sales-order/{id}
│   │   │   ├── GET /api/invoices/preview/{id}
│   │   │   ├── GET /api/invoices/download-pdf/{id}
│   │   │   ├── GET /api/invoices/download-html/{id}
│   │   │   └── Helper: generateInvoiceHTML()
│   │   ├── sales.js
│   │   │   ├── POST /api/sales/orders (create order)
│   │   │   ├── GET /api/sales/orders (list)
│   │   │   └── Endpoints for invoice generation
│   │   └── documents.js (if exists)
│   │       ├── GET /api/documents/timeline/{id}
│   │       └── GET /api/documents/download/{id}
│   ├── config/
│   │   └── database.js
│   │       ├── Invoice model
│   │       ├── DocumentAttachment model
│   │       └── Associations
│   ├── utils/
│   │   ├── documentService.js
│   │   │   ├── generateInvoiceNumber()
│   │   │   └── generateInvoicePDF()
│   │   └── notificationService.js
│   │       └── sendInvoiceNotification()
│   ├── middleware/
│   │   └── auth.js
│   │       └── authenticateToken middleware
│   └── index.js
│       └── Express server setup
└── .env
    └── API configuration
```

---

## 🔑 Key Code Snippets

### 1. Sales Orders Page - Invoice Modal State

**File**: `client/src/pages/sales/SalesOrdersPage.jsx` (Lines 95-96)

```javascript
const [showInvoiceModal, setShowInvoiceModal] = useState(false);
const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
```

**Purpose**: Manages invoice modal visibility and selected order data

---

### 2. Opening Invoice Modal

**File**: `client/src/pages/sales/SalesOrdersPage.jsx` (Lines 732-740)

```javascript
<button
  onClick={() => {
    setSelectedOrderForInvoice(order);
    setShowInvoiceModal(true);
    setShowActionMenu(null);
  }}
  className="w-full text-left px-3 py-1.5 hover:bg-indigo-50 text-gray-700 text-xs flex items-center gap-1.5 border-b border-gray-100"
>
  <FaFileInvoice size={12} /> Invoice
</button>
```

**Behavior**:

1. Sets the order to display in modal
2. Opens the modal
3. Closes the action menu

---

### 3. Invoice Management Modal - Fetch Invoices

**File**: `client/src/components/sales/InvoiceManagementModal.jsx` (Lines 27-41)

```javascript
const fetchInvoices = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/documents/timeline/${order.id}`);
    setInvoices(response.data.documents || []);

    const generated = response.data.documents?.length || 0;
    const pending = response.data.pending || 0;
    setStats({ pending, generated });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
  } finally {
    setLoading(false);
  }
};
```

**Endpoint**: `GET /documents/timeline/{orderId}`

**Response Structure**:

```json
{
  "documents": [
    {
      "id": "uuid",
      "document_type": "invoice",
      "file_name": "Invoice-SO-001.pdf",
      "file_size": 45000,
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pending": 2
}
```

---

### 4. Generate Invoice

**File**: `client/src/components/sales/InvoiceManagementModal.jsx` (Lines 43-58)

```javascript
const handleGenerateInvoice = async () => {
  if (window.confirm(`Generate invoice for order ${order?.order_number}?`)) {
    try {
      setGenerating(true);
      await api.post(`/sales/orders/${order.id}/generate-invoice`, {
        orderNumber: order.order_number,
      });
      alert("Invoice generation initiated!");
      fetchInvoices(); // Refresh list
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate invoice");
    } finally {
      setGenerating(false);
    }
  }
};
```

**Endpoint**: `POST /sales/orders/{orderId}/generate-invoice`

**Backend Handler** (Lines 43-215 in `invoices.js`):

```javascript
router.post(
  "/generate-from-sales-order/:salesOrderId",
  authenticateToken,
  async (req, res) => {
    const { salesOrderId } = req.params;
    const { notes, terms_conditions } = req.body;

    // Fetch sales order
    const salesOrder = await SalesOrder.findByPk(salesOrderId, {
      include: [
        { model: Customer, as: "customer" },
        { model: User, as: "creator" },
      ],
    });

    // Generate invoice number
    const invoiceNumber = documentService.generateInvoiceNumber();

    // Calculate totals
    const items = salesOrder.items || [];
    const subtotal =
      (salesOrder.total_quantity || 0) * (salesOrder.unit_price || 0);
    const tax = salesOrder.gst_amount || 0;
    const total = salesOrder.final_amount || subtotal + tax;

    // Create Invoice record
    const invoice = await Invoice.create({
      invoice_number: invoiceNumber,
      invoice_type: "sales",
      sales_order_id: salesOrderId,
      items: items,
      subtotal: parseFloat(subtotal),
      total_tax_amount: parseFloat(tax),
      total_amount: parseFloat(total),
      status: "draft",
      payment_status: "unpaid",
      created_by: req.user.id,
    });

    // Generate PDF
    const pdfResult = await documentService.generateInvoicePDF(invoiceData);

    // Create DocumentAttachment record
    await DocumentAttachment.create({
      entity_type: "sales_order",
      entity_id: salesOrderId,
      document_type: "invoice",
      file_name: `Invoice-${salesOrder.order_number}.pdf`,
      file_path: pdfResult.filePath,
    });

    res.json({ success: true, invoice_id: invoice.id });
  }
);
```

---

### 5. Download Invoice

**File**: `client/src/components/sales/InvoiceManagementModal.jsx` (Lines 60-76)

```javascript
const handleDownloadInvoice = async (documentId, fileName) => {
  try {
    const response = await api.get(`/documents/download/${documentId}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (error) {
    alert("Failed to download invoice");
  }
};
```

**Process**:

1. Fetch file as blob: `GET /documents/download/{docId}`
2. Create temporary URL: `window.URL.createObjectURL()`
3. Create temp link element
4. Trigger download by clicking link
5. Clean up resources

---

### 6. Invoice Template - Fetch Preview

**File**: `client/src/components/InvoiceTemplate.jsx` (Lines 16-33)

```javascript
useEffect(() => {
  fetchInvoiceData();
}, [salesOrderId]);

const fetchInvoiceData = async () => {
  try {
    setLoading(true);
    const response = await api.get(`/invoices/preview/${salesOrderId}`);
    setInvoice(response.data);
    setError("");
  } catch (err) {
    console.error("Failed to fetch invoice:", err);
    setError(err.response?.data?.message || "Failed to load invoice preview");
    setInvoice(null);
  } finally {
    setLoading(false);
  }
};
```

**Endpoint**: `GET /invoices/preview/{salesOrderId}`

**Response**:

```json
{
  "success": true,
  "invoice_id": "uuid",
  "invoice_number": "INV-001",
  "order_number": "SO-001",
  "html": "<html>... full invoice HTML ...</html>"
}
```

---

### 7. Render Invoice HTML

**File**: `client/src/components/InvoiceTemplate.jsx` (Lines 156-167)

```javascript
return (
  <div className="w-full print:p-0">
    {/* Action Buttons */}
    <div className="print:hidden flex gap-2 mb-4 pb-4 border-b border-gray-200">
      <button onClick={handleDownloadPDF} disabled={downloading}>
        Download PDF
      </button>
      {/* More buttons... */}
    </div>

    {/* Invoice Preview Container */}
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {invoice?.html ? (
        <div
          className="invoice-preview p-8 bg-white"
          dangerouslySetInnerHTML={{ __html: invoice.html }}
        />
      ) : (
        <div className="p-8 text-center text-gray-500">
          No invoice data available
        </div>
      )}
    </div>
  </div>
);
```

**Key Points**:

- Uses `dangerouslySetInnerHTML` to render HTML content
- `print:hidden` hides buttons when printing
- HTML content comes from backend `/invoices/preview` endpoint

---

### 8. Download PDF

**File**: `client/src/components/InvoiceTemplate.jsx` (Lines 35-61)

```javascript
const handleDownloadPDF = async () => {
  try {
    setDownloading(true);
    const response = await api.get(`/invoices/download-pdf/${salesOrderId}`, {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Invoice-${invoice?.order_number || "SO"}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
    window.URL.revokeObjectURL(url);

    if (onDownload) onDownload("pdf");
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download PDF");
  } finally {
    setDownloading(false);
  }
};
```

**Backend Endpoint**: `GET /invoices/download-pdf/{salesOrderId}` (Lines 821-890 in `invoices.js`)

```javascript
router.get("/download-pdf/:salesOrderId", authenticateToken, async (req, res) => {
  try {
    const { salesOrderId } = req.params;

    // Check if PDF exists in DocumentAttachment
    const existingDoc = await DocumentAttachment.findOne({
      where: {
        entity_type: "sales_order",
        entity_id: salesOrderId,
        document_type: "invoice",
      },
      order: [["created_at", "DESC"]],
    });

    if (existingDoc && fs.existsSync(existingDoc.file_path)) {
      // Serve cached PDF
      return res.download(
        existingDoc.file_path,
        `Invoice-${salesOrder.order_number}.pdf`
      );
    }

    // Generate new PDF on-the-fly
    const pdfBuffer = await generateInvoicePDF({...});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${salesOrder.order_number}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to download PDF",
      error: error.message,
    });
  }
});
```

---

### 9. Invoice HTML Generation

**File**: `server/routes/invoices.js` (Lines 940-1272)

**Function**: `generateInvoiceHTML({ salesOrder, customer })`

```javascript
function generateInvoiceHTML({ salesOrder, customer }) {
  const items = salesOrder.items || [];
  const subtotal =
    (salesOrder.total_quantity || 0) * (salesOrder.unit_price || 0);
  const tax = salesOrder.gst_amount || 0;
  const total = salesOrder.final_amount || subtotal + tax;

  // Generate items table HTML
  const itemsHTML = items
    .map(
      (item) => `
    <tr>
      <td>${item.product_name || "Product"}</td>
      <td style="text-align: center;">${item.quantity || 0}</td>
      <td style="text-align: right;">₹${(item.unit_price || 0).toFixed(2)}</td>
      <td style="text-align: right;">₹${(
        (item.quantity || 0) * (item.unit_price || 0)
      ).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  // Return full HTML template
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sales Order Invoice - ${salesOrder.order_number}</title>
        <style>/* Comprehensive styles */</style>
      </head>
      <body>
        <div class="container">
          <!-- Header with company info -->
          <!-- Order information -->
          <!-- Customer information -->
          <!-- Items table -->
          <!-- Financial summary -->
          <!-- QR Code -->
          <!-- Footer -->
        </div>
      </body>
    </html>
  `;
}
```

**Output**: Complete HTML string ready for rendering

---

### 10. Sales Order Details - Invoice Tab

**File**: `client/src/pages/sales/SalesOrderDetailsPage.jsx` (Lines 878-886)

```javascript
{
  activeTab === "invoice" && (
    <div>
      <InvoiceTemplate
        salesOrderId={order.id}
        onDownload={(format) => {
          console.log(`Invoice downloaded as ${format}`);
        }}
      />
    </div>
  );
}
```

**Tab Configuration** (Lines 481-484):

```javascript
{
  id: "invoice",
  label: "Invoice",
  icon: <FaMoneyBill className="w-3.5 h-3.5" />,
}
```

---

## 🔄 Component Interaction Flow

### User Opens Sales Orders Page

```javascript
// SalesOrdersPage.jsx
useEffect(() => {
  fetchOrders(); // Line 110
  fetchSummary(); // Line 111
  fetchShipments(); // Line 112
}, []);
```

### User Clicks Invoice Button

```javascript
// Triggers this function (Line 732-735)
setSelectedOrderForInvoice(order);
setShowInvoiceModal(true);
setShowActionMenu(null);
```

### Modal Opens & Fetches Invoices

```javascript
// InvoiceManagementModal.jsx
useEffect(() => {
  if (isOpen && order?.id) {
    fetchInvoices(); // Line 23
  }
}, [isOpen, order?.id]);
```

### Display Invoices or Generate New

```javascript
// InvoiceManagementModal.jsx
{
  invoices.length > 0 ? (
    <div>/* Invoice list */</div>
  ) : (
    <div>/* Empty state */</div>
  );
}

// Generate button always available (Line 141-164)
<button onClick={handleGenerateInvoice}>Generate Invoice</button>;
```

---

## 📋 Database Query Patterns

### Fetch Invoice with Related Data

```javascript
// invoices.js Line 71-77
const salesOrder = await SalesOrder.findByPk(salesOrderId, {
  include: [
    { model: Customer, as: "customer" },
    { model: User, as: "creator" },
  ],
  transaction,
});
```

### Create Invoice Record

```javascript
// invoices.js Line 129-149
const invoice = await Invoice.create(
  {
    invoice_number: invoiceNumber,
    invoice_type: "sales",
    sales_order_id: salesOrderId,
    customer_id: salesOrder.customer_id,
    items: items,
    subtotal: parseFloat(subtotal),
    total_tax_amount: parseFloat(tax),
    total_amount: parseFloat(total),
    status: "draft",
    payment_status: "unpaid",
    created_by: req.user.id,
  },
  { transaction }
);
```

### Find Document Attachment

```javascript
// invoices.js Line 843-850
const existingDoc = await DocumentAttachment.findOne({
  where: {
    entity_type: "sales_order",
    entity_id: salesOrderId,
    document_type: "invoice",
  },
  order: [["created_at", "DESC"]],
});
```

---

## 🎯 Export Handlers

### Print Invoice

```javascript
// InvoiceTemplate.jsx Line 94-97
const handlePrint = () => {
  window.print();
  if (onDownload) onDownload("print");
};
```

### Download as PDF

```javascript
// InvoiceTemplate.jsx Line 35-61
GET / invoices / download - pdf / { id };
// Returns: PDF blob
// Filename: Invoice-{ORDER_NUMBER}.pdf
```

### Download as HTML

```javascript
// InvoiceTemplate.jsx Line 63-92
GET / invoices / download - html / { id };
// Returns: HTML blob
// Filename: Invoice-{ORDER_NUMBER}.html
```

---

## 🔐 Authentication Flow

All invoice endpoints require authentication:

```javascript
// invoices.js
router.get("/preview/:salesOrderId", authenticateToken, async (req, res) => {
  // req.user is available here (from middleware)
  // Line 792: created_by: req.user.id
});
```

**Middleware**: `authenticateToken` (server/middleware/auth.js)

- Validates JWT token from Authorization header
- Extracts user information
- Attaches to req.user

---

## ✅ Summary

### Key Code Locations

| Feature           | File                       | Lines    |
| ----------------- | -------------------------- | -------- |
| Invoice Modal     | InvoiceManagementModal.jsx | 1-230    |
| Invoice Preview   | InvoiceTemplate.jsx        | 1-183    |
| Generate Endpoint | invoices.js                | 59-215   |
| Preview Endpoint  | invoices.js                | 741-817  |
| Download PDF      | invoices.js                | 821-890  |
| Download HTML     | invoices.js                | 892-935  |
| HTML Template     | invoices.js                | 940-1272 |

### Data Flow

```
Frontend Request → Authorization → Route Handler
  → Database Query → Data Processing
  → Response Generation → Frontend Display
```

### File Download Process

```
Fetch as Blob → Create Object URL
  → Create Link Element → Trigger Click
  → Browser Downloads → Clean Up Resources
```
