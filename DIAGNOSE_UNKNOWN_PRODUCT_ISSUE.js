/**
 * DIAGNOSTIC SCRIPT FOR "UNKNOWN PRODUCT" ISSUE
 * This script will check:
 * 1. Database structure and data
 * 2. API response from /manufacturing/orders
 * 3. Product data in specifications field
 */

const axios = require("axios");
const {
  ProductionOrder,
  Product,
  sequelize,
} = require("./server/config/database");
require("dotenv").config();

const API_BASE = "http://localhost:5000/api";
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || "your-token-here"; // Set this env var

async function diagnose() {
  console.log("🔍 DIAGNOSTIC REPORT: Unknown Product Issue\n");

  try {
    // ===== STEP 1: Check database schema =====
    console.log("📊 STEP 1: Checking database schema...\n");

    const production = await ProductionOrder.findOne({
      include: [{ model: Product, as: "product", required: false }],
      raw: true,
      limit: 1,
    });

    if (!production) {
      console.log("❌ No production orders found in database!");
      return;
    }

    console.log("✅ Found production order:");
    console.log(`   ID: ${production.id}`);
    console.log(`   Number: ${production.production_number}`);
    console.log(`   Product ID: ${production.product_id}`);
    console.log(`   Product (joined): ${production["product.name"] || "NULL"}`);
    console.log(`   Specifications: ${production.specifications}`);
    console.log("");

    // ===== STEP 2: Check specifications content =====
    console.log("📋 STEP 2: Analyzing specifications field...\n");

    let specs = {};
    try {
      specs =
        typeof production.specifications === "string"
          ? JSON.parse(production.specifications)
          : production.specifications || {};
      console.log("✅ Specifications parsed successfully:");
      console.log(JSON.stringify(specs, null, 2));
    } catch (e) {
      console.log("❌ Failed to parse specifications:", e.message);
    }
    console.log("");

    // ===== STEP 3: Check with full include =====
    console.log("📦 STEP 3: Checking with full Sequelize include...\n");

    const fullOrder = await ProductionOrder.findByPk(production.id, {
      include: [{ model: Product, as: "product", required: false }],
    });

    console.log("✅ Full order data:");
    console.log(
      `   Product name (from relationship): ${
        fullOrder.product?.name || "NULL"
      }`
    );
    console.log(
      `   Product name (from specs): ${
        specs.product_name ||
        specs.garment_specifications?.product_type ||
        "NULL"
      }`
    );
    console.log("");

    // ===== STEP 4: Check API response =====
    console.log("🌐 STEP 4: Testing API endpoint...\n");

    try {
      const apiResponse = await axios.get(
        `${API_BASE}/manufacturing/orders?limit=1`
      );

      if (apiResponse.data.productionOrders.length > 0) {
        const apiOrder = apiResponse.data.productionOrders[0];
        console.log("✅ API Response received:");
        console.log(
          `   productName field exists: ${
            apiOrder.productName ? "YES ✅" : "NO ❌"
          }`
        );
        console.log(
          `   productName value: ${apiOrder.productName || "MISSING"}`
        );
        console.log(`   product field: ${apiOrder.product?.name || "NULL"}`);
        console.log(
          `   specifications.product_name: ${
            apiOrder.specifications?.product_name || "NULL"
          }`
        );
        console.log("");

        // ===== DIAGNOSIS =====
        console.log("🎯 DIAGNOSIS:\n");

        if (!apiOrder.productName) {
          console.log("❌ ISSUE: Backend is NOT adding productName field!");
          console.log(
            "   Solution: Restart the backend server to pick up code changes"
          );
          console.log("   Command: npm start (in server directory)");
        } else if (apiOrder.productName === "Unknown Product") {
          console.log("⚠️  ISSUE: productName is 'Unknown Product'");
          console.log("   Checking data...");

          if (
            !apiOrder.product?.name &&
            !apiOrder.specifications?.product_name
          ) {
            console.log(
              "   🔴 ROOT CAUSE: Both product.name AND specifications.product_name are NULL"
            );
            console.log(
              "   Solution: Create production orders WITH product_name in specifications"
            );
          } else {
            console.log(
              "   ✅ Data IS available - Backend enrichment may need review"
            );
          }
        } else {
          console.log(
            "✅ SUCCESS: Backend is returning productName correctly!"
          );
          console.log(`   Value: "${apiOrder.productName}"`);
        }
      } else {
        console.log("❌ No orders returned from API");
      }
    } catch (error) {
      console.log(`❌ API call failed: ${error.message}`);
      console.log("   Make sure backend is running on http://localhost:5000");
    }
  } catch (error) {
    console.error("❌ Diagnostic error:", error.message);
  } finally {
    await sequelize.close();
  }
}

diagnose();
