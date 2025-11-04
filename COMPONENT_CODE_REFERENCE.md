# 📝 Component Code Reference - Quick Lookup

## Component Structure Overview

```
SalesDashboardActivityTracking
├── ActivityFeed Component
│   ├── getActivityIcon(type)
│   ├── getDepartmentColor(department)
│   ├── formatDate(dateString)
│   └── formatTime(dateString)
│
├── OrderTracking Component
│   ├── getStageStatus(stage)
│   ├── getStageColor(status)
│   ├── getProgressPercentage()
│   └── Timeline visualization
│
├── State Management
│   ├── recentActivities
│   ├── orderTrackingData
│   ├── loading
│   └── activeTab
│
└── UI Sections
    ├── Header with title and description
    ├── Tab navigation (Activities | Tracking)
    ├── Main content grid (Activities/Tracking)
    └── Quick stats panel (4 cards)
```

---

## Quick Code Snippets

### Import the Component

```jsx
import SalesDashboardActivityTracking from "../../components/pages/sales/SalesDashboardActivityTracking";
```

### Use as Standalone

```jsx
<SalesDashboardActivityTracking />
```

### Use in TabPanel

```jsx
<TabPanel value={tabValue} index={3}>
  <div className="pt-6 pb-6">
    <SalesDashboardActivityTracking />
  </div>
</TabPanel>
```

### Import Sub-components Separately

```jsx
import { ActivityFeed, OrderTracking } from '../../components/pages/sales/SalesDashboardActivityTracking';

// Use separately
<ActivityFeed activities={data} />
<OrderTracking stages={stages} orderInfo={info} />
```

---

## ActivityFeed Component - Props

```jsx
<ActivityFeed
  activities={[
    {
      id: number,
      type: "invoice" | "manufacturing" | "shipment" | "delivered",
      message: string,
      orderNumber: string,
      department: "sales" | "procurement" | "manufacturing" | "logistics",
      date: Date,
      amount: number,
    },
  ]}
/>
```

### Activity Types & Icons

| Type            | Icon | Color  | Use Case              |
| --------------- | ---- | ------ | --------------------- |
| `invoice`       | 🧾   | Blue   | Invoice created       |
| `manufacturing` | 🏭   | Purple | Production started    |
| `shipment`      | 🚚   | Orange | Order shipped         |
| `delivered`     | ✅   | Green  | Delivered to customer |

### Department Options

| Department      | Badge Color | Use Case                 |
| --------------- | ----------- | ------------------------ |
| `sales`         | Blue        | Sales-related activities |
| `procurement`   | Purple      | Purchase orders          |
| `manufacturing` | Indigo      | Production activities    |
| `logistics`     | Orange      | Shipment activities      |

---

## OrderTracking Component - Props

```jsx
<OrderTracking
  stages={[
    {
      id: number,
      label: string,
      status: "completed" | "in_progress" | "pending",
      date: string | null,
    },
  ]}
  orderInfo={{
    orderNumber: string,
    customer: string,
    product: string,
    deliveryDate: string,
  }}
/>
```

### Stage Status Options

| Status        | Color | Icon | Indicator      |
| ------------- | ----- | ---- | -------------- |
| `completed`   | Green | ✓    | Checkmark      |
| `in_progress` | Blue  | ⏳   | Animated clock |
| `pending`     | Gray  | ○    | Empty circle   |

---

## Sample Data Format

### Activities Data

```jsx
const activities = [
  {
    id: 1,
    type: "invoice",
    message: "Invoice INV-20251103-0006-v4 has been created",
    orderNumber: "SO-20251103-0001",
    department: "sales",
    date: new Date(2025, 10, 15, 14, 32), // November 15, 2025 at 2:32 PM
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
  // ... more activities
];
```

### Order Tracking Data

```jsx
const orderTracking = {
  orderNumber: "SO-20251103-0001",
  customer: "Sanika Shankar Mote",
  product: "Chicken Roll (20 qty)",
  deliveryDate: "18-Nov-2025",
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
```

---

## Color Palette Reference

### Primary Colors

```jsx
const colors = {
  blue: "#2563eb", // Primary actions, invoices
  green: "#22c55e", // Success, completed
  amber: "#f59e0b", // Warning, active orders
  red: "#ef4444", // Error, pending actions
  purple: "#9333ea", // Manufacturing
  orange: "#ea580c", // Logistics
  indigo: "#4f46e5", // Manufacturing alternate
};
```

### Background Colors

```jsx
const backgrounds = {
  lightGray: "#f3f4f6", // Main background
  slateGray: "#f1f5f9", // Alternative background
  white: "#ffffff", // Cards
  blueLight: "#dbeafe", // Blue backgrounds
  greenLight: "#dcfce7", // Green backgrounds
};
```

