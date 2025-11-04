const express = require("express");
const { Op } = require("sequelize");
const {
  PurchaseOrder,
  Vendor,
  User,
  Challan,
  SalesOrder,
  Customer,
  Inventory,
  InventoryMovement,
  Product,
  Approval,
  GoodsReceiptNote,
} = require("../config/database");
const { authenticateToken, checkDepartment } = require("../middleware/auth");
const NotificationService = require("../utils/notificationService");
const ActivityService = require("../utils/ActivityService");
const {
  generateBarcode,
  generateBatchBarcode,
  generateInventoryQRData,
} = require("../utils/barcodeUtils");
const router = express.Router();

// ============================================
// PROCUREMENT WORKFLOW ENDPOINTS
// ============================================

// Accept Sales Order (Procurement Only)
router.put(
  "/sales-orders/:id/accept",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const order = await SalesOrder.findByPk(req.params.id, {
        include: [{ model: Customer, as: "customer" }],
      });

      if (!order) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Only accept orders that are in draft status and ready for procurement
      if (order.status !== "draft" || !order.ready_for_procurement) {
        return res.status(400).json({
          message:
            "Order must be in draft status and marked as ready for procurement before acceptance",
          currentStatus: order.status,
          readyForProcurement: order.ready_for_procurement,
        });
      }

      // Update order status to 'confirmed' when procurement accepts
      const lifecycleHistory = order.lifecycle_history || [];
      lifecycleHistory.push({
        timestamp: new Date(),
        stage: "procurement",
        action: "order_accepted",
        previous_status: order.status,
        new_status: "confirmed",
        changed_by: req.user.id,
        changed_by_name: req.user.name,
        notes: "Order confirmed by procurement team",
      });

      await order.update({
        status: "confirmed",
        approved_by: req.user.id,
        approved_at: new Date(),
        lifecycle_history: lifecycleHistory,
      });

      // Notify sales department
      await NotificationService.sendToDepartment("sales", {
        type: "procurement",
        title: `Order Confirmed: ${order.order_number}`,
        message: `Sales Order ${order.order_number} has been confirmed by Procurement Department`,
        priority: "medium",
        related_order_id: order.id,
        action_url: `/sales/orders/${order.id}`,
        metadata: {
          order_number: order.order_number,
          customer_name: order.customer?.name,
          confirmed_by: req.user.name,
          confirmed_at: new Date(),
        },
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });

      res.json({
        message: "Sales order accepted successfully",
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          ready_for_procurement: order.ready_for_procurement,
          approved_by: order.approved_by,
          approved_at: order.approved_at,
        },
      });
    } catch (error) {
      console.error("Error accepting sales order:", error);
      res.status(500).json({ message: "Failed to accept sales order" });
    }
  }
);

// Get confirmed sales orders for PO creation
router.get(
  "/sales-orders-confirmed",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (page - 1) * limit;

      const where = { status: "confirmed" };

      if (search) {
        where[require("sequelize").Op.or] = [
          { order_number: { [require("sequelize").Op.like]: `%${search}%` } },
          {
            special_instructions: {
              [require("sequelize").Op.like]: `%${search}%`,
            },
          },
        ];
      }

      const { count, rows } = await SalesOrder.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "customer_code"],
          },
        ],
        attributes: [
          "id",
          "order_number",
          "delivery_date",
          "total_quantity",
          "special_instructions",
          "items",
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset,
      });

      res.json({
        orders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Error fetching confirmed sales orders:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch confirmed sales orders" });
    }
  }
);

// Generate PO number
const generatePONumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const lastPO = await PurchaseOrder.findOne({
    where: {
      po_number: {
        [require("sequelize").Op.like]: `PO-${dateStr}-%`,
      },
    },
    order: [["created_at", "DESC"]],
  });

  let sequence = 1;
  if (lastPO) {
    const lastSequence = parseInt(lastPO.po_number.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `PO-${dateStr}-${sequence.toString().padStart(4, "0")}`;
};

const STATUS_SEQUENCE = [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "acknowledged",
  "partial_received",
  "received",
  "completed",
];
const VALID_STATUSES = [...STATUS_SEQUENCE, "cancelled"];

const isValidStatusTransition = (currentStatus, nextStatus) => {
  if (nextStatus === undefined || nextStatus === null) {
    return true;
  }

  if (!VALID_STATUSES.includes(nextStatus)) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === "cancelled") {
    return currentStatus !== "cancelled" && currentStatus !== "completed";
  }

  // Allow direct transitions for certain workflows
  const allowedDirectTransitions = {
    draft: ["pending_approval", "sent", "approved"], // Allow direct send to vendor from draft
    pending_approval: ["approved", "sent"], // After approval submission
    approved: ["sent"], // After admin approval
    sent: ["acknowledged", "partial_received", "received"], // Vendor acknowledgment or receipt
    acknowledged: ["partial_received", "received"], // Material receipt stages
    partial_received: ["received", "completed"], // Complete receipt
    received: ["completed"], // Final completion
  };

  if (allowedDirectTransitions[currentStatus]?.includes(nextStatus)) {
    return true;
  }

  // Fallback to sequential validation
  const currentIndex = STATUS_SEQUENCE.indexOf(currentStatus);
  const nextIndex = STATUS_SEQUENCE.indexOf(nextStatus);

  return (
    currentIndex !== -1 &&
    nextIndex !== -1 &&
    nextIndex >= currentIndex &&
    nextIndex <= currentIndex + 1
  );
};

const deriveStatusAuditFields = (
  purchaseOrder,
  nextStatus,
  userId,
  approve = false
) => {
  if (!nextStatus || purchaseOrder.status === nextStatus) {
    return {};
  }

  const now = new Date();
  const updates = {};

  switch (nextStatus) {
    case "sent":
      if (!purchaseOrder.sent_at) {
        updates.sent_at = now;
      }
      break;
    case "acknowledged":
      if (!purchaseOrder.acknowledged_at) {
        updates.acknowledged_at = now;
      }
      break;
    case "partial_received":
      if (!purchaseOrder.received_at) {
        updates.received_at = now;
      }
      break;
    case "received":
      if (!purchaseOrder.received_at) {
        updates.received_at = now;
      }
      break;
    case "completed":
      if (!purchaseOrder.received_at) {
        updates.received_at = now;
      }
      if (!purchaseOrder.approved_at || approve) {
        updates.approved_by = userId;
        updates.approved_at = now;
      }
      break;
    default:
      break;
  }

  return updates;
};

