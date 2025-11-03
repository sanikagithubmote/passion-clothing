# Sales Order Invoice System - Deployment Checklist

## 📋 Pre-Deployment

### Environment Setup

- [ ] Node.js version compatible (LTS recommended)
- [ ] npm dependencies installed: `npm install`
- [ ] `pdfkit` package available: `npm list pdfkit`
- [ ] Database migrations up to date
- [ ] `.env` file configured correctly

### Code Review

- [ ] All files created/modified reviewed
- [ ] No console errors or warnings
- [ ] Code follows project conventions
- [ ] Comments added where needed

### Dependencies Verification

```bash
# Check if pdfkit is installed
npm list pdfkit

# If not, install:
npm install pdfkit
```

---

## 🔧 Installation Steps

### Step 1: Backend Setup

#### 1.1 Install Dependencies

```bash
cd server
npm install pdfkit
npm install
```

#### 1.2 Verify Imports

Open `server/routes/invoices.js` and verify:

```javascript
const PDFDocument = require("pdfkit");
const fs = require("fs");
```

#### 1.3 Check Database Models

Verify Invoice and DocumentAttachment models exist in `server/config/database.js`

#### 1.4 Create Uploads Directory

```bash
mkdir -p server/uploads/documents
chmod 755 server/uploads/documents
```

### Step 2: Frontend Setup

#### 2.1 Verify Component Creation

Ensure file exists: `client/src/components/InvoiceTemplate.jsx`

#### 2.2 Check Imports in SalesOrderDetailsPage

Verify in `client/src/pages/sales/SalesOrderDetailsPage.jsx`:

```javascript
import InvoiceTemplate from "../../components/InvoiceTemplate";
```

#### 2.3 Verify Tab Addition

Confirm "Invoice" tab added to tabs array with icon `<FaMoneyBill />`

### Step 3: Configuration

#### 3.1 Company Information

Edit `server/routes/invoices.js` line ~1131:

```javascript
<strong>Passion Clothing Co.</strong><br>
Chakan, Pune<br>
Email: info@passion-clothing.com<br>
Phone: +91-8080659069<br>
GSTIN: 09AAACH7409R1ZZ
```

Update with your actual company details.

#### 3.2 Invoice Number Format

Verify in `DocumentService.generateInvoiceNumber()`:

- Format: `INV-XXXXXX`
- Adjust if needed for your requirements

---

## 🧪 Testing

### Test 1: Backend Endpoints

#### Test 1.1: Invoice Preview

```bash
curl -X GET "http://localhost:5000/api/invoices/preview/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected Response:

```json
{
  "success": true,
  "invoice_id": 1,
  "invoice_number": "INV-000001",
  "order_number": "SO-20251101-0002",
  "html": "<html>...</html>"
}
```

#### Test 1.2: PDF Download

```bash
curl -X GET "http://localhost:5000/api/invoices/download-pdf/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-invoice.pdf
```

Expected: PDF file downloaded successfully

#### Test 1.3: HTML Download

```bash
curl -X GET "http://localhost:5000/api/invoices/download-html/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output test-invoice.html
```

Expected: HTML file downloaded successfully

### Test 2: Frontend UI

#### Test 2.1: Invoice Tab Visibility

1. Navigate to Sales → Orders
2. Click on any sales order
3. Verify "Invoice" tab visible
4. Tab icon displays 💰

#### Test 2.2: Invoice Preview Load

1. Click Invoice tab
2. Observe preview loading animation
3. Verify invoice HTML renders
4. Check all sections display correctly

#### Test 2.3: Download PDF

1. In Invoice tab, click "Download PDF"
2. PDF file downloads
3. File named correctly: `Invoice-SO-XXXX.pdf`
4. PDF opens and displays correctly

#### Test 2.4: Download HTML

1. In Invoice tab, click "Download HTML"
2. HTML file downloads
3. File named correctly: `Invoice-SO-XXXX.html`
4. HTML opens in browser with correct formatting

#### Test 2.5: Print Function

1. In Invoice tab, click "Print"
2. Print dialog opens
3. Print preview shows correct layout
4. Can save as PDF from print dialog

#### Test 2.6: Mobile Responsiveness

1. Test on tablet (iPad resolution)
2. Test on mobile (iPhone resolution)
3. Invoice displays correctly on all devices
4. Download buttons accessible

### Test 3: Data Integration

#### Test 3.1: Customer Data Display

1. Open Sales Order with customer
2. Invoice tab shows customer name, email, phone
3. Data matches order details

#### Test 3.2: Item Details

1. Open Sales Order with items
2. Invoice displays all line items
3. Quantities and prices correct
4. Totals calculated correctly

#### Test 3.3: QR Code Generation

1. View invoice preview
2. QR code displays at bottom
3. QR code is scannable
4. QR content correct

### Test 4: Error Handling

#### Test 4.1: Invalid Sales Order

1. Manually access: `/invoices/preview/99999`
2. Verify error message: "Sales order not found"
3. No server crash or 500 error

#### Test 4.2: Missing Customer Data

1. Open order without customer
2. Invoice displays "N/A" for missing fields
3. No errors in console

#### Test 4.3: No Items

1. Open order without items
2. Invoice shows "No items found"
3. Totals calculated from order level data

---

## 📊 Verification Checklist

### Data Verification

- [ ] Invoice auto-creates on first preview
- [ ] Invoice number generates correctly
- [ ] All order data displays accurately
- [ ] Customer information populated
- [ ] Financial calculations correct
- [ ] QR code generates without errors

### UI/UX Verification

- [ ] Invoice tab visible in sales order
- [ ] Tab icon displays correctly
- [ ] Tab loads without delay
- [ ] Preview renders professionally
- [ ] Buttons responsive to clicks
- [ ] No layout issues on mobile

### Download Verification

- [ ] PDF downloads successfully
- [ ] HTML downloads successfully
- [ ] File names correct and unique
- [ ] Files not corrupted
- [ ] Multiple downloads work

### Integration Verification

- [ ] Invoice links to PO (if PO exists)
- [ ] Document attachment created
- [ ] Invoice status tracking works
- [ ] No duplicate invoices created

### Performance Verification

- [ ] Preview loads within 2 seconds
- [ ] PDF generation within 5 seconds
- [ ] HTML generation instant
- [ ] No memory leaks with repeated access

---

## 🚀 Deployment Steps

### Step 1: Pre-Production Testing

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check for errors
npm run lint
```

