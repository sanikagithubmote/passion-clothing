const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "passion_erp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkOrder() {
  try {
    const connection = await pool.getConnection();

    // Check the specific order
    const [rows] = await connection.execute(
      `SELECT 
        id, 
        production_number, 
        product_id, 
        specifications,
        created_at
      FROM production_orders
      WHERE production_number = 'PRD-20251101-0002'
      LIMIT 1`
    );

    console.log("\n========================================");
    console.log("📋 PRODUCTION ORDER DATA");
    console.log("========================================\n");

    if (rows.length === 0) {
      console.log("❌ Order NOT found in database!");
      console.log("Production number: PRD-20251101-0002\n");
    } else {
      const order = rows[0];
      console.log("Order ID:", order.id);
      console.log("Production Number:", order.production_number);
      console.log("Product ID:", order.product_id);

      let specs = {};
      try {
        specs =
          typeof order.specifications === "string"
            ? JSON.parse(order.specifications)
            : order.specifications || {};
      } catch (e) {
        specs = {};
      }

      console.log("\nSpecifications JSON:");
      console.log(JSON.stringify(specs, null, 2));

      console.log("\n========================================");
      console.log("🔍 ANALYSIS");
      console.log("========================================\n");

      if (order.product_id) {
        console.log("✅ Product ID: EXISTS (" + order.product_id + ")");
        console.log(
          "   → Backend should fetch product name from Products table"
        );

        // Check if product exists
        const [products] = await connection.execute(
          "SELECT id, name FROM products WHERE id = ?",
          [order.product_id]
        );

        if (products.length > 0) {
          console.log("   → Product NAME: " + products[0].name);
        } else {
          console.log(
            "   ❌ ERROR: Product ID exists but product record NOT FOUND!"
          );
        }
      } else {
        console.log("❌ Product ID: NULL");
      }

      if (specs.product_name) {
        console.log("✅ Specifications product_name: " + specs.product_name);
      } else {
        console.log("❌ Specifications product_name: MISSING");
      }

      console.log("\n========================================");
      console.log("🎯 EXPECTED RESULT");
      console.log("========================================\n");

      if (order.product_id || specs.product_name) {
        console.log(
          '✅ SHOULD DISPLAY: A product name (not "Unknown Product")'
        );
        console.log("   Reason: Data exists in database\n");
        console.log('   → If still showing "Unknown Product":\n');
        console.log("      1. Backend NOT restarted (still running old code)");
        console.log("      2. Browser cache showing old response");
        console.log("      3. API endpoint not being called");
      } else {
        console.log('❌ WILL DISPLAY: "Unknown Product"');
        console.log("   Reason: No product data in database\n");
        console.log("   → Solutions:");
        console.log("      1. Add product_id to order");
        console.log("      2. Add product_name to specifications");
        console.log("      3. Create new order with product info");
      }
    }

    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  }
}

checkOrder();
