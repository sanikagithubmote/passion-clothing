/**
 * WORKFLOW INTEGRATION SERVICE
 * Hooks into existing routes to trigger ERP automation
 * Call these functions after status updates in your routes
 */

const ERPAutomationService = require("./erpAutomationService");
const PuppeteerPDFService = require("./puppeteerPdfService");

class WorkflowIntegration {
  /**
   * HOOK INTO SALES ORDER UPDATE
   * Call this in your sales route when sales order status changes to 'confirmed'
   *
   * Usage:
   * await WorkflowIntegration.onSalesOrderStatusChange(salesOrderId, 'confirmed', db);
   */
  static async onSalesOrderStatusChange(salesOrderId, newStatus, db) {
    try {
      if (newStatus === "confirmed") {
        console.log(
          `🎯 [WORKFLOW TRIGGER] Sales Order ${salesOrderId} confirmed - Starting automation...`
        );
        await ERPAutomationService.onSalesOrderConfirmed(salesOrderId, db);
      }
    } catch (error) {
      console.error("❌ [WORKFLOW] Sales Order trigger error:", error);
      // Don't throw - let main operation continue
    }
  }

  /**
   * HOOK INTO GRN UPDATE
   * Call this in your procurement route when GRN status changes to 'completed'
   *
   * Usage:
   * await WorkflowIntegration.onGRNStatusChange(grnId, 'completed', db);
   */
  static async onGRNStatusChange(grnId, newStatus, db) {
    try {
      if (newStatus === "completed") {
        console.log(
          `🎯 [WORKFLOW TRIGGER] GRN ${grnId} completed - Starting automation...`
        );
        await ERPAutomationService.onGRNCompleted(grnId, db);
      }
    } catch (error) {
      console.error("❌ [WORKFLOW] GRN trigger error:", error);
    }
  }

  /**
   * HOOK INTO INVENTORY UPDATE
   * Call this when inventory stock is added
   *
   * Usage:
   * await WorkflowIntegration.onInventoryStockAdded(inventoryId, db);
   */
  static async onInventoryStockAdded(inventoryId, db) {
    try {
      console.log(
        `🎯 [WORKFLOW TRIGGER] Inventory stock added - Starting automation...`
      );
      await ERPAutomationService.onInventoryStockAdded(inventoryId, db);
    } catch (error) {
      console.error("❌ [WORKFLOW] Inventory trigger error:", error);
    }
  }

  /**
   * HOOK INTO PRODUCTION ORDER CREATION
   * Call this when production order is created
   *
   * Usage:
   * await WorkflowIntegration.onProductionOrderCreated(productionOrderId, db);
   */
  static async onProductionOrderCreated(productionOrderId, db) {
    try {
      console.log(
        `🎯 [WORKFLOW TRIGGER] Production Order created - Starting automation...`
      );
      await ERPAutomationService.onProductionOrderCreated(
        productionOrderId,
        db
      );
    } catch (error) {
      console.error("❌ [WORKFLOW] Production Order trigger error:", error);
    }
  }

  /**
   * HOOK INTO PRODUCTION STAGE COMPLETION
   * Call this when a production stage is completed
   *
   * Usage:
   * await WorkflowIntegration.onProductionStageCompleted(productionOrderId, stageId, db);
   */
  static async onProductionStageCompleted(productionOrderId, stageId, db) {
    try {
      console.log(
        `🎯 [WORKFLOW TRIGGER] Production Stage completed - Starting automation...`
      );
      await ERPAutomationService.onProductionStageCompleted(
        productionOrderId,
        stageId,
        db
      );
    } catch (error) {
      console.error("❌ [WORKFLOW] Production Stage trigger error:", error);
    }
  }

  /**
   * HOOK INTO SHIPMENT CREATION
   * Call this when shipment is created
   *
   * Usage:
   * await WorkflowIntegration.onShipmentCreated(shipmentId, db);
   */
  static async onShipmentCreated(shipmentId, db) {
    try {
      console.log(
        `🎯 [WORKFLOW TRIGGER] Shipment created - Starting automation...`
      );
      await ERPAutomationService.onShipmentCreated(shipmentId, db);
    } catch (error) {
      console.error("❌ [WORKFLOW] Shipment trigger error:", error);
    }
  }

