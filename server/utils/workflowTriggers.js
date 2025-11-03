const DocumentService = require("./documentService");

/**
 * Workflow Triggers Service
 * Automatically triggers PDF generation and document attachment based on workflow status changes
 */
class WorkflowTriggers {
  constructor(models) {
    this.models = models;
    this.documentService = new DocumentService(models.DocumentAttachment);
  }

  /**
   * SALES WORKFLOW TRIGGER
   * Triggered when: Sales Order status changes to 'confirmed'
   * Action: Generate Sales Invoice and Auto-create Purchase Order
   */
  async onSalesOrderConfirmed(salesOrder, userId) {
    try {
      console.log(
        "🔔 TRIGGER: Sales Order Confirmed -",
        salesOrder.order_number
      );

      // 1. Generate Sales Invoice PDF
      const invoiceData = {
        id: salesOrder.id,
        order_number: salesOrder.order_number,
        order_date: salesOrder.created_at,
        delivery_date: salesOrder.delivery_date,
        final_amount: salesOrder.final_amount,
        customer_name: salesOrder.customer?.name || "N/A",
        customer_email: salesOrder.customer?.email || "N/A",
        customer_phone: salesOrder.customer?.phone || "N/A",
        customer_address: salesOrder.customer?.billing_address || "N/A",
        items: salesOrder.items || [],
        subtotal: salesOrder.subtotal || 0,
        tax: salesOrder.tax || 0,
        status: "Confirmed",
      };

      await this.documentService.generateAndAttachSalesInvoice(
        invoiceData,
        userId
      );

      // 2. Auto-create Purchase Order (if not already exists)
      if (!salesOrder.linked_po_id) {
        const po = await this.models.PurchaseOrder.create({
          po_number: `PO-${Date.now()}`,
          vendor_id: salesOrder.customer_id, // Or get default vendor
          sales_order_id: salesOrder.id,
          linked_sales_order_id: salesOrder.id,
          items: salesOrder.items,
          final_amount: salesOrder.final_amount,
          status: "draft",
          created_by: userId,
        });

        console.log("✅ Purchase Order auto-created:", po.po_number);
        return { invoice: true, po: po };
      }

      return { invoice: true, po: false };
    } catch (error) {
      console.error("❌ Error in onSalesOrderConfirmed:", error);
      throw error;
    }
  }

  /**
   * PROCUREMENT WORKFLOW TRIGGER
   * Triggered when: GRN status changes to 'completed'
   * Action: Update inventory stock and Generate GRN Slip
   */
  async onGRNCompleted(grn, purchaseOrder, userId) {
    try {
      console.log("🔔 TRIGGER: GRN Completed -", grn.grn_number);

      // 1. Generate GRN PDF
      const grnData = {
        id: grn.id,
        entity_type: "purchase_order",
        entity_id: purchaseOrder.id,
        grn_number: grn.grn_number,
        po_number: purchaseOrder.po_number,
        vendor_name: purchaseOrder.vendor?.name || "N/A",
        vendor_code: purchaseOrder.vendor?.vendor_code || "N/A",
        vendor_email: purchaseOrder.vendor?.email || "N/A",
        vendor_phone: purchaseOrder.vendor?.phone || "N/A",
        total_quantity: grn.total_quantity,
        items: grn.items || [],
        status: "Completed",
        verified_by: userId,
      };

      await this.documentService.generateAndAttachGRN(grnData, userId);

      // 2. Update inventory stock
      if (grn.items && grn.items.length > 0) {
        for (const item of grn.items) {
          const inventory = await this.models.Inventory.findOne({
            where: { product_id: item.product_id },
          });

          if (inventory) {
            await inventory.update({
              quantity_in_stock:
                (inventory.quantity_in_stock || 0) + item.received_quantity,
              status: "available",
            });

            // Log inventory movement
            await this.models.InventoryMovement.create({
              inventory_id: inventory.id,
              transaction_type: "inward",
              quantity: item.received_quantity,
              reference_type: "grn",
              reference_id: grn.id,
              notes: `Stock received from GRN ${grn.grn_number}`,
              created_by: userId,
            });

            console.log(
              `✅ Stock updated for product ${item.product_id}: +${item.received_quantity}`
            );
          }
        }
      }

      // 3. Auto-update Purchase Order status to 'received'
      await purchaseOrder.update({
        status: "received",
        grn_id: grn.id,
      });

      return { grn_generated: true, stock_updated: true };
    } catch (error) {
      console.error("❌ Error in onGRNCompleted:", error);
      throw error;
    }
  }

