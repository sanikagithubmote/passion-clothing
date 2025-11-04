# Sales Dashboard – Implementation Examples

## 📌 Real-World Integration Examples

### Example 1: Add as Tab in Existing SalesOrdersPage

**File**: `client/src/pages/sales/SalesOrdersPage.jsx`

```jsx
// Import the new component at the top
import SalesDashboard from "../../components/pages/sales/SalesDashboardRecentActivity";

// In your component state (around line 87):
const [activeTab, setActiveTab] = useState("orders"); // Change default to "orders"

// Find the main header section and modify it:
<div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white px-6 py-3.5 shadow-md">
  <div className="max-w-7xl mx-auto">
    {/* Header content */}
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-xl font-semibold">Sales Orders</h1>
      <button
        onClick={() => navigate("/sales/orders/create")}
        className="px-4 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-md font-medium flex items-center gap-2 text-sm"
      >
        <FaPlus size={14} />
        Create Order
      </button>
    </div>

    {/* Tab Navigation */}
    <div className="flex gap-2 border-b border-white/30">
      <button
        onClick={() => setActiveTab("orders")}
        className={`px-4 py-2 font-medium text-sm transition-all ${
          activeTab === "orders"
            ? "text-white border-b-2 border-white"
            : "text-blue-100 hover:text-white"
        }`}
      >
        All Orders
      </button>
      <button
        onClick={() => setActiveTab("dashboard")}
        className={`px-4 py-2 font-medium text-sm transition-all flex items-center gap-2 ${
          activeTab === "dashboard"
            ? "text-white border-b-2 border-white"
            : "text-blue-100 hover:text-white"
        }`}
      >
        <FaChartBar size={14} />
        Recent Activity & Tracking
      </button>
    </div>
  </div>
</div>

// In the main content area, replace the rendering logic:
<div className="max-w-7xl mx-auto px-6 py-3">
  {/* Show dashboard tab */}
  {activeTab === "dashboard" && (
    <SalesDashboard />
  )}

  {/* Show orders tab */}
  {activeTab === "orders" && (
    <>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* ... existing summary cards */}
        </div>
      )}

      {/* Rest of existing orders content */}
      {/* Filters, table/cards/kanban view, etc. */}
    </>
  )}
</div>
```

### Example 2: Create New Dedicated Dashboard Page

**File**: `client/src/pages/sales/SalesDashboardPage.jsx` (already created)

**Update Routes** in your routing configuration:

```jsx
// In your routing file (e.g., App.js, router.js, etc.)
import SalesDashboardPage from "./pages/sales/SalesDashboardPage";

const routes = [
  {
    path: "/sales",
    children: [
      {
        path: "orders",
        element: <SalesOrdersPage />,
        requiredPermission: "view_sales_orders",
      },
      {
        path: "dashboard", // NEW ROUTE
        element: <SalesDashboardPage />,
        requiredPermission: "view_sales_dashboard",
      },
      {
        path: "orders/create",
        element: <CreateSalesOrderPage />,
        requiredPermission: "create_sales_order",
      },
      // ... other routes
    ],
  },
];
```

### Example 3: API Integration with Real Data

**File**: `client/src/components/pages/sales/SalesDashboardRecentActivity.jsx`

Replace the `useEffect` hook with real API calls:

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // Method 1: Fetch activities and tracking separately
      const activitiesRes = await api.get("/sales/activities/recent?limit=10");
      const trackingRes = await api.get("/sales/orders/latest-tracking");

      setRecentActivities(activitiesRes.data.activities || []);
      setOrderTrackingData(trackingRes.data.tracking || null);

      // Method 2: If using single endpoint that returns both
      // const res = await api.get("/sales/dashboard");
      // setRecentActivities(res.data.activities);
      // setOrderTrackingData(res.data.tracking);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Keep sample data as fallback on error
      // Or show error message:
      // setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  fetchData();

  // Optional: Refresh data every 30 seconds
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

### Example 4: Connect to Navigation Menu

