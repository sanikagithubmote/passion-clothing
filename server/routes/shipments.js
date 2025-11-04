const express = require("express");
const {
  Shipment,
  SalesOrder,
  Customer,
  CourierPartner,
  CourierAgent,
  ShipmentTracking,
  User,
  ProductionOrder,
  Product,
  ProductionStage,
} = require("../config/database");
const { authenticateToken, checkDepartment } = require("../middleware/auth");
const { Op } = require("sequelize");
const { updateOrderQRCode } = require("../utils/qrCodeUtils");
const ActivityService = require("../utils/ActivityService");
const NotificationService = require("../utils/notificationService");
const router = express.Router();

// Get shipments with filtering and pagination
router.get(
  "/",
  authenticateToken,
  checkDepartment(["shipment", "admin", "sales"]),
  async (req, res) => {
    try {
      const {
        status,
        courier_partner_id,
        courier_company,
        page = 1,
        limit = 10,
        search,
        start_date,
        end_date,
      } = req.query;

      const where = {};
      const include = [
        {
          model: SalesOrder,
          as: "salesOrder",
          include: [{ model: Customer, as: "customer" }],
        },
        {
          model: CourierPartner,
          as: "courierPartner",
        },
        {
          model: CourierAgent,
          as: "courierAgent",
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email"],
        },
        {
          model: ShipmentTracking,
          as: "trackingUpdates",
          order: [["timestamp", "DESC"]],
          limit: 1,
        },
      ];

      // Apply filters
      if (status) where.status = status;
      if (courier_partner_id) where.courier_partner_id = courier_partner_id;
      if (courier_company)
        where.courier_company = { [Op.like]: `%${courier_company}%` };

      // Date range filter
      if (start_date && end_date) {
        where.shipment_date = {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        };
      }

      // Search filter
      if (search) {
        where[Op.or] = [
          { shipment_number: { [Op.like]: `%${search}%` } },
          { tracking_number: { [Op.like]: `%${search}%` } },
          { recipient_name: { [Op.like]: `%${search}%` } },
          { recipient_phone: { [Op.like]: `%${search}%` } },
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows: shipments } = await Shipment.findAndCountAll({
        where,
        include,
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Calculate statistics
      const stats = await Shipment.findAll({
        attributes: ["status", [Shipment.sequelize.fn("COUNT", "*"), "count"]],
        group: ["status"],
        raw: true,
      });

      const statusCounts = stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {});

      res.json({
        shipments,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
        stats: statusCounts,
      });
    } catch (error) {
      console.error("Shipments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch shipments" });
    }
  }
);

// Get incoming production orders ready for shipment
// IMPORTANT: This route must be defined BEFORE /:id to prevent "incoming" being matched as an ID
router.get(
  "/orders/incoming",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const {
        status = "completed",
        limit = 20,
        exclude_delivered = "true",
      } = req.query;

      // Map generic status to valid ProductionOrder ENUM values
      let statusFilter = status;
      if (status === "ready_for_shipment") {
        // Map ready_for_shipment to completed (explicitly marked ready) or quality_check (in QC)
        // Also include finishing stage as orders there are likely complete
        statusFilter = ["completed", "quality_check", "finishing"];
      } else if (Array.isArray(status)) {
        statusFilter = status;
      }

      // Build filter for production orders nearing completion
      let productionWhere;

      if (status === "ready_for_shipment") {
        // For ready_for_shipment: include these statuses but exclude cancelled/on_hold
        const validReadyStatuses = statusFilter.filter(
          (s) => s !== "on_hold" && s !== "cancelled"
        );
        productionWhere = {
          status: { [Op.in]: validReadyStatuses },
        };
      } else if (Array.isArray(statusFilter)) {
        productionWhere = { status: { [Op.in]: statusFilter } };
      } else {
        productionWhere = { status: statusFilter };
      }

      const productionOrders = await ProductionOrder.findAll({
        where: productionWhere,
        include: [
          {
            model: SalesOrder,
            as: "salesOrder",
            include: [{ model: Customer, as: "customer" }],
          },
          {
            model: Product,
            as: "product",
            attributes: [
              "id",
              "name",
              "product_code",
              "description",
              "status",
              "barcode",
            ],
          },
        ],
        order: [["updated_at", "DESC"]],
        attributes: [
          "id",
          "production_number",
          "status",
          "production_type",
          "priority",
          "quantity",
          "planned_end_date",
          "actual_end_date",
          "sales_order_id",
          "shipment_id",
          "product_id",
          "specifications",
          "updated_at",
        ],
        limit: parseInt(limit, 10),
      });

      const formattedOrders = await Promise.all(
        productionOrders.map(async (order) => {
          const items = Array.isArray(order.salesOrder?.items)
            ? order.salesOrder.items
            : (() => {
                try {
                  return order.salesOrder?.items
                    ? JSON.parse(order.salesOrder.items)
                    : [];
                } catch (err) {
                  console.warn(
                    "Failed to parse sales order items for production order",
                    order.id,
                    err
                  );
                  return [];
                }
              })();

          const computedQuantity = (() => {
            const firstItemQuantity = items?.[0]?.quantity || 0;
            if (firstItemQuantity) return firstItemQuantity;

            const materialQuantity = Array.isArray(order.materialRequirements)
              ? order.materialRequirements[0]?.required_quantity
              : null;
            if (materialQuantity) return materialQuantity;

            const receiptQuantity = Array.isArray(order.receipts)
              ? order.receipts[0]?.total_items_received
              : null;

            return receiptQuantity || order.quantity;
          })();

          // Get shipment details - use shipment_id if available (optimized), fallback to sales_order_id
          let shipment = null;
          if (order.shipment_id) {
            // Direct lookup using shipment_id (faster)
            shipment = await Shipment.findOne({
              where: { id: order.shipment_id },
              attributes: [
                "id",
                "shipment_number",
                "status",
                "tracking_number",
                "created_at",
              ],
            });
          } else if (order.sales_order_id) {
            // Fallback: lookup by sales_order_id for orders without shipment_id yet
            shipment = await Shipment.findOne({
              where: { sales_order_id: order.sales_order_id },
              attributes: [
                "id",
                "shipment_number",
                "status",
                "tracking_number",
                "created_at",
              ],
            });
          }

          return {
            // Production order identifiers
            id: order.id,
            production_number: order.production_number,
            production_status: order.status,
            status: order.status, // For compatibility with UI
            production_type: order.production_type,
            priority: order.priority,
            quantity: computedQuantity,
            planned_completion: order.planned_end_date,
            actual_completion: order.actual_end_date,

            // Sales order linkage
            sales_order_id: order.sales_order_id,
            sales_order_number: order.salesOrder?.order_number || null,
            order_number: order.salesOrder?.order_number || null, // For compatibility
            sales_order_status: order.salesOrder?.status || null,

            // Customer information
            customer_name: order.salesOrder?.customer?.name || "N/A",
            customer_phone:
              order.salesOrder?.customer?.phone ||
              order.salesOrder?.customer?.mobile ||
              null,
            customer_email: order.salesOrder?.customer?.email || null,

            // Delivery information
            shipping_address:
              order.salesOrder?.shipping_address ||
              order.salesOrder?.delivery_address ||
              null,

            // Product information
            product_id: order.product_id,
            product_name:
              order.product?.name ||
              items[0]?.product_name ||
              items[0]?.name ||
              order.specifications?.product_name ||
              (order.product_id ? `Product #${order.product_id}` : "N/A"),
            product_code: order.product?.product_code || null,
            product_status: order.product?.status || null,
            product_barcode: order.product?.barcode || null,
            product_description: order.product?.description || null,

            // Items and specifications
            items,
            specifications: order.specifications || null,

            // Shipment information
            has_shipment: !!shipment,
            shipment_id: shipment?.id || null,
            shipment_number: shipment?.shipment_number || null,
            shipment_status: shipment?.status || null,
            shipment_tracking: shipment?.tracking_number || null,
            shipment_created_at: shipment?.created_at || null,
            can_create_shipment: !shipment, // Can only create if no shipment exists
            is_dispatched: shipment && shipment.status !== "preparing", // Once any status beyond preparing
            is_delivered: shipment && shipment.status === "delivered", // Only if delivered

            // Timestamps
            last_updated: order.updated_at,
            updated_at: order.updated_at, // For compatibility
          };
        })
      );

      // Filter out delivered orders if requested
      const shouldExcludeDelivered =
        exclude_delivered === "true" || exclude_delivered === true;
      const filteredOrders = shouldExcludeDelivered
        ? formattedOrders.filter((order) => !order.is_delivered)
        : formattedOrders;

      res.json({
        orders: filteredOrders,
        total: filteredOrders.length,
      });
    } catch (error) {
      console.error("Incoming orders fetch error:", error);
      res.status(500).json({ message: "Failed to fetch incoming orders" });
    }
  }
);

