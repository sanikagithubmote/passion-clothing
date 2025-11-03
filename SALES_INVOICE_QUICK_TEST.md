# ✅ Sales Invoice Action Button - Quick Test Checklist

## 🚀 Start Testing (5 Minutes)

### Pre-Test Setup

```bash
# 1. Terminal 1: Start Backend
npm start

# Wait for: "Server listening on port 5000"

# 2. Terminal 2: Start Frontend
npm start

# Wait for: "Compiled successfully" and browser opens
```

---

## 🧪 Test Sequence

### ✓ Test 1: Button Appears (30 seconds)

**Steps:**

1. Navigate to `http://localhost:3000/sales/dashboard`
2. Scroll down to "Sales Orders" section
3. Find any order row with customer name
4. Look at the far right "Actions" column
5. Click the ⋮ (three dots) icon

**Expected Result:**

```
Menu appears with:
├─ Edit
├─ Send (if draft)
├─ QR
├─ 📄 Invoice  ← SHOULD SEE THIS
└─ Delete
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 2: Modal Opens (30 seconds)

**Steps:**

1. With menu open, click **"Invoice"**
2. Menu should close
3. Observe the screen

**Expected Result:**

```
Full screen modal appears:
╔════════════════════════════════════════╗
║ 📄 Invoice Management                  ║
║                        [X close button]║
║                                        ║
║ Order: SO-XXXXXXXXX                    ║
║ Customer: [Customer Name]              ║
║                                        ║
║ ⏱️ Pending: N      ✅ Generated: N      ║
║ [Generate Invoice Button]              ║
║ 📋 Generated Documents: [list]         ║
║                                        ║
╚════════════════════════════════════════╝
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 3: Generate Invoice (1 minute)

**Steps:**

1. Modal is open
2. Click **"Generate Invoice"** button
3. Confirm in popup

**Expected Result:**

```
Alert appears: "Invoice generation initiated"
Modal stays open
Button becomes disabled briefly
After 3-5 seconds: New document appears in list
Console shows: No errors
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 4: Download Invoice (30 seconds)

**Steps:**

1. Find "Sales Invoice" in generated documents
2. Click **[📥 Download]** button

**Expected Result:**

```
PDF starts downloading
File name like: INV-20250115-SO-0001.pdf
File size: 2-5 MB
Downloads to default folder
No browser errors
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 5: Print Invoice (30 seconds)

**Steps:**

1. Find invoice in generated documents
2. Click **[🖨️ Print]** button

**Expected Result:**

```
Browser print dialog opens
PDF preview shown
Can select printer
Click "Print" to print
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 6: Preview Invoice (30 seconds)

**Steps:**

1. Find invoice in generated documents
2. Click **[👁️ Preview]** button

**Expected Result:**

```
New tab opens with PDF viewer
PDF is fully displayed
Can zoom, scroll
No errors in console
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 7: Modal Close (20 seconds)

**Steps:**

1. Click **[X]** button in modal top-right
   OR
2. Click outside modal
   OR
3. Click **[Close]** button

**Expected Result:**

```
Modal closes smoothly
Return to sales dashboard
No console errors
Order data still visible
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 8: Multiple Orders (1 minute)

**Steps:**

1. Open invoice modal for Order A
2. Generate invoice for Order A
3. Close modal
4. Open invoice modal for Order B
5. Check that Order B invoices show (not Order A)

**Expected Result:**

```
Each modal shows correct order
No cross-contamination
Different orders have different invoices
Correct order ID in modal header
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 9: No Errors in Console (1 minute)

**Steps:**

1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Clear any existing messages
4. Repeat Tests 1-8
5. Check console for errors

**Expected Result:**

```
No red error messages
No 404 errors
No 500 errors
Only informational logs (if any)
```

**Pass**: [ ] Yes [ ] No

---

### ✓ Test 10: Network Tab (1 minute)

**Steps:**

1. Open Developer Tools (F12)
2. Click **Network** tab
3. Reload page
4. Click invoice button
5. Generate invoice
6. Watch network requests

**Expected Result:**

```
Invoice generation call:
POST /api/sales/orders/:id/generate-invoice → 200

Document list fetch:
GET /documents/timeline/:id → 200

Download call:
GET /documents/download/:id → 200
```

