import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaPlay,
  FaPause,
  FaExclamationCircle,
  FaCheckCircle,
  FaEllipsisV,
  FaColumns,
  FaFilter,
  FaChevronDown,
  FaClock,
  FaFire,
  FaList,
  FaBox,
  FaCog,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth } from "../../contexts/AuthContext";
import { useProducts } from "../../hooks/useProducts";
import PermissionGate from "../../components/auth/PermissionGate";
import { useColumnVisibility } from "../../hooks/useColumnVisibility";
import { useSmartDropdown } from "../../hooks/useSmartDropdown";

// Define all available columns with their properties
const AVAILABLE_COLUMNS = [
  {
    id: "order_number",
    label: "Order Number",
    defaultVisible: true,
    alwaysVisible: true,
  },
  { id: "product", label: "Product", defaultVisible: true },
  { id: "quantity", label: "Quantity", defaultVisible: true },
  { id: "progress", label: "Progress", defaultVisible: true },
  { id: "start_date", label: "Start Date", defaultVisible: true },
  { id: "end_date", label: "End Date", defaultVisible: true },
  { id: "priority", label: "Priority", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  {
    id: "actions",
    label: "Actions",
    defaultVisible: true,
    alwaysVisible: true,
  },
];

// Action Dropdown Component
function ActionDropdown({
  order,
  onView,
  onEdit,
  onStart,
  onStop,
  onDelete,
  permissionKeys,
  hasPermission,
}) {
  const { showMenu, closeMenu, isMenuOpen, handleToggle } = useSmartDropdown();
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu]);

  return (
    <div
      className="action-menu-container relative inline-block text-left"
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={(e) => handleToggle(order.id, e)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        aria-label="Actions"
      >
        <FaEllipsisV className="h-4 w-4" />
      </button>

      {isMenuOpen(order.id) && (
        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-10 focus:outline-none">
          <div className="py-2">
            <button
              type="button"
              onClick={() => {
                onView(order);
                closeMenu();
              }}
              className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
            >
              <FaEye className="h-4 w-4 text-blue-500" />
              View Details
            </button>

            {hasPermission(...permissionKeys.updateOrder) && (
              <button
                type="button"
                onClick={() => {
                  onEdit(order);
                  closeMenu();
                }}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
              >
                <FaEdit className="h-4 w-4 text-amber-500" />
                Edit Order
              </button>
            )}

            {hasPermission(...permissionKeys.updateOrder) && (
              <>
                {order.status === "in_progress" ? (
                  <button
                    type="button"
                    onClick={() => {
                      onStop(order);
                      closeMenu();
                    }}
                    className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <FaPause className="h-4 w-4 text-amber-500" />
                    Stop Production
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onStart(order);
                      closeMenu();
                    }}
                    className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <FaPlay className="h-4 w-4 text-green-500" />
                    Start Production
                  </button>
                )}
              </>
            )}

            {hasPermission(...permissionKeys.deleteOrder) && (
              <>
                <div className="border-t border-slate-200" />
                <button
                  type="button"
                  onClick={() => {
                    onDelete(order);
                    closeMenu();
                  }}
                  className="group flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  <FaTrash className="h-4 w-4" />
                  Delete Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ProductionOrdersPage = () => {
  const navigate = useNavigate();
  const permissionKeys = {
    createOrder: ["manufacturing", "create", "production_order"],
    updateOrder: ["manufacturing", "update", "production_order"],
    deleteOrder: ["manufacturing", "delete", "production_order"],
  };
  const [orders, setOrders] = useState([]);
  const [approvedProductions, setApprovedProductions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [approvalsLoading, setApprovalsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { hasPermission } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderForm, setOrderForm] = useState({
    orderNumber: "",
    productId: "",
    quantity: "",
    startDate: "",
    endDate: "",
    priority: "medium",
  });
  const [alert, setAlert] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showApprovedSection, setShowApprovedSection] = useState(false); // New: Collapsible state

  const { data: products = [], isLoading: productsLoading } = useProducts({
    status: "active",
    limit: 200,
  });

  // Column visibility hooks
  const {
    visibleColumns,
    isColumnVisible,
    toggleColumn,
    showAllColumns,
    resetColumns,
  } = useColumnVisibility("productionOrdersVisibleColumns", AVAILABLE_COLUMNS);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef(null);

  // Filtered orders state
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Click outside handler for column menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showColumnMenu &&
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target)
      ) {
        setShowColumnMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnMenu]);

  useEffect(() => {
    fetchOrders();
    fetchApprovedProductions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, priorityFilter, dateFrom, dateTo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/manufacturing/orders");
      // Map backend response to frontend expected format
      const mappedOrders = response.data.productionOrders.map((order) => ({
        id: order.id,
        orderNumber: order.production_number,
        // ✅ NEW: Use productName from backend (includes fallback from specifications)
        productName:
          order.productName || order.product?.name || "Unknown Product",
        quantity: order.quantity,
        produced: order.produced_quantity,
        startDate: order.planned_start_date,
        endDate: order.planned_end_date,
        status: order.status,
        priority: order.priority,
        productId: order.product ? order.product.id : "",
        // ✅ CRITICAL: Add linking fields for status detection
        sales_order_id: order.sales_order_id,
        production_approval_id: order.production_approval_id,
      }));
      setOrders(mappedOrders);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
      // Fallback to mock data if API fails
      setOrders([
        {
          id: 1,
          orderNumber: "PO-2024-001",
          productName: "Cotton T-Shirt - Blue",
          quantity: 500,
          produced: 350,
          startDate: "2024-01-15",
          endDate: "2024-02-15",
          status: "in_progress",
          priority: "high",
        },
        {
          id: 2,
          orderNumber: "PO-2024-002",
          productName: "Denim Jeans - Black",
          quantity: 300,
          produced: 0,
          startDate: "2024-01-20",
          endDate: "2024-02-20",
          status: "pending",
          priority: "medium",
        },
      ]);
    }
  };

  const fetchApprovedProductions = async () => {
    try {
      setApprovalsLoading(true);
      const response = await api.get("/production-approval/list/approved");
      setApprovedProductions(response.data.approvals || []);
      setApprovalsLoading(false);
    } catch (error) {
      console.error("Error fetching approved productions:", error);
      setApprovalsLoading(false);
    }
  };

  // ✅ NEW: Check if an individual approval has been used to create a production order
  const getApprovalProductionStatus = (approval) => {
    if (!approval || !approval.id) return null;

    // Check if this approval has linked production order
    const linkedOrder = orders.find((order) => {
      return order.production_approval_id === approval.id;
    });

    if (!linkedOrder) {
      return null; // No production order linked yet
    }

    // Return status of linked order
    return {
      status: linkedOrder.status,
      label:
        linkedOrder.status === "in_progress"
          ? "In Production"
          : linkedOrder.status === "completed"
          ? "Completed"
          : linkedOrder.status === "pending"
          ? "Pending"
          : "Unknown",
      orderNumber: linkedOrder.orderNumber,
      orderId: linkedOrder.id,
    };
  };

  // ✅ NEW: Check if an approved production already has an active production order
  const getProjectProductionStatus = (salesOrderId, projectKey) => {
    if (!salesOrderId) return null;

    // Find if any production order exists for this sales order
    const relatedOrders = orders.filter((order) => {
      // Check if order is linked to this sales order
      return (
        order.sales_order_id === salesOrderId ||
        order.orderNumber?.includes(projectKey)
      );
    });

    if (relatedOrders.length === 0) {
      return {
        status: "ready",
        label: "Ready to Start",
        color: "green",
        icon: "play",
      };
    }

    // Determine the overall status based on existing orders
    const statuses = relatedOrders.map((o) => o.status);

    if (statuses.includes("completed")) {
      return {
        status: "completed",
        label: "Completed",
        color: "blue",
        icon: "check",
      };
    }

    if (statuses.includes("in_progress")) {
      return {
        status: "in_progress",
        label: "In Production",
        color: "orange",
        icon: "cog",
      };
    }

    if (statuses.includes("pending") || statuses.includes("on_hold")) {
      return {
        status: "pending",
        label: "Pending Start",
        color: "yellow",
        icon: "clock",
      };
    }

    return {
      status: "ready",
      label: "Ready to Start",
      color: "green",
      icon: "play",
    };
  };

  // ✅ NEW: Group approvals by project (sales order) - Enhanced with status
  const groupApprovalsByProject = () => {
    const grouped = {};

    approvedProductions.forEach((approval) => {
      const projectKey =
        approval.mrnRequest?.salesOrder?.order_number ||
        approval.project_name ||
        "Unknown";
      const projectName = approval.project_name || `Project ${projectKey}`;

      if (!grouped[projectKey]) {
        grouped[projectKey] = {
          projectKey,
          projectName,
          salesOrderId: approval.mrnRequest?.salesOrder?.id,
          salesOrderNumber: projectKey,
          customerId: approval.mrnRequest?.salesOrder?.customer_id,
          customerName:
            approval.mrnRequest?.salesOrder?.customer?.name || "N/A",
          approvals: [],
          totalMaterials: 0,
          totalQuantity: 0,
        };
      }

      grouped[projectKey].approvals.push(approval);

      // Calculate total materials and quantity
      const materials =
        approval.verification?.receipt?.received_materials || [];
      grouped[projectKey].totalMaterials += materials.length;
    });

    // Add production status to each group
    Object.values(grouped).forEach((group) => {
      group.productionStatus = getProjectProductionStatus(
        group.salesOrderId,
        group.projectKey
      );
    });

    return Object.values(grouped);
  };

  // ✅ NEW: Handle starting production for entire project
  const handleStartProductionProject = (projectData) => {
    console.log("🚀 Starting production for project:", projectData);
    // Navigate with project ID and all approval IDs for batch processing
    const approvalIds = projectData.approvals.map((a) => a.id).join(",");
    navigate(
      `/manufacturing/wizard?salesOrderId=${projectData.salesOrderId}&projectApprovals=${approvalIds}`
    );
  };

  const handleStartProduction = (approvalId) => {
    navigate(`/manufacturing/wizard?approvalId=${approvalId}`);
  };

  const handleViewApprovalDetails = (approvalId) => {
    navigate(`/manufacturing/approval/${approvalId}`);
  };

  const getProgress = (produced, quantity) => {
    return (produced / quantity) * 100;
  };

  const handleCreate = () => {
    // Redirect to Production Wizard page for creating new production orders
    navigate("/manufacturing/wizard");
  };

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setOrderForm({
      orderNumber: order.orderNumber,
      productId: order.productId || "",
      quantity: order.quantity,
      startDate: order.startDate?.slice(0, 10) || "",
      endDate: order.endDate?.slice(0, 10) || "",
      priority: order.priority,
      specialInstructions: order.special_instructions || "",
      salesOrderId: order.sales_order_id || "",
    });
    setEditDialogOpen(true);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleDelete = async (order) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await api.delete(`/manufacturing/orders/${order.id}`);
        fetchOrders();
        setAlert({
          open: true,
          severity: "success",
          message: "Order deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting order:", error);
        setAlert({
          open: true,
          severity: "error",
          message: "Failed to delete order",
        });
      }
    }
  };

  const handleStart = async (order) => {
    try {
      await api.post(`/manufacturing/orders/${order.id}/start`);
      fetchOrders();
      setAlert({
        open: true,
        severity: "success",
        message: "Production started successfully",
      });
    } catch (error) {
      console.error("Error starting production:", error);
      setAlert({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to start production",
      });
    }
  };

  const handleStop = async (order) => {
    try {
      await api.post(`/manufacturing/orders/${order.id}/stop`);
      fetchOrders();
      setAlert({
        open: true,
        severity: "success",
        message: "Production stopped successfully",
      });
    } catch (error) {
      console.error("Error stopping production:", error);
      setAlert({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to stop production",
      });
    }
  };

  const handleSaveOrder = async () => {
    const { productId, quantity, startDate, endDate } = orderForm;
    if (!productId || !quantity || !startDate || !endDate) {
      setAlert({
        open: true,
        severity: "error",
        message: "Product, quantity, start date, and end date are required",
      });
      return;
    }

    const payload = {
      product_id: Number(productId),
      quantity: Number(quantity),
      planned_start_date: startDate,
      planned_end_date: endDate,
      priority: orderForm.priority,
      special_instructions: orderForm.specialInstructions || "",
      sales_order_id: orderForm.salesOrderId
        ? Number(orderForm.salesOrderId)
        : undefined,
    };

    try {
      if (editDialogOpen) {
        await api.put(`/manufacturing/orders/${selectedOrder.id}`, payload);
        setAlert({
          open: true,
          severity: "success",
          message: "Order updated successfully",
        });
      } else {
        await api.post("/manufacturing/orders", payload);
        setAlert({
          open: true,
          severity: "success",
          message: "Order created successfully",
        });
      }
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      setOrderForm({
        orderNumber: "",
        productId: "",
        quantity: "",
        startDate: "",
        endDate: "",
        priority: "medium",
        specialInstructions: "",
        salesOrderId: "",
      });
      fetchOrders();
    } catch (error) {
      console.error("Error saving order:", error);
      setAlert({
        open: true,
        severity: "error",
        message: error.response?.data?.message || "Failed to save order",
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter && priorityFilter !== "all") {
      filtered = filtered.filter((order) => order.priority === priorityFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (order) => new Date(order.startDate) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(
        (order) => new Date(order.endDate) <= new Date(dateTo + "T23:59:59")
      );
    }

    setFilteredOrders(filtered);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const summary = {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      inProgress: orders.filter((o) => o.status === "in_progress").length,
      completed: orders.filter((o) => o.status === "completed").length,
      urgent: orders.filter((o) => o.priority === "high").length,
    };
    return summary;
  };

  const summary = calculateSummary();

  // Status badge colors - Updated with professional design system
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-amber-50 text-amber-700 border border-amber-200",
        label: "Pending",
      },
      in_progress: {
        color: "bg-blue-50 text-blue-700 border border-blue-200",
        label: "In Progress",
      },
      completed: {
        color: "bg-green-50 text-green-700 border border-green-200",
        label: "Completed",
      },
      on_hold: {
        color: "bg-amber-50 text-amber-700 border border-amber-200",
        label: "On Hold",
      },
      cancelled: {
        color: "bg-red-50 text-red-700 border border-red-200",
        label: "Cancelled",
      },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Priority badge colors - Updated with professional design system
  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: {
        color: "bg-red-50 text-red-700 border border-red-200",
        label: "High",
      },
      medium: {
        color: "bg-amber-50 text-amber-700 border border-amber-200",
        label: "Medium",
      },
      low: {
        color: "bg-green-50 text-green-700 border border-green-200",
        label: "Low",
      },
    };
    const config = priorityConfig[priority] || priorityConfig.medium;
    return (
      <span
        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="text-lg text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Production Orders
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Manage approved materials and production orders
          </p>
        </div>
        <button
          className="bg-teal-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm hover:bg-teal-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          onClick={handleCreate}
        >
          <FaPlus />
          <span className="hidden sm:inline">Create Order</span>
        </button>
      </div>

      {/* Approved Productions Section - Collapsible */}
      {approvedProductions.length > 0 && (
        <div className="mb-8">
          {/* Collapsible Header */}
          <button
            onClick={() => setShowApprovedSection(!showApprovedSection)}
            className="w-full mb-4 transition-all duration-300"
          >
            <div
              className={`bg-gradient-to-r from-green-50 to-emerald-50 border-2 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-green-300 transition-all duration-300 ${
                showApprovedSection ? "border-green-300" : "border-green-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg bg-green-500 text-white transition-transform duration-300 ${
                      showApprovedSection ? "rotate-0" : ""
                    }`}
                  >
                    <FaCheckCircle className="text-lg" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      Approved Productions Ready to Start
                    </h2>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {groupApprovalsByProject().length} project
                      {groupApprovalsByProject().length > 1 ? "s" : ""} with{" "}
                      {approvedProductions.length} approval
                      {approvedProductions.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                      {groupApprovalsByProject().length}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      Ready
                    </span>
                  </div>
                  <div
                    className={`text-green-600 text-xl transition-transform duration-300 ${
                      showApprovedSection ? "rotate-180" : ""
                    }`}
                  >
                    <FaChevronDown />
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Expandable Content */}
          {showApprovedSection && (
            <div
              className={`overflow-hidden transition-all duration-300 ${
                showApprovedSection
                  ? "max-h-[5000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-4 animate-fadeIn">
                {approvalsLoading ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                    <span className="text-gray-600">
                      Loading approved productions...
                    </span>
                  </div>
                ) : (
                  groupApprovalsByProject().map((project) => {
                    const firstApproval = project.approvals[0];
                    const allMaterials = project.approvals.flatMap(
                      (a) => a.verification?.receipt?.received_materials || []
                    );
                    const displayMaterials = allMaterials.slice(0, 3);
                    const remainingCount = allMaterials.length - 3;

                    return (
                      <div
                        key={project.projectKey}
                        className="bg-white rounded-lg border border-gray-200 hover:border-green-400 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                      >
                        {/* Project Header */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-white">
                                  {project.projectName}
                                </h3>
                                <span className="bg-white text-blue-600 px-2.5 py-0.5 rounded text-xs font-bold">
                                  {project.salesOrderNumber}
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded text-xs font-medium">
                                  {project.approvals.length} approval
                                  {project.approvals.length > 1 ? "s" : ""}
                                </span>
                                {/* Production Status Badge */}
                                {project.productionStatus && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                                      project.productionStatus.status ===
                                      "ready"
                                        ? "bg-green-100 text-green-800"
                                        : project.productionStatus.status ===
                                          "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : project.productionStatus.status ===
                                          "in_progress"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {project.productionStatus.status ===
                                      "ready" && <FaPlay className="text-xs" />}
                                    {project.productionStatus.status ===
                                      "pending" && (
                                      <FaClock className="text-xs" />
                                    )}
                                    {project.productionStatus.status ===
                                      "in_progress" && (
                                      <FaCog className="text-xs" />
                                    )}
                                    {project.productionStatus.status ===
                                      "completed" && (
                                      <FaCheckCircle className="text-xs" />
                                    )}
                                    {project.productionStatus.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-blue-100 mt-2">
                                👤 {project.customerName}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  project.productionStatus?.status === "ready"
                                ) {
                                  handleStartProductionProject(project);
                                } else if (
                                  project.productionStatus?.status ===
                                  "in_progress"
                                ) {
                                  const relatedOrder = orders.find(
                                    (o) =>
                                      o.sales_order_id === project.salesOrderId
                                  );
                                  if (relatedOrder) {
                                    handleView(relatedOrder);
                                  }
                                }
                              }}
                              disabled={
                                project.productionStatus?.status !== "ready" &&
                                project.productionStatus?.status !==
                                  "in_progress"
                              }
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap shadow-sm ${
                                project.productionStatus?.status === "ready"
                                  ? "bg-white hover:bg-blue-50 text-blue-600 hover:shadow-md cursor-pointer"
                                  : project.productionStatus?.status ===
                                    "in_progress"
                                  ? "bg-orange-100 hover:bg-orange-200 text-orange-700 hover:shadow-md cursor-pointer"
                                  : "bg-gray-200 text-gray-500 cursor-not-allowed opacity-60"
                              }`}
                              title={
                                project.productionStatus?.status === "ready"
                                  ? "Start a new production order"
                                  : project.productionStatus?.status ===
                                    "in_progress"
                                  ? "View existing production order"
                                  : project.productionStatus?.status ===
                                    "completed"
                                  ? "This project is already completed"
                                  : "Production already started"
                              }
                            >
                              {project.productionStatus?.status === "ready" && (
                                <>
                                  <FaPlay className="text-sm" />
                                  Start Production
                                </>
                              )}
                              {project.productionStatus?.status ===
                                "in_progress" && (
                                <>
                                  <FaEye className="text-sm" />
                                  View Production
                                </>
                              )}
                              {project.productionStatus?.status ===
                                "pending" && (
                                <>
                                  <FaClock className="text-sm" />
                                  Pending Start
                                </>
                              )}
                              {project.productionStatus?.status ===
                                "completed" && (
                                <>
                                  <FaCheckCircle className="text-sm" />
                                  Completed
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Approvals List */}
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                          <div className="space-y-2">
                            {project.approvals.map((approval, idx) => {
                              const approvalStatus =
                                getApprovalProductionStatus(approval);
                              return (
                                <div
                                  key={approval.id}
                                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-mono text-gray-500">
                                        #{idx + 1}
                                      </span>
                                      <span className="font-semibold text-gray-900">
                                        {approval.approval_number}
                                      </span>
                                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                                        <FaCheckCircle className="text-xs" />✓
                                        Approved
                                      </span>
                                      {/* Approval Production Status Badge */}
                                      {approvalStatus && (
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                            approvalStatus.status ===
                                            "in_progress"
                                              ? "bg-orange-100 text-orange-700"
                                              : approvalStatus.status ===
                                                "completed"
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {approvalStatus.status ===
                                            "in_progress" && (
                                            <FaCog className="text-xs" />
                                          )}
                                          {approvalStatus.status ===
                                            "completed" && (
                                            <FaCheckCircle className="text-xs" />
                                          )}
                                          {approvalStatus.status !==
                                            "in_progress" &&
                                            approvalStatus.status !==
                                              "completed" && (
                                              <FaClock className="text-xs" />
                                            )}
                                          {approvalStatus.label}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      By {approval.approver?.name || "Unknown"}{" "}
                                      •{" "}
                                      {new Date(
                                        approval.approved_at
                                      ).toLocaleDateString()}
                                      {approvalStatus && (
                                        <span className="ml-2 text-blue-600 font-medium">
                                          → Order: {approvalStatus.orderNumber}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (
                                        approvalStatus &&
                                        approvalStatus.orderId
                                      ) {
                                        // View the linked production order
                                        const linkedOrder = orders.find(
                                          (o) => o.id === approvalStatus.orderId
                                        );
                                        if (linkedOrder)
                                          handleView(linkedOrder);
                                      } else {
                                        // View approval details
                                        handleViewApprovalDetails(approval.id);
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ml-2 ${
                                      approvalStatus
                                        ? "bg-orange-100 hover:bg-orange-200 text-orange-700"
                                        : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                                    }`}
                                  >
                                    {approvalStatus ? (
                                      <>
                                        <FaEye className="text-xs" />
                                        View Order
                                      </>
                                    ) : (
                                      <>
                                        <FaEye className="text-xs" />
                                        View
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Materials Summary */}
                        <div className="px-5 py-3 bg-gradient-to-b from-gray-50 to-white">
                          <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                            📦 Materials ({allMaterials.length} total)
                          </p>
                          <div className="space-y-1">
                            {displayMaterials.map((mat, idx) => (
                              <div
                                key={idx}
                                className="text-xs text-gray-600 flex items-start gap-2"
                              >
                                <span className="text-green-500 font-bold mt-0.5">
                                  •
                                </span>
                                <span>
                                  {mat.material_name}{" "}
                                  <span className="text-gray-400">
                                    ({mat.quantity_received} {mat.unit})
                                  </span>
                                </span>
                              </div>
                            ))}
                            {remainingCount > 0 && (
                              <div className="text-xs text-blue-600 font-semibold mt-1 pl-4">
                                +{remainingCount} more material
                                {remainingCount > 1 ? "s" : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Existing Production Orders Section */}
      <div className="mb-8">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FaList className="text-teal-600" />
            Existing Production Orders
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            View and manage all production orders
          </p>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  Total Orders
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.total}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FaBox size={22} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  Pending
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.pending}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <FaClock size={22} className="text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  In Progress
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.inProgress}
                </p>
              </div>
              <div className="bg-teal-100 p-3 rounded-lg">
                <FaCog size={22} className="text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  Completed
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.completed}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FaCheckCircle size={22} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">
                  Urgent
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {summary.urgent}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <FaFire size={22} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by order number or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-900 placeholder-slate-400"
              />
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={16}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div
                className="relative column-menu-container"
                ref={columnMenuRef}
              >
                <button
                  type="button"
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 whitespace-nowrap transition-all duration-200"
                >
                  <FaColumns className="h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </button>

                {showColumnMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-3">
                      <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Show/Hide Columns
                        </span>
                      </div>
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {AVAILABLE_COLUMNS.map((column) => (
                          <label
                            key={column.id}
                            className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-sm transition ${
                              column.alwaysVisible
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isColumnVisible(column.id)}
                              onChange={() => toggleColumn(column.id)}
                              disabled={column.alwaysVisible}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className="text-gray-700">
                              {column.label}
                            </span>
                            {column.alwaysVisible && (
                              <span className="ml-auto text-xs text-gray-400">
                                (Required)
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2 border-t border-gray-200 pt-3">
                        <button
                          type="button"
                          onClick={showAllColumns}
                          className="flex-1 rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Show All
                        </button>
                        <button
                          type="button"
                          onClick={resetColumns}
                          className="flex-1 rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <FaFilter size={16} />
                <span className="hidden sm:inline">Filters</span>
                <FaChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-200 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>

              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setSearchTerm("");
                }}
                className="md:col-span-2 lg:col-span-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <FaExclamationCircle className="mx-auto text-5xl text-slate-300 mb-4" />
            <p className="text-slate-600 font-medium">
              No Production Orders Found
            </p>
            <p className="text-sm text-slate-500 mt-2">
              {searchTerm ||
              statusFilter !== "all" ||
              priorityFilter !== "all" ||
              dateFrom ||
              dateTo
                ? "Try adjusting your filters or search terms"
                : "Start by creating a new production order"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {isColumnVisible("order_number") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Order Number
                      </th>
                    )}
                    {isColumnVisible("product") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Product
                      </th>
                    )}
                    {isColumnVisible("quantity") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Quantity
                      </th>
                    )}
                    {isColumnVisible("progress") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Progress
                      </th>
                    )}
                    {isColumnVisible("start_date") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Start Date
                      </th>
                    )}
                    {isColumnVisible("end_date") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        End Date
                      </th>
                    )}
                    {isColumnVisible("priority") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Priority
                      </th>
                    )}
                    {isColumnVisible("status") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Status
                      </th>
                    )}
                    {isColumnVisible("actions") && (
                      <th className="px-6 py-3 text-left font-semibold text-slate-900">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors duration-150"
                    >
                      {isColumnVisible("order_number") && (
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {order.orderNumber}
                        </td>
                      )}
                      {isColumnVisible("product") && (
                        <td className="px-6 py-3 text-slate-700">
                          {order.productName}
                        </td>
                      )}
                      {isColumnVisible("quantity") && (
                        <td className="px-6 py-3 text-slate-700">
                          {order.quantity} units
                        </td>
                      )}
                      {isColumnVisible("progress") && (
                        <td className="px-6 py-3">
                          <div className="space-y-2">
                            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  getProgress(order.produced, order.quantity) >
                                  80
                                    ? "bg-green-500"
                                    : getProgress(
                                        order.produced,
                                        order.quantity
                                      ) > 50
                                    ? "bg-amber-400"
                                    : "bg-teal-500"
                                }`}
                                style={{
                                  width: `${getProgress(
                                    order.produced,
                                    order.quantity
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-600">
                              {order.produced}/{order.quantity} (
                              {Math.round(
                                getProgress(order.produced, order.quantity)
                              )}
                              %)
                            </span>
                          </div>
                        </td>
                      )}
                      {isColumnVisible("start_date") && (
                        <td className="px-6 py-3 text-slate-700 text-sm">
                          {new Date(order.startDate).toLocaleDateString()}
                        </td>
                      )}
                      {isColumnVisible("end_date") && (
                        <td className="px-6 py-3 text-slate-700 text-sm">
                          {new Date(order.endDate).toLocaleDateString()}
                        </td>
                      )}
                      {isColumnVisible("priority") && (
                        <td className="px-6 py-3">
                          {getPriorityBadge(order.priority)}
                        </td>
                      )}
                      {isColumnVisible("status") && (
                        <td className="px-6 py-3">
                          {getStatusBadge(order.status)}
                        </td>
                      )}
                      {isColumnVisible("actions") && (
                        <td className="px-4 py-3">
                          <ActionDropdown
                            order={order}
                            onView={handleView}
                            onEdit={handleEdit}
                            onStart={handleStart}
                            onStop={handleStop}
                            onDelete={handleDelete}
                            permissionKeys={permissionKeys}
                            hasPermission={hasPermission}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <PermissionGate
        required={permissionKeys.createOrder}
        fallback={
          <button
            className="fixed bottom-6 right-6 bg-gray-300 text-gray-600 rounded-full p-4 shadow-lg flex items-center justify-center cursor-not-allowed"
            type="button"
            title="Insufficient permission"
            onClick={() =>
              toast.error(
                "You do not have permission to create production orders."
              )
            }
          >
            <FaPlus />
          </button>
        }
      >
        <button
          className="fixed bottom-6 right-6 bg-primary text-white rounded-full p-4 shadow-lg flex items-center justify-center hover:bg-primary-dark"
          onClick={handleCreate}
          title="Create Order"
        >
          <FaPlus />
        </button>
      </PermissionGate>

      {/* Create/Edit Dialog */}
      {(createDialogOpen || editDialogOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              {createDialogOpen
                ? "Create Production Order"
                : "Edit Production Order"}
            </h2>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderForm.orderNumber}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, orderNumber: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderForm.productId}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, productId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={productsLoading}
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {productsLoading && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loading products...
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderForm.quantity}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, quantity: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  value={orderForm.priority}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, priority: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={orderForm.startDate}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, startDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={orderForm.endDate}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, endDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </form>
            <div className="flex justify-end gap-3 mt-8">
              <button
                className="px-5 py-2.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setSelectedOrder(null);
                  setOrderForm({
                    orderNumber: "",
                    productName: "",
                    quantity: "",
                    startDate: "",
                    endDate: "",
                    priority: "medium",
                  });
                }}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                onClick={handleSaveOrder}
              >
                {createDialogOpen ? "Create" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Dialog */}
      {viewDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">
              Production Order Details
            </h2>
            {selectedOrder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Order Number:</span>{" "}
                  {selectedOrder.orderNumber}
                </div>
                <div>
                  <span className="font-semibold">Product:</span>{" "}
                  {selectedOrder.productName}
                </div>
                <div>
                  <span className="font-semibold">Quantity:</span>{" "}
                  {selectedOrder.quantity}
                </div>
                <div>
                  <span className="font-semibold">Produced:</span>{" "}
                  {selectedOrder.produced}
                </div>
                <div>
                  <span className="font-semibold">Start Date:</span>{" "}
                  {selectedOrder.startDate}
                </div>
                <div>
                  <span className="font-semibold">End Date:</span>{" "}
                  {selectedOrder.endDate}
                </div>
                <div>
                  <span className="font-semibold">Priority:</span>{" "}
                  {selectedOrder.priority}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedOrder.status}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => {
                  setViewDialogOpen(false);
                  setSelectedOrder(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {alert.open && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className={`px-4 py-2 rounded shadow text-white ${
              alert.severity === "success"
                ? "bg-green-500"
                : alert.severity === "error"
                ? "bg-red-500"
                : "bg-primary"
            }`}
          >
            {alert.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionOrdersPage;
