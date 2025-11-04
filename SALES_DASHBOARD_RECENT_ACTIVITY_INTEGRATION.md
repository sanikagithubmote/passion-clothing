# Sales Dashboard – Recent Activity & Tracking Integration Guide

## 📋 Overview

The new **Sales Dashboard – Recent Activity & Tracking** section provides a modern, professional interface for displaying:

- ✅ Recent Activities (Invoice created, Manufacturing started, Shipment dispatched, Order delivered)
- 🚀 Order Tracking Timeline with horizontal progress bar
- 📊 Quick stats (Revenue, Orders, Pending Deliveries)

## 📁 Files Created

```
client/src/components/pages/sales/SalesDashboardRecentActivity.jsx
```

## 🎯 Key Features

### 1. **ActivityFeed Component**

- Displays recent activities with icons
- Shows activity message, order number, department, date, and amount
- Responsive design with hover effects
- Proper date formatting (handles Invalid Date gracefully)

### 2. **OrderTracking Component**

- Horizontal timeline with 4 stages: Draft → Manufacturing → Shipment → Delivered
- Visual progress indicator with color-coded status:
  - ✅ **Completed** (Green)
  - 🔄 **In Progress** (Blue, pulsing)
  - ⏳ **Pending** (Gray)
- Order summary info card with customer, product, delivery date

### 3. **SalesDashboard Component**

- Main container combining all features
- Responsive grid layout (1 column on mobile, 3 columns on large screens)
- Recent activities on left (2 columns)
- Quick stats cards on right (1 column)
- Order tracking section spanning full width

## 🚀 Integration Steps

### Step 1: Verify Component Installation

File already created at:

```
c:\Users\admin\Desktop\passion-clothing\client\src\components\pages\sales\SalesDashboardRecentActivity.jsx
```

### Step 2: Add Route to Sales Module

Edit `client/src/pages/sales/SalesOrdersPage.jsx` or create a new tab/option:

**Option A: Add as a new tab in existing SalesOrdersPage**

```jsx
import SalesDashboard from "../../components/pages/sales/SalesDashboardRecentActivity";

// In your state management:
const [activeTab, setActiveTab] = useState("orders"); // or "activity"

// In render:
{activeTab === "orders" && <OrdersList />}
{activeTab === "activity" && <SalesDashboard />}

// Tab buttons:
<button onClick={() => setActiveTab("orders")}>Orders</button>
<button onClick={() => setActiveTab("activity")}>Recent Activity & Tracking</button>
```

**Option B: Create as a new dedicated page**

Create `client/src/pages/sales/SalesDashboardPage.jsx`:

```jsx
import React from "react";
import SalesDashboard from "../../components/pages/sales/SalesDashboardRecentActivity";

export default function SalesDashboardPage() {
  return <SalesDashboard />;
}
```

### Step 3: Update Routes

In your routing configuration (e.g., `App.js` or routing setup):

```jsx
import SalesDashboardPage from "./pages/sales/SalesDashboardPage";

// Add to routes:
{
  path: "/sales/dashboard",
  element: <SalesDashboardPage />,
  requiredPermission: "view_sales_dashboard"
}
```

### Step 4: Update Navigation Menu

Add link in sidebar/navigation:

```jsx
<NavLink to="/sales/dashboard" className="nav-link">
  <FileText className="icon" />
  Dashboard
</NavLink>
```

## 🔌 API Integration

### Replace Sample Data with Real API Calls

Update the `useEffect` in `SalesDashboard` component:

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch recent activities
      const activitiesRes = await api.get("/sales/activities/recent?limit=10");
      setRecentActivities(activitiesRes.data.activities || []);

      // Fetch order tracking data
      const trackingRes = await api.get("/sales/orders/latest-tracking");
      setOrderTrackingData(trackingRes.data.tracking);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

### Expected API Response Format

**GET /sales/activities/recent**

```json
{
  "activities": [
    {
      "id": 1,
      "type": "invoice",
      "message": "Invoice INV-20251103-0006-v4 has been created",
      "orderNumber": "SO-20251103-0001",
      "department": "sales",
      "date": "2025-11-15T10:30:00Z",
      "amount": 11800
    }
    // ... more activities
  ]
}
```

