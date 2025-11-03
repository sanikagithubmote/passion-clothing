const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { authenticateToken } = require("../middleware/auth");
const {
  DocumentAttachment,
  SalesOrder,
  PurchaseOrder,
  Shipment,
  GoodsReceiptNote,
  ProductionOrder,
  Invoice,
  Customer,
  User,
} = require("../config/database");
const DocumentService = require("../utils/documentService");
const WorkflowTriggers = require("../utils/workflowTriggers");

const documentService = new DocumentService(DocumentAttachment);

/**
 * Generate Invoice PDF Buffer
 * Used for on-demand invoice generation when file is missing
 */
async function generateInvoicePDFBuffer({ invoice, salesOrder, customer }) {
  const doc = new PDFDocument();

  let buffers = [];
  doc.on("data", (buffer) => {
    buffers.push(buffer);
  });

  // Simple PDF generation
  doc.fontSize(20).text("Sales Order Invoice", { align: "center" });
  doc.fontSize(10).text("Passion Clothing Co.", { align: "center" });
  doc.text("Chakan, Pune | +91-8080659069", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Order Number: ${salesOrder.order_number}`);
  doc.text(
    `Order Date: ${
      salesOrder.created_at
        ? new Date(salesOrder.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A"
    }`
  );
  doc.text(
    `Expected Delivery: ${
      salesOrder.expected_delivery_date
        ? new Date(salesOrder.expected_delivery_date).toLocaleDateString(
            "en-IN",
            {
              year: "numeric",
              month: "short",
              day: "numeric",
            }
          )
        : "N/A"
    }`
  );
  doc.moveDown();

  doc.fontSize(11).text("Customer Information:");
  doc.fontSize(10);
  doc.text(`Name: ${customer?.name || "N/A"}`);
  doc.text(`Email: ${customer?.email || "N/A"}`);
  doc.text(`Phone: ${customer?.phone || "N/A"}`);
  doc.moveDown();

  doc.fontSize(11).text("Order Items:");
  doc.fontSize(10);
  const items = salesOrder.items || [];
  items.forEach((item) => {
    doc.text(
      `${item.product_name || "Product"} - Qty: ${item.quantity}, Price: ₹${
        item.unit_price
      }`
    );
  });
  doc.moveDown();

  const subtotal =
    (salesOrder.total_quantity || 0) * (salesOrder.unit_price || 0);
  const tax = salesOrder.gst_amount || 0;
  const total = salesOrder.final_amount || subtotal + tax;

  doc.fontSize(11).text("Summary:");
  doc.fontSize(10);
  doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`);
  doc.text(`Tax: ₹${tax.toFixed(2)}`);
  doc.fontSize(12).text(`Total: ₹${total.toFixed(2)}`, { underline: true });
  doc.moveDown();

  doc.fontSize(9).text("Thank you for your order with Passion Clothing Co.", {
    align: "center",
  });
  doc.text("This is a system-generated invoice.", { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("finish", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on("error", reject);
  });
}

/**
 * GET /api/documents/sales-order/:salesOrderId
 * Get all documents linked to a sales order
 * Includes: Sales Invoice, PO, GRN, Manufacturing Slips, Delivery Invoice
 */
router.get(
  "/sales-order/:salesOrderId",
  authenticateToken,
  async (req, res) => {
    try {
      const { salesOrderId } = req.params;

      // Get the sales order with all related data
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [
          {
            model: PurchaseOrder,
            as: "linkedPurchaseOrder",
            attributes: ["id", "po_number"],
          },
          {
            model: ProductionOrder,
            attributes: ["id"],
            required: false,
          },
          {
            model: Shipment,
            attributes: ["id", "shipment_number"],
            required: false,
          },
        ],
      });

      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Collect all related entity IDs
      const relatedEntities = [
        { entity_type: "sales_order", entity_id: salesOrderId },
      ];

      if (salesOrder.linkedPurchaseOrder) {
        relatedEntities.push({
          entity_type: "purchase_order",
          entity_id: salesOrder.linkedPurchaseOrder.id,
        });
      }

      if (
        salesOrder.ProductionOrders &&
        salesOrder.ProductionOrders.length > 0
      ) {
        salesOrder.ProductionOrders.forEach((po) => {
          relatedEntities.push({
            entity_type: "production_order",
            entity_id: po.id,
          });
        });
      }

      if (salesOrder.Shipments && salesOrder.Shipments.length > 0) {
        salesOrder.Shipments.forEach((shipment) => {
          relatedEntities.push({
            entity_type: "shipment",
            entity_id: shipment.id,
          });
        });
      }

      // Get all documents
      const { documents, grouped } =
        await documentService.getCompleteDocumentTimeline(
          salesOrderId,
          relatedEntities
        );

      // Get stats
      const stats = await documentService.getDocumentStats(salesOrderId);

      res.json({
        success: true,
        data: {
          sales_order: {
            id: salesOrder.id,
            order_number: salesOrder.order_number,
            status: salesOrder.status,
            customer: salesOrder.customer?.name || "N/A",
          },
          documents,
          grouped,
          stats,
          timeline: documents.map((doc) => ({
            id: doc.id,
            type: doc.document_type,
            name: doc.file_name,
            entity: doc.entity_type,
            created_at: doc.created_at,
            size: doc.file_size,
            download_url: `/api/documents/${doc.id}/download`,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({
        message: "Failed to fetch documents",
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/documents/:documentId/view
 * Get document metadata (without downloading)
 */
router.get("/:documentId/view", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await DocumentAttachment.findByPk(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({
      success: true,
      data: {
        id: document.id,
        file_name: document.file_name,
        file_type: document.file_type,
        file_size: document.file_size,
        document_type: document.document_type,
        entity_type: document.entity_type,
        entity_id: document.entity_id,
        version: document.version,
        created_at: document.created_at,
        metadata: document.metadata,
        download_url: `/api/documents/${document.id}/download`,
      },
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      message: "Failed to fetch document",
      error: error.message,
    });
  }
});

/**
 * DELETE /api/documents/:documentId
 * Delete a document (soft delete - mark as inactive)
 */
router.delete("/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    await documentService.deleteDocument(documentId);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      message: "Failed to delete document",
      error: error.message,
    });
  }
});

/**
 * GET /api/documents/stats/:salesOrderId
 * Get document statistics for a sales order
 */
router.get("/stats/:salesOrderId", authenticateToken, async (req, res) => {
  try {
    const { salesOrderId } = req.params;

    const stats = await documentService.getDocumentStats(salesOrderId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
});

/**
 * POST /api/documents/regenerate/:documentId
 * Regenerate a document (creates new version)
 */
router.post("/regenerate/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { newData } = req.body;

    const updatedDocument = await documentService.updateDocument(
      documentId,
      newData,
      req.user.id
    );

    res.json({
      success: true,
      message: "Document regenerated successfully",
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error regenerating document:", error);
    res.status(500).json({
      message: "Failed to regenerate document",
      error: error.message,
    });
  }
});

/**
 * GET /api/documents/admin/dashboard
 * Admin dashboard - view all documents across all sales orders
 */
router.get("/admin/dashboard", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      document_type,
      entity_type,
      status,
    } = req.query;
    const offset = (page - 1) * limit;

    const where = { is_active: true };
    if (document_type) where.document_type = document_type;
    if (entity_type) where.entity_type = entity_type;

    const { count, rows: documents } = await DocumentAttachment.findAndCountAll(
      {
        where,
        include: [
          {
            model: require("../config/database").User,
            as: "uploader",
            attributes: ["id", "name", "email"],
            required: false,
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      }
    );

    // Group by document type
    const grouped = {};
    documents.forEach((doc) => {
      if (!grouped[doc.document_type]) {
        grouped[doc.document_type] = [];
      }
      grouped[doc.document_type].push(doc);
    });

    res.json({
      success: true,
      data: {
        documents: documents.map((doc) => ({
          id: doc.id,
          file_name: doc.file_name,
          document_type: doc.document_type,
          entity_type: doc.entity_type,
          entity_id: doc.entity_id,
          size: doc.file_size,
          created_at: doc.created_at,
          uploaded_by: doc.uploader?.name || "N/A",
          download_url: `/api/documents/${doc.id}/download`,
        })),
        grouped,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({
      message: "Failed to fetch dashboard data",
      error: error.message,
    });
  }
});

/**
 * POST /api/documents/manual-trigger
 * Manually trigger PDF generation for testing
 */
router.post("/manual-trigger", authenticateToken, async (req, res) => {
  try {
    const { trigger_type, entity_id } = req.body;

    if (!trigger_type || !entity_id) {
      return res.status(400).json({
        message: "trigger_type and entity_id are required",
      });
    }

    const models = require("../config/database");
    const workflowTriggers = new WorkflowTriggers(models);

    let result;

    switch (trigger_type) {
      case "sales.confirmed": {
        const salesOrder = await models.SalesOrder.findByPk(entity_id, {
          include: [{ model: models.Customer, as: "customer" }],
        });
        result = await workflowTriggers.onSalesOrderConfirmed(
          salesOrder,
          req.user.id
        );
        break;
      }

      case "po.approved":
      case "purchase_order.approved": {
        const po = await models.PurchaseOrder.findByPk(entity_id, {
          include: [
            { model: models.Vendor, as: "vendor" },
            { model: models.Customer, as: "customer" },
          ],
        });
        result = await workflowTriggers.onPurchaseOrderApproved(
          po,
          req.user.id
        );
        break;
      }

      case "delivery.completed": {
        const shipment = await models.Shipment.findByPk(entity_id, {
          include: [{ model: models.CourierPartner, as: "courier" }],
        });
        const salesOrder = await models.SalesOrder.findByPk(
          shipment.sales_order_id,
          {
            include: [{ model: models.Customer, as: "customer" }],
          }
        );
        result = await workflowTriggers.onDeliveryCompleted(
          shipment,
          salesOrder,
          req.user.id
        );
        break;
      }

      case "grn.pending": {
        const grn = await models.GoodsReceiptNote.findByPk(entity_id, {
          include: [
            { model: models.PurchaseOrder, as: "purchaseOrder" },
            { model: models.SalesOrder, as: "salesOrder" },
          ],
        });
        result = await workflowTriggers.onGRNPending(grn, req.user.id);
        break;
      }

      case "grn.received": {
        const grn = await models.GoodsReceiptNote.findByPk(entity_id, {
          include: [
            {
              model: models.PurchaseOrder,
              as: "purchaseOrder",
              include: [{ model: models.Vendor, as: "vendor" }],
            },
            { model: models.SalesOrder, as: "salesOrder" },
          ],
        });
        result = await workflowTriggers.onGRNReceived(grn, req.user.id);
        break;
      }

      case "grn.verified": {
        const grn = await models.GoodsReceiptNote.findByPk(entity_id, {
          include: [
            {
              model: models.PurchaseOrder,
              as: "purchaseOrder",
              include: [{ model: models.Vendor, as: "vendor" }],
            },
            { model: models.SalesOrder, as: "salesOrder" },
          ],
        });
        result = await workflowTriggers.onGRNVerified(grn, req.user.id);
        break;
      }

      case "grn.approved": {
        const grn = await models.GoodsReceiptNote.findByPk(entity_id, {
          include: [
            {
              model: models.PurchaseOrder,
              as: "purchaseOrder",
              include: [{ model: models.Vendor, as: "vendor" }],
            },
            {
              model: models.SalesOrder,
              as: "salesOrder",
              include: [{ model: models.Customer, as: "customer" }],
            },
          ],
        });
        result = await workflowTriggers.onGRNApproved(grn, req.user.id);
        break;
      }

      default:
        return res.status(400).json({
          message: `Unknown trigger type: ${trigger_type}`,
          supported_types: [
            "sales.confirmed",
            "po.approved",
            "purchase_order.approved",
            "grn.pending",
            "grn.received",
            "grn.verified",
            "grn.approved",
            "delivery.completed",
          ],
        });
    }

    res.json({
      success: true,
      message: `Trigger '${trigger_type}' executed successfully`,
      result,
      document: result?.document || null,
    });
  } catch (error) {
    console.error("Error executing trigger:", error);
    res.status(500).json({
      success: false,
      message: "Failed to execute trigger",
      error: error.message,
    });
  }
});

/**
 * GET /api/documents/:documentId/download
 * Download a specific document PDF
 * Supports on-demand PDF generation if file doesn't exist on disk
 */
router.get("/:documentId/download", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Fetch document from database
    const document = await DocumentAttachment.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found in database",
      });
    }

    // Construct the file path
    let filePath = path.join(__dirname, "..", document.file_path);

    // Check if file exists on disk
    let fileExists = fs.existsSync(filePath);

    // If file doesn't exist, try to regenerate it on-demand for invoices
    if (!fileExists && document.document_type === "invoice") {
      try {
        console.log(
          `⚠️  Invoice file missing, regenerating: ${document.file_name}`
        );

        // Fetch the sales order and related data
        const salesOrder = await SalesOrder.findByPk(
          document.entity_id || document.metadata?.sales_order_id,
          {
            include: [
              { model: Customer, as: "customer" },
              { model: User, as: "creator" },
            ],
          }
        );

        if (!salesOrder) {
          return res.status(404).json({
            success: false,
            message: "Related sales order not found",
          });
        }

        // Generate PDF on-demand
        const pdfBuffer = await generateInvoicePDFBuffer({
          invoice: {
            invoice_number:
              document.metadata?.invoice_number ||
              `INV-${salesOrder.order_number}`,
            invoice_date: salesOrder.created_at,
            order_number: salesOrder.order_number,
            items: salesOrder.items || [],
            subtotal:
              (salesOrder.total_quantity || 0) * (salesOrder.unit_price || 0),
            tax: salesOrder.gst_amount || 0,
            total: salesOrder.final_amount || 0,
          },
          salesOrder,
          customer: salesOrder.customer,
        });

        // Create directory if needed
        const fileDir = path.dirname(filePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        // Save the generated PDF
        fs.writeFileSync(filePath, pdfBuffer);
        fileExists = true;

        // Update document record with actual file size
        await document.update({
          file_size: pdfBuffer.length,
          updated_at: new Date(),
        });

        console.log(`✅ Invoice PDF regenerated and saved: ${filePath}`);
      } catch (regenerateError) {
        console.error("❌ Failed to regenerate invoice PDF:", regenerateError);
        // Continue to return error instead of trying to download non-existent file
      }
    }

    // If file still doesn't exist, return error
    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message:
          "Document file not found on server and could not be regenerated",
        documentId: documentId,
        documentType: document.document_type,
        expectedPath: filePath,
      });
    }

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.file_name}"`
    );
    res.setHeader("Content-Length", fs.statSync(filePath).size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error streaming document",
          error: error.message,
        });
      }
    });

    fileStream.pipe(res);

    // Log download
    console.log(
      `✅ Document downloaded: ${document.file_name} by user ${req.user.id}`
    );
  } catch (error) {
    console.error("❌ Error downloading document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download document",
      error: error.message,
    });
  }
});