  /**
   * MANUFACTURING WORKFLOW TRIGGER
   * Triggered when: Production Stage status changes to 'completed'
   * Action: Generate Manufacturing Slip
   */
  async onProductionStageCompleted(stage, productionOrder, userId) {
    try {
      console.log("🔔 TRIGGER: Production Stage Completed -", stage.stage_name);

      // Generate Manufacturing Slip PDF
      const stageData = {
        production_order_id: productionOrder.id,
        stage_id: stage.id,
        stage_name: stage.stage_name,
        sales_order_number: productionOrder.project_reference,
        product_name: productionOrder.product_name,
        quantity: productionOrder.quantity,
        processed_quantity: stage.processed_quantity || 0,
        approved_quantity: stage.approved_quantity || 0,
        rejected_quantity: stage.rejected_quantity || 0,
        material_used: stage.material_used || 0,
        start_date: stage.created_at,
        end_date: new Date(),
        stage_status: "Completed",
        notes: stage.notes,
      };

      await this.documentService.generateAndAttachManufacturingSlip(
        stageData,
        userId
      );

      console.log(
        "✅ Manufacturing Slip generated for stage:",
        stage.stage_name
      );
      return { slip_generated: true };
    } catch (error) {
      console.error("❌ Error in onProductionStageCompleted:", error);
      throw error;
    }
  }

  /**
   * PRODUCTION WORKFLOW TRIGGER
   * Triggered when: Production Order status changes to 'completed'
   * Action: Update associated Sales Order and prepare for shipment
   */
  async onProductionOrderCompleted(productionOrder, userId) {
    try {
      console.log(
        "🔔 TRIGGER: Production Order Completed -",
        productionOrder.id
      );

      // 1. Auto-create Shipment if not exists
      let shipment = await this.models.Shipment.findOne({
        where: { production_order_id: productionOrder.id },
      });

      if (!shipment) {
        shipment = await this.models.Shipment.create({
          production_order_id: productionOrder.id,
          sales_order_id: productionOrder.sales_order_id,
          shipment_number: `SHP-${Date.now()}`,
          status: "pending",
          items: productionOrder.items,
          total_quantity: productionOrder.quantity,
          created_by: userId,
        });

        console.log("✅ Shipment auto-created:", shipment.shipment_number);
      }

      // 2. Update Sales Order status
      if (productionOrder.sales_order_id) {
        await this.models.SalesOrder.update(
          { status: "ready_for_shipment" },
          { where: { id: productionOrder.sales_order_id } }
        );
      }

      return { shipment_created: true };
    } catch (error) {
      console.error("❌ Error in onProductionOrderCompleted:", error);
      throw error;
    }
  }

  /**
   * SHIPMENT WORKFLOW TRIGGER
   * Triggered when: Shipment status changes to 'dispatched'
   * Action: Assign courier and generate tracking
   */
  async onShipmentDispatched(shipment, userId) {
    try {
      console.log(
        "🔔 TRIGGER: Shipment Dispatched -",
        shipment.shipment_number
      );

      // Auto-assign default courier if not already assigned
      if (!shipment.courier_partner_id) {
        const defaultCourier = await this.models.CourierPartner.findOne({
          where: { is_active: true },
          order: [["created_at", "ASC"]],
        });

        if (defaultCourier) {
          await shipment.update({
            courier_partner_id: defaultCourier.id,
          });

          console.log("✅ Courier assigned:", defaultCourier.name);
        }
      }

      // Create tracking entry
      const tracking = await this.models.ShipmentTracking.create({
        shipment_id: shipment.id,
        status: "dispatched",
        location: "Warehouse",
        latitude: null,
        longitude: null,
        notes: "Shipment dispatched from warehouse",
        created_by: userId,
      });

      console.log("✅ Shipment tracking created");
      return { tracking_created: true };
    } catch (error) {
      console.error("❌ Error in onShipmentDispatched:", error);
      throw error;
    }
  }

