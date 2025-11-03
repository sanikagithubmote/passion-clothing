# 🧪 Testing the Invoice Button - Complete Guide

## ✅ Pre-Test Checklist

Before testing, verify:

- [ ] Server is running (http://localhost:5000)
- [ ] Client is running (http://localhost:3000)
- [ ] Logged in as user with Procurement access
- [ ] Database has Purchase Orders (at least 1)
- [ ] `/uploads/documents/purchase_orders/` directory exists

---

## 🚀 Quick Test (2 Minutes)

### Step 1: Navigate to Procurement Dashboard

```
URL: http://localhost:3000/procurement/dashboard
```

### Step 2: Find a Purchase Order

Look for any PO in the table:

```
PO Number  | Vendor      | Amount    | Status
PO-001     | Vendor ABC  | ₹50,000   | Draft
```

### Step 3: Click the Menu Button

Locate the 3-dot menu (⋮) at the end of the PO row and click it.

You should see these action buttons:

```
📖 View
✏️ Edit
🗑️ Delete
📦 Mark as Received
📄 Invoice    ← CLICK THIS
🔲 QR Code
```

### Step 4: Click "Invoice" Button

Click the "Invoice" button with the 📄 icon.

### Step 5: Watch the Toast

You should see:

```
Generating invoice...
(loading state for 2-5 seconds)
```

### Step 6: Verify Download

After a few seconds, you should see:

```
✅ Invoice generated and downloaded: PO-YYYYMMDD-XXXX.pdf
```

And your browser should automatically download a PDF file.

---

## 📋 What You Should See

### Success Scenario ✅

**Console Logs** (Open DevTools → Console):

```
✅ Trigger: Purchase Order Approved
✅ Purchase Order PDF generation started...
✅ PDF file saved: PO-20250115-0001.pdf
✅ Document attached to database
```

**Toast Message**:

```
✅ Invoice generated and downloaded: PO-20250115-0001.pdf
```

**Downloaded File**:

- File name: `PO-YYYYMMDD-XXXX.pdf` or similar
- File size: 30-50 KB
- File type: PDF

**PDF Content** (when opened):

```
┌─────────────────────────────────────┐
│    PURCHASE ORDER                   │
├─────────────────────────────────────┤
│ PO Number: PO-20250115-0001         │
│ Date: 2025-01-15                    │
│ Vendor: Vendor ABC                  │
│ Expected Delivery: 2025-01-25       │
│                                     │
│ Items:                              │
│ 1. Fabric - Qty: 100 - ₹5,000       │
│ 2. Buttons - Qty: 500 - ₹2,000      │
│                                     │
│ Subtotal: ₹45,000                   │
│ Tax: ₹8,100                         │
│ Total: ₹53,100                      │
│                                     │
│ Status: Approved                    │
└─────────────────────────────────────┘
```

---

## ❌ Error Scenarios & Fixes

### Error 1: "Failed to generate invoice"

**Problem**: Generic error from backend  
**Cause**: Server error or database issue

**Check**:

1. Open browser DevTools → Network tab
2. Look for the `/api/documents/manual-trigger` request
3. Check Response tab for error details

**Solution**:

```bash
# Check server logs
npm run dev    # or check console output

# Verify database connection
# Check if DocumentAttachment table exists
```

### Error 2: "Cannot POST /api/documents/manual-trigger"

**Problem**: Endpoint not found (404)  
**Cause**: Route not registered or server not restarted

**Solution**:

```bash
# Restart server
npm run dev

# Verify route is registered in server/index.js
# Should have: app.use('/api/documents', require('./routes/documents'));
```

### Error 3: "403 Forbidden" or "401 Unauthorized"

**Problem**: Authentication/Authorization issue  
**Cause**: User doesn't have permission or JWT token expired

**Solution**:

```javascript
// Check user permissions
1. Verify user is logged in
2. User role should have "procurement" department
3. Check /api/auth/me returns valid user
```

### Error 4: PDF Opens but Content is Empty

**Problem**: PDF generated but missing data  
**Cause**: PO data not properly formatted

**Solution**:

```javascript
// Check PO data in browser console
console.log("PO Data:", po);
// Should have: id, po_number, vendor, items, final_amount
```

### Error 5: Download Didn't Trigger

**Problem**: No file downloaded but got success message  
**Cause**: Browser blocked popup or download

**Solution**:

```
1. Check browser download settings (if downloads are blocked)
2. Check Downloads folder manually
3. Check browser console for download errors
```

### Error 6: "Path Error" or "File System" errors

**Problem**: File saving failed  
**Cause**: Directory doesn't exist or permission denied

**Solution**:

```bash
# Create necessary directories
mkdir -p uploads/documents/purchase_orders

# Verify permissions (Windows)
# The folder should be readable/writable by the Node process
```

---

## 🔍 Advanced Debugging

### Check if Document was Created in Database

```sql
-- Check DocumentAttachment table
SELECT * FROM DocumentAttachment
WHERE document_type = 'invoice'
AND entity_type = 'purchase_order'
ORDER BY created_at DESC
LIMIT 5;
```

Expected output:

```
| id | entity_type    | entity_id | document_type | file_name           | is_active |
|----|----------------|-----------|---------------|---------------------|-----------|
| 25 | purchase_order | 1         | invoice       | PO-20250115-0001.pdf| true      |
```

### Check if PDF File Exists

```bash
# Windows PowerShell
Get-ChildItem -Path "uploads\documents\purchase_orders" | Sort-Object -Property CreationTime -Descending | Select-Object -First 5

# Should show recently created PDF files
```

### Enable Detailed Logging

Add to server code for troubleshooting:

```javascript
// In server/utils/workflowTriggers.js
console.log("📄 Generating PO PDF for:", purchaseOrder.po_number);
console.log("📊 PO Data:", poData);
console.log("💾 File saved at:", filePath);
console.log("📎 Document record:", document);
```

---

## 📊 Expected API Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Trigger 'purchase_order.approved' executed successfully",
  "result": {
    "po_generated": true,
    "notification_sent": true,
    "document": {
      "id": 25,
      "entity_type": "purchase_order",
      "entity_id": 1,
      "document_type": "invoice",
      "file_name": "PO-20250115-0001.pdf",
      "file_path": "uploads/documents/purchase_orders/PO-20250115-0001.pdf",
      "file_size": 45234,
      "version": 1,
      "created_at": "2025-01-15T10:30:00Z",
      "uploaded_by": 5
    }
  },
  "document": {
    "id": 25,
    "file_name": "PO-20250115-0001.pdf",
    ...
  }
}
```

### Error Response (500)

```json
{
  "success": false,
  "message": "Failed to execute trigger",
  "error": "Error message details"
}
```

---

## 🧪 Comprehensive Test Scenario

### Setup Test Data

1. Create a Sales Order:

   ```
   Order #: SO-001
   Customer: Test Customer
   Amount: ₹100,000
   ```

2. Create a Purchase Order:

   ```
   PO #: PO-2025-0001
   Vendor: Test Vendor
   Amount: ₹50,000
   Items: [Fabric x100, Buttons x500]
   ```

3. Set PO status to "pending_approval" or "draft"

### Execute Test

1. Navigate to Procurement Dashboard
2. Find PO-2025-0001 in the table
3. Click the action menu (⋮)
4. Click "Invoice"
5. Verify PDF is generated and downloaded

### Verify Results

**Backend** ✅

- [ ] Console shows "✅ Purchase Order approved and sent"
- [ ] Document record exists in database
- [ ] PDF file exists in `/uploads/documents/purchase_orders/`
- [ ] PO status changed to "sent"
- [ ] Notification created for procurement team

**Frontend** ✅

- [ ] Loading toast appeared
- [ ] Success toast appeared with file name
- [ ] PDF file downloaded to Downloads folder
- [ ] No errors in browser console
- [ ] No "Unexpected token" errors

**PDF Content** ✅

- [ ] PDF opens successfully
- [ ] Contains PO number
- [ ] Contains vendor information
- [ ] Contains item details
- [ ] Contains total amount
- [ ] Status shows "Approved"

---

## 📞 Troubleshooting Checklist

| Issue          | Check               | Fix                                          |
| -------------- | ------------------- | -------------------------------------------- |
| 404 error      | Route registered?   | Restart server                               |
| 403 error      | User authenticated? | Login again                                  |
| No download    | Browser settings    | Check Downloads                              |
| Empty PDF      | PO data valid?      | Check console logs                           |
| File not saved | Directory exists?   | Create `/uploads/documents/purchase_orders/` |
| Slow response  | Server load?        | Check performance                            |
| Database error | Connection OK?      | Verify DB credentials                        |

---

## ✅ Final Checklist

- [x] Code changes implemented
- [x] Server restarted
- [x] Client refreshed
- [x] All necessary directories created
- [x] pdfkit installed
- [x] DocumentAttachment model available
- [x] API endpoints responding

**Status**: ✅ **READY TO TEST**

---

_For more help, check:_

- _Server logs for errors_
- _Browser console for client-side errors_
- _Database for document records_
- _File system for PDF files_
