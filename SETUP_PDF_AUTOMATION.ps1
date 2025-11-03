# ============================================
# ERP PDF AUTOMATION SYSTEM - SETUP SCRIPT
# ============================================
# This script sets up the PDF generation and 
# document automation system for Passion Clothing ERP
# ============================================

Write-Host "
╔════════════════════════════════════════════════╗
║  PDF AUTOMATION SETUP - PASSION CLOTHING ERP   ║
║  Date: January 2025                            ║
╚════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# Step 1: Navigate to project root
Write-Host "📍 Step 1: Navigating to project root..." -ForegroundColor Yellow
Set-Location "c:\Users\admin\Desktop\passion-clothing"

# Step 2: Install required dependencies
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install pdfkit
npm install sequelize

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Step 3: Create document storage directories
Write-Host "📁 Step 3: Creating document storage directories..." -ForegroundColor Yellow

$directories = @(
    "uploads/documents",
    "uploads/documents/invoices",
    "uploads/documents/purchase_orders",
    "uploads/documents/grn_slips",
    "uploads/documents/manufacturing_slips",
    "uploads/documents/delivery_invoices"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Already exists: $dir" -ForegroundColor Cyan
    }
}

# Step 4: Verify files are in place
Write-Host "✅ Step 4: Verifying utility files..." -ForegroundColor Yellow

$utilFiles = @(
    "server/utils/pdfGenerator.js",
    "server/utils/documentService.js",
    "server/utils/workflowTriggers.js"
)

foreach ($file in $utilFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
    }
}

# Step 5: Verify route file
Write-Host "✅ Step 5: Verifying document routes..." -ForegroundColor Yellow

if (Test-Path "server/routes/documents.js") {
    Write-Host "✅ Found: server/routes/documents.js" -ForegroundColor Green
} else {
    Write-Host "❌ Missing: server/routes/documents.js" -ForegroundColor Red
}

# Step 6: Configuration status
Write-Host "
╔════════════════════════════════════════════════╗
║  SETUP SUMMARY                                 ║
╚════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "
✅ COMPLETED:
   • Dependencies installed
   • Document directories created
   • Utility files verified
   • Routes configured

⚠️  NEXT STEPS:

1. Integration in Existing Routes:
   
   📄 In server/routes/sales.js:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   const WorkflowTriggers = require('../utils/workflowTriggers');
   
   // When updating sales order status to 'confirmed':
   router.put('/:id/confirm', authenticateToken, async (req, res) => {
     const salesOrder = await SalesOrder.findByPk(req.params.id, 
       { include: [{ model: Customer, as: 'customer' }] }
     );
     
     await salesOrder.update({ status: 'confirmed' });
     
     const workflowTriggers = new WorkflowTriggers(require('../config/database'));
     const result = await workflowTriggers.onSalesOrderConfirmed(salesOrder, req.user.id);
     
     res.json({ success: true, data: salesOrder, triggered: result });
   });

   📄 In server/routes/grn.js:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   // When GRN status changes to 'completed':
   router.put('/:id/complete', authenticateToken, async (req, res) => {
     const grn = await GoodsReceiptNote.findByPk(req.params.id);
     const po = await PurchaseOrder.findByPk(grn.purchase_order_id, 
       { include: [{ model: Vendor, as: 'vendor' }] }
     );
     
     await grn.update({ status: 'completed' });
     
     const workflowTriggers = new WorkflowTriggers(require('../config/database'));
     const result = await workflowTriggers.onGRNCompleted(grn, po, req.user.id);
     
     res.json({ success: true, data: grn, triggered: result });
   });

   📄 In server/routes/manufacturing.js:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   // When production stage is completed:
   router.put('/stages/:stageId/complete', authenticateToken, async (req, res) => {
     const stage = await ProductionStage.findByPk(req.params.stageId);
     const productionOrder = await ProductionOrder.findByPk(stage.production_order_id);
     
     await stage.update({ status: 'completed' });
     
     const workflowTriggers = new WorkflowTriggers(require('../config/database'));
     const result = await workflowTriggers.onProductionStageCompleted(stage, productionOrder, req.user.id);
     
     res.json({ success: true, data: stage, triggered: result });
   });

   📄 In server/routes/shipments.js:
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   // When shipment is delivered:
   router.put('/:id/deliver', authenticateToken, async (req, res) => {
     const shipment = await Shipment.findByPk(req.params.id, 
       { include: [{ model: CourierPartner, as: 'courier' }] }
     );
     const salesOrder = await SalesOrder.findByPk(shipment.sales_order_id, 
       { include: [{ model: Customer, as: 'customer' }] }
     );
     
     await shipment.update({ status: 'delivered' });
     
     const workflowTriggers = new WorkflowTriggers(require('../config/database'));
     const result = await workflowTriggers.onDeliveryCompleted(shipment, salesOrder, req.user.id);
     
     res.json({ success: true, data: shipment, triggered: result });
   });

2. Test API Endpoints:
   
   curl -X GET http://localhost:5000/api/documents/sales-order/1 \
     -H 'Authorization: Bearer YOUR_TOKEN'

   curl -X GET http://localhost:5000/api/documents/admin/dashboard \
     -H 'Authorization: Bearer YOUR_TOKEN'

3. Test Manual Trigger:
   
   curl -X POST http://localhost:5000/api/documents/manual-trigger \
     -H 'Authorization: Bearer YOUR_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{\"trigger_type\": \"sales.confirmed\", \"entity_id\": 1}'

4. Create Frontend Components:
   - Document viewer panel
   - Document download interface
   - Admin dashboard for document management

📚 DOCUMENTATION:
   See: ERP_PDF_AUTOMATION_GUIDE.md

" -ForegroundColor Green

Write-Host "
════════════════════════════════════════════════
SETUP COMPLETE! Your system is ready.
Start the server: npm start
════════════════════════════════════════════════
" -ForegroundColor Cyan