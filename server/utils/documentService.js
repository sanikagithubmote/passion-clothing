const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { pipeline } = require("stream");
const { promisify } = require("util");

class DocumentService {
  constructor() {
    this.uploadsDir = path.join(__dirname, "../uploads/documents");
    this.ensureUploadsDirectory();
  }

  /**
   * Ensure uploads directory exists
   */
  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Generate professional invoice PDF
   */
  async generateInvoicePDF(invoiceData, outputPath = null) {
    try {
      const fileName = `INV-${
        invoiceData.invoice_number || invoiceData.invoice_id
      }-${Date.now()}.pdf`;
      const filePath = outputPath || path.join(this.uploadsDir, fileName);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Company Header
        doc
          .font("Helvetica-Bold")
          .fontSize(24)
          .text("INVOICE", { align: "center" });
        doc.moveDown(0.3);
        doc.fontSize(10).text("_".repeat(80), { align: "center" });
        doc.moveDown(0.5);

        // Company Info & Invoice Number
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(invoiceData.company_name || "Passion Clothing Co.", 50, 100);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(invoiceData.company_address || "Your Company Address", 50, 125);
        if (invoiceData.company_phone) {
          doc.text(`Phone: ${invoiceData.company_phone}`, 50, 140);
        }
        if (invoiceData.company_email) {
          doc.text(`Email: ${invoiceData.company_email}`, 50, 155);
        }
        if (invoiceData.company_gst) {
          doc.text(`GST: ${invoiceData.company_gst}`, 50, 170);
        }

        // Invoice Details (Right Side)
        const detailsX = 400;
        doc.fontSize(10).font("Helvetica-Bold");
        doc.text("Invoice Number:", detailsX, 100);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(invoiceData.invoice_number || "N/A", detailsX + 100, 100);

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Invoice Date:", detailsX, 120);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(
            invoiceData.invoice_date
              ? new Date(invoiceData.invoice_date).toLocaleDateString()
              : new Date().toLocaleDateString(),
            detailsX + 100,
            120
          );

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Due Date:", detailsX, 140);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(
            invoiceData.due_date
              ? new Date(invoiceData.due_date).toLocaleDateString()
              : "N/A",
            detailsX + 100,
            140
          );

        doc.fontSize(10).font("Helvetica-Bold").text("Status:", detailsX, 160);
        doc
          .fontSize(9)
          .font("Helvetica")
          .text(
            (invoiceData.status || "draft").toUpperCase(),
            detailsX + 100,
            160
          );

        // Bill To / Sold To
        doc.moveDown(2);
        doc.fontSize(11).font("Helvetica-Bold").text("Bill To:", 50);
        doc.fontSize(9).font("Helvetica");
        doc.text(invoiceData.customer_name || "Customer", 50, doc.y);
        doc.text(invoiceData.customer_address || "Address", 50, doc.y);
        if (invoiceData.customer_phone) {
          doc.text(`Phone: ${invoiceData.customer_phone}`, 50, doc.y);
        }
        if (invoiceData.customer_email) {
          doc.text(`Email: ${invoiceData.customer_email}`, 50, doc.y);
        }

        // Shipping To (if different)
        if (
          invoiceData.ship_to_name &&
          invoiceData.ship_to_name !== invoiceData.customer_name
        ) {
          doc.moveDown(0.5);
          doc.fontSize(11).font("Helvetica-Bold").text("Ship To:", 350);
          doc.fontSize(9).font("Helvetica");
          doc.text(invoiceData.ship_to_name, 350, doc.y);
          doc.text(invoiceData.ship_to_address || "Address", 350, doc.y);
        }

        // Items Table
        doc.moveDown(1);
        const tableTop = doc.y;
        const tableHeight = 20;
        const rows = invoiceData.items || [];
        const detailsPerPage = 12;

        // Table Header
        this.drawTableHeader(doc, tableTop);
        let yPosition = tableTop + tableHeight + 5;

        // Table Rows
        rows.forEach((item, index) => {
          if (yPosition > doc.page.height - 150) {
            doc.addPage();
            yPosition = 50;
            this.drawTableHeader(doc, yPosition - tableHeight - 5);
            yPosition += tableHeight + 5;
          }

          doc.fontSize(9).font("Helvetica");

          // Item details
          const description = item.product_name || item.description || "";
          const quantity = parseFloat(item.quantity || 0).toFixed(2);
          const rate = parseFloat(item.rate || item.unit_price || 0).toFixed(2);
          const amount = (parseFloat(quantity) * parseFloat(rate)).toFixed(2);

          doc.text(description, 50, yPosition, {
            width: 150,
            height: tableHeight,
          });
          doc.text(quantity, 210, yPosition, { width: 50, align: "right" });
          doc.text(rate, 270, yPosition, { width: 60, align: "right" });
          doc.text(amount, 480, yPosition, { width: 60, align: "right" });

          yPosition += tableHeight;
        });

