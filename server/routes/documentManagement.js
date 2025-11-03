/**
 * DOCUMENT MANAGEMENT ROUTES
 * Admin Panel: View, Download, Preview all documents linked to Sales Orders
 * Document Timeline: Complete audit trail of all generated PDFs
 */

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { authenticateToken } = require("../middleware/auth");
const db = require("../models");
const ERPAutomationService = require("../services/erpAutomationService");

/**
 * GET: All documents for a Sales Order (Document Timeline)
 * Used by Admin Panel to display complete document audit trail
 */
router.get("/timeline/:salesOrderId", authenticateToken, async (req, res) => {
  try {
    const { salesOrderId } = req.params;

    const result = await ERPAutomationService.getOrderDocumentTimeline(
      salesOrderId,
      db
    );

    res.json(result);
  } catch (error) {
    console.error("❌ [TIMELINE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET: All sales orders with documents count (Admin Dashboard)
 * Shows pending and completed document statuses
 */
router.get(
  "/admin/sales-orders-with-docs",
  authenticateToken,
  async (req, res) => {
    try {
      // Verify user is admin
      const user = await db.User.findByPk(req.user.id, {
        include: [{ model: db.Role, as: "role" }],
      });

      if (user.role?.name !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const salesOrders = await db.SalesOrder.findAll({
        attributes: [
          "id",
          "order_number",
          "customer_name",
          "status",
          "final_amount",
          "created_at",
        ],
        include: [
          {
            model: db.DocumentAttachment,
            as: "documents",
            where: { is_active: true },
            required: false,
            attributes: ["id", "document_type", "file_name", "created_at"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 100,
      });

      const summary = {
        totalOrders: salesOrders.length,
        ordersWithAllDocuments: salesOrders.filter(
          (so) => so.documents?.length >= 5
        ).length,
        ordersWithPartialDocuments: salesOrders.filter(
          (so) => so.documents?.length > 0 && so.documents?.length < 5
        ).length,
        ordersWithoutDocuments: salesOrders.filter(
          (so) => !so.documents || so.documents.length === 0
        ).length,
        totalDocuments: salesOrders.reduce(
          (sum, so) => sum + (so.documents?.length || 0),
          0
        ),
      };

      res.json({
        success: true,
        summary,
        salesOrders: salesOrders.map((so) => ({
          id: so.id,
          orderNumber: so.order_number,
          customerName: so.customer_name,
          status: so.status,
          finalAmount: so.final_amount,
          createdAt: so.created_at,
          documentCount: so.documents?.length || 0,
          documentTypes: so.documents?.map((d) => d.document_type) || [],
          lastDocumentDate:
            so.documents?.[so.documents.length - 1]?.created_at || null,
          completionPercentage: Math.round(
            ((so.documents?.length || 0) / 6) * 100
          ),
        })),
      });
    } catch (error) {
      console.error("❌ [ADMIN DASHBOARD] Error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET: Download document PDF
 * Secure download with access verification
 */
router.get("/download/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await db.DocumentAttachment.findByPk(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Set download headers
    res.setHeader("Content-Type", document.file_type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.file_name}"`
    );

    // Stream file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

    // Log download
    console.log(
      `📥 [DOWNLOAD] User ${req.user.id} downloaded: ${document.file_name}`
    );
  } catch (error) {
    console.error("❌ [DOWNLOAD] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET: Preview document PDF (inline display)
 * Display PDF in browser instead of downloading
 */
router.get("/preview/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await db.DocumentAttachment.findByPk(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Verify file exists
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Set preview headers
    res.setHeader("Content-Type", document.file_type);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.file_name}"`
    );

    // Stream file
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);

    console.log(
      `👁️ [PREVIEW] User ${req.user.id} previewed: ${document.file_name}`
    );
  } catch (error) {
    console.error("❌ [PREVIEW] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET: Document statistics (for admin dashboard charts)
 */
router.get("/admin/statistics", authenticateToken, async (req, res) => {
  try {
    // Verify admin
    const user = await db.User.findByPk(req.user.id, {
      include: [{ model: db.Role, as: "role" }],
    });

    if (user.role?.name !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Get document stats
    const stats = await db.DocumentAttachment.findAll({
      attributes: [
        "document_type",
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: { is_active: true },
      group: ["document_type"],
      raw: true,
    });

    const documentsByType = stats.reduce((acc, stat) => {
      acc[stat.document_type] = parseInt(stat.count);
      return acc;
    }, {});

    // Total documents generated
    const totalDocs = await db.DocumentAttachment.count({
      where: { is_active: true },
    });

    // Documents by date (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const docsByDate = await db.DocumentAttachment.findAll({
      attributes: [
        [db.sequelize.fn("DATE", db.sequelize.col("created_at")), "date"],
        [db.sequelize.fn("COUNT", db.sequelize.col("id")), "count"],
      ],
      where: {
        created_at: { [db.Sequelize.Op.gte]: sevenDaysAgo },
        is_active: true,
      },
      group: [db.sequelize.fn("DATE", db.sequelize.col("created_at"))],
      order: [[db.sequelize.fn("DATE", db.sequelize.col("created_at")), "ASC"]],
      raw: true,
    });

    res.json({
      success: true,
      totalDocuments: totalDocs,
      documentsByType,
      documentsByDate,
      generatedToday: await db.DocumentAttachment.count({
        where: {
          created_at: {
            [db.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          is_active: true,
        },
      }),
    });
  } catch (error) {
    console.error("❌ [STATISTICS] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET: All documents (global search with filters)
 */
router.get("/search", authenticateToken, async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = { is_active: true };

    if (type) {
      where.document_type = type;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate)
        where.created_at[db.Sequelize.Op.gte] = new Date(startDate);
      if (endDate) where.created_at[db.Sequelize.Op.lte] = new Date(endDate);
    }

    const documents = await db.DocumentAttachment.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
      include: [
        { model: db.User, as: "uploader", attributes: ["name", "email"] },
      ],
    });

    res.json({
      success: true,
      total: documents.count,
      documents: documents.rows.map((doc) => ({
        id: doc.id,
        fileName: doc.file_name,
        documentType: doc.document_type,
        entityType: doc.entity_type,
        uploadedBy: doc.uploader?.name,
        uploadedAt: doc.created_at,
        downloadUrl: `/api/documents/download/${doc.id}`,
        fileSize: ERPAutomationService.formatFileSize(doc.file_size),
      })),
    });
  } catch (error) {
    console.error("❌ [SEARCH] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE: Soft delete document (mark as inactive)
 */
router.delete("/:documentId", authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    // Verify admin
    const user = await db.User.findByPk(req.user.id, {
      include: [{ model: db.Role, as: "role" }],
    });

    if (user.role?.name !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const document = await db.DocumentAttachment.findByPk(documentId);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Soft delete
    await document.update({ is_active: false });

    console.log(`🗑️ [DELETE] Admin deleted document: ${document.file_name}`);

    res.json({
      success: true,
      message: "Document deleted",
      documentId,
    });
  } catch (error) {
    console.error("❌ [DELETE] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST: Manual document attachment
 * Upload PDFs manually to sales order
 */
router.post("/attach", authenticateToken, async (req, res) => {
  try {
    const { salesOrderId, documentType, filePath, fileName } = req.body;

    if (!salesOrderId || !documentType || !filePath) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: "File not found" });
    }

    const fileSize = fs.statSync(filePath).size;

    const doc = await db.DocumentAttachment.create({
      entity_type: "sales_order",
      entity_id: salesOrderId,
      document_type: documentType,
      file_name: fileName || path.basename(filePath),
      file_path: filePath,
      file_type: "application/pdf",
      file_size: fileSize,
      uploaded_by: req.user.id,
    });

    console.log(`📎 [ATTACH] Document attached to Sales Order ${salesOrderId}`);

    res.json({
      success: true,
      document: doc,
    });
  } catch (error) {
    console.error("❌ [ATTACH] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