  /**
   * DELIVERY WORKFLOW TRIGGER
   * Triggered when: Shipment status changes to 'delivered'
   * Action: Generate Delivery Invoice and notify customer
   */
  async onDeliveryCompleted(shipment, salesOrder, userId) {
    try {
      console.log("🔔 TRIGGER: Delivery Completed -", shipment.shipment_number);

      // 1. Generate Delivery Invoice PDF
      const deliveryData = {
        shipment_id: shipment.id,
        shipment_number: shipment.shipment_number,
        sales_order_number: salesOrder.order_number,
        customer_name: salesOrder.customer?.name || "N/A",
        customer_id: salesOrder.customer_id,
        delivery_address: salesOrder.customer?.shipping_address || "N/A",
        courier_name: shipment.courier?.name || "N/A",
        tracking_number: shipment.tracking_number,
        delivered_date: new Date().toLocaleDateString(),
        received_by: "Customer",
        items: salesOrder.items || [],
        total_quantity: shipment.total_quantity,
        subtotal: salesOrder.subtotal || 0,
        tax: salesOrder.tax || 0,
        final_amount: salesOrder.final_amount || 0,
        delivery_status: "Delivered",
      };

      await this.documentService.generateAndAttachDeliveryInvoice(
        deliveryData,
        userId
      );

      // 2. Update Sales Order to 'delivered'
      await this.models.SalesOrder.update(
        {
          status: "delivered",
          delivered_date: new Date(),
        },
        { where: { id: salesOrder.id } }
      );

      // 3. Send customer notification (optional)
      if (this.models.Notification) {
        await this.models.Notification.create({
          user_id: null, // Could be customer user ID
          type: "delivery_completed",
          title: "Your Order Has Been Delivered",
          message: `Order ${salesOrder.order_number} has been successfully delivered.`,
          reference_type: "shipment",
          reference_id: shipment.id,
          priority: "high",
        });
      }

      console.log("✅ Delivery Invoice generated");
      return { invoice_generated: true, notification_sent: true };
    } catch (error) {
      console.error("❌ Error in onDeliveryCompleted:", error);
      throw error;
    }
  }

  /**
   * ADMIN WORKFLOW TRIGGER
   * Triggered when: Admin approves a Purchase Order
   * Action: Send PO to vendor and generate PO slip
   */
  async onPurchaseOrderApproved(purchaseOrder, userId) {
    try {
      console.log(
        "🔔 TRIGGER: Purchase Order Approved -",
        purchaseOrder.po_number
      );

      // 1. Generate Purchase Order PDF
      const poData = {
        id: purchaseOrder.id,
        po_number: purchaseOrder.po_number,
        created_date: purchaseOrder.created_at,
        expected_delivery_date: purchaseOrder.expected_delivery_date,
        final_amount: purchaseOrder.final_amount,
        vendor_name: purchaseOrder.vendor?.name || "N/A",
        vendor_code: purchaseOrder.vendor?.vendor_code || "N/A",
        vendor_email: purchaseOrder.vendor?.email || "N/A",
        vendor_phone: purchaseOrder.vendor?.phone || "N/A",
        items: purchaseOrder.items || [],
        subtotal: purchaseOrder.subtotal || 0,
        tax: purchaseOrder.tax || 0,
        status: "Approved",
      };

      const document =
        await this.documentService.generateAndAttachPurchaseOrder(
          poData,
          userId
        );

      // 2. Update PO status to 'sent'
      await purchaseOrder.update({
        status: "sent",
        approval_status: "approved",
        approved_by: userId,
        approved_at: new Date(),
      });

      // 3. Send notification to procurement team
      if (this.models.Notification) {
        await this.models.Notification.create({
          user_id: purchaseOrder.created_by,
          type: "po_approved",
          title: "Purchase Order Approved",
          message: `PO ${purchaseOrder.po_number} has been approved and sent to vendor.`,
          reference_type: "purchase_order",
          reference_id: purchaseOrder.id,
          priority: "high",
        });
      }

      console.log("✅ Purchase Order approved and sent");
      return {
        po_generated: true,
        notification_sent: true,
        document: document || null,
      };
    } catch (error) {
      console.error("❌ Error in onPurchaseOrderApproved:", error);
      throw error;
    }
  }