        // Summary Section
        yPosition += 10;
        doc.fontSize(10).font("Helvetica-Bold");

        // Subtotal
        const subtotal =
          invoiceData.subtotal ||
          invoiceData.items
            ?.reduce((sum, item) => {
              return (
                sum +
                parseFloat(item.quantity || 0) *
                  parseFloat(item.rate || item.unit_price || 0)
              );
            }, 0)
            .toFixed(2) ||
          0;

        doc.text("Subtotal:", 400, yPosition, { width: 60 });
        doc.text(`₹ ${parseFloat(subtotal).toFixed(2)}`, 480, yPosition, {
          width: 60,
          align: "right",
        });
        yPosition += 25;

        // Discount
        const discount = invoiceData.discount_amount || 0;
        if (discount > 0) {
          doc.text("Discount:", 400, yPosition, { width: 60 });
          doc.text(`₹ ${parseFloat(discount).toFixed(2)}`, 480, yPosition, {
            width: 60,
            align: "right",
          });
          yPosition += 25;
        }

        // Tax
        const tax = invoiceData.total_tax_amount || 0;
        if (tax > 0) {
          doc.text("Tax (GST):", 400, yPosition, { width: 60 });
          doc.text(`₹ ${parseFloat(tax).toFixed(2)}`, 480, yPosition, {
            width: 60,
            align: "right",
          });
          yPosition += 25;
        }

        // Total
        doc.fontSize(11).font("Helvetica-Bold");
        doc.rect(400, yPosition - 5, 160, 25).stroke();
        doc.text("TOTAL:", 410, yPosition + 5, { width: 60 });
        const total =
          invoiceData.total_amount ||
          (
            parseFloat(subtotal) -
            parseFloat(discount) +
            parseFloat(tax)
          ).toFixed(2);
        doc.text(`₹ ${parseFloat(total).toFixed(2)}`, 480, yPosition + 5, {
          width: 60,
          align: "right",
        });

        // Notes
        yPosition += 40;
        if (invoiceData.notes) {
          doc.fontSize(9).font("Helvetica-Bold").text("Notes:", 50);
          doc
            .fontSize(8)
            .font("Helvetica")
            .text(invoiceData.notes, 50, doc.y, { width: 500 });
        }

        // Terms
        yPosition = doc.page.height - 80;
        if (invoiceData.terms_conditions) {
          doc
            .fontSize(8)
            .font("Helvetica-Bold")
            .text("Terms & Conditions:", 50, yPosition);
          doc
            .fontSize(7)
            .text(invoiceData.terms_conditions, 50, doc.y, { width: 500 });
        }

        // Footer
        doc
          .fontSize(8)
          .font("Helvetica")
          .text("Thank you for your business!", 50, doc.page.height - 30, {
            align: "center",
          });

        doc.end();

        stream.on("finish", () => {
          resolve({
            success: true,
            filePath,
            fileName,
            fileSize: fs.statSync(filePath).size,
          });
        });

        stream.on("error", reject);
        doc.on("error", reject);
      });
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      throw error;
    }
  }

  /**
   * Draw table header for invoice
   */
  drawTableHeader(doc, yPosition) {
    const headerColor = "#f0f0f0";

    doc.rect(50, yPosition, 510, 20).fillAndStroke(headerColor, "#000000");

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000000");
    doc.text("Description", 60, yPosition + 5);
    doc.text("Qty", 220, yPosition + 5);
    doc.text("Rate", 280, yPosition + 5);
    doc.text("Amount", 490, yPosition + 5, { align: "right" });
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file, maxSize = 10 * 1024 * 1024) {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds limit of ${maxSize / (1024 * 1024)}MB`
      );
    }

    if (!allowedMimes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }

    return true;
  }

  /**
   * Save uploaded file
   */
  async saveUploadedFile(file) {
    try {
      this.validateFileUpload(file);

      const timestamp = Date.now();
      const sanitizedFileName = file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      );
      const fileName = `${timestamp}-${sanitizedFileName}`;
      const filePath = path.join(this.uploadsDir, fileName);

      fs.writeFileSync(filePath, file.buffer);

      return {
        success: true,
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.mimetype,
        originalName: file.originalname,
      };
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return { success: true };
      }
      return { success: false, message: "File not found" };
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Get file download stream
   */
  getFileStream(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
      }
      return fs.createReadStream(filePath);
    } catch (error) {
      console.error("Error creating read stream:", error);
      throw error;
    }
  }

  /**
   * Generate unique invoice number
   */
  generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const timestamp = Date.now().toString().slice(-4);

    return `INV-${year}${month}${day}-${timestamp}`;
  }
}

module.exports = DocumentService;
