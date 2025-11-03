# Test script for document download fix
# Tests the /api/documents/download/:documentId endpoint

Write-Host "Test Document Download Endpoint" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$testUrl = "http://localhost:5000/api/documents/download/6"

Write-Host "Testing endpoint: $testUrl" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
    Write-Host "Content-Length: $($response.RawContentLength) bytes" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $statusDescription = $_.Exception.Response.StatusDescription
    
    Write-Host "Status: $statusCode $statusDescription" -ForegroundColor Red
    
    try {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    } catch {
        # Silent fail
    }
}

Write-Host "Test Complete" -ForegroundColor Cyan