  /**
   * GRN PENDING TRIGGER
   * Triggered when: GRN is created with 'pending' status
   * Action: Notify inspector, log request
   */
  async onGRNPending(grn, userId) {
    try {
      console.log("🔔 TRIGGER: GRN Pending -", grn.grn_number);

      // Send notification to QA/Inspector
      if (this.models.Notification) {
        await this.models.Notification.create({
          type: "grn_pending",
          title: "New GRN Awaiting Inspection",
          message: `GRN ${grn.grn_number} is pending inspection. Expected quantity: ${grn.total_quantity}`,
          reference_type: "grn",
          reference_id: grn.id,
          priority: "high",
        });
      }

      console.log("✅ GRN Pending trigger executed");
      return { notification_sent: true };
    } catch (error) {
      console.error("❌ Error in onGRNPending:", error);
      throw error;
    }
  }

  /**
   * GRN RECEIVED TRIGGER
   * Triggered when: Goods physically received (status: 'received')
   * Action: Generate preliminary GRN slip, notify QA team
   */
  async onGRNReceived(grn, userId) {
    try {
      console.log("🔔 TRIGGER: GRN Received -", grn.grn_number);

      // Update GRN status
      await grn.update({
        status: "received",
        received_date: new Date(),
      });

      // 1. Generate preliminary GRN Slip PDF
      const grnData = {
        id: grn.id,
        entity_type: "goods_receipt_note",
        entity_id: grn.id,
        grn_number: grn.grn_number,
        po_number: grn.purchaseOrder?.po_number || "N/A",
        vendor_name: grn.purchaseOrder?.vendor?.name || "N/A",
        vendor_code: grn.purchaseOrder?.vendor?.vendor_code || "N/A",
        vendor_email: grn.purchaseOrder?.vendor?.email || "N/A",
        vendor_phone: grn.purchaseOrder?.vendor?.phone || "N/A",
        total_quantity: grn.total_quantity,
        items: grn.items || [],
        status: "Received - Awaiting Inspection",
        verified_by: null,
      };

      await this.documentService.generateAndAttachGRN(grnData, userId);

      // 2. Send notification to QA team
      if (this.models.Notification) {
        await this.models.Notification.create({
          type: "grn_received",
          title: "Goods Received - Quality Inspection Required",
          message: `GRN ${grn.grn_number}: ${grn.total_quantity} units received. Please verify quality.`,
          reference_type: "grn",
          reference_id: grn.id,
          priority: "high",
        });
      }

      console.log("✅ GRN Received trigger executed, slip generated");
      return { slip_generated: true, notification_sent: true };
    } catch (error) {
      console.error("❌ Error in onGRNReceived:", error);
      throw error;
    }
  }

  /**
   * GRN VERIFIED TRIGGER
   * Triggered when: Quality inspection passed (status: 'verified')
   * Action: Mark items as verified, ready for approval
   */
  async onGRNVerified(grn, userId) {
    try {
      console.log("🔔 TRIGGER: GRN Verified -", grn.grn_number);

      // Update GRN status
      await grn.update({
        status: "verified",
        verification_status: "passed",
        verified_date: new Date(),
        inspector_id: userId,
      });

      // Mark all items as inspected
      if (grn.items && grn.items.length > 0) {
        const updatedItems = grn.items.map((item) => ({
          ...item,
          inspection_status: "passed",
          inspected_date: new Date(),
        }));
        await grn.update({ items: updatedItems });
      }

      // Send notification to approver
      if (this.models.Notification) {
        await this.models.Notification.create({
          type: "grn_verified",
          title: "GRN Quality Check Passed",
          message: `GRN ${grn.grn_number} has passed quality inspection. Ready for approval.`,
          reference_type: "grn",
          reference_id: grn.id,
          priority: "medium",
        });
      }

      console.log("✅ GRN Verified trigger executed");
      return { verified: true, notification_sent: true };
    } catch (error) {
      console.error("❌ Error in onGRNVerified:", error);
      throw error;
    }
  }

