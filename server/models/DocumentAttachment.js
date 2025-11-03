const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const DocumentAttachment = sequelize.define(
    "DocumentAttachment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      entity_type: {
        type: DataTypes.ENUM(
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
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "ID of the entity",
      },
      document_type: {
        type: DataTypes.ENUM(
          "invoice",
          "Sales Invoice",
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
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Original file name",
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: "Path to stored file",
      },
      file_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "MIME type of file",
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Size in bytes",
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: "Document version number",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Document description",
      },
      uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Whether document is currently active",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Additional metadata like invoice_number, page_count, etc.",
      },
    },
    {
      tableName: "document_attachments",
      indexes: [
        { fields: ["entity_type", "entity_id"] },
        { fields: ["entity_id"] },
        { fields: ["document_type"] },
        { fields: ["uploaded_by"] },
        { fields: ["created_at"] },
        { fields: ["is_active"] },
      ],
    }
  );

  return DocumentAttachment;
};