// Get single shipment by ID
router.get(
  "/:id",
  authenticateToken,
  checkDepartment(["shipment", "admin", "sales"]),
  async (req, res) => {
    try {
      const shipment = await Shipment.findByPk(req.params.id, {
        include: [
          {
            model: SalesOrder,
            as: "salesOrder",
            include: [{ model: Customer, as: "customer" }],
          },
          {
            model: CourierPartner,
            as: "courierPartner",
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
          {
            model: ShipmentTracking,
            as: "trackingUpdates",
            order: [["timestamp", "DESC"]],
            include: [
              {
                model: User,
                as: "creator",
                attributes: ["id", "name", "email"],
              },
            ],
          },
        ],
      });

      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      res.json({ shipment });
    } catch (error) {
      console.error("Shipment fetch error:", error);
      res.status(500).json({ message: "Failed to fetch shipment" });
    }
  }
);

// Create new shipment
router.post(
  "/",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const {
        sales_order_id,
        expected_delivery_date,
        items,
        total_quantity,
        total_weight,
        total_volume,
        packaging_details,
        shipping_address,
        courier_partner_id,
        courier_agent_id,
        courier_company,
        shipping_cost,
        insurance_amount,
        cod_amount,
        shipping_method,
        payment_mode,
        special_instructions,
        recipient_name,
        recipient_phone,
        recipient_email,
      } = req.body;

      // Generate shipment number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const lastShipment = await Shipment.findOne({
        where: {
          shipment_number: { [Op.like]: `SHP-${dateStr}-%` },
        },
        order: [["shipment_number", "DESC"]],
      });

      let sequence = 1;
      if (lastShipment) {
        const lastSequence = parseInt(
          lastShipment.shipment_number.split("-")[2]
        );
        sequence = lastSequence + 1;
      }

      const shipment_number = `SHP-${dateStr}-${sequence
        .toString()
        .padStart(4, "0")}`;

      const shipment = await Shipment.create({
        shipment_number,
        sales_order_id,
        expected_delivery_date,
        items,
        total_quantity,
        total_weight,
        total_volume,
        packaging_details,
        shipping_address,
        courier_partner_id: courier_partner_id || null,
        courier_agent_id: courier_agent_id || null,
        courier_company,
        shipping_cost: shipping_cost || 0,
        insurance_amount: insurance_amount || 0,
        cod_amount: cod_amount || 0,
        shipping_method: shipping_method || "standard",
        payment_mode: payment_mode || "prepaid",
        special_instructions,
        recipient_name,
        recipient_phone,
        recipient_email,
        status: "ready_to_ship",
        created_by: req.user.id,
      });

      // Create initial tracking entry
      await ShipmentTracking.create({
        shipment_id: shipment.id,
        status: "ready_to_ship",
        description: "Shipment created and ready for dispatch",
        created_by: req.user.id,
      });

      res.status(201).json({
        message: "Shipment created successfully",
        shipment: await Shipment.findByPk(shipment.id, {
          include: [
            { model: SalesOrder, as: "salesOrder" },
            { model: CourierPartner, as: "courierPartner" },
            { model: CourierAgent, as: "courierAgent" },
          ],
        }),
      });
    } catch (error) {
      console.error("Shipment creation error:", error);
      res.status(500).json({ message: "Failed to create shipment" });
    }
  }
);

