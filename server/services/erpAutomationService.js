/**
 * ERP AUTOMATION SERVICE - Complete 6-Module Workflow
 * Orchestrates: Sales → Procurement → Inventory → Manufacturing → Shipment → Delivery
 * Auto-generates PDFs and links documents to Sales Order
 */

const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const PDFGenerator = require("./puppeteerPdfService");
const NotificationService = require("./notificationService");

class ERPAutomationService {
  /**
   * PHASE 1: SALES MODULE AUTOMATION
   * Trigger: When Sales Order is confirmed
   * Actions:
   * - Generate Sales Order ID (format: SO-YYYYMMDD-XXXX)
   * - Auto-create Purchase Order
   * - Generate Sales Invoice PDF
   * - Attach invoice to Sales Order
   * - Update Status: Draft → Confirmed → Sent to Procurement
   */
  static async onSalesOrderConfirmed(salesOrderId, db) {
    try {
      const salesOrder = await db.SalesOrder.findByPk(salesOrderId, {
        include: [
          { model: db.Customer, as: "customer" },
          { model: db.User, as: "createdBy" },
        ],
      });

      if (!salesOrder) throw new Error("Sales Order not found");

      console.log(`🟢 [SALES] Processing Sales Order: ${salesOrder.id}`);

      // 1. Generate Sales Invoice PDF
      const invoicePdf = await PDFGenerator.generateSalesInvoice({
        orderNumber: salesOrder.order_number,
        orderDate: salesOrder.created_at,
        deliveryDate: salesOrder.expected_delivery_date,
        customerName: salesOrder.customer?.name || "N/A",
        customerEmail: salesOrder.customer?.email || "N/A",
        customerPhone: salesOrder.customer?.phone || "N/A",
        customerAddress: salesOrder.customer?.address || "N/A",
        items: salesOrder.items || [],
        subtotal: salesOrder.subtotal || 0,
        tax: salesOrder.tax || 0,
        finalAmount: salesOrder.final_amount || 0,
        status: "Confirmed",
      });

      // 2. Attach invoice to Sales Order
      const invoiceDoc = await db.DocumentAttachment.create({
        entity_type: "sales_order",
        entity_id: salesOrder.id,
        document_type: "invoice",
        file_name: path.basename(invoicePdf),
        file_path: invoicePdf,
        file_type: "application/pdf",
        file_size: fs.statSync(invoicePdf).size,
        version: 1,
        uploaded_by: salesOrder.created_by,
        metadata: {
          invoice_number: salesOrder.order_number,
          status: "Generated",
        },
      });

      console.log(`✅ [SALES] Invoice PDF Generated: ${invoiceDoc.file_name}`);

      // 3. Auto-create Purchase Order
      const poData = await db.PurchaseOrder.create({
        po_number: `PO-${new Date().getTime()}`,
        linked_sales_order_id: salesOrder.id,
        vendor_id: salesOrder.vendor_id,
        status: "pending",
        total_amount: salesOrder.final_amount,
        items: salesOrder.items,
        created_at: new Date(),
      });

      console.log(`✅ [SALES→PROCUREMENT] PO Created: ${poData.po_number}`);

      // 4. Update Sales Order Status
      await salesOrder.update({
        status: "sent_to_procurement",
        updated_at: new Date(),
      });

      // 5. Send Notifications
      await NotificationService.sendNotification({
        recipient_id: salesOrder.created_by,
        type: "sales_order_confirmed",
        title: "Sales Order Confirmed",
        message: `Sales Order ${salesOrder.order_number} confirmed. PO ${poData.po_number} created.`,
        priority: "high",
        data: { sales_order_id: salesOrder.id, purchase_order_id: poData.id },
      });

      return {
        success: true,
        salesOrderId: salesOrder.id,
        invoiceDoc,
        poData,
        status: "sent_to_procurement",
      };
    } catch (error) {
      console.error("❌ [SALES] Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 2: PROCUREMENT MODULE AUTOMATION
   * Trigger: When GRN is marked as Completed
   * Actions:
   * - Create GRN PDF
   * - Attach GRN PDF to Sales Order
   * - Update inventory stock
   * - Status: GRN Pending → GRN Completed → Stock Updated
   */
  static async onGRNCompleted(grnId, db) {
    try {
      const grn = await db.GoodsReceiptNote.findByPk(grnId, {
        include: [
          { model: db.PurchaseOrder, as: "purchase_order" },
          { model: db.Vendor, as: "vendor" },
        ],
      });

      if (!grn) throw new Error("GRN not found");

      console.log(`🟢 [PROCUREMENT] Processing GRN: ${grn.id}`);

      // 1. Generate GRN PDF
      const grnPdf = await PDFGenerator.generateGRNSlip({
        grnNumber: grn.grn_number,
        poNumber: grn.purchase_order?.po_number,
        receivedDate: grn.created_at,
        totalQuantity: grn.total_quantity,
        vendorName: grn.vendor?.name || "N/A",
        vendorCode: grn.vendor?.vendor_code || "N/A",
        vendorEmail: grn.vendor?.email || "N/A",
        vendorPhone: grn.vendor?.phone || "N/A",
        items: grn.items || [],
        status: "Completed",
        verifiedBy: grn.verified_by || "System",
      });

      console.log(
        `✅ [PROCUREMENT] GRN PDF Generated: ${path.basename(grnPdf)}`
      );

      // 2. Find linked Sales Order and attach GRN
      if (grn.purchase_order?.linked_sales_order_id) {
        const grnDoc = await db.DocumentAttachment.create({
          entity_type: "sales_order",
          entity_id: grn.purchase_order.linked_sales_order_id,
          document_type: "certificate",
          file_name: path.basename(grnPdf),
          file_path: grnPdf,
          file_type: "application/pdf",
          file_size: fs.statSync(grnPdf).size,
          version: 1,
          uploaded_by: grn.verified_by || 1,
          metadata: {
            grn_number: grn.grn_number,
            po_number: grn.purchase_order.po_number,
            status: "Completed",
          },
        });

        console.log(
          `✅ [PROCUREMENT] GRN attached to Sales Order: ${grn.purchase_order.linked_sales_order_id}`
        );
      }

      // 3. Update GRN Status
      await grn.update({
        status: "completed",
        updated_at: new Date(),
      });

      console.log(`✅ [PROCUREMENT→INVENTORY] GRN Status: Completed`);

      return {
        success: true,
        grnId: grn.id,
        grnPdf,
        status: "completed",
      };
    } catch (error) {
      console.error("❌ [PROCUREMENT] Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 3: INVENTORY MODULE AUTOMATION
   * Trigger: When GRN stock is added to warehouse
   * Actions:
   * - Generate Stock Slip PDF
   * - Update Inventory status
   * - Status: Stock-In → Ready for Production
   */
  static async onInventoryStockAdded(inventoryId, db) {
    try {
      const inventory = await db.Inventory.findByPk(inventoryId);

      if (!inventory) throw new Error("Inventory not found");

      console.log(`🟢 [INVENTORY] Processing Stock Addition: ${inventory.id}`);

      // 1. Generate Stock Slip PDF
      const stockPdf = await PDFGenerator.generateStockSlip({
        stockNumber: `STOCK-${inventory.id}`,
        itemName: inventory.item_name,
        quantity: inventory.quantity,
        category: inventory.category,
        location: inventory.location || "Warehouse-A",
        addedDate: new Date(),
        status: "Ready for Production",
      });

      console.log(
        `✅ [INVENTORY] Stock Slip Generated: ${path.basename(stockPdf)}`
      );

      // 2. Update Inventory Status
      await inventory.update({
        status: "ready_for_production",
        updated_at: new Date(),
      });

      console.log(`✅ [INVENTORY] Status Updated: Ready for Production`);

      return {
        success: true,
        inventoryId: inventory.id,
        stockPdf,
        status: "ready_for_production",
      };
    } catch (error) {
      console.error("❌ [INVENTORY] Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 4: MANUFACTURING MODULE AUTOMATION
   * Trigger: When Production Order is created/started
   * Actions:
   * - Generate Production Order with 7 stages
   * - For each stage completion, generate Stage Slip PDF
   * - Attach all stage slips to Sales Order
   * - Status: In Production → Stage-by-stage tracking → Completed
   */
  static async onProductionOrderCreated(productionOrderId, db) {
    try {
      const productionOrder = await db.ProductionOrder.findByPk(
        productionOrderId,
        {
          include: [
            { model: db.SalesOrder, as: "sales_order" },
            { model: db.ProductionStage, as: "stages" },
          ],
        }
      );

      if (!productionOrder) throw new Error("Production Order not found");

      console.log(
        `🟢 [MANUFACTURING] Processing Production Order: ${productionOrder.id}`
      );

      // Update status to in_production
      await productionOrder.update({
        status: "in_production",
        updated_at: new Date(),
      });

      console.log(`✅ [MANUFACTURING] Production Order Status: In Production`);

      return {
        success: true,
        productionOrderId: productionOrder.id,
        status: "in_production",
        stagesCount: productionOrder.stages?.length || 0,
      };
    } catch (error) {
      console.error("❌ [MANUFACTURING] Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 4B: MANUFACTURING STAGE COMPLETION
   * Trigger: When a production stage is completed
   * Actions:
   * - Generate Stage Slip PDF
   * - Attach to Sales Order
   * - Auto-trigger next stage if workflow allows
   */
  static async onProductionStageCompleted(productionOrderId, stageId, db) {
    try {
      const stage = await db.ProductionStage.findByPk(stageId, {
        include: [{ model: db.ProductionOrder, as: "production_order" }],
      });

      if (!stage) throw new Error("Production Stage not found");

      const productionOrder = stage.production_order;

      console.log(`🟢 [MANUFACTURING] Stage Completed: ${stage.stage_name}`);

      // 1. Generate Stage Slip PDF
      const stagePdf = await PDFGenerator.generateManufacturingSlip({
        stageName: stage.stage_name,
        productionOrderId: productionOrder.id,
        salesOrderNumber: productionOrder.project_reference,
        productName: productionOrder.product_name,
        quantity: productionOrder.quantity,
        startDate: stage.start_date,
        endDate: stage.end_date,
        processedQuantity: stage.processed_quantity || 0,
        approvedQuantity: stage.approved_quantity || 0,
        rejectedQuantity: stage.rejected_quantity || 0,
        materialUsed: stage.material_used || 0,
        notes: stage.notes,
        stageStatus: "Completed",
      });

      console.log(
        `✅ [MANUFACTURING] Stage Slip PDF Generated: ${path.basename(
          stagePdf
        )}`
      );

      // 2. Attach stage slip to Sales Order
      if (productionOrder.sales_order_id) {
        await db.DocumentAttachment.create({
          entity_type: "sales_order",
          entity_id: productionOrder.sales_order_id,
          document_type: "specification",
          file_name: path.basename(stagePdf),
          file_path: stagePdf,
          file_type: "application/pdf",
          file_size: fs.statSync(stagePdf).size,
          version: 1,
          uploaded_by: 1,
          metadata: {
            production_order_id: productionOrder.id,
            stage_name: stage.stage_name,
            stage_number: stage.stage_number,
            status: "Completed",
          },
        });

        console.log(`✅ [MANUFACTURING] Stage Slip attached to Sales Order`);
      }

      // 3. Update stage status
      await stage.update({
        status: "completed",
        updated_at: new Date(),
      });

      // 4. Check if all stages completed
      const allStages = await db.ProductionStage.findAll({
        where: { production_order_id: productionOrder.id },
      });

      const allCompleted = allStages.every((s) => s.status === "completed");

      if (allCompleted) {
        await productionOrder.update({
          status: "completed",
          updated_at: new Date(),
        });

        console.log(
          `✅ [MANUFACTURING] All Stages Completed → Production Order Completed`
        );

        // Trigger shipment creation
        await this.onProductionOrderCompleted(productionOrder.id, db);
      }

      return {
        success: true,
        stageId: stage.id,
        stagePdf,
        productionOrderStatus: allCompleted ? "completed" : "in_production",
      };
    } catch (error) {
      console.error("❌ [MANUFACTURING] Stage Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 4C: PRODUCTION ORDER COMPLETED
   * Trigger: When all manufacturing stages are completed
   * Prepare for shipment
   */
  static async onProductionOrderCompleted(productionOrderId, db) {
    try {
      const productionOrder = await db.ProductionOrder.findByPk(
        productionOrderId,
        {
          include: [{ model: db.SalesOrder, as: "sales_order" }],
        }
      );

      if (!productionOrder) throw new Error("Production Order not found");

      console.log(
        `🟢 [MANUFACTURING→SHIPMENT] Production Order Completed: ${productionOrder.id}`
      );

      // Update status to ready_for_shipment
      await productionOrder.update({
        status: "ready_for_shipment",
        updated_at: new Date(),
      });

      // Update related sales order
      if (productionOrder.sales_order) {
        await productionOrder.sales_order.update({
          status: "ready_for_shipment",
        });
      }

      console.log(`✅ [MANUFACTURING] Status Updated: Ready for Shipment`);

      return {
        success: true,
        productionOrderId: productionOrder.id,
        status: "ready_for_shipment",
      };
    } catch (error) {
      console.error("❌ [MANUFACTURING COMPLETION] Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 5: SHIPMENT MODULE AUTOMATION
   * Trigger: When shipment is created from ready-for-shipment production order
   * Actions:
   * - Create Shipment linked to Sales Order
   * - Assign courier and tracking number
   * - Generate Shipment Slip PDF
   * - Attach to Sales Order
   * - Status: Dispatched → In Transit → Delivered
   */
  static async onShipmentCreated(shipmentId, db) {
    try {
      const shipment = await db.Shipment.findByPk(shipmentId, {
        include: [
          { model: db.SalesOrder, as: "sales_order" },
          { model: db.CourierPartner, as: "courier_partner" },
        ],
      });

      if (!shipment) throw new Error("Shipment not found");

      console.log(`🟢 [SHIPMENT] Processing Shipment: ${shipment.id}`);

      // 1. Generate Shipment Slip PDF
      const shipmentPdf = await PDFGenerator.generateShipmentSlip({
        shipmentNumber: shipment.shipment_number,
        trackingNumber: shipment.tracking_number,
        courierName: shipment.courier_partner?.name || "N/A",
        courierPhone: shipment.courier_partner?.phone || "N/A",
        customerName: shipment.sales_order?.customer_name,
        deliveryAddress: shipment.delivery_address,
        dispatchDate: shipment.dispatch_date,
        estimatedDelivery: shipment.estimated_delivery_date,
        items: shipment.items || [],
        status: "Dispatched",
      });

      console.log(
        `✅ [SHIPMENT] Shipment Slip PDF Generated: ${path.basename(
          shipmentPdf
        )}`
      );

      // 2. Attach shipment slip to Sales Order
      if (shipment.sales_order_id) {
        await db.DocumentAttachment.create({
          entity_type: "sales_order",
          entity_id: shipment.sales_order_id,
          document_type: "certificate",
          file_name: path.basename(shipmentPdf),
          file_path: shipmentPdf,
          file_type: "application/pdf",
          file_size: fs.statSync(shipmentPdf).size,
          version: 1,
          uploaded_by: 1,
          metadata: {
            shipment_id: shipment.id,
            tracking_number: shipment.tracking_number,
            courier_name: shipment.courier_partner?.name,
            status: "Dispatched",
          },
        });

        console.log(`✅ [SHIPMENT] Shipment Slip attached to Sales Order`);
      }

      // 3. Update shipment status
      await shipment.update({
        status: "dispatched",
        dispatch_date: new Date(),
        updated_at: new Date(),
      });

      // 4. Update Sales Order status
      if (shipment.sales_order) {
        await shipment.sales_order.update({
          status: "dispatched",
        });
      }

      console.log(`✅ [SHIPMENT] Status Updated: Dispatched`);

      return {
        success: true,
        shipmentId: shipment.id,
        shipmentPdf,
        trackingNumber: shipment.tracking_number,
        status: "dispatched",
      };
    } catch (error) {
      console.error("❌ [SHIPMENT] Error:", error);
      throw error;
    }
  }

  /**
   * PHASE 6: DELIVERY MODULE AUTOMATION
   * Trigger: When delivery is confirmed/delivered
   * Actions:
   * - Generate final Delivery Invoice PDF
   * - Attach to Sales Order
   * - Mark all documents as complete
   * - Send notification with final invoice
   * - Status: In Transit → Delivered → Complete
   */
  static async onDeliveryConfirmed(shipmentId, db) {
    try {
      const shipment = await db.Shipment.findByPk(shipmentId, {
        include: [
          { model: db.SalesOrder, as: "sales_order" },
          { model: db.CourierPartner, as: "courier_partner" },
          { model: db.DocumentAttachment, as: "documents" },
        ],
      });

      if (!shipment) throw new Error("Shipment not found");

      console.log(`🟢 [DELIVERY] Processing Delivery: ${shipment.id}`);

      // 1. Generate Delivery Invoice PDF
      const deliveryPdf = await PDFGenerator.generateDeliveryInvoice({
        shipmentNumber: shipment.shipment_number,
        trackingNumber: shipment.tracking_number,
        deliveryDate: new Date(),
        customerName: shipment.sales_order?.customer_name,
        customerEmail: shipment.sales_order?.customer_email,
        deliveryAddress: shipment.delivery_address,
        items: shipment.items || [],
        totalAmount: shipment.sales_order?.final_amount || 0,
        status: "Delivered",
        signedBy: "Recipient",
      });

      console.log(
        `✅ [DELIVERY] Delivery Invoice PDF Generated: ${path.basename(
          deliveryPdf
        )}`
      );

      // 2. Attach delivery invoice to Sales Order
      const deliveryDoc = await db.DocumentAttachment.create({
        entity_type: "sales_order",
        entity_id: shipment.sales_order_id,
        document_type: "invoice",
        file_name: path.basename(deliveryPdf),
        file_path: deliveryPdf,
        file_type: "application/pdf",
        file_size: fs.statSync(deliveryPdf).size,
        version: 1,
        uploaded_by: 1,
        metadata: {
          shipment_id: shipment.id,
          delivery_date: new Date(),
          status: "Delivered",
          document_type: "Delivery Invoice",
        },
      });

      console.log(`✅ [DELIVERY] Delivery Invoice attached to Sales Order`);

      // 3. Update shipment and sales order status
      await shipment.update({
        status: "delivered",
        delivered_at: new Date(),
        updated_at: new Date(),
      });

      if (shipment.sales_order) {
        await shipment.sales_order.update({
          status: "delivered",
          delivered_at: new Date(),
        });
      }

      console.log(`✅ [DELIVERY] Status Updated: Delivered`);

      // 4. Send notification with final invoice
      await NotificationService.sendNotification({
        recipient_id: shipment.sales_order?.created_by,
        type: "delivery_completed",
        title: "Delivery Completed",
        message: `Order ${shipment.sales_order?.order_number} delivered. Final invoice attached.`,
        priority: "high",
        data: {
          sales_order_id: shipment.sales_order_id,
          shipment_id: shipment.id,
          delivery_invoice_id: deliveryDoc.id,
        },
      });

      console.log(`✅ [DELIVERY] Notification Sent to Customer`);

      return {
        success: true,
        shipmentId: shipment.id,
        deliveryPdf,
        status: "delivered",
        allDocumentsLinked: true,
      };
    } catch (error) {
      console.error("❌ [DELIVERY] Error:", error);
      throw error;
    }
  }

  /**
   * GET ALL DOCUMENTS FOR A SALES ORDER
   * Used by Admin Panel to display document timeline
   */
  static async getOrderDocumentTimeline(salesOrderId, db) {
    try {
      const documents = await db.DocumentAttachment.findAll({
        where: {
          entity_type: "sales_order",
          entity_id: salesOrderId,
          is_active: true,
        },
        order: [["created_at", "ASC"]],
        include: [
          {
            model: db.User,
            as: "uploader",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return {
        success: true,
        salesOrderId,
        totalDocuments: documents.length,
        documents: documents.map((doc) => ({
          id: doc.id,
          documentType: doc.document_type,
          fileName: doc.file_name,
          fileSize: this.formatFileSize(doc.file_size),
          uploadedBy: doc.uploader?.name || "System",
          uploadedAt: doc.created_at,
          status: doc.metadata?.status || "Active",
          downloadUrl: `/api/documents/download/${doc.id}`,
          previewUrl: `/api/documents/preview/${doc.id}`,
          documentCategory: this.categorizeDocument(doc.document_type),
        })),
      };
    } catch (error) {
      console.error("❌ [DOCUMENT TIMELINE] Error:", error);
      throw error;
    }
  }

  /**
   * CATEGORIZE DOCUMENT FOR ADMIN PANEL DISPLAY
   */
  static categorizeDocument(documentType) {
    const categories = {
      invoice: "Sales Documents",
      certificate: "Procurement Documents",
      specification: "Manufacturing Documents",
      design: "Manufacturing Documents",
      proforma: "Sales Documents",
      quotation: "Sales Documents",
      other: "Other Documents",
    };
    return categories[documentType] || "Other Documents";
  }

  /**
   * FORMAT FILE SIZE FOR DISPLAY
   */
  static formatFileSize(bytes) {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

module.exports = ERPAutomationService;
