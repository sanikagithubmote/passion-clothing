const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  Invoice,
  SalesOrder,
  PurchaseOrder,
  Challan,
  ProductionOrder,
  Shipment,
  DocumentAttachment,
  User,
  Customer,
  Vendor,
  Product,
} = require("../config/database");
const { authenticateToken } = require("../middleware/auth");
const DocumentService = require("../utils/documentService");
const NotificationService = require("../utils/notificationService");
const router = express.Router();

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, "../uploads/documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const documentService = new DocumentService();

/**
 * Generate invoice for sales order
 * POST /api/invoices/generate-from-sales-order/:salesOrderId
 */
router.post(
  "/generate-from-sales-order/:salesOrderId",
  authenticateToken,
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      const { salesOrderId } = req.params;
      const { notes, terms_conditions } = req.body;

      // Fetch sales order with customer
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [
          { model: Customer, as: "customer" },
          { model: User, as: "creator" },
        ],
        transaction,
      });

      if (!salesOrder) {
        await transaction.rollback();
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Generate invoice number
      const invoiceNumber = documentService.generateInvoiceNumber();

      // Prepare invoice data
      const items = salesOrder.items || [];
      const subtotal = parseFloat(
        salesOrder.total_quantity * (salesOrder.unit_price || 0)
      ).toFixed(2);
      const tax = parseFloat(salesOrder.gst_amount || 0).toFixed(2);
      const total = parseFloat(
        salesOrder.final_amount || subtotal + tax
      ).toFixed(2);

      const invoiceData = {
        invoice_number: invoiceNumber,
        invoice_type: "sales",
        sales_order_id: salesOrderId,
        customer_id: salesOrder.customer_id,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: items,
        subtotal,
        tax_details: salesOrder.tax_details || null,
        total_tax_amount: tax,
        total_amount: total,
        status: "draft",
        payment_status: "unpaid",
        notes,
        terms_conditions,
        created_by: req.user.id,
        customer_name: salesOrder.customer?.name || "Customer",
        customer_email: salesOrder.customer?.email,
        customer_phone: salesOrder.customer?.phone,
        customer_address: salesOrder.customer?.billing_address,
        company_name: "Passion Clothing Co.",
        company_email: "info@passion-clothing.com",
        company_phone: "+91-XXXXXXXXXX",
        company_gst: "XX XXXXXXXXXXXXXXX",
        company_address: "Your Company Address",
      };

      // Generate PDF
      const pdfResult = await documentService.generateInvoicePDF(invoiceData);

      // Create invoice record
      const invoice = await Invoice.create(
        {
          invoice_number: invoiceNumber,
          invoice_type: "sales",
          sales_order_id: salesOrderId,
          customer_id: salesOrder.customer_id,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
          items: items,
          subtotal: parseFloat(subtotal),
          total_tax_amount: parseFloat(tax),
          total_amount: parseFloat(total),
          status: "draft",
          payment_status: "unpaid",
          notes,
          terms_conditions,
          pdf_path: pdfResult.filePath,
          created_by: req.user.id,
        },
        { transaction }
      );

      // Create document attachment
      await DocumentAttachment.create(
        {
          entity_type: "sales_order",
          entity_id: salesOrderId,
          document_type: "invoice",
          file_name: pdfResult.fileName,
          file_path: pdfResult.filePath,
          file_type: "application/pdf",
          file_size: pdfResult.fileSize,
          version: 1,
          uploaded_by: req.user.id,
          is_active: true,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoiceNumber,
          },
        },
        { transaction }
      );

      // Create document attachment for invoice entity as well
      await DocumentAttachment.create(
        {
          entity_type: "invoice",
          entity_id: invoice.id,
          document_type: "invoice",
          file_name: pdfResult.fileName,
          file_path: pdfResult.filePath,
          file_type: "application/pdf",
          file_size: pdfResult.fileSize,
          version: 1,
          uploaded_by: req.user.id,
          is_active: true,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoiceNumber,
          },
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        message: "Invoice generated successfully",
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          total_amount: invoice.total_amount,
          pdf_path: pdfResult.filePath,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Invoice generation error:", error);
      res
        .status(500)
        .json({ message: "Failed to generate invoice", error: error.message });
    }
  }
);

/**
 * Generate invoice for purchase order
 * POST /api/invoices/generate-from-purchase-order/:purchaseOrderId
 */
