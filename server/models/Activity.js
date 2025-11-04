const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Activity = sequelize.define(
    "Activity",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      type: {
        type: DataTypes.ENUM(
          "purchase_order_created",
          "purchase_order_updated",
          "purchase_order_sent",
          "purchase_order_approved",
          "purchase_order_received",
          "sales_order_created",
          "sales_order_confirmed",
          "invoice_created",
          "manufacturing_started",
          "manufacturing_completed",
          "shipment_created",
          "shipment_dispatched",
          "shipment_delivered",
          "material_receipt",
          "material_verification",
          "production_approval",
          "challan_created",
          "production_request_created",
          "grn_created",
          "other"
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      department: {
        type: DataTypes.ENUM(
          "sales",
          "procurement",
          "manufacturing",
          "inventory",
          "shipment",
          "finance",
          "admin"
        ),
        allowNull: false,
      },
      order_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      related_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      related_entity_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "activities",
      timestamps: false,
      indexes: [
        {
          fields: ["created_at"],
        },
        {
          fields: ["type"],
        },
        {
          fields: ["department"],
        },
        {
          fields: ["order_number"],
        },
      ],
    }
  );

  return Activity;
};
