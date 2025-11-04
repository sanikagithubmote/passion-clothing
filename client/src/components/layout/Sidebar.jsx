import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Building,
  Receipt,
  Package,
  Bell,
  Factory,
  Clock,
  Microscope,
  Truck,
  Store,
  DollarSign,
  User,
  Shield,
  Settings,
  Scan,
  CheckCircle,
  Send,
  Activity,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { useStore } from "../../contexts/StoreContext";
import api from "../../utils/api";

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

const Sidebar = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { openStockModal } = useStore();
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [pendingGRNCount, setPendingGRNCount] = useState(0);
  const [pendingMRNCount, setPendingMRNCount] = useState(0);

  // Fetch pending approvals count for procurement department
  useEffect(() => {
    if (user?.department === "procurement" || user?.department === "admin") {
      fetchPendingApprovalsCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchPendingApprovalsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.department]);

  // Fetch pending GRN requests count for inventory department
  useEffect(() => {
    if (user?.department === "inventory" || user?.department === "admin") {
      fetchPendingGRNCount();
      fetchPendingMRNCount();
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchPendingGRNCount();
        fetchPendingMRNCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.department]);

  const fetchPendingApprovalsCount = async () => {
    try {
      const response = await api.get("/procurement/pos", {
        params: { status: "pending_approval" },
      });
      const pos = response.data.purchaseOrders || response.data.pos || [];
      setPendingApprovalsCount(pos.length);
    } catch (error) {
      console.error("Error fetching pending approvals count:", error);
    }
  };

  const fetchPendingGRNCount = async () => {
    try {
      const response = await api.get("/inventory/grn-requests");
      const requests = response.data.requests || [];
      setPendingGRNCount(requests.length);
    } catch (error) {
      console.error("Error fetching pending GRN count:", error);
    }
  };

  const fetchPendingMRNCount = async () => {
    try {
      const response = await api.get(
        "/project-material-requests?status=pending_inventory_review"
      );
      const requests = response.data.requests || response.data.data || [];
      setPendingMRNCount(requests.length);
    } catch (error) {
      console.error("Error fetching pending MRN count:", error);
    }
  };

  const getDepartmentMenuItems = (department) => {
    const menuItems = {
      sales: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/sales",
        },
        {
          text: "Activity & Tracking",
          icon: <Activity size={18} />,
          path: "/sales/activity",
        },
        {
          text: "Sales Orders",
          icon: <ShoppingCart size={18} />,
          path: "/sales/orders",
        },
        {
          text: "Create Order",
          icon: <FileText size={18} />,
          path: "/sales/orders/create",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/sales/reports",
        },
      ],
      procurement: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/procurement",
        },
        {
          text: "Pending Approvals",
          icon: <CheckCircle size={18} />,
          path: "/procurement/pending-approvals",
          badge: pendingApprovalsCount,
        },
        {
          text: "Purchase Orders",
          icon: <ShoppingCart size={18} />,
          path: "/procurement/purchase-orders",
        },
        {
          text: "Material Requests",
          icon: <Send size={18} />,
          path: "/procurement/material-requests",
        },
        {
          text: "Vendors",
          icon: <Building size={18} />,
          path: "/procurement/vendors",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/procurement/reports",
        },
      ],
      challans: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/challans",
        },
        {
          text: "Challan Register",
          icon: <Receipt size={18} />,
          path: "/challans/register",
        },
        {
          text: "Create Challan",
          icon: <Receipt size={18} />,
          path: "/challans/create",
        },
      ],
      inventory: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/inventory",
        },
        {
          text: "Material Allocation",
          icon: <Package size={18} />,
          path: "/inventory/allocation",
        },
        {
          text: "Barcode Scanner",
          icon: <Scan size={18} />,
          path: "/inventory/scan",
        },
        {
          text: "Stock Management",
          icon: <FileText size={18} />,
          path: "/inventory/stock",
        },
        {
          text: "Goods Receipt (GRN)",
          icon: <Receipt size={18} />,
          path: "/inventory/grn",
          badge: pendingGRNCount,
        },
        {
          text: "Material Requests (MRN)",
          icon: <Send size={18} />,
          path: "/inventory/mrn-requests",
          badge: pendingMRNCount,
        },
        {
          text: "Stock Alerts",
          icon: <Bell size={18} />,
          path: "/inventory/alerts",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/inventory/reports",
        },
      ],
      manufacturing: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/manufacturing",
        },
        {
          text: "Production Orders",
          icon: <Factory size={18} />,
          path: "/manufacturing/orders",
        },
        {
          text: "Production Tracking",
          icon: <Clock size={18} />,
          path: "/manufacturing/tracking",
        },
        {
          text: "Material Requests (MRN)",
          icon: <Send size={18} />,
          path: "/manufacturing/material-requests",
        },
        {
          text: "Quality Control",
          icon: <Microscope size={18} />,
          path: "/manufacturing/quality",
        },
        {
          text: "Outsource Management",
          icon: <Truck size={18} />,
          path: "/manufacturing/outsource",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/manufacturing/reports",
        },
      ],
      outsourcing: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/outsourcing",
        },
        {
          text: "Outward Challans",
          icon: <Receipt size={18} />,
          path: "/outsourcing/outward",
        },
        {
          text: "Inward Challans",
          icon: <Receipt size={18} />,
          path: "/outsourcing/inward",
        },
        {
          text: "Vendor Tracking",
          icon: <Building size={18} />,
          path: "/outsourcing/tracking",
        },
      ],
      samples: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/samples",
        },
        {
          text: "Sample Orders",
          icon: <Microscope size={18} />,
          path: "/samples/orders",
        },
        {
          text: "Sample Tracking",
          icon: <Clock size={18} />,
          path: "/samples/tracking",
        },
        {
          text: "Conversion Reports",
          icon: <FileText size={18} />,
          path: "/samples/reports",
        },
      ],
      shipment: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/shipment",
        },
        {
          text: "Dispatch Orders",
          icon: <Truck size={18} />,
          path: "/shipment/dispatch",
        },
        {
          text: "Tracking",
          icon: <Clock size={18} />,
          path: "/shipment/tracking",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/shipment/reports",
        },
      ],
      store: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/store",
        },
        {
          text: "Stock Management",
          icon: <Store size={18} />,
          path: "/store/stock",
        },
        {
          text: "Sales Tracking",
          icon: <ShoppingCart size={18} />,
          path: "/store/sales",
        },
        {
          text: "Returns",
          icon: <Receipt size={18} />,
          path: "/store/returns",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/store/reports",
        },
      ],
      finance: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/finance",
        },
        {
          text: "Invoices",
          icon: <Receipt size={18} />,
          path: "/finance/invoices",
        },
        {
          text: "Payments",
          icon: <DollarSign size={18} />,
          path: "/finance/payments",
        },
        {
          text: "Reports",
          icon: <FileText size={18} />,
          path: "/finance/reports",
        },
      ],
      admin: [
        {
          text: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          path: "/admin",
        },
        {
          text: "User Management",
          icon: <User size={18} />,
          path: "/admin/users",
        },
        {
          text: "Role Management",
          icon: <Shield size={18} />,
          path: "/admin/roles",
        },
        {
          text: "Courier Agents",
          icon: <Truck size={18} />,
          path: "/admin/courier-agents",
        },
        {
          text: "System Config",
          icon: <Settings size={18} />,
          path: "/admin/config",
        },
      ],
    };

    return menuItems[department] || [];
  };

  const commonMenuItems = [
    { text: "Profile", icon: <User size={18} />, path: "/profile" },
    { text: "Attendance", icon: <Clock size={18} />, path: "/attendance" },
    { text: "Notifications", icon: <Bell size={18} />, path: "/notifications" },
  ];

  const departmentMenuItems = getDepartmentMenuItems(user?.department);

  const handleNavigation = (path) => {
    if (
      path === "/store/stock" &&
      user?.department === "store" &&
      openStockModal
    ) {
      openStockModal();
      return;
    }

    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  if (!user) {
    return null;
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white text-gray-800 transition-all duration-300 ease-in-out z-40 border-r border-gray-200 ${
        open ? "w-64" : "w-20"
      }`}
      style={{
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex flex-col h-full relative">
        {/* Header */}
        <div
          className={`flex items-center ${
            open ? "justify-between px-5" : "justify-center px-3"
          } px-6 py-4 border-b border-gray-200`}
        >
          {open && (
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-800">Passion ERP</h1>
              <p className="text-[10px] text-gray-500 tracking-wider uppercase">
                Management System
              </p>
            </div>
          )}
        </div>

        {/* User Profile */}

        {/* Scrollable Menu Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Department Menu */}
          <nav className={`${open ? "px-3" : "px-2"} py-4 space-y-1`}>
            {open && (
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Main Menu
                </p>
              </div>
            )}
            {departmentMenuItems.map((item) => (
              <button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                className={`group w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isActive(item.path) && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"></div>
                )}
                <span className="flex-shrink-0">{item.icon}</span>
                {open && (
                  <span className="text-sm truncate flex-1 text-left">
                    {item.text}
                  </span>
                )}
                {item.badge > 0 && (
                  <span
                    className={`${
                      open ? "relative" : "absolute top-1.5 right-1.5"
                    } bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mx-4 my-3 h-px bg-gray-200"></div>

          {/* Common Menu */}
          <nav className={`${open ? "px-3" : "px-2"} py-2 space-y-1`}>
            {open && (
              <div className="px-3 py-2 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Access
                </p>
              </div>
            )}
            {commonMenuItems.map((item) => (
              <button
                key={item.text}
                onClick={() => handleNavigation(item.path)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {open && <span className="text-sm truncate">{item.text}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="mx-4 my-2 h-px bg-gray-200"></div>

        {/* Logout */}
        <div className={`${open ? "px-3" : "px-2"} py-4 bg-gray-50`}>
          <button
            onClick={logout}
            className="group w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 border border-transparent"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {open && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default Sidebar;