/**
 * GET /api/documents/:documentId/preview
 * Preview a specific document PDF in browser
 */
router.get("/:documentId/preview", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const path = require("path");
    const fs = require("fs");

    // Fetch document from database
    const document = await DocumentAttachment.findByPk(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Construct the file path
    const filePath = path.join(
      __dirname,
      "..",
      document.file_path.replace(/\\/g, "/")
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found on server",
      });
    }

    // Set response headers for inline display
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.file_name}"`
    );
    res.setHeader("Content-Length", fs.statSync(filePath).size);
    res.setHeader("Cache-Control", "public, max-age=3600");

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    console.log(
      `Document previewed: ${document.file_name} by user ${req.user.id}`
    );
  } catch (error) {
    console.error("Error previewing document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to preview document",
      error: error.message,
    });
  }
});

/**
 * GET /api/documents/timeline/:orderId
 * Get invoice documents timeline for an order
 * Used by InvoiceManagementModal
 */
router.get("/timeline/:orderId", authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch documents for this order
    const documents = await DocumentAttachment.findAll({
      where: {
        entity_type: "sales_order",
        entity_id: orderId,
        document_type: "Sales Invoice",
        is_active: true,
      },
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      documents: documents.map((doc) => ({
        id: doc.id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_size: doc.file_size,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      })),
      pending: 0,
    });
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timeline",
      error: error.message,
    });
  }
});

module.exports = router;
