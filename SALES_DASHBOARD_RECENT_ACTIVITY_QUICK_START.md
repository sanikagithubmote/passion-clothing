# Sales Dashboard – Recent Activity & Tracking – Quick Start

## 🎯 What's Ready?

✅ **Component Created**: `SalesDashboardRecentActivity.jsx`

- Fully functional React component
- Modern UI with Tailwind CSS
- Reusable ActivityFeed and OrderTracking sub-components
- Sample data included (remove when connecting to API)

## ⚡ 3-Step Integration

### Step 1: Add Tab to Existing Sales Orders Page

Find the tab/view mode section in `SalesOrdersPage.jsx` and add:

```jsx
// At the top with other imports
import SalesDashboard from "../../components/pages/sales/SalesDashboardRecentActivity";

// In your state (around line 87)
const [viewMode, setViewMode] = useState("table"); // Add 'dashboard' option

// In your render section, add tab button:
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setViewMode("table")}
    className={`px-3 py-2 rounded ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
  >
    Orders
  </button>
  <button
    onClick={() => setViewMode("dashboard")}
    className={`px-3 py-2 rounded ${viewMode === "dashboard" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
  >
    📊 Recent Activity & Tracking
  </button>
</div>

// Render the component based on view mode:
{viewMode === "table" && (
  // ... existing table/card views
)}
{viewMode === "dashboard" && (
  <SalesDashboard />
)}
```

### Step 2: Add to Navigation Menu

In your sidebar navigation file (e.g., `Sidebar.js`), add:

```jsx
import { FileText } from 'lucide-react';

// In your menu items array:
{
  label: 'Dashboard',
  icon: FileText,
  path: '/sales/orders?tab=dashboard',
  // or create separate route:
  // path: '/sales/dashboard',
}
```

### Step 3: Connect to Real Data (Optional)

Replace the sample data fetch in `SalesDashboardRecentActivity.jsx`:

```jsx
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch real data from your API
      const [activitiesRes, trackingRes] = await Promise.all([
        api.get("/sales/activities/recent?limit=10"),
        api.get("/sales/orders/latest-tracking"),
      ]);

      setRecentActivities(activitiesRes.data.activities);
      setOrderTrackingData(trackingRes.data.tracking);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      // Keep sample data as fallback
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);
```

## 📊 What You Get

### Recent Activities Section

- 4 sample activities (Invoice, Manufacturing, Shipment, Delivered)
- Each shows:
  - ✉️ Icon representing activity type
  - 📝 Activity message
  - 📦 Order number
  - 🏢 Department badge (sales/procurement/logistics/manufacturing)
  - 📅 Formatted date
  - 💰 Amount in ₹

### Order Tracking Section

- **Order Info Cards**: Order number, Customer, Product, Delivery Date
- **Timeline**: 4 stages showing progress
  - ✅ Draft (Completed)
  - ✅ Manufacturing (Completed)
  - 🔄 Shipment (In Progress - animated)
  - ⏳ Delivery (Pending)

### Quick Stats Cards

- Total Revenue: ₹ 32,550
- Orders This Week: 12
- Pending Deliveries: 5

## 🎨 Visual Design

- **Color Scheme**: Professional blue/gray/green
- **Layout**: Responsive grid (1→3 columns based on screen size)
- **Cards**: Rounded corners, soft shadows, hover effects
- **Typography**: Clear hierarchy with readable fonts
- **Icons**: Modern lucide-react icons

## 🔧 Customization Examples

### Change Activity Icons

```jsx
const getActivityIcon = (type) => {
  const iconMap = {
    invoice: <FileText className="w-5 h-5 text-blue-600" />,
    // Change color: text-blue-600 → text-red-600
  };
};
```

### Modify Timeline Stages

```jsx
const sampleOrderTracking = {
  stages: [
    { id: 1, label: "Draft", status: "completed", date: "03-Nov-2025" },
    { id: 2, label: "Approval", status: "completed", date: "05-Nov-2025" },
    // Add more stages as needed
  ],
};
```

### Change Card Background

```jsx
// In ActivityFeed component:
className = "... bg-white ..."; // Change to bg-gray-50, etc.
```

## 📝 Sample Data Format

When connecting to API, ensure this format:

```json
{
  "activities": [
    {
      "type": "invoice|manufacturing|shipment|delivered",
      "message": "Activity description",
      "orderNumber": "SO-20251103-0001",
      "department": "sales|procurement|logistics|manufacturing",
      "date": "2025-11-15",
      "amount": 11800
    }
  ],
  "tracking": {
    "orderNumber": "SO-20251103-0001",
    "customer": "Customer Name",
    "product": "Product Description",
    "deliveryDate": "18-Nov-2025",
    "stages": [
      {
        "label": "Stage Name",
        "status": "completed|in_progress|pending",
        "date": "03-Nov-2025"
      }
    ]
  }
}
```

## ✅ Testing

Load the component and verify:

1. ✓ All activities display with correct icons
2. ✓ Dates format as "DD-MMM-YYYY"
3. ✓ Amount shows with ₹ symbol
4. ✓ Timeline shows correct stage statuses
5. ✓ Responsive layout works on mobile
6. ✓ Hover effects work on cards
7. ✓ Loading spinner displays initially

## 🚀 Next: Connect to API

Once integrated, update the `useEffect` hook to fetch real data from your backend:

1. Create endpoints:

   - `GET /sales/activities/recent` - Recent activity log
   - `GET /sales/orders/latest-tracking` - Current order tracking

2. Or use existing endpoints and transform data

3. Remove the sample data setTimeout

## 📦 File Location

```
client/src/components/pages/sales/SalesDashboardRecentActivity.jsx
```

**Ready to use!** Copy the component path and import it in your dashboard page.

## 🆘 Need Help?

If component doesn't display:

1. Check browser console for errors
2. Verify lucide-react is installed: `npm list lucide-react`
3. Confirm Tailwind CSS is configured
4. Check imports are correct
5. Ensure parent components render without errors

---

**Component Status**: ✅ Ready for Integration
**Created**: 2025-01-16
**Version**: 1.0.0
