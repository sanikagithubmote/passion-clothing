/**
 * PUPPETEER PDF GENERATION SERVICE
 * Converts HTML to PDF for all 6 modules
 * Features: Auto-height, table support, professional formatting
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

class PuppeteerPDFService {
  static async generatePDF(
    htmlContent,
    fileName,
    outputDir = "uploads/documents"
  ) {
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, fileName);

      const browser = await puppeteer.launch({ headless: "new" });
      const page = await browser.newPage();

      await page.setContent(htmlContent, { waitUntil: "networkidle2" });

      await page.pdf({
        path: filePath,
        format: "A4",
        margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
        printBackground: true,
      });

      await browser.close();
      return filePath;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      throw error;
    }
  }

  /**
   * GENERATE SALES INVOICE PDF
   */
  static async generateSalesInvoice(data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1976d2; padding-bottom: 15px; }
          .header h1 { color: #1976d2; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .document-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #1976d2; }
          .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .column { padding: 15px; background: #f5f5f5; border-radius: 5px; }
          .column h3 { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #1976d2; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead { background: #1976d2; color: white; }
          th { padding: 10px; text-align: left; font-size: 11px; font-weight: bold; }
          td { padding: 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
          tbody tr:nth-child(even) { background: #f9f9f9; }
          .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
          .summary-box { padding: 15px; background: #f0f0f0; border-radius: 5px; }
          .summary-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
          .summary-total { font-weight: bold; font-size: 13px; color: #1976d2; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; }
          .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; text-align: center; }
          .signature-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Passion Clothing ERP</h1>
          <p>www.passionclothing.com | info@passionclothing.com | +1-800-PASSION</p>
        </div>

        <div class="document-title">📄 SALES INVOICE</div>

        <div class="two-column">
          <div class="column">
            <h3>Order Details</h3>
            <div class="row">
              <span>Order ID:</span>
              <span>${data.orderNumber}</span>
            </div>
            <div class="row">
              <span>Order Date:</span>
              <span>${new Date(data.orderDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Delivery Date:</span>
              <span>${new Date(data.deliveryDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Amount:</span>
              <span>$${(data.finalAmount || 0).toFixed(2)}</span>
            </div>
            <div class="row">
              <span>Status:</span>
              <span><strong>${data.status || "Confirmed"}</strong></span>
            </div>
          </div>

          <div class="column">
            <h3>Customer Details</h3>
            <div class="row">
              <span>Customer:</span>
              <span>${data.customerName}</span>
            </div>
            <div class="row">
              <span>Email:</span>
              <span>${data.customerEmail}</span>
            </div>
            <div class="row">
              <span>Phone:</span>
              <span>${data.customerPhone}</span>
            </div>
            <div class="row">
              <span>Address:</span>
              <span>${data.customerAddress}</span>
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; margin: 20px 0 10px 0; color: #1976d2;">Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || [])
              .map(
                (item) => `
              <tr>
                <td>${item.product_name || "N/A"}</td>
                <td>${item.quantity || 0}</td>
                <td>$${(item.unit_price || 0).toFixed(2)}</td>
                <td>$${((item.quantity || 0) * (item.unit_price || 0)).toFixed(
                  2
                )}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary">
          <div></div>
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>$${(data.subtotal || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Tax (${data.taxRate || 0}%):</span>
              <span>$${(data.tax || 0).toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>Grand Total:</span>
              <span>$${(data.finalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="signature">
          <div>
            <p style="margin: 0; font-size: 11px;">Authorized By</p>
            <div class="signature-line"></div>
          </div>
          <div>
            <p style="margin: 0; font-size: 11px;">Date</p>
            <div class="signature-line"></div>
          </div>
        </div>

        <div class="footer">
          <p style="text-align: center; margin-top: 20px; color: #999;">
            This is a computer-generated document. No signature is required.
          </p>
        </div>
      </body>
      </html>
    `;

    const fileName = `INV-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${
      data.orderNumber || "TEMP"
    }.pdf`;
    return this.generatePDF(html, fileName, "uploads/documents/invoices");
  }

  /**
   * GENERATE GRN (GOODS RECEIPT NOTE) PDF
   */
  static async generateGRNSlip(data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #388e3c; padding-bottom: 15px; }
          .header h1 { color: #388e3c; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .document-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #388e3c; }
          .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .column { padding: 15px; background: #f0f7f4; border-radius: 5px; border-left: 4px solid #388e3c; }
          .column h3 { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #388e3c; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead { background: #388e3c; color: white; }
          th { padding: 10px; text-align: left; font-size: 11px; font-weight: bold; }
          td { padding: 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
          tbody tr:nth-child(even) { background: #f9f9f9; }
          .summary-box { padding: 15px; background: #f0f7f4; border-radius: 5px; margin-top: 20px; border-left: 4px solid #388e3c; }
          .summary-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Passion Clothing ERP</h1>
          <p>Procurement Module | www.passionclothing.com</p>
        </div>

        <div class="document-title">📦 GOODS RECEIPT NOTE (GRN)</div>

        <div class="two-column">
          <div class="column">
            <h3>Receipt Details</h3>
            <div class="row">
              <span>GRN Number:</span>
              <span>${data.grnNumber}</span>
            </div>
            <div class="row">
              <span>PO Number:</span>
              <span>${data.poNumber || "N/A"}</span>
            </div>
            <div class="row">
              <span>Received Date:</span>
              <span>${new Date(data.receivedDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Total Quantity:</span>
              <span>${data.totalQuantity || 0} units</span>
            </div>
            <div class="row">
              <span>Status:</span>
              <span><strong>${data.status || "Completed"}</strong></span>
            </div>
          </div>

          <div class="column">
            <h3>Vendor Details</h3>
            <div class="row">
              <span>Vendor Name:</span>
              <span>${data.vendorName}</span>
            </div>
            <div class="row">
              <span>Vendor Code:</span>
              <span>${data.vendorCode || "N/A"}</span>
            </div>
            <div class="row">
              <span>Email:</span>
              <span>${data.vendorEmail || "N/A"}</span>
            </div>
            <div class="row">
              <span>Phone:</span>
              <span>${data.vendorPhone || "N/A"}</span>
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; margin: 20px 0 10px 0; color: #388e3c;">Items Received</h3>
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>PO Qty</th>
              <th>Received Qty</th>
              <th>Condition</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || [])
              .map(
                (item) => `
              <tr>
                <td>${item.item_name || "N/A"}</td>
                <td>${item.po_quantity || 0}</td>
                <td>${item.received_quantity || 0}</td>
                <td>${item.condition || "Good"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Total Received:</span>
            <span><strong>${data.totalQuantity || 0} units</strong></span>
          </div>
          <div class="summary-row">
            <span>Verified By:</span>
            <span>${data.verifiedBy || "Pending"}</span>
          </div>
          <div class="summary-row">
            <span>Status:</span>
            <span><strong>${data.status || "Completed"}</strong></span>
          </div>
        </div>

        <div class="footer">
          <p>Document Generated: ${new Date().toLocaleString()}</p>
          <p style="text-align: center; margin-top: 20px; color: #999;">
            This is a computer-generated Goods Receipt Note.
          </p>
        </div>
      </body>
      </html>
    `;

    const fileName = `GRN-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${
      data.grnNumber || "TEMP"
    }.pdf`;
    return this.generatePDF(html, fileName, "uploads/documents/grn_slips");
  }

  /**
   * GENERATE STOCK SLIP PDF
   */
  static async generateStockSlip(data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f57c00; padding-bottom: 15px; }
          .header h1 { color: #f57c00; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .document-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #f57c00; }
          .details-box { padding: 20px; background: #fff3e0; border-radius: 5px; border-left: 4px solid #f57c00; }
          .detail-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 12px; }
          .detail-row span:first-child { font-weight: bold; }
          .status-badge { display: inline-block; background: #4caf50; color: white; padding: 4px 10px; border-radius: 3px; font-size: 11px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Passion Clothing ERP</h1>
          <p>Inventory Module | Stock Management</p>
        </div>

        <div class="document-title">📊 STOCK SLIP</div>

        <div class="details-box">
          <div class="detail-row">
            <span>Stock Number:</span>
            <span>${data.stockNumber}</span>
          </div>
          <div class="detail-row">
            <span>Item Name:</span>
            <span>${data.itemName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span>Quantity:</span>
            <span><strong>${data.quantity || 0} units</strong></span>
          </div>
          <div class="detail-row">
            <span>Category:</span>
            <span>${data.category || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span>Location:</span>
            <span>${data.location || "Warehouse-A"}</span>
          </div>
          <div class="detail-row">
            <span>Added Date:</span>
            <span>${new Date(data.addedDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Status:</span>
            <span><span class="status-badge">${
              data.status || "Ready for Production"
            }</span></span>
          </div>
        </div>

        <div class="footer">
          <p>Document Generated: ${new Date().toLocaleString()}</p>
          <p style="text-align: center; margin-top: 20px; color: #999;">
            Stock is now ready for production use.
          </p>
        </div>
      </body>
      </html>
    `;

    const fileName = `STOCK-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${
      data.stockNumber || "TEMP"
    }.pdf`;
    return this.generatePDF(html, fileName, "uploads/documents/stock_slips");
  }

  /**
   * GENERATE MANUFACTURING STAGE SLIP PDF
   */
  static async generateManufacturingSlip(data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #d32f2f; padding-bottom: 15px; }
          .header h1 { color: #d32f2f; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .document-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #d32f2f; }
          .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .column { padding: 15px; background: #ffebee; border-radius: 5px; border-left: 4px solid #d32f2f; }
          .column h3 { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #d32f2f; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
          .progress-section { padding: 20px; background: #fff; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0; }
          .progress-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; font-size: 12px; }
          .progress-item:last-child { border-bottom: none; }
          .notes-section { padding: 15px; background: #f5f5f5; border-radius: 5px; margin-top: 20px; }
          .notes-section h4 { font-size: 12px; margin-bottom: 10px; color: #d32f2f; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Passion Clothing ERP</h1>
          <p>Manufacturing Module | Stage Tracking</p>
        </div>

        <div class="document-title">🏭 MANUFACTURING SLIP - ${data.stageName.toUpperCase()}</div>

        <div class="two-column">
          <div class="column">
            <h3>Production Details</h3>
            <div class="row">
              <span>Production Order:</span>
              <span>${data.productionOrderId}</span>
            </div>
            <div class="row">
              <span>Sales Order:</span>
              <span>${data.salesOrderNumber || "N/A"}</span>
            </div>
            <div class="row">
              <span>Stage:</span>
              <span><strong>${data.stageName}</strong></span>
            </div>
            <div class="row">
              <span>Status:</span>
              <span><strong>${data.stageStatus || "Pending"}</strong></span>
            </div>
          </div>

          <div class="column">
            <h3>Product Information</h3>
            <div class="row">
              <span>Product Name:</span>
              <span>${data.productName}</span>
            </div>
            <div class="row">
              <span>Quantity:</span>
              <span>${data.quantity || 0} units</span>
            </div>
            <div class="row">
              <span>Start Date:</span>
              <span>${new Date(data.startDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>End Date:</span>
              <span>${new Date(data.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div class="progress-section">
          <h3 style="font-size: 12px; margin-bottom: 15px; color: #d32f2f;">Stage Progress</h3>
          <div class="progress-item">
            <span>Processed Quantity:</span>
            <span><strong>${data.processedQuantity || 0} units</strong></span>
          </div>
          <div class="progress-item">
            <span>Approved Quantity:</span>
            <span><strong>${data.approvedQuantity || 0} units</strong></span>
          </div>
          <div class="progress-item">
            <span>Rejected Quantity:</span>
            <span><strong>${data.rejectedQuantity || 0} units</strong></span>
          </div>
          <div class="progress-item">
            <span>Material Used:</span>
            <span><strong>${data.materialUsed || 0} units</strong></span>
          </div>
        </div>

        ${
          data.notes
            ? `
          <div class="notes-section">
            <h4>Notes</h4>
            <p style="font-size: 11px; line-height: 1.5;">${data.notes}</p>
          </div>
        `
            : ""
        }

        <div class="footer">
          <p>Document Generated: ${new Date().toLocaleString()}</p>
          <p style="text-align: center; margin-top: 20px; color: #999;">
            Manufacturing stage slip for record keeping.
          </p>
        </div>
      </body>
      </html>
    `;

    const fileName = `MFG-${data.stageName}-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${
      data.productionOrderId || "TEMP"
    }.pdf`;
    return this.generatePDF(
      html,
      fileName,
      "uploads/documents/manufacturing_slips"
    );
  }

  /**
   * GENERATE SHIPMENT SLIP PDF
   */
  static async generateShipmentSlip(data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0288d1; padding-bottom: 15px; }
          .header h1 { color: #0288d1; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .document-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #0288d1; }
          .tracking-box { padding: 20px; background: #e1f5fe; border-radius: 5px; border-left: 4px solid #0288d1; margin-bottom: 20px; }
          .tracking-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .info-item h4 { font-size: 11px; font-weight: bold; color: #0288d1; margin-bottom: 5px; }
          .info-item p { font-size: 12px; margin: 3px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #0288d1; color: white; padding: 10px; text-align: left; font-size: 11px; }
          .items-table td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
          .items-table tbody tr:nth-child(even) { background: #f9f9f9; }
          .delivery-details { padding: 15px; background: #f0f0f0; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 12px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Passion Clothing ERP</h1>
          <p>Shipment Module | Delivery Tracking</p>
        </div>

        <div class="document-title">🚚 SHIPMENT SLIP & TRACKING</div>

        <div class="tracking-box">
          <div class="tracking-info">
            <div class="info-item">
              <h4>Shipment Number</h4>
              <p style="font-size: 14px; font-weight: bold; color: #0288d1;">${
                data.shipmentNumber
              }</p>
            </div>
            <div class="info-item">
              <h4>Tracking Number</h4>
              <p style="font-size: 14px; font-weight: bold; color: #0288d1;">${
                data.trackingNumber
              }</p>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <h4 style="font-size: 11px; font-weight: bold; color: #0288d1; margin-bottom: 10px;">Courier Information</h4>
            <p style="font-size: 11px; margin: 5px 0;"><strong>${
              data.courierName
            }</strong></p>
            <p style="font-size: 11px; margin: 5px 0;">Phone: ${
              data.courierPhone || "N/A"
            }</p>
          </div>
          <div style="padding: 15px; background: #f5f5f5; border-radius: 5px;">
            <h4 style="font-size: 11px; font-weight: bold; color: #0288d1; margin-bottom: 10px;">Delivery Dates</h4>
            <p style="font-size: 11px; margin: 5px 0;">Dispatch: ${new Date(
              data.dispatchDate
            ).toLocaleDateString()}</p>
            <p style="font-size: 11px; margin: 5px 0;">Est. Delivery: ${new Date(
              data.estimatedDelivery
            ).toLocaleDateString()}</p>
          </div>
        </div>

        <h3 style="font-size: 12px; margin: 20px 0 10px 0; color: #0288d1;">Items for Shipment</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || [])
              .map(
                (item) => `
              <tr>
                <td>${item.product_name || "N/A"}</td>
                <td>${item.quantity || 0}</td>
                <td>${item.status || "Ready"}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="delivery-details">
          <h4 style="font-size: 12px; margin-bottom: 10px; color: #0288d1;">Delivery Address</h4>
          <div class="detail-row">
            <span>Customer:</span>
            <span>${data.customerName}</span>
          </div>
          <div class="detail-row">
            <span>Address:</span>
            <span>${data.deliveryAddress}</span>
          </div>
          <div class="detail-row">
            <span>Status:</span>
            <span><strong>${data.status || "Dispatched"}</strong></span>
          </div>
        </div>

        <div class="footer">
          <p>Document Generated: ${new Date().toLocaleString()}</p>
          <p style="text-align: center; margin-top: 20px; color: #999;">
            Track your shipment using the tracking number above.
          </p>
        </div>
      </body>
      </html>
    `;

    const fileName = `SHIP-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${
      data.shipmentNumber || "TEMP"
    }.pdf`;
    return this.generatePDF(html, fileName, "uploads/documents/shipment_slips");
  }

  /**
   * GENERATE DELIVERY INVOICE PDF
   */
  static async generateDeliveryInvoice(data) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7cb342; padding-bottom: 15px; }
          .header h1 { color: #7cb342; font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 12px; }
          .document-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #7cb342; }
          .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .column { padding: 15px; background: #f1f8e9; border-radius: 5px; border-left: 4px solid #7cb342; }
          .column h3 { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #7cb342; }
          .row { display: flex; justify-content: space-between; font-size: 11px; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          thead { background: #7cb342; color: white; }
          th { padding: 10px; text-align: left; font-size: 11px; font-weight: bold; }
          td { padding: 10px; font-size: 11px; border-bottom: 1px solid #ddd; }
          tbody tr:nth-child(even) { background: #f9f9f9; }
          .summary-box { padding: 15px; background: #f1f8e9; border-radius: 5px; margin-top: 20px; text-align: right; }
          .summary-row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; font-size: 12px; }
          .total-row { font-weight: bold; font-size: 13px; color: #7cb342; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px; }
          .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; }
          .signature-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 20px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Passion Clothing ERP</h1>
          <p>Delivery Module | Final Invoice</p>
        </div>

        <div class="document-title">✅ DELIVERY INVOICE</div>

        <div class="two-column">
          <div class="column">
            <h3>Shipment Details</h3>
            <div class="row">
              <span>Shipment Number:</span>
              <span>${data.shipmentNumber}</span>
            </div>
            <div class="row">
              <span>Tracking Number:</span>
              <span>${data.trackingNumber}</span>
            </div>
            <div class="row">
              <span>Delivery Date:</span>
              <span>${new Date(data.deliveryDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Status:</span>
              <span><strong>${data.status || "Delivered"}</strong></span>
            </div>
          </div>

          <div class="column">
            <h3>Customer Information</h3>
            <div class="row">
              <span>Customer:</span>
              <span>${data.customerName}</span>
            </div>
            <div class="row">
              <span>Email:</span>
              <span>${data.customerEmail || "N/A"}</span>
            </div>
            <div class="row">
              <span>Delivery Address:</span>
              <span>${data.deliveryAddress}</span>
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; margin: 20px 0 10px 0; color: #7cb342;">Delivered Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || [])
              .map(
                (item) => `
              <tr>
                <td>${item.product_name || "N/A"}</td>
                <td>${item.quantity || 0}</td>
                <td>✓ Delivered</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row">
            <span>Total Amount:</span>
            <span>$${(data.totalAmount || 0).toFixed(2)}</span>
          </div>
          <div class="summary-row total-row">
            <span>Final Invoice Total:</span>
            <span>$${(data.totalAmount || 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="signature-area">
          <div>
            <p style="font-size: 11px; margin-bottom: 30px;">Signed By (Recipient)</p>
            <div class="signature-line"></div>
          </div>
          <div>
            <p style="font-size: 11px; margin-bottom: 30px;">Date</p>
            <div class="signature-line"></div>
          </div>
        </div>

        <div class="footer">
          <p style="text-align: center; margin-top: 20px; color: #999;">
            This delivery invoice confirms successful delivery of items. Thank you for your business!
          </p>
          <p style="text-align: center; margin: 10px 0 0 0; color: #999;">
            Generated: ${new Date().toLocaleString()}
          </p>
        </div>
      </body>
      </html>
    `;

    const fileName = `DEL-INV-${new Date().getFullYear()}${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${
      data.shipmentNumber || "TEMP"
    }.pdf`;
    return this.generatePDF(
      html,
      fileName,
      "uploads/documents/delivery_invoices"
    );
  }
}

module.exports = PuppeteerPDFService;
