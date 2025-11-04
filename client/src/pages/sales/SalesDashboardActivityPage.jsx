import React from "react";
import SalesDashboardActivityTracking from "../../components/pages/sales/SalesDashboardActivityTracking";

/**
 * SalesDashboardActivityPage
 * Standalone page for the modern Sales Dashboard - Recent Activity & Tracking
 * Route: /sales/activity
 */
const SalesDashboardActivityPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SalesDashboardActivityTracking />
    </div>
  );
};

export default SalesDashboardActivityPage;
