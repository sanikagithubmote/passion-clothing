const { sequelize } = require("./config/database");

async function runMigration() {
  try {
    console.log("Starting Document Attachment table migration...");

    // Create the table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS document_attachments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entity_type ENUM('sales_order', 'purchase_order', 'invoice', 'challan', 'production_order', 'shipment') NOT NULL COMMENT 'Type of entity this document is attached to',
        entity_id INT NOT NULL COMMENT 'ID of the entity',
        document_type ENUM('invoice', 'proforma', 'quotation', 'specification', 'design', 'certificate', 'other') NOT NULL DEFAULT 'other' COMMENT 'Type of document',
        file_name VARCHAR(255) NOT NULL COMMENT 'Original file name',
        file_path VARCHAR(500) NOT NULL COMMENT 'Path to stored file',
        file_type VARCHAR(50) NOT NULL COMMENT 'MIME type of file',
        file_size INT COMMENT 'Size in bytes',
        version INT DEFAULT 1 COMMENT 'Document version number',
        description TEXT COMMENT 'Document description',
        uploaded_by INT NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether document is currently active',
        metadata JSON COMMENT 'Additional metadata like invoice_number, page_count, etc.',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_entity (entity_type, entity_id),
        INDEX idx_entity_id (entity_id),
        INDEX idx_document_type (document_type),
        INDEX idx_uploaded_by (uploaded_by),
        INDEX idx_created_at (created_at),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Document Attachment table created successfully!");

    // Verify table exists
    const result = await sequelize.query(`
      SHOW TABLES LIKE 'document_attachments';
    `);

    if (result[0].length > 0) {
      console.log("✅ Table verification successful!");
      console.log("\nDocument Attachment system is ready to use.");
      console.log("\nAPI Endpoints:");
      console.log(
        "- POST   /api/invoices/generate-from-sales-order/:salesOrderId"
      );
      console.log(
        "- POST   /api/invoices/generate-from-purchase-order/:purchaseOrderId"
      );
      console.log("- GET    /api/invoices/:invoiceId");
      console.log("- GET    /api/invoices/:invoiceId/download");
      console.log("- POST   /api/invoices/attach/:entityType/:entityId");
      console.log("- GET    /api/invoices/document/:documentId/download");
      console.log("- DELETE /api/invoices/document/:documentId");
      console.log("- POST   /api/invoices/:invoiceId/send-to-procurement");
      console.log("- GET    /api/invoices/:entityType/:entityId/documents");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

runMigration();
