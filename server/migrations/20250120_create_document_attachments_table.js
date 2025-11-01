"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("document_attachments", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      entity_type: {
        type: Sequelize.ENUM(
          "sales_order",
          "purchase_order",
          "invoice",
          "challan",
          "production_order",
          "shipment"
        ),
        allowNull: false,
        comment: "Type of entity this document is attached to",
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "ID of the entity",
      },
      document_type: {
        type: Sequelize.ENUM(
          "invoice",
          "proforma",
          "quotation",
          "specification",
          "design",
          "certificate",
          "other"
        ),
        allowNull: false,
        defaultValue: "other",
        comment: "Type of document",
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "Original file name",
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: "Path to stored file",
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "MIME type of file",
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Size in bytes",
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: "Document version number",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Document description",
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: "Whether document is currently active",
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Additional metadata like invoice_number, page_count, etc.",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Create indexes
    await queryInterface.addIndex("document_attachments", [
      "entity_type",
      "entity_id",
    ]);
    await queryInterface.addIndex("document_attachments", ["entity_id"]);
    await queryInterface.addIndex("document_attachments", ["document_type"]);
    await queryInterface.addIndex("document_attachments", ["uploaded_by"]);
    await queryInterface.addIndex("document_attachments", ["created_at"]);
    await queryInterface.addIndex("document_attachments", ["is_active"]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("document_attachments");
  },
};
