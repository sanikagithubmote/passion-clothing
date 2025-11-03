# Sales Order Invoice System - Quick Start Guide

## 🚀 Getting Started (5 minutes)

### What's New?

✅ Invoice preview in Sales Order details
✅ Download as PDF or HTML
✅ Professional invoice template
✅ Auto-links to Purchase Order
✅ QR code for tracking

---

## 📋 Step-by-Step Usage

### Step 1: Open a Sales Order

```
Sales → Orders → Click on any order
```

You'll see the order details page.

### Step 2: Click Invoice Tab

Look for the new **💰 Invoice** tab in the navigation bar (between "Specifications" and "Timeline").

### Step 3: View Invoice

The professional invoice preview loads automatically with:

- Order details
- Customer information
- Item breakdown
- Financial summary
- QR code for tracking

### Step 4: Download or Print

#### Download as PDF

Click **"Download PDF"** button

- File saves as: `Invoice-SO-20251101-0002.pdf`
- Ready to send to customer or PO department

#### Download as HTML

Click **"Download HTML"** button

- File saves as: `Invoice-SO-20251101-0002.html`
- Open in any browser or email as attachment

#### Print Invoice

Click **"Print"** button

- Opens browser print dialog
- Select printer or save as PDF
- Professional print layout

---

## 📁 What Gets Created

### Database

- **Invoice Record** - Auto-created on first preview
- **Document Attachment** - PDF stored for future access
- **PO Link** - Automatically linked to related Purchase Order

### Files

- **PDF** - Stored in `uploads/documents/Invoice-*.pdf`
- **HTML** - Generated on-demand, not stored

---

## 🔗 PO Integration

### Automatic Linking

When invoice is generated:

1. System checks for linked Purchase Orders
2. If PO exists for same Sales Order, link is created
3. Invoice reference saved in PO metadata

### Manual Linking (if needed)

1. Navigate to Purchase Order
2. Attach invoice as document
3. Reference displayed in PO detail view

---

## 💡 Invoice Details Included

```
📄 ORDER INFORMATION
  • Order Number: SO-20251101-0002
  • Order Date: 11/1/2025
  • Expected Delivery: 11/18/2025
  • Payment Terms: As per agreement

👤 CUSTOMER INFORMATION
  • Name: Sanika Shankar Mote
  • Customer ID: CUST764428
  • Email: motesanika@gmail.com
  • Phone: +91 8080659069

📦 ORDER ITEMS
  • Item Description | Qty | Unit Price | Total

💰 FINANCIAL SUMMARY
  • Subtotal: ₹1,062
  • GST (Tax): ₹118
  • Total Amount: ₹1,180.00

📱 QR CODE
  • Dynamic QR for live order tracking
  • Scannable from any smartphone
```

---

## 🎯 Common Tasks

### Task 1: Send Invoice to Customer

1. Open Sales Order → Invoice tab
2. Click "Download PDF"
3. Send PDF via email

### Task 2: Print Invoice for Records

1. Open Sales Order → Invoice tab
2. Click "Print"
3. Configure printer settings
4. Print or save as PDF

### Task 3: Check Invoice Status in PO

1. Navigate to Purchase Order linked to Sales Order
2. View "Documents" section
3. Invoice PDF reference visible

### Task 4: Link Invoice to Procurement

1. Open Purchase Order
2. Attach invoice document
3. Saved as reference for approval workflow

---

## ⚙️ Technical Details

### Frontend Components

- **Location:** `client/src/components/InvoiceTemplate.jsx`
- **Updated:** `client/src/pages/sales/SalesOrderDetailsPage.jsx`

### Backend Endpoints

```
GET /api/invoices/preview/:salesOrderId
  → Returns invoice HTML

GET /api/invoices/download-pdf/:salesOrderId
  → Downloads PDF file

GET /api/invoices/download-html/:salesOrderId
  → Downloads HTML file
```

### Data Requirements

Invoice requires:

- ✅ Sales Order with order number
- ✅ Customer information
- ✅ Order items (optional)
- ✅ Financial totals

---

## 🔍 Troubleshooting

### Q: Invoice tab not visible?

**A:**

- Refresh page
- Clear browser cache
- Check user permissions

### Q: Download button not working?

**A:**

- Check browser download settings
- Verify popup blockers disabled
- Try different browser
- Check server logs

### Q: QR code not showing?

**A:**

- Check internet connection
- QR Server API might be down
- Try refreshing page

### Q: Invoice not auto-creating?

**A:**

- Verify Sales Order has customer data
- Check browser console for errors
- Check server logs

---

## 📱 Device Compatibility

✅ Desktop (Chrome, Firefox, Safari, Edge)
✅ Tablet (iPad, Android)
✅ Mobile (iPhone, Android)

**Note:** PDF download works best on desktop. Mobile users can print to PDF.

---

## 🔐 Security Notes

- ✅ All endpoints require authentication
- ✅ Users can only access their own invoices
- ✅ Sensitive data is never logged
- ✅ PDF files stored securely

---

## 📞 Need Help?

1. **Check Documentation** → `SALES_ORDER_INVOICE_COMPLETE_GUIDE.md`
2. **Review Code** → `InvoiceTemplate.jsx` component
3. **Check Logs** → Browser console or server logs
4. **Test Data** → Use sample Sales Orders

---

## ✨ Example Usage

### Scenario 1: Send Invoice to Customer

```
1. Sales → Orders
2. Click on SO-20251101-0002
3. Go to Invoice tab
4. Click "Download PDF"
5. Email Invoice-SO-20251101-0002.pdf to customer
```

### Scenario 2: Approve PO with Invoice

```
1. Procurement → Purchase Orders
2. Open related PO
3. View attached invoice in Documents
4. Approve PO with invoice reference
```

### Scenario 3: Print for Records

```
1. Sales → Orders
2. Open order
3. Invoice tab → Click "Print"
4. Save as PDF to archive
5. Store in document management
```

---

## 🎓 Pro Tips

💡 **Tip 1:** Invoice auto-creates on first view - no extra clicks
💡 **Tip 2:** PDF cached for faster download on repeated clicks
💡 **Tip 3:** QR code links order for customer to track
💡 **Tip 4:** HTML file can be emailed directly - no formatting issues
💡 **Tip 5:** Print dialog offers "Save as PDF" option for archiving

---

## 📈 Next Steps

1. ✅ Deploy to development
2. ✅ Test with sample orders
3. ✅ Verify PO linking works
4. ✅ Train users
5. ✅ Deploy to production

---

**Ready to use!** 🚀

For detailed technical information, see: `SALES_ORDER_INVOICE_COMPLETE_GUIDE.md`
