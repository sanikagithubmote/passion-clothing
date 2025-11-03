const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { sequelize } = require("./config/database");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const rolesRoutes = require("./routes/roles");
const challanRoutes = require("./routes/challans");
const salesRoutes = require("./routes/sales");
const procurementRoutes = require("./routes/procurement");
const inventoryRoutes = require("./routes/inventory");
const inventoryEnhancedRoutes = require("./routes/inventoryEnhanced");
const manufacturingRoutes = require("./routes/manufacturing");
const outsourcingRoutes = require("./routes/outsourcing");
const shipmentRoutes = require("./routes/shipments");
const courierPartnerRoutes = require("./routes/courierPartners");
const storeRoutes = require("./routes/store");
const financeRoutes = require("./routes/finance");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const sampleRoutes = require("./routes/samples");
const productRoutes = require("./routes/products");
const productLifecycleRoutes = require("./routes/productLifecycle");
const bomRoutes = require("./routes/bom");
const grnRoutes = require("./routes/grn");
const notificationRoutes = require("./routes/notifications");
const vendorReturnsRoutes = require("./routes/vendorReturns");
const projectMaterialRequestRoutes = require("./routes/projectMaterialRequest");
const productionRequestRoutes = require("./routes/productionRequest");
const materialDispatchRoutes = require("./routes/materialDispatch");
const materialReceiptRoutes = require("./routes/materialReceipt");
const materialVerificationRoutes = require("./routes/materialVerification");
const productionApprovalRoutes = require("./routes/productionApproval");
const ordersRoutes = require("./routes/orders");
const courierAgentRoutes = require("./routes/courierAgent");
const invoicesRoutes = require("./routes/invoices");
const documentsRoutes = require("./routes/documents");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (more generous for development)
  message: "Too many requests from this IP, please try again later.",
  skip: (req) => {
    // Skip rate limiting for health check and auth endpoints during development
    return (
      process.env.NODE_ENV === "development" &&
      (req.path === "/api/health" || req.path.startsWith("/api/auth"))
    );
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(limiter);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/challans", challanRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/procurement", procurementRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/inventory-enhanced", inventoryEnhancedRoutes);
console.log("manufacturingRoutes type:", typeof manufacturingRoutes);
console.log("outsourcingRoutes type:", typeof outsourcingRoutes);
console.log("shipmentRoutes type:", typeof shipmentRoutes);
console.log("courierPartnerRoutes type:", typeof courierPartnerRoutes);

app.use("/api/manufacturing", manufacturingRoutes); /*  */
app.use("/api/outsourcing", outsourcingRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/courier-partners", courierPartnerRoutes);
app.use("/api/courier-agents", courierAgentRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/samples", sampleRoutes);
app.use("/api/products", productRoutes);
app.use("/api/product-lifecycle", productLifecycleRoutes);
app.use("/api/bom", bomRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/vendor-returns", vendorReturnsRoutes);
app.use("/api/project-material-requests", projectMaterialRequestRoutes);
app.use("/api/production-requests", productionRequestRoutes);
app.use("/api/material-dispatch", materialDispatchRoutes);
app.use("/api/material-receipt", materialReceiptRoutes);
app.use("/api/material-verification", materialVerificationRoutes);
app.use("/api/production-approval", productionApprovalRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/documents", documentsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Skip auto-sync in development to avoid deadlocks
    // Use migrations for schema changes instead
    if (process.env.FORCE_SYNC === "true") {
      console.log(
        "Warning: Force syncing database (this may cause data loss)..."
      );
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
      await sequelize.sync({ force: true });
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("Database models synchronized with force.");
    } else {
      console.log("Skipping auto-sync. Database tables assumed to exist.");
      console.log(
        "Set FORCE_SYNC=true in .env to force sync (drops all tables)."
      );
    }

    app.listen(PORT, () => {
      console.log(`🚀 Pashion ERP Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

// Global error handlers to prevent server crashes
process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
  console.error("Stack:", error.stack);
  // Don't exit - log and continue (production should use proper logging service)
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ UNHANDLED REJECTION at:", promise);
  console.error("Reason:", reason);
  // Don't exit - log and continue (production should use proper logging service)
});

startServer();

module.exports = app;
