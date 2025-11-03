const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Base PDF Generator Class
 * Provides common PDF formatting and structure
 */
class PDFGenerator {
  constructor() {
    this.doc = null;
    this.filePath = null;
  }

  /**
   * Initialize a new PDF document
   */
  createPDF(fileName, outputDir = "uploads/documents") {
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    this.filePath = path.join(outputDir, fileName);
    this.doc = new PDFDocument({
      size: "A4",
      margin: 40,
      bufferPages: true,
    });

    return this.doc.pipe(fs.createWriteStream(this.filePath));
  }

  /**
   * Add header with company info
   */
  addHeader(companyName = "Passion Clothing ERP", logoPath = null) {
    this.doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(companyName, { align: "center" });
    this.doc.fontSize(10).text("www.passionclothing.com", { align: "center" });
    this.doc.text("Email: info@passionclothing.com | Phone: +1-800-PASSION", {
      align: "center",
    });
    this.doc
      .moveTo(40, this.doc.y + 5)
      .lineTo(555, this.doc.y + 5)
      .stroke();
    this.doc.moveDown(0.5);
  }

  /**
   * Add document title and metadata
   */
  addTitle(title, metadata = {}) {
    this.doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(title, { underline: true });
    this.doc.moveDown(0.3);

    this.doc.fontSize(9).font("Helvetica");
    if (metadata.date) this.doc.text(`Date: ${metadata.date}`);
    if (metadata.referenceNumber)
      this.doc.text(`Reference: ${metadata.referenceNumber}`);
    if (metadata.status) this.doc.text(`Status: ${metadata.status}`);

    this.doc.moveDown(0.5);
  }

  /**
   * Add two-column info box (for order/customer details)
   */
  addTwoColumnInfo(
    leftData,
    rightData,
    leftLabel = "Order Details",
    rightLabel = "Customer Details"
  ) {
    const startY = this.doc.y;
    const columnWidth = 250;

    // Left column
    this.doc.fontSize(10).font("Helvetica-Bold").text(leftLabel);
    this.doc.fontSize(9).font("Helvetica");
    Object.entries(leftData).forEach(([key, value]) => {
      this.doc.text(`${key}: ${value}`);
    });

    // Right column
    this.doc.y = startY;
    this.doc.x = 300;
    this.doc.fontSize(10).font("Helvetica-Bold").text(rightLabel);
    this.doc.fontSize(9).font("Helvetica");
    Object.entries(rightData).forEach(([key, value]) => {
      this.doc.text(`${key}: ${value}`, 300);
    });

    this.doc.x = 40;
    this.doc.moveDown(1);
  }

  /**
   * Add table with custom styling
   */
  addTable(data, columns) {
    const tableTop = this.doc.y;
    const itemsPerPage = 8;
    const rowHeight = 25;
    const columnWidth = (515 - 10) / columns.length;

    // Table header
    this.doc.fillColor("#E8E8E8").rect(40, tableTop, 515, 25).fill();
    this.doc.fillColor("#000");
    this.doc.font("Helvetica-Bold").fontSize(10);

    let xPos = 50;
    columns.forEach((col) => {
      this.doc.text(col.header, xPos, tableTop + 5, {
        width: columnWidth - 10,
      });
      xPos += columnWidth;
    });

    this.doc.moveDown(2);

    // Table rows
    this.doc.font("Helvetica").fontSize(9);
    data.forEach((row, index) => {
      const rowY = tableTop + 25 + index * rowHeight;

      // Alternating row colors
      if (index % 2 === 0) {
        this.doc.fillColor("#F5F5F5").rect(40, rowY, 515, rowHeight).fill();
      }

      this.doc.fillColor("#000");
      xPos = 50;
      columns.forEach((col) => {
        const value = row[col.key] || "";
        this.doc.text(String(value), xPos, rowY + 5, {
          width: columnWidth - 10,
        });
        xPos += columnWidth;
      });
    });

    this.doc.moveDown(data.length * 2.5 + 0.5);
  }

  /**
   * Add summary section with totals
   */
  addSummary(summaryData) {
    this.doc.moveDown(0.5);
    this.doc.fontSize(10).font("Helvetica-Bold").text("Summary");
    this.doc.fontSize(9).font("Helvetica");

    const summaryStart = this.doc.x + 300;
    Object.entries(summaryData).forEach(([key, value]) => {
      const isBold = key.includes("Total") || key.includes("Grand");
      if (isBold) {
        this.doc.font("Helvetica-Bold");
      }
      this.doc.text(`${key}: ${value}`, summaryStart);
      if (isBold) {
        this.doc.font("Helvetica");
      }
    });
  }

