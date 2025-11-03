# 🏭 PASSION ERP - Complete End-to-End Workflow Analysis

## 📊 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PASSION CLOTHING ERP SYSTEM                   │
│                    React 18 + Node.js + MySQL                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
           ┌────▼────┐   ┌────▼────┐   ┌───▼────┐
           │ Frontend │   │ Backend  │   │ Database│
           │  (React) │   │(Express) │   │(MySQL)  │
           └────┬────┘   └────┬────┘   └───┬────┘
                │             │             │
                └─────────────┼─────────────┘
                    JWT Auth + REST APIs
```

---

## 🔄 MAIN WORKFLOW LIFECYCLE

### **PHASE 1: SALES → PROCUREMENT (Customer Order Processing)**

```
┌──────────────────────────────────────────────────────────────────┐
│                    PHASE 1: SALES & PROCUREMENT                   │
└──────────────────────────────────────────────────────────────────┘

STEP 1: CREATE SALES ORDER
├─ Location: Sales Dashboard / Create Order Page
├─ Data Captured:
│  ├─ Customer Info (name, email, company)
│  ├─ Product Details (product_name, quantity)
│  ├─ Garment Specifications (color, fabric_type, size)
│  ├─ Delivery Date
│  ├─ Special Instructions
│  └─ Design Files (optional)
├─ Backend: POST /api/sales/orders
├─ Database: Saved to sales_orders table
├─ Status: 'draft' → 'submitted'
└─ Output: Sales Order Number (SO-YYYYMMDD-XXXX)

         ↓

STEP 2: ADMIN APPROVAL (Optional)
├─ Location: Admin Dashboard / Pending Approvals
├─ Flow:
│  ├─ If auto-approved → Status: 'approved'
│  └─ If requires review → Status: 'pending_approval'
├─ Backend: POST /api/admin/pending-approvals/:id/approve
└─ Notification: Sent to Procurement Team

         ↓

STEP 3: CREATE PURCHASE ORDER (Procurement)
├─ Location: Procurement Dashboard
├─ Data Captured:
│  ├─ Select Vendor
│  ├─ Linked Sales Order
│  ├─ Material Requirements (fabric, accessories)
│  ├─ Fabric Requirements (type, color, quantity)
│  ├─ Accessories (buttons, zips, thread)
│  ├─ PO Items (line items with costs)
│  ├─ Delivery Date
│  └─ Special Instructions
├─ Backend: POST /api/procurement/purchase-orders
├─ Database: Saved to purchase_orders table
├─ Status: 'draft' → 'sent'
├─ Auto Updates:
│  ├─ Sales Order Status → 'procurement_created'
│  ├─ Creates Bidirectional Link (linked_sales_order_id)
│  └─ Sends Notifications
└─ Output: PO Number (PO-YYYYMMDD-XXXX)

         ↓

STEP 4: VENDOR RECEIVES PO
├─ Vendor Reviews Order
├─ Status: 'sent' (sent to vendor)
└─ Updates: Vendor can confirm/reject

         ↓

STEP 5: GOODS RECEIPT (GRN)
├─ Location: Procurement Dashboard / GRN Tab
├─ Process:
│  ├─ Receive physical goods from vendor
│  ├─ Create Goods Receipt Note
│  ├─ Verify items received vs. PO
│  ├─ Check quantity, quality
│  └─ Update inventory
├─ Database: Saved to goods_receipt_notes table
├─ Status: 'draft' → 'received'
├─ Stock Update: Inventory quantities increased
├─ Backend: POST /api/procurement/grn
└─ Notification: Sent to Inventory Team

         ↓

STEP 6: PRODUCTION APPROVAL
├─ Location: Manufacturing Dashboard / Material Receipts
├─ Process:
│  ├─ Review received materials
│  ├─ Verify against MRN (Material Request Note)
│  ├─ Check quality and quantity
│  └─ Approve for production use
├─ Database: approval status updated in production_approvals table
├─ Status: 'draft' → 'approved' → 'production_started'
└─ Next Flow: Production begins with approved materials
```

---

### **PHASE 2: MANUFACTURING (Production & Quality Control)**

```
┌──────────────────────────────────────────────────────────────────┐
│              PHASE 2: MANUFACTURING & PRODUCTION                  │
└──────────────────────────────────────────────────────────────────┘

STEP 1: CREATE PRODUCTION ORDER
├─ Trigger: After Sales Order Approval
├─ Location: Manufacturing Dashboard / Create Production Order Wizard
├─ Data Captured:
│  ├─ Sales Order Reference (links orders together)
│  ├─ Project Reference (groups related production orders)
│  ├─ Product Details (from sales order)
│  ├─ Quantity to Produce
│  ├─ Materials Required (from PO)
│  ├─ Production Stages (Cutting, Embroidery, Stitching, etc.)
│  ├─ Quality Checkpoints
│  └─ Special Instructions
├─ Backend: POST /api/manufacturing/orders
├─ Database: Saved to production_orders table
├─ Includes:
│  ├─ project_reference (sales_order_number)
│  └─ shipment_id (links to shipment workflow)
└─ Status: 'pending' → 'in_production'

         ↓

