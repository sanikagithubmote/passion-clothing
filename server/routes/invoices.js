const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
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

/**
 * Generate invoice HTML preview from sales order
 * GET /api/invoices/preview/:salesOrderId
 */
router.get("/preview/:salesOrderId", authenticateToken, async (req, res) => {
  try {
    const { salesOrderId } = req.params;

    // Fetch sales order with customer and items
    const salesOrder = await SalesOrder.findByPk(salesOrderId, {
      include: [
        { model: Customer, as: "customer" },
        { model: User, as: "creator" },
      ],
    });

    if (!salesOrder) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    // Check if invoice already exists
    let invoice = await Invoice.findOne({
      where: {
        sales_order_id: salesOrderId,
        invoice_type: "sales",
      },
    });

    // If no invoice exists, create one
    if (!invoice) {
      const invoiceNumber = documentService.generateInvoiceNumber();
      const items = salesOrder.items || [];
      const subtotal = parseFloat(
        (salesOrder.total_quantity || 0) * (salesOrder.unit_price || 0)
      ).toFixed(2);
      const tax = parseFloat(salesOrder.gst_amount || 0).toFixed(2);
      const total = parseFloat(
        salesOrder.final_amount || parseFloat(subtotal) + parseFloat(tax)
      ).toFixed(2);

      invoice = await Invoice.create({
        invoice_number: invoiceNumber,
        invoice_type: "sales",
        sales_order_id: salesOrderId,
        customer_id: salesOrder.customer_id,
        invoice_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: items,
        subtotal: parseFloat(subtotal),
        total_tax_amount: parseFloat(tax),
        total_amount: parseFloat(total),
        status: "draft",
        payment_status: "unpaid",
        created_by: req.user.id,
      });
    }

    // Generate HTML
    const html = generateInvoiceHTML({
      invoice,
      salesOrder,
      customer: salesOrder.customer,
    });

    res.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      order_number: salesOrder.order_number,
      html,
    });
  } catch (error) {
    console.error("Invoice preview error:", error);
    res.status(500).json({
      message: "Failed to generate invoice preview",
      error: error.message,
    });
  }
});

/**
 * Download invoice as PDF
 * GET /api/invoices/download-pdf/:salesOrderId
 */
router.get(
  "/download-pdf/:salesOrderId",
  authenticateToken,
  async (req, res) => {
    try {
      const { salesOrderId } = req.params;

      // Fetch sales order
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [
          { model: Customer, as: "customer" },
          { model: User, as: "creator" },
        ],
      });

      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Check if PDF exists
      const existingDoc = await DocumentAttachment.findOne({
        where: {
          entity_type: "sales_order",
          entity_id: salesOrderId,
          document_type: "invoice",
        },
        order: [["created_at", "DESC"]],
      });

      if (existingDoc && fs.existsSync(existingDoc.file_path)) {
        // Download existing PDF
        return res.download(
          existingDoc.file_path,
          `Invoice-${salesOrder.order_number}.pdf`
        );
      }

      // Generate new PDF using pdfkit
      const pdfBuffer = await generateInvoicePDF({
        invoice: {
          invoice_number: `INV-${salesOrder.order_number}`,
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

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Invoice-${salesOrder.order_number}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("PDF download error:", error);
      res.status(500).json({
        message: "Failed to download PDF",
        error: error.message,
      });
    }
  }
);

/**
 * Download invoice as HTML
 * GET /api/invoices/download-html/:salesOrderId
 */
router.get(
  "/download-html/:salesOrderId",
  authenticateToken,
  async (req, res) => {
    try {
      const { salesOrderId } = req.params;

      // Fetch sales order
      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [
          { model: Customer, as: "customer" },
          { model: User, as: "creator" },
        ],
      });

      if (!salesOrder) {
        return res.status(404).json({ message: "Sales order not found" });
      }

      // Generate HTML
      const html = generateInvoiceHTML({
        salesOrder,
        customer: salesOrder.customer,
      });

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Invoice-${salesOrder.order_number}.html"`
      );
      res.send(html);
    } catch (error) {
      console.error("HTML download error:", error);
      res.status(500).json({
        message: "Failed to download HTML",
        error: error.message,
      });
    }
  }
);

/**
 * Helper function to generate invoice HTML
 */
