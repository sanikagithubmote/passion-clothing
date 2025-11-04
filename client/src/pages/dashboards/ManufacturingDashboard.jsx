import React, { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Factory,
  Users,
  Clock,
  Package,
  BarChart3,
  RefreshCw,
  Plus,
  Scan,
  QrCode,
  Trash2,
  Scissors,
  Paintbrush,
  Shirt,
  CheckSquare,
  Send,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import BarcodeDisplay from "../../components/BarcodeDisplay";
import BarcodeScanner from "../../components/BarcodeScanner";
import QRCodeScanner from "../../components/manufacturing/QRCodeScanner";
import MinimalStatCard from "../../components/common/MinimalStatCard";
import Tooltip from "../../components/common/Tooltip";
import ProductTrackingDialog from "../../components/dialogs/ProductTrackingDialog";
import ProductionStagesDialog from "../../components/dialogs/ProductionStagesDialog";
import MaterialVerificationDialog from "../../components/dialogs/MaterialVerificationDialog";
import QualityCheckDialog from "../../components/dialogs/QualityCheckDialog";
import "../../styles/compactDashboard.css";

// Ensure this path is correct

// =========================================================================
// 1. UTILITY FUNCTIONS (Kept from original for clarity)
// =========================================================================

const getStageStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-300";
    case "in_progress":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "on_hold":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStageIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case "in_progress":
      return <Clock className="w-4 h-4 text-blue-600" />;
    case "on_hold":
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case "pending":
      return <Clock className="w-4 h-4 text-gray-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

// =========================================================================
// 2. MAIN COMPONENT
// =========================================================================

const ManufacturingDashboard = () => {
  const navigate = useNavigate();

  // --- State Variables: UI & Data ---
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [manualBarcode, setManualBarcode] = useState(""); // Retained from original

  // Dialog & Modal States
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false); // Unused in provided logic, but retained
  const [barcodeDialogOpen, setBarcodeDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false); // Unused in provided logic, but retained
  const [productTrackingDialogOpen, setProductTrackingDialogOpen] =
    useState(false);
  const [productionStagesDialogOpen, setProductionStagesDialogOpen] =
    useState(false);
  const [materialVerificationDialogOpen, setMaterialVerificationDialogOpen] =
    useState(false);
  const [qualityCheckDialogOpen, setQualityCheckDialogOpen] = useState(false);
  // ✅ REMOVED: productSelectionDialogOpen - no longer needed
  const [createDialogOpen, setCreateDialogOpen] = useState(false); // Unused in provided logic, but retained

  // Data States
  const [selectedOrder, setSelectedOrder] = useState(null); // Used for generic view/edit
  const [selectedProductionOrder, setSelectedProductionOrder] = useState(null); // Used for workflow dialogs
  const [selectedOrderForBarcode, setSelectedOrderForBarcode] = useState(null);
  // ✅ REMOVED: pendingProductionOrder - now navigate directly to wizard
  // ✅ REMOVED: selectedProductForProduction - product selection removed
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Material Flow Dialog States
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [materialFlowLoading, setMaterialFlowLoading] = useState(false);
  const [materialNotes, setMaterialNotes] = useState("");

  // Lists & Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    delayedOrders: 0,
    efficiency: 0,
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);
  const [products, setProducts] = useState([]); // All products
  const [availableProducts, setAvailableProducts] = useState([]); // Products available for new production
  const [productionStages, setProductionStages] = useState([]);
  const [pendingDispatches, setPendingDispatches] = useState([]);
  const [pendingReceipts, setPendingReceipts] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);

  // =========================================================================
  // 3. DATA FETCHING LOGIC (Using useCallback for optimization)
  // =========================================================================

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await api.get("/manufacturing/dashboard/stats");
      const data = response.data;
      const efficiency =
        data.totalOrders > 0
          ? Math.round((data.completedOrders / data.totalOrders) * 100)
          : 0;
      setStats({ ...data, efficiency });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const response = await api.get("/manufacturing/orders?limit=100");
      const orders = response.data.productionOrders || [];

      const transformedOrders = orders.map((order) => {
        // ... (Transformation logic from provided code) ...
        const completedStages =
          order.stages?.filter((stage) => stage.status === "completed")
            .length || 0;
        const totalStages = order.stages?.length || 1;
        const progress = Math.round((completedStages / totalStages) * 100);

        const currentStage =
          order.stages?.find((stage) => stage.status === "in_progress")
            ?.stage_name ||
          order.stages?.find((stage) => stage.status === "pending")
            ?.stage_name ||
          "Not Started";

        const projectName =
          order.project_name ||
          order.salesOrder?.project_name ||
          order.productionRequest?.project_name ||
          "N/A";

        const stages = (order.stages || []).map((stage) => ({
          id: stage.id,
          name: stage.stage_name
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          rawName: stage.stage_name,
          status: stage.status,
          progress:
            stage.status === "completed"
              ? 100
              : stage.status === "in_progress"
              ? 50
              : 0,
          startTime: stage.actual_start_time
            ? new Date(stage.actual_start_time).toLocaleString()
            : null,
          endTime: stage.actual_end_time
            ? new Date(stage.actual_end_time).toLocaleString()
            : null,
          processedQty: stage.quantity_processed || 0,
          approvedQty: stage.quantity_approved || 0,
          rejectedQty: stage.quantity_rejected || 0,
          isOutsourced: Boolean(stage.outsourced),
          outsourceType: stage.outsource_type,
          vendorId: stage.vendor_id,
          isPrinting: stage.stage_name === "printing",
          isEmbroidery: stage.stage_name === "embroidery",
          notes: stage.notes || "",
        }));
        // ... (End of Transformation logic) ...

        // ✅ NEW: Extract product name from specifications as fallback
        const specs =
          typeof order.specifications === "string"
            ? JSON.parse(order.specifications || "{}")
            : order.specifications || {};
        const productName =
          order.product?.name ||
          order.productName ||
          specs.product_name ||
          "Unknown Product";

        return {
          id: order.id,
          orderNo: order.production_number,
          projectName: projectName,
          productName: productName,
          quantity: order.quantity,
          currentStage: currentStage.replace("_", " ").toUpperCase(),
          progress: progress,
          assignedWorker: order.assignedUser?.name || "Unassigned",
          status: order.status,
          expectedCompletion: order.planned_end_date
            ? new Date(order.planned_end_date).toLocaleDateString()
            : "TBD",
          productCode: order.product?.product_code,
          priority: order.priority,
          stages: stages,
          actualStartDate: order.actual_start_date
            ? new Date(order.actual_start_date).toLocaleDateString()
            : null,
          actualEndDate: order.actual_end_date
            ? new Date(order.actual_end_date).toLocaleDateString()
            : null,
          salesOrderNumber: order.salesOrder?.order_number || "N/A",
          customerName: order.salesOrder?.customer?.name || "N/A",
          order_id:
            order.salesOrder?.id ||
            order.productionRequest?.sales_order_id ||
            null, // Important for status updates
        };
      });

      setActiveOrders(transformedOrders);
    } catch (error) {
      console.error("Failed to fetch active orders:", error);
      toast.error("Failed to load active orders");
    }
  }, []);

  const fetchIncomingOrders = useCallback(async () => {
    // ... (Logic from provided code) ...
    try {
      const response = await api.get(
        "/production-requests?status=pending,reviewed"
      );
      const requests = response.data.data || [];

      const transformedOrders = requests.map((request) => {
        let specs = {};
        try {
          specs =
            typeof request.product_specifications === "string"
              ? JSON.parse(request.product_specifications)
              : request.product_specifications || {};
        } catch (e) {
          specs = {};
        }

        const productName =
          request.product_name ||
          specs.garment_specifications?.product_type ||
          specs.product_name ||
          "Unknown Product";

        const customerName =
          request.salesOrder?.customer?.name ||
          request.salesOrder?.customer_name ||
          specs.customer_name ||
          "N/A";

        return {
          id: request.id,
          request_number: request.request_number,
          product_id:
            request.product_id || specs.items?.[0]?.product_id || null,
          product_name: productName,
          quantity: request.quantity,
          unit: request.unit,
          priority: request.priority || "medium",
          required_date: request.required_date,
          project_name: request.project_name,
          sales_order_id: request.sales_order_id,
          sales_order_number: request.sales_order_number,
          customer: { name: customerName },
          garment_specs: { product_type: productName },
          material_requirements: specs.items || [],
          requested_by: request.requester?.name || "Unknown",
          status: request.status,
          created_at: request.created_at,
          special_instructions:
            request.notes || specs.special_instructions || "",
        };
      });

      setIncomingOrders(transformedOrders);
    } catch (error) {
      console.error("Error fetching incoming orders:", error);
      toast.error("Failed to load incoming production requests");
    }
    // ... (End of Logic from provided code) ...
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get("/products?limit=1000&status=active");
      const productsList = response.data.products || [];
      setProducts(productsList);
      setAvailableProducts(productsList);
      if (productsList.length === 0) {
        console.warn(
          "⚠️ No products found. Please create products in the Inventory module first."
        );
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);

      // Enhanced error diagnostics
      if (error.response?.status === 401) {
        console.error(
          "❌ Authentication failed - token may be expired. Please log in again."
        );
        toast.error("Session expired. Please log in again.");
      } else if (error.response?.status === 403) {
        console.error(
          "❌ Access denied - you may not have Manufacturing department access."
        );
        toast.error(
          "You do not have permission to view products. Contact your administrator."
        );
      } else if (error.message?.includes("Network connection failed")) {
        console.error(
          "❌ Network error - backend may be offline or unreachable."
        );
        toast.error(
          "Cannot reach backend. Is the server running on localhost:5000?"
        );
      } else {
        console.error(
          "❌ Unknown error:",
          error.response?.data || error.message
        );
        toast.error(
          "Failed to load products: " +
            (error.response?.data?.message || error.message)
        );
      }
    }
  }, []);

  const fetchProductionStages = useCallback(async () => {
    try {
      const stagesConfig = [
        {
          name: "Cutting",
          key: "cutting",
          icon: Scissors,
          color: "bg-blue-100 text-blue-800",
        },
        {
          name: "Printing",
          key: "printing",
          icon: Paintbrush,
          color: "bg-indigo-100 text-indigo-800",
        },
        {
          name: "Stitching",
          key: "stitching",
          icon: Shirt,
          color: "bg-green-100 text-green-800",
        },
        {
          name: "Finishing",
          key: "finishing",
          icon: CheckCircle,
          color: "bg-yellow-100 text-yellow-800",
        },
        {
          name: "Quality Check",
          key: "quality_check",
          icon: AlertTriangle,
          color: "bg-red-100 text-red-800",
        },
        {
          name: "Packaging",
          key: "packaging",
          icon: Package,
          color: "bg-gray-100 text-gray-800",
        },
      ];

      const stageData = await Promise.all(
        stagesConfig.map(async (stage) => {
          try {
            const response = await api.get(
              `/manufacturing/orders?status=${stage.key}`
            );
            const count = response.data.productionOrders?.length || 0;
            return { ...stage, count };
          } catch (error) {
            return { ...stage, count: 0 };
          }
        })
      );
      setProductionStages(stageData);
    } catch (error) {
      console.error("Failed to fetch production stages:", error);
    }
  }, []);

  const fetchPendingMaterialReceipts = useCallback(async () => {
    // ... (Logic from provided code) ...
    try {
      const dispatchResponse = await api.get("/material-dispatch/list/all");
      const allDispatches = dispatchResponse.data.dispatches || [];
      const pending = allDispatches.filter(
        (d) => d.received_status === "pending"
      );
      setPendingDispatches(pending);

      try {
        const receiptResponse = await api.get(
          "/material-receipt/list/pending-verification"
        );
        setPendingReceipts(receiptResponse.data.receipts || []);
      } catch (err) {
        setPendingReceipts([]);
      }

      try {
        const verificationResponse = await api.get(
          "/material-verification/list/pending-approval"
        );
        setPendingVerifications(verificationResponse.data.verifications || []);
      } catch (err) {
        setPendingVerifications([]);
      }
    } catch (error) {
      console.error("Error fetching pending material receipts:", error);
    }
    // ... (End of Logic from provided code) ...
  }, []);

  // --- Combined Fetcher ---
  const handleRefresh = useCallback(() => {
    fetchDashboardData();
    fetchActiveOrders();
    fetchProductionStages();
    fetchIncomingOrders();
    fetchPendingMaterialReceipts();
    fetchProducts();
  }, [
    fetchDashboardData,
    fetchActiveOrders,
    fetchProductionStages,
    fetchIncomingOrders,
    fetchPendingMaterialReceipts,
    fetchProducts,
  ]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // =========================================================================
  // 4. ACTION HANDLERS: PRODUCTION LIFECYCLE & CORE ACTIONS
  // =========================================================================

  const handleStartOrder = async (orderId) => {
    try {
      await api.post(`/manufacturing/orders/${orderId}/start`);
      toast.success("Production started successfully");
      handleRefresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to start production"
      );
    }
  };

  const handlePauseOrder = async (orderId) => {
    try {
      await api.post(`/manufacturing/orders/${orderId}/pause`);
      toast.success("Production paused successfully");
      handleRefresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to pause production"
      );
    }
  };

  const handleStopOrder = async (orderId) => {
    try {
      await api.post(`/manufacturing/orders/${orderId}/stop`);
      toast.success("Production stopped successfully");
      handleRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to stop production");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this production order? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await api.delete(`/manufacturing/orders/${orderId}`);
      toast.success("Production order deleted successfully");
      handleRefresh();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete production order"
      );
    }
  };

  const handleViewOrder = (order) => {
    navigate(`/manufacturing/orders/${order.id}`);
  };

  const handleShowBarcode = (order) => {
    setSelectedOrderForBarcode(order);
    setBarcodeDialogOpen(true);
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setUpdateDialogOpen(true);
  };

  const handleUpdateProductionStage = async (
    orderId,
    stage,
    status,
    notes = ""
  ) => {
    try {
      await api.put(`/manufacturing/orders/${orderId}/stages`, {
        stage,
        status,
        notes,
      });

      const order = activeOrders.find((o) => o.id === orderId);
      if (order && order.order_id) {
        // Use the main order ID for QR code update
        await api.put(`/orders/${order.order_id}/qr-code`, {
          department: "manufacturing",
          status: `${stage}_${status}`,
          timestamp: new Date().toISOString(),
          stage: stage,
          stage_status: status,
        });
      }

      toast.success(`Stage ${stage} ${status}`);
      fetchActiveOrders();
    } catch (error) {
      toast.error(`Failed to update ${stage} stage`);
    }
  };

  // =========================================================================
  // 5. INCOMING ORDER & CONVERSION HANDLERS
  // =========================================================================

  const handleApproveIncomingOrder = async (order) => {
    try {
      // Step 1: Approve the production request
      await api.patch(`/production-requests/${order.id}/status`, {
        status: "reviewed",
        manufacturing_notes:
          "Order reviewed and approved. Ready for MRN request.",
      });
      toast.success("Order approved successfully. Ready for MRN request.");
      fetchIncomingOrders();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to approve order";
      toast.error(errorMessage);
    }
  };

  // ✅ FIXED: Navigate directly to wizard with project pre-selected (NO product selection dialog)
  const handleStartProductionFlow = (order) => {
    if (!order) {
      toast.error("No order selected");
      return;
    }

    // Get sales order ID (this is the project identifier)
    const salesOrderId = order.sales_order_id;

    if (!salesOrderId) {
      toast.error(
        "Cannot start production: No sales order linked to this request"
      );
      return;
    }

    console.log(
      "✅ Starting production for project (Sales Order ID):",
      salesOrderId
    );
    console.log(
      "📦 Production Request:",
      order.request_number,
      "| Product:",
      order.product_name
    );

    // ✅ Navigate directly to wizard with sales order pre-selected
    // The wizard will auto-fetch MRN materials for this project
    navigate(
      `/manufacturing/wizard?salesOrderId=${salesOrderId}&productionRequestId=${order.id}`,
      {
        state: {
          preselectedSalesOrderId: salesOrderId,
          productionRequestId: order.id,
          projectName: order.project_name || order.sales_order_number,
          productName: order.product_name,
        },
      }
    );
  };

  const handleCreateMRN = (order) => {
    navigate("/manufacturing/material-requests/create", {
      state: {
        prefilledData: {
          ...order,
          production_request_id: order.id,
          product_type: order.garment_specs?.product_type,
          customer_name: order.customer?.name,
        },
      },
    });
  };

  // =========================================================================
  // 6. WORKFLOW DIALOG HANDLERS (Material Verification, QC)
  // =========================================================================

  const handleOpenProductionStages = (order) => {
    setSelectedProductionOrder(order);
    setProductionStagesDialogOpen(true);
  };

  const handleMaterialVerification = (order) => {
    // We already have the production order object from the list
    setSelectedProductionOrder(order);
    setMaterialVerificationDialogOpen(true);
  };

  const handleConfirmMaterialVerification = async () => {
    if (!selectedProductionOrder) return;

    try {
      // 1. Complete Material Review Stage (the initial check stage)
      await handleUpdateProductionStage(
        selectedProductionOrder.id,
        "material_review",
        "completed",
        "Materials verified and available"
      );

      // 2. Start Next Stage (e.g., Cutting)
      await handleUpdateProductionStage(
        selectedProductionOrder.id,
        "cutting",
        "in_progress"
      );

      toast.success(
        "Material verification completed and production (Cutting) started."
      );
      setMaterialVerificationDialogOpen(false);
      setSelectedProductionOrder(null);
      fetchActiveOrders();
    } catch (error) {
      toast.error("Failed to verify materials and start production");
    }
  };

  const handleQualityCheck = (order) => {
    setSelectedProductionOrder(order);
    setQualityCheckDialogOpen(true);
  };

  const handleQualityCheckResult = async (passed, rejectReason = "") => {
    if (!selectedProductionOrder) return;

    try {
      if (passed) {
        // Complete QC Stage and mark production order as completed
        await handleUpdateProductionStage(
          selectedProductionOrder.id,
          "quality_check",
          "completed",
          "Quality check passed"
        );
        await api.put(
          `/manufacturing/orders/${selectedProductionOrder.id}/complete`
        );

        // Update main order status for downstream modules (e.g., Shipment)
        const mainOrderId =
          selectedProductionOrder.order_id || selectedProductionOrder.id;

        await api.put(`/orders/${mainOrderId}/status`, {
          status: "manufacturing_completed",
          department: "manufacturing",
          action: "production_completed",
        });

        // Update QR code
        await api.put(`/orders/${mainOrderId}/qr-code`, {
          department: "manufacturing",
          status: "production_completed",
          stage: "completed",
          quality_passed: true,
        });

        toast.success("Production completed and quality check passed.");
      } else {
        // Create rejection record
        await api.post("/manufacturing/rejections", {
          production_order_id: selectedProductionOrder.id,
          stage: "quality_check",
          reason: rejectReason,
          quantity: selectedProductionOrder.quantity,
        });
        toast.error(`Production rejected: ${rejectReason}`);
      }

      setQualityCheckDialogOpen(false);
      setSelectedProductionOrder(null);
      handleRefresh();
    } catch (error) {
      toast.error("Failed to process quality check");
    }
  };

  // =========================================================================
  // 6B. MATERIAL FLOW HANDLERS (Receive, Verify, Approve)
  // =========================================================================

  const handleReceiveMaterialClick = (dispatch) => {
    console.log(
      "🟢 Opening receive material dialog for dispatch:",
      dispatch.dispatch_number
    );
    setSelectedDispatch(dispatch);
    setMaterialNotes("");
    setReceiveDialogOpen(true);
  };

  const handleConfirmReceiveMaterial = async () => {
    if (!selectedDispatch) {
      toast.error("No dispatch selected");
      return;
    }

    try {
      setMaterialFlowLoading(true);
      console.log(
        "📦 Receiving material for dispatch:",
        selectedDispatch.dispatch_number
      );

      // Prepare received materials from dispatch
      const received_materials = selectedDispatch.dispatched_materials || [];

      // Call API to create material receipt
      const response = await api.post("/material-receipt/create", {
        mrn_request_id: selectedDispatch.mrn_request_id,
        dispatch_id: selectedDispatch.id,
        received_materials: received_materials,
        has_discrepancy: false,
        discrepancy_details: null,
        receipt_notes: materialNotes || "Material received at manufacturing",
      });

      console.log("✅ Material received successfully:", response.data);
      toast.success("✅ Material received successfully");

      setReceiveDialogOpen(false);
      setSelectedDispatch(null);
      setMaterialNotes("");
      handleRefresh(); // Refresh all data
    } catch (error) {
      console.error("❌ Failed to receive material:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to receive material";
      toast.error(errorMsg);
    } finally {
      setMaterialFlowLoading(false);
    }
  };

  const handleVerifyMaterialClick = (receipt) => {
    console.log(
      "🟢 Opening verify material dialog for receipt:",
      receipt.receipt_number
    );
    setSelectedReceipt(receipt);
    setMaterialNotes("");
    setVerifyDialogOpen(true);
  };

  const handleConfirmVerifyMaterial = async () => {
    if (!selectedReceipt) {
      toast.error("No receipt selected");
      return;
    }

    try {
      setMaterialFlowLoading(true);
      console.log(
        "✓ Verifying material for receipt:",
        selectedReceipt.receipt_number
      );

      // Build verification checklist from received materials
      const verification_checklist =
        selectedReceipt.received_materials?.map((m, idx) => ({
          item_number: idx + 1,
          material_name: m.material_name,
          quantity_received: m.quantity,
          quantity_expected: m.quantity,
          status: "verified",
          notes: materialNotes,
        })) || [];

      // Call API to create verification
      const response = await api.post("/material-verification/create", {
        mrn_request_id: selectedReceipt.mrn_request_id,
        receipt_id: selectedReceipt.id,
        verification_checklist: verification_checklist,
        overall_result: "passed",
        issues_found: false,
        verification_notes: materialNotes || "Material verification completed",
        verification_photos: [],
      });

      console.log("✅ Material verified successfully:", response.data);
      toast.success("✅ Material verified successfully");

      setVerifyDialogOpen(false);
      setSelectedReceipt(null);
      setMaterialNotes("");
      handleRefresh(); // Refresh all data
    } catch (error) {
      console.error("❌ Failed to verify material:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to verify material";
      toast.error(errorMsg);
    } finally {
      setMaterialFlowLoading(false);
    }
  };

  const handleApproveProdClick = (verification) => {
    console.log(
      "🟢 Opening approve production dialog for verification:",
      verification.verification_number
    );
    setSelectedVerification(verification);
    setMaterialNotes("");
    setApproveDialogOpen(true);
  };

  const handleConfirmApproveProduction = async () => {
    if (!selectedVerification) {
      toast.error("No verification selected");
      return;
    }

    try {
      setMaterialFlowLoading(true);
      console.log(
        "✓ Approving production for verification:",
        selectedVerification.verification_number
      );

      // Call API to create production approval
      const response = await api.post("/production-approval/create", {
        verification_id: selectedVerification.id,
        mrn_request_id: selectedVerification.mrn_request_id,
        approval_status: "approved",
        approval_notes:
          materialNotes || "Production approved - materials verified",
      });

      console.log("✅ Production approved successfully:", response.data);
      toast.success("✅ Production approved successfully - Ready to start!");

      setApproveDialogOpen(false);
      setSelectedVerification(null);
      setMaterialNotes("");
      handleRefresh(); // Refresh all data
    } catch (error) {
      console.error("❌ Failed to approve production:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to approve production";
      toast.error(errorMsg);
    } finally {
      setMaterialFlowLoading(false);
    }
  };

  // --- FINAL STEP: Send to Shipment (Completed the truncated function) ---
  const handleSendToShipment = async (order) => {
    const mainOrderId = order.order_id || order.id; // Use main SO ID or PO ID

    try {
      // 1. Update main order status to ready_to_ship (valid status for SalesOrder)
      await api.put(`/orders/${mainOrderId}/status`, {
        status: "ready_to_ship", // ✅ Valid status for SalesOrder
        department: "shipment",
        action: "sent_to_shipment",
        notes: "Order ready for shipment",
      });

      // 2. Update QR code/Tracking status
      await api.put(`/orders/${mainOrderId}/qr-code`, {
        department: "shipment",
        status: "ready_to_ship", // ✅ Changed to match valid status
        timestamp: new Date().toISOString(),
        stage: "ready_for_dispatch",
      });

      toast.success("Order successfully sent to Shipment department!");
      fetchActiveOrders(); // Refresh the active list
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send to shipment"
      );
    }
  };

  // =========================================================================
  // 7. BARCODE/QR SCANNING & TRACKING HANDLERS
  // =========================================================================

  const handleScanSuccess = async (decodedText) => {
    try {
      setIsScanning(false);
      setTrackingLoading(true);
      setProductTrackingDialogOpen(true);

      const productResponse = await api.get(`/products/scan/${decodedText}`);
      const product = productResponse.data.product;

      if (!product) {
        toast.error("Product not found with this barcode");
        setProductTrackingDialogOpen(false);
        return;
      }

      const trackingInfo = {
        product,
        salesOrders: [],
        productionRequests: [],
        productionOrders: [],
        materialRequests: [],
        currentStatus: "Not Found",
      };

      // Fetch tracking data (using Promise.allSettled for robustness)
      const [salesRes, reqRes, ordersRes, materialRes] =
        await Promise.allSettled([
          api.get(`/sales/orders?product_id=${product.id}`),
          api.get(`/production-requests?product_id=${product.id}`),
          api.get(`/manufacturing/orders?product_id=${product.id}`),
          api.get(`/material-request-manufacture?product_id=${product.id}`),
        ]);

      trackingInfo.salesOrders =
        salesRes.status === "fulfilled" ? salesRes.value.data.orders || [] : [];
      trackingInfo.productionRequests =
        reqRes.status === "fulfilled" ? reqRes.value.data.data || [] : [];
      trackingInfo.productionOrders =
        ordersRes.status === "fulfilled"
          ? ordersRes.value.data.productionOrders || []
          : [];
      trackingInfo.materialRequests =
        materialRes.status === "fulfilled"
          ? materialRes.value.data.requests || []
          : [];

      if (trackingInfo.productionOrders.length > 0) {
        trackingInfo.currentStatus = trackingInfo.productionOrders[0].status
          .replace(/_/g, " ")
          .toUpperCase();
      } else if (trackingInfo.productionRequests.length > 0) {
        trackingInfo.currentStatus = "PRODUCTION REQUESTED";
      } else if (trackingInfo.salesOrders.length > 0) {
        trackingInfo.currentStatus = "SALES ORDER CREATED";
      }

      setTrackingData(trackingInfo);
      toast.success(`Product ${product.name} tracked!`);
    } catch (error) {
      console.error("Scan error:", error);
      setProductTrackingDialogOpen(false);

      if (error.response?.status === 404) {
        toast.error(`❌ Product with barcode "${decodedText}" not found.`, {
          duration: 5000,
        });
      } else {
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch product tracking info"
        );
      }
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleScanError = (error) => {
    console.warn("Scan error:", error);
    // You might add logging or a specific user message here if needed
  };

  // =========================================================================
  // 8. JSX RENDER
  // =========================================================================

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
        <p className="mt-2">Loading Manufacturing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Factory className="w-7 h-7 mr-3 text-blue-600" />
          Manufacturing Dashboard
        </h1>
        <div className="flex space-x-3">
          <Tooltip text="Scan Barcode/QR Code for Tracking">
            <button
              onClick={() => setIsScanning(true)}
              className="p-2 border rounded-full bg-white text-gray-600 hover:bg-gray-100 transition duration-150 shadow-sm"
            >
              <Scan className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip text="Refresh Data">
            <button
              onClick={handleRefresh}
              className={`p-2 border rounded-full bg-white text-gray-600 hover:bg-gray-100 transition duration-150 shadow-sm ${
                refreshing ? "animate-spin" : ""
              }`}
              disabled={refreshing}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MinimalStatCard
          icon={BarChart3}
          title="Total Orders"
          value={stats.totalOrders}
          color="text-blue-500"
        />
        <MinimalStatCard
          icon={TrendingUp}
          title="Efficiency"
          value={`${stats.efficiency}%`}
          color={stats.efficiency >= 80 ? "text-green-500" : "text-yellow-500"}
        />
        <MinimalStatCard
          icon={Factory}
          title="Active Orders"
          value={stats.activeOrders}
          color="text-purple-500"
        />
        <MinimalStatCard
          icon={CheckCircle}
          title="Completed"
          value={stats.completedOrders}
          color="text-green-500"
        />
        <MinimalStatCard
          icon={AlertTriangle}
          title="Delayed"
          value={stats.delayedOrders}
          color="text-red-500"
        />
      </div>

      {/* Tabs */}
      <div className="tabs-container bg-white rounded-xl shadow-lg p-4">
        <div className="flex border-b">
          <TabButton
            index={0}
            title={`Active Production (${activeOrders.length})`}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            index={1}
            title={`Incoming Requests (${incomingOrders.length})`}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            index={2}
            title={`Material Flow (${
              pendingDispatches.length +
              pendingReceipts.length +
              pendingVerifications.length
            })`}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          <TabButton
            index={3}
            title={`Stages Overview`}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        <div className="py-4">
          {/* Active Production Tab Content */}
          {activeTab === 0 && (
            <ProductionOrderList
              orders={activeOrders}
              handleViewOrder={handleViewOrder}
              handleStartOrder={handleStartOrder}
              handlePauseOrder={handlePauseOrder}
              handleStopOrder={handleStopOrder}
              handleShowBarcode={handleShowBarcode}
              handleDeleteOrder={handleDeleteOrder}
              handleOpenStages={handleOpenProductionStages}
              handleQualityCheck={handleQualityCheck}
              handleSendToShipment={handleSendToShipment}
              handleMaterialVerification={handleMaterialVerification}
              expandedOrderId={expandedOrderId}
              setExpandedOrderId={setExpandedOrderId}
              handleUpdateStage={handleUpdateProductionStage}
              getStageIcon={getStageIcon}
              getStageStatusColor={getStageStatusColor}
            />
          )}

          {/* Incoming Requests Tab Content */}
          {activeTab === 1 && (
            <IncomingOrderList
              orders={incomingOrders}
              handleApprove={handleApproveIncomingOrder}
              handleCreateMRN={handleCreateMRN}
              handleStartProductionFlow={handleStartProductionFlow}
            />
          )}

          {/* Material Flow Tab Content */}
          {activeTab === 2 && (
            <MaterialFlowList
              pendingDispatches={pendingDispatches}
              pendingReceipts={pendingReceipts}
              pendingVerifications={pendingVerifications}
              onReceiveMaterial={handleReceiveMaterialClick}
              onVerifyMaterial={handleVerifyMaterialClick}
              onApproveProd={handleApproveProdClick}
              navigate={navigate}
            />
          )}

          {/* Stages Overview Tab Content */}
          {activeTab === 3 && (
            <StagesOverview productionStages={productionStages} />
          )}
        </div>
      </div>

      {/* --- DIALOGS/MODALS --- */}

      {/* 1. Barcode/QR Scanner Modal */}
      {isScanning && (
        <BarcodeScanner
          onDetected={handleScanSuccess}
          onError={handleScanError}
          onClose={() => setIsScanning(false)}
        />
      )}

      {/* 2. Product Tracking Modal (Shows after scan success) */}
      <ProductTrackingDialog
        isOpen={productTrackingDialogOpen}
        onClose={() => setProductTrackingDialogOpen(false)}
        trackingData={trackingData}
        loading={trackingLoading}
      />

      {/* 3. Barcode Display Modal */}
      {barcodeDialogOpen && selectedOrderForBarcode && (
        <Modal
          title="Production Order Barcode"
          onClose={() => setBarcodeDialogOpen(false)}
        >
          <BarcodeDisplay value={selectedOrderForBarcode.orderNo} />
          <p className="text-center mt-2 text-sm">
            {selectedOrderForBarcode.productName}
          </p>
        </Modal>
      )}

      {/* 4. Production Stages Update Modal */}
      <ProductionStagesDialog
        isOpen={productionStagesDialogOpen}
        onClose={() => setProductionStagesDialogOpen(false)}
        order={selectedProductionOrder}
        handleUpdateStage={handleUpdateProductionStage}
        getStageIcon={getStageIcon}
        getStageStatusColor={getStageStatusColor}
      />

      {/* 5. Material Verification Modal */}
      <MaterialVerificationDialog
        isOpen={materialVerificationDialogOpen}
        onClose={() => setMaterialVerificationDialogOpen(false)}
        order={selectedProductionOrder}
        onConfirm={handleConfirmMaterialVerification}
      />

      {/* 6. Quality Check Modal */}
      <QualityCheckDialog
        isOpen={qualityCheckDialogOpen}
        onClose={() => setQualityCheckDialogOpen(false)}
        order={selectedProductionOrder}
        onComplete={handleQualityCheckResult}
      />

      {/* ✅ REMOVED: ProductSelectionDialog - now navigates directly to ProductionWizardPage with project pre-selected */}

      {/* 8. Receive Material Modal */}
      {receiveDialogOpen && selectedDispatch && (
        <Modal
          title="Receive Material"
          onClose={() => setReceiveDialogOpen(false)}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Dispatch #:</span>{" "}
                {selectedDispatch.dispatch_number}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Items:</span>{" "}
                {selectedDispatch.total_items ||
                  selectedDispatch.dispatched_materials?.length ||
                  0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt Notes
              </label>
              <textarea
                value={materialNotes}
                onChange={(e) => setMaterialNotes(e.target.value)}
                placeholder="Add any notes about the receipt (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✓ All materials will be marked as received. Please ensure you
                verify the contents before confirming.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setReceiveDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReceiveMaterial}
                disabled={materialFlowLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {materialFlowLoading ? "⏳ Processing..." : "✓ Confirm Receipt"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 9. Verify Material Modal */}
      {verifyDialogOpen && selectedReceipt && (
        <Modal
          title="Verify Material"
          onClose={() => setVerifyDialogOpen(false)}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Receipt #:</span>{" "}
                {selectedReceipt.receipt_number}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Items:</span>{" "}
                {selectedReceipt.total_items_received || 0}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Notes
              </label>
              <textarea
                value={materialNotes}
                onChange={(e) => setMaterialNotes(e.target.value)}
                placeholder="Add any verification notes (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✓ All materials will be marked as verified. Quality is
                confirmed.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setVerifyDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerifyMaterial}
                disabled={materialFlowLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {materialFlowLoading
                  ? "⏳ Verifying..."
                  : "✓ Confirm Verification"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 10. Approve Production Modal */}
      {approveDialogOpen && selectedVerification && (
        <Modal
          title="Approve Production"
          onClose={() => setApproveDialogOpen(false)}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Verification #:</span>{" "}
                {selectedVerification.verification_number}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-semibold">Result:</span>{" "}
                <span className="text-green-600 font-semibold">
                  {selectedVerification.overall_result?.toUpperCase()}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes
              </label>
              <textarea
                value={materialNotes}
                onChange={(e) => setMaterialNotes(e.target.value)}
                placeholder="Add approval notes (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
              />
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✓ Production will be approved. Manufacturing can proceed
                immediately.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setApproveDialogOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproveProduction}
                disabled={materialFlowLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {materialFlowLoading
                  ? "⏳ Approving..."
                  : "✓ Approve Production"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// =========================================================================
// 9. HELPER COMPONENTS (Place in separate files in a real app)
// =========================================================================

const TabButton = ({ index, title, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(index)}
    className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
      activeTab === index
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-blue-600"
    }`}
  >
    {title}
  </button>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          &times;
        </button>
      </div>
      {children}
    </div>
  </div>
);

// Simplified List Components - These are placeholders and require full implementation.

const ProductionOrderList = ({
  orders,
  handleViewOrder,
  handleStartOrder,
  handlePauseOrder,
  handleStopOrder,
  handleShowBarcode,
  handleOpenStages,
  handleQualityCheck,
  handleSendToShipment,
  expandedOrderId,
  setExpandedOrderId,
  getStageIcon,
  getStageStatusColor,
}) => {
  if (orders.length === 0)
    return (
      <p className="p-4 text-gray-500">No active production orders found.</p>
    );

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  order.status === "completed" ? "bg-green-100" : "bg-blue-100"
                } flex-shrink-0`}
              >
                <Factory
                  className={`w-5 h-5 ${
                    order.status === "completed"
                      ? "text-green-600"
                      : "text-blue-600"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold truncate text-gray-900">
                  {order.productName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  PO#: {order.orderNo} | Qty: {order.quantity} | Stage:{" "}
                  {order.currentStage}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              {order.status === "pending" && (
                <Tooltip text="Start Production">
                  <button
                    onClick={() => handleStartOrder(order.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                </Tooltip>
              )}
              {order.status === "in_progress" && (
                <Tooltip text="Pause Production">
                  <button
                    onClick={() => handlePauseOrder(order.id)}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                </Tooltip>
              )}
              {order.currentStage === "QUALITY CHECK" && (
                <Tooltip text="Final Quality Check">
                  <button
                    onClick={() => handleQualityCheck(order)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-full"
                  >
                    <CheckSquare className="w-5 h-5" />
                  </button>
                </Tooltip>
              )}
              {order.status === "completed" && (
                <Tooltip text="Send to Shipment">
                  <button
                    onClick={() => handleSendToShipment(order)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </Tooltip>
              )}
              <Tooltip text="View Stages">
                <button
                  onClick={() => handleOpenStages(order)}
                  className="p-2 text-gray-500 hover:text-blue-600"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </Tooltip>
              <button
                onClick={() =>
                  setExpandedOrderId(
                    expandedOrderId === order.id ? null : order.id
                  )
                }
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition"
              >
                <ArrowRight
                  className={`w-4 h-4 transition-transform ${
                    expandedOrderId === order.id ? "rotate-90" : "rotate-0"
                  }`}
                />
              </button>
            </div>
          </div>
          {expandedOrderId === order.id && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              {/* Overall Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Overall Progress
                  </p>
                  <span className="text-sm font-bold text-blue-600">
                    {order.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${order.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Stage-by-Stage Tracking Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Stage-by-Stage Tracking
                </h3>
                {order.stages && order.stages.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-300 rounded-lg">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Stage
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Progress
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Quantities
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            Start Time
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">
                            End Time
                          </th>
                          <th className="px-4 py-2 text-center font-semibold text-gray-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.stages.map((stage, idx) => (
                          <tr
                            key={stage.id}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {stage.name}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1 ${getStageStatusColor(
                                  stage.status
                                )}`}
                              >
                                {getStageIcon(stage.status)}
                                <span>
                                  {stage.status.replace("_", " ").toUpperCase()}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${stage.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1 block">
                                {stage.progress}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-blue-50 px-2 py-1 rounded text-blue-700">
                                Processed: {stage.processedQty || 0} | Approved:{" "}
                                {stage.approvedQty || 0} | Rejected:{" "}
                                {stage.rejectedQty || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {stage.startTime || "Not Started"}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {stage.endTime || "In Progress"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center space-x-1">
                                {stage.status === "pending" && (
                                  <Tooltip text="Start">
                                    <button
                                      onClick={() =>
                                        handleUpdateProductionStage(
                                          order.id,
                                          stage.rawName,
                                          "in_progress"
                                        )
                                      }
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  </Tooltip>
                                )}
                                {stage.status === "in_progress" && (
                                  <>
                                    <Tooltip text="Pause">
                                      <button
                                        onClick={() =>
                                          handleUpdateProductionStage(
                                            order.id,
                                            stage.rawName,
                                            "on_hold"
                                          )
                                        }
                                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                      >
                                        <Pause className="w-4 h-4" />
                                      </button>
                                    </Tooltip>
                                    <Tooltip text="Complete">
                                      <button
                                        onClick={() =>
                                          handleUpdateProductionStage(
                                            order.id,
                                            stage.rawName,
                                            "completed"
                                          )
                                        }
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                    </Tooltip>
                                  </>
                                )}
                                {stage.status === "on_hold" && (
                                  <Tooltip text="Resume">
                                    <button
                                      onClick={() =>
                                        handleUpdateProductionStage(
                                          order.id,
                                          stage.rawName,
                                          "in_progress"
                                        )
                                      }
                                      className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                                    >
                                      <Play className="w-4 h-4" />
                                    </button>
                                  </Tooltip>
                                )}
                                <Tooltip text="Edit Notes">
                                  <button
                                    onClick={() =>
                                      handleEditOrder({
                                        ...order,
                                        editStage: stage,
                                      })
                                    }
                                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No stages configured for this order.{" "}
                    {order.stages?.length || 0} / 0 stages
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const IncomingOrderList = ({
  orders,
  handleApprove,
  handleCreateMRN,
  handleStartProductionFlow,
}) => {
  if (orders.length === 0)
    return (
      <p className="p-4 text-gray-500">
        No incoming production requests are pending review.
      </p>
    );

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex justify-between items-center border-b p-3 bg-gray-50 rounded-lg hover:bg-white transition duration-200"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {order.product_name} ({order.quantity} {order.unit})
            </p>
            <p className="text-sm text-gray-500 truncate">
              Request #: {order.request_number} | Customer:{" "}
              {order.customer.name}
            </p>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                order.status === "reviewed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {order.status.replace("_", " ").toUpperCase()}
            </span>
            {order.status === "pending" && (
              <button
                onClick={() => handleApprove(order)}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                Approve
              </button>
            )}
            {order.status === "reviewed" && (
              <>
                <button
                  onClick={() => handleCreateMRN(order)}
                  className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
                >
                  Create MRN
                </button>
                <button
                  onClick={() => handleStartProductionFlow(order)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  Start Production
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const MaterialFlowList = ({
  pendingDispatches,
  pendingReceipts,
  pendingVerifications,
  onReceiveMaterial,
  onVerifyMaterial,
  onApproveProd,
  navigate,
}) => {
  const totalPending =
    pendingDispatches.length +
    pendingReceipts.length +
    pendingVerifications.length;
  if (totalPending === 0)
    return (
      <p className="p-4 text-gray-500">
        All materials are up-to-date and verified.
      </p>
    );

  const PendingItem = ({
    title,
    count,
    action,
    icon: Icon,
    color,
    onClick,
    disabled,
  }) => (
    <div
      className={`p-4 rounded-lg shadow-md ${color} flex justify-between items-center ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <div>
        <Icon className="w-6 h-6 mb-1" />
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="text-xs bg-white text-gray-700 py-1 px-3 rounded-full hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {action} <ArrowRight className="w-3 h-3 inline ml-1" />
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Dispatches Awaiting Receipt */}
      {pendingDispatches.length > 0 ? (
        <PendingItem
          title="Dispatches Awaiting Receipt"
          count={pendingDispatches.length}
          action="Receive Materials"
          icon={Package}
          color="bg-red-100 text-red-800"
          onClick={() => onReceiveMaterial(pendingDispatches[0])}
        />
      ) : (
        <div className="p-4 rounded-lg shadow-md bg-gray-100 text-gray-600 flex items-center justify-center">
          <p className="text-sm">No dispatches awaiting receipt</p>
        </div>
      )}

      {/* Receipts Awaiting Verification */}
      {pendingReceipts.length > 0 ? (
        <PendingItem
          title="Receipts Awaiting Verification"
          count={pendingReceipts.length}
          action="Verify Receipts"
          icon={CheckCircle}
          color="bg-yellow-100 text-yellow-800"
          onClick={() => onVerifyMaterial(pendingReceipts[0])}
        />
      ) : (
        <div className="p-4 rounded-lg shadow-md bg-gray-100 text-gray-600 flex items-center justify-center">
          <p className="text-sm">No receipts awaiting verification</p>
        </div>
      )}

      {/* Verifications Awaiting Approval */}
      {pendingVerifications.length > 0 ? (
        <PendingItem
          title="Verifications Awaiting Approval"
          count={pendingVerifications.length}
          action="Approve Production"
          icon={Factory}
          color="bg-green-100 text-green-800"
          onClick={() => onApproveProd(pendingVerifications[0])}
        />
      ) : (
        <div className="p-4 rounded-lg shadow-md bg-gray-100 text-gray-600 flex items-center justify-center">
          <p className="text-sm">No verifications awaiting approval</p>
        </div>
      )}
    </div>
  );
};

const StagesOverview = ({ productionStages }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {productionStages.map((stage) => (
      <div
        key={stage.key}
        className={`p-4 rounded-lg shadow-md ${stage.color}`}
      >
        <stage.icon className="w-6 h-6 mb-2" />
        <p className="text-3xl font-bold">{stage.count}</p>
        <p className="text-sm font-medium">{stage.name}</p>
      </div>
    ))}
  </div>
);

export default ManufacturingDashboard;