**Pass**: [ ] Yes [ ] No

---

## 📋 Summary

| Test                 | Status   | Notes |
| -------------------- | -------- | ----- |
| 1. Button Appears    | [ ] Pass |       |
| 2. Modal Opens       | [ ] Pass |       |
| 3. Generate Invoice  | [ ] Pass |       |
| 4. Download Invoice  | [ ] Pass |       |
| 5. Print Invoice     | [ ] Pass |       |
| 6. Preview Invoice   | [ ] Pass |       |
| 7. Modal Close       | [ ] Pass |       |
| 8. Multiple Orders   | [ ] Pass |       |
| 9. No Console Errors | [ ] Pass |       |
| 10. Network Requests | [ ] Pass |       |

**Total Passed**: \_\_\_ / 10

---

## 🎯 Results

### ✅ All Tests Passed?

```
Great! Installation is successful! 🚀

Next: Deploy to staging/production
```

### ⚠️ Some Tests Failed?

Check the troubleshooting section below

---

## 🐛 If Something Fails

### Error: "Button not showing"

**Solution:**

```bash
1. Check imports in SalesOrdersPage.jsx
2. Verify InvoiceManagementModal.jsx exists
3. Hard refresh browser: Ctrl+Shift+R
4. Check console for errors: F12
```

### Error: "Modal won't open"

**Solution:**

```bash
1. Check state variables are added
2. Verify onClick handler has correct code
3. Check no syntax errors: npm start
4. See console for errors
```

### Error: "Invoice not generating"

**Solution:**

```bash
1. Verify backend is running (see Terminal 1)
2. Check API endpoint exists: /api/sales/orders/:id/generate-invoice
3. Check database is running
4. See server logs for errors
```

### Error: "Download fails"

**Solution:**

```bash
1. Check CORS settings on backend
2. Verify /documents/download route exists
3. Check file upload directory exists
4. See network tab for actual error (F12)
```

---

## 🔍 Debug Commands

### Check Component Import

```bash
# In browser console:
# 1. Type: document.querySelector('[data-testid="invoice-modal"]')
# 2. If null: component not rendering
```

### Check API Response

```bash
# In browser console:
# 1. Open Network tab (F12)
# 2. Generate invoice
# 3. Look for POST request
# 4. Check Response tab for data
```

### Check Backend Endpoint

```bash
# In server terminal:
# 1. Type: grep -n "generate-invoice" server/routes/sales.js
# 2. Should show lines 1595-1631 exist
```

---

## 📞 Support

### If Tests Pass ✅

**Celebrate!** 🎉 Invoice feature is working

### If Tests Fail ⚠️

**Check:**

1. All 4 code changes were made
2. No syntax errors: `npm start` should compile
3. Backend running on port 5000
4. Database has data
5. Permissions are correct

---

## ⏱️ Time Estimates

| Task              | Time          |
| ----------------- | ------------- |
| Setup             | 2 min         |
| Run Tests 1-7     | 5 min         |
| Run Tests 8-10    | 3 min         |
| Debug (if needed) | 5-10 min      |
| **Total**         | **10-20 min** |

---

## ✨ What Success Looks Like

### In Browser

✅ Order table displays normally
✅ ⋮ menu shows 5 options
✅ Invoice option highlighted in indigo
✅ Modal opens with beautiful design
✅ Generate button works
✅ PDF downloads successfully
✅ No errors in console
✅ Works on different orders

### In Network Tab

✅ POST generate-invoice returns 200
✅ GET timeline returns 200
✅ GET download returns 200
✅ No 404 or 500 errors

### In Console

✅ No red errors
✅ Only info/warnings
✅ API calls complete
✅ State updates visible

---

## 🎬 Recording a Bug

If something doesn't work, collect:

```
1. Screenshot of the issue
2. Error message (if any)
3. Console errors (F12)
4. Network request details (F12)
5. Steps to reproduce
6. Browser version
7. OS (Windows/Mac/Linux)
```

---

## 📝 Test Notes

Use this space to record your test results:

```
Test Date: _______________
Tester: ___________________
Browser: __________________
Server Status: ✅ / ⚠️
Frontend Status: ✅ / ⚠️

Notes:
_________________________
_________________________
_________________________
_________________________
```

---

**Ready? Start testing now! ⏱️**