### Gradient Examples

```jsx
const gradients = {
  blueBg: "from-blue-50 to-blue-100",
  greenBg: "from-green-50 to-green-100",
  amberBg: "from-amber-50 to-amber-100",
  redBg: "from-red-50 to-red-100",
};
```

---

## Tailwind CSS Classes Used

### Common Classes in Component

```jsx
// Spacing
p-4, p-6, px-3, py-2, mt-2, mb-4, gap-2, gap-4, gap-6

// Colors
text-gray-900, text-blue-600, bg-blue-100, bg-gradient-to-br

// Layout
flex, grid, grid-cols-1, lg:grid-cols-3, lg:col-span-2

// Borders
border, border-gray-200, rounded-lg, rounded-xl

// Shadows
shadow-sm, shadow-md, hover:shadow-md

// Display
flex, hidden, block, inline-flex

// Sizing
w-4, h-4, w-6, h-6, w-12, h-12

// Typography
font-bold, font-semibold, font-medium, text-sm, text-3xl
```

---

## Date Formatting

```jsx
// Current format (India timezone)
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
// Result: "18-Nov-2025"

// With time
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
// Result: "14:32"
```

---

## Currency Formatting

```jsx
// Format amount in Indian Rupees
const amount = 11800;
const formatted = amount.toLocaleString("en-IN");
// Result: "11,800"

// Display in component
<p>₹ {activity.amount.toLocaleString("en-IN")}</p>;
// Result: "₹ 11,800"
```

---

## Icon Mappings

### Activity Icons (lucide-react)

```jsx
import {
  FileText, // 📄 for invoices
  Factory, // 🏭 for manufacturing
  Truck, // 🚚 for shipments
  CheckCircle, // ✅ for delivered
  Clock, // ⏳ for in-progress
  AlertCircle, // ⚠️ for pending
  Activity, // 📊 for dashboard
  Package, // 📦 for orders
  DollarSign, // 💰 for revenue
  Calendar, // 📅 for dates
  User, // 👤 for customer
  TrendingUp, // 📈 for trends
  ArrowRight, // → for navigation
} from "lucide-react";
```

### Usage in Component

```jsx
<FileText className="w-6 h-6 text-blue-600" />
<Factory className="w-6 h-6 text-purple-600" />
<Truck className="w-6 h-6 text-orange-600" />
<CheckCircle className="w-6 h-6 text-green-600" />
```

---

## Responsive Breakpoints

```jsx
// Tailwind breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

// In component
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  // Mobile: 1 column // Tablet: 2 columns // Desktop: 3 columns
</div>
```

---

## Component Lifecycle

### 1. Initial Render

```
Component mounts
→ Loading state = true
→ Spinner displayed
```

### 2. Data Loading (useEffect)

```
Timer starts (300ms)
→ Sample data created
→ State updated
→ Loading state = false
```

### 3. Render Complete

```
Loading state = false
→ Content displayed
→ Tabs functional
→ Ready for interaction
```

### 4. Tab Switch

```
User clicks tab
→ activeTab updated
→ Conditional rendering
→ Content changes
```

---

## State Structure

```jsx
// Component state
{
  recentActivities: [
    { id, type, message, orderNumber, department, date, amount },
    // ...
  ],
  orderTrackingData: {
    orderNumber: string,
    customer: string,
    product: string,
    deliveryDate: string,
    stages: [
      { id, label, status, date },
      // ...
    ]
  },
  loading: boolean,
  activeTab: 'activities' | 'tracking'
}
```

---

## Export Statements

```jsx
// Export individual components
export { ActivityFeed, OrderTracking };

// Export main component as default
export default SalesDashboardActivityTracking;

// Or use named exports
export const ActivityFeed = () => { ... };
export const OrderTracking = () => { ... };
export const SalesDashboardActivityTracking = () => { ... };
```

---

## Import Statements (What's Used)

```jsx
import React, { useState, useEffect } from "react";
import {
  FileText, // Invoice icon
  Factory, // Manufacturing icon
  Truck, // Shipment icon
  CheckCircle, // Delivered icon
  Clock, // Time/pending icon
  AlertCircle, // Alert icon
  ArrowRight, // Arrow icon
  MapPin, // Location icon
  User, // User icon
  Calendar, // Date icon
  DollarSign, // Money icon
  Activity, // Activity icon
  TrendingUp, // Trend icon
  Package, // Package icon
} from "lucide-react";
```

---

## Common Modifications

### Change Activity Icon Colors

```jsx
// In getActivityIcon function, modify:
invoice: <FileText className={`${iconProps} text-YOUR-COLOR`} />;
```

### Add New Activity Type