### Step 2: Build for Production

```bash
# Frontend build
cd client
npm run build

# Backend production check
cd server
npm run build
```

### Step 3: Deploy Backend

```bash
# Copy updated files to production
# - server/routes/invoices.js (UPDATED)
# - server/uploads/documents/ (VERIFY EXISTS)

# Restart server
pm2 restart passion-erp-server

# Verify running
pm2 status
```

### Step 4: Deploy Frontend

```bash
# Copy built files
# - client/src/components/InvoiceTemplate.jsx (NEW)
# - client/src/pages/sales/SalesOrderDetailsPage.jsx (UPDATED)

# Clear cache and reload
# On production server: restart application server
```

### Step 5: Post-Deployment Verification

```bash
# Test endpoints
curl http://production-url/api/invoices/preview/1

# Test UI
# - Visit sales order page
# - Verify invoice tab shows
# - Test download functionality
```

---

## 📝 Files Modified/Created

### New Files Created ✨

```
client/src/components/InvoiceTemplate.jsx
SALES_ORDER_INVOICE_COMPLETE_GUIDE.md
SALES_ORDER_INVOICE_QUICK_START.md
SALES_ORDER_INVOICE_DEPLOYMENT_CHECKLIST.md
```

### Files Modified 📝

```
server/routes/invoices.js
  - Added: GET /api/invoices/preview/:salesOrderId
  - Added: GET /api/invoices/download-pdf/:salesOrderId
  - Added: GET /api/invoices/download-html/:salesOrderId
  - Added: generateInvoiceHTML() helper function
  - Added: generateInvoicePDF() helper function
  - Added: PDFDocument import

client/src/pages/sales/SalesOrderDetailsPage.jsx
  - Added: InvoiceTemplate import
  - Added: Invoice tab to tab list
  - Added: Invoice tab content
```

### No Changes Required

```
- Database models (already have Invoice and DocumentAttachment)
- Authentication middleware (already configured)
- Environment variables (no new ones needed)
```

---

## 🔍 Troubleshooting Deployment

### Issue: 404 on Invoice Endpoints

**Solution:**

- Verify server restarted
- Check route file saved correctly
- Verify syntax in invoices.js
- Restart server: `pm2 restart all`

### Issue: Component Not Found

**Solution:**

- Verify InvoiceTemplate.jsx exists in correct path
- Check import path in SalesOrderDetailsPage
- Clear npm cache: `npm cache clean --force`
- Rebuild frontend: `npm run build`

### Issue: PDF Download Fails

**Solution:**

- Check `uploads/documents/` directory exists
- Verify directory permissions: `chmod 755`
- Check disk space available
- Verify pdfkit installed: `npm list pdfkit`

### Issue: Invoice Tab Not Showing

**Solution:**

- Verify tab array updated in SalesOrderDetailsPage
- Check FaMoneyBill icon imported
- Clear browser cache
- Hard refresh: Ctrl+Shift+R

### Issue: Database Errors

**Solution:**

- Verify Invoice model exists
- Check DocumentAttachment model
- Run migrations if needed
- Check database connections

---

## 📞 Rollback Plan

If issues occur after deployment:

### Quick Rollback

```bash
# Stop current version
pm2 stop passion-erp

# Revert files
git checkout HEAD~1
# or
git revert HEAD

# Rebuild and restart
npm run build
pm2 start passion-erp
```

### Files to Backup Before Deployment

```
server/routes/invoices.js
client/src/pages/sales/SalesOrderDetailsPage.jsx
```

---

## ✅ Sign-Off Checklist

- [ ] All tests passed
- [ ] Code reviewed
- [ ] No console errors
- [ ] Database backed up
- [ ] Team notified
- [ ] Documentation updated
- [ ] Support trained
- [ ] Monitoring configured

---

## 📅 Deployment Timeline

| Task                    | Time         | Status |
| ----------------------- | ------------ | ------ |
| Code review             | 15 min       | ⏳     |
| Unit testing            | 20 min       | ⏳     |
| Integration testing     | 30 min       | ⏳     |
| Backend deployment      | 10 min       | ⏳     |
| Frontend deployment     | 10 min       | ⏳     |
| Post-deployment testing | 15 min       | ⏳     |
| **Total**               | **~100 min** |        |

---

## 🎉 Success Criteria

✅ Invoice tab visible in all sales orders
✅ Invoice preview loads without errors
✅ PDF download works and opens correctly
✅ HTML download creates valid file
✅ Print function accessible
✅ Mobile responsive design verified
✅ QR code generates and displays
✅ No console errors
✅ Performance acceptable
✅ PO linking works

---

**Ready to Deploy!** 🚀

For questions or issues, reference:

- `SALES_ORDER_INVOICE_COMPLETE_GUIDE.md`
- `SALES_ORDER_INVOICE_QUICK_START.md`
