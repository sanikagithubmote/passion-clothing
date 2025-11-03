const fs = require("fs");
const path = require("path");
const {
  SalesInvoicePDF,
  GRNPdf,
  ManufacturingSlipPDF,
  DeliveryInvoicePDF,
  PurchaseOrderPDF,
} = require("./pdfGenerator");

/**
 * Document Service - Manages document generation and attachment
 */
class DocumentService {
  constructor(DocumentAttachmentModel) {
    this.DocumentAttachment = DocumentAttachmentModel;
  }

  /**
   * Generate Sales Invoice and attach to Sales Order
   */
  async generateAndAttachSalesInvoice(salesOrderData, userId) {
    try {
      const generator = new SalesInvoicePDF();
      const filePath = await generator.generate(salesOrderData);

      const fileName = path.basename(filePath);
      const relativePath = filePath.replace(/\\/g, "/");

      // Create document attachment record
      const attachment = await this.DocumentAttachment.create({
        entity_type: "sales_order",
        entity_id: salesOrderData.id,
        document_type: "invoice",
        file_name: fileName,
        file_path: relativePath,
        file_type: "application/pdf",
        file_size: fs.statSync(filePath).size,
        version: 1,
        uploaded_by: userId,
        description: `Sales Invoice for Order ${salesOrderData.order_number}`,
        metadata: {
          invoice_number: salesOrderData.order_number,
          customer_id: salesOrderData.customer_id,
          total_amount: salesOrderData.final_amount,
        },
      });

      console.log("✅ Sales Invoice generated:", fileName);
      return attachment;
    } catch (error) {
      console.error("❌ Error generating sales invoice:", error);
      throw error;
    }
  }

  /**
   * Generate Purchase Order and attach
   */
  async generateAndAttachPurchaseOrder(purchaseOrderData, userId) {
    try {
      const generator = new PurchaseOrderPDF();
      const filePath = await generator.generate(purchaseOrderData);

      const fileName = path.basename(filePath);
      const relativePath = filePath.replace(/\\/g, "/");

      const attachment = await this.DocumentAttachment.create({
        entity_type: "purchase_order",
        entity_id: purchaseOrderData.id,
        document_type: "invoice",
        file_name: fileName,
        file_path: relativePath,
        file_type: "application/pdf",
        file_size: fs.statSync(filePath).size,
        version: 1,
        uploaded_by: userId,
        description: `Purchase Order ${purchaseOrderData.po_number}`,
        metadata: {
          po_number: purchaseOrderData.po_number,
          vendor_id: purchaseOrderData.vendor_id,
          total_amount: purchaseOrderData.final_amount,
        },
      });

      console.log("✅ Purchase Order generated:", fileName);
      return attachment;
    } catch (error) {
      console.error("❌ Error generating purchase order:", error);
      throw error;
    }
  }

  /**
   * Generate GRN (Goods Receipt Note) and attach
   */
  async generateAndAttachGRN(grnData, userId) {
    try {
      const generator = new GRNPdf();
      const filePath = await generator.generate(grnData);

      const fileName = path.basename(filePath);
      const relativePath = filePath.replace(/\\/g, "/");

      const attachment = await this.DocumentAttachment.create({
        entity_type: grnData.entity_type || "purchase_order",
        entity_id: grnData.entity_id,
        document_type: "certificate",
        file_name: fileName,
        file_path: relativePath,
        file_type: "application/pdf",
        file_size: fs.statSync(filePath).size,
        version: 1,
        uploaded_by: userId,
        description: `GRN ${grnData.grn_number} for PO ${grnData.po_number}`,
        metadata: {
          grn_number: grnData.grn_number,
          po_number: grnData.po_number,
          vendor_id: grnData.vendor_id,
          total_quantity: grnData.total_quantity,
        },
      });

      console.log("✅ GRN generated:", fileName);
      return attachment;
    } catch (error) {
      console.error("❌ Error generating GRN:", error);
      throw error;
    }
  }

  /**
   * Generate Manufacturing Stage Slip and attach to Production Order
   */
  async generateAndAttachManufacturingSlip(stageData, userId) {
    try {
      const generator = new ManufacturingSlipPDF();
      const filePath = await generator.generate(stageData);

      const fileName = path.basename(filePath);
      const relativePath = filePath.replace(/\\/g, "/");

      const attachment = await this.DocumentAttachment.create({
        entity_type: "production_order",
        entity_id: stageData.production_order_id,
        document_type: "specification",
        file_name: fileName,
        file_path: relativePath,
        file_type: "application/pdf",
        file_size: fs.statSync(filePath).size,
        version: 1,
        uploaded_by: userId,
        description: `Manufacturing Slip - ${stageData.stage_name} for Production Order ${stageData.production_order_id}`,
        metadata: {
          stage_name: stageData.stage_name,
          stage_id: stageData.stage_id,
          production_order_id: stageData.production_order_id,
          sales_order_id: stageData.sales_order_id,
        },
      });

      console.log("✅ Manufacturing Slip generated:", fileName);
      return attachment;
    } catch (error) {
      console.error("❌ Error generating manufacturing slip:", error);
      throw error;
    }
  }