STEP 2: STAGE-BY-STAGE PRODUCTION TRACKING
├─ Location: Production Tracking Tab / Production Operations View
├─ Stages Tracked:
│  ├─ Stage 1: Cutting (Cut fabric according to pattern)
│  ├─ Stage 2: Embroidery (if applicable, or send to outsourcing)
│  ├─ Stage 3: Stitching (Main assembly)
│  ├─ Stage 4: Finishing (Hems, quality fixes)
│  ├─ Stage 5: Quality Control (Final inspection)
│  ├─ Stage 6: Packaging (Pack for shipment)
│  └─ Stage 7: Ready for Shipment
│
├─ For Each Stage:
│  ├─ Data Tracked:
│  │  ├─ Start Time / End Time
│  │  ├─ Worker/Department
│  │  ├─ Quantity Processed
│  │  ├─ Quantity Approved
│  │  ├─ Quantity Rejected
│  │  └─ Notes & Issues
│  │
│  ├─ Status Options:
│  │  ├─ pending (not started)
│  │  ├─ in_progress (stage started)
│  │  ├─ on_hold (paused)
│  │  ├─ completed (finished)
│  │  └─ rejected (needs rework)
│  │
│  ├─ Quality Checkpoints:
│  │  ├─ Automatic QC after specific stages
│  │  ├─ Record defects/issues
│  │  ├─ Pass/Fail decision
│  │  └─ Send to rework if failed
│  │
│  └─ Backend: PUT /api/manufacturing/orders/:id/stages/:stageId

         ↓

STEP 3: OUTSOURCING WORKFLOW (For Embroidery/Printing/Washing)
├─ Location: Manufacturing Dashboard / Outsource Management Page
├─ When Needed: If stage requires outsourcing
├─
├─ Outward Challan (Send Materials):
│  ├─ Create Outward Challan
│  ├─ Add:
│  │  ├─ Vendor/Outsource Partner
│  │  ├─ Materials Sending
│  │  ├─ Quantity
│  │  ├─ Transport Details
│  │  └─ Expected Return Date
│  ├─ Database: Saved to challans table (type: 'outward')
│  ├─ Stock Updated: Reduce from Manufacturing inventory
│  └─ Backend: POST /api/outsourcing/challans
│
│         ↓
│
├─ Materials at Outsourcer: Being processed
│
│         ↓
│
├─ Inward Challan (Receive Materials):
│  ├─ Create Inward Challan
│  ├─ Add:
│  │  ├─ Completed Materials
│  │  ├─ Quantity Received
│  │  ├─ Quality Notes
│  │  ├─ Damage/Defects
│  │  └─ Approval
│  ├─ Database: Saved to challans table (type: 'inward')
│  ├─ Stock Updated: Return to Manufacturing inventory
│  └─ Backend: POST /api/outsourcing/challans
│
└─ Production Stage Resumes

         ↓

STEP 4: MATERIAL RECONCILIATION (Final Stage)
├─ Location: Production Operations View / Final Stage
├─ Process:
│  ├─ Calculate Material Usage
│  ├─ Track Leftover Materials
│  ├─ Return Unused Materials to Inventory
│  ├─ Create Inventory Movements (Inventory table)
│  └─ Record Audit Trail
├─ Database: Updates to inventory and production_stage_operations
└─ Automatic: Leftover materials returned to stock

         ↓

STEP 5: PRODUCTION COMPLETION
├─ Location: Production Tracking Tab
├─ Status Update: 'in_production' → 'completed'
├─ Database: production_orders status changed
├─ Quality Status:
│  ├─ If All QC Passed: 'approved'
│  └─ If Issues: Rework or 'rejected'
├─ Auto Link: shipment_id field populated (links to shipment)
└─ Next Step: Ready for Shipment
```

---

### **PHASE 3: INVENTORY MANAGEMENT**

```
┌──────────────────────────────────────────────────────────────────┐
│            PHASE 3: INVENTORY & STOCK MANAGEMENT                  │
└──────────────────────────────────────────────────────────────────┘

