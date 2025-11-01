# Passion Clothing ERP System - Comprehensive Project Analysis

## 📋 Executive Summary

**Passion Clothing** is a comprehensive **Enterprise Resource Planning (ERP) System** designed for clothing manufacturing, procurement, and distribution. It manages the complete lifecycle from sales orders through manufacturing to shipment, with integrated inventory, quality control, and financial tracking.

---

## 🏗️ Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React 18 + MUI 5)         │
│  (Client-side UI, State Management, Routing)│
└──────────────────┬──────────────────────────┘
                   │ (HTTP/REST via Axios)
                   ▼
┌─────────────────────────────────────────────┐
│      API Gateway / Express Server           │
│   (Routes, Middleware, Authentication)      │
└──────────────────┬──────────────────────────┘
                   │ (Sequelize ORM)
                   ▼
┌─────────────────────────────────────────────┐
│    MySQL Database (passion_erp)             │
│  (Data persistence, Relationships)          │
└─────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### Frontend (Client)

- **Framework**: React 18
- **UI Library**: Material-UI (MUI) v5
- **Routing**: React Router v6
- **State Management**: React Context + React Query
- **HTTP Client**: Axios (configured at `client/src/utils/api.js`)
- **Development Proxy**: http://localhost:5000

### Backend (Server)

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize (MySQL)
- **Database**: MySQL 8.0
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Morgan
- **File Handling**: Express static file serving

### Environment

- **Database Connection**:
  - Host: localhost:3306
  - Database: passion_erp
  - User: root
  - Password: root (configured via `.env`)

---

## 📊 Data Model Architecture

### Core Entity Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER MANAGEMENT                             │
├─────────────────┬──────────────────┬──────────────────┐         │
│  User           │  Role            │  Permission      │         │
│  ├─ id          │  ├─ id           │  ├─ id           │         │
│  ├─ name        │  ├─ name         │  ├─ module       │         │
│  ├─ email       │  ├─ department   │  ├─ resource     │         │
│  ├─ department  │  ├─ level        │  └─ action       │         │
│  └─ roles (M:M) │  └─ permissions  │                  │         │
└─────────────────┴──────────────────┴──────────────────┘         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            SALES ORDER WORKFLOW                           │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Customer                                                  │  │
│  │   ↓                                                       │  │
│  │ SalesOrder                                                │  │
│  │   ├─ order_number, total_quantity, final_amount         │  │
│  │   ├─ items (JSON): product details, quantities          │  │
│  │   ├─ garment_specifications: color, fabric_type         │  │
│  │   ├─ status: pending → approved → procurement_created   │  │
│  │   └─ linkedPurchaseOrder (if PO created)               │  │
│  │   ↓                                                       │  │
│  │ ProductionRequest                                         │  │
│  │   ├─ Duplicate prevention (unique per SO)              │  │
│  │   └─ Marks production readiness                          │  │
│  │   ↓                                                       │  │
│  │ PurchaseOrder (Procurement)                              │  │
│  │   ├─ po_number, vendor_id                               │  │
│  │   ├─ items: material requirements, quantities            │  │
│  │   ├─ status: pending → sent → received → invoiced       │  │
│  │   └─ approval_status: pending_approval → approved        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         MANUFACTURING WORKFLOW                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ ProductionOrder                                           │  │
│  │   ├─ production_order_number                             │  │
│  │   ├─ project_reference: links multiple MRNs            │  │
│  │   ├─ shipment_id: direct link to Shipment              │  │
│  │   ├─ stages: Cut → Sew → Print → Wash → Pack           │  │
│  │   ├─ status: in_production → ready_for_shipment        │  │
│  │   └─ production_approval_id: traceability link          │  │
│  │   ↓                                                       │  │
│  │ ProductionStage (per order)                              │  │
│  │   ├─ stage_name, sequence, status                        │  │
│  │   ├─ quantities: processed, approved, rejected          │  │
│  │   ├─ work_type: in_house or outsourced                  │  │
│  │   └─ date/time tracking                                 │  │
│  │   ↓                                                       │  │
│  │ StageOperation (outsourcing tracking)                    │  │
│  │   ├─ Outward Challan: materials to vendor              │  │
│  │   ├─ Inward Challan: completed work back               │  │
│  │   └─ Material Reconciliation: usage & leftovers        │  │
│  │   ↓                                                       │  │
│  │ QualityCheckpoint & Rejection                            │  │
│  │   ├─ Quality tracking per stage                          │  │
│  │   └─ Rejection management                                │  │
│  │   ↓                                                       │  │
│  │ ProductionCompletion                                      │  │
│  │   └─ Marks order ready for shipment                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         SHIPMENT & LOGISTICS WORKFLOW                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Shipment                                                  │  │
│  │   ├─ shipment_number                                      │  │
│  │   ├─ linkedProductionOrders (1:M via shipment_id)       │  │
│  │   ├─ status: incoming → shipped → delivered              │  │
│  │   └─ courier_agent_id: track delivery agent             │  │
│  │   ↓                                                       │  │
│  │ ShipmentTracking                                          │  │
│  │   ├─ GPS coordinates, timestamps                         │  │
│  │   └─ Real-time tracking updates                          │  │
│  │   ↓                                                       │  │
│  │ CourierAgent                                              │  │
│  │   ├─ agent_name, employee_id, vehicle_id               │  │
│  │   └─ Delivery person assignment                          │  │
│  │   ↓                                                       │  │
│  │ Invoice & Payment                                         │  │
│  │   ├─ Invoice linked to SalesOrder                       │  │
│  │   └─ Payment tracking                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          INVENTORY & MATERIALS MANAGEMENT                │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Inventory (Unified Products + Materials)                 │  │
│  │   ├─ item_code, name, category, material, description   │  │
│  │   ├─ quantity: available, allocated, used               │  │
│  │   ├─ barcode: auto-generated for tracking               │  │
│  │   ├─ BillOfMaterials: links to products                 │  │
│  │   ├─ project_stock: per-project tracking                │  │
│  │   └─ InventoryMovement: complete audit trail            │  │
│  │   ↓                                                       │  │
│  │ MaterialRequirement (MRN)                                 │  │
│  │   ├─ materials needed for production                      │  │
│  │   ├─ project_reference grouping                          │  │
│  │   ├─ status: pending → approved → dispatched            │  │
│  │   └─ Rejection handling (auto-match, manual entry)      │  │
│  │   ↓                                                       │  │
│  │ MaterialAllocation                                        │  │
│  │   ├─ Links inventory to production                       │  │
│  │   ├─ Tracks allocation quantities                        │  │
│  │   └─ Supports on-demand allocation                       │  │
│  │   ↓                                                       │  │
│  │ MaterialDispatch                                          │  │
│  │   ├─ Sends materials to manufacturing                     │  │
│  │   └─ Deducts from main inventory                          │  │
│  │   ↓                                                       │  │
│  │ MaterialReceipt & Verification                            │  │
│  │   ├─ Manufacturing receives materials                     │  │
│  │   ├─ Verification checks quality & quantity             │  │
│  │   └─ ProductionApproval gate                             │  │
│  │   ↓                                                       │  │
│  │ MaterialConsumption & Reconciliation                      │  │
│  │   ├─ Tracks actual usage per stage                       │  │
│  │   └─ Returns leftover materials to inventory             │  │
│  │   ↓                                                       │  │
│  │ VendorReturn (Outsourced materials)                       │  │
│  │   └─ Returns from vendor to inventory                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SUPPORT ENTITIES                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Challan: Material transfer documents                      │  │
│  │ Vendor: Supplier information & performance               │  │
│  │ Sample: Product samples & quality control                │  │
│  │ GoodsReceiptNote (GRN): Receiving documentation          │  │
│  │ Approval: Workflow approval tracking                     │  │
│  │ Notification: User communications                        │  │
│  │ Attendance: Employee tracking                            │  │
│  │ StoreStock: Store inventory separate from manufacturing  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Main Workflow Processes

### 1️⃣ COMPLETE ORDER TO SHIPMENT WORKFLOW

```
CUSTOMER PLACES ORDER
    ↓
SALES DEPARTMENT
    ├─ Create Sales Order (SO)
    │  └─ Items: products, quantities
    │  └─ Specifications: color, fabric, design
    ├─ Sales Order Approval
    └─ Status: pending → approved → procurement_created
    ↓
PROCUREMENT DEPARTMENT
    ├─ Create Material Requirements (MRN)
    │  └─ Match materials from inventory
    │  └─ Handle rejections (auto-match or manual entry)
    ├─ Create Purchase Order (PO) from Sales Order
    │  └─ PO links to SalesOrder via linked_sales_order_id
    ├─ PO Approval (Admin approval workflow)
    │  └─ Status: pending_approval → sent → received
    ├─ Goods Receipt (GRN)
    │  └─ Receive materials from vendor
    └─ Invoice & Payment tracking
    ↓
INVENTORY DEPARTMENT
    ├─ Stock materials received
    ├─ Allocate materials to production projects
    │  └─ Project-based stock tracking
    ├─ Generate automatic barcodes
    │  └─ Track materials via barcode scanning
    ├─ Monitor stock levels & alerts
    └─ Maintain complete inventory movement audit trail
    ↓
MANUFACTURING DEPARTMENT
    ├─ Receive Production Request (from approved PO/SO)
    │  └─ Duplicate prevention: one request per SO
    ├─ Create Material Dispatch Request (MDR)
    │  └─ Send materials from inventory → manufacturing
    ├─ Receive Materials in Manufacturing
    │  └─ Material Receipt & Verification → Approval gate
    ├─ Production Order Creation Wizard
    │  └─ Auto-load: sales order, materials, specifications
    │  └─ Supports product_name when product_id unavailable
    │  └─ Create Production Approval for traceability
    ├─ Production Operations (Stage-by-Stage)
    │  ├─ 8 Stages: Cut → Sew → Print → Wash → Pack → Ready → QC → Dispatch
    │  ├─ Per-stage workflow:
    │  │  ├─ Status: pending → in_progress → completed
    │  │  ├─ Quantities: processed, approved, rejected
    │  │  ├─ Date/time tracking
    │  │  └─ Notes & documentation
    │  └─ Outsourcing integration (embroidery, printing):
    │     ├─ Work type selector: In-House vs Outsourced
    │     ├─ Create Outward Challan (send to vendor)
    │     ├─ Track with vendor (StageOperation)
    │     ├─ Create Inward Challan (receive completed work)
    │     └─ Material Reconciliation (usage + leftovers)
    ├─ Quality Checkpoints
    │  ├─ Track quality metrics per stage
    │  ├─ Handle rejections
    │  └─ Quality score calculation
    ├─ Production Completion
    │  └─ Mark order ready for shipment
    │  └─ Update SalesOrder status to in_production
    └─ Status: in_production → ready_for_shipment
    ↓
SHIPMENT DEPARTMENT
    ├─ Incoming Orders View
    │  └─ Displays all ready orders via ProductionOrder.shipment_id
    ├─ Create Shipment record
    │  └─ Links to ProductionOrders (1:M relationship)
    ├─ Assign Courier Agent
    │  └─ Select delivery person with vehicle
    ├─ Active Shipments Tracking
    │  ├─ Real-time GPS tracking
    │  ├─ Status updates: shipped → in_transit → delivered
    │  └─ Delivery confirmation
    ├─ Shipment Tracking Dashboard
    │  └─ Track locations, ETAs, delivery status
    └─ Status: incoming → shipped → delivered
    ↓
CUSTOMER RECEIVES ORDER
    └─ Complete workflow cycle
```

### 2️⃣ OUTSOURCING WORKFLOW (Embroidery, Printing, etc.)

```
PRODUCTION STAGE REQUIRES OUTSOURCING
    ↓
SELECT WORK TYPE: "OUTSOURCED"
    ↓
CREATE OUTWARD CHALLAN
    ├─ Select vendor from approved list
    ├─ Select materials to send
    ├─ Add transport details (vehicle, driver)
    └─ Generate challan document
    ↓
VENDOR RECEIVES MATERIALS
    └─ Updates status (tracked manually or via notification)
    ↓
VENDOR COMPLETES WORK
    ↓
CREATE INWARD CHALLAN
    ├─ Receive completed items from vendor
    ├─ Add quality notes
    ├─ Verify quantities
    └─ Generate return challan document
    ↓
MATERIALS RECONCILIATION
    ├─ Calculate actual material usage
    ├─ Track leftover materials
    ├─ Return leftovers to inventory
    └─ Record consumption metrics
    ↓
STAGE COMPLETION
    └─ Continue to next production stage
```

### 3️⃣ APPROVAL WORKFLOW (Admin Dashboard)

```
PENDING APPROVAL REQUEST
    ├─ Purchase Orders (pending_approval status)
    ├─ Sales Orders (if flagged for approval)
    └─ Custom Approval records (generic approval entity)
    ↓
ADMIN REVIEWS
    ├─ View complete details: vendor, items, amounts
    ├─ See PO items with specifications
    ├─ Calculate total values
    └─ Add decision notes
    ↓
ADMIN ACTION
    ├─ APPROVE
    │  ├─ PO status: pending_approval → sent
    │  ├─ Notifications sent to departments
    │  └─ Approval record marked: approved
    │
    └─ REJECT
       ├─ PO status: remains pending_approval
       ├─ Return to creator with notes
       └─ Approval record marked: rejected
    ↓
AUTOMATED NOTIFICATIONS
    └─ Department-specific alerts
```

### 4️⃣ INVENTORY ALLOCATION & TRACKING

```
MATERIALS AVAILABLE IN INVENTORY
    ↓
PROJECT REQUEST: "Need materials for SO-001"
    ↓
ALLOCATE MATERIALS
    ├─ From general stock (Factory Stock tab)
    ├─ Or from project stock (Project Stock tab)
    └─ Create MaterialAllocation record
    ↓
MATERIAL DISPATCH
    ├─ Create MaterialDispatch request
    ├─ Link to production order
    ├─ Deduct from main inventory
    └─ Update project stock
    ↓
MANUFACTURING RECEIPT
    ├─ Material arrives at manufacturing
    ├─ MaterialReceipt created
    ├─ Verification check (quantity, quality)
    ├─ ProductionApproval (gate before production starts)
    └─ Status: dispatch → receipt → verification → approved
    ↓
MATERIAL CONSUMPTION
    ├─ Track usage per production stage
    ├─ MaterialConsumption records per stage
    └─ Calculate waste/scrap
    ↓
RECONCILIATION
    ├─ Final usage check
    ├─ Leftover materials identified
    ├─ Return leftovers to inventory
    └─ Complete audit trail recorded
```

---

## 📚 Core Modules & Features

### 📊 SALES MANAGEMENT

- **Sales Orders**: Create, view, approve orders
- **Customer Management**: Track customer details, order history
- **Status Tracking**: pending → approved → procurement_created → in_production → ready → shipped
- **Color & Fabric Fields**: Capture garment specifications
- **Order Details View**: Quick access to order information

### 🛒 PROCUREMENT

- **Purchase Orders**: Create from Sales Orders with item matching
- **Vendor Management**: Supplier profiles, performance metrics
- **PO Approval Workflow**: Admin approval gate
- **Material Requirements (MRN)**: Automatic or manual material matching
- **GRN (Goods Receipt Notes)**: Track incoming materials
- **Payment Tracking**: Invoice and payment status

### 📦 INVENTORY

- **Unified Inventory**: Products + Materials merged into single system
- **Stock Tracking**:
  - Factory Stock: Main warehouse
  - Project Stock: Per-project allocation
  - All Stock: Complete overview
- **Barcode System**: Auto-generated barcodes, scanner support
- **Stock Alerts**: Low stock warnings
- **Movement History**: Complete audit trail of all transactions
- **Material Allocation**: On-demand allocation to projects

### 🏭 MANUFACTURING

- **Production Orders**: Create with wizard, auto-populate from sales orders
- **Stage Management**: 8 production stages (Cut, Sew, Print, Wash, Pack, Ready, QC, Dispatch)
- **Stage Operations**: Track work type (in-house vs outsourced)
- **Material Reconciliation**: Track usage and leftovers per stage
- **Quality Checkpoints**: Quality metrics per stage
- **Outsourcing Integration**:
  - Outward/Inward Challans for vendor work
  - Material flow tracking
  - Quality notes and verification
- **Material Receipt Workflow**: Dispatch → Receipt → Verification → Approval

### 🚚 SHIPMENT & LOGISTICS

- **Shipment Management**: Create shipments from ready production orders
- **Incoming Orders**: View orders ready for shipment (via shipment_id)
- **Courier Agent Assignment**: Track delivery personnel
- **Real-time Tracking**: GPS tracking and status updates
- **Active Shipments Dashboard**: Monitor all active deliveries
- **Delivery Status**: Track shipment status (shipped → in_transit → delivered)
- **Delivery Confirmation**: Mark orders as delivered

### 💰 FINANCE

- **Invoice Management**: Generate invoices from shipments
- **Payment Tracking**: Record payments received
- **Financial Reports**: Revenue tracking, payment status

### 📋 CHALLANS

- **Material Transfer Documents**: Outward/inward challans
- **Vendor Challans**: For outsourcing workflows
- **Digital Challan Generation**: With printing support
- **Challan Registry**: Track all material transfers

### 👥 USER & ROLE MANAGEMENT

- **Multi-role Support**: Users can have multiple roles
- **Role-based Access Control (RBAC)**: Permissions per role
- **Department Assignment**: Sales, Procurement, Manufacturing, Shipment, Finance, etc.
- **Hierarchy Levels**: Role hierarchy for approval workflows
- **Permission Matrix**: Module, Resource, Action-based permissions

### 📊 DASHBOARDS

- **Sales Dashboard**: Order status, revenue tracking
- **Procurement Dashboard**: PO status, vendor performance
- **Manufacturing Dashboard**: Production status, stage tracking
- **Shipment Dashboard**: Active shipments, delivery tracking
- **Outsourcing Dashboard**: Vendor management, outsource orders
- **Inventory Dashboard**: Stock levels, movement history
- **Admin Dashboard**: Pending approvals, user management, role configuration

---

## 🔐 Authentication & Security

### JWT Authentication

- **Token Generation**: On login (auth routes)
- **Token Validation**: `authenticateToken` middleware on all protected routes
- **Token Storage**: Client-side (localStorage via AuthContext)
- **Token Refresh**: Handled via axios interceptor

### Authorization

- **Role-Based Access Control (RBAC)**:
  - Check user roles from `user_roles` junction table
  - Match against required permissions
- **Department-Level Permissions**: Users see only relevant modules
- **Route Protection**: Client-side and server-side checks

### Security Features

- **Helmet.js**: HTTP security headers
- **CORS**: Cross-origin request validation
- **Rate Limiting**: 1000 requests per 15 minutes
- **Morgan**: Request logging
- **Input Validation**: Server-side validation on all endpoints

---

## 🌐 API Routes Structure

```
/api/auth                  → Authentication (login, register, token refresh)
/api/users                 → User management (CRUD, profile)
/api/roles                 → Role management, permissions
/api/challans              → Material transfer documents
/api/sales                 → Sales orders and customer orders
/api/procurement           → Purchase orders, vendor management
/api/inventory             → Inventory items, stock tracking
/api/inventory-enhanced    → Advanced inventory (allocation, barcodes)
/api/manufacturing         → Production orders, stages, outsourcing
/api/outsourcing           → Outsource orders, vendor performance
/api/shipments             → Shipment creation, tracking
/api/courier-partners      → Courier company management
/api/courier-agent         → Courier agent assignment and tracking
/api/store                 → Store stock management
/api/finance               → Invoices, payments
/api/reports               → Business reports and analytics
/api/admin                 → Admin functions (roles, permissions, approvals)
/api/samples               → Product samples
/api/products              → Product lifecycle management
/api/bom                   → Bill of Materials
/api/grn                   → Goods Receipt Notes
/api/notifications         → User notifications
/api/vendor-returns        → Vendor return management
/api/project-material      → Project material requests
/api/production-requests   → Production request tracking
/api/material-dispatch     → Material dispatch to manufacturing
/api/material-receipt      → Material receipt tracking
/api/material-verification → Material verification
/api/production-approval   → Production approval gates
/api/orders                → Generic orders endpoint
```

---

## 🔄 Recent Enhancements (Jan 2025)

### ⭐ Production-to-Shipment Handoff

- Added `shipment_id` column to ProductionOrder
- Direct FK link from production orders to shipment
- Optimized incoming orders endpoint
- Fixed workflow break where completed orders weren't appearing

### ⭐ Production Order Flow Restructure

- Fixed missing POST /manufacturing/orders endpoint
- Added project_reference field for order grouping
- Multiple MRN support per project (on-demand)
- Complete transaction support with stages

### ⭐ Production Operations Simplified

- Removed complex substages
- Work type selector: In-House vs Outsourced
- Outward/Inward challan creation
- Material reconciliation with inventory returns

### ⭐ Outsourcing Dashboard Complete

- 4 stat cards with metrics
- Recent outsource orders section
- Top performing vendors showcase
- 6 quick action buttons
- Full orders table and vendor directory
- Quality control dashboard

### ⭐ Material Receipt Workflow

- New "Material Receipts" tab in Manufacturing
- 3-stage workflow: Dispatch → Receipt → Verification → Approval
- Color-coded badges for tracking
- Direct navigation to all receipt stages

### ⭐ Production Approval to Order Flow

- Auto-redirect from material approval to wizard
- Auto-load data from Sales Order, PO, Inventory
- Form pre-filling of all relevant data
- Approval marked as "production started" automatically

### ⭐ MRN Rejection Fix

- Enhanced inventory search by category, material, description
- Product relationship now optional
- Generic terms now match properly
- Multi-field search coverage

### ⭐ Sales Order Color & Fabric Fields

- Capture fabric type and color
- Flow through all systems: Sales → Procurement → Manufacturing
- Display with color swatch indicators

### ⭐ Inventory-Product Merge

- Unified Products into Inventory system
- Project-based stock tracking
- Auto-generated barcodes
- Tab-based UI: All Stock | Factory Stock | Project Stock

### ⭐ UI/UX Improvements

- Challan creation success screens with download/print
- Procurement dashboard enhanced order displays
- Sales orders table with quick-access view icon
- Purchase orders comprehensive list view

---

## 📈 Key Performance Indicators (KPIs)

### Sales Department

- Orders created & approved
- Total revenue
- Average order value
- On-time delivery %

### Procurement

- Purchase orders created
- Vendor performance scores
- Material receipt accuracy
- Invoice settlement time

### Manufacturing

- Production completion rate
- Quality score (% passed QC)
- Average production time per stage
- Outsourcing efficiency

### Shipment

- Shipments created
- Delivery success rate
- Average delivery time
- Courier agent performance

### Inventory

- Stock levels per item
- Material utilization rate
- Waste/scrap percentage
- Movement frequency

---

## 🛠️ Development Workflow

### Environment Setup

```bash
# Backend
npm install (in server/)
NODE_ENV=development npm start

# Frontend
npm install (in client/)
npm start
```

### Database

- MySQL running on localhost:3306
- Database: passion_erp
- Sequelize migrations for schema management
- Seed scripts for test data

### State Management

- Client: React Context + React Query
- API calls through axios instance at `client/src/utils/api.js`
- Error handling with fallback notifications

---

## 📝 Project File Structure

```
passion-clothing/
├── server/                     # Backend Express app
│   ├── config/
│   │   ├── database.js        # Sequelize models & associations
│   │   └── ...
│   ├── models/                 # 40+ Sequelize models
│   ├── routes/                 # 25+ API route files
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── utils/
│   │   ├── notificationService.js
│   │   └── ...
│   ├── index.js               # Express app entry
│   └── ...
├── client/                     # React frontend
│   ├── src/
│   │   ├── pages/             # Page components per module
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # AuthContext
│   │   ├── utils/
│   │   │   └── api.js         # Axios client
│   │   ├── App.js             # Main app routes
│   │   └── index.js
│   └── ...
├── .zencoder/
│   └── rules/repo.md          # Repository documentation
├── [Documentation files]      # Comprehensive project docs
└── [SQL scripts]              # Migration & setup scripts
```

---

## 🎯 Key Architectural Decisions

1. **Unified Inventory**: Products and materials merged for efficiency
2. **Project-based Allocation**: Track stock per sales order/project
3. **Outsourcing Integration**: Embedded into production stages
4. **Material Reconciliation**: Track usage and returns per stage
5. **Multiple MRNs per Project**: Support for multiple material batches
6. **Direct Shipment Linking**: ProductionOrder.shipment_id for fast lookups
7. **Approval Workflow**: Generic Approval entity for extensible workflows
8. **Audit Trails**: Complete tracking of all entity movements
9. **Real-time Notifications**: Event-driven updates across departments
10. **Role-based UI**: Different features based on user department/role

---

## ✅ System Health Checks

- Database connection: MySQL 8.0 at localhost:3306
- Express server: Port 5000
- Frontend dev server: Port 3000
- JWT middleware: Protecting all API routes
- Rate limiting: Active (1000/15min)
- CORS: Enabled for localhost:3000
- File uploads: `/uploads` static directory
- Logging: Morgan request logging active

---

## 🚀 Deployment Readiness

**Current Status**: Development ready

- ✅ Complete ERP workflows implemented
- ✅ Multi-module integration
- ✅ Authentication & authorization
- ✅ Database relationships established
- ✅ API endpoints fully functional
- ⚠️ Production database configuration needed
- ⚠️ SSL/TLS certificates for HTTPS
- ⚠️ Environment variables configuration
- ⚠️ Backup & disaster recovery plan

---

## 📖 Documentation Index

See root directory for detailed documentation on:

- `PROJECT_COMPREHENSIVE_ANALYSIS.md` (this file)
- `.zencoder/rules/repo.md` (structured overview)
- Individual feature documentation files
- SQL migration scripts
- API reference guides

---

**Last Updated**: January 2025
**Project Status**: Active Development
**Team**: Full Stack Development
