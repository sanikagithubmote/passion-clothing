import React, { useState, useEffect } from "react";
import {
  FileText,
  Factory,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  Package,
} from "lucide-react";

/**
 * ActivityFeed Component
 * Displays recent activities with modern design and proper formatting
 */
const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    const iconProps = "w-6 h-6";
    const iconMap = {
      invoice: (
        <div className="p-2.5 bg-blue-100 rounded-lg">
          <FileText className={`${iconProps} text-blue-600`} />
        </div>
      ),
      manufacturing: (
        <div className="p-2.5 bg-purple-100 rounded-lg">
          <Factory className={`${iconProps} text-purple-600`} />
        </div>
      ),
      shipment: (
        <div className="p-2.5 bg-orange-100 rounded-lg">
          <Truck className={`${iconProps} text-orange-600`} />
        </div>
      ),
      delivered: (
        <div className="p-2.5 bg-green-100 rounded-lg">
          <CheckCircle className={`${iconProps} text-green-600`} />
        </div>
      ),
    };
    return (
      iconMap[type] || (
        <div className="p-2.5 bg-gray-100 rounded-lg">
          <AlertCircle className={`${iconProps} text-gray-600`} />
        </div>
      )
    );
  };

  const getDepartmentColor = (department) => {
    const colorMap = {
      sales: "bg-blue-50 border-blue-200 text-blue-700",
      procurement: "bg-purple-50 border-purple-200 text-purple-700",
      logistics: "bg-orange-50 border-orange-200 text-orange-700",
      manufacturing: "bg-indigo-50 border-indigo-200 text-indigo-700",
    };
    return colorMap[department] || "bg-gray-50 border-gray-200 text-gray-700";
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No recent activities</p>
        <p className="text-gray-400 text-sm mt-1">
          Activities will appear here as orders progress
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all group"
        >
          <div className="flex gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {activity.message}
                  </p>
                </div>
                {/* Amount Badge */}
                {activity.amount && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">
                      ₹ {activity.amount.toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">Amount</p>
                  </div>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {/* Order Number */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 group-hover:bg-gray-200 transition-colors">
                  <span className="text-gray-500">#</span>
                  {activity.orderNumber}
                </span>

                {/* Department Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${getDepartmentColor(
                    activity.department
                  )} transition-colors`}
                >
                  <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                  {activity.department.charAt(0).toUpperCase() +
                    activity.department.slice(1)}
                </span>
              </div>

              {/* Date and Time */}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(activity.date)}
                </div>
                {formatTime(activity.date) && (
                  <>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatTime(activity.date)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * OrderTracking Component
 * Displays order progress with timeline visualization
 */
const OrderTracking = ({ stages = [], orderInfo = {} }) => {
  const getStageStatus = (stage) => {
    if (stage.status === "completed") return "completed";
    if (stage.status === "in_progress") return "in_progress";
    return "pending";
  };

  const getStageColor = (status) => {
    const colorMap = {
      completed:
        "bg-gradient-to-br from-green-50 to-green-100 border border-green-200",
      in_progress:
        "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200",
      pending:
        "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200",
    };
    return colorMap[status] || colorMap.pending;
  };

  const getProgressPercentage = () => {
    if (!stages || stages.length === 0) return 0;
    const completedCount = stages.filter(
      (s) => getStageStatus(s) === "completed"
    ).length;
    return Math.round((completedCount / stages.length) * 100);
  };

  if (!orderInfo.orderNumber) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <p>No order tracking data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
            Order Number
          </p>
          <p className="text-base font-bold text-gray-900 font-mono">
            {orderInfo.orderNumber}
          </p>
        </div>

        <div className="p-3.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
            Customer
          </p>
          <p className="text-base font-semibold text-gray-900 truncate">
            {orderInfo.customer}
          </p>
        </div>

        <div className="p-3.5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">
            Product
          </p>
          <p className="text-base font-semibold text-gray-900 truncate">
            {orderInfo.product}
          </p>
        </div>

        <div className="p-3.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">
            Expected Delivery
          </p>
          <p className="text-base font-bold text-blue-900">
            {orderInfo.deliveryDate}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">
            Overall Progress
          </h4>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {getProgressPercentage()}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Timeline */}
      {stages && stages.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-6">
            Order Timeline
          </h4>
          <div className="relative">
            {/* Timeline Container */}
            <div className="flex items-center justify-between gap-2">
              {stages.map((stage, index) => {
                const status = getStageStatus(stage);
                const isLast = index === stages.length - 1;

                return (
                  <div key={stage.id || index} className="flex-1">
                    <div className="flex flex-col items-center">
                      {/* Stage Circle */}
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                          status === "completed"
                            ? "border-green-400 bg-green-50"
                            : status === "in_progress"
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-300 bg-gray-50"
                        } transition-all shadow-sm`}
                      >
                        {status === "completed" ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : status === "in_progress" ? (
                          <div className="animate-pulse">
                            <Clock className="w-6 h-6 text-blue-600" />
                          </div>
                        ) : (
                          <Clock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Stage Label */}
                      <p className="mt-3 text-xs font-semibold text-gray-900 text-center px-1 leading-tight">
                        {stage.label}
                      </p>

                      {/* Stage Date */}
                      <p className="mt-1 text-xs text-gray-500 text-center">
                        {stage.date || "-"}
                      </p>

                      {/* Status Badge */}
                      <div
                        className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                          status === "completed"
                            ? "bg-green-100 text-green-700"
                            : status === "in_progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status === "completed"
                          ? "Done"
                          : status === "in_progress"
                          ? "In Progress"
                          : "Pending"}
                      </div>
                    </div>

                    {/* Connecting Line */}
                    {!isLast && (
                      <div
                        className={`h-1 mx-auto mt-4 transition-all ${
                          status === "completed"
                            ? "bg-gradient-to-r from-green-400 to-green-300 w-full"
                            : status === "in_progress"
                            ? "bg-gradient-to-r from-blue-400 to-blue-300 w-full"
                            : "bg-gradient-to-r from-gray-300 to-gray-200 w-full"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SalesDashboardActivityTracking Component
 * Main dashboard component combining recent activities and order tracking
 * Modern, professional UI with complete data integration
 */
const SalesDashboardActivityTracking = () => {
  const [recentActivities, setRecentActivities] = useState([]);
  const [orderTrackingData, setOrderTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activities"); // 'activities' or 'tracking'

  // Initialize with sample data
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      // Sample Recent Activities - demonstrating different activity types
      const sampleActivities = [
        {
          id: 1,
          type: "invoice",
          message: "Invoice INV-20251103-0006-v4 has been created",
          orderNumber: "SO-20251103-0001",
          department: "sales",
          date: new Date(2025, 10, 15, 14, 32),
          amount: 11800,
        },
        {
          id: 2,
          type: "manufacturing",
          message: "Manufacturing started for order SO-20251103-0001",
          orderNumber: "SO-20251103-0001",
          department: "manufacturing",
          date: new Date(2025, 10, 12, 9, 15),
          amount: 11800,
        },
        {
          id: 3,
          type: "shipment",
          message: "Shipment dispatched from warehouse",
          orderNumber: "SO-20251103-0001",
          department: "logistics",
          date: new Date(2025, 10, 14, 16, 45),
          amount: 11800,
        },
        {
          id: 4,
          type: "delivered",
          message: "Order delivered to customer",
          orderNumber: "SO-20251102-0005",
          department: "sales",
          date: new Date(2025, 10, 10, 11, 20),
          amount: 8950,
        },
        {
          id: 5,
          type: "invoice",
          message: "Invoice INV-20251102-0005-v1 has been created",
          orderNumber: "SO-20251102-0005",
          department: "sales",
          date: new Date(2025, 10, 8, 10, 0),
          amount: 8950,
        },
        {
          id: 6,
          type: "manufacturing",
          message: "Production completed - ready for shipment",
          orderNumber: "SO-20251102-0004",
          department: "manufacturing",
          date: new Date(2025, 10, 7, 15, 30),
          amount: 15420,
        },
      ];

      // Sample Order Tracking Data
      const sampleOrderTracking = {
        orderNumber: "SO-20251103-0001",
        customer: "Sanika Shankar Mote",
        product: "Chicken Roll (20 qty)",
        deliveryDate: "18-Nov-2025",
        revenue: 11800,
        stages: [
          {
            id: 1,
            label: "Draft",
            status: "completed",
            date: "03-Nov-2025",
          },
          {
            id: 2,
            label: "Manufacturing",
            status: "completed",
            date: "10-Nov-2025",
          },
          {
            id: 3,
            label: "Shipment",
            status: "in_progress",
            date: "14-Nov-2025",
          },
          {
            id: 4,
            label: "Delivered",
            status: "pending",
            date: null,
          },
        ],
      };

      setRecentActivities(sampleActivities);
      setOrderTrackingData(sampleOrderTracking);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-1">
            Fetching recent activities and order tracking
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sales Dashboard
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Recent Activity &amp; Order Tracking
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("activities")}
            className={`py-3 px-4 font-medium text-sm transition-all border-b-2 ${
              activeTab === "activities"
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activities
            </div>
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={`py-3 px-4 font-medium text-sm transition-all border-b-2 ${
              activeTab === "tracking"
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Order Tracking
            </div>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "activities" ? (
              // Recent Activities Tab
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recent Activities
                  </h2>
                  <span className="ml-auto inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    <Activity className="w-3.5 h-3.5" />
                    {recentActivities.length} activities
                  </span>
                </div>
                <ActivityFeed activities={recentActivities} />
              </div>
            ) : (
              // Order Tracking Tab
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Order Tracking
                  </h2>
                </div>
                <OrderTracking
                  stages={orderTrackingData?.stages || []}
                  orderInfo={orderTrackingData || {}}
                />
              </div>
            )}
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-4">
            {/* Revenue Card */}
            <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-blue-900">
                  Total Revenue
                </p>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-900 mb-2">₹ 32,550</p>
              <div className="flex items-center gap-1 text-xs text-blue-700 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+15.3% vs last month</span>
              </div>
            </div>

            {/* Active Orders Card */}
            <div className="bg-gradient-to-br from-amber-50 via-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-amber-900">
                  Active Orders
                </p>
                <div className="p-2 bg-amber-200 rounded-lg">
                  <Package className="w-5 h-5 text-amber-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-900 mb-2">8</p>
              <p className="text-xs text-amber-700">
                <span className="font-medium">3 pending</span> approval
              </p>
            </div>

            {/* Completed Orders Card */}
            <div className="bg-gradient-to-br from-green-50 via-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-green-900">
                  Completed This Month
                </p>
                <div className="p-2 bg-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-green-900 mb-2">24</p>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                  style={{ width: "78%" }}
                ></div>
              </div>
              <p className="text-xs text-green-700 mt-2 font-medium">
                78% of monthly target
              </p>
            </div>

            {/* Pending Actions Card */}
            <div className="bg-gradient-to-br from-red-50 via-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-red-900">
                  Pending Actions
                </p>
                <div className="p-2 bg-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-red-900 mb-2">5</p>
              <p className="text-xs text-red-700">
                <span className="font-medium">2 urgent</span> approvals needed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export components individually for flexibility
export { ActivityFeed, OrderTracking };

// Export main component as default
export default SalesDashboardActivityTracking;