  /**
   * GRN APPROVED TRIGGER
   * Triggered when: Final approval (status: 'approved')
   * Action: Update inventory stock, mark PO received, trigger manufacturing
   */
  async onGRNApproved(grn, userId) {
    try {
      console.log("🔔 TRIGGER: GRN Approved -", grn.grn_number);

      // 1. Update GRN status to approved
      await grn.update({
        status: "approved",
        approval_status: "approved",
        approved_date: new Date(),
        approver_id: userId,
      });

      // 2. Generate final GRN Slip PDF with approvals
      const grnData = {
        id: grn.id,
        entity_type: "goods_receipt_note",
        entity_id: grn.id,
        grn_number: grn.grn_number,
        po_number: grn.purchaseOrder?.po_number || "N/A",
        vendor_name: grn.purchaseOrder?.vendor?.name || "N/A",
        vendor_code: grn.purchaseOrder?.vendor?.vendor_code || "N/A",
        vendor_email: grn.purchaseOrder?.vendor?.email || "N/A",
        vendor_phone: grn.purchaseOrder?.vendor?.phone || "N/A",
        total_quantity: grn.total_quantity,
        items: grn.items || [],
        status: "APPROVED ✓",
        verified_by: userId,
      };

      const document = await this.documentService.generateAndAttachGRN(
        grnData,
        userId
      );

      // 3. Update inventory stock for each item
      if (grn.items && grn.items.length > 0) {
        for (const item of grn.items) {
          const inventory = await this.models.Inventory.findOne({
            where: { product_id: item.product_id },
          });

          if (inventory) {
            await inventory.update({
              quantity_in_stock:
                (inventory.quantity_in_stock || 0) + item.received_quantity,
              status: "available",
            });

            // Log inventory movement
            await this.models.InventoryMovement.create({
              inventory_id: inventory.id,
              transaction_type: "inward",
              quantity: item.received_quantity,
              reference_type: "grn",
              reference_id: grn.id,
              notes: `Stock received and approved from GRN ${grn.grn_number}`,
              created_by: userId,
            });

            console.log(
              `✅ Stock updated for product ${item.product_id}: +${item.received_quantity}`
            );
          }
        }
      }

      // 4. Update Purchase Order status to 'received'
      if (grn.purchaseOrder) {
        await grn.purchaseOrder.update({
          status: "received",
          grn_id: grn.id,
          received_date: new Date(),
        });
      }

      // 5. Update Sales Order to next status (manufacturing ready)
      if (grn.salesOrder) {
        await grn.salesOrder.update({
          status: "procurement_completed",
          procurement_completed_date: new Date(),
        });
      }

      // 6. Send notifications
      if (this.models.Notification) {
        // Notification to procurement
        await this.models.Notification.create({
          type: "grn_approved",
          title: "GRN Approved - Stock Updated",
          message: `GRN ${grn.grn_number} approved. ${grn.total_quantity} units added to inventory.`,
          reference_type: "grn",
          reference_id: grn.id,
          priority: "high",
        });

        // Notification to manufacturing
        if (grn.salesOrder) {
          await this.models.Notification.create({
            type: "grn_completed",
            title: "Materials Ready for Manufacturing",
            message: `Materials for SO ${grn.salesOrder.order_number} have been received and approved. Ready to start production.`,
            reference_type: "sales_order",
            reference_id: grn.salesOrder.id,
            priority: "high",
          });
        }
      }

      console.log(
        "✅ GRN Approved trigger executed - inventory updated, manufacturing ready"
      );
      return {
        grn_approved: true,
        stock_updated: true,
        document_generated: true,
        notifications_sent: 2,
        next_workflow: "manufacturing_ready",
        document: document || null,
      };
    } catch (error) {
      console.error("❌ Error in onGRNApproved:", error);
      throw error;
    }
  }

  /**
   * Get all triggers for a Sales Order workflow
   */
  getAvailableTriggers() {
    return {
      "sales.confirmed": this.onSalesOrderConfirmed.bind(this),
      "grn.pending": this.onGRNPending.bind(this),
      "grn.received": this.onGRNReceived.bind(this),
      "grn.verified": this.onGRNVerified.bind(this),
      "grn.approved": this.onGRNApproved.bind(this),
      "grn.completed": this.onGRNCompleted.bind(this),
      "stage.completed": this.onProductionStageCompleted.bind(this),
      "production.completed": this.onProductionOrderCompleted.bind(this),
      "shipment.dispatched": this.onShipmentDispatched.bind(this),
      "delivery.completed": this.onDeliveryCompleted.bind(this),
      "po.approved": this.onPurchaseOrderApproved.bind(this),
    };
  }
}

module.exports = WorkflowTriggers;