// Create shipment from order (for CreateShipmentPage)
router.post(
  "/create-from-order/:salesOrderId",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const { salesOrderId } = req.params;
      const {
        courier_company,
        courier_agent_id,
        agent_id,
        tracking_number,
        expected_delivery_date,
        notes,
        shipping_address,
        recipient_name,
        recipient_phone,
        recipient_email,
      } = req.body;

      // Validate sales order exists
      const salesOrder = await SalesOrder.findByPk(salesOrderId);
      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Check if shipment already exists for this order
      const existingShipment = await Shipment.findOne({
        where: { sales_order_id: salesOrderId },
      });
      if (existingShipment) {
        return res.status(400).json({
          message: "A shipment already exists for this order",
          shipment_id: existingShipment.id,
        });
      }

      // Generate shipment number
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
      const lastShipment = await Shipment.findOne({
        where: {
          shipment_number: { [Op.like]: `SHP-${dateStr}-%` },
        },
        order: [["shipment_number", "DESC"]],
      });

      let sequence = 1;
      if (lastShipment) {
        const lastSequence = parseInt(
          lastShipment.shipment_number.split("-")[2]
        );
        sequence = lastSequence + 1;
      }

      const shipment_number = `SHP-${dateStr}-${sequence
        .toString()
        .padStart(4, "0")}`;

      const shipment = await Shipment.create({
        shipment_number,
        sales_order_id: salesOrderId,
        items: salesOrder.items || [],
        total_quantity: salesOrder.total_quantity || 0,
        expected_delivery_date,
        shipping_address,
        courier_company,
        courier_partner_id: null, // Partner will be assigned later when updating status
        courier_agent_id: courier_agent_id || agent_id || null,
        tracking_number,
        special_instructions: notes,
        recipient_name,
        recipient_phone,
        recipient_email,
        status: "ready_to_ship",
        created_by: req.user.id,
      });

      // Create initial tracking entry
      const agentId = courier_agent_id || agent_id;
      const trackingDescription = agentId
        ? `Shipment created and assigned to agent: ${agentId}`
        : "Shipment created and ready for dispatch";

      await ShipmentTracking.create({
        shipment_id: shipment.id,
        status: "ready_to_ship",
        description: trackingDescription,
        created_by: req.user.id,
      });

      res.status(201).json({
        message: "Shipment created successfully",
        shipment: await Shipment.findByPk(shipment.id, {
          include: [
            { model: SalesOrder, as: "salesOrder" },
            { model: CourierPartner, as: "courierPartner" },
            { model: CourierAgent, as: "courierAgent" },
          ],
        }),
      });
    } catch (error) {
      console.error("Shipment creation error:", error);
      res.status(500).json({
        message: "Failed to create shipment",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Update shipment
router.put(
  "/:id",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const shipment = await Shipment.findByPk(req.params.id);

      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      const {
        expected_delivery_date,
        items,
        total_quantity,
        total_weight,
        total_volume,
        packaging_details,
        shipping_address,
        courier_partner_id,
        courier_company,
        tracking_number,
        shipping_cost,
        insurance_amount,
        cod_amount,
        shipping_method,
        payment_mode,
        special_instructions,
        recipient_name,
        recipient_phone,
        status,
      } = req.body;

      const oldStatus = shipment.status;

      await shipment.update({
        expected_delivery_date,
        items,
        total_quantity,
        total_weight,
        total_volume,
        packaging_details,
        shipping_address,
        courier_partner_id,
        courier_company,
        tracking_number,
        shipping_cost,
        insurance_amount,
        cod_amount,
        shipping_method,
        payment_mode,
        special_instructions,
        recipient_name,
        recipient_phone,
        status,
        last_status_update:
          status && status !== oldStatus
            ? new Date()
            : shipment.last_status_update,
      });

      // Create tracking entry if status changed
      if (status && status !== oldStatus) {
        await ShipmentTracking.create({
          shipment_id: shipment.id,
          status: status,
          description: `Status updated from ${oldStatus} to ${status}`,
          created_by: req.user.id,
        });
      }

      res.json({
        message: "Shipment updated successfully",
        shipment: await Shipment.findByPk(shipment.id, {
          include: [
            { model: SalesOrder, as: "salesOrder" },
            { model: CourierPartner, as: "courierPartner" },
          ],
        }),
      });
    } catch (error) {
      console.error("Shipment update error:", error);
      res.status(500).json({ message: "Failed to update shipment" });
    }
  }
);

// Delete shipment
router.delete(
  "/:id",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const shipment = await Shipment.findByPk(req.params.id);

      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      // Check if shipment can be deleted (only if not shipped)
      if (
        ["shipped", "in_transit", "out_for_delivery", "delivered"].includes(
          shipment.status
        )
      ) {
        return res.status(400).json({
          message: "Cannot delete shipment that has been shipped or delivered",
        });
      }

      // Delete tracking entries first
      await ShipmentTracking.destroy({
        where: { shipment_id: shipment.id },
      });

      await shipment.destroy();

      res.json({ message: "Shipment deleted successfully" });
    } catch (error) {
      console.error("Shipment deletion error:", error);
      res.status(500).json({ message: "Failed to delete shipment" });
    }
  }
);

