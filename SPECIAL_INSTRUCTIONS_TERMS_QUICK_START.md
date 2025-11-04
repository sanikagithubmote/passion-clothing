# Special Instructions & Terms & Conditions - Quick Start Guide ⚡

## 🚀 Getting Started (5 minutes)

### What's New?

You now have **two new checkbox-based sections** in Purchase Order creation:

1. **✏️ Add Special Instructions** (Blue)
2. **📋 Add Terms & Conditions** (Purple)

---

## 📖 How to Use

### Creating a New PO

#### Step 1: Open Purchase Order Form

- Navigate to: **Procurement → Purchase Orders → Create New**
- URL: `http://localhost:3000/procurement/purchase-orders/create`

#### Step 2: Fill Basic Information

- Select Vendor
- Add Items
- Set Financial Details

#### Step 3: Add Special Instructions (Optional)

**Location**: In Financial Details section, below Payment Terms

```
Click: ✏️ Add Special Instructions [Optional]
```

**The section expands showing 4 checkboxes**:

- ☐ 1️⃣ I agree goods not returnable or exchangeable
- ☐ 2️⃣ I understand payment per agreed terms and schedule
- ☐ 3️⃣ I accept company not liable for delivery delays
- ☐ 4️⃣ I confirm I reviewed invoice details and found correct

**Select what applies**:

- Check the boxes relevant to your agreement with the vendor
- Example: For a strict vendor, check boxes 1, 2, 3, and 4

#### Step 4: Add Terms & Conditions (Optional)

**Location**: In Financial Details section, below Special Instructions

```
Click: 📋 Add Terms & Conditions [Optional]
```

**The section expands showing 4 checkboxes**:

- ☐ 1️⃣ **Return Policy** — I agree goods not returnable...
- ☐ 2️⃣ **Payment Agreement** — I understand payment per...
- ☐ 3️⃣ **Delivery Liability** — I accept not responsible for delays...
- ☐ 4️⃣ **Verification Confirmation** — I confirm verified order...

**Select what applies**:

- Check the boxes for terms you want to enforce
- Each has a category title (bold) + description

#### Step 5: Submit PO

- Click **Submit** button
- PO is created with selected instructions and terms

---

## 📝 Real-World Examples

### Example 1: Strict Payment Terms PO

**Scenario**: Ordering from a new vendor, want strict terms

**Actions**:

1. Click ✏️ Add Special Instructions
2. Check ALL 4 boxes (all agreements apply)
3. Click 📋 Add Terms & Conditions
4. Check ALL 4 boxes (strict enforcement)
5. Add Payment Terms: "50% advance, 50% on delivery"
6. Submit

**Result**:

- Vendor sees all 8 agreements (4 instructions + 4 terms)
- Clear understanding of expectations
- Reduced disputes

---

### Example 2: Flexible Terms PO

**Scenario**: Ordering from trusted long-time vendor

**Actions**:

1. Click ✏️ Add Special Instructions
2. Check only boxes 2️⃣ & 4️⃣
   - (Payment schedule & Invoice verified)