// Get all purchase orders
router.get(
  "/pos",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        vendor_id,
        date_from,
        date_to,
        search,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (status) where.status = status;
      if (vendor_id) where.vendor_id = vendor_id;

      if (date_from || date_to) {
        where.po_date = {};
        if (date_from)
          where.po_date[require("sequelize").Op.gte] = new Date(date_from);
        if (date_to)
          where.po_date[require("sequelize").Op.lte] = new Date(
            date_to + " 23:59:59"
          );
      }

      if (search) {
        where[require("sequelize").Op.or] = [
          { po_number: { [require("sequelize").Op.like]: `%${search}%` } },
          {
            special_instructions: {
              [require("sequelize").Op.like]: `%${search}%`,
            },
          },
        ];
      }

      const { count, rows } = await PurchaseOrder.findAndCountAll({
        where,
        include: [
          {
            model: Vendor,
            as: "vendor",
            attributes: ["id", "name", "vendor_code", "email", "phone"],
          },
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "customer_code", "email", "phone"],
            required: false,
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
          },
          {
            model: SalesOrder,
            as: "salesOrder",
            attributes: [
              "id",
              "order_number",
              "status",
              "delivery_date",
              "total_quantity",
            ],
            include: [
              {
                model: Customer,
                as: "customer",
                attributes: ["id", "name", "customer_code"],
              },
            ],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        purchaseOrders: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Purchase orders fetch error:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  }
);

// Create purchase order
router.post(
  "/pos",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const {
        vendor_id,
        customer_id,
        project_name,
        client_name,
        expected_delivery_date,
        items,
        fabric_requirements,
        accessories,
        cost_summary,
        attachments,
        discount_percentage = 0,
        tax_percentage = 0,
        freight = 0,
        payment_terms,
        delivery_address,
        terms_conditions,
        special_instructions,
        internal_notes,
        priority = "medium",
        status = "draft",
        action_type,
      } = req.body;

      if (
        !vendor_id ||
        !expected_delivery_date ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Vendor, delivery date, and items are required" });
      }

      const vendor = await Vendor.findByPk(vendor_id);
      if (!vendor) {
        return res.status(400).json({ message: "Vendor not found" });
      }

      const total_quantity = items.reduce(
        (sum, item) => sum + (parseFloat(item.quantity) || 0),
        0
      );
      const total_amount = items.reduce(
        (sum, item) => sum + (parseFloat(item.total) || 0),
        0
      );
      const discount_amount = (total_amount * discount_percentage) / 100;
      const afterDiscount = total_amount - discount_amount;
      const tax_amount = (afterDiscount * tax_percentage) / 100;
      const freight_amount = parseFloat(freight) || 0;
      const final_amount = afterDiscount + tax_amount + freight_amount;

      const po_number = await generatePONumber();

      const purchaseOrder = await PurchaseOrder.create({
        po_number,
        vendor_id,
        customer_id: customer_id || null,
        project_name: project_name || null,
        linked_sales_order_id: req.body.linked_sales_order_id || null,
        po_date: new Date(),
        expected_delivery_date,
        items,
        fabric_requirements,
        accessories,
        cost_summary,
        attachments,
        total_quantity,
        total_amount,
        discount_percentage,
        discount_amount,
        tax_percentage,
        tax_amount,
        final_amount,
        payment_terms,
        delivery_address,
        terms_conditions,
        special_instructions,
        internal_notes,
        priority,
        created_by: req.user.id,
        status: status || "draft",
      });

      // Generate barcode for the purchase order
      const barcode = generateBarcode("PO");
      await purchaseOrder.update({ barcode });

      // Update linked sales order status if exists
      if (req.body.linked_sales_order_id) {
        const salesOrder = await SalesOrder.findByPk(
          req.body.linked_sales_order_id,
          {
            include: [{ model: Customer, as: "customer" }],
          }
        );

        if (salesOrder) {
          // Update sales order lifecycle history
          const lifecycleHistory = salesOrder.lifecycle_history || [];
          lifecycleHistory.push({
            timestamp: new Date(),
            stage: "procurement",
            action: "po_created",
            previous_status: salesOrder.status,
            new_status: "procurement_created",
            changed_by: req.user.id,
            changed_by_name: req.user.name,
            notes: `Purchase Order ${po_number} created`,
            po_number: po_number,
          });

          await salesOrder.update({
            status: "procurement_created",
            procurement_status: "po_created",
            lifecycle_history: lifecycleHistory,
          });

          // Send notification to sales department
          await NotificationService.sendToDepartment("sales", {
            type: "procurement",
            title: `Purchase Order Created: ${po_number}`,
            message: `Purchase Order ${po_number} has been created for Sales Order ${salesOrder.order_number}`,
            priority: "medium",
            related_entity_id: purchaseOrder.id,
            related_entity_type: "purchase_order",
            action_url: `/sales/orders/${salesOrder.id}`,
            metadata: {
              po_number: po_number,
              sales_order_number: salesOrder.order_number,
              customer_name: salesOrder.customer?.name,
              vendor_name: vendor.name,
              total_amount: final_amount,
            },
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
        }
      }

      // Send notification to procurement department
      await NotificationService.notifyProcurementAction(
        "created",
        purchaseOrder,
        req.user.id
      );

      // Log activity for PO creation
      const linkedSalesOrderNumber = req.body.linked_sales_order_id
        ? (
            await SalesOrder.findByPk(req.body.linked_sales_order_id, {
              attributes: ["order_number"],
            })
          )?.order_number
        : null;

      await ActivityService.logPurchaseOrderCreated(
        purchaseOrder,
        req.user.id,
        vendor.name,
        linkedSalesOrderNumber
      );

      res.status(201).json({
        message: "Purchase order created successfully",
        purchaseOrder: {
          id: purchaseOrder.id,
          po_number: purchaseOrder.po_number,
          status: purchaseOrder.status,
          total_quantity: purchaseOrder.total_quantity,
          final_amount: purchaseOrder.final_amount,
          linked_sales_order_id: purchaseOrder.linked_sales_order_id,
        },
      });
    } catch (error) {
      console.error("Purchase order creation error:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  }
);

// Update purchase order
router.put(
  "/pos/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        vendor_id,
        customer_id,
        project_name,
        client_name,
        expected_delivery_date,
        items,
        fabric_requirements,
        accessories,
        cost_summary,
        attachments,
        discount_percentage = 0,
        tax_percentage = 0,
        freight = 0,
        payment_terms,
        delivery_address,
        terms_conditions,
        special_instructions,
        internal_notes,
        priority = "medium",
        status,
      } = req.body;

      // Find existing PO
      const purchaseOrder = await PurchaseOrder.findByPk(id);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Validate inputs
      if (
        !vendor_id ||
        !expected_delivery_date ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "Vendor, delivery date, and items are required" });
      }

      const vendor = await Vendor.findByPk(vendor_id);
      if (!vendor) {
        return res.status(400).json({ message: "Vendor not found" });
      }

      // Calculate amounts
      const total_quantity = items.reduce(
        (sum, item) => sum + (parseFloat(item.quantity) || 0),
        0
      );
      const total_amount = items.reduce(
        (sum, item) => sum + (parseFloat(item.total) || 0),
        0
      );
      const discount_amount = (total_amount * discount_percentage) / 100;
      const afterDiscount = total_amount - discount_amount;
      const tax_amount = (afterDiscount * tax_percentage) / 100;
      const freight_amount = parseFloat(freight) || 0;
      const final_amount = afterDiscount + tax_amount + freight_amount;

      // Track change history
      const previousData = {
        vendor_id: purchaseOrder.vendor_id,
        project_name: purchaseOrder.project_name,
        expected_delivery_date: purchaseOrder.expected_delivery_date,
        total_amount: purchaseOrder.total_amount,
        final_amount: purchaseOrder.final_amount,
        priority: purchaseOrder.priority,
      };

      // Build change history
      const changeHistory = purchaseOrder.change_history || [];
      const changes = {};

      if (vendor_id !== purchaseOrder.vendor_id)
        changes.vendor_id = { from: purchaseOrder.vendor_id, to: vendor_id };
      if (project_name !== purchaseOrder.project_name)
        changes.project_name = {
          from: purchaseOrder.project_name,
          to: project_name,
        };
      if (expected_delivery_date !== purchaseOrder.expected_delivery_date)
        changes.expected_delivery_date = {
          from: purchaseOrder.expected_delivery_date,
          to: expected_delivery_date,
        };
      if (priority !== purchaseOrder.priority)
        changes.priority = { from: purchaseOrder.priority, to: priority };

      if (Object.keys(changes).length > 0) {
        changeHistory.push({
          timestamp: new Date(),
          changed_by: req.user.id,
          changed_by_name: req.user.name,
          changes: changes,
        });
      }

      // Update PO
      await purchaseOrder.update({
        vendor_id,
        customer_id: customer_id || null,
        project_name: project_name || null,
        client_name: client_name || null,
        expected_delivery_date,
        items,
        fabric_requirements,
        accessories,
        cost_summary,
        attachments,
        total_quantity,
        total_amount,
        discount_percentage,
        discount_amount,
        tax_percentage,
        tax_amount,
        final_amount,
        payment_terms,
        delivery_address,
        terms_conditions,
        special_instructions,
        internal_notes,
        priority,
        status: status || purchaseOrder.status,
        last_edited_by: req.user.id,
        last_edited_at: new Date(),
        change_history:
          changeHistory.length > 0
            ? changeHistory
            : purchaseOrder.change_history,
      });

      res.json({
        message: "Purchase order updated successfully",
        purchaseOrder: {
          id: purchaseOrder.id,
          po_number: purchaseOrder.po_number,
          status: purchaseOrder.status,
          total_quantity: purchaseOrder.total_quantity,
          final_amount: purchaseOrder.final_amount,
          last_edited_by: req.user.id,
          last_edited_at: new Date(),
        },
      });
    } catch (error) {
      console.error("Purchase order update error:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  }
);

// Create purchase order from sales order
router.post(
  "/pos/from-sales-order/:salesOrderId",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { salesOrderId } = req.params;
      const {
        vendor_id,
        customer_id,
        project_name,
        client_name,
        items,
        fabric_requirements,
        accessories,
        cost_summary,
        attachments,
        discount_percentage = 0,
        tax_percentage = 0,
        freight = 0,
        payment_terms,
        delivery_address,
        terms_conditions,
        special_instructions,
        internal_notes,
        priority = "medium",
        status = "draft",
        action_type,
      } = req.body;

      if (!vendor_id || !items || !Array.isArray(items) || items.length === 0) {
        return res
          .status(400)
          .json({ message: "Vendor and items are required" });
      }

      // Verify sales order exists and is in appropriate status
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [{ model: Customer, as: "customer" }],
      });

      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Allow PO creation from any status (removed strict status check)
      // if (!['confirmed', 'bom_generated'].includes(salesOrder.status)) {
      //   return res.status(400).json({ message: 'Sales order must be confirmed or have BOM generated to create PO' });
      // }

      const vendor = await Vendor.findByPk(vendor_id);
      if (!vendor) {
        return res.status(400).json({ message: "Vendor not found" });
      }

      const total_quantity = items.reduce(
        (sum, item) => sum + (parseFloat(item.quantity) || 0),
        0
      );
      const total_amount = items.reduce(
        (sum, item) => sum + (parseFloat(item.total) || 0),
        0
      );
      const discount_amount = (total_amount * discount_percentage) / 100;
      const afterDiscount = total_amount - discount_amount;
      const tax_amount = (afterDiscount * tax_percentage) / 100;
      const freight_amount = parseFloat(freight) || 0;
      const final_amount = afterDiscount + tax_amount + freight_amount;

      const po_number = await generatePONumber();

      const purchaseOrder = await PurchaseOrder.create({
        po_number,
        vendor_id,
        customer_id: customer_id || salesOrder.customer_id,
        project_name: project_name || salesOrder.customer?.name || null,
        linked_sales_order_id: salesOrderId,
        po_date: new Date(),
        expected_delivery_date: salesOrder.delivery_date, // Use sales order delivery date
        items,
        fabric_requirements,
        accessories,
        cost_summary,
        attachments,
        total_quantity,
        total_amount,
        discount_percentage,
        discount_amount,
        tax_percentage,
        tax_amount,
        final_amount,
        payment_terms,
        delivery_address,
        terms_conditions,
        special_instructions:
          special_instructions || salesOrder.procurement_notes,
        internal_notes:
          internal_notes || `Linked to SO: ${salesOrder.order_number}`,
        priority: priority || salesOrder.priority,
        materials_source: "sales_order",
        created_by: req.user.id,
        status: status || "draft",
      });

      // Update sales order status to indicate procurement has started
      await salesOrder.update({
        status: "procurement_created",
        lifecycle_history: [
          ...(salesOrder.lifecycle_history || []),
          {
            event: "procurement_created",
            timestamp: new Date(),
            user_id: req.user.id,
            details: `Purchase Order ${po_number} created for sales order ${salesOrder.order_number}`,
            status: "procurement_created",
          },
        ],
      });

      // Send notification back to sales
      await NotificationService.sendToDepartment("sales", {
        type: "order",
        title: `PO Created for Sales Order: ${salesOrder.order_number}`,
        message: `Purchase Order ${po_number} has been created for your sales order`,
        priority: "medium",
        related_order_id: salesOrder.id,
        action_url: `/sales/orders/${salesOrder.id}`,
        metadata: {
          sales_order_number: salesOrder.order_number,
          po_number: po_number,
          vendor_name: vendor.name,
          total_amount: final_amount,
          status: "procurement_created",
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.status(201).json({
        message: "Purchase order created successfully from sales order",
        purchaseOrder: {
          id: purchaseOrder.id,
          po_number: purchaseOrder.po_number,
          linked_sales_order_id: purchaseOrder.linked_sales_order_id,
          status: purchaseOrder.status,
          total_quantity: purchaseOrder.total_quantity,
          final_amount: purchaseOrder.final_amount,
        },
        salesOrder: {
          id: salesOrder.id,
          order_number: salesOrder.order_number,
          status: salesOrder.status,
        },
      });
    } catch (error) {
      console.error("Purchase order from sales order creation error:", error);
      res
        .status(500)
        .json({ message: "Failed to create purchase order from sales order" });
    }
  }
);

// Get confirmed sales orders ready for PO creation
router.get(
  "/sales-orders-for-po",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search } = req.query;

      const offset = (page - 1) * limit;
      const where = {
        status: "confirmed",
      };

      if (search) {
        where[Op.or] = [
          { order_number: { [Op.like]: `%${search}%` } },
          { "$customer.name$": { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await SalesOrder.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "customer_code", "email", "phone"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
          },
          {
            model: PurchaseOrder,
            as: "linkedPurchaseOrder",
            attributes: ["id", "po_number", "status"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });

      // Filter out sales orders that already have a PO
      const availableOrders = rows.filter(
        (order) => !order.linkedPurchaseOrder
      );

      res.json({
        salesOrders: availableOrders,
        pagination: {
          total: availableOrders.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(availableOrders.length / limit),
        },
      });
    } catch (error) {
      console.error("Sales orders for PO fetch error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch sales orders for PO creation" });
    }
  }
);

