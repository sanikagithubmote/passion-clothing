"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const connection = queryInterface.sequelize;

    try {
      // Check if table exists
      const tables = await queryInterface.showAllTables();

      if (!tables.includes("document_attachments")) {
        // Create table if it doesn't exist
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
          },
          entity_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          document_type: {
            type: Sequelize.ENUM(
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
          },
          file_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          file_path: {
            type: Sequelize.STRING(500),
            allowNull: false,
          },
          file_type: {
            type: Sequelize.STRING(50),
            allowNull: false,
          },
          file_size: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          version: {
            type: Sequelize.INTEGER,
            defaultValue: 1,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
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
          },
          metadata: {
            type: Sequelize.JSON,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn("NOW"),
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.fn("NOW"),
          },
        });

        // Add indexes
        await queryInterface.addIndex("document_attachments", {
          fields: ["entity_type", "entity_id"],
        });
        await queryInterface.addIndex("document_attachments", {
          fields: ["entity_id"],
        });
        await queryInterface.addIndex("document_attachments", {
          fields: ["document_type"],
        });
        await queryInterface.addIndex("document_attachments", {
          fields: ["uploaded_by"],
        });
        await queryInterface.addIndex("document_attachments", {
          fields: ["created_at"],
        });
        await queryInterface.addIndex("document_attachments", {
          fields: ["is_active"],
        });

        console.log("✅ document_attachments table created");
      } else {
        // Table exists, just update ENUM if needed
        console.log("✅ document_attachments table already exists");
      }
    } catch (error) {
      console.error("Migration error:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tables = await queryInterface.showAllTables();
      if (tables.includes("document_attachments")) {
        await queryInterface.dropTable("document_attachments");
      }
    } catch (error) {
      console.error("Rollback error:", error);
      throw error;
    }
  },
};