  /**
   * Add footer with signature and terms
   */
  addFooter() {
    this.doc.moveDown(1);
    this.doc.moveTo(40, this.doc.y).lineTo(555, this.doc.y).stroke();
    this.doc.moveDown(0.3);

    this.doc.fontSize(9).font("Helvetica");
    this.doc.text("Authorized by: ___________________", 40, undefined, {
      width: 200,
    });
    this.doc.text("Date: ___________________", 350, this.doc.y - 20, {
      width: 200,
    });

    this.doc.fontSize(8).font("Helvetica-Oblique");
    this.doc.text(
      "This document is confidential and contains proprietary information.",
      {
        align: "center",
      }
    );
    this.doc.text("Page " + Math.ceil(this.doc.bufferedPageRange().count), {
      align: "center",
    });
  }

  /**
   * Finalize and save PDF
   */
  finalize() {
    this.addFooter();
    this.doc.end();

    return new Promise((resolve, reject) => {
      this.doc.on("finish", () => {
        resolve(this.filePath);
      });
      this.doc.on("error", reject);
    });
  }
}

/**
 * Sales Invoice PDF Generator
 */
class SalesInvoicePDF extends PDFGenerator {
  generate(invoiceData) {
    const fileName = `INV-${invoiceData.order_number || "TEMP"}.pdf`;
    this.createPDF(fileName, "uploads/documents/invoices");

    this.addHeader();
    this.addTitle("SALES INVOICE", {
      date: new Date().toLocaleDateString(),
      referenceNumber: invoiceData.order_number,
      status: invoiceData.status || "Draft",
    });

    // Customer and Order Details
    this.addTwoColumnInfo(
      {
        "Order ID": invoiceData.order_number,
        "Order Date": invoiceData.order_date,
        "Delivery Date": invoiceData.delivery_date,
        Amount: `$${invoiceData.final_amount || 0}`,
      },
      {
        Customer: invoiceData.customer_name,
        Email: invoiceData.customer_email,
        Phone: invoiceData.customer_phone,
        Address: invoiceData.customer_address,
      }
    );

    // Items table
    const itemsData = invoiceData.items || [];
    const columns = [
      { header: "Item", key: "product_name" },
      { header: "Qty", key: "quantity" },
      { header: "Unit Price", key: "unit_price" },
      { header: "Amount", key: "total_amount" },
    ];

    this.addTable(itemsData, columns);

    // Summary
    this.addSummary({
      Subtotal: `$${invoiceData.subtotal || 0}`,
      Tax: `$${invoiceData.tax || 0}`,
      "Grand Total": `$${invoiceData.final_amount || 0}`,
      Status: invoiceData.status || "Pending",
    });

    return this.finalize();
  }
}

/**
 * GRN (Goods Receipt Note) PDF Generator
 */
class GRNPdf extends PDFGenerator {
  generate(grnData) {
    const fileName = `GRN-${grnData.grn_number || "TEMP"}.pdf`;
    this.createPDF(fileName, "uploads/documents/grn_slips");

    this.addHeader();
    this.addTitle("GOODS RECEIPT NOTE (GRN)", {
      date: new Date().toLocaleDateString(),
      referenceNumber: grnData.grn_number,
      status: grnData.status || "Pending",
    });

    // PO and Vendor Details
    this.addTwoColumnInfo(
      {
        "GRN Number": grnData.grn_number,
        "PO Number": grnData.po_number,
        "Received Date": new Date().toLocaleDateString(),
        "Total Quantity": grnData.total_quantity || 0,
      },
      {
        Vendor: grnData.vendor_name,
        "Vendor Code": grnData.vendor_code,
        Email: grnData.vendor_email,
        Phone: grnData.vendor_phone,
      }
    );

    // Items received
    const itemsData = grnData.items || [];
    const columns = [
      { header: "Item", key: "item_name" },
      { header: "PO Qty", key: "po_quantity" },
      { header: "Received", key: "received_quantity" },
      { header: "Condition", key: "condition" },
    ];

    this.addTable(itemsData, columns);

    // Summary
    this.addSummary({
      "Total Received": grnData.total_quantity || 0,
      Status: grnData.status,
      "Verified By": grnData.verified_by || "Pending",
    });

    return this.finalize();
  }
}

/**
 * Manufacturing Stage Slip PDF Generator
 */