router.post(
  "/generate-from-purchase-order/:purchaseOrderId",
  authenticateToken,
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      const { purchaseOrderId } = req.params;
      const { notes, terms_conditions } = req.body;

      // Fetch purchase order with vendor and customer
      const purchaseOrder = await PurchaseOrder.findByPk(purchaseOrderId, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
        ],
        transaction,
      });

      if (!purchaseOrder) {
        await transaction.rollback();
        return res.status(404).json({ message: "Purchase order not found" });
      }

      // Generate invoice number
      const invoiceNumber = documentService.generateInvoiceNumber();

      // Prepare invoice data
      const items = purchaseOrder.items || [];
      const subtotal = parseFloat(
        purchaseOrder.subtotal || purchaseOrder.final_amount * 0.8
      ).toFixed(2);
      const tax = parseFloat(purchaseOrder.total_tax_amount || 0).toFixed(2);
      const total = parseFloat(
        purchaseOrder.final_amount || subtotal + tax
      ).toFixed(2);

      const invoiceData = {
        invoice_number: invoiceNumber,
        invoice_type: "purchase",
        purchase_order_id: purchaseOrderId,
        vendor_id: purchaseOrder.vendor_id,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: items,
        subtotal,
        total_tax_amount: tax,
        total_amount: total,
        status: "draft",
        payment_status: "unpaid",
        notes,
        terms_conditions,
        created_by: req.user.id,
        customer_name: purchaseOrder.vendor?.name || "Vendor",
        customer_email: purchaseOrder.vendor?.email,
        customer_phone: purchaseOrder.vendor?.phone,
        customer_address: purchaseOrder.vendor?.address,
        company_name: "Passion Clothing Co.",
        company_email: "procurement@passion-clothing.com",
        company_phone: "+91-XXXXXXXXXX",
        company_gst: "XX XXXXXXXXXXXXXXX",
        company_address: "Your Company Address",
      };

      // Generate PDF
      const pdfResult = await documentService.generateInvoicePDF(invoiceData);

      // Create invoice record
      const invoice = await Invoice.create(
        {
          invoice_number: invoiceNumber,
          invoice_type: "purchase",
          purchase_order_id: purchaseOrderId,
          vendor_id: purchaseOrder.vendor_id,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
          items: items,
          subtotal: parseFloat(subtotal),
          total_tax_amount: parseFloat(tax),
          total_amount: parseFloat(total),
          status: "draft",
          payment_status: "unpaid",
          notes,
          terms_conditions,
          pdf_path: pdfResult.filePath,
          created_by: req.user.id,
        },
        { transaction }
      );

      // Create document attachment
      await DocumentAttachment.create(
        {
          entity_type: "purchase_order",
          entity_id: purchaseOrderId,
          document_type: "invoice",
          file_name: pdfResult.fileName,
          file_path: pdfResult.filePath,
          file_type: "application/pdf",
          file_size: pdfResult.fileSize,
          version: 1,
          uploaded_by: req.user.id,
          is_active: true,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoiceNumber,
          },
        },
        { transaction }
      );

      // Create document attachment for invoice entity as well
      await DocumentAttachment.create(
        {
          entity_type: "invoice",
          entity_id: invoice.id,
          document_type: "invoice",
          file_name: pdfResult.fileName,
          file_path: pdfResult.filePath,
          file_type: "application/pdf",
          file_size: pdfResult.fileSize,
          version: 1,
          uploaded_by: req.user.id,
          is_active: true,
          metadata: {
            invoice_id: invoice.id,
            invoice_number: invoiceNumber,
          },
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        message: "Invoice generated successfully",
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          total_amount: invoice.total_amount,
          pdf_path: pdfResult.filePath,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Invoice generation error:", error);
      res
        .status(500)
        .json({ message: "Failed to generate invoice", error: error.message });
    }
  }
);

/**
 * Get invoice by ID
 * GET /api/invoices/:invoiceId
 */
router.get("/:invoiceId", authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findByPk(invoiceId, {
      include: [
        { model: Customer, as: "customer" },
        { model: Vendor, as: "vendor" },
        { model: SalesOrder, as: "salesOrder" },
        { model: PurchaseOrder, as: "purchaseOrder" },
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
        { model: DocumentAttachment, as: "documentAttachments" },
      ],
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    res.json({ invoice });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch invoice", error: error.message });
  }
});

/**
 * Download invoice PDF
 * GET /api/invoices/:invoiceId/download
 */
router.get("/:invoiceId/download", authenticateToken, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findByPk(invoiceId);

    if (!invoice || !invoice.pdf_path) {
      return res.status(404).json({ message: "Invoice PDF not found" });
    }

    const fileName = `${invoice.invoice_number}.pdf`;
    res.download(invoice.pdf_path, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Failed to download invoice" });
      }
    });
  } catch (error) {
    console.error("Invoice download error:", error);
    res
      .status(500)
      .json({ message: "Failed to download invoice", error: error.message });
  }
});

/**
 * Attach document to entity (sales order, purchase order, etc.)
 * POST /api/invoices/attach/:entityType/:entityId
 */
router.post(
  "/attach/:entityType/:entityId",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { entityType, entityId } = req.params;
      const { description, document_type } = req.body;

      // Validate entity type
      const validEntityTypes = [
        "sales_order",
        "purchase_order",
        "invoice",
        "challan",
        "production_order",
        "shipment",
      ];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({ message: "Invalid entity type" });
      }

      // Save file
      const fileResult = await documentService.saveUploadedFile(req.file);

      // Create document attachment record
      const attachment = await DocumentAttachment.create(
        {
          entity_type: entityType,
          entity_id: entityId,
          document_type: document_type || "other",
          file_name: fileResult.originalName,
          file_path: fileResult.filePath,
          file_type: fileResult.fileType,
          file_size: fileResult.fileSize,
          version: 1,
          description,
          uploaded_by: req.user.id,
          is_active: true,
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        message: "Document attached successfully",
        attachment: {
          id: attachment.id,
          file_name: attachment.file_name,
          document_type: attachment.document_type,
          file_size: attachment.file_size,
          uploaded_at: attachment.created_at,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("File upload error:", error);
      res
        .status(500)
        .json({ message: "Failed to attach document", error: error.message });
    }
  }
);