  /**
   * Generate Delivery Invoice and attach to Shipment
   */
  async generateAndAttachDeliveryInvoice(deliveryData, userId) {
    try {
      const generator = new DeliveryInvoicePDF();
      const filePath = await generator.generate(deliveryData);

      const fileName = path.basename(filePath);
      const relativePath = filePath.replace(/\\/g, "/");

      const attachment = await this.DocumentAttachment.create({
        entity_type: "shipment",
        entity_id: deliveryData.shipment_id,
        document_type: "invoice",
        file_name: fileName,
        file_path: relativePath,
        file_type: "application/pdf",
        file_size: fs.statSync(filePath).size,
        version: 1,
        uploaded_by: userId,
        description: `Delivery Invoice for Shipment ${deliveryData.shipment_number}`,
        metadata: {
          shipment_number: deliveryData.shipment_number,
          customer_id: deliveryData.customer_id,
          total_amount: deliveryData.final_amount,
          delivery_date: deliveryData.delivered_date,
        },
      });

      console.log("✅ Delivery Invoice generated:", fileName);
      return attachment;
    } catch (error) {
      console.error("❌ Error generating delivery invoice:", error);
      throw error;
    }
  }

  /**
   * Get all documents for a Sales Order
   */
  async getDocumentsForSalesOrder(salesOrderId) {
    try {
      // Get direct attachments to sales order
      const directAttachments = await this.DocumentAttachment.findAll({
        where: {
          entity_type: "sales_order",
          entity_id: salesOrderId,
          is_active: true,
        },
        order: [["created_at", "DESC"]],
      });

      return directAttachments;
    } catch (error) {
      console.error("❌ Error fetching documents:", error);
      throw error;
    }
  }

  /**
   * Get all documents linked to a sales order (including related POs, GRNs, etc.)
   */
  async getCompleteDocumentTimeline(salesOrderId, includedEntities = []) {
    try {
      const documents = await this.DocumentAttachment.findAll({
        where: {
          [require("sequelize").Op.or]: [
            { entity_type: "sales_order", entity_id: salesOrderId },
            ...(includedEntities.length > 0
              ? includedEntities.map((entity) => ({
                  entity_type: entity.entity_type,
                  entity_id: entity.entity_id,
                }))
              : []),
          ],
          is_active: true,
        },
        order: [["created_at", "ASC"]],
      });

      // Group by document type
      const grouped = {};
      documents.forEach((doc) => {
        if (!grouped[doc.document_type]) {
          grouped[doc.document_type] = [];
        }
        grouped[doc.document_type].push(doc);
      });

      return { documents, grouped };
    } catch (error) {
      console.error("❌ Error fetching document timeline:", error);
      throw error;
    }
  }

  /**
   * Download document from file system
   */
  async downloadDocument(documentId, res) {
    try {
      const document = await this.DocumentAttachment.findByPk(documentId);

      if (!document) {
        throw new Error("Document not found");
      }

      // Fix: Replace backslashes for Windows compatibility
      const filePath = path.join(
        __dirname,
        "..",
        document.file_path.replace(/\\/g, "/")
      );

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found on server at: ${filePath}`);
      }

      res.download(filePath, document.file_name);
    } catch (error) {
      console.error("❌ Error downloading document:", error);
      throw error;
    }
  }

  /**
   * Delete document (soft delete - mark as inactive)
   */
  async deleteDocument(documentId) {
    try {
      const document = await this.DocumentAttachment.findByPk(documentId);

      if (!document) {
        throw new Error("Document not found");
      }

      await document.update({ is_active: false });

      console.log("✅ Document marked as inactive:", documentId);
      return document;
    } catch (error) {
      console.error("❌ Error deleting document:", error);
      throw error;
    }
  }

  /**
   * Create a new version of a document
   */
  async updateDocument(documentId, newData, userId) {
    try {
      const oldDocument = await this.DocumentAttachment.findByPk(documentId);

      if (!oldDocument) {
        throw new Error("Document not found");
      }

      // Mark old version as inactive
      await oldDocument.update({ is_active: false });

      // Create new version
      const newDocument = await this.DocumentAttachment.create({
        entity_type: oldDocument.entity_type,
        entity_id: oldDocument.entity_id,
        document_type: oldDocument.document_type,
        file_name: newData.file_name,
        file_path: newData.file_path,
        file_type: newData.file_type,
        file_size: newData.file_size,
        version: oldDocument.version + 1,
        uploaded_by: userId,
        description: newData.description || oldDocument.description,
        metadata: newData.metadata || oldDocument.metadata,
      });

      console.log("✅ Document version created:", newDocument.id);
      return newDocument;
    } catch (error) {
      console.error("❌ Error updating document:", error);
      throw error;
    }
  }

  /**
   * Get document statistics for a sales order
   */
  async getDocumentStats(salesOrderId) {
    try {
      const documents = await this.DocumentAttachment.findAll({
        where: {
          entity_type: "sales_order",
          entity_id: salesOrderId,
          is_active: true,
        },
      });

      const stats = {
        total_documents: documents.length,
        by_type: {},
        total_size: 0,
      };

      documents.forEach((doc) => {
        stats.by_type[doc.document_type] =
          (stats.by_type[doc.document_type] || 0) + 1;
        stats.total_size += doc.file_size || 0;
      });

      return stats;
    } catch (error) {
      console.error("❌ Error getting document stats:", error);
      throw error;
    }
  }

  /**
   * Generate Invoice PDF (generic method for invoices.js)
   * Returns placeholder - actual PDF generated on-demand via download endpoint
   */
  async generateInvoicePDF(invoiceData) {
    try {
      // Invoices are generated on-demand in download endpoints
      // This method just records metadata
      const invoiceNumber = invoiceData.invoice_number;
      return {
        fileName: `${invoiceNumber}.pdf`,
        filePath: `uploads/documents/invoices/${invoiceNumber}.pdf`,
        fileSize: 0, // Will be calculated when file is actually downloaded
      };
    } catch (error) {
      console.error("❌ Error generating invoice PDF:", error);
      throw error;
    }
  }

  /**
   * Generate Invoice Number
   */
  generateInvoiceNumber() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `INV-${dateStr}-${random}`;
  }
}

module.exports = DocumentService;
