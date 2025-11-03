# ⚡ Document Download - URL Format Fix

## 🔴 What You Did (WRONG)

```
GET http://localhost:3000/api/documents/download/6
                                        ^^^^^^^^ ↑
                                        Wrong order!
```

**Error:** Route not found

---

## 🟢 What You Should Do (CORRECT)

```
GET http://localhost:5000/api/documents/6/download
                                        ↑ ^^^^^^^^
                                        ID first, then "download"
```

**Result:** 200 OK + PDF download (with authentication)

---

## 📝 Key Points

| Aspect         | Wrong                      | Right                     |
| -------------- | -------------------------- | ------------------------- |
| **Port**       | 3000 (client)              | 5000 (API server)         |
| **URL Format** | `/documents/download/6`    | `/documents/6/download`   |
| **Requires**   | ❌ None (will fail anyway) | ✅ Bearer token in header |
| **Response**   | ❌ 404 Route not found     | ✅ 200 OK + PDF           |

---

## 🔐 Complete Example (PowerShell)

```powershell
# 1. Get token
$login = Invoke-WebRequest "http://localhost:5000/api/auth/login" `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@passion.com","password":"password123"}' `
  -UseBasicParsing

$token = ($login.Content | ConvertFrom-Json).token

# 2. Download with token
$headers = @{ Authorization = "Bearer $token" }
Invoke-WebRequest "http://localhost:5000/api/documents/6/download" `
  -Method GET -Headers $headers -OutFile "invoice.pdf"

Write-Host "✅ Downloaded successfully!"
```

---

## 🌐 From Browser (React)

```javascript
// In your download handler:
const url = `/api/documents/6/download`; // ← Correct format
const response = await api.get(url, { responseType: "blob" });

// The token will be added automatically by your axios interceptor
```

---

## 🎯 What Happens Now

1. ✅ You call with **correct URL**: `/api/documents/6/download`
2. ✅ Route matches: `/:documentId/download`
3. ✅ Authentication checked (401 if no token)
4. ✅ Document fetched from database
5. ✅ If file missing → regenerates on-demand ⭐
6. ✅ PDF returned (200 OK)

---

## 🧪 Quick Test

Run this in PowerShell to verify:

```powershell
# Test that route exists (will ask for token)
Invoke-WebRequest "http://localhost:5000/api/documents/1/download" `
  -Method GET -ErrorAction SilentlyContinue

# Expected error: "Access token required"
# This means the route EXISTS! ✅
```

If you get "Route not found" → URL format is wrong.
If you get "Access token required" → URL is correct! ✅

---

## 📚 Related Files

- **TEST_DOCUMENT_DOWNLOAD.md** - Complete testing guide with scripts
- **DOCUMENT_DOWNLOAD_FIX_COMPLETE.md** - Full technical documentation
- **DOCUMENT_DOWNLOAD_FIX_QUICK_START.md** - 5-minute deployment guide