// Update shipment status
router.post(
  "/:id/status",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const {
        status,
        location,
        description,
        latitude,
        longitude,
        courier_agent_id,
        tracking_number,
        notes,
      } = req.body;
      const shipment = await Shipment.findByPk(req.params.id, {
        include: [{ model: SalesOrder, as: "salesOrder" }],
      });

      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      // Validate status transition
      const validStatusTransitions = {
        pending: ["preparing", "packed", "ready_to_ship", "shipped"],
        preparing: ["packed", "ready_to_ship", "shipped"],
        packed: ["ready_to_ship", "shipped"],
        ready_to_ship: ["shipped"],
        shipped: ["in_transit"],
        in_transit: ["out_for_delivery", "failed_delivery"],
        out_for_delivery: ["delivered", "failed_delivery"],
        delivered: [],
        failed_delivery: ["in_transit", "returned"],
        returned: [],
        cancelled: [],
      };

      if (!validStatusTransitions[shipment.status]?.includes(status)) {
        return res.status(400).json({
          message: `Invalid status transition from '${shipment.status}' to '${status}'`,
          allowed_transitions: validStatusTransitions[shipment.status],
          current_status: shipment.status,
        });
      }

      // Update shipment status and dispatch info
      await shipment.update({
        status,
        last_status_update: new Date(),
        actual_delivery_date:
          status === "delivered" ? new Date() : shipment.actual_delivery_date,
        courier_agent_id:
          courier_agent_id !== undefined
            ? courier_agent_id
            : shipment.courier_agent_id,
        tracking_number: tracking_number || shipment.tracking_number,
        special_instructions: notes || shipment.special_instructions,
      });

      // Update linked SalesOrder status based on shipment status
      if (shipment.sales_order_id && shipment.salesOrder) {
        const statusMapping = {
          preparing: "order_confirmed",
          packed: "ready_to_ship",
          ready_to_ship: "ready_to_ship",
          shipped: "dispatched",
          in_transit: "in_transit",
          out_for_delivery: "out_for_delivery",
          delivered: "delivered",
          failed_delivery: "failed_delivery",
          returned: "returned",
          cancelled: "cancelled",
        };

        const salesOrderStatus = statusMapping[status] || status;

        await shipment.salesOrder.update({
          status: salesOrderStatus,
          updated_at: new Date(),
        });
      }

      // Create tracking entry
      try {
        await ShipmentTracking.create({
          shipment_id: shipment.id,
          status,
          location,
          description,
          timestamp: new Date(),
          latitude,
          longitude,
          created_by: req.user.id,
        });
      } catch (trackingError) {
        console.error(
          "Tracking entry creation failed (non-blocking):",
          trackingError
        );
        // Continue - shipment status was updated, tracking is optional
      }

      res.json({
        message: "Shipment status updated successfully",
        shipment: await Shipment.findByPk(shipment.id, {
          include: [
            { model: SalesOrder, as: "salesOrder" },
            { model: CourierPartner, as: "courierPartner" },
            { model: CourierAgent, as: "courierAgent" },
          ],
        }),
      });
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({
        message: "Failed to update shipment status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get shipment tracking
router.get(
  "/:id/tracking",
  authenticateToken,
  checkDepartment(["shipment", "admin", "sales"]),
  async (req, res) => {
    try {
      const tracking = await ShipmentTracking.findAll({
        where: { shipment_id: req.params.id },
        include: [
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [["timestamp", "DESC"]],
      });

      res.json({ tracking });
    } catch (error) {
      console.error("Tracking fetch error:", error);
      res.status(500).json({ message: "Failed to fetch tracking information" });
    }
  }
);

// Track by tracking number
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: { tracking_number: req.params.trackingNumber },
      include: [
        {
          model: SalesOrder,
          as: "salesOrder",
          include: [{ model: Customer, as: "customer" }],
        },
        {
          model: CourierPartner,
          as: "courierPartner",
        },
        {
          model: ShipmentTracking,
          as: "trackingUpdates",
          order: [["timestamp", "DESC"]],
        },
      ],
    });

    if (!shipment) {
      return res
        .status(404)
        .json({ message: "Shipment not found with this tracking number" });
    }

    res.json({ shipment });
  } catch (error) {
    console.error("Tracking error:", error);
    res.status(500).json({ message: "Failed to track shipment" });
  }
});

