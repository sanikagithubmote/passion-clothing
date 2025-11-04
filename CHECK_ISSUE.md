# 🚨 UNKNOWN PRODUCT ISSUE - DIAGNOSTIC CHECKLIST

## Current Situation

- You're seeing "Unknown Product" on the Manufacturing Dashboard
- Backend is on AWS
- Production order: PRD-20251101-0002 (Qty: 3)

---

## ROOT CAUSE ANALYSIS

The "Unknown Product" issue happens when:

```
Production Order Created
    ↓
product_id = NULL (no linked product)
    ↓
specifications.product_name = NULL or MISSING
    ↓
Frontend shows "Unknown Product" ❌
```

OR

```
Backend hasn't been restarted
    ↓
Code changes not loaded
    ↓
productName field not added to API response
    ↓
Frontend can't find productName
    ↓
Shows "Unknown Product" ❌
```

---

## 🔍 IMMEDIATE DIAGNOSTIC

### Check 1: API Response (Most Important!)

**In your browser console or terminal:**

```bash
# Using curl (if backend is local):
curl "http://localhost:5000/api/manufacturing/orders?limit=1"

# Or using PowerShell:
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/manufacturing/orders?limit=1" | ConvertFrom-Json
$response.productionOrders[0] | ConvertTo-Json | Write-Host
```

**Look for:**

```json
{
  "productName": "Cotton T-Shirt - Navy",  ✅ THIS SHOULD EXIST
  "product": null,                          (OK if null)
  "specifications": {
    "product_name": "Cotton T-Shirt - Navy" (OK)
  }
}
```

---

### Check 2: Database Data (AWS)

**Run this query on your AWS RDS MySQL:**

```sql
SELECT
  id,
  production_number,
  product_id,
  specifications,
  created_at
FROM production_orders
WHERE production_number = 'PRD-20251101-0002'
LIMIT 1;
```

**What you'll see:**

**CASE 1 - Has product_id (LINKED PRODUCT):**

```
id | production_number      | product_id | specifications
1  | PRD-20251101-0002     | 5          | {...}
```

✅ Should show product name
→ **If not:** Backend enrichment not working

---

**CASE 2 - No product_id, but specifications has product_name:**

```
id | production_number      | product_id | specifications
1  | PRD-20251101-0002     | NULL       | {"product_name":"Cotton T-Shirt - Navy"}
```

✅ Backend should extract from specifications
→ **If showing "Unknown Product":** Backend code not applied

---

**CASE 3 - No product_id AND specifications is empty:**

```
id | production_number      | product_id | specifications
1  | PRD-20251101-0002     | NULL       | {}
```

❌ **ROOT CAUSE FOUND!** No product data exists
→ **Solution:** Re-create the production order WITH product information

---

## 💡 SOLUTIONS BY SITUATION

### Situation A: You're using LOCAL backend

**Step 1: Stop the backend**

```bash
# Terminal where backend is running:
Ctrl + C
```

**Step 2: Verify code is there**

```bash
# Open: server/routes/manufacturing.js
# Search for: "orderData.productName ="
# It should be around line 1963
```

**Step 3: Restart backend**

```bash
cd c:\Users\admin\Desktop\passion-clothing
npm start
# Wait for: ✅ Server running on port 5000
```

**Step 4: Clear cache and test**

```
Browser: Go to http://localhost:3000/manufacturing/orders
Press: Ctrl + Shift + Delete (clear cache)
Or F12 → Application → Clear Site Data
Then: Ctrl + F5 (hard refresh)
```

---

### Situation B: You're using AWS backend

**Step 1: Deploy code to AWS**

The code changes need to be deployed to your AWS server:

Files modified:

- `server/routes/manufacturing.js` (lines 1958-1972)
- 6 frontend component files

**Option 1 - Using Git:**

```bash
git add .
git commit -m "Fix: Add productName field to manufacturing orders API"
git push origin main  # or your branch
# Then redeploy on AWS (depends on your setup)
```

**Option 2 - Manual deployment:**
Copy these files to your AWS server:

