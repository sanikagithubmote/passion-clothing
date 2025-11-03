# 🔍 Invoice Generation Validation & Troubleshooting Guide

## Current Issue: "Network connection failed" Error

### 📋 Issue Details

**What happens:**

- User clicks "Generate Invoice" button on Procurement Dashboard
- Error message: "Network connection failed. Is the backend running?"
- Backend IS running (verified on port 5000)
- Frontend IS running (verified on port 3000)

---

## 🔴 Root Cause Analysis

### Issue 1: Missing JWT Authentication

The `/api/documents/manual-trigger` endpoint **REQUIRES** JWT authentication via `authenticateToken` middleware.

**Location:** `server/routes/documents.js` line 325

```javascript
router.post("/manual-trigger", authenticateToken, async (req, res) => { ... }
```

**What authenticateToken does:**

- Checks for `Authorization: Bearer <token>` header
- If missing → Returns **403 Forbidden**
- If invalid/expired → Returns **401 Unauthorized**

---

## ✅ Step-by-Step Diagnostic

### Step 1: Verify You're Logged In

1. Open browser at `http://localhost:3000`
2. Check if you see the login page OR the dashboard
3. **If Login page:** User is NOT authenticated
4. **If Dashboard:** User IS authenticated (might be expired token)

---

### Step 2: Check Token in LocalStorage

**Run this in browser console (F12 → Console tab):**

```javascript
// Check if token exists
const token = localStorage.getItem("token");
console.log("Token exists:", !!token);
console.log("Token length:", token?.length || 0);
console.log("First 50 chars:", token?.substring(0, 50) || "NO TOKEN");

// Check API base URL
console.log(
  "API Base URL:",
  localStorage.getItem("VITE_API_BASE_URL") || "Using default"
);
```

**Expected output:**

- Token exists: `true`
- Token length: Should be 200+ characters
- First 50 chars: Should start with `eyJ...`

**If you see:**

- `Token exists: false` → **PROBLEM 1: No token (need to login)**
- Token is null or empty → **PROBLEM 1: No token (need to login)**

---

### Step 3: Test API Configuration

**Run this in browser console:**

```javascript
// Test if frontend can reach backend
const testResponse = await window.apiConfig?.testApiConnection?.();
console.log("Connection test result:", testResponse);
```

**If you see:**

- `success: true` → Backend is reachable ✅
- `success: false` → Check error message
  - `status: 401` → Token is invalid/expired
  - `status: undefined` → Network connection problem
  - `error: "Network connection failed"` → Backend unreachable

---

### Step 4: Verify PO Status

**The "Generate Invoice" button works on POs with ANY status**, but internally it:

1. Sends trigger to backend
2. Backend generates PDF
3. Saves it as Document Attachment
4. Returns document ID

**However:** There's NO validation that PO is in a specific status!

**Check what status your PO has:**

```javascript
// In Procurement Dashboard, inspect any PO row
// Look for a "status" column or check network tab for PO data
```

---

## 🔧 Solution by Problem Type

### Problem 1: No Token / Not Logged In

**Solution:**

1. Go to `http://localhost:3000/login`
2. Log in with valid credentials
3. Check that token is saved: `console.log(localStorage.getItem('token'))`
4. Return to Procurement Dashboard
5. Try invoice generation again

---

### Problem 2: Token Expired

**Solution:**

1. Clear token: `localStorage.removeItem('token')`
2. Refresh page: `window.location.reload()`
3. Log in again
4. Try invoice generation again

---

### Problem 3: Backend Not Responding

**Verify backend is running:**

```powershell
# PowerShell - Check if port 5000 is listening
netstat -ano | findstr ":5000"

# Should show: TCP    [::]:5000    [::]:0    LISTENING    <PID>
```

**If not listening:**

```powershell
# Restart backend
cd c:\Users\admin\Desktop\passion-clothing
npm start
```

---

## 📊 Complete Invoice Generation Flow

```
User clicks "Generate Invoice" button
    ↓
ProcurementDashboard.handleGenerateInvoice(po) triggered
    ↓
POST /api/documents/manual-trigger {
  trigger_type: "purchase_order.approved",
  entity_id: po.id
}
    ↓
Frontend axios interceptor adds:
Authorization: Bearer <token from localStorage>
    ↓
Backend receives request
    ↓
authenticateToken middleware validates token
    ├─ Token missing → 403 Forbidden ❌
    ├─ Token invalid → 401 Unauthorized ❌
    └─ Token valid → Continue ✅
    ↓
workflowTriggers.onPurchaseOrderApproved(po) executes
    ↓
documentService.generateAndAttachPurchaseOrder() runs
    ├─ Generate PDF file
    ├─ Save to DocumentAttachment table
    └─ Return document record
    ↓
Response: { success: true, document: {...} }
    ↓
Frontend receives response
    ↓
Download PDF: GET /api/documents/{doc.id}/download
    ↓
Browser downloads: PO-<po_number>.pdf
```

---

## 🎯 No Validation Issues Found!

**Frontend Issue:** ✅ Button is ALWAYS visible (no status check)

- **Is this correct?** YES - Any PO can generate invoice for audit/testing
- **Should it be restricted?** Perhaps YES - Only "approved" POs should have this button

**Backend Issue:** ✅ No status validation in endpoint

- **Is this correct?** YES - Endpoint is for manual testing/on-demand generation
- **Should add?** Perhaps YES - Validate PO.status === "approved" before generating

---

## 💡 Recommendation: Fix Frontend Visibility

**Current behavior:** Generate Invoice button visible on ALL POs
**Better behavior:** Only visible when PO is in "approved" or "sent" status

### Proposed Fix:

Change this in `ProcurementDashboard.jsx` line 1704:

```jsx
// CURRENT (ALWAYS VISIBLE):
{
  /* Generate Invoice */
}
<button
  onClick={() => {
    handleGenerateInvoice(po);
    setExpandedRows(new Set());
  }}
  className="..."
>
  ...
</button>;

// PROPOSED (ONLY WHEN APPROPRIATE):
{
  (po.status === "approved" || po.status === "sent") && (
    <button
      onClick={() => {
        handleGenerateInvoice(po);
        setExpandedRows(new Set());
      }}
      className="..."
    >
      ...
    </button>
  );
}
```

---

## 📝 Quick Checklist

- [ ] Confirm logged in (see dashboard, not login page)
- [ ] Check token exists: `localStorage.getItem('token')`
- [ ] Test connection: `window.apiConfig?.testApiConnection?.()`
- [ ] Backend running: `netstat -ano | findstr ":5000"`
- [ ] Frontend running: `netstat -ano | findstr ":3000"`
- [ ] Try invoice generation
- [ ] Check browser console (F12) for errors
- [ ] Check Network tab (F12) for request status

---

## 🚀 Next Steps

1. **Run diagnostics** using steps above
2. **Share results:**
   - Token status
   - Connection test result
   - Browser console errors
   - Network tab request/response
3. **I'll provide targeted fix** based on results
