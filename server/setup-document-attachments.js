#!/usr/bin/env node

/**
 * Setup script to create document_attachments table
 * Run: node setup-document-attachments.js
 */

const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "passion_erp",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "root",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: console.log,
  }
);

async function setupTable() {
  try {
    console.log("🔄 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    console.log("\n📋 Creating document_attachments table...");

    const sql = `
      CREATE TABLE IF NOT EXISTS \`document_attachments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`entity_type\` enum('sales_order','purchase_order','invoice','challan','production_order','shipment') NOT NULL,
        \`entity_id\` int NOT NULL,
        \`document_type\` enum('invoice','Sales Invoice','proforma','quotation','specification','design','certificate','other') NOT NULL DEFAULT 'other',
        \`file_name\` varchar(255) NOT NULL,
        \`file_path\` varchar(500) NOT NULL,
        \`file_type\` varchar(50) NOT NULL,
        \`file_size\` int,
        \`version\` int DEFAULT 1,
        \`description\` text,
        \`uploaded_by\` int NOT NULL,
        \`is_active\` tinyint(1) DEFAULT 1,
        \`metadata\` json,
        \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`entity_type_id\` (\`entity_type\`, \`entity_id\`),
        KEY \`entity_id\` (\`entity_id\`),
        KEY \`document_type\` (\`document_type\`),
        KEY \`uploaded_by\` (\`uploaded_by\`),
        KEY \`created_at\` (\`created_at\`),
        KEY \`is_active\` (\`is_active\`),
        CONSTRAINT \`document_attachments_ibfk_1\` FOREIGN KEY (\`uploaded_by\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await sequelize.query(sql);
    console.log("✅ Table created successfully!");

    // Verify table
    const tableInfo = await sequelize.query("DESCRIBE document_attachments");
    console.log("\n📊 Table structure:");
    console.table(tableInfo[0]);

    console.log("\n✨ Setup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

setupTable();