**File**: `client/src/components/layout/Sidebar.js`

```jsx
// Add import
import { FileText } from "lucide-react";
// or
import { FaChartBar } from "react-icons/fa";

// In your menu items:
const menuItems = [
  {
    label: "Sales",
    icon: FaShoppingCart,
    children: [
      {
        label: "Dashboard",
        path: "/sales/dashboard",
        icon: FaChartBar,
        requiredPermission: "view_sales_dashboard",
      },
      {
        label: "Orders",
        path: "/sales/orders",
        icon: FaClipboardList,
        requiredPermission: "view_sales_orders",
      },
      {
        label: "Create Order",
        path: "/sales/orders/create",
        icon: FaPlus,
        requiredPermission: "create_sales_order",
      },
      // ... other menu items
    ],
  },
];
```

### Example 5: Backend API Endpoints

**File**: `server/routes/sales.js`

```javascript
// New endpoints to support the dashboard

// GET /sales/activities/recent
// Returns recent activities (invoices, manufacturing, shipments, deliveries)
router.get("/activities/recent", async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    // Fetch invoices
    const invoices = await Invoice.findAll({
      limit: Math.ceil(limit / 4),
      order: [["createdAt", "DESC"]],
      include: [{ model: SalesOrder, attributes: ["id", "order_number"] }],
    });

    // Fetch production orders
    const productions = await ProductionOrder.findAll({
      limit: Math.ceil(limit / 4),
      order: [["createdAt", "DESC"]],
      include: [{ model: SalesOrder, attributes: ["id", "order_number"] }],
    });

    // Fetch shipments
    const shipments = await Shipment.findAll({
      limit: Math.ceil(limit / 4),
      order: [["createdAt", "DESC"]],
      include: [{ model: SalesOrder, attributes: ["id", "order_number"] }],
    });

    // Transform and combine
    const activities = [];

    invoices.forEach((inv) => {
      activities.push({
        type: "invoice",
        message: `Invoice ${inv.invoice_number} has been created`,
        orderNumber: inv.SalesOrder?.order_number,
        department: "sales",
        date: inv.createdAt,
        amount: inv.total_amount,
      });
    });

    productions.forEach((prod) => {
      activities.push({
        type: "manufacturing",
        message: `Manufacturing started for ${prod.SalesOrder?.order_number}`,
        orderNumber: prod.SalesOrder?.order_number,
        department: "manufacturing",
        date: prod.createdAt,
        amount: prod.SalesOrder?.total_amount,
      });
    });

    shipments.forEach((ship) => {
      activities.push({
        type: "shipment",
        message: `Shipment dispatched from warehouse`,
        orderNumber: ship.SalesOrder?.order_number,
        department: "logistics",
        date: ship.dispatched_at || ship.createdAt,
        amount: ship.SalesOrder?.total_amount,
      });
    });

    // Sort by date and limit
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    activities.splice(limit);

    res.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

// GET /sales/orders/latest-tracking
// Returns the most recent order with full tracking timeline
router.get("/orders/latest-tracking", async (req, res) => {
  try {
    const order = await SalesOrder.findOne({
      order: [["createdAt", "DESC"]],
      include: [
        { model: Customer, attributes: ["name"] },
        { model: ProductionOrder, attributes: ["status", "created_at"] },
        {
          model: Shipment,
          attributes: ["status", "dispatched_at", "delivered_at"],
        },
      ],
    });

    if (!order) {
      return res.json({ tracking: null });
    }

    // Determine stage statuses
    const stages = [
      {
        id: 1,
        label: "Draft",
        status: order.status === "draft" ? "in_progress" : "completed",
        date: order.order_date,
      },
      {
        id: 2,
        label: "Manufacturing",
        status: !order.ProductionOrder
          ? "pending"
          : order.ProductionOrder.status === "completed"
          ? "completed"
          : "in_progress",
        date: order.ProductionOrder?.created_at,
      },
      {
        id: 3,
        label: "Shipment",
        status: !order.Shipment
          ? "pending"
          : order.Shipment.status === "delivered"
          ? "completed"
          : "in_progress",
        date: order.Shipment?.dispatched_at,
      },
      {
        id: 4,
        label: "Delivered",
        status: order.Shipment?.delivered_at ? "completed" : "pending",
        date: order.Shipment?.delivered_at,
      },
    ];

    const tracking = {
      orderNumber: order.order_number,
      customer: order.Customer?.name || "N/A",
      product: order.items?.[0]?.product_type || "Product",
      deliveryDate: order.delivery_date?.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      stages: stages.map((stage) => ({
        ...stage,
        date: stage.date
          ? new Date(stage.date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null,
      })),
    };

    res.json({ tracking });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    res.status(500).json({ message: "Failed to fetch tracking" });
  }
});

// GET /sales/dashboard/stats (Optional - for quick stats)
router.get("/dashboard/stats", async (req, res) => {
  try {
    const total = await SalesOrder.count();
    const revenue = await sequelize.query(
      `SELECT SUM(total_amount) as total FROM sales_orders WHERE DATE(created_at) >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );
    const pending = await SalesOrder.count({
      where: { status: { [Op.in]: ["pending", "confirmed"] } },
    });

    res.json({
      stats: {
        totalRevenue: revenue[0][0]?.total || 0,
        ordersThisWeek: total,
        pendingDeliveries: pending,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});
```

### Example 6: Data Transformation Utility

**File**: `client/src/utils/dashboardTransformers.js`

```jsx
/**
 * Transform API activity data to component format
 */
export const transformActivity = (activity) => {
  return {
    id: activity.id,
    type: mapActivityType(activity.type),
    message: activity.message || activity.description,
    orderNumber: activity.order_number || activity.linkedOrder,
    department: activity.department?.toLowerCase() || "sales",
    date: new Date(activity.created_at || activity.date),
    amount: activity.amount || activity.total_amount,
  };
};

export const mapActivityType = (type) => {
  const typeMap = {
    invoice: "invoice",
    production: "manufacturing",
    production_order: "manufacturing",
    shipment: "shipment",
    delivery: "delivered",
    dispatch: "shipment",
  };
  return typeMap[type] || type;
};

/**
 * Transform API tracking data to component format
 */
export const transformTracking = (apiTracking) => {
  return {
    orderNumber: apiTracking.order_number,
    customer: apiTracking.customer_name,
    product: apiTracking.product_name,
    deliveryDate: formatDate(apiTracking.delivery_date),
    stages: apiTracking.stages?.map((stage) => ({
      id: stage.id,
      label: stage.label,
      status: mapStageStatus(stage.status),
      date: formatDate(stage.date),
    })),
  };
};

export const mapStageStatus = (status) => {
  const statusMap = {
    completed: "completed",
    done: "completed",
    in_progress: "in_progress",
    active: "in_progress",
    pending: "pending",
    waiting: "pending",
  };
  return statusMap[status] || status;
};

export const formatDate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
};
```

### Example 7: Using the Transformer in Component

```jsx
import {
  transformActivity,
  transformTracking,
} from "../../utils/dashboardTransformers";

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      const [activitiesRes, trackingRes] = await Promise.all([
        api.get("/sales/activities/recent?limit=10"),
        api.get("/sales/orders/latest-tracking"),
      ]);

      // Transform data using utilities
      const transformed = activitiesRes.data.activities.map(transformActivity);
      setRecentActivities(transformed);

      if (trackingRes.data.tracking) {
        setOrderTrackingData(transformTracking(trackingRes.data.tracking));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

---

**Quick Reference**

- ✅ Tab Integration: Example 1
- ✅ Dedicated Page: Example 2
- ✅ API Setup: Example 5
- ✅ Frontend Integration: Example 3
- ✅ Navigation: Example 4
- ✅ Data Transformation: Examples 6 & 7

---

**Last Updated**: 2025-01-16
**Version**: 1.0.0