3. Skip Terms & Conditions (don't click at all)
4. Add Payment Terms: "Net 30 days"
5. Submit

**Result**:

- Minimal terms (more flexible)
- Faster processing
- Tailored to vendor relationship

---

### Example 3: Express Order

**Scenario**: Urgent order, accept delays for speed

**Actions**:

1. Click ✏️ Add Special Instructions
2. Check only box 2️⃣ (payment schedule)
3. Check only box 4️⃣ (invoice verified)
4. Click 📋 Add Terms & Conditions
5. Check only boxes 2️⃣ & 4️⃣
6. Add Payment Terms: "100% upfront"
7. Submit

**Result**:

- Shows you understand delivery may be delayed
- All payment terms clear
- Clear conditions documented

---

## ✏️ Editing Existing PO

### Auto-Fill Feature

When you **edit an existing PO**, the system automatically:

1. **Detects** previously selected checkboxes
2. **Checks** the same boxes again
3. **Expands** the section if any boxes are checked
4. Shows you exactly what was agreed before

### Edit Steps

1. Navigate to PO you want to edit
2. Click **Edit** button
3. Scroll to Financial Details
4. **Notice**: Sections are already expanded (if they had selections)
5. **Notice**: Checkboxes are already checked (matching original)
6. Modify if needed
7. Click **Submit** to save changes

**Example**:

```
Original PO had: Special Instructions boxes 1,3,4 checked
Edit PO:
✓ Section auto-expands
✓ Boxes 1,3,4 are pre-checked
✓ You can uncheck/check others if needed
✓ When saved, new selection is stored
```

---

## 🎯 Key Points

### What Gets Stored?

- Checkbox selections are stored as **comma-separated keys**
- Example: `notReturnable,paymentSchedule,invoiceVerified`
- Stored in existing database fields (no schema changes)

### Can You Add Custom Text?

- **Special Instructions**: Checkboxes only (no custom text field)
- **Terms & Conditions**: Checkboxes only (no custom text field)
- **Payment Terms**: Still has custom text field for flexibility

### What If You Don't Check Anything?

- Field is left empty
- No obligation to use these sections
- All sections are completely optional
- PO can be created without any selections

### What If You Want Different Text?

- Currently locked to 4 predefined options per section
- If you need custom text, use "Internal Notes" field instead
- Or contact admin to add more predefined options

---

## 🎨 Visual Guide

### Special Instructions Section (Blue)

```
┌─ When Collapsed (Not Selected)
│  ☐ ✏️ Add Special Instructions        [Optional]
│
└─ When Expanded (Selected)
   ☑ ✏️ Add Special Instructions        [Optional]

   Select the instructions that apply:
   ☐ 1️⃣  I agree goods not returnable...
   ☑ 2️⃣  I understand payment per schedule...
   ☑ 3️⃣  I accept not liable for delays...
   ☐ 4️⃣  I confirm invoice reviewed...
```

### Terms & Conditions Section (Purple)

```
┌─ When Collapsed (Not Selected)
│  ☐ 📋 Add Terms & Conditions         [Optional]
│
└─ When Expanded (Selected)
   ☑ 📋 Add Terms & Conditions         [Optional]

   Please review and confirm before proceeding:
   ☑ 1️⃣  Return Policy — I agree goods not...
   ☐ 2️⃣  Payment Agreement — I understand...
   ☑ 3️⃣  Delivery Liability — I accept...
   ☑ 4️⃣  Verification Confirmation — I confirm...
```

---

## ❓ FAQs

### Q: Can I type my own terms?

**A**: Not in the checkbox sections. The predefined options cover standard cases. If you need custom terms, use the "Internal Notes" field or contact admin to add new options.

### Q: What happens if I don't select anything?

**A**: The section is optional. Your PO will still be created normally without these selections.

### Q: Can I change selections after creating PO?

**A**: Yes! Edit the PO, and the previous selections will be auto-populated. You can then modify and save.

### Q: Are these mandatory for all POs?

**A**: No, completely optional. You only use them when relevant to your vendor relationship.

### Q: Will existing POs be affected?

**A**: No. Old POs won't show these sections because they were created before this feature. Only new POs and edited POs will have this option.

### Q: Can I use both sections in one PO?

**A**: Yes! Use Special Instructions for vendor agreements and Terms & Conditions for legal terms - they work independently.

### Q: What if I make a mistake checking a box?

**A**: Just uncheck it before submitting. Or if already submitted, edit the PO and correct it.

### Q: Why are there 4 options?

**A**: These cover the most common purchase order terms in the industry. Contact admin if you need different options.

### Q: How long does data stay after creating PO?

**A**: Data is permanently stored with the PO. It's part of the permanent record and can be viewed/edited anytime.

### Q: Can vendors see these selections?

**A**: These are stored in the system. They're visible when viewing the PO details. Consider them part of the PO terms.

---

## 🧪 Quick Test

### Test 1: Create PO with Instructions

1. Create new PO
2. Toggle ✏️ Add Special Instructions
3. Check 2 boxes
4. Submit
5. **Verify**: PO created successfully ✓

### Test 2: Edit PO

1. Create PO (from Test 1)
2. Click Edit
3. **Verify**: Section auto-expanded, boxes pre-checked ✓
4. Uncheck 1 box
5. Submit
6. **Verify**: Edit successful ✓

### Test 3: Mobile View

1. Open PO form on phone/tablet
2. Scroll to Financial Details
3. Toggle sections
4. Click checkboxes
5. **Verify**: All working smoothly ✓

### Test 4: Optional Feature

1. Create PO without touching sections
2. **Verify**: PO works fine without instructions/terms ✓

---

## 🎓 Best Practices

✅ **DO**:

- Select options that match your vendor relationship
- Be consistent with vendors (same terms each time)
- Use Terms & Conditions for legal/formal requirements
- Use Special Instructions for operational requirements
- Review selections when editing

❌ **DON'T**:

- Select boxes you don't actually agree to
- Leave sections expanded if not using them (collapse for clarity)
- Forget to check what was previously agreed (use auto-fill)
- Use for custom notes (use Internal Notes field instead)

---

## 📱 Mobile Usage

### Works Great on Mobile!

- All checkboxes are large enough (44px minimum)
- Text is readable on small screens
- Sections collapse/expand cleanly
- No horizontal scrolling
- Touch-friendly interface

**Mobile Steps**:

1. Scroll to Financial Details
2. Tap "✏️ Add Special Instructions"
3. Section expands
4. Tap checkboxes to select
5. Tap "📋 Add Terms & Conditions"
6. Section expands
7. Tap checkboxes to select
8. Scroll to bottom and tap Submit

---

## ⌨️ Keyboard Usage

### Navigate with Tab

```
Tab → Move to next section
Shift+Tab → Move to previous section
```

### Select with Space

```
When checkbox is focused (highlighted):
Space → Toggle checkbox on/off
```

### Screen Reader

- All labels are properly announced
- Emoji are described
- Checkbox states are clear
- Works with NVDA, JAWS, VoiceOver

---

## 🔗 Related Features

### Also Available

- **✅ Payment Terms & Conditions** (green section)
  - 4 predefined payment-related terms
  - - Custom Payment Terms field
- **Internal Notes** (gray section)
  - For internal-only notes
  - Not visible to vendors
  - Good place for custom text

---

## 📞 Support

### Getting Help

- **Question about checkbox options?** Contact admin
- **Want to add more options?** Contact admin (requires code change)
- **Issue with auto-fill?** Check browser console for errors
- **Mobile view not working?** Try refreshing page

### Contact

- Email: [support email]
- Issue Tracker: [GitHub issues]
- Internal Chat: [Slack channel]

---

## 🎉 Summary

| Feature                  | Details                                   |
| ------------------------ | ----------------------------------------- |
| **Special Instructions** | 4 pre-defined checkboxes (blue)           |
| **Terms & Conditions**   | 4 pre-defined checkboxes (purple)         |
| **Auto-Fill**            | Previous selections auto-populate on edit |
| **Optional**             | Both sections completely optional         |
| **Storage**              | Comma-separated keys in database          |
| **Mobile**               | Full responsive support                   |
| **Time Saved**           | ~2-3 minutes per PO                       |

---

## 🚀 You're Ready!

Start using Special Instructions and Terms & Conditions in your next Purchase Order!

**Happy ordering!** 🎉