class ManufacturingSlipPDF extends PDFGenerator {
  generate(stageData) {
    const fileName = `MFG-${stageData.stage_name}-${
      stageData.production_order_id || "TEMP"
    }.pdf`;
    this.createPDF(fileName, "uploads/documents/manufacturing_slips");

    this.addHeader();
    this.addTitle(
      `MANUFACTURING SLIP - ${stageData.stage_name.toUpperCase()}`,
      {
        date: new Date().toLocaleDateString(),
        referenceNumber: `PO-${stageData.production_order_id}`,
        status: stageData.stage_status || "Pending",
      }
    );

    // Production and Stage Details
    this.addTwoColumnInfo(
      {
        "Production Order": stageData.production_order_id,
        "Sales Order": stageData.sales_order_number,
        Stage: stageData.stage_name,
        Status: stageData.stage_status,
      },
      {
        Product: stageData.product_name,
        Quantity: stageData.quantity,
        "Start Date": stageData.start_date,
        "End Date": stageData.end_date,
      }
    );

    // Stage details
    const detailsData = [
      {
        Processing: stageData.processed_quantity || 0,
        Approved: stageData.approved_quantity || 0,
        Rejected: stageData.rejected_quantity || 0,
        "Material Used": stageData.material_used || 0,
      },
    ];

    this.doc.moveDown(0.5);
    this.doc.fontSize(10).font("Helvetica-Bold").text("Stage Progress");
    this.doc.fontSize(9).font("Helvetica");

    Object.entries(detailsData[0]).forEach(([key, value]) => {
      this.doc.text(`${key}: ${value}`);
    });

    // Notes
    if (stageData.notes) {
      this.doc.moveDown(0.5);
      this.doc.fontSize(10).font("Helvetica-Bold").text("Notes");
      this.doc.fontSize(9).font("Helvetica").text(stageData.notes);
    }

    return this.finalize();
  }
}

/**
 * Delivery Invoice PDF Generator
 */
class DeliveryInvoicePDF extends PDFGenerator {
  generate(deliveryData) {
    const fileName = `DEL-INV-${deliveryData.shipment_number || "TEMP"}.pdf`;
    this.createPDF(fileName, "uploads/documents/delivery_invoices");

    this.addHeader();
    this.addTitle("DELIVERY INVOICE", {
      date: new Date().toLocaleDateString(),
      referenceNumber: deliveryData.shipment_number,
      status: deliveryData.delivery_status || "Delivered",
    });

    // Shipment and Customer Details
    this.addTwoColumnInfo(
      {
        "Shipment Number": deliveryData.shipment_number,
        "Sales Order": deliveryData.sales_order_number,
        Courier: deliveryData.courier_name,
        Tracking: deliveryData.tracking_number,
      },
      {
        Customer: deliveryData.customer_name,
        "Delivery Address": deliveryData.delivery_address,
        "Delivered Date": deliveryData.delivered_date,
        "Received By": deliveryData.received_by || "Customer",
      }
    );

    // Delivered items
    const itemsData = deliveryData.items || [];
    const columns = [
      { header: "Item", key: "product_name" },
      { header: "Qty", key: "quantity" },
      { header: "Unit Price", key: "unit_price" },
      { header: "Amount", key: "total_amount" },
    ];

    this.addTable(itemsData, columns);

    // Summary
    this.addSummary({
      "Total Quantity": deliveryData.total_quantity || 0,
      Subtotal: `$${deliveryData.subtotal || 0}`,
      Tax: `$${deliveryData.tax || 0}`,
      "Grand Total": `$${deliveryData.final_amount || 0}`,
      Status: deliveryData.delivery_status,
    });

    return this.finalize();
  }
}

/**
 * Purchase Order PDF Generator
 */
class PurchaseOrderPDF extends PDFGenerator {
  generate(poData) {
    const fileName = `PO-${poData.po_number || "TEMP"}.pdf`;
    this.createPDF(fileName, "uploads/documents/purchase_orders");

    this.addHeader();
    this.addTitle("PURCHASE ORDER", {
      date: new Date().toLocaleDateString(),
      referenceNumber: poData.po_number,
      status: poData.status || "Draft",
    });

    // PO and Vendor Details
    this.addTwoColumnInfo(
      {
        "PO Number": poData.po_number,
        "PO Date": poData.created_date,
        "Expected Delivery": poData.expected_delivery_date,
        Amount: `$${poData.final_amount || 0}`,
      },
      {
        Vendor: poData.vendor_name,
        "Vendor Code": poData.vendor_code,
        Email: poData.vendor_email,
        Phone: poData.vendor_phone,
      }
    );

    // Items table
    const itemsData = poData.items || [];
    const columns = [
      { header: "Item", key: "item_name" },
      { header: "Qty", key: "quantity" },
      { header: "Unit Price", key: "unit_price" },
      { header: "Amount", key: "total_amount" },
    ];

    this.addTable(itemsData, columns);

    // Summary
    this.addSummary({
      Subtotal: `$${poData.subtotal || 0}`,
      Tax: `$${poData.tax || 0}`,
      "Grand Total": `$${poData.final_amount || 0}`,
      Status: poData.status,
    });

    return this.finalize();
  }
}

module.exports = {
  PDFGenerator,
  SalesInvoicePDF,
  GRNPdf,
  ManufacturingSlipPDF,
  DeliveryInvoicePDF,
  PurchaseOrderPDF,
};