/**
 * Download attached document
 * GET /api/invoices/document/:documentId/download
 */
router.get(
  "/document/:documentId/download",
  authenticateToken,
  async (req, res) => {
    try {
      const { documentId } = req.params;

      const attachment = await DocumentAttachment.findByPk(documentId);

      if (!attachment || !fs.existsSync(attachment.file_path)) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.download(attachment.file_path, attachment.file_name, (err) => {
        if (err) {
          console.error("Download error:", err);
          res.status(500).json({ message: "Failed to download document" });
        }
      });
    } catch (error) {
      console.error("Document download error:", error);
      res
        .status(500)
        .json({ message: "Failed to download document", error: error.message });
    }
  }
);

/**
 * Delete attached document
 * DELETE /api/invoices/document/:documentId
 */
router.delete("/document/:documentId", authenticateToken, async (req, res) => {
  const transaction =
    await require("../config/database").sequelize.transaction();

  try {
    const { documentId } = req.params;

    const attachment = await DocumentAttachment.findByPk(documentId, {
      transaction,
    });

    if (!attachment) {
      await transaction.rollback();
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete file from storage
    if (fs.existsSync(attachment.file_path)) {
      fs.unlinkSync(attachment.file_path);
    }

    // Update document record
    await attachment.update({ is_active: false }, { transaction });

    await transaction.commit();

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Document deletion error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete document", error: error.message });
  }
});

/**
 * Send invoice with attachments to procurement department
 * POST /api/invoices/:invoiceId/send-to-procurement
 */
router.post(
  "/:invoiceId/send-to-procurement",
  authenticateToken,
  async (req, res) => {
    const transaction =
      await require("../config/database").sequelize.transaction();

    try {
      const { invoiceId } = req.params;
      const { attachmentIds, message } = req.body;

      // Fetch invoice
      const invoice = await Invoice.findByPk(invoiceId, {
        include: [
          { model: Vendor, as: "vendor" },
          { model: Customer, as: "customer" },
          {
            model: SalesOrder,
            as: "salesOrder",
            include: [{ model: Customer, as: "customer" }],
          },
          { model: PurchaseOrder, as: "purchaseOrder" },
        ],
        transaction,
      });

      if (!invoice) {
        await transaction.rollback();
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Update invoice status
      await invoice.update(
        {
          status: "sent",
          sent_date: new Date(),
        },
        { transaction }
      );

      // Prepare notification data
      const notificationData = {
        type: "procurement",
        title: `Invoice ${invoice.invoice_number} Sent`,
        message:
          message ||
          `Invoice ${
            invoice.invoice_number
          } has been sent for your review with ${
            attachmentIds?.length || 1
          } attachments`,
        priority: "high",
        related_entity_id: invoice.id,
        related_entity_type: "invoice",
        action_url: `/finance/invoices/${invoice.id}`,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: invoice.total_amount,
          vendor: invoice.vendor?.name,
          customer:
            invoice.customer?.name || invoice.salesOrder?.customer?.name,
          attachments_count: attachmentIds?.length || 1,
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      // Send notification to procurement department
      const recipients = [
        { department: "procurement" },
        { department: "finance" },
        { department: "admin" },
      ];

      await NotificationService.sendBulk(
        notificationData,
        recipients,
        transaction
      );

      await transaction.commit();

      res.json({
        message: "Invoice sent to procurement successfully",
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          status: invoice.status,
          sent_date: invoice.sent_date,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Send invoice error:", error);
      res
        .status(500)
        .json({ message: "Failed to send invoice", error: error.message });
    }
  }
);

/**
 * Get documents for entity
 * GET /api/invoices/:entityType/:entityId/documents
 */
router.get(
  "/:entityType/:entityId/documents",
  authenticateToken,
  async (req, res) => {
    try {
      const { entityType, entityId } = req.params;

      // Validate entity type
      const validEntityTypes = [
        "sales_order",
        "purchase_order",
        "invoice",
        "challan",
        "production_order",
        "shipment",
      ];
      if (!validEntityTypes.includes(entityType)) {
        return res.status(400).json({ message: "Invalid entity type" });
      }

      const attachments = await DocumentAttachment.findAll({
        where: {
          entity_type: entityType,
          entity_id: entityId,
          is_active: true,
        },
        include: [
          { model: User, as: "uploader", attributes: ["id", "name", "email"] },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json({
        entityType,
        entityId,
        documents: attachments,
        count: attachments.length,
      });
    } catch (error) {
      console.error("Fetch documents error:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch documents", error: error.message });
    }
  }
);

module.exports = router;