```jsx
const iconMap = {
  invoice: <FileText ... />,
  manufacturing: <Factory ... />,
  shipment: <Truck ... />,
  delivered: <CheckCircle ... />,
  newType: <NewIcon className="w-6 h-6 text-color" />  // ADD THIS
};
```

### Change Department Colors

```jsx
const getDepartmentColor = (department) => {
  const colorMap = {
    sales: "bg-YOUR-COLOR border-YOUR-COLOR text-YOUR-COLOR",
    // ... modify colors here
  };
};
```

### Modify Date Format

```jsx
// Change from 'en-IN' to your locale
return date.toLocaleDateString("en-US", {
  day: "2-digit",
  month: "long", // 'short' | 'long' | '2-digit'
  year: "numeric",
});
```

---

## Performance Optimizations

```jsx
// Component uses:
- Functional components (no class overhead)
- useState for state management (lightweight)
- useEffect for one-time initialization
- Conditional rendering (no unnecessary DOM)
- CSS-in-JS via Tailwind (no external CSS files)
- No external UI libraries (React + lucide-react only)
```

---

## Accessibility Features

```jsx
// Component includes:
- Semantic HTML
- Proper heading hierarchy
- Color contrast (WCAG AA)
- Icon labels
- Tab navigation support
- Loading states announced
- Empty states described
```

---

## Testing Considerations

```jsx
// Test props:
<ActivityFeed activities={[]} />
<ActivityFeed activities={sampleActivities} />

<OrderTracking stages={[]} orderInfo={{}} />
<OrderTracking stages={sampleStages} orderInfo={sampleOrderInfo} />

<SalesDashboardActivityTracking />  // With sample data
```

---

## Dependencies Required

```json
{
  "react": "^18.0.0",
  "lucide-react": "^latest"
}
```

**No additional packages needed!**

Tailwind CSS must be configured in your project.

---

## File Size Information

```
SalesDashboardActivityTracking.jsx: ~360 lines
- Component code: 320 lines
- Comments/docs: 40 lines
- Minified: ~8KB
- Gzipped: ~2.5KB
```

---

## API Integration Template

```jsx
// Replace useEffect in component:
useEffect(() => {
  const fetchData = async () => {
    try {
      // Fetch activities
      const activitiesRes = await api.get("/sales/activities?limit=10");
      setRecentActivities(transformActivitiesData(activitiesRes.data));

      // Fetch tracking
      const trackingRes = await api.get("/sales/orders/latest/tracking");
      setOrderTrackingData(transformTrackingData(trackingRes.data));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

// Transform functions
const transformActivitiesData = (data) => {
  return data.map((item) => ({
    id: item.id,
    type: item.type,
    message: item.message,
    orderNumber: item.order_number,
    department: item.department,
    date: new Date(item.created_at),
    amount: item.amount,
  }));
};

const transformTrackingData = (data) => {
  return {
    orderNumber: data.order_number,
    customer: data.customer_name,
    product: data.product_name,
    deliveryDate: formatDate(data.delivery_date),
    stages: data.stages.map((s) => ({
      id: s.id,
      label: s.name,
      status: s.status,
      date: s.completed_at ? formatDate(s.completed_at) : null,
    })),
  };
};
```

---

## Common Errors & Solutions

| Error                     | Cause                | Solution                     |
| ------------------------- | -------------------- | ---------------------------- |
| "Activity is not defined" | Missing import       | Import from lucide-react     |
| "Component not found"     | Wrong path           | Check file path              |
| "Invalid Date"            | Bad date format      | Use ISO format               |
| "Classes not applying"    | Tailwind not set up  | Configure tailwind.config.js |
| "Icons not showing"       | lucide-react missing | npm install lucide-react     |

---

## Quick Copy-Paste Solutions

### Add Component to Route

```jsx
import SalesDashboardActivityPage from './pages/sales/SalesDashboardActivityPage';

{ path: '/sales/activity', element: <SalesDashboardActivityPage /> }
```

### Add to Dashboard Tab

```jsx
import SalesDashboardActivityTracking from '../../components/pages/sales/SalesDashboardActivityTracking';

// In tabs array:
{ label: 'Activity & Tracking', icon: Activity }

// In TabPanel:
<TabPanel value={tabValue} index={3}>
  <SalesDashboardActivityTracking />
</TabPanel>
```

### Use Individual Components

```jsx
import { ActivityFeed, OrderTracking } from '../../components/pages/sales/SalesDashboardActivityTracking';

<ActivityFeed activities={myActivities} />
<OrderTracking stages={myStages} orderInfo={myInfo} />
```

---

This reference document provides quick lookups for all code-related aspects of the component.

For full documentation, see: `SALES_DASHBOARD_ACTIVITY_TRACKING_GUIDE.md`
