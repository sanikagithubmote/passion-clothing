const { sequelize } = require("./server/config/database");
const { ProductionOrder, Product } = require("./server/config/database");

async function diagnose() {
  try {
    console.log("🔍 Diagnosing Product Issue...\n");

    // Get all production orders
    const orders = await ProductionOrder.findAll({
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name", "product_code"],
        },
      ],
      limit: 5,
      raw: false,
    });

    console.log(`Found ${orders.length} production orders\n`);

    orders.forEach((order, idx) => {
      console.log(`Order ${idx + 1}:`);
      console.log(`  - ID: ${order.id}`);
      console.log(`  - Production Number: ${order.production_number}`);
      console.log(`  - Product ID (FK): ${order.product_id}`);
      console.log(
        `  - Product Object: ${
          order.product ? JSON.stringify(order.product, null, 2) : "NULL"
        }`
      );
      console.log(`  - Status: ${order.status}`);
      console.log("");
    });

    // Check if any production orders have NULL product_id
    const nullProductOrders = await ProductionOrder.count({
      where: { product_id: null },
    });

    console.log(`📊 Statistics:`);
    console.log(
      `  - Total production orders: ${await ProductionOrder.count()}`
    );
    console.log(`  - Orders with NULL product_id: ${nullProductOrders}`);
    console.log(`  - Total products in DB: ${await Product.count()}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

diagnose();