// Get dashboard statistics
router.get(
  "/dashboard/stats",
  authenticateToken,
  checkDepartment(["shipment", "admin", "sales"]),
  async (req, res) => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Total shipments
      const totalShipments = await Shipment.count();

      // Status-wise counts
      const statusCounts = await Shipment.findAll({
        attributes: ["status", [Shipment.sequelize.fn("COUNT", "*"), "count"]],
        group: ["status"],
        raw: true,
      });

      const stats = statusCounts.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {});

      // On-time delivery rate
      const deliveredShipments = await Shipment.findAll({
        where: {
          status: "delivered",
          actual_delivery_date: { [Op.not]: null },
        },
        attributes: ["expected_delivery_date", "actual_delivery_date"],
      });

      let onTimeCount = 0;
      deliveredShipments.forEach((shipment) => {
        if (
          new Date(shipment.actual_delivery_date) <=
          new Date(shipment.expected_delivery_date)
        ) {
          onTimeCount++;
        }
      });

      const onTimeDeliveryRate =
        deliveredShipments.length > 0
          ? ((onTimeCount / deliveredShipments.length) * 100).toFixed(1)
          : 0;

      // Average delivery time
      let totalDeliveryDays = 0;
      deliveredShipments.forEach((shipment) => {
        const shipDate = new Date(shipment.shipment_date);
        const deliveryDate = new Date(shipment.actual_delivery_date);
        const diffTime = Math.abs(deliveryDate - shipDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalDeliveryDays += diffDays;
      });

      const avgDeliveryTime =
        deliveredShipments.length > 0
          ? (totalDeliveryDays / deliveredShipments.length).toFixed(1)
          : 0;

      res.json({
        totalShipments,
        inTransit: stats.in_transit || 0,
        delivered: stats.delivered || 0,
        delayed: stats.delayed || 0,
        onTimeDeliveryRate: parseFloat(onTimeDeliveryRate),
        avgDeliveryTime: parseFloat(avgDeliveryTime),
        statusBreakdown: stats,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  }
);

// Export shipments data
router.get(
  "/export/data",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const { format = "json", start_date, end_date, status } = req.query;

      const where = {};
      if (start_date && end_date) {
        where.shipment_date = {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        };
      }
      if (status) where.status = status;

      const shipments = await Shipment.findAll({
        where,
        include: [
          {
            model: SalesOrder,
            as: "salesOrder",
            include: [{ model: Customer, as: "customer" }],
          },
          {
            model: CourierPartner,
            as: "courierPartner",
          },
        ],
        order: [["created_at", "DESC"]],
      });

      if (format === "csv") {
        // Convert to CSV format
        const csvData = shipments.map((shipment) => ({
          "Shipment Number": shipment.shipment_number,
          "Order Number": shipment.salesOrder?.order_number || "",
          Customer: shipment.salesOrder?.customer?.name || "",
          Courier:
            shipment.courierPartner?.name || shipment.courier_company || "",
          "Tracking Number": shipment.tracking_number || "",
          Status: shipment.status,
          "Shipment Date": shipment.shipment_date,
          "Expected Delivery": shipment.expected_delivery_date,
          "Actual Delivery": shipment.actual_delivery_date || "",
          "Shipping Cost": shipment.shipping_cost,
        }));

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=shipments.csv"
        );

        // Simple CSV conversion
        const headers = Object.keys(csvData[0] || {});
        const csvContent = [
          headers.join(","),
          ...csvData.map((row) =>
            headers.map((header) => `"${row[header]}"`).join(",")
          ),
        ].join("\n");

        res.send(csvContent);
      } else {
        res.json({ shipments });
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export shipments data" });
    }
  }
);

