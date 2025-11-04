# Sales Dashboard – Recent Activity & Tracking – Visual Reference

## 🎨 Component Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Sales Dashboard                                                    │
│  Recent Activity & Order Tracking                                   │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┬─────────────────────────┐
│                                          │                         │
│  RECENT ACTIVITIES (Left - 2 columns)    │  QUICK STATS (Right)    │
│                                          │                         │
│  ┌────────────────────────────────────┐  │  ┌───────────────────┐  │
│  │ 🧾 Invoice Created                 │  │  │ 💰 Total Revenue  │  │
│  │ Invoice INV-20251103-0006-v4       │  │  │ ₹ 32,550          │  │
│  │ Order: SO-20251103-0001            │  │  └───────────────────┘  │
│  │ [sales badge] • 15-Nov-2025        │  │                         │
│  │                        ₹ 11,800    │  │  ┌───────────────────┐  │
│  └────────────────────────────────────┘  │  │ 📦 Orders/Week    │  │
│                                          │  │ 12                │  │
│  ┌────────────────────────────────────┐  │  └───────────────────┘  │
│  │ 🏭 Manufacturing Started           │  │                         │
│  │ Manufacturing started for order    │  │  ┌───────────────────┐  │
│  │ Order: SO-20251103-0001            │  │  │ 🚚 Pending        │  │
│  │ [manufacturing] • 12-Nov-2025      │  │  │ Deliveries: 5     │  │
│  │                        ₹ 11,800    │  │  └───────────────────┘  │
│  └────────────────────────────────────┘  │                         │
│                                          │                         │
│  ┌────────────────────────────────────┐  │                         │
│  │ 🚚 Shipment Dispatched             │  │                         │
│  │ Shipment dispatched from warehouse │  │                         │
│  │ Order: SO-20251103-0001            │  │                         │
│  │ [logistics] • 14-Nov-2025          │  │                         │
│  │                        ₹ 11,800    │  │                         │
│  └────────────────────────────────────┘  │                         │
│                                          │                         │
│  ┌────────────────────────────────────┐  │                         │
│  │ ✅ Order Delivered                 │  │                         │
│  │ Order delivered to customer        │  │                         │
│  │ Order: SO-20251102-0005            │  │                         │
│  │ [sales] • 10-Nov-2025              │  │                         │
│  │                         ₹ 8,950    │  │                         │
│  └────────────────────────────────────┘  │                         │
│                                          │                         │
└──────────────────────────────────────────┴─────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  ORDER TRACKING                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SO Number          Customer              Product         Delivery   │
│  SO-20251103-0001   Sanika Shankar Mote   Chicken Roll    18-Nov    │
│                                           (20 qty)        2025      │
│                                                                      │
│  Timeline Progress:                                                  │
│                                                                      │
│     ✅                  ✅                    🔄                  ⏳  │
│   Draft            Manufacturing          Shipment           Delivery│
│  03-Nov-2025       10-Nov-2025           14-Nov-2025            -    │
│     ├────────────────────────┤ (completed, green)                   │
│                              ├──────────────┤ (in-progress, blue)   │
│                                             └─────────┤ (pending, gray)
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  ⏰ Last updated: 14:23:45                                           │
└──────────────────────────────────────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Activities (2/3 width)  │  Stats (1/3 width)                  │
└─────────────────────────────────────────────────────────────────┘
Full-width Order Tracking
```

### Tablet (768px - 1023px)

```
┌──────────────────────────────────┬──────────────────────────────┐
│  Activities (1/2)                │  Stats (1/2)                 │
└──────────────────────────────────┴──────────────────────────────┘
Full-width Order Tracking
```

### Mobile (< 768px)

```
┌──────────────────────────────────┐
│  Activities                      │
├──────────────────────────────────┤
│  Stats                           │
├──────────────────────────────────┤
│  Order Tracking                  │
└──────────────────────────────────┘
```

## 🎨 Color Scheme

### Activity Type Icons

- **Invoice**: 🧾 Blue (`text-blue-600`)
- **Manufacturing**: 🏭 Purple (`text-purple-600`)
- **Shipment**: 🚚 Orange (`text-orange-600`)
- **Delivered**: ✅ Green (`text-green-600`)

### Department Badges

- **Sales**: Light Blue background, Dark Blue text
  ```
  bg-blue-100 text-blue-800
  ```
- **Procurement**: Light Purple background, Dark Purple text
  ```
  bg-purple-100 text-purple-800
  ```
- **Logistics**: Light Orange background, Dark Orange text
  ```
  bg-orange-100 text-orange-800
  ```
- **Manufacturing**: Light Indigo background, Dark Indigo text
  ```
  bg-indigo-100 text-indigo-800
  ```

### Timeline Status Colors

- **Completed**: Green
  ```
  Circle: bg-green-100, border-green-300, text-green-700
  Icon: text-green-600
  Line: bg-green-300
  ```
- **In Progress**: Blue (with pulse animation)
  ```
  Circle: bg-blue-100, border-blue-300, text-blue-700
  Icon: text-blue-600 (animate-pulse)
  Line: bg-blue-300
  ```
- **Pending**: Gray
  ```
  Circle: bg-gray-100, border-gray-300, text-gray-600
  Icon: text-gray-400
  Line: bg-gray-300
  ```

### Quick Stats Cards

- **Revenue**: Blue to Blue gradient
  ```
  from-blue-50 to-blue-100, border-blue-200
  ```
- **Orders**: Green to Green gradient
  ```
  from-green-50 to-green-100, border-green-200
  ```
- **Pending**: Orange to Orange gradient
  ```
  from-orange-50 to-orange-100, border-orange-200
  ```

## 📐 Card Styling

### Activity Cards

```css
Padding: 1rem (p-4)
Border: 1px solid rgb(229, 231, 235) (border-gray-100)
Border Radius: 0.5rem (rounded-lg)
Background: White (bg-white)
Hover: Shadow appears (shadow-md)
Transition: 300ms (transition-shadow)
```

### Order Info Cards

```css
Padding: 0.75rem (p-3)
Background: Light gray (bg-gray-50)
Border: 1px solid rgb(229, 231, 235) (border-gray-200)
Border Radius: 0.5rem (rounded-lg)
```

### Timeline Stages

```css
Circle Size: 3rem × 3rem (w-12 h-12)
Border Width: 2px
Line Height: 0.25rem
Line Border Radius: Full (rounded-full)
Connecting Line Width: Flex-grow (adapts to screen)
```

### Quick Stats Cards

```css
Padding: 1.5rem (p-6)
Border Radius: 0.75rem (rounded-xl)
Border: 1px solid (matches gradient theme)
Shadow: sm (shadow-sm)
Background: Gradient (from-color to-color)
Icon Size: 3rem × 3rem (w-12 h-12)
Opacity: 30% (text-opacity-30)
```

## 📝 Typography

### Headings

- **Page Title**: 30px, Bold, Gray-900
- **Section Title**: 18px, Semi-Bold, Gray-900
- **Card Title**: 14px, Medium, Gray-900

### Body Text

- **Card Content**: 14px, Regular, Gray-900
- **Labels**: 12px, Regular, Gray-600
- **Badges**: 12px, Medium, (color varies)
- **Timestamps**: 12px, Regular, Gray-500
- **Stats Values**: 24px, Bold, Color-900

## 🎭 Animation Effects

### Pulse Animation (In-Progress Stages)

```css
Animation: animate-pulse
Icon in active stage pulses to draw attention
Duration: Continuous, 2s cycle
```

### Hover Effects

```css
Activity Cards: Add shadow on hover
Transition: smooth (300ms)
```

## 📊 Data Display Examples

### Amount Formatting

```
Input: 11800
Output: ₹ 11,800 (with comma separator)
Locale: en-IN (Indian format)
```

### Date Formatting

```
Input: 2025-11-15T10:30:00Z
Output: 15-Nov-2025
Format: DD-MMM-YYYY
Locale: en-IN
Invalid dates: Show "N/A" (prevents "Invalid Date")
```

## 🔄 Loading State

```
┌─────────────────────────────────┐
│                                 │
│        ⏳ (spinning)            │
│                                 │
│   Loading dashboard...          │
│                                 │
└─────────────────────────────────┘
```

## 🎯 Interactive Elements

### Activity Cards

- Hover: Subtle shadow appears
- Cursor: Default pointer
- No click action (informational)

### Status Badges

- Non-interactive
- Color-coded for quick recognition

### Timeline

- Non-interactive
- Visual representation only

### Quick Stats

- Non-interactive
- Display current metrics

## 🔧 Responsive Breakpoints

```
Mobile:      < 768px   (md: breakpoint)
Tablet:      768px     - 1024px
Desktop:     ≥ 1024px  (lg: breakpoint)
```

## 📏 Spacing

### Vertical Spacing

- Between sections: 1.5rem (gap-6)
- Between cards: 1rem (gap-4, space-y-4)
- Inside cards: 1rem (p-4)
- Section headers: 1.5rem bottom (mb-6)

### Horizontal Spacing

- Grid gaps: 1.5rem (gap-6)
- Content padding: 1.5rem (p-6)
- Item gaps: 1rem (gap-4)

## 🌈 Visual Hierarchy

1. **Primary**: Page heading "Sales Dashboard" - Largest, boldest
2. **Secondary**: Section titles "Recent Activities", "Order Tracking" - Medium size
3. **Tertiary**: Activity messages, stage labels - Smaller, darker
4. **Quaternary**: Metadata (dates, departments) - Small, lighter gray
5. **Emphasis**: Amounts in cards - Highlighted in respective color

## ✨ Design Principles

1. **Clean & Professional**: Minimal visual clutter, clear information hierarchy
2. **Consistent**: Uniform spacing, typography, and color usage
3. **Responsive**: Adapts seamlessly across all device sizes
4. **Accessible**: Clear labels, sufficient contrast, readable fonts
5. **Intuitive**: Self-explanatory UI, no training needed
6. **Modern**: Rounded corners, soft shadows, smooth animations
7. **Data-Focused**: Information presented clearly without distraction

---

**Last Updated**: 2025-01-16
**Design Version**: 1.0.0
