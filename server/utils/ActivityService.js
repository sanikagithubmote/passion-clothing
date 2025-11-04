const { Activity } = require("../config/database");

class ActivityService {
  /**
   * Log an activity
   * @param {Object} activityData - Activity data
   * @param {string} activityData.type - Activity type (enum)
   * @param {string} activityData.title - Activity title
   * @param {string} activityData.message - Activity message/description
   * @param {string} activityData.department - Department (enum)
   * @param {string} activityData.order_number - Related order number
   * @param {number} activityData.related_entity_id - Related entity ID
   * @param {string} activityData.related_entity_type - Related entity type
   * @param {number} activityData.amount - Amount (optional)
   * @param {number} activityData.created_by - User ID who triggered activity
   * @param {Object} activityData.metadata - Additional metadata
   * @returns {Promise<Activity>} Created activity record
   */
  static async logActivity(activityData) {
    try {
      const activity = await Activity.create({
        type: activityData.type,
        title: activityData.title,
        message: activityData.message,
        department: activityData.department,
        order_number: activityData.order_number || null,
        related_entity_id: activityData.related_entity_id || null,
        related_entity_type: activityData.related_entity_type || null,
        amount: activityData.amount || null,
        created_by: activityData.created_by || null,
        metadata: activityData.metadata || {},
      });

      return activity;
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw - activity logging should not fail the main operation
      return null;
    }
  }

  /**
   * Log purchase order creation
   */
  static async logPurchaseOrderCreated(
    purchaseOrder,
    userId,
    vendorName,
    linkedSalesOrderNumber
  ) {
    return this.logActivity({
      type: "purchase_order_created",
      title: `Purchase Order Created: ${purchaseOrder.po_number}`,
      message: `Purchase Order ${purchaseOrder.po_number} has been created${
        linkedSalesOrderNumber
          ? ` for Sales Order ${linkedSalesOrderNumber}`
          : ""
      }`,
      department: "procurement",
      order_number: purchaseOrder.po_number,
      related_entity_id: purchaseOrder.id,
      related_entity_type: "purchase_order",
      amount: purchaseOrder.final_amount,
      created_by: userId,
      metadata: {
        po_id: purchaseOrder.id,
        vendor_name: vendorName,
        total_amount: purchaseOrder.final_amount,
        status: purchaseOrder.status,
        linked_sales_order_number: linkedSalesOrderNumber,
      },
    });
  }

  /**
   * Log purchase order update
   */
  static async logPurchaseOrderUpdated(purchaseOrder, userId) {
    return this.logActivity({
      type: "purchase_order_updated",
      title: `Purchase Order Updated: ${purchaseOrder.po_number}`,
      message: `Purchase Order ${purchaseOrder.po_number} has been updated`,
      department: "procurement",
      order_number: purchaseOrder.po_number,
      related_entity_id: purchaseOrder.id,
      related_entity_type: "purchase_order",
      amount: purchaseOrder.final_amount,
      created_by: userId,
    });
  }

  /**
   * Log invoice creation
   */
  static async logInvoiceCreated(invoice, userId, salesOrderNumber, amount) {
    return this.logActivity({
      type: "invoice_created",
      title: `Invoice Created: ${invoice.invoice_number}`,
      message: `Invoice ${invoice.invoice_number} has been created for Sales Order ${salesOrderNumber}`,
      department: "finance",
      order_number: salesOrderNumber,
      related_entity_id: invoice.id,
      related_entity_type: "invoice",
      amount: amount,
      created_by: userId,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        sales_order_number: salesOrderNumber,
      },
    });
  }

  /**
   * Log manufacturing started
   */
  static async logManufacturingStarted(
    productionOrder,
    userId,
    salesOrderNumber,
    amount
  ) {
    return this.logActivity({
      type: "manufacturing_started",
      title: `Manufacturing Started: ${salesOrderNumber}`,
      message: `Manufacturing started for order ${salesOrderNumber}`,
      department: "manufacturing",
      order_number: salesOrderNumber,
      related_entity_id: productionOrder.id,
      related_entity_type: "production_order",
      amount: amount,
      created_by: userId,
      metadata: {
        production_order_id: productionOrder.id,
        sales_order_number: salesOrderNumber,
      },
    });
  }

  /**
   * Log shipment dispatched
   */
  static async logShipmentDispatched(
    shipment,
    userId,
    salesOrderNumber,
    amount
  ) {
    return this.logActivity({
      type: "shipment_dispatched",
      title: `Shipment Dispatched from Warehouse`,
      message: `Shipment dispatched from warehouse for order ${salesOrderNumber}`,
      department: "shipment",
      order_number: salesOrderNumber,
      related_entity_id: shipment.id,
      related_entity_type: "shipment",
      amount: amount,
      created_by: userId,
      metadata: {
        shipment_id: shipment.id,
        sales_order_number: salesOrderNumber,
      },
    });
  }

  /**
   * Log order delivered
   */
  static async logOrderDelivered(shipment, userId, salesOrderNumber, amount) {
    return this.logActivity({
      type: "shipment_delivered",
      title: `Order Delivered to Customer`,
      message: `Order ${salesOrderNumber} delivered to customer`,
      department: "sales",
      order_number: salesOrderNumber,
      related_entity_id: shipment.id,
      related_entity_type: "shipment",
      amount: amount,
      created_by: userId,
      metadata: {
        shipment_id: shipment.id,
        sales_order_number: salesOrderNumber,
      },
    });
  }

  /**
   * Get recent activities
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of activities to fetch (default: 10)
   * @param {number} options.offset - Offset for pagination (default: 0)
   * @param {string} options.department - Filter by department
   * @param {string} options.type - Filter by activity type
   * @returns {Promise<{activities: Array, total: number}>} Activities and total count
   */
  static async getRecentActivities(options = {}) {
    try {
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      const where = {};

      if (options.department) {
        where.department = options.department;
      }

      if (options.type) {
        where.type = options.type;
      }

      const { count, rows } = await Activity.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit: Math.min(limit, 100),
        offset: offset,
      });

      return {
        activities: rows,
        total: count,
        limit,
        offset,
      };
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return { activities: [], total: 0, limit: 0, offset: 0 };
    }
  }

  /**
   * Get activities by entity
   * @param {string} entityType - Entity type (e.g., 'purchase_order')
   * @param {number} entityId - Entity ID
   * @returns {Promise<Array>} Activities related to entity
   */
  static async getActivitiesByEntity(entityType, entityId) {
    try {
      const activities = await Activity.findAll({
        where: {
          related_entity_type: entityType,
          related_entity_id: entityId,
        },
        order: [["created_at", "DESC"]],
      });

      return activities;
    } catch (error) {
      console.error("Error fetching entity activities:", error);
      return [];
    }
  }

  /**
   * Get activities by order number
   */
  static async getActivitiesByOrderNumber(orderNumber) {
    try {
      const activities = await Activity.findAll({
        where: {
          order_number: orderNumber,
        },
        order: [["created_at", "DESC"]],
      });

      return activities;
    } catch (error) {
      console.error("Error fetching order activities:", error);
      return [];
    }
  }
}

module.exports = ActivityService;