// Daily shipments report
router.get(
  "/reports/daily",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const startDate = start_date
        ? new Date(start_date)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = end_date ? new Date(end_date) : new Date();

      const dailyData = await Shipment.findAll({
        attributes: [
          [
            Shipment.sequelize.fn(
              "DATE",
              Shipment.sequelize.col("shipment_date")
            ),
            "date",
          ],
          [Shipment.sequelize.fn("COUNT", "*"), "count"],
        ],
        where: {
          shipment_date: {
            [Op.between]: [startDate, endDate],
          },
        },
        group: [
          Shipment.sequelize.fn(
            "DATE",
            Shipment.sequelize.col("shipment_date")
          ),
        ],
        order: [
          [
            Shipment.sequelize.fn(
              "DATE",
              Shipment.sequelize.col("shipment_date")
            ),
            "ASC",
          ],
        ],
        raw: true,
      });

      res.json({ data: dailyData });
    } catch (error) {
      console.error("Daily report error:", error);
      res.status(500).json({ message: "Failed to fetch daily report" });
    }
  }
);

// Status distribution report
router.get(
  "/reports/status-distribution",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const where = {};

      if (start_date && end_date) {
        where.shipment_date = {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        };
      }

      const statusData = await Shipment.findAll({
        attributes: ["status", [Shipment.sequelize.fn("COUNT", "*"), "count"]],
        where,
        group: ["status"],
        raw: true,
      });

      const formattedData = statusData.map((item) => ({
        name: item.status.replace("_", " ").toUpperCase(),
        count: parseInt(item.count),
        status: item.status,
      }));

      res.json({ data: formattedData });
    } catch (error) {
      console.error("Status distribution error:", error);
      res.status(500).json({ message: "Failed to fetch status distribution" });
    }
  }
);

// Courier performance report
router.get(
  "/reports/courier-performance",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const where = {};

      if (start_date && end_date) {
        where.shipment_date = {
          [Op.between]: [new Date(start_date), new Date(end_date)],
        };
      }

      const courierData = await Shipment.findAll({
        attributes: [
          "courier_company",
          [Shipment.sequelize.fn("COUNT", "*"), "totalShipments"],
          [
            Shipment.sequelize.fn(
              "COUNT",
              Shipment.sequelize.literal(
                "CASE WHEN status = 'delivered' THEN 1 END"
              )
            ),
            "deliveredShipments",
          ],
        ],
        where: {
          ...where,
          courier_company: { [Op.not]: null },
        },
        group: ["courier_company"],
        raw: true,
      });

      const formattedData = courierData.map((item) => ({
        name: item.courier_company,
        totalShipments: parseInt(item.totalShipments),
        deliveredShipments: parseInt(item.deliveredShipments || 0),
        deliveryRate:
          item.totalShipments > 0
            ? (
                (parseInt(item.deliveredShipments || 0) /
                  parseInt(item.totalShipments)) *
                100
              ).toFixed(1)
            : 0,
        avgDeliveryTime: Math.floor(Math.random() * 5) + 2, // Mock data for now
      }));

      res.json({ data: formattedData });
    } catch (error) {
      console.error("Courier performance error:", error);
      res.status(500).json({ message: "Failed to fetch courier performance" });
    }
  }
);

// Create shipment from sales order ready to ship
router.post(
  "/create-from-order/:salesOrderId",
  authenticateToken,
  checkDepartment(["shipment", "admin"]),
  async (req, res) => {
    try {
      const {
        courier_company,
        courier_agent_id,
        tracking_number,
        expected_delivery_date,
        notes,
        shipping_address,
        recipient_name,
        recipient_phone,
        recipient_email,
      } = req.body;

      const salesOrder = await SalesOrder.findByPk(req.params.salesOrderId, {
        include: [
          { model: Customer, as: "customer" },
          {
            model: ProductionOrder,
            as: "productionOrders",
            include: [{ model: ProductionStage, as: "stages" }],
          },
        ],
      });

      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      if (
        salesOrder.status !== "ready_to_ship" &&
        salesOrder.status !== "qc_passed"
      ) {
        return res
          .status(400)
          .json({ message: "Sales order is not ready for shipment" });
      }

      // Validate required fields
      if (!shipping_address || !shipping_address.trim()) {
        return res
          .status(400)
          .json({ message: "Shipping address is required" });
      }

      if (!recipient_name || !recipient_name.trim()) {
        return res.status(400).json({ message: "Recipient name is required" });
      }

      if (!recipient_phone || !recipient_phone.trim()) {
        return res.status(400).json({ message: "Recipient phone is required" });
      }

      // Generate shipment number
      const shipmentNumber = `SHP-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}${String(new Date().getDate()).padStart(
        2,
        "0"
      )}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;

      // Create shipment
      const shipment = await Shipment.create({
        shipment_number: shipmentNumber,
        sales_order_id: req.params.salesOrderId,
        shipment_date: new Date(),
        expected_delivery_date:
          expected_delivery_date ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        items: salesOrder.items,
        total_quantity: salesOrder.total_quantity,
        total_weight: 0, // Calculate if needed
        total_volume: 0, // Calculate if needed
        shipping_address: shipping_address.trim(),
        recipient_name: recipient_name.trim(),
        recipient_phone: recipient_phone.trim(),
        recipient_email: recipient_email ? recipient_email.trim() : null,
        courier_company,
        courier_partner_id: null,
        courier_agent_id: courier_agent_id || null,
        tracking_number,
        status: "ready_to_ship",
        created_by: req.user.id,
      });

      // Create tracking entry
      await ShipmentTracking.create({
        shipment_id: shipment.id,
        status: "ready_to_ship",
        description: "Shipment created and ready for dispatch",
        created_by: req.user.id,
      });

      // Update sales order status (keep as ready_to_ship until shipment is actually shipped)
      await salesOrder.update({
        status: "ready_to_ship",
        lifecycle_history: [
          ...(salesOrder.lifecycle_history || []),
          {
            event: "ready_to_ship",
            timestamp: new Date(),
            user: req.user.id,
            details: `Shipment ${shipmentNumber} created and ready for dispatch`,
          },
        ],
      });

      // Update QR code
      await updateOrderQRCode(salesOrder.id, "shipped");

      res.status(201).json({
        message: "Shipment created successfully",
        shipment: await Shipment.findByPk(shipment.id, {
          include: [
            {
              model: SalesOrder,
              as: "salesOrder",
              include: [{ model: Customer, as: "customer" }],
            },
            { model: CourierPartner, as: "courierPartner" },
            { model: CourierAgent, as: "courierAgent" },
          ],
        }),
      });
    } catch (error) {
      console.error("Create shipment error:", error.message, error);
      res.status(500).json({
        message: "Failed to create shipment",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Update shipment status (QC, Packed, Shipped, In Transit, Delivered, etc.)
router.patch(
  "/:id/status",
  authenticateToken,
  checkDepartment(["shipment", "warehouse", "admin"]),
  async (req, res) => {
    try {
      const {
        status,
        notes,
        tracking_number,
        courier_company,
        courier_partner_id,
        courier_agent_id,
      } = req.body;

      const shipment = await Shipment.findByPk(req.params.id, {
        include: [
          {
            model: SalesOrder,
            as: "salesOrder",
            include: [{ model: Customer, as: "customer" }],
          },
          {
            model: CourierPartner,
            as: "courierPartner",
          },
        ],
      });

      if (!shipment) {
        return res.status(404).json({ message: "Shipment not found" });
      }

      // Validate status transition
      const validStatusTransitions = {
        pending: ["preparing", "packed", "ready_to_ship", "shipped"],
        preparing: ["packed", "ready_to_ship", "shipped"],
        packed: ["ready_to_ship", "shipped"],
        ready_to_ship: ["shipped"],
        shipped: ["in_transit"],
        in_transit: ["out_for_delivery", "failed_delivery"],
        out_for_delivery: ["delivered", "failed_delivery"],
        delivered: [],
        failed_delivery: ["in_transit", "returned"],
        returned: [],
        cancelled: [],
      };

      if (!validStatusTransitions[shipment.status]?.includes(status)) {
        return res.status(400).json({
          message: `Invalid status transition from '${shipment.status}' to '${status}'`,
          allowed_transitions: validStatusTransitions[shipment.status],
        });
      }

      const oldStatus = shipment.status;

      // Update shipment
      await shipment.update({
        status,
        tracking_number: tracking_number || shipment.tracking_number,
        courier_company: courier_company || shipment.courier_company,
        courier_partner_id:
          courier_partner_id !== undefined
            ? courier_partner_id
            : shipment.courier_partner_id,
        courier_agent_id:
          courier_agent_id !== undefined
            ? courier_agent_id
            : shipment.courier_agent_id,
        last_status_update: new Date(),
      });

      // Create tracking entry
      const statusDescriptions = {
        preparing: "Preparing shipment for dispatch",
        packed: "Order has been packed",
        ready_to_ship: "Ready for shipment",
        shipped: "Shipment has been dispatched",
        in_transit: "Shipment is in transit",
        out_for_delivery: "Shipment is out for delivery",
        delivered: "Shipment has been delivered",
        failed_delivery: "Delivery attempt failed",
        returned: "Shipment has been returned",
        cancelled: "Shipment has been cancelled",
      };

      await ShipmentTracking.create({
        shipment_id: shipment.id,
        status: status,
        description:
          notes || statusDescriptions[status] || `Status updated to ${status}`,
        timestamp: new Date(),
        created_by: req.user.id,
      });

      // Update sales order status if needed
      const salesOrderStatusMap = {
        shipped: "shipped",
        in_transit: "in_transit",
        out_for_delivery: "out_for_delivery",
        delivered: "delivered",
      };

      if (salesOrderStatusMap[status]) {
        await shipment.salesOrder?.update({
          status: salesOrderStatusMap[status],
          shipped_at:
            status === "shipped" ? new Date() : shipment.salesOrder.shipped_at,
          delivered_at:
            status === "delivered"
              ? new Date()
              : shipment.salesOrder.delivered_at,
        });

        // Update QR code (non-blocking - don't fail if QR code update fails)
        try {
          await updateOrderQRCode(
            shipment.sales_order_id,
            salesOrderStatusMap[status]
          );
        } catch (qrError) {
          console.error("QR code update failed (non-blocking):", qrError);
          // Continue - don't throw, this is not critical
        }

        // Log activity for key shipment milestones
        const salesOrderNumber =
          shipment.salesOrder?.sales_order_number ||
          `Order-${shipment.sales_order_id}`;
        const amount = shipment.salesOrder?.final_amount || null;

        if (status === "shipped") {
          await ActivityService.logShipmentDispatched(
            shipment,
            req.user.id,
            salesOrderNumber,
            amount
          );
        } else if (status === "delivered") {
          await ActivityService.logOrderDelivered(
            shipment,
            req.user.id,
            salesOrderNumber,
            amount
          );
        }
      }

      // Send customer notification for key milestones
      if (["shipped", "out_for_delivery", "delivered"].includes(status)) {
        const notificationTexts = {
          shipped: `Your order is on the way! Tracking #${
            shipment.tracking_number || shipment.shipment_number
          }`,
          out_for_delivery: `Your order is out for delivery today!`,
          delivered: `Your order has been delivered. Thank you for your business!`,
        };

        // TODO: Send to customer via SMS/Email using NotificationService
      }

      res.json({
        message: `Shipment status updated from ${oldStatus} to ${status}`,
        shipment: await Shipment.findByPk(shipment.id, {
          include: [
            {
              model: SalesOrder,
              as: "salesOrder",
              include: [{ model: Customer, as: "customer" }],
            },
            {
              model: CourierPartner,
              as: "courierPartner",
            },
            {
              model: ShipmentTracking,
              as: "trackingUpdates",
              order: [["timestamp", "DESC"]],
              limit: 5,
            },
          ],
        }),
      });
    } catch (error) {
      console.error("Shipment status update error:", error);
      res.status(500).json({
        message: "Failed to update shipment status",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get shipment dashboard stats
router.get(
  "/dashboard/stats",
  authenticateToken,
  checkDepartment(["shipment", "warehouse", "admin"]),
  async (req, res) => {
    try {
      const stats = {};
      const shipmentStatuses = [
        "preparing",
        "packed",
        "ready_to_ship",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
        "returned",
        "cancelled",
      ];

      for (const status of shipmentStatuses) {
        const count = await Shipment.count({ where: { status } });
        stats[status] = count;
      }

      const totalShipments = await Shipment.count();
      const activeShipments =
        (stats.shipped || 0) +
        (stats.in_transit || 0) +
        (stats.out_for_delivery || 0);
      const completedShipments = stats.delivered || 0;
      const failedShipments = stats.failed_delivery || 0;

      res.json({
        stats,
        totals: {
          total: totalShipments,
          active: activeShipments,
          completed: completedShipments,
          failed: failedShipments,
          pending:
            totalShipments -
            activeShipments -
            completedShipments -
            failedShipments,
        },
      });
    } catch (error) {
      console.error("Shipment dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  }
);

module.exports = router;
