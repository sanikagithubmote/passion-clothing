# ⚡ Document Download Fix - Quick Start (5 Minutes)

## 🎯 What Was Fixed

The `/api/documents/download/:documentId` endpoint now **regenerates missing PDF files on-demand** instead of returning 404 errors.

## 🚀 Deploy in 3 Steps

### Step 1: Restart Server (30 seconds)

```bash
# Stop current server
pm2 stop all
pm2 start all

# OR if using npm:
npm run dev
```

### Step 2: Test with Any Document ID (1 minute)

```bash
# Get list of documents
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/documents/sales-order/1

# Download a document (replace 6 with real ID)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -O http://localhost:5000/api/documents/download/6
```

**Expected Results:**

- ✅ File downloads as PDF
- ✅ File size is ~2-3KB
- ✅ Check browser console for: "✅ Document downloaded:"

### Step 3: Check Server Logs (inspect behavior)

```bash
# Look for these messages in PM2 logs:
pm2 logs

# If file was regenerated:
# ⚠️ Invoice file missing, regenerating: ...
# ✅ Invoice PDF regenerated and saved: ...
# ✅ Document downloaded: ...
```

---

## 💡 How It Works

| Scenario                | Before         | After                      |
| ----------------------- | -------------- | -------------------------- |
| **File exists on disk** | ✅ Downloads   | ✅ Downloads (same)        |
| **File missing**        | ❌ 404 Error   | ✅ Regenerates + Downloads |
| **Wrong file size**     | 102400 bytes   | ✅ Correct size (~2KB)     |
| **Invalid Date error**  | "Invalid Date" | ✅ "N/A" or proper date    |

---

## ✅ Verification (30 seconds)

Open DevTools → Network Tab → Download Invoice

```
Status: 200 ✅
Size: ~2-3 KB ✅
Type: application/pdf ✅
```

---

## 📊 Key Changes Made

**File**: `server/routes/documents.js`

1. Added PDF generation function
2. Enhanced download endpoint with fallback logic
3. Added proper error handling
4. Regenerated files saved to disk for future use

---

## 🆘 If Still Getting 404

1. **Check database has documents:**

   ```sql
   SELECT COUNT(*) FROM document_attachments;
   ```

2. **Check sales order exists:**

   ```sql
   SELECT * FROM sales_orders WHERE id = 1;
   ```

3. **Check server is running:**

   ```bash
   curl http://localhost:5000/api/health
   ```

4. **Check for errors in logs:**
   ```bash
   pm2 logs | grep "❌"
   ```

---

## 🎉 Done!

The fix is now active. Documents will:

- ✅ Download normally if file exists
- ✅ Regenerate automatically if missing
- ✅ Show correct file sizes
- ✅ Display dates properly

**No user action needed - works transparently!**

---

**Reference:** See `DOCUMENT_DOWNLOAD_FIX_COMPLETE.md` for detailed technical information.