function generateInvoiceHTML({ salesOrder, customer }) {
  const items = salesOrder.items || [];
  const subtotal =
    (salesOrder.total_quantity || 0) * (salesOrder.unit_price || 0);
  const tax = salesOrder.gst_amount || 0;
  const total = salesOrder.final_amount || subtotal + tax;

  const itemsHTML = items
    .map(
      (item) => `
    <tr>
      <td>${item.product_name || "Product"}</td>
      <td style="text-align: center;">${item.quantity || 0}</td>
      <td style="text-align: right;">₹${(item.unit_price || 0).toFixed(2)}</td>
      <td style="text-align: right;">₹${(
        (item.quantity || 0) * (item.unit_price || 0)
      ).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Order Invoice - ${salesOrder.order_number}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background: #f7f9fc;
      color: #333;
      line-height: 1.6;
    }
    .container {
      background: #fff;
      max-width: 950px;
      margin: 30px auto;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #007bff;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h2 {
      color: #007bff;
      font-size: 24px;
      margin: 0;
    }
    .company-info {
      text-align: right;
      font-size: 13px;
      color: #555;
      line-height: 1.8;
    }
    .company-info strong {
      display: block;
      font-size: 15px;
      margin-bottom: 3px;
    }
    .status-box {
      background: #fff8e1;
      border-left: 6px solid #ffc107;
      padding: 12px 15px;
      margin: 20px 0;
      border-radius: 5px;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section {
      margin-top: 25px;
      margin-bottom: 20px;
    }
    .section h3 {
      color: #007bff;
      border-bottom: 1px solid #eee;
      padding-bottom: 8px;
      font-size: 16px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      text-align: left;
    }
    th {
      background: #007bff;
      color: #fff;
      font-weight: 600;
    }
    td {
      font-size: 14px;
    }
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 15px;
    }
    .info-block {
      padding: 12px;
      background: #f8f9fa;
      border-radius: 5px;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .info-value {
      color: #333;
      font-size: 14px;
    }
    .summary {
      float: right;
      margin-top: 20px;
      font-size: 15px;
      width: 40%;
    }
    .summary table {
      border: none;
      margin: 0;
    }
    .summary td {
      padding: 8px 12px;
      border-bottom: 1px solid #eee;
    }
    .summary tr:last-child td {
      border-bottom: 2px solid #007bff;
      font-weight: 600;
      font-size: 16px;
    }
    .summary .total {
      background: #f0f7ff;
      color: #007bff;
    }
    .qr-box {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .qr-box h3 {
      border: none;
      color: #333;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .qr-box img {
      max-width: 120px;
      height: auto;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .clear {
      clear: both;
    }
    @media print {
      body {
        background: #fff;
      }
      .container {
        margin: 0;
        box-shadow: none;
        max-width: 100%;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Sales Order Invoice</h2>
      <div class="company-info">
        <strong>Passion Clothing Co.</strong><br>
        Chakan, Pune<br>
        Email: info@passion-clothing.com<br>
        Phone: +91-8080659069<br>
        GSTIN: 09AAACH7409R1ZZ
      </div>
    </div>

    <div class="status-box">
      🟡 <strong>Status:</strong> ${
        salesOrder.status || "Draft"
      } — Invoice generated and linked to PO successfully.
    </div>

    <div class="section">
      <h3>Order Information</h3>
      <div class="info-row">
        <div class="info-block">
          <div class="info-label">Order Number</div>
          <div class="info-value">${salesOrder.order_number || "N/A"}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Order Date</div>
          <div class="info-value">${
            salesOrder.created_at
              ? new Date(salesOrder.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "N/A"
          }</div>
        </div>
        <div class="info-block">
          <div class="info-label">Expected Delivery</div>
          <div class="info-value">${
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
          }</div>
        </div>
        <div class="info-block">
          <div class="info-label">Payment Terms</div>
          <div class="info-value">${salesOrder.payment_terms || "N/A"}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Customer Information</h3>
      <div class="info-row">
        <div class="info-block">
          <div class="info-label">Customer Name</div>
          <div class="info-value">${customer?.name || "N/A"}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Customer ID</div>
          <div class="info-value">${customer?.id || "N/A"}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Email</div>
          <div class="info-value">${customer?.email || "N/A"}</div>
        </div>
        <div class="info-block">
          <div class="info-label">Phone</div>
          <div class="info-value">${customer?.phone || "N/A"}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>Order Details</h3>
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Unit Price (₹)</th>
            <th style="text-align: right;">Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${
            itemsHTML ||
            `<tr><td colspan="4" style="text-align: center; color: #999;">No items found</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="summary">
      <table>
        <tr><td>Sub Total:</td><td style="text-align: right;">₹${subtotal.toFixed(
          2
        )}</td></tr>
        <tr><td>GST (Tax):</td><td style="text-align: right;">₹${tax.toFixed(
          2
        )}</td></tr>
        <tr class="total"><td class="total">Total Amount:</td><td class="total" style="text-align: right;">₹${total.toFixed(
          2
        )}</td></tr>
      </table>
    </div>

    <div class="clear"></div>

    <div class="qr-box">
      <h3>QR Code - Live Order Tracking</h3>
      <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        `${salesOrder.order_number || "Order"} - Status: ${salesOrder.status}`
      )}&size=120x120" alt="QR Code">
    </div>

    <div class="footer">
      Thank you for your order with <strong>Passion Clothing Co.</strong><br>
      This is a system-generated invoice. No signature required.<br>
      <strong>Generated on:</strong> ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Helper function to generate PDF (using Buffer)
 */
async function generateInvoicePDF({ invoice, salesOrder, customer }) {
  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument();

  // Get HTML and convert to PDF (simplified approach)
  // For production, consider using libraries like html2pdf or puppeteer
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

module.exports = router;
