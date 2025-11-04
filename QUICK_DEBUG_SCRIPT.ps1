# PowerShell Script to diagnose the Unknown Product issue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 QUICK DIAGNOSTIC FOR UNKNOWN PRODUCT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check 1: Verify backend enrichment code exists
Write-Host "CHECK 1: Backend enrichment code..." -ForegroundColor Yellow
$manufacturingFile = "c:\Users\admin\Desktop\passion-clothing\server\routes\manufacturing.js"

if (Test-Path $manufacturingFile) {
    $content = Get-Content $manufacturingFile -Raw
    
    if ($content -like "*orderData.productName = orderData.specifications.product_name*") {
        Write-Host "✅ Backend enrichment code IS present" -ForegroundColor Green
        Write-Host "   Found: orderData.productName = orderData.specifications.product_name" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend enrichment code NOT found" -ForegroundColor Red
        Write-Host "   The fix may not have been applied" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File not found: $manufacturingFile" -ForegroundColor Red
}

# Check 2: Verify frontend code uses productName
Write-Host "`nCHECK 2: Frontend usage of productName..." -ForegroundColor Yellow
$productionOrdersFile = "c:\Users\admin\Desktop\passion-clothing\client\src\pages\manufacturing\ProductionOrdersPage.jsx"

if (Test-Path $productionOrdersFile) {
    $content = Get-Content $productionOrdersFile -Raw
    
    if ($content -like "*order.productName || order.product?.name*") {
        Write-Host "✅ Frontend fallback chain IS present" -ForegroundColor Green
        Write-Host "   Found: order.productName || order.product?.name" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend fallback chain NOT found" -ForegroundColor Red
    }
} else {
    Write-Host "❌ File not found: $productionOrdersFile" -ForegroundColor Red
}

# Check 3: Backend running
Write-Host "`nCHECK 3: Backend server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/manufacturing/orders?limit=1" `
        -ErrorAction SilentlyContinue -TimeoutSec 3 | ConvertFrom-Json
    
    if ($response.productionOrders) {
        Write-Host "✅ Backend IS running on http://localhost:5000" -ForegroundColor Green
        Write-Host "   Response received: $(($response.productionOrders | Measure-Object).Count) order(s)" -ForegroundColor Green
        
        # Check if productName field exists
        $firstOrder = $response.productionOrders[0]
        if ($firstOrder.productName) {
            Write-Host "   ✅ productName field EXISTS in response" -ForegroundColor Green
            Write-Host "   Value: '$($firstOrder.productName)'" -ForegroundColor Green
        } else {
            Write-Host "   ❌ productName field MISSING from response" -ForegroundColor Red
            Write-Host "   Available fields: $(($firstOrder | Get-Member -MemberType NoteProperty).Name -join ', ')" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Cannot connect to backend on http://localhost:5000" -ForegroundColor Red
    Write-Host "   Make sure backend is running with: npm start" -ForegroundColor Yellow
}

# Check 4: Frontend running
Write-Host "`nCHECK 4: Frontend server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" `
        -ErrorAction SilentlyContinue -TimeoutSec 3
    Write-Host "✅ Frontend IS running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to frontend on http://localhost:3000" -ForegroundColor Red
    Write-Host "   Make sure frontend is running with: cd client && npm start" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. If backend shows ❌: Run 'npm start' in passion-clothing directory" -ForegroundColor White
Write-Host "2. If frontend shows ❌: Run 'cd client && npm start' in new terminal" -ForegroundColor White
Write-Host "3. If productName is missing: Restart backend (Ctrl+C, then npm start)" -ForegroundColor White
Write-Host "4. Then go to: http://localhost:3000/manufacturing/orders" -ForegroundColor White
Write-Host "5. Hard refresh: Ctrl + F5" -ForegroundColor White
Write-Host "`n"