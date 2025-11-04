import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage.jsx";
import DashboardLayout from "./components/layout/DashboardLayout";

// Department Dashboards
import SalesDashboard from "./pages/dashboards/SalesDashboard";
import ProcurementDashboard from "./pages/dashboards/ProcurementDashboard";
import ChallanDashboard from "./pages/dashboards/ChallanDashboard";
// import InventoryDashboard from './pages/dashboards/InventoryDashboard'; // Old dashboard
import EnhancedInventoryDashboard from "./pages/inventory/EnhancedInventoryDashboard"; // New unified dashboard
import ProjectAllocationDashboard from "./pages/inventory/ProjectAllocationDashboard"; // Material allocation view
import ManufacturingDashboard from "./pages/dashboards/ManufacturingDashboard";
import OutsourcingDashboard from "./pages/dashboards/OutsourcingDashboard";
import SamplesDashboard from "./pages/dashboards/SamplesDashboard";
import ShipmentDashboard from "./pages/dashboards/ShipmentDashboard";
import ShipmentDispatchPage from "./pages/shipment/ShipmentDispatchPage";
import ShipmentTrackingPage from "./pages/shipment/ShipmentTrackingPage";
import ShipmentReportsPage from "./pages/shipment/ShipmentReportsPage";
import CreateShipmentPage from "./pages/shipment/CreateShipmentPage";
import ShippingDashboardPage from "./pages/shipment/ShippingDashboardPage";
import CourierAgentLoginPage from "./pages/shipment/CourierAgentLoginPage";
import CourierAgentManagementPage from "./pages/admin/CourierAgentManagementPage";
import StoreDashboard from "./pages/dashboards/StoreDashboard";
import FinanceDashboard from "./pages/dashboards/FinanceDashboard";
import FinanceInvoicesPage from "./pages/finance/FinanceInvoicesPage";
import FinancePaymentsPage from "./pages/finance/FinancePaymentsPage";
import FinanceReportsPage from "./pages/finance/FinanceReportsPage";
import AdminDashboard from "./pages/dashboards/AdminDashboard";

// Samples Pages
import SamplesOrdersPage from "./pages/samples/SamplesOrdersPage";
import SamplesTrackingPage from "./pages/samples/SamplesTrackingPage";
import SamplesReportsPage from "./pages/samples/SamplesReportsPage";
import SamplesConversionPage from "./pages/samples/SamplesConversionPage";
import SamplesCreateRequestPage from "./pages/samples/SamplesCreateRequestPage";

// Common Pages
import ProfilePage from "./pages/ProfilePage";
import AttendancePage from "./pages/AttendancePage";
import NotificationsPage from "./pages/NotificationsPage";
import DevToolsPage from "./pages/DevToolsPage";

// Sales Pages
import SalesOrdersPage from "./pages/sales/SalesOrdersPage";
import SalesOrderDetailsPage from "./pages/sales/SalesOrderDetailsPage";
import CreateSalesOrderPage from "./pages/sales/CreateSalesOrderPage";
import SalesReportsPage from "./pages/sales/SalesReportsPage";
import SalesDashboardActivityPage from "./pages/sales/SalesDashboardActivityPage";

// Procurement Pages
import PurchaseOrdersPage from "./pages/procurement/PurchaseOrdersPage";
import PurchaseOrderDetailsPage from "./pages/procurement/PurchaseOrderDetailsPage";
import CreatePurchaseOrderPage from "./pages/procurement/CreatePurchaseOrderPage";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import BillOfMaterialsPage from "./pages/procurement/BillOfMaterialsPage";
import VendorsPage from "./pages/procurement/VendorsPage";
import VendorManagementPage from "./pages/procurement/VendorManagementPage";
import ProcurementReportsPage from "./pages/procurement/ProcurementReportsPage";
import GoodsReceiptPage from "./pages/procurement/GoodsReceiptPage";
import VendorPerformancePage from "./pages/procurement/VendorPerformancePage";
import PendingApprovalsPage from "./pages/procurement/PendingApprovalsPage";
import MaterialRequestsPage from "./pages/procurement/MaterialRequestsPage";
import ProductionRequestsPage from "./pages/procurement/ProductionRequestsPage";

// Challan Pages
import ChallanRegisterPage from "./pages/challans/ChallanRegisterPage";
import CreateChallanPage from "./pages/challans/CreateChallanPage";

// Inventory Pages
import StockManagementPage from "./pages/inventory/StockManagementPage";
import StockAlertsPage from "./pages/inventory/StockAlertsPage";
import InventoryReportsPage from "./pages/inventory/InventoryReportsPage";
import InventoryBarcodeLookup from "./pages/inventory/InventoryBarcodeLookup";
// Products merged into Inventory - old pages removed from navigation
// import ProductsPage from './pages/inventory/ProductsPage';
// import ProductBarcodeLookup from './components/ProductBarcodeLookup';
// import ProductLifecyclePage from './pages/inventory/ProductLifecyclePage';
import ProjectMaterialDashboard from "./pages/inventory/ProjectMaterialDashboard";
import GoodsReceiptNotePage from "./pages/inventory/GoodsReceiptNotePage";
import CreateGRNPage from "./pages/inventory/CreateGRNPage";
import UpdateGRNPage from "./pages/inventory/UpdateGRNPage";
import GRNVerificationPage from "./pages/inventory/GRNVerificationPage";
import AddGRNToInventoryPage from "./pages/inventory/AddGRNToInventoryPage";
import POInventoryTrackingPage from "./pages/inventory/POInventoryTrackingPage";
import MaterialRequestReviewPage from "./pages/inventory/MaterialRequestReviewPage";
import StockDispatchPage from "./pages/inventory/StockDispatchPage";
import MRNRequestsPage from "./pages/inventory/MRNRequestsPage";

// Manufacturing Pages
import ProductionOrdersPage from "./pages/manufacturing/ProductionOrdersPage";
import ProductionTrackingPage from "./pages/manufacturing/ProductionTrackingPage";
import QualityControlPage from "./pages/manufacturing/QualityControlPage";
import ManufacturingReportsPage from "./pages/manufacturing/ManufacturingReportsPage";
import ProductionWizardPage from "./pages/manufacturing/ProductionWizardPage";
import ProductionDashboardPage from "./pages/manufacturing/ProductionDashboardPage";
import ManufacturingProductionRequestsPage from "./pages/manufacturing/ManufacturingProductionRequestsPage";
import MaterialRequirementsPage from "./pages/manufacturing/MaterialRequirementsPage";
import CreateMRMPage from "./pages/manufacturing/CreateMRMPage";
import MRNListPage from "./pages/manufacturing/MRMListPage";
import MaterialReceiptPage from "./pages/manufacturing/MaterialReceiptPage";
import StockVerificationPage from "./pages/manufacturing/StockVerificationPage";
import ProductionApprovalPage from "./pages/manufacturing/ProductionApprovalPage";
import ProductionOperationsViewPage from "./pages/manufacturing/ProductionOperationsViewPage";
import OutsourceManagementPage from "./pages/manufacturing/OutsourceManagementPage";

// Admin Pages
import UserManagementPage from "./pages/admin/UserManagementPage";
import RoleManagementPage from "./pages/admin/RoleManagementPage";
import SystemConfigPage from "./pages/admin/SystemConfigPage.jsx";

// Store Pages
import StoreReturnsPage from "./pages/store/StoreReturnsPage";
import StoreStockManagementPage from "./pages/store/StoreStockManagementPage";

function App() {
  const { user, loading, canAccessDepartment } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<RegistrationPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Protected Route Wrapper
  const ProtectedDashboard = ({ department, children }) => {
    if (!canAccessDepartment(department)) {
      return <Navigate to={`/${user.department}/dashboard`} replace />;
    }
    return children;
  };

  return (
    <DashboardLayout>
      <Routes>
        {/* Dashboard Routes based on Department */}
        <Route
          path="/"
          element={<Navigate to={`/${user.department}/dashboard`} replace />}
        />

        {/* Department root routes for sidebar navigation */}
        <Route
          path="/sales"
          element={
            <ProtectedDashboard department="sales">
              <SalesDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement"
          element={
            <ProtectedDashboard department="procurement">
              <ProcurementDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/challans"
          element={
            <ProtectedDashboard department="challans">
              <ChallanDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedDashboard department="inventory">
              <EnhancedInventoryDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing"
          element={
            <ProtectedDashboard department="manufacturing">
              <ManufacturingDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/outsourcing"
          element={
            <ProtectedDashboard department="manufacturing">
              <OutsourcingDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/samples"
          element={
            <ProtectedDashboard department="samples">
              <SamplesDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/shipment"
          element={
            <ProtectedDashboard department="shipment">
              <ShipmentDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/store"
          element={
            <ProtectedDashboard department="store">
              <StoreDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedDashboard department="finance">
              <FinanceDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedDashboard department="admin">
              <AdminDashboard />
            </ProtectedDashboard>
          }
        />

        {/* Dashboard sub-routes */}
        <Route
          path="/sales/dashboard"
          element={
            <ProtectedDashboard department="sales">
              <SalesDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/dashboard"
          element={
            <ProtectedDashboard department="procurement">
              <ProcurementDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/challans/dashboard"
          element={
            <ProtectedDashboard department="challans">
              <ChallanDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/dashboard"
          element={
            <ProtectedDashboard department="inventory">
              <EnhancedInventoryDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/dashboard"
          element={
            <ProtectedDashboard department="manufacturing">
              <ManufacturingDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/outsourcing/dashboard"
          element={
            <ProtectedDashboard department="manufacturing">
              <OutsourcingDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/samples/dashboard"
          element={
            <ProtectedDashboard department="samples">
              <SamplesDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/shipment/dashboard"
          element={
            <ProtectedDashboard department="shipment">
              <ShipmentDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/store/dashboard"
          element={
            <ProtectedDashboard department="store">
              <StoreDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/finance/dashboard"
          element={
            <ProtectedDashboard department="finance">
              <FinanceDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedDashboard department="admin">
              <AdminDashboard />
            </ProtectedDashboard>
          }
        />

        {/* Sales Routes */}
        <Route
          path="/sales/activity"
          element={
            <ProtectedDashboard department="sales">
              <SalesDashboardActivityPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/sales/orders"
          element={
            <ProtectedDashboard department="sales">
              <SalesOrdersPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/sales/orders/create"
          element={
            <ProtectedDashboard department="sales">
              <CreateSalesOrderPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/sales/orders/:id"
          element={
            <ProtectedDashboard department="sales">
              <SalesOrderDetailsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/sales/reports"
          element={
            <ProtectedDashboard department="sales">
              <SalesReportsPage />
            </ProtectedDashboard>
          }
        />

        {/* Procurement Routes */}
        <Route
          path="/procurement/pending-approvals"
          element={
            <ProtectedDashboard department="procurement">
              <PendingApprovalsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/purchase-orders"
          element={
            <ProtectedDashboard department="procurement">
              <PurchaseOrdersPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/purchase-orders/create"
          element={
            <ProtectedDashboard department="procurement">
              <CreatePurchaseOrderPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/purchase-orders/:id/edit"
          element={
            <ProtectedDashboard department="procurement">
              <CreatePurchaseOrderPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/purchase-orders/:id"
          element={
            <ProtectedDashboard department="procurement">
              <PurchaseOrderDetailsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/vendors"
          element={
            <ProtectedDashboard department="procurement">
              <VendorsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/vendor-management"
          element={
            <ProtectedDashboard department="procurement">
              <VendorManagementPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/bill-of-materials"
          element={
            <ProtectedDashboard department="procurement">
              <BillOfMaterialsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/goods-receipt"
          element={
            <ProtectedDashboard department="procurement">
              <GoodsReceiptPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/vendor-performance"
          element={
            <ProtectedDashboard department="procurement">
              <VendorPerformancePage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/material-requests"
          element={
            <ProtectedDashboard department="procurement">
              <MaterialRequestsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/production-requests"
          element={
            <ProtectedDashboard department="procurement">
              <ProductionRequestsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/procurement/reports"
          element={
            <ProtectedDashboard department="procurement">
              <ProcurementReportsPage />
            </ProtectedDashboard>
          }
        />

        {/* Challan Routes */}
        <Route
          path="/challans/register"
          element={
            <ProtectedDashboard department="challans">
              <ChallanRegisterPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/challans/create"
          element={
            <ProtectedDashboard department="challans">
              <CreateChallanPage />
            </ProtectedDashboard>
          }
        />

        {/* Inventory Routes */}
        {/* Products merged into Inventory - old routes removed */}
        {/* <Route path="/inventory/products" element={<ProductsPage />} /> */}
        {/* <Route path="/inventory/barcode-lookup" element={<ProductBarcodeLookup />} /> */}
        {/* <Route path="/inventory/lifecycle" element={<ProductLifecyclePage />} /> */}
        <Route
          path="/inventory/allocation"
          element={
            <ProtectedDashboard department="inventory">
              <ProjectAllocationDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/projects/:salesOrderId"
          element={
            <ProtectedDashboard department="inventory">
              <ProjectMaterialDashboard />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/stock"
          element={
            <ProtectedDashboard department="inventory">
              <StockManagementPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/alerts"
          element={
            <ProtectedDashboard department="inventory">
              <StockAlertsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/scan"
          element={
            <ProtectedDashboard department="inventory">
              <InventoryBarcodeLookup />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/barcode-scanner"
          element={
            <ProtectedDashboard department="inventory">
              <InventoryBarcodeLookup />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/grn"
          element={
            <ProtectedDashboard department="inventory">
              <GoodsReceiptNotePage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/grn/create"
          element={
            <ProtectedDashboard department="inventory">
              <CreateGRNPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/grn/update/:id"
          element={
            <ProtectedDashboard department="inventory">
              <UpdateGRNPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/grn/:id/verify"
          element={
            <ProtectedDashboard department="inventory">
              <GRNVerificationPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/grn/:id/add-to-inventory"
          element={
            <ProtectedDashboard department="inventory">
              <AddGRNToInventoryPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/goods-receipt"
          element={
            <ProtectedDashboard department="inventory">
              <GoodsReceiptNotePage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/from-po/:poId"
          element={
            <ProtectedDashboard department="inventory">
              <POInventoryTrackingPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/mrn-requests"
          element={
            <ProtectedDashboard department="inventory">
              <MRNRequestsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/mrn/:id"
          element={
            <ProtectedDashboard department="inventory">
              <MaterialRequestReviewPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/dispatch/:mrnId"
          element={
            <ProtectedDashboard department="inventory">
              <StockDispatchPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/inventory/reports"
          element={
            <ProtectedDashboard department="inventory">
              <InventoryReportsPage />
            </ProtectedDashboard>
          }
        />

        {/* Manufacturing Routes */}
        <Route
          path="/manufacturing/orders"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionOrdersPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/orders/:id"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionOperationsViewPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/tracking"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionTrackingPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/quality"
          element={
            <ProtectedDashboard department="manufacturing">
              <QualityControlPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/wizard"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionWizardPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/dashboard"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionDashboardPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/production-requests"
          element={
            <ProtectedDashboard department="manufacturing">
              <ManufacturingProductionRequestsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/material-requirements"
          element={
            <ProtectedDashboard department="manufacturing">
              <MaterialRequirementsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/material-requests"
          element={
            <ProtectedDashboard department="manufacturing">
              <MRNListPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/material-requests/create"
          element={
            <ProtectedDashboard department="manufacturing">
              <CreateMRMPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/material-receipt/:dispatchId"
          element={
            <ProtectedDashboard department="manufacturing">
              <MaterialReceiptPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/stock-verification/:receiptId"
          element={
            <ProtectedDashboard department="manufacturing">
              <StockVerificationPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/production-approval/:verificationId"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionApprovalPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/operations/:id"
          element={
            <ProtectedDashboard department="manufacturing">
              <ProductionOperationsViewPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/outsource"
          element={
            <ProtectedDashboard department="manufacturing">
              <OutsourceManagementPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/manufacturing/reports"
          element={
            <ProtectedDashboard department="manufacturing">
              <ManufacturingReportsPage />
            </ProtectedDashboard>
          }
        />

        {/* Outsourcing Routes */}
        <Route
          path="/outsourcing/outward"
          element={
            <ProtectedDashboard department="manufacturing">
              <div>Outward Challans Page</div>
            </ProtectedDashboard>
          }
        />
        <Route
          path="/outsourcing/inward"
          element={
            <ProtectedDashboard department="manufacturing">
              <div>Inward Challans Page</div>
            </ProtectedDashboard>
          }
        />
        <Route
          path="/outsourcing/tracking"
          element={
            <ProtectedDashboard department="manufacturing">
              <div>Vendor Tracking Page</div>
            </ProtectedDashboard>
          }
        />

        {/* Samples Routes */}
        <Route
          path="/samples/orders"
          element={
            <ProtectedDashboard department="samples">
              <SamplesOrdersPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/samples/tracking"
          element={
            <ProtectedDashboard department="samples">
              <SamplesTrackingPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/samples/reports"
          element={
            <ProtectedDashboard department="samples">
              <SamplesReportsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/samples/conversion"
          element={
            <ProtectedDashboard department="samples">
              <SamplesConversionPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/samples/create"
          element={
            <ProtectedDashboard department="samples">
              <SamplesCreateRequestPage />
            </ProtectedDashboard>
          }
        />

        {/* Shipment Routes */}
        <Route
          path="/shipment/create"
          element={
            <ProtectedDashboard department="shipment">
              <CreateShipmentPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/shipment/dispatch"
          element={
            <ProtectedDashboard department="shipment">
              <ShipmentDispatchPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/shipment/tracking"
          element={
            <ProtectedDashboard department="shipment">
              <ShipmentTrackingPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/shipment/tracking/:trackingId"
          element={
            <ProtectedDashboard department="shipment">
              <ShipmentTrackingPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/shipment/reports"
          element={
            <ProtectedDashboard department="shipment">
              <ShipmentReportsPage />
            </ProtectedDashboard>
          }
        />

        {/* Store Routes */}
        <Route
          path="/store/stock"
          element={
            <ProtectedDashboard department="store">
              <StoreStockManagementPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/store/sales"
          element={
            <ProtectedDashboard department="store">
              <div>Store Sales Page</div>
            </ProtectedDashboard>
          }
        />
        <Route
          path="/store/returns"
          element={
            <ProtectedDashboard department="store">
              <StoreReturnsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/store/reports"
          element={
            <ProtectedDashboard department="store">
              <div>Store Reports Page</div>
            </ProtectedDashboard>
          }
        />

        {/* Finance Routes */}
        <Route
          path="/finance/invoices"
          element={
            <ProtectedDashboard department="finance">
              <FinanceInvoicesPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/finance/payments"
          element={
            <ProtectedDashboard department="finance">
              <FinancePaymentsPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/finance/reports"
          element={
            <ProtectedDashboard department="finance">
              <FinanceReportsPage />
            </ProtectedDashboard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedDashboard department="admin">
              <UserManagementPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedDashboard department="admin">
              <RoleManagementPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/admin/config"
          element={
            <ProtectedDashboard department="admin">
              <SystemConfigPage />
            </ProtectedDashboard>
          }
        />
        <Route
          path="/admin/courier-agents"
          element={
            <ProtectedDashboard department="admin">
              <CourierAgentManagementPage />
            </ProtectedDashboard>
          }
        />

        {/* Courier Agent Routes (Public) */}
        <Route
          path="/courier-agent/login"
          element={<CourierAgentLoginPage />}
        />

        {/* Common Routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/devtools" element={<DevToolsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
