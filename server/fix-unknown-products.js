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

    const updates = [
      { order: "PRD-20251101-0002", productName: "Cotton T-Shirt - Navy" },
      { order: "PRD-20251101-0001", productName: "Cotton T-Shirt - White" },
      { order: "PRD-20251031-0002", productName: "Polo Shirt - Navy" },
      { order: "PRD-20251031-0001", productName: "Polo Shirt - White" },
    ];

    console.log("\n🔄 ADDING PRODUCT NAMES TO UNKNOWN PRODUCT ORDERS\n");

    for (const update of updates) {
      const [rows] = await connection.query(
        "SELECT specifications FROM production_orders WHERE production_number = ?",
        [update.order]
      );

      if (rows.length > 0) {
        const specs =
          typeof rows[0].specifications === "string"
            ? JSON.parse(rows[0].specifications)
            : rows[0].specifications;

        const updatedSpecs = {
          ...specs,
          product_name: update.productName,
        };

        await connection.query(
          "UPDATE production_orders SET specifications = ? WHERE production_number = ?",
          [JSON.stringify(updatedSpecs), update.order]
        );

        console.log(`✅ ${update.order} → "${update.productName}"`);
      }
    }

    await connection.end();
    console.log("\n✅ All orders updated!\n");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
})();
