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
} from "lucide-react";
import api from "../../../utils/api";
import toast from "react-hot-toast";

/**
 * ActivityFeed Component
 * Displays a list of recent activities with icons, messages, and details
 */
const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (type) => {
    const iconProps = "w-5 h-5";
    const iconMap = {
      invoice: <FileText className={`${iconProps} text-blue-600`} />,
      manufacturing: <Factory className={`${iconProps} text-purple-600`} />,
      shipment: <Truck className={`${iconProps} text-orange-600`} />,
      delivered: <CheckCircle className={`${iconProps} text-green-600`} />,
    };
    return (
      iconMap[type] || <AlertCircle className={`${iconProps} text-gray-600`} />
    );
  };

  const getDepartmentColor = (department) => {
    const colorMap = {
      sales: "bg-blue-100 text-blue-800",
      procurement: "bg-purple-100 text-purple-800",
      logistics: "bg-orange-100 text-orange-800",
      manufacturing: "bg-indigo-100 text-indigo-800",
    };
    return colorMap[department] || "bg-gray-100 text-gray-800";
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

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No recent activities</p>
        </div>
      ) : (
        activities.map((activity, index) => (
          <div
            key={index}
            className="flex gap-4 p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>

            {/* Content */}
            <div className="flex-grow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-grow">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                      <span className="font-semibold">Order:</span>{" "}
                      {activity.orderNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(
                        activity.department
                      )}`}
                    >
                      {activity.department}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                {activity.amount && (
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ₹ {activity.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(activity.date)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * OrderTracking Component
 * Displays a horizontal timeline with order tracking stages
 */
const OrderTracking = ({ stages, orderInfo }) => {
  const getStageStatus = (stage) => {
    if (stage.status === "completed") return "completed";
    if (stage.status === "in_progress") return "in_progress";
    return "pending";
  };

  const getStageColor = (status) => {
    const colorMap = {
      completed: "bg-green-100 text-green-700 border-green-300",
      in_progress: "bg-blue-100 text-blue-700 border-blue-300",
      pending: "bg-gray-100 text-gray-600 border-gray-300",
    };
    return colorMap[status] || colorMap.pending;
  };

  const getStageIconColor = (status) => {
    const colorMap = {
      completed: "text-green-600",
      in_progress: "text-blue-600",
      pending: "text-gray-400",
    };
    return colorMap[status] || colorMap.pending;
  };

  const getStageLineColor = (currentStatus, nextStatus) => {
    if (currentStatus === "completed") return "bg-green-300";
    if (currentStatus === "in_progress") return "bg-blue-300";
    return "bg-gray-300";
  };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Order Number</p>
          <p className="text-sm font-semibold text-gray-900">
            {orderInfo.orderNumber}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Customer</p>
          <p className="text-sm font-semibold text-gray-900">
            {orderInfo.customer}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Product</p>
          <p className="text-sm font-semibold text-gray-900">
            {orderInfo.product}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-600 mb-1">Delivery Date</p>
          <p className="text-sm font-semibold text-gray-900">
            {orderInfo.deliveryDate}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-6">
          Order Progress
        </h4>
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const status = getStageStatus(stage);
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                {/* Stage Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${getStageColor(
                      status
                    )} transition-all`}
                  >
                    {status === "completed" ? (
                      <CheckCircle
                        className={`w-6 h-6 ${getStageIconColor(status)}`}
                      />
                    ) : status === "in_progress" ? (
                      <Clock
                        className={`w-6 h-6 ${getStageIconColor(
                          status
                        )} animate-pulse`}
                      />
                    ) : (
                      <Clock
                        className={`w-6 h-6 ${getStageIconColor(status)}`}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-900 text-center px-1">
                    {stage.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {stage.date || "-"}
                  </p>
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full ${getStageLineColor(
                      status,
                      stages[index + 1]?.status
                    )} transition-colors`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * SalesDashboard Component
 * Main dashboard component combining recent activities and order tracking
 */
const SalesDashboard = () => {
  const [recentActivities, setRecentActivities] = useState([]);
  const [orderTrackingData, setOrderTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);

        // Fetch recent activities from API
        const response = await api.get("/sales/dashboard/recent-activities", {
          params: {
            limit: 10,
            offset: 0,
          },
        });

        // Transform API response to match component expectations
        const activities = response.data.activities.map((activity) => {
          let type = "other";
          if (activity.type === "invoice_created") type = "invoice";
          else if (activity.type === "manufacturing_started")
            type = "manufacturing";
          else if (activity.type === "manufacturing_completed")
            type = "manufacturing";
          else if (activity.type === "shipment_dispatched") type = "shipment";
          else if (activity.type === "shipment_delivered") type = "delivered";
          else if (activity.type === "purchase_order_created")
            type = "purchase_order";

          return {
            id: activity.id,
            type,
            message: activity.message,
            orderNumber: activity.order_number,
            department: activity.department,
            date: new Date(activity.created_at),
            amount: activity.amount ? parseFloat(activity.amount) : null,
          };
        });

        setRecentActivities(activities);

        // Keep sample order tracking for now (can be fetched separately if needed)
        const sampleOrderTracking = {
          orderNumber: "SO-20251103-0001",
          customer: "Sample Customer",
          product: "Sample Product",
          deliveryDate: new Date().toLocaleDateString("en-IN"),
          stages: [
            {
              id: 1,
              label: "Draft",
              status: "completed",
              date: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("en-IN"),
            },
            {
              id: 2,
              label: "Manufacturing",
              status: "completed",
              date: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000
              ).toLocaleDateString("en-IN"),
            },
            {
              id: 3,
              label: "Shipment",
              status: "in_progress",
              date: new Date().toLocaleDateString("en-IN"),
            },
            {
              id: 4,
              label: "Delivered",
              status: "pending",
              date: null,
            },
          ],
        };

        setOrderTrackingData(sampleOrderTracking);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching activities:", error);
        // Fallback to empty state instead of showing error
        setRecentActivities([]);
        setOrderTrackingData(null);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="mt-2 text-gray-600">Recent Activity & Order Tracking</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities - Left Column (Takes 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <span className="ml-auto text-sm text-gray-500">
                  {recentActivities.length} activities
                </span>
              </div>
              <ActivityFeed activities={recentActivities} />
            </div>
          </div>

          {/* Quick Stats - Right Column */}
          <div className="space-y-4">
            {/* Total Revenue Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    ₹ 32,550
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-300" />
              </div>
            </div>

            {/* Orders This Week Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Orders This Week</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">12</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-300" />
              </div>
            </div>

            {/* Pending Deliveries Card */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">Pending Deliveries</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">5</p>
                </div>
                <Truck className="w-12 h-12 text-orange-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Order Tracking Section */}
        {orderTrackingData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <ArrowRight className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Order Tracking
              </h2>
            </div>
            <OrderTracking
              stages={orderTrackingData.stages}
              orderInfo={{
                orderNumber: orderTrackingData.orderNumber,
                customer: orderTrackingData.customer,
                product: orderTrackingData.product,
                deliveryDate: orderTrackingData.deliveryDate,
              }}
            />
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Last updated:{" "}
            {new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
