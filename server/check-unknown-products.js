require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const orders = [
      "PRD-20251101-0002",
      "PRD-20251101-0001",
      "PRD-20251031-0002",
      "PRD-20251031-0001",
    ];

    console.log("\n📊 CHECKING PRODUCT DATA FOR UNKNOWN PRODUCTS\n");

    for (const order of orders) {
      const [rows] = await connection.query(
        "SELECT id, production_number, product_id, specifications FROM production_orders WHERE production_number = ?",
        [order]
      );

      if (rows.length > 0) {
        const row = rows[0];
        const specs =
          typeof row.specifications === "string"
            ? JSON.parse(row.specifications)
            : row.specifications;
        console.log(`\n=== ${order} ===`);
        console.log("  Product ID:", row.product_id || "NULL");
        console.log(
          "  Product Name (specs):",
          specs?.product_name || "MISSING"
        );
        console.log("  Full Specs:", JSON.stringify(specs, null, 2));
      } else {
        console.log(`\n❌ Order not found: ${order}`);
      }
    }

    await connection.end();
    console.log("\n✅ Done\n");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