**GET /sales/orders/latest-tracking**

```json
{
  "tracking": {
    "orderNumber": "SO-20251103-0001",
    "customer": "Sanika Shankar Mote",
    "product": "Chicken Roll (20 qty)",
    "deliveryDate": "18-Nov-2025",
    "stages": [
      {
        "id": 1,
        "label": "Draft",
        "status": "completed",
        "date": "03-Nov-2025"
      }
      // ... more stages
    ]
  }
}
```

## 🎨 Customization Guide

### Change Colors

In component, update color classes:

```jsx
// Activity type icon colors
const getActivityIcon = (type) => {
  const iconMap = {
    invoice: <FileText className="w-5 h-5 text-blue-600" />, // Change blue-600
    manufacturing: <Factory className="w-5 h-5 text-purple-600" />,
    shipment: <Truck className="w-5 h-5 text-orange-600" />,
    delivered: <CheckCircle className="w-5 h-5 text-green-600" />,
  };
};
```

### Modify Timeline Stages

```jsx
// Add/remove stages in OrderTracking component
const sampleOrderTracking = {
  stages: [
    // Add or remove stages here
    { id: 1, label: "Draft", status: "completed", date: "03-Nov-2025" },
    // ...
  ],
};
```

### Adjust Layout

Main grid is responsive:

```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Left: 2 columns on large screens */}
  <div className="lg:col-span-2">...</div>

  {/* Right: 1 column on large screens */}
  <div className="space-y-4">...</div>
</div>
```

## 📱 Responsive Design

- **Mobile (< 768px)**: Single column layout
- **Tablet (768px - 1024px)**: 2 columns
- **Desktop (> 1024px)**: 3 columns with sidebar

## 🔐 Permissions

Add required permissions in database:

```sql
INSERT INTO permissions (name, description) VALUES
('view_sales_dashboard', 'View sales dashboard with recent activities'),
('view_order_tracking', 'View order tracking timeline');
```

## 🧪 Testing Checklist

- [ ] Component renders without errors
- [ ] Recent activities display correctly
- [ ] Order tracking timeline shows all stages
- [ ] Dates format correctly (no "Invalid Date")
- [ ] Amount displays with ₹ symbol and comma separation
- [ ] Department badges show correct colors
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Icons from lucide-react display properly
- [ ] Hover effects work on cards
- [ ] Loading state displays spinner
- [ ] API integration fetches real data

## 🐛 Troubleshooting

### Issue: "Invalid Date" in activity dates

**Solution**: Ensure API returns dates in ISO format (2025-11-15T10:30:00Z)

### Issue: Icons not showing

**Solution**: Ensure lucide-react is installed:

```bash
npm install lucide-react
```

### Issue: Tailwind classes not applying

**Solution**: Verify Tailwind CSS is configured in your project and build process

### Issue: Component not rendering

**Solution**: Check browser console for errors and ensure:

1. Component is imported correctly
2. Route is configured
3. Required dependencies are installed

## 📦 Dependencies

- **react**: ^18.0.0
- **lucide-react**: Latest version
- **tailwindcss**: ^3.0.0

## 🎓 Component Props

The component doesn't require any props and manages its own state with sample data. To customize with external data, you can modify to accept props:

```jsx
const SalesDashboard = ({
  activities = [],
  orderTracking = null,
  onActivityClick = null,
}) => {
  // Component code
};
```

## 📝 Notes

- Sample data includes a 500ms artificial delay to simulate API call
- All dates use Indian locale formatting (dd-MMM-yyyy)
- Currency uses Indian Rupee (₹) symbol
- Component is fully self-contained and can be used standalone
- No external state management (Redux/Context) required
- Mobile-first responsive design approach

## 🚀 Next Steps

1. ✅ Component created and ready to use
2. ⏳ Add API endpoints for real data
3. ⏳ Integrate with routing system
4. ⏳ Add to navigation menu
5. ⏳ Connect to actual database queries
6. ⏳ Test with real data
7. ⏳ Add permission checks
8. ⏳ Deploy to production

---

**Last Updated**: 2025-01-16
**Component Version**: 1.0.0