STEP 1: STOCK RECEIPT (From GRN)
├─ Trigger: When GRN is approved
├─ Location: Inventory Dashboard / All Stock Tab
├─ Process:
│  ├─ Goods arrive from vendor
│  ├─ Create Stock Entry
│  ├─ Add:
│  │  ├─ Product/Material Name
│  │  ├─ Category (fabric, accessories, etc.)
│  │  ├─ Quantity Received
│  │  ├─ Unit Price
│  │  ├─ Barcode (auto-generated)
│  │  └─ Lot Number
│  ├─ Database: Saved to inventory table
│  └─ Barcode: CHN-YYYYMMDD-XXXX format
│
├─ Backend: POST /api/inventory/stocks

         ↓

STEP 2: FACTORY STOCK vs PROJECT STOCK
├─ Factory Stock:
│  ├─ General materials for all projects
│  ├─ Not tied to specific sales order
│  ├─ Used across multiple projects
│  └─ Managed in "Factory Stock" Tab
│
├─ Project Stock:
│  ├─ Specific materials for specific sales order
│  ├─ Tied to project_reference (sales_order_number)
│  ├─ Used only for that project
│  ├─ Managed in "Project Stock" Tab
│  └─ Automatic Link: Sales Order → Project Materials

         ↓

STEP 3: MATERIAL DISPATCH TO MANUFACTURING
├─ Location: Inventory Dashboard / Dispatch to Manufacturing
├─ Process:
│  ├─ Select Materials for Production Order
│  ├─ Create Dispatch/MRN (Material Request Note)
│  ├─ Add:
│  │  ├─ Materials (quantity)
│  │  ├─ Destination (Production/Manufacturing)
│  │  └─ Purpose (Production Order #)
│  │
│  ├─ Status Flow:
│  │  ├─ 'dispatched' (sent from warehouse)
│  │  ├─ 'received' (received by manufacturing)
│  │  ├─ 'verified' (verified by manufacturing)
│  │  └─ 'approved' (ready for production)
│  │
│  ├─ Database: Saved to material_dispatch_requests table
│  ├─ Inventory Update: Stock reduced immediately
│  └─ Backend: POST /api/inventory/dispatch
│
├─ Manufacturing Receives:
│  ├─ Location: Material Receipts Tab
│  ├─ View incoming materials
│  ├─ Verify quantities
│  ├─ Mark as received/verified
│  └─ Start using in production

         ↓

STEP 4: STOCK TRACKING & ALERTS
├─ Real-time Visibility:
│  ├─ Current Stock Level
│  ├─ Reorder Point
│  ├─ Safety Stock
│  └─ Last Updated Time
│
├─ Low Stock Alerts:
│  ├─ Automatic Notification
│  ├─ Alert when stock < reorder_point
│  ├─ Sent to Procurement Team
│  └─ Trigger Purchase Order Creation
│
├─ Stock History:
│  ├─ All movements tracked
│  ├─ Audit Trail maintained
│  ├─ Location: Stock History Report
│  └─ Shows: In, Out, Current, Date/Time

         ↓

STEP 5: BARCODE SCANNING
├─ Location: Inventory Dashboard / Barcode Scanner
├─ Features:
│  ├─ Scan Product Barcode
│  ├─ Auto-load Product Details
│  ├─ Quick Stock Update
│  ├─ Batch Operations (scan multiple)
│  └─ Mobile-friendly Interface
│
├─ Use Cases:
│  ├─ Receive stock verification
│  ├─ Dispatch to manufacturing
│  ├─ Stock count/audit
│  └─ Return processing

         ↓

STEP 6: LEFTOVER MATERIALS RETURN
├─ Trigger: After Production Completion
├─ Process:
│  ├─ Manufacturing completes production
│  ├─ Calculates leftover materials
│  ├─ Creates Return Challan
│  ├─ Materials returned to Inventory
│  ├─ Stock levels updated
│  └─ Inventory receives back
│
├─ Database: Inward challan + inventory update
└─ Cycle Complete: Materials ready for next project
```

---

### **PHASE 4: SHIPMENT & DELIVERY**

```
┌──────────────────────────────────────────────────────────────────┐
│           PHASE 4: SHIPMENT & DELIVERY TRACKING                   │
└──────────────────────────────────────────────────────────────────┘

STEP 1: PRODUCTION COMPLETION → SHIPMENT
├─ Trigger: Production Order status = 'completed'
├─ Location: Production Tracking Tab
├─ Link Established: shipment_id in production_orders
├─ Shipment Department Sees: "Incoming Orders" Tab
├─ Status: 'ready_for_shipment'

         ↓

STEP 2: CREATE SHIPMENT RECORD
├─ Location: Shipment Dashboard / Incoming Orders Tab
├─ Process:
│  ├─ Select Production Order(s)
│  ├─ Create Shipment Record
│  ├─ Add:
│  │  ├─ Shipment ID (auto-generated)
│  │  ├─ Product Details
│  │  ├─ Final Quantity
│  │  ├─ Packaging Details
│  │  ├─ Dispatch Address
│  │  └─ Special Handling Notes
│  │
│  ├─ Status Flow:
│  │  ├─ 'incoming' (ready to ship)
│  │  ├─ 'packed' (items packed)
│  │  ├─ 'dispatched' (left warehouse)
│  │  ├─ 'in_transit' (with courier)
│  │  ├─ 'delivered' (reached customer)
│  │  └─ 'cancelled' (shipment cancelled)
│  │
│  ├─ Database: Saved to shipments table
│  └─ Backend: POST /api/shipments

         ↓

STEP 3: ASSIGN COURIER PARTNER
├─ Location: Shipment Details / Courier Selection
├─ Courier Partners Available:
│  ├─ Example: DHL, FedEx, Local Courier
│  ├─ Add to database via Admin Panel
│  └─ Track by: courier_partner_id
│
├─ Process:
│  ├─ Select Courier Partner
│  ├─ Add Courier Agent (optional)
│  ├─ Add Tracking Number
│  ├─ Set Expected Delivery Date
│  └─ Backend: PUT /api/shipments/:id
│
├─ Courier Agent Assignment:
│  ├─ Assign to specific courier agent
│  ├─ Track agent contact details
│  ├─ Monitor agent performance
│  └─ Update: courier_agent_id field

         ↓

STEP 4: SHIPMENT DISPATCH
├─ Location: Shipment Dashboard / Active Shipments
├─ Process:
│  ├─ Update Status: 'packed' → 'dispatched'
│  ├─ Add:
│  │  ├─ Dispatch Date/Time
│  │  ├─ Dispatch Location
│  │  └─ Courier Receipt
│  │
│  ├─ Notification:
│  │  ├─ Customer: Shipment dispatched
│  │  ├─ Sales Team: Shipment confirmed
│  │  └─ Finance: Invoice generation
│  │
│  └─ Backend: PATCH /api/shipments/:id
│
├─ Production Order Updated:
│  └─ Status: 'completed' → 'shipped'

         ↓

STEP 5: IN-TRANSIT TRACKING
├─ Location: Shipment Dashboard / Active Shipments Tracking
├─ Real-time Updates:
│  ├─ Shipment Status: 'in_transit'
│  ├─ Current Location
│  ├─ Estimated Delivery
│  ├─ Courier Updates
│  └─ Delay Alerts (if any)
│
├─ Courier Integration:
│  ├─ Tracking Number → Courier API
│  ├─ Fetch Real-time Updates
│  ├─ Display to Customer
│  └─ Notify on status changes
│
├─ Database: Updates to shipments table
└─ Backend: GET /api/shipments/:id/tracking

         ↓

STEP 6: DELIVERY CONFIRMATION
├─ Location: Shipment Dashboard / Delivered Tab
├─ Process:
│  ├─ Courier confirms delivery
│  ├─ Update Status: 'in_transit' → 'delivered'
│  ├─ Add:
│  │  ├─ Delivery Date/Time
│  │  ├─ Recipient Name
│  │  ├─ Delivery Notes
│  │  └─ Proof of Delivery (signature/photo)
│  │
│  ├─ Notifications:
│  │  ├─ Customer: Order Delivered
│  │  ├─ Sales: Delivery confirmed
│  │  └─ Finance: Close invoice
│  │
│  └─ Backend: PATCH /api/shipments/:id
│
├─ Sales Order Updated:
│  └─ Status: 'in_production' → 'delivered'

         ↓

STEP 7: DELIVERY TRACKING HISTORY
├─ Location: Shipment Dashboard / Completed Shipments
├─ Visibility:
│  ├─ Delivery Confirmed: Read-only status
│  ├─ Cannot modify delivered shipments
│  ├─ Full Audit Trail available
│  ├─ Proof of Delivery viewable
│  └─ Comments & Notes preserved
│
└─ Archive: Shipments moved to history for reporting
```

---

### **PHASE 5: FINANCE & INVOICING**

```
┌──────────────────────────────────────────────────────────────────┐
│          PHASE 5: FINANCE, INVOICING & PAYMENTS                   │
└──────────────────────────────────────────────────────────────────┘

STEP 1: INVOICE GENERATION
├─ Trigger: Shipment dispatched OR Order completed
├─ Location: Finance Dashboard / Invoices Tab
├─ Process:
│  ├─ Create Invoice from Sales Order
│  ├─ Add:
│  │  ├─ Invoice Number (auto-generated)
│  │  ├─ Sale Details (items, quantity, price)
│  │  ├─ Customer Details
│  │  ├─ Subtotal, Tax, Discount
│  │  ├─ Final Amount
│  │  ├─ Payment Terms (due date)
│  │  └─ Notes & T&C
│  │
│  ├─ Status Flow:
│  │  ├─ 'draft' (preparing)
│  │  ├─ 'sent' (sent to customer)
│  │  ├─ 'paid' (payment received)
│  │  ├─ 'overdue' (payment delayed)
│  │  └─ 'cancelled' (invoice cancelled)
│  │
│  ├─ Database: Saved to invoices table
│  └─ Backend: POST /api/finance/invoices

         ↓

STEP 2: PAYMENT TRACKING
├─ Location: Finance Dashboard / Payments Tab
├─ Payment Methods:
│  ├─ Cash
│  ├─ Cheque
│  ├─ Bank Transfer
│  ├─ Credit Card
│  └─ Digital Payment
│
├─ Process:
│  ├─ Customer Makes Payment
│  ├─ Create Payment Record
│  ├─ Add:
│  │  ├─ Invoice Reference
│  │  ├─ Amount Paid
│  │  ├─ Payment Date
│  │  ├─ Payment Method
│  │  ├─ Cheque Number (if applicable)
│  │  ├─ Bank Details
│  │  └─ Reference Number
│  │
│  ├─ Status:
│  │  ├─ 'pending' (awaiting confirmation)
│  │  ├─ 'confirmed' (verified)
│  │  └─ 'reconciled' (matched with bank)
│  │
│  ├─ Database: Saved to payments table
│  └─ Backend: POST /api/finance/payments

         ↓

STEP 3: OUTSTANDING TRACKING
├─ Outstanding Receivables:
│  ├─ Invoices issued but not paid
│  ├─ Calculate: Total invoiced - Total paid
│  ├─ Show: Amount due, due date, days overdue
│  └─ Alert: If past due date
│
├─ Outstanding Payables:
│  ├─ Purchase orders not yet paid to vendor
│  ├─ Track vendor payments
│  ├─ Payment schedules
│  └─ Payment history

         ↓

STEP 4: FINANCIAL REPORTS
├─ Location: Finance Dashboard / Reports
├─ Report Types:
│  ├─ Revenue Report (sales summary)
│  ├─ Expense Report (cost summary)
│  ├─ Receivables Report (who owes us)
│  ├─ Payables Report (who we owe)
│  ├─ Cash Flow Report
│  ├─ Profit & Loss Statement
│  ├─ Invoice Aging Report
│  └─ Payment History
│
├─ Features:
│  ├─ Date Range Filtering
│  ├─ Department Wise Breakdown
│  ├─ Customer/Vendor Wise
│  ├─ Export to Excel/PDF
│  └─ Charts & Visualizations

         ↓

└─ CYCLE COMPLETE: Order fulfilled and paid
```

---

### **PHASE 6: CHALLANS (Material Movement Tracking)**

```
┌──────────────────────────────────────────────────────────────────┐
│       PHASE 6: CHALLANS - CENTRAL MATERIAL TRACKING                │
└──────────────────────────────────────────────────────────────────┘

STEP 1: CHALLAN TYPES
├─ Used for ALL material movements:
│  ├─ Outward: Sending materials (Inventory → Manufacturing)
│  ├─ Outward: Sending to Outsource Partner (Manufacturing → Vendor)
│  ├─ Inward: Receiving materials (Vendor → Manufacturing)
│  ├─ Inward: Returning materials (Manufacturing → Inventory)
│  └─ Transfer: Between locations

         ↓

STEP 2: CHALLAN CREATION
├─ Location: Challans Dashboard / Create New Challan
├─ Process:
│  ├─ Select Challan Type (Inward/Outward)
│  ├─ Add:
│  │  ├─ From Location
│  │  ├─ To Location
│  │  ├─ From Party (person/department)
│  │  ├─ To Party (person/department)
│  │  ├─ Items Moving:
│  │  │  ├─ Product/Material Name
│  │  │  ├─ Quantity
│  │  │  ├─ Unit
│  │  │  └─ Description
│  │  │
│  │  ├─ Transport Details (if applicable):
│  │  │  ├─ Vehicle Number
│  │  │  ├─ Driver Name
│  │  │  ├─ Expected Delivery Date
│  │  │  └─ Contact Info
│  │  │
│  │  └─ Notes/Special Instructions
│  │
│  ├─ Database: Saved to challans table
│  └─ Backend: POST /api/challans

         ↓

STEP 3: CHALLAN NUMBERING & BARCODE
├─ Auto-generated Challan Number:
│  ├─ Format: CHN-YYYYMMDD-XXXX
│  ├─ Example: CHN-20250115-0001
│  └─ Unique across system
│
├─ Barcode/QR Code:
│  ├─ Auto-generated for challan
│  ├─ Scannable format
│  ├─ Contains: Challan number + details
│  ├─ Print on physical challan
│  └─ Used for tracking

         ↓

STEP 4: CHALLAN VERIFICATION
├─ Receiving Department:
│  ├─ Scan Barcode
│  ├─ Verify Items Received
│  ├─ Add:
│  │  ├─ Received Date/Time
│  │  ├─ Actual Quantity
│  │  ├─ Received By (person)
│  │  ├─ Condition (OK/Damaged)
│  │  ├─ Discrepancies (if any)
│  │  └─ Remarks
│  │
│  ├─ Status:
│  │  ├─ 'issued' (sent)
│  │  ├─ 'received' (received)
│  │  ├─ 'verified' (quantity matched)
│  │  └─ 'approved' (ready to use)
│  │
│  └─ Backend: PUT /api/challans/:id

         ↓

STEP 5: CHALLAN TRACKING
├─ Location: Challans Dashboard / Register Tab
├─ View:
│  ├─ All Challans (Inward + Outward)
│  ├─ Filter by:
│  │  ├─ Challan Type
│  │  ├─ Status
│  │  ├─ Date Range
│  │  ├─ From/To Party
│  │  └─ Product
│  │
│  ├─ Columns:
│  │  ├─ Challan Number
│  │  ├─ Type (In/Out)
│  │  ├─ From → To
│  │  ├─ Items
│  │  ├─ Quantity
│  │  ├─ Status
│  │  ├─ Date
│  │  └─ Actions (View/Edit/Print)

         ↓

STEP 6: CHALLAN PRINTING & PDF
├─ Location: Challan Details / Print Button
├─ PDF Contains:
│  ├─ Challan Number
│  ├─ Barcode/QR Code
│  ├─ From/To Details
│  ├─ Items List with Quantity
│  ├─ Transport Details
│  ├─ Receiver Signature Line
│  ├─ Company Logo & Footer
│  └─ Terms & Conditions
│
├─ Backend: GET /api/challans/:id/pdf
└─ Output: Download PDF / Print directly
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION FLOW

```
┌──────────────────────────────────────────────────────────────────┐
│            AUTHENTICATION & ROLE-BASED ACCESS CONTROL              │
└──────────────────────────────────────────────────────────────────┘

STEP 1: USER LOGIN
├─ Location: Login Page (before dashboard)
├─ Input:
│  ├─ Email/Username
│  └─ Password
├─ Backend: POST /api/auth/login
├─ Process:
│  ├─ Verify credentials (bcrypt comparison)
│  ├─ Generate JWT Token
│  ├─ Return: Token + User Data
│  └─ Store in Browser (localStorage/sessionStorage)
└─ Default Credentials:
   ├─ Admin: admin@pashion.com / admin123
   ├─ Sales: sales@pashion.com / sales123
   └─ [More users per seeding]

         ↓

STEP 2: JWT TOKEN STORAGE
├─ Token Stored:
│  ├─ Browser LocalStorage
│  ├─ Authorization Header: "Bearer <token>"
│  └─ Expires: 24 hours (or as configured)
│
├─ Used For:
│  ├─ All API requests
│  ├─ User verification
│  └─ Session management

         ↓

STEP 3: REQUEST AUTHORIZATION
├─ Every API Call:
│  ├─ Extract Token from Header
│  ├─ Verify Token (authenticateToken middleware)
│  ├─ Decode User ID
│  ├─ Fetch User Permissions
│  └─ Allow/Deny Request
│
├─ Backend: middleware/auth.js
└─ Returns: 401 if unauthorized

         ↓

STEP 4: ROLE-BASED ACCESS CONTROL
├─ User Roles:
│  ├─ Super Admin (full access)
│  ├─ Sales Manager (sales operations)
│  ├─ Procurement Officer (purchase & vendor)
│  ├─ Production Supervisor (manufacturing)
│  ├─ Store Manager (school store)
│  ├─ Finance Manager (financial operations)
│  ├─ Quality Controller (QC operations)
│  └─ Inventory Manager (stock management)
│
├─ Permissions Per Role:
│  ├─ Database: roles table + permissions table
│  ├─ Many-to-many: role_permissions (role_id, permission_id)
│  ├─ Modules: admin, sales, procurement, manufacturing, etc.
│  └─ Actions: create, read, update, delete, approve
│
├─ Permission Check:
│  ├─ User → Role → Permissions
│  ├─ Verify if user has permission for action
│  ├─ Used in routes: authenticateToken middleware
│  └─ Returns: 403 if not authorized

         ↓

STEP 5: DEPARTMENT-SPECIFIC DASHBOARDS
├─ Frontend shows only allowed modules:
│  ├─ Super Admin: All modules
│  ├─ Sales Manager: Sales, Customers, Reports
│  ├─ Procurement Officer: Procurement, Vendors, GRN
│  ├─ Production Supervisor: Manufacturing, Orders, QC
│  ├─ Inventory Manager: Inventory, Stock, Dispatch
│  ├─ Shipment Manager: Shipments, Tracking, Delivery
│  ├─ Finance Manager: Finance, Invoices, Payments
│  └─ Quality Controller: Quality, QC Reports
│
└─ Backend enforces permissions on every endpoint
```

---

## 🔔 NOTIFICATION SYSTEM

```
┌──────────────────────────────────────────────────────────────────┐
│              REAL-TIME NOTIFICATION MANAGEMENT                     │
└──────────────────────────────────────────────────────────────────┘

NOTIFICATION TYPES:
├─ Sales Order Created → Procurement Department
├─ PO Sent → Vendor
├─ GRN Received → Inventory Team
├─ Low Stock Alert → Procurement Team
├─ Production Started → Manufacturing Team
├─ QC Issue → Quality Controller
├─ Shipment Dispatched → Customer
├─ Delivery Confirmation → Sales Team
├─ Payment Received → Finance Team
├─ Order Approved/Rejected → Concerned Department
└─ System Alerts → All Users (if important)

FLOW:
├─ Trigger: Action completes (e.g., PO created)
├─ Service: NotificationService creates record
├─ Database: Saved to notifications table
├─ Recipient: User/Department-wise delivery
├─ Display: Dashboard notification bell
├─ Status: 'unread' → 'read' → 'archived'
└─ Backend: GET /api/notifications
```

---

## 📊 DASHBOARD OVERVIEW

```
┌────────────────────────────────────────────────────────────────┐
│ SUPER ADMIN DASHBOARD (Full Access to All Operations)           │
├────────────────────────────────────────────────────────────────┤
│ ├─ Sales Dashboard: Total Orders, Revenue, Pipeline
│ ├─ Procurement Dashboard: POs, Vendors, GRN Status
│ ├─ Manufacturing Dashboard: Production Orders, Stages, QC
│ ├─ Inventory Dashboard: Stock Levels, Alerts, Movement
│ ├─ Shipment Dashboard: Active Shipments, Delivery Status
│ ├─ Finance Dashboard: Revenue, Payments, Receivables
│ ├─ Admin Dashboard: Users, Roles, Permissions, Config
│ ├─ Reports: All analytics & reports
│ └─ Notifications: All system notifications
└────────────────────────────────────────────────────────────────┘

Each dashboard shows:
├─ Key Statistics (KPIs)
├─ Recent Activities
├─ Pending Actions
├─ Alerts/Issues
├─ Charts & Analytics
└─ Quick Action Buttons
```

---

## 🔄 KEY DATA FLOW DIAGRAM

```
CUSTOMER                   SYSTEM                      BUSINESS
   │                          │                             │
   ├─ Place Order ────────────▶ Create Sales Order
   │                          │        ↓
   │                          ├─ Admin Approves (Optional)
   │                          │        ↓
   │                          ├─ Create Purchase Order
   │                          │        ↓
   │                    VENDOR ├─ Send to Vendor ──────────▶
   │                          │◀────── Confirm PO ─────────┤
   │                          │        ↓
   │                          ├─ Goods Receipt (GRN)
   │                          │        ↓
   │                    MANUFACTURER
   │                          ├─ Update Inventory
   │                          │        ↓
   │                          ├─ Create Production Order
   │                          │        ↓
   │                          ├─ Dispatch Materials (MRN)
   │                          │        ↓
   │                          ├─ Stage-wise Production
   │                          │    (Cutting → Embroidery → etc.)
   │                          │        ↓
   │                          ├─ Quality Control Check
   │                          │        ↓
   │                    WAREHOUSE
   │                          ├─ Create Shipment
   │                          │        ↓
   │                    COURIER ├─ Assign Courier
   │                          │        ↓
   ├─ Track Order ◀──────────┤─ Real-time Tracking
   │                          │        ↓
   ├─ Receive Order ◀─────────┤─ Delivery Confirmation
   │                          │        ↓
   │                    FINANCE
   │                          ├─ Generate Invoice
   │                          │        ↓
   ├─ Make Payment ───────────▶ Record Payment
   │                          │        ↓
   │                          └─ Order Complete
```

---

## 📁 DATA MODEL (Key Tables)

```
CORE ENTITIES:
├─ users (accounts, authentication)
├─ roles (job roles in system)
├─ permissions (access rights)
├─ user_roles (many-to-many: users ↔ roles)
├─ role_permissions (many-to-many: roles ↔ permissions)
│
SALES:
├─ customers (customer information)
├─ sales_orders (customer orders)
│
PROCUREMENT:
├─ vendors (supplier information)
├─ purchase_orders (vendor orders)
├─ goods_receipt_notes (GRN records)
│
INVENTORY:
├─ inventory (stock records)
├─ store_stocks (school store inventory)
│
PRODUCTION:
├─ production_orders (manufacturing orders)
├─ production_stages (stage tracking)
├─ production_stage_operations (detailed stage data)
├─ quality_checks (QC records)
│
LOGISTICS:
├─ challans (material movement tracking)
├─ shipments (order shipments)
├─ courier_partners (delivery partners)
├─ courier_agents (individual drivers/agents)
│
FINANCE:
├─ invoices (billing records)
├─ payments (payment records)
│
OTHER:
├─ approvals (approval workflows)
├─ notifications (system notifications)
├─ attendance (employee attendance)
└─ samples (product samples)
```

---

## 🚀 HOW TO USE THE SYSTEM (Quick Start)

### For Sales Manager:

1. ✅ Create Sales Order (Sales Dashboard → Create Order)
2. ✅ View Pipeline (Sales Dashboard → Pipeline Tab)
3. ✅ Track Orders (Production → Manufacturing Dashboard)
4. ✅ View Shipment Status (Shipment Dashboard → Incoming)
5. ✅ Generate Reports (Reports → Sales Analytics)

### For Procurement Officer:

1. ✅ Create Purchase Order (Procurement → New PO)
2. ✅ Manage Vendors (Procurement → Vendors)
3. ✅ Receive Goods (Procurement → GRN)
4. ✅ Review Invoices (Finance → Invoices)
5. ✅ Track Vendor Performance (Reports)

### For Manufacturing Manager:

1. ✅ View Production Orders (Manufacturing → Incoming)
2. ✅ Create Production Order (Manufacturing → Create Order)
3. ✅ Update Stages (Production Tracking → Operations View)
4. ✅ Manage Outsourcing (Manufacturing → Outsource Management)
5. ✅ Quality Control (Manufacturing → Quality Tab)

### For Shipment Manager:

1. ✅ View Incoming Orders (Shipment → Incoming Orders)
2. ✅ Create Shipment (Shipment → Create)
3. ✅ Assign Courier (Shipment → Select Courier)
4. ✅ Track Active Shipments (Shipment → Active)
5. ✅ Confirm Delivery (Shipment → Mark Delivered)

### For Finance Manager:

1. ✅ Generate Invoice (Finance → Create Invoice)
2. ✅ Record Payment (Finance → Payments)
3. ✅ View Outstanding (Finance → Receivables/Payables)
4. ✅ Generate Reports (Finance → Reports)
5. ✅ Cash Flow Analysis (Finance → Analytics)

### For Super Admin:

1. ✅ Manage Users (Admin → Users)
2. ✅ Set Roles & Permissions (Admin → Roles)
3. ✅ Approve Orders (Admin → Pending Approvals)
4. ✅ System Configuration (Admin → Settings)
5. ✅ View All Analytics (Reports → Full System Report)

---

## ✨ KEY FEATURES IMPLEMENTED (As of Jan 2025)

✅ Complete Sales Order → Production → Shipment workflow
✅ Production Order with project-based tracking (project_reference field)
✅ Shipment-production linkage (shipment_id foreign key)
✅ Material dispatch with MRN (Material Request Notes)
✅ Stock receipt and verification workflow
✅ Outsourcing management with inward/outward challans
✅ Production operations with stage tracking and material reconciliation
✅ Real-time shipment tracking with courier integration
✅ Invoice generation and payment tracking
✅ Role-based access control with granular permissions
✅ Barcode/QR code generation for challans and inventory
✅ Low stock alerts and reorder management
✅ Quality control checkpoints throughout production
✅ Comprehensive reporting and analytics
✅ Multi-location store management
✅ Attendance management system
✅ Real-time notifications

---

## 🎯 WORKFLOW SUMMARY (One Sentence Each)

| Module            | Workflow                                                                    |
| ----------------- | --------------------------------------------------------------------------- |
| **Sales**         | Customer places order → Sales creates Sales Order → Status tracked          |
| **Procurement**   | Create PO → Send to Vendor → Receive Goods (GRN) → Update Stock             |
| **Manufacturing** | Create Production Order → Execute Stages → Material Dispatch → QC Check     |
| **Outsourcing**   | Send materials to vendor (Outward Challan) → Receive back (Inward Challan)  |
| **Inventory**     | Receive stock → Track levels → Dispatch to Manufacturing → Return leftovers |
| **Shipment**      | Production Complete → Create Shipment → Assign Courier → Track → Deliver    |
| **Finance**       | Create Invoice → Customer Pays → Record Payment → Reconcile                 |
| **Admin**         | Manage Users → Assign Roles → Set Permissions → System Config               |

---

**This comprehensive system automates the complete clothing manufacturing workflow from order to delivery, with real-time tracking, quality control, and financial management integrated at every step.**