// Get vendors
router.get(
  "/vendors",
  authenticateToken,
  checkDepartment(["procurement", "admin", "outsourcing"]),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        vendor_type,
        category,
        status,
        search,
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      if (vendor_type) where.vendor_type = vendor_type;
      if (category) where.category = category;
      if (status) where.status = status;

      if (search) {
        where[require("sequelize").Op.or] = [
          { name: { [require("sequelize").Op.like]: `%${search}%` } },
          { company_name: { [require("sequelize").Op.like]: `%${search}%` } },
          { vendor_code: { [require("sequelize").Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Vendor.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        vendors: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Vendors fetch error:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  }
);

// Create vendor
router.post(
  "/vendors",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const {
        name,
        company_name,
        contact_person,
        email,
        phone,
        mobile,
        address,
        city,
        state,
        country,
        pincode,
        gst_number,
        pan_number,
        vendor_type,
        category,
        payment_terms,
        credit_limit = 0,
        credit_days = 0,
        status,
        bank_details,
        specializations,
      } = req.body;

      if (!name || !vendor_type) {
        return res
          .status(400)
          .json({ message: "Name and vendor type are required" });
      }

      // Generate vendor code
      const vendorCount = await Vendor.count();
      const vendor_code = `VEN${(vendorCount + 1).toString().padStart(4, "0")}`;

      const vendor = await Vendor.create({
        vendor_code,
        name,
        company_name,
        contact_person,
        email,
        phone,
        mobile,
        address,
        city,
        state,
        country,
        pincode,
        gst_number,
        pan_number,
        vendor_type,
        category,
        payment_terms,
        credit_limit,
        credit_days,
        status: status || "active",
        bank_details,
        specializations,
        created_by: req.user.id,
      });

      res.status(201).json({
        message: "Vendor created successfully",
        vendor,
      });
    } catch (error) {
      console.error("Vendor creation error:", error);
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create vendor" });
    }
  }
);

// Get single vendor
router.get(
  "/vendors/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin", "outsourcing"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await Vendor.findByPk(id, {
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
            required: false,
          },
        ],
      });

      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json({ vendor });
    } catch (error) {
      console.error("Vendor fetch error:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  }
);

// Update vendor
router.put(
  "/vendors/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vendor = await Vendor.findByPk(id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Fields that can be updated
      const allowedFields = [
        "name",
        "company_name",
        "contact_person",
        "email",
        "phone",
        "mobile",
        "address",
        "city",
        "state",
        "country",
        "pincode",
        "gst_number",
        "pan_number",
        "vendor_type",
        "category",
        "payment_terms",
        "credit_limit",
        "credit_days",
        "status",
        "bank_details",
        "specializations",
        "rating",
      ];

      const updates = {};
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      await vendor.update(updates);

      const updatedVendor = await Vendor.findByPk(id, {
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
            required: false,
          },
        ],
      });

      res.json({
        message: "Vendor updated successfully",
        vendor: updatedVendor,
      });
    } catch (error) {
      console.error("Vendor update error:", error);
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update vendor" });
    }
  }
);