  /**
   * HOOK INTO DELIVERY CONFIRMATION
   * Call this when delivery is confirmed/completed
   *
   * Usage:
   * await WorkflowIntegration.onDeliveryConfirmed(shipmentId, db);
   */
  static async onDeliveryConfirmed(shipmentId, db) {
    try {
      console.log(
        `🎯 [WORKFLOW TRIGGER] Delivery confirmed - Starting automation...`
      );
      await ERPAutomationService.onDeliveryConfirmed(shipmentId, db);
    } catch (error) {
      console.error("❌ [WORKFLOW] Delivery trigger error:", error);
    }
  }
}

module.exports = WorkflowIntegration;

/**
 * INTEGRATION EXAMPLES
 *
 * ════════════════════════════════════════════════════════════════════════
 * EXAMPLE 1: Integrate into Sales Order Route
 * ════════════════════════════════════════════════════════════════════════
 *
 * In your file: server/routes/sales.js
 *
 * const WorkflowIntegration = require('../services/workflowIntegration');
 *
 * router.put('/orders/:id', async (req, res) => {
 *   try {
 *     const salesOrder = await db.SalesOrder.findByPk(req.params.id);
 *     const newStatus = req.body.status;
 *
 *     await salesOrder.update({ status: newStatus });
 *
 *     // TRIGGER AUTOMATION
 *     await WorkflowIntegration.onSalesOrderStatusChange(
 *       salesOrder.id,
 *       newStatus,
 *       db
 *     );
 *
 *     res.json(salesOrder);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 *
 * ════════════════════════════════════════════════════════════════════════
 * EXAMPLE 2: Integrate into GRN Route
 * ════════════════════════════════════════════════════════════════════════
 *
 * In your file: server/routes/grn.js
 *
 * const WorkflowIntegration = require('../services/workflowIntegration');
 *
 * router.put('/grn/:id/complete', async (req, res) => {
 *   try {
 *     const grn = await db.GoodsReceiptNote.findByPk(req.params.id);
 *
 *     await grn.update({
 *       status: 'completed',
 *       verified_by: req.user.id
 *     });
 *
 *     // TRIGGER AUTOMATION
 *     await WorkflowIntegration.onGRNStatusChange(
 *       grn.id,
 *       'completed',
 *       db
 *     );
 *
 *     res.json(grn);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 *
 * ════════════════════════════════════════════════════════════════════════
 * EXAMPLE 3: Integrate into Manufacturing Route
 * ════════════════════════════════════════════════════════════════════════
 *
 * In your file: server/routes/manufacturing.js
 *
 * const WorkflowIntegration = require('../services/workflowIntegration');
 *
 * router.post('/orders', async (req, res) => {
 *   try {
 *     const productionOrder = await db.ProductionOrder.create(req.body);
 *
 *     // TRIGGER AUTOMATION
 *     await WorkflowIntegration.onProductionOrderCreated(
 *       productionOrder.id,
 *       db
 *     );
 *
 *     res.json(productionOrder);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 *
 * router.put('/stages/:stageId/complete', async (req, res) => {
 *   try {
 *     const stage = await db.ProductionStage.findByPk(req.params.stageId);
 *     const productionOrder = await stage.getProduction_order();
 *
 *     await stage.update({ status: 'completed' });
 *
 *     // TRIGGER AUTOMATION
 *     await WorkflowIntegration.onProductionStageCompleted(
 *       productionOrder.id,
 *       stage.id,
 *       db
 *     );
 *
 *     res.json(stage);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 *
 * ════════════════════════════════════════════════════════════════════════
 * EXAMPLE 4: Integrate into Shipment Route
 * ════════════════════════════════════════════════════════════════════════
 *
 * In your file: server/routes/shipments.js
 *
 * const WorkflowIntegration = require('../services/workflowIntegration');
 *
 * router.post('/', async (req, res) => {
 *   try {
 *     const shipment = await db.Shipment.create(req.body);
 *
 *     // TRIGGER AUTOMATION
 *     await WorkflowIntegration.onShipmentCreated(
 *       shipment.id,
 *       db
 *     );
 *
 *     res.json(shipment);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 *
 * router.put('/:id/deliver', async (req, res) => {
 *   try {
 *     const shipment = await db.Shipment.findByPk(req.params.id);
 *
 *     await shipment.update({
 *       status: 'delivered',
 *       delivered_at: new Date()
 *     });
 *
 *     // TRIGGER AUTOMATION
 *     await WorkflowIntegration.onDeliveryConfirmed(
 *       shipment.id,
 *       db
 *     );
 *
 *     res.json(shipment);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 *
 * ════════════════════════════════════════════════════════════════════════
 */
