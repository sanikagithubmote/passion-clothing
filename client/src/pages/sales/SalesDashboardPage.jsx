import React from "react";
import SalesDashboard from "../../components/pages/sales/SalesDashboardRecentActivity";

/**
 * SalesDashboardPage
 * Standalone page wrapper for the Sales Dashboard component
 * Can be accessed via route: /sales/dashboard
 */
const SalesDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <SalesDashboard />
    </div>
  );
};

export default SalesDashboardPage;
