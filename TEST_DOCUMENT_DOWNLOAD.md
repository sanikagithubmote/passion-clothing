# 📥 Document Download - Complete Testing Guide

## ✅ Current Status

- ✅ Endpoint exists: `/api/documents/:documentId/download`
- ✅ Route is registered correctly
- ✅ Authentication required (returns 401 without token)
- ✅ On-demand PDF regeneration implemented

---

## 🔐 Step 1: Get Authentication Token

```bash
# Login to get token
$loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (ConvertTo-Json @{
    email = "admin@passion.com"
    password = "password123"
  }) -UseBasicParsing

$token = ($loginResponse.Content | ConvertFrom-Json).token
Write-Host "Token: $token"
```

---

## 📥 Step 2: Download Document With Token

```bash
# Use the token to download
$headers = @{
    Authorization = "Bearer $token"
    Accept = "application/pdf"
}

$downloadUrl = "http://localhost:5000/api/documents/1/download"
Invoke-WebRequest -Uri $downloadUrl -Method GET -Headers $headers -OutFile "invoice.pdf"

Write-Host "✅ Downloaded: invoice.pdf"
```

---

## 📋 Alternative: Get List of Available Documents First

```bash
# Get all documents for a sales order
$headers = @{
    Authorization = "Bearer $token"
}

$listUrl = "http://localhost:5000/api/documents/sales-order/1"
$response = Invoke-WebRequest -Uri $listUrl -Method GET -Headers $headers -UseBasicParsing
$documents = $response.Content | ConvertFrom-Json

# Show all available documents
$documents.data.timeline | Select-Object id, name, type | Format-Table
```

---

## 🧪 Complete Test Script

Save as `test-download-complete.ps1`:

```powershell
# Configuration
$apiUrl = "http://localhost:5000"
$email = "admin@passion.com"
$password = "password123"
$documentId = 1

Write-Host "🔍 Testing Document Download..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "1️⃣ Authenticating..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "$apiUrl/api/auth/login" `
      -Method POST `
      -ContentType "application/json" `
      -Body (ConvertTo-Json @{
        email = $email
        password = $password
      }) -UseBasicParsing

    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token

    if ($token) {
        Write-Host "✅ Login successful" -ForegroundColor Green
        Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    } else {
        Write-Host "❌ No token received" -ForegroundColor Red
        exit
    }
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit
}

Write-Host ""

# Step 2: List documents
Write-Host "2️⃣ Fetching document list..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    $listResponse = Invoke-WebRequest -Uri "$apiUrl/api/documents/sales-order/1" `
      -Method GET `
      -Headers $headers `
      -UseBasicParsing

    $listData = $listResponse.Content | ConvertFrom-Json
    $documents = $listData.data.timeline

    Write-Host "✅ Found $($documents.Count) documents" -ForegroundColor Green
    Write-Host ""

    # Show available documents
    $documents | Select-Object id, name, type | Format-Table

    # Use first document if available
    if ($documents.Count -gt 0) {
        $documentId = $documents[0].id
    }
} catch {
    Write-Host "❌ Failed to fetch document list: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Download document
Write-Host "3️⃣ Downloading document $documentId..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }

    $downloadUrl = "$apiUrl/api/documents/$documentId/download"
    Write-Host "   URL: $downloadUrl" -ForegroundColor Gray

    $response = Invoke-WebRequest -Uri $downloadUrl `
      -Method GET `
      -Headers $headers `
      -OutFile "downloaded-invoice.pdf"

    $fileSize = (Get-Item "downloaded-invoice.pdf").Length
    Write-Host "✅ Download successful!" -ForegroundColor Green
    Write-Host "   File: downloaded-invoice.pdf" -ForegroundColor Gray
    Write-Host "   Size: $($fileSize) bytes" -ForegroundColor Gray

} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red

    # Check if it's a 404
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "   → Document not found (404)" -ForegroundColor Yellow
        Write-Host "   → Tip: Check if document ID exists in database" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Test complete!" -ForegroundColor Green
```

Run it:

```bash
powershell -ExecutionPolicy Bypass -File test-download-complete.ps1
```

---

## 🐛 Common Issues & Fixes

| Error                         | Cause                     | Fix                                                     |
| ----------------------------- | ------------------------- | ------------------------------------------------------- |
| **401 Access token required** | No/invalid token          | Use `/api/auth/login` first                             |
| **404 Not found (database)**  | Document ID doesn't exist | Check sales_orders and document_attachments tables      |
| **404 File not found**        | PDF missing on disk       | Endpoint will regenerate (check server logs)            |
| **Route not found**           | Wrong URL format          | Use `/api/documents/{ID}/download` not `/download/{ID}` |

---

## 📊 Expected Behavior

### File Exists on Disk

```
Status: 200 OK ✅
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice.pdf"
Size: ~2-3KB
```

### File Missing on Disk (Regeneration)

```
Server logs show:
  ⚠️ Invoice file missing, regenerating: invoice.pdf
  ✅ Invoice PDF regenerated and saved: ...
  ✅ Document downloaded: invoice.pdf by user 1

Status: 200 OK ✅
(File auto-regenerated and downloaded)
```

---

## 🎯 From Browser (React App)

In your React code:

```javascript
import api from "@/utils/api";

// Download will work automatically through proxy
const downloadDocument = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: "blob",
    });

    // Create download link
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf";
    a.click();
  } catch (error) {
    console.error("Download failed:", error);
  }
};

// Usage
downloadDocument(1);
```

---

## ✅ Verification Checklist

- [ ] Server running on port 5000
- [ ] Client proxy configured (port 3000 → 5000)
- [ ] Database has documents
- [ ] Token obtained from login endpoint
- [ ] Document ID exists in database
- [ ] Call `/api/documents/{id}/download` with token
- [ ] Status 200 OK received
- [ ] PDF downloads successfully
