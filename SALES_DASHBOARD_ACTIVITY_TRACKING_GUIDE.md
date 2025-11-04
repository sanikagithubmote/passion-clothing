# 🎯 Sales Dashboard – Recent Activity & Tracking Guide

## Overview

A modern, professional "Sales Dashboard – Recent Activity & Tracking" component for your ERP system. This component provides a comprehensive view of recent sales activities and order tracking with a clean, modern UI.

**Created:** `SalesDashboardActivityTracking.jsx`  
**Location:** `client/src/components/pages/sales/SalesDashboardActivityTracking.jsx`  
**Standalone Page:** `client/src/pages/sales/SalesDashboardActivityPage.jsx`

---

## ✨ Features

### 1. **Recent Activities Feed**

- ✅ Icon-based activity visualization (Invoice 🧾, Manufacturing 🏭, Shipment 🚚, Delivered ✅)
- ✅ Detailed activity messages with proper formatting
- ✅ Related order numbers with visual badges
- ✅ Department/type classification (Sales, Procurement, Manufacturing, Logistics)
- ✅ Formatted dates and times (India timezone)
- ✅ Amount display in Indian Rupees (₹) with proper formatting
- ✅ Interactive hover effects
- ✅ Responsive design

### 2. **Order Tracking**

- ✅ Order information cards (Order Number, Customer, Product, Delivery Date)
- ✅ Overall progress percentage with visual progress bar
- ✅ Timeline visualization with stages
- ✅ Stage status indicators (Completed ✓, In Progress ⏳, Pending ○)
- ✅ Color-coded status badges
- ✅ Connecting timeline lines
- ✅ Date tracking for each stage

### 3. **Quick Statistics Panel**

- ✅ Total Revenue with trend indicator
- ✅ Active Orders count with pending approvals
- ✅ Completed Orders this month with percentage target
- ✅ Pending Actions with urgency indicator
- ✅ Modern gradient cards with shadows
- ✅ Interactive hover effects

### 4. **Modern UI Design**