- `server/routes/manufacturing.js`
- All files in `client/src/pages/manufacturing/`
- All files in `client/src/components/manufacturing/`

Then restart services on AWS

---

### Situation C: Database has no product_name

**If Check 2 shows CASE 3 (empty specifications):**

You need to add product information to the production orders.

**Option 1 - Update existing orders (SQL):**

```sql
UPDATE production_orders
SET specifications = JSON_SET(
  specifications,
  '$.product_name',
  'Cotton T-Shirt - Navy'
)
WHERE production_number = 'PRD-20251101-0002'
LIMIT 1;
```

**Option 2 - Create new orders with product information**

When creating a production order, make sure to include:

```json
{
  "product_name": "Cotton T-Shirt - Navy",
  "garment_specifications": {
    "product_type": "T-Shirt",
    "color": "Navy",
    "fabric": "Cotton"
  }
}
```

---

## ✅ VERIFICATION STEPS

After applying the appropriate solution:

### 1. API Test

```bash
curl "http://localhost:5000/api/manufacturing/orders?limit=1"
```

✅ **Success:** Response contains `"productName": "..."`
❌ **Fail:** No productName field

### 2. Database Test

```bash
SELECT specifications FROM production_orders
WHERE production_number = 'PRD-20251101-0002';
```

✅ **Success:** specifications contains `"product_name": "..."`
❌ **Fail:** specifications is empty or null

### 3. UI Test

Go to: `http://localhost:3000/manufacturing/orders`
✅ **Success:** All product columns show real names
❌ **Fail:** Still shows "Unknown Product"

---

## 🎯 DECISION TREE

```
Question: What do you see in the API response?

├─ "productName" field EXISTS?
│  └─ YES
│     └─ Is its value "Unknown Product"?
│        ├─ YES → Database has no product data (CASE 3)
│        │  └─ Solution: Add product_name to specifications
│        └─ NO → Fix is working! ✅
│  └─ NO → Backend code not applied
│     └─ Solution: Restart backend service

Question: Is backend LOCAL or on AWS?
├─ LOCAL → Restart with: npm start
└─ AWS → Redeploy code to AWS and restart service
```

---

## 📋 WHAT TO TELL ME

To help you faster, tell me:

1. **Where is your backend?**

   - [ ] Local (running on my computer)
   - [ ] AWS (deployed to cloud)

2. **What does this API call return?**

   ```bash
   curl "http://localhost:5000/api/manufacturing/orders?limit=1"
   ```

   (Copy the JSON response - specifically look for `productName` field)

3. **What does this SQL query return?**

   ```sql
   SELECT product_id, specifications FROM production_orders
   WHERE production_number = 'PRD-20251101-0002';
   ```

4. **Have you restarted the backend after code changes?**

   - [ ] Yes, just restarted
   - [ ] No, haven't restarted yet
   - [ ] Not sure

5. **Did you clear browser cache?**
   - [ ] Yes (Ctrl+Shift+Delete)
   - [ ] No, haven't done it
   - [ ] Not sure

---

## 🚀 QUICK FIX CHECKLIST

- [ ] Stopped backend server (Ctrl + C)
- [ ] Waited 3 seconds
- [ ] Deleted node_modules/.cache (if exists)
- [ ] Restarted backend (npm start)
- [ ] Waited for "✅ Server running on port 5000" message
- [ ] Cleared browser cache (Ctrl + Shift + Delete)
- [ ] Hard-refreshed page (Ctrl + F5)
- [ ] Verified API response has productName field
- [ ] Verified database has product data

**If ALL checks pass → Product names should display! ✅**

---

## 📞 SUPPORT INFO

This fix involves:

- Backend: `server/routes/manufacturing.js` (lines 1958-1972)
- Frontend: 6 components in `client/src/pages/manufacturing/` and `client/src/components/`

All files have been modified to support the fallback chain:

```
order.productName (from backend)
  ↓
order.product?.name (direct product)
  ↓
order.specifications?.product_name (specs JSON)
  ↓
"Unknown Product" (fallback)
```