// Delete vendor
router.delete(
  "/vendors/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const vendor = await Vendor.findByPk(id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      // Check if vendor has any purchase orders
      const poCount = await PurchaseOrder.count({
        where: { vendor_id: id },
      });

      if (poCount > 0) {
        return res.status(400).json({
          message: `Cannot delete vendor with ${poCount} associated purchase order(s). Consider marking as inactive instead.`,
        });
      }

      await vendor.destroy();

      res.json({ message: "Vendor deleted successfully" });
    } catch (error) {
      console.error("Vendor deletion error:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  }
);

// Get single purchase order
router.get(
  "/pos/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin", "inventory"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        include: [
          {
            model: Vendor,
            as: "vendor",
            attributes: [
              "id",
              "name",
              "vendor_code",
              "email",
              "phone",
              "address",
            ],
          },
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "name", "customer_code", "email", "phone"],
            required: false,
          },
          {
            model: SalesOrder,
            as: "salesOrder",
            attributes: [
              "id",
              "order_number",
              "status",
              "delivery_date",
              "total_quantity",
              "items",
              "procurement_status",
              "lifecycle_history",
            ],
            include: [
              {
                model: Customer,
                as: "customer",
                attributes: ["id", "name", "customer_code"],
              },
            ],
            required: false,
          },
          { model: User, as: "creator", attributes: ["id", "name", "email"] },
          {
            model: User,
            as: "approver",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
      });

      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Ensure items is parsed as JSON (Sequelize should do this automatically, but let's be explicit)
      const poData = purchaseOrder.toJSON();

      // Log for debugging
      console.log("Fetching PO:", id);
      console.log("Items count:", poData.items?.length || 0);

      res.json(poData);
    } catch (error) {
      console.error("Purchase order fetch error:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  }
);

// Submit purchase order for approval
router.post(
  "/pos/:id/submit-for-approval",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      const { id } = req.params;
      const { notes } = req.body;

      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          { model: SalesOrder, as: "salesOrder" },
        ],
        transaction,
      });

      if (!purchaseOrder) {
        await transaction.rollback();
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Only draft POs can be submitted for approval
      if (purchaseOrder.status !== "draft") {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot submit for approval. PO status is '${purchaseOrder.status}'. Only draft POs can be submitted.`,
        });
      }

      // Update PO status to pending_approval
      await purchaseOrder.update(
        {
          status: "pending_approval",
          approval_status: "pending",
          approval_decision_note: notes || "Submitted for admin approval",
        },
        { transaction }
      );

      // Create Approval record
      await Approval.create(
        {
          entity_type: "purchase_order",
          entity_id: purchaseOrder.id,
          stage_key: "admin_approval",
          stage_label: "Admin Approval Required",
          sequence: 1,
          status: "pending",
          assigned_to_user_id: null, // Will be picked by any admin
          created_by: req.user.id,
          metadata: {
            po_number: purchaseOrder.po_number,
            vendor_name: purchaseOrder.vendor?.name,
            customer_name:
              purchaseOrder.customer?.name || purchaseOrder.client_name,
            project_name: purchaseOrder.project_name,
            total_amount: purchaseOrder.final_amount,
            priority: purchaseOrder.priority,
            expected_delivery: purchaseOrder.expected_delivery_date,
          },
        },
        { transaction }
      );

      await transaction.commit();

      // Send notification to Admin Department
      await NotificationService.sendToDepartment("admin", {
        type: "procurement",
        title: `🔔 New PO Approval Request: ${purchaseOrder.po_number}`,
        message: `Purchase Order ${
          purchaseOrder.po_number
        } has been submitted for approval. Vendor: ${
          purchaseOrder.vendor?.name
        }, Amount: ₹${purchaseOrder.final_amount?.toLocaleString()}`,
        priority:
          purchaseOrder.priority === "urgent" ||
          purchaseOrder.priority === "high"
            ? "high"
            : "medium",
        related_entity_id: purchaseOrder.id,
        related_entity_type: "purchase_order",
        action_url: `/procurement/purchase-orders/${purchaseOrder.id}`,
        trigger_event: "po_submitted_for_approval",
        metadata: {
          po_number: purchaseOrder.po_number,
          vendor_name: purchaseOrder.vendor?.name,
          customer_name:
            purchaseOrder.customer?.name || purchaseOrder.client_name,
          project_name: purchaseOrder.project_name,
          total_amount: purchaseOrder.final_amount,
          submitted_by: req.user.name,
          submitted_at: new Date(),
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.json({
        message: "Purchase Order submitted for approval successfully",
        purchaseOrder: {
          id: purchaseOrder.id,
          po_number: purchaseOrder.po_number,
          status: purchaseOrder.status,
          approval_status: purchaseOrder.approval_status,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error submitting PO for approval:", error);
      res
        .status(500)
        .json({
          message: "Failed to submit purchase order for approval",
          error: error.message,
        });
    }
  }
);

// Update purchase order with version history tracking
router.patch(
  "/pos/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const isEditMode = updateData.editMode === true; // Flag to identify edit operations

      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        include: [{ model: User, as: "editor", attributes: ["id", "name"] }],
      });

      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Prevent updates if order is completed or cancelled
      if (["completed", "cancelled"].includes(purchaseOrder.status)) {
        return res
          .status(400)
          .json({
            message: "Cannot update completed or cancelled purchase orders",
          });
      }

      // For edit mode (not just status changes), only allow in draft status
      if (isEditMode && purchaseOrder.status !== "draft") {
        return res.status(400).json({
          message:
            "Purchase orders can only be edited in draft status. Current status: " +
            purchaseOrder.status,
        });
      }

      const updates = {};
      const changeRecord = {
        timestamp: new Date(),
        changed_by: req.user.id,
        changed_by_name: req.user.name,
        changes: {},
        version_before: purchaseOrder.version_number,
        reason: updateData.edit_reason || "PO modification",
      };

      // Handle status update with validation
      if (updateData.status !== undefined && !isEditMode) {
        if (!isValidStatusTransition(purchaseOrder.status, updateData.status)) {
          return res.status(400).json({
            message: `Invalid status transition from ${purchaseOrder.status} to ${updateData.status}`,
          });
        }

        // Derive additional audit fields based on status change
        const auditFields = deriveStatusAuditFields(
          purchaseOrder,
          updateData.status,
          req.user.id,
          updateData.approve
        );
        Object.assign(updates, auditFields);
        updates.status = updateData.status;
        changeRecord.changes.status = {
          from: purchaseOrder.status,
          to: updateData.status,
        };
      }

      // Handle other field updates
      const allowedFields = [
        "expected_delivery_date",
        "items",
        "discount_percentage",
        "tax_percentage",
        "payment_terms",
        "delivery_address",
        "terms_conditions",
        "special_instructions",
        "internal_notes",
        "priority",
      ];

      let itemsChanged = false;

      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          // Track changes for version history
          if (field === "items") {
            const oldItemCount = purchaseOrder.items?.length || 0;
            const newItemCount = updateData[field]?.length || 0;
            changeRecord.changes.items = {
              old_count: oldItemCount,
              new_count: newItemCount,
              items_added: newItemCount - oldItemCount,
              item_details: updateData[field],
            };
            itemsChanged = true;
          } else if (field !== "status") {
            changeRecord.changes[field] = {
              from: purchaseOrder[field],
              to: updateData[field],
            };
          }
          updates[field] = updateData[field];
        }
      });

      // Recalculate totals if items are updated
      if (updates.items) {
        const items = updates.items;
        if (!Array.isArray(items) || items.length === 0) {
          return res
            .status(400)
            .json({ message: "Items array cannot be empty" });
        }

        updates.total_quantity = items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        );
        updates.total_amount = items.reduce(
          (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
          0
        );

        const discount_percentage =
          updates.discount_percentage !== undefined
            ? updates.discount_percentage
            : purchaseOrder.discount_percentage;
        const tax_percentage =
          updates.tax_percentage !== undefined
            ? updates.tax_percentage
            : purchaseOrder.tax_percentage;

        updates.discount_amount =
          (updates.total_amount * discount_percentage) / 100;
        updates.tax_amount =
          ((updates.total_amount - updates.discount_amount) * tax_percentage) /
          100;
        updates.final_amount =
          updates.total_amount - updates.discount_amount + updates.tax_amount;
      } else if (
        updates.discount_percentage !== undefined ||
        updates.tax_percentage !== undefined
      ) {
        // Recalculate amounts if discount or tax percentages changed
        const total_amount =
          updates.total_amount !== undefined
            ? updates.total_amount
            : purchaseOrder.total_amount;
        const discount_percentage =
          updates.discount_percentage !== undefined
            ? updates.discount_percentage
            : purchaseOrder.discount_percentage;
        const tax_percentage =
          updates.tax_percentage !== undefined
            ? updates.tax_percentage
            : purchaseOrder.tax_percentage;

        updates.discount_amount = (total_amount * discount_percentage) / 100;
        updates.tax_amount =
          ((total_amount - updates.discount_amount) * tax_percentage) / 100;
        updates.final_amount =
          total_amount - updates.discount_amount + updates.tax_amount;
      }

      // Track version history for edits
      if (isEditMode && Object.keys(changeRecord.changes).length > 0) {
        updates.version_number = (purchaseOrder.version_number || 1) + 1;
        updates.last_edited_by = req.user.id;
        updates.last_edited_at = new Date();
        updates.requires_reapproval = true; // Mark for re-approval if items were changed

        // Add to change history
        const existingHistory = purchaseOrder.change_history || [];
        changeRecord.version_after = updates.version_number;
        existingHistory.push(changeRecord);
        updates.change_history = existingHistory;

        // If items changed and PO was in pending_approval, reset to draft
        if (itemsChanged && purchaseOrder.status === "pending_approval") {
          updates.status = "draft";
          updates.approval_status = "not_requested";
          updates.approved_by = null;
          updates.approved_at = null;
          changeRecord.changes.approval_reset = {
            reason: "Items modified - PO requires re-submission for approval",
          };
        }
      }

      // Update the purchase order
      await purchaseOrder.update(updates);

      // Update linked sales order status based on PO status if status changed
      if (purchaseOrder.linked_sales_order_id && updateData.status) {
        const soStatus = {
          sent: "po_created",
          acknowledged: "po_created",
          received: "materials_received",
          completed: "materials_received",
        }[updateData.status];

        if (soStatus) {
          await SalesOrder.update(
            { procurement_status: soStatus },
            { where: { id: purchaseOrder.linked_sales_order_id } }
          );
        }
      }

      // Fetch updated purchase order with associations
      const updatedOrder = await PurchaseOrder.findByPk(id, {
        include: [
          {
            model: Vendor,
            as: "vendor",
            attributes: ["id", "name", "vendor_code", "email", "phone"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
          },
          {
            model: User,
            as: "approver",
            attributes: ["id", "name", "employee_id"],
            required: false,
          },
          {
            model: User,
            as: "lastEditor",
            attributes: ["id", "name", "employee_id"],
            required: false,
          },
        ],
      });

      // Send notifications based on status change
      if (updateData.status && !isEditMode) {
        const statusActions = {
          approved: "approved",
          sent: "sent",
          acknowledged: "acknowledged",
          received: "fulfilled",
          completed: "fulfilled",
        };

        const action = statusActions[updateData.status];
        if (action) {
          await NotificationService.notifyProcurementAction(
            action,
            updatedOrder,
            req.user.id
          );
        }
      } else if (isEditMode) {
        // Send notification about PO modification
        await NotificationService.sendToDepartment("procurement", {
          type: "po_modified",
          title: `Purchase Order Modified: ${purchaseOrder.po_number}`,
          message: `PO ${purchaseOrder.po_number} has been updated. Version ${
            updates.version_number || purchaseOrder.version_number
          }.`,
          priority: "medium",
          related_entity_id: updatedOrder.id,
          related_entity_type: "purchase_order",
          action_url: `/procurement/purchase-orders/${updatedOrder.id}`,
          metadata: {
            po_number: updatedOrder.po_number,
            version: updates.version_number || purchaseOrder.version_number,
            modified_by: req.user.name,
            changes: changeRecord.changes,
            requires_reapproval: updates.requires_reapproval || false,
          },
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });
      }

      res.json({
        message: "Purchase order updated successfully",
        purchaseOrder: updatedOrder,
        versionHistory: {
          currentVersion:
            updates.version_number || purchaseOrder.version_number,
          requiresReapproval: updates.requires_reapproval || false,
          lastEditedAt: updates.last_edited_at || null,
          changeRecord: isEditMode ? changeRecord : null,
        },
      });
    } catch (error) {
      console.error("Purchase order update error:", error);
      res
        .status(500)
        .json({
          message: "Failed to update purchase order",
          error: error.message,
        });
    }
  }
);

// Get purchase order change history
router.get(
  "/pos/:id/history",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        attributes: [
          "id",
          "po_number",
          "version_number",
          "change_history",
          "last_edited_at",
          "last_edited_by",
          "created_at",
          "updated_at",
        ],
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
            required: false,
          },
          {
            model: User,
            as: "lastEditor",
            attributes: ["id", "name", "employee_id"],
            required: false,
          },
        ],
      });

      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      const history = purchaseOrder.change_history || [];

      res.json({
        po_number: purchaseOrder.po_number,
        current_version: purchaseOrder.version_number,
        created_at: purchaseOrder.created_at,
        created_by: purchaseOrder.creator,
        last_edited_at: purchaseOrder.last_edited_at,
        last_edited_by: purchaseOrder.lastEditor,
        change_history: history,
        total_changes: history.length,
      });
    } catch (error) {
      console.error("Get PO history error:", error);
      res
        .status(500)
        .json({
          message: "Failed to fetch purchase order history",
          error: error.message,
        });
    }
  }
);

// Get purchase orders summary
router.get(
  "/pos/stats/summary",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const totalOrders = await PurchaseOrder.count();
      const draftOrders = await PurchaseOrder.count({
        where: { status: "draft" },
      });
      const pendingApprovalOrders = await PurchaseOrder.count({
        where: { status: "pending_approval" },
      });
      const sentOrders = await PurchaseOrder.count({
        where: { status: "sent" },
      });
      const acknowledgedOrders = await PurchaseOrder.count({
        where: { status: "acknowledged" },
      });
      const receivedOrders = await PurchaseOrder.count({
        where: { status: "received" },
      });
      const completedOrders = await PurchaseOrder.count({
        where: { status: "completed" },
      });

      const totalValue =
        (await PurchaseOrder.sum("final_amount", {
          where: { status: { [Op.notIn]: ["cancelled", "draft"] } },
        })) || 0;

      const pendingValue =
        (await PurchaseOrder.sum("final_amount", {
          where: {
            status: { [Op.in]: ["sent", "acknowledged", "partial_received"] },
          },
        })) || 0;

      const completedValue =
        (await PurchaseOrder.sum("final_amount", {
          where: { status: "completed" },
        })) || 0;

      res.json({
        total_orders: totalOrders,
        draft_orders: draftOrders,
        pending_approval_orders: pendingApprovalOrders,
        sent_orders: sentOrders,
        acknowledged_orders: acknowledgedOrders,
        received_orders: receivedOrders,
        completed_orders: completedOrders,
        total_value: totalValue,
        pending_value: pendingValue,
        completed_value: completedValue,
      });
    } catch (error) {
      console.error("Purchase orders summary error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch purchase orders summary" });
    }
  }
);

// Delete purchase order
router.delete(
  "/pos/:id",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const purchaseOrder = await PurchaseOrder.findByPk(id);
      if (!purchaseOrder) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Only allow deletion of draft or cancelled orders
      if (!["draft", "cancelled"].includes(purchaseOrder.status)) {
        return res.status(400).json({
          message: "Can only delete draft or cancelled purchase orders",
        });
      }

      // Check if there are any related challans
      const relatedChallanCount = await Challan.count({
        where: {
          order_id: id,
          order_type: "purchase_order",
        },
      });

      if (relatedChallanCount > 0) {
        return res.status(400).json({
          message:
            "Cannot delete purchase order with associated challans. Cancel the order instead.",
        });
      }

      // Store PO number for response
      const poNumber = purchaseOrder.po_number;

      // Delete the purchase order
      await purchaseOrder.destroy();

      res.json({
        message: `Purchase order ${poNumber} deleted successfully`,
      });
    } catch (error) {
      console.error("Purchase order deletion error:", error);
      res.status(500).json({ message: "Failed to delete purchase order" });
    }
  }
);

// Get procurement dashboard stats
router.get(
  "/dashboard/stats",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { period = "month" } = req.query;
      const Op = require("sequelize").Op;
      const fn = require("sequelize").fn;
      const col = require("sequelize").col;

      console.log("Fetching dashboard stats for period:", period);

      let dateFilter = {};
      const now = new Date();

      switch (period) {
        case "today": {
          const todayStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
          dateFilter = { [Op.between]: [todayStart, todayEnd] };
          console.log("Date filter for today:", todayStart, todayEnd);
          break;
        }
        case "week": {
          const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = { [Op.gte]: weekStart };
          console.log("Date filter for week:", weekStart);
          break;
        }
        case "month": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { [Op.gte]: monthStart };
          console.log("Date filter for month:", monthStart);
          break;
        }
        case "year": {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter = { [Op.gte]: yearStart };
          console.log("Date filter for year:", yearStart);
          break;
        }
        default:
          break;
      }

      const whereCreatedAt = Object.keys(dateFilter).length
        ? { created_at: dateFilter }
        : {};

      console.log("whereCreatedAt:", whereCreatedAt);

      // Total POs
      console.log("Counting total POs...");
      const totalPOs = await PurchaseOrder.count({ where: whereCreatedAt });
      console.log("Total POs:", totalPOs);

      // Open POs (not completed or cancelled)
      console.log("Counting open POs...");
      const openPOs = await PurchaseOrder.count({
        where: {
          ...whereCreatedAt,
          status: { [Op.notIn]: ["completed", "cancelled"] },
        },
      });
      console.log("Open POs:", openPOs);

      // Pending approval POs
      console.log("Counting pending POs...");
      const pendingPOs = await PurchaseOrder.count({
        where: {
          ...whereCreatedAt,
          status: "draft",
        },
      });
      console.log("Pending POs:", pendingPOs);

      // Completed POs
      console.log("Counting completed POs...");
      const completedPOs = await PurchaseOrder.count({
        where: {
          ...whereCreatedAt,
          status: "completed",
        },
      });
      console.log("Completed POs:", completedPOs);

      // Total spend (sum of final_amount for completed POs)
      console.log("Summing total spend...");
      const totalSpend = await PurchaseOrder.sum("final_amount", {
        where: {
          ...whereCreatedAt,
          status: "completed",
        },
      });
      console.log("Total spend:", totalSpend);

      // Vendor count
      console.log("Counting vendors...");
      const vendorCount = await Vendor.count();
      console.log("Vendor count:", vendorCount);

      res.json({
        totalPOs,
        openPOs,
        pendingPOs,
        completedPOs,
        totalSpend: totalSpend || 0,
        vendorCount,
      });
    } catch (error) {
      console.error("Procurement dashboard stats error:", error);
      res
        .status(500)
        .json({
          message: "Failed to fetch procurement statistics",
          error: error.message,
        });
    }
  }
);

// Export purchase orders to CSV
router.get(
  "/pos/export",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { status, priority, date_from, date_to, search } = req.query;

      const where = {};

      if (status) where.status = status;
      if (priority) where.priority = priority;

      if (date_from || date_to) {
        where.po_date = {};
        if (date_from) where.po_date[Op.gte] = new Date(date_from);
        if (date_to) where.po_date[Op.lte] = new Date(date_to + " 23:59:59");
      }

      if (search) {
        where[Op.or] = [
          { po_number: { [Op.like]: `%${search}%` } },
          { special_instructions: { [Op.like]: `%${search}%` } },
        ];
      }

      const purchaseOrders = await PurchaseOrder.findAll({
        where,
        include: [
          {
            model: Vendor,
            as: "vendor",
            attributes: ["id", "name", "vendor_code", "email", "phone"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "employee_id"],
          },
          {
            model: SalesOrder,
            as: "salesOrder",
            attributes: ["id", "order_number", "status"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
      });

      // Generate CSV content
      const csvHeaders = [
        "PO Number",
        "PO Date",
        "Status",
        "Priority",
        "Vendor Name",
        "Vendor Code",
        "Linked SO Number",
        "Total Quantity",
        "Total Amount",
        "Discount %",
        "Tax %",
        "Final Amount",
        "Expected Delivery Date",
        "Payment Terms",
        "Created By",
        "Special Instructions",
      ];

      const csvRows = purchaseOrders.map((po) => [
        po.po_number || "",
        po.po_date ? new Date(po.po_date).toLocaleDateString() : "",
        po.status || "",
        po.priority || "",
        po.vendor?.name || "",
        po.vendor?.vendor_code || "",
        po.salesOrder?.order_number || "",
        po.total_quantity || 0,
        po.total_amount || 0,
        po.discount_percentage || 0,
        po.tax_percentage || 0,
        po.final_amount || 0,
        po.expected_delivery_date
          ? new Date(po.expected_delivery_date).toLocaleDateString()
          : "",
        po.payment_terms || "",
        po.creator?.name || "",
        (po.special_instructions || "").replace(/,/g, ";"), // Replace commas to avoid CSV issues
      ]);

      // Create CSV string
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row
            .map((cell) => {
              // Escape cells containing commas, quotes, or newlines
              if (
                typeof cell === "string" &&
                (cell.includes(",") ||
                  cell.includes('"') ||
                  cell.includes("\n"))
              ) {
                return `"${cell.replace(/"/g, '""')}"`;
              }
              return cell;
            })
            .join(",")
        ),
      ].join("\n");

      // Set response headers
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=purchase_orders_${timestamp}.csv`
      );

      res.send(csvContent);
    } catch (error) {
      console.error("Export purchase orders error:", error);
      res
        .status(500)
        .json({
          message: "Failed to export purchase orders",
          error: error.message,
        });
    }
  }
);

// ============================================
// APPROVE PO & CREATE INVENTORY
// ============================================

/**
 * Approve PO and automatically create inventory entries
 * Each PO item becomes an inventory entry with barcode
 */
// NEW WORKFLOW: Just approve PO (doesn't add to inventory)
// PERMISSION: ADMIN ONLY - Procurement cannot approve POs
router.post(
  "/pos/:id/approve",
  authenticateToken,
  checkDepartment(["admin"]),
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      console.log(`[Approve PO] Starting for PO ID: ${req.params.id}`);
      const { notes } = req.body;

      // Get PO with all details
      const po = await PurchaseOrder.findByPk(req.params.id, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          { model: SalesOrder, as: "salesOrder" },
        ],
        transaction,
      });

      if (!po) {
        await transaction.rollback();
        return res.status(404).json({ message: "Purchase Order not found" });
      }

      // Check if PO is in pending_approval status
      if (po.status !== "pending_approval") {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot approve. PO status is '${po.status}'. Must be in 'pending_approval' status.`,
        });
      }

      // Update PO status to 'sent' (approved and automatically sent to vendor)
      await po.update(
        {
          status: "sent",
          approval_status: "approved",
          approved_by: req.user.id,
          approved_date: new Date(),
          approval_notes: notes || "",
          sent_to_vendor_at: new Date(),
        },
        { transaction }
      );

      await transaction.commit();

      // Send notification to Procurement Department (after commit to ensure PO is saved)
      await NotificationService.sendToDepartment("procurement", {
        type: "procurement",
        title: `✅ PO ${po.po_number} Approved & Sent to Vendor`,
        message: `Purchase Order ${
          po.po_number
        } has been approved by admin and automatically sent to vendor ${
          po.vendor?.name || "Unknown"
        }. Track delivery and create GRN when materials arrive.`,
        priority:
          po.priority === "urgent" || po.priority === "high"
            ? "high"
            : "medium",
        related_entity_id: po.id,
        related_entity_type: "purchase_order",
        action_url: `/procurement/purchase-orders/${po.id}`,
        trigger_event: "po_approved_sent_to_vendor",
        metadata: {
          po_number: po.po_number,
          vendor_name: po.vendor?.name,
          customer_name: po.customer?.name || po.client_name,
          project_name: po.project_name,
          total_amount: po.final_amount,
          expected_delivery: po.expected_delivery_date,
          approved_by: req.user.name,
          approved_at: new Date(),
          next_action: "Track delivery and create GRN when materials arrive",
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      // Send notification to Inventory Department (prepare for GRN)
      await NotificationService.sendToDepartment("inventory", {
        type: "inventory",
        title: `📦 Prepare for Material Receipt - PO ${po.po_number}`,
        message: `PO ${po.po_number} approved and sent to vendor ${
          po.vendor?.name
        }. Expected delivery: ${new Date(
          po.expected_delivery_date
        ).toLocaleDateString()}. Prepare for GRN creation.`,
        priority:
          po.priority === "urgent" || po.priority === "high"
            ? "high"
            : "medium",
        related_entity_id: po.id,
        related_entity_type: "purchase_order",
        action_url: `/procurement/purchase-orders/${po.id}`,
        trigger_event: "po_approved_prepare_grn",
        metadata: {
          po_number: po.po_number,
          vendor_name: po.vendor?.name,
          expected_delivery: po.expected_delivery_date,
          items_count: po.items?.length || 0,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.json({
        message: "Purchase Order approved and sent to vendor successfully",
        purchase_order: po,
        next_step: "await_delivery_then_create_grn",
        workflow_info:
          "PO has been sent to vendor. When materials arrive, create GRN for quality verification before adding to inventory.",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error approving PO:", error);
      res
        .status(500)
        .json({
          message: "Failed to approve purchase order",
          error: error.message,
        });
    }
  }
);

// OLD ENDPOINT - Kept for backward compatibility (deprecated)
router.post(
  "/pos/:id/approve-and-add-to-inventory",
  authenticateToken,
  checkDepartment(["procurement", "admin", "inventory"]),
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      console.log(
        `[DEPRECATED] Approve & Add to Inventory - Use new GRN workflow instead`
      );
      const { location = "Main Warehouse", notes } = req.body;

      // Get PO with all details
      const po = await PurchaseOrder.findByPk(req.params.id, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          { model: SalesOrder, as: "salesOrder" },
        ],
      });

      if (!po) {
        await transaction.rollback();
        return res.status(404).json({ message: "Purchase Order not found" });
      }

      // Check if PO is in appropriate status
      if (
        !["draft", "pending_approval", "sent", "acknowledged"].includes(
          po.status
        )
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot add to inventory. PO status is '${po.status}'. Must be in draft, pending_approval, sent, or acknowledged status.`,
        });
      }

      const items = po.items || [];
      if (items.length === 0) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "No items found in purchase order" });
      }

      const createdInventoryItems = [];
      const createdMovements = [];

      // Process each PO item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Skip items without quantity
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          continue;
        }

        // Try to find or create product
        let product = null;
        const productName =
          item.type === "fabric" ? item.fabric_name : item.item_name;
        const productDescription =
          item.type === "fabric"
            ? `${item.fabric_name} - ${item.color || ""} - ${item.gsm || ""}GSM`
            : item.description || item.item_name;

        if (productName) {
          // Try to find existing product
          product = await Product.findOne({
            where: { name: productName },
            transaction,
          });

          // Create product if doesn't exist
          if (!product) {
            product = await Product.create(
              {
                name: productName,
                description: productDescription,
                product_code: `${
                  item.type === "fabric" ? "FAB" : "ACC"
                }-${Date.now()}-${i}`,
                category: item.type === "fabric" ? "Fabric" : "Accessories",
                unit_of_measurement: item.uom || "Meters",
                current_stock: 0,
                is_active: true,
              },
              { transaction }
            );
          }
        }

        // Generate unique barcode and batch number
        const barcode = generateBarcode("INV");
        const batchBarcode = generateBatchBarcode(po.po_number, i);
        const qr_code = generateInventoryQRData(
          {
            barcode,
            product_id: product?.id,
            location,
            current_stock: item.quantity,
          },
          po.po_number
        );

        // Create inventory entry
        const inventoryItem = await Inventory.create(
          {
            product_id: product?.id || null,
            purchase_order_id: po.id,
            po_item_index: i,
            location: location,
            batch_number: batchBarcode,
            serial_number: null,
            current_stock: parseFloat(item.quantity),
            initial_quantity: parseFloat(item.quantity),
            consumed_quantity: 0,
            reserved_stock: 0,
            available_stock: parseFloat(item.quantity),
            minimum_level: 0,
            maximum_level: parseFloat(item.quantity) * 2,
            reorder_level: parseFloat(item.quantity) * 0.2,
            unit_cost: parseFloat(item.rate) || 0,
            total_value: parseFloat(item.total) || 0,
            last_purchase_date: new Date(),
            quality_status: "approved",
            condition: "new",
            notes: notes || `Received from PO: ${po.po_number}`,
            barcode: barcode,
            qr_code: qr_code,
            is_active: true,
            movement_type: "inward",
            last_movement_date: new Date(),
            created_by: req.user.id,
            updated_by: req.user.id,
          },
          { transaction }
        );

        // Create inventory movement record
        const movement = await InventoryMovement.create(
          {
            inventory_id: inventoryItem.id,
            purchase_order_id: po.id,
            movement_type: "inward",
            quantity: parseFloat(item.quantity),
            previous_quantity: 0,
            new_quantity: parseFloat(item.quantity),
            unit_cost: parseFloat(item.rate) || 0,
            total_cost: parseFloat(item.total) || 0,
            reference_number: po.po_number,
            notes: `Initial stock from PO approval: ${po.po_number}`,
            location_to: location,
            performed_by: req.user.id,
            movement_date: new Date(),
            metadata: {
              po_number: po.po_number,
              vendor_name: po.vendor?.name,
              item_description: productDescription,
              item_type: item.type,
            },
          },
          { transaction }
        );

        createdInventoryItems.push({
          ...inventoryItem.toJSON(),
          product: product?.toJSON(),
          item_details: {
            name: productName,
            description: productDescription,
            type: item.type,
            uom: item.uom,
            color: item.color,
            gsm: item.gsm,
          },
        });

        createdMovements.push(movement);
      }

      if (createdInventoryItems.length === 0) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "No valid items to add to inventory" });
      }

      // Update PO status to 'received'
      await po.update(
        {
          status: "received",
          approved_by: req.user.id,
          approved_at: new Date(),
          internal_notes: `${
            po.internal_notes || ""
          }\n\nApproved and added to inventory on ${new Date().toISOString()} by ${
            req.user.name
          }`,
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // Send notification to inventory team
      await NotificationService.sendToDepartment("inventory", {
        type: "inventory",
        title: `New Inventory Added: PO ${po.po_number}`,
        message: `${createdInventoryItems.length} items from Purchase Order ${po.po_number} have been added to inventory`,
        priority: "medium",
        metadata: {
          po_number: po.po_number,
          vendor_name: po.vendor?.name,
          items_count: createdInventoryItems.length,
          location: location,
        },
      });

      res.status(201).json({
        success: true,
        message: `Purchase Order approved and ${createdInventoryItems.length} items added to inventory successfully`,
        data: {
          purchase_order: {
            id: po.id,
            po_number: po.po_number,
            status: "received",
            vendor: po.vendor?.name,
          },
          inventory_items: createdInventoryItems,
          movements: createdMovements.length,
          location: location,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error approving PO and adding to inventory:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "Failed to approve PO and add to inventory",
        error: error.message,
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Mark Materials as Received (Auto-creates GRN request)
router.post(
  "/purchase-orders/:poId/material-received",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      const { poId } = req.params;

      // Get PO with details
      const po = await PurchaseOrder.findByPk(poId, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          { model: SalesOrder, as: "salesOrder" },
        ],
        transaction,
      });

      if (!po) {
        await transaction.rollback();
        return res.status(404).json({ message: "Purchase Order not found" });
      }

      // Check if PO is in appropriate status
      if (!["sent", "acknowledged"].includes(po.status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot mark as received. PO status is '${po.status}'. Must be in 'sent' or 'acknowledged' status.`,
        });
      }

      // Check if already marked as received
      if (po.received_at) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "Materials already marked as received for this Purchase Order",
          received_at: po.received_at,
        });
      }

      // Check if GRN already exists
      const existingGRN = await GoodsReceiptNote.findOne({
        where: { purchase_order_id: poId },
        transaction,
      });

      if (existingGRN) {
        await transaction.rollback();
        return res.status(400).json({
          message: "GRN already exists for this Purchase Order",
          grn_number: existingGRN.grn_number,
        });
      }

      // Check if GRN request already pending
      const existingRequest = await Approval.findOne({
        where: {
          entity_type: "grn_creation",
          entity_id: poId,
          status: "pending",
        },
        transaction,
      });

      if (existingRequest) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "GRN creation request already pending for this Purchase Order",
        });
      }

      // Update PO with received information
      const receivedAt = new Date();
      await po.update(
        {
          status: "received",
          received_at: receivedAt,
          internal_notes: `${
            po.internal_notes || ""
          }\n\n[${new Date().toISOString()}] Materials received - confirmed by ${
            req.user.name
          }`,
        },
        { transaction }
      );

      // Get inventory department users for assignment
      const inventoryUsers = await User.findAll({
        where: { department: "inventory", status: "active" },
        attributes: ["id", "name"],
        transaction,
      });

      // Automatically create GRN creation request for Inventory Department
      const approval = await Approval.create(
        {
          entity_type: "grn_creation",
          entity_id: poId,
          stage_key: "grn_creation_request",
          stage_label: "GRN Creation Request - Materials Received",
          sequence: 1,
          status: "pending",
          assigned_to_user_id:
            inventoryUsers.length > 0 ? inventoryUsers[0].id : null,
          created_by: req.user.id,
          metadata: {
            received_at: receivedAt,
            request_notes:
              "Materials received at warehouse - ready for GRN creation",
            po_details: {
              po_number: po.po_number,
              vendor_name: po.vendor?.name,
              customer_name: po.customer?.name,
              project_name: po.project_name,
              expected_delivery_date: po.expected_delivery_date,
              items_count: po.items?.length || 0,
            },
          },
        },
        { transaction }
      );

      await transaction.commit();

      // Send notification to Inventory Department
      await NotificationService.sendToDepartment("inventory", {
        type: "inventory",
        title: `📦 Materials Received - PO ${po.po_number}`,
        message: `Materials from ${po.vendor?.name} for PO ${po.po_number} have been received at the warehouse. Please create GRN to verify and add to inventory.`,
        priority:
          po.priority === "urgent" || po.priority === "high"
            ? "high"
            : "medium",
        related_entity_id: po.id,
        related_entity_type: "purchase_order",
        action_url: `/inventory/grn/create?po_id=${po.id}`,
        trigger_event: "materials_received_grn_requested",
        metadata: {
          po_number: po.po_number,
          vendor_name: po.vendor?.name,
          received_at: receivedAt,
          items_count: po.items?.length || 0,
          total_amount: po.final_amount,
        },
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      });

      // Send notification to Procurement Department
      await NotificationService.sendToDepartment("procurement", {
        type: "procurement",
        title: `✅ PO ${po.po_number} - Materials Received`,
        message: `PO ${po.po_number} materials have been marked as received. GRN request automatically created for Inventory department to verify and add to stock.`,
        priority: "low",
        related_entity_id: po.id,
        related_entity_type: "purchase_order",
        action_url: `/procurement/purchase-orders/${po.id}`,
        trigger_event: "materials_received_confirmed",
        metadata: {
          po_number: po.po_number,
          vendor_name: po.vendor?.name,
          confirmed_by: req.user.name,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.json({
        message:
          "Materials marked as received and GRN request created successfully",
        purchase_order: po,
        grn_request: approval,
        next_step: "awaiting_grn_creation",
        workflow_info:
          "Materials have been received at warehouse. Inventory department has been notified to create GRN for verification and stock addition.",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error marking PO as dispatched:", error);
      res
        .status(500)
        .json({
          message: "Failed to mark purchase order as dispatched",
          error: error.message,
        });
    }
  }
);

// Request GRN Creation (Send to Inventory Department)
router.post(
  "/purchase-orders/:poId/request-grn",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      const { poId } = req.params;
      const { notes } = req.body;

      // Get PO with details
      const po = await PurchaseOrder.findByPk(poId, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          { model: SalesOrder, as: "salesOrder" },
        ],
        transaction,
      });

      if (!po) {
        await transaction.rollback();
        return res.status(404).json({ message: "Purchase Order not found" });
      }

      // Check if PO is in appropriate status for GRN request
      if (!["sent", "acknowledged", "partial_received"].includes(po.status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Cannot request GRN. PO status is '${po.status}'. Must be in sent, acknowledged, or partial_received status.`,
        });
      }

      // Check if GRN already exists for this PO
      const existingGRN = await GoodsReceiptNote.findOne({
        where: { purchase_order_id: poId },
        transaction,
      });

      if (existingGRN) {
        await transaction.rollback();
        return res.status(400).json({
          message: "GRN already exists for this Purchase Order",
          grn_number: existingGRN.grn_number,
        });
      }

      // Check if GRN request already pending
      const existingRequest = await Approval.findOne({
        where: {
          entity_type: "grn_creation",
          entity_id: poId,
          status: "pending",
        },
        transaction,
      });

      if (existingRequest) {
        await transaction.rollback();
        return res.status(400).json({
          message:
            "GRN creation request already pending for this Purchase Order",
        });
      }

      // Get inventory department users for assignment
      const inventoryUsers = await User.findAll({
        where: { department: "inventory", status: "active" },
        attributes: ["id", "name"],
        transaction,
      });

      // Create GRN creation request (Approval)
      const approval = await Approval.create(
        {
          entity_type: "grn_creation",
          entity_id: poId,
          stage_key: "grn_creation_request",
          stage_label: "GRN Creation Request",
          sequence: 1,
          status: "pending",
          assigned_to_user_id:
            inventoryUsers.length > 0 ? inventoryUsers[0].id : null, // Assign to first inventory user
          created_by: req.user.id,
          metadata: {
            request_notes: notes || "",
            po_details: {
              po_number: po.po_number,
              vendor_name: po.vendor?.name,
              customer_name: po.customer?.name,
              project_name: po.project_name,
              expected_delivery_date: po.expected_delivery_date,
              items_count: po.items?.length || 0,
            },
          },
        },
        { transaction }
      );

      // Update PO status to indicate GRN request pending
      await po.update(
        {
          status: "grn_requested",
          internal_notes: `${
            po.internal_notes || ""
          }\n\nGRN creation requested on ${new Date().toISOString()} by ${
            req.user.name
          }`,
        },
        { transaction }
      );

      await transaction.commit();

      // Send notification to Inventory Department
      await NotificationService.sendToDepartment("inventory", {
        type: "grn_request",
        title: `📋 GRN Creation Request: PO ${po.po_number}`,
        message: `Procurement has requested GRN creation for Purchase Order ${po.po_number}. Please review and create GRN when materials arrive.`,
        priority: "high",
        related_entity_id: po.id,
        related_entity_type: "purchase_order",
        action_url: `/inventory/grn-requests/${approval.id}`,
        trigger_event: "grn_creation_requested",
        actor_id: req.user.id,
        metadata: {
          po_number: po.po_number,
          vendor_name: po.vendor?.name,
          customer_name: po.customer?.name,
          project_name: po.project_name,
          expected_delivery_date: po.expected_delivery_date,
          items_count: po.items?.length || 0,
          requested_by: req.user.name,
          request_notes: notes,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      res.json({
        message:
          "GRN creation request sent to Inventory Department successfully",
        approval,
        purchase_order: {
          id: po.id,
          po_number: po.po_number,
          status: "grn_requested",
        },
        next_step: "await_inventory_approval",
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error requesting GRN creation:", error);
      console.error("Error stack:", error.stack);
      console.error(
        "Request user:",
        req.user
          ? {
              id: req.user.id,
              name: req.user.name,
              department: req.user.department,
            }
          : "No user"
      );
      res.status(500).json({
        message: "Failed to request GRN creation",
        error: error.message,
        details: error.errors ? error.errors.map((e) => e.message) : undefined,
      });
    }
  }
);

// Update Purchase Order Status
router.put(
  "/pos/:id/status",
  authenticateToken,
  checkDepartment(["procurement", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Validate status
      const validStatuses = [
        "draft",
        "sent",
        "acknowledged",
        "partial_received",
        "received",
        "completed",
        "cancelled",
        "grn_requested",
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        });
      }

      // Get PO
      const po = await PurchaseOrder.findByPk(id, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          { model: SalesOrder, as: "salesOrder" },
        ],
      });

      if (!po) {
        return res.status(404).json({ message: "Purchase Order not found" });
      }

      // Track status change history
      const statusHistory = po.status_history || [];
      statusHistory.push({
        timestamp: new Date(),
        previous_status: po.status,
        new_status: status,
        changed_by: req.user.id,
        changed_by_name: req.user.name,
        notes: notes || "",
      });

      // Update PO status
      await po.update({
        status: status,
        status_history: statusHistory,
        updated_at: new Date(),
      });

      // Send notifications based on new status
      if (status === "received") {
        await NotificationService.sendToDepartment("procurement", {
          type: "purchase_order",
          title: `Purchase Order Received: ${po.po_number}`,
          message: `Purchase Order ${po.po_number} has been marked as received`,
          priority: "medium",
          related_order_id: po.id,
          action_url: `/procurement/purchase-orders/${po.id}`,
          metadata: {
            po_number: po.po_number,
            vendor_name: po.vendor?.name,
            updated_by: req.user.name,
          },
        });
      }

      res.json({
        message: "Purchase Order status updated successfully",
        purchase_order: {
          id: po.id,
          po_number: po.po_number,
          status: po.status,
          previous_status: statusHistory[statusHistory.length - 2]?.new_status,
          updated_at: po.updated_at,
        },
      });
    } catch (error) {
      console.error("Error updating PO status:", error);
      res.status(500).json({
        message: "Failed to update Purchase Order status",
        error: error.message,
      });
    }
  }
);

module.exports = router;