- ✅ Rounded cards with soft shadows
- ✅ Light background (#f9fafb / #f3f4f6)
- ✅ Blue highlights for active steps (#007bff / #2563eb)
- ✅ Green for completed steps
- ✅ Gray for pending steps
- ✅ Professional gradient effects
- ✅ Smooth transitions and animations
- ✅ Responsive grid layout
- ✅ Tailwind CSS styling

---

## 📦 Component Structure

### Main Component: `SalesDashboardActivityTracking`

```jsx
<SalesDashboardActivityTracking />
```

**Features:**

- Tabbed interface (Activities | Tracking)
- Sample data with realistic information
- Loading state with spinner
- Responsive layout (1 col mobile, 3 col desktop)

### Reusable Components

#### 1. `ActivityFeed`

Displays a list of recent activities with icons and details.

```jsx
<ActivityFeed
  activities={[
    {
      id: 1,
      type: "invoice",
      message: "Invoice INV-20251103-0006-v4 has been created",
      orderNumber: "SO-20251103-0001",
      department: "sales",
      date: new Date(2025, 10, 15, 14, 32),
      amount: 11800,
    },
  ]}
/>
```

**Props:**

- `activities` (array): Array of activity objects
  - `id` (number): Unique identifier
  - `type` (string): 'invoice', 'manufacturing', 'shipment', 'delivered'
  - `message` (string): Activity description
  - `orderNumber` (string): Related order number
  - `department` (string): 'sales', 'procurement', 'manufacturing', 'logistics'
  - `date` (Date): Activity timestamp
  - `amount` (number): Associated amount in rupees

#### 2. `OrderTracking`

Displays order progress with timeline visualization.

```jsx
<OrderTracking
  stages={[
    { id: 1, label: "Draft", status: "completed", date: "03-Nov-2025" },
    { id: 2, label: "Manufacturing", status: "completed", date: "10-Nov-2025" },
    { id: 3, label: "Shipment", status: "in_progress", date: "14-Nov-2025" },
    { id: 4, label: "Delivered", status: "pending", date: null },
  ]}
  orderInfo={{
    orderNumber: "SO-20251103-0001",
    customer: "Sanika Shankar Mote",
    product: "Chicken Roll (20 qty)",
    deliveryDate: "18-Nov-2025",
    revenue: 11800,
  }}
/>
```

**Props:**

- `stages` (array): Order stages with status

  - `id` (number): Unique identifier
  - `label` (string): Stage name
  - `status` (string): 'completed', 'in_progress', 'pending'
  - `date` (string): Stage completion date

- `orderInfo` (object): Order details
  - `orderNumber` (string): SO-XXXXXXX-XXXX
  - `customer` (string): Customer name
  - `product` (string): Product description with quantity
  - `deliveryDate` (string): Expected delivery date
  - `revenue` (number): Order amount

---

## 🚀 Integration Guide

### Option 1: Use Standalone Page (Recommended)

1. **Add Route to Router** (`client/src/App.jsx`):

```jsx
import SalesDashboardActivityPage from './pages/sales/SalesDashboardActivityPage';

// In your router config:
{
  path: '/sales/activity',
  element: <SalesDashboardActivityPage />,
  requiresAuth: true,
  requiredPermission: 'VIEW_SALES_DASHBOARD'
}
```

2. **Add Navigation Link** (Sidebar or Navigation Menu):

```jsx
{
  label: 'Activity & Tracking',
  path: '/sales/activity',
  icon: Activity,
  section: 'sales'
}
```

3. **Access:** Navigate to `http://localhost:3000/sales/activity`

---

### Option 2: Add as Tab in Existing Dashboard

**File:** `client/src/pages/dashboards/SalesDashboard.jsx`

1. **Import the component:**

```jsx
import SalesDashboardActivityTracking from "../../components/pages/sales/SalesDashboardActivityTracking";
```

2. **Add to tabs array (around line 410):**

```jsx
[
  { label: 'Orders', icon: FaClipboardList },
  { label: 'Pipeline', icon: TrendingUp },
  { label: 'Customers', icon: FaUser },
  { label: 'Activity & Tracking', icon: Activity }  // NEW
].map((tab, idx) => ...)
```

3. **Add tab content (in TabPanel):**

```jsx
<TabPanel value={tabValue} index={3}>
  <div className="pt-4">
    <SalesDashboardActivityTracking />
  </div>
</TabPanel>
```

---

### Option 3: Replace Existing Dashboard

Replace the entire dashboard with the new component:

```jsx
// client/src/pages/dashboards/SalesDashboard.jsx
import SalesDashboardActivityTracking from "../../components/pages/sales/SalesDashboardActivityTracking";

const SalesDashboard = () => {
  return <SalesDashboardActivityTracking />;
};

export default SalesDashboard;
```

---

## 📡 API Integration

### Fetching Recent Activities

**Endpoint:** `GET /api/sales/activities`

```jsx
useEffect(() => {
  const fetchActivities = async () => {
    try {
      const response = await api.get("/sales/activities?limit=10");
      const activities = response.data.map((activity) => ({
        id: activity.id,
        type: activity.type, // 'invoice', 'manufacturing', etc.
        message: activity.message,
        orderNumber: activity.order_number,
        department: activity.department,
        date: new Date(activity.created_at),
        amount: activity.amount,
      }));
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  fetchActivities();
}, []);
```

### Fetching Order Tracking Data

**Endpoint:** `GET /api/sales/orders/:orderId/tracking`

```jsx
useEffect(() => {
  const fetchOrderTracking = async () => {
    try {
      const response = await api.get("/sales/orders/SO-20251103-0001/tracking");
      setOrderTrackingData({
        orderNumber: response.data.order_number,
        customer: response.data.customer_name,
        product: response.data.product_description,
        deliveryDate: formatDate(response.data.delivery_date),
        revenue: response.data.total_amount,
        stages: response.data.stages.map((stage) => ({
          id: stage.id,
          label: stage.name,
          status: stage.status,
          date: stage.completed_at ? formatDate(stage.completed_at) : null,
        })),
      });
    } catch (error) {
      console.error("Error fetching order tracking:", error);
    }
  };

  fetchOrderTracking();
}, []);
```

---

## 🎨 Customization

### Activity Icons

Modify `getActivityIcon()` in `ActivityFeed`:

```jsx
const getActivityIcon = (type) => {
  const iconMap = {
    invoice: <FileText className="w-6 h-6 text-blue-600" />,
    manufacturing: <Factory className="w-6 h-6 text-purple-600" />,
    // Add more types...
  };
  return iconMap[type] || <AlertCircle className="w-6 h-6 text-gray-600" />;
};
```

### Color Schemes

Update `getDepartmentColor()` for custom department colors:

```jsx
const getDepartmentColor = (department) => {
  const colorMap = {
    sales: "bg-blue-50 border-blue-200 text-blue-700",
    procurement: "bg-purple-50 border-purple-200 text-purple-700",
    // Customize colors here
  };
};
```

### Date Format

Modify `formatDate()` function:

```jsx
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
```

---

## 📊 Sample Data Structure

```json
{
  "activities": [
    {
      "id": 1,
      "type": "invoice",
      "message": "Invoice INV-20251103-0006-v4 has been created",
      "orderNumber": "SO-20251103-0001",
      "department": "sales",
      "date": "2025-11-15T14:32:00Z",
      "amount": 11800
    }
  ],
  "orderTracking": {
    "orderNumber": "SO-20251103-0001",
    "customer": "Sanika Shankar Mote",
    "product": "Chicken Roll (20 qty)",
    "deliveryDate": "18-Nov-2025",
    "revenue": 11800,
    "stages": [
      {
        "id": 1,
        "label": "Draft",
        "status": "completed",
        "date": "03-Nov-2025"
      }
    ]
  }
}
```

---

## 🔧 Dependencies

Required packages (already in your project):

- `react` ≥ 18.0
- `lucide-react` (for icons)
- `tailwindcss` (for styling)

No external UI libraries needed!

---

## 📱 Responsive Behavior

| Screen Size             | Layout    | Columns   |
| ----------------------- | --------- | --------- |
| Mobile (< 768px)        | Stacked   | 1 column  |
| Tablet (768px - 1024px) | 2 columns | 2 columns |
| Desktop (> 1024px)      | 3 columns | 3 columns |

**Activity Feed:** Always full width on left  
**Quick Stats:** Stacked on mobile, 1 column on desktop

---

## ✅ Quality Checklist

- ✅ Modern, professional UI design
- ✅ Proper date formatting (no "Invalid Date")
- ✅ Icon-based visual hierarchy
- ✅ Color-coded status indicators
- ✅ Responsive grid layout
- ✅ Tailwind CSS styling
- ✅ Lucide-react icons
- ✅ Smooth animations and transitions
- ✅ Loading states
- ✅ Empty states
- ✅ Reusable components
- ✅ Type-safe prop handling
- ✅ Performance optimized

---

## 🎯 Usage Examples

### Example 1: Using with React Query

```jsx
import { useQuery } from "@tanstack/react-query";
import SalesDashboardActivityTracking from "../../components/pages/sales/SalesDashboardActivityTracking";
import api from "../../utils/api";

const SalesDashboardPage = () => {
  const { data: activities } = useQuery(["sales-activities"], () =>
    api.get("/sales/activities")
  );

  return <SalesDashboardActivityTracking />;
};
```

### Example 2: Custom Activity Types

```jsx
// Extend the component with custom types
const customActivityTypes = {
  approval: <CheckCircle className="w-6 h-6 text-green-600" />,
  rejection: <AlertCircle className="w-6 h-6 text-red-600" />,
};
```

### Example 3: Real-time Updates

```jsx
// Add WebSocket for real-time updates
useEffect(() => {
  const socket = io("http://localhost:5000");

  socket.on("activity-created", (newActivity) => {
    setRecentActivities((prev) => [newActivity, ...prev]);
  });

  return () => socket.disconnect();
}, []);
```

---

## 🐛 Troubleshooting

### Issue: "Invalid Date" in activity dates

**Solution:** Ensure date format is ISO 8601 (YYYY-MM-DD HH:MM:SS)

```jsx
// ✅ Correct
date: new Date("2025-11-15T14:32:00Z");
// ✅ Also correct
date: new Date(2025, 10, 15, 14, 32); // Month is 0-indexed
```

### Issue: Icons not showing

**Solution:** Ensure lucide-react is installed

```bash
npm install lucide-react
# or
yarn add lucide-react
```

### Issue: Tailwind classes not applied

**Solution:** Check tailwind.config.js includes component file

```js
content: ["./src/components/**/*.{js,jsx}", "./src/pages/**/*.{js,jsx}"];
```

---

## 📚 Related Files

- Component: `client/src/components/pages/sales/SalesDashboardActivityTracking.jsx`
- Standalone Page: `client/src/pages/sales/SalesDashboardActivityPage.jsx`
- Main Dashboard: `client/src/pages/dashboards/SalesDashboard.jsx`
- Styles: Uses Tailwind CSS (no external CSS files)

---

## 🚀 Next Steps

1. ✅ Integrate component into your project
2. ✅ Connect API endpoints for real data
3. ✅ Customize colors and styles as needed
4. ✅ Add real-time updates if desired
5. ✅ Test on different screen sizes
6. ✅ Deploy to production

---

## 📞 Support

For questions or issues, refer to:

- Component comments in the source file
- Sample data structure in the component
- Integration examples above

---

**Last Updated:** November 2025  
**Version:** 1.0  
**Status:** Ready for Production
