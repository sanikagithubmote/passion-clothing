import React from "react";
import { X, Package, ClipboardList, Factory, AlertCircle } from "lucide-react";

/**
 * ProductTrackingDialog - Displays product tracking information after barcode scan
 */
const ProductTrackingDialog = ({ isOpen, onClose, trackingData, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            Product Tracking Information
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Loading tracking information...
              </span>
            </div>
          ) : trackingData ? (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <Package className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {trackingData.product?.name ||
                        trackingData.productName ||
                        trackingData.specifications?.product_name ||
                        "Unknown Product"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      SKU: {trackingData.product?.product_code || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Current Status:{" "}
                      <span className="font-semibold text-blue-600">
                        {trackingData.currentStatus}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Sales Orders */}
              {trackingData.salesOrders &&
                trackingData.salesOrders.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Sales Orders ({trackingData.salesOrders.length})
                    </h4>
                    <div className="space-y-2">
                      {trackingData.salesOrders.map((order, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-3 rounded border border-gray-200 text-sm"
                        >
                          <p>
                            <span className="font-semibold">Order #:</span>{" "}
                            {order.order_number || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Quantity:</span>{" "}
                            {order.total_quantity || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Status:</span>{" "}
                            {order.status || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Production Requests */}
              {trackingData.productionRequests &&
                trackingData.productionRequests.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Production Requests (
                      {trackingData.productionRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {trackingData.productionRequests.map((req, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-3 rounded border border-gray-200 text-sm"
                        >
                          <p>
                            <span className="font-semibold">Request #:</span>{" "}
                            {req.request_number || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Quantity:</span>{" "}
                            {req.quantity || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Status:</span>{" "}
                            {req.status || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Production Orders */}
              {trackingData.productionOrders &&
                trackingData.productionOrders.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Factory className="w-4 h-4 mr-2" />
                      Production Orders ({trackingData.productionOrders.length})
                    </h4>
                    <div className="space-y-2">
                      {trackingData.productionOrders.map((order, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 p-3 rounded border border-gray-200 text-sm"
                        >
                          <p>
                            <span className="font-semibold">Production #:</span>{" "}
                            {order.production_number || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Quantity:</span>{" "}
                            {order.quantity || "N/A"}
                          </p>
                          <p>
                            <span className="font-semibold">Status:</span>{" "}
                            {order.status || "N/A"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* No tracking data message */}
              {!trackingData.salesOrders?.length &&
                !trackingData.productionRequests?.length &&
                !trackingData.productionOrders?.length && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No tracking information available for this product.</p>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No tracking data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTrackingDialog;
