const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

// Simple test of invoice generation
async function testInvoiceGeneration() {
  try {
    console.log("🔍 Testing Invoice Generation...\n");

    // 1. Check if sales orders exist
    console.log("1️⃣ Fetching sales orders...");
    const ordersResponse = await axios
      .get(`${API_BASE}/sales/orders`, {
        headers: {
          Authorization: "Bearer test-token",
        },
      })
      .catch((e) => {
        console.log(
          "   Error fetching orders (might need proper auth, trying anyway...)"
        );
        return null;
      });

    if (ordersResponse && ordersResponse.data && ordersResponse.data.data) {
      console.log(`   ✅ Found ${ordersResponse.data.data.length} orders`);
      console.log(
        `   First order: ${ordersResponse.data.data[0]?.order_number || "N/A"}`
      );
    }

    // 2. Try generating invoice for order 1
    console.log("\n2️⃣ Generating invoice for Order #1...");
    const invoiceResponse = await axios
      .post(
        `${API_BASE}/sales/orders/1/generate-invoice`,
        {},
        {
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        }
      )
      .catch((e) => {
        if (e.response) {
          console.log(
            `   Error: ${e.response.status} - ${
              e.response.data?.message || "Unknown error"
            }`
          );
          return e.response;
        }
        console.log(`   Error: ${e.message}`);
        return null;
      });

    if (invoiceResponse && invoiceResponse.data) {
      console.log("   ✅ Invoice generated!");
      console.log(
        `   Response:`,
        JSON.stringify(invoiceResponse.data, null, 2)
      );
    }

    // 3. Check uploads directory
    console.log("\n3️⃣ Checking uploads directory...");
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "server/uploads/documents");

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`   ✅ Found ${files.length} subdirectories`);

      // Check invoices specifically
      const invoicesDir = path.join(uploadsDir, "invoices");
      if (fs.existsSync(invoicesDir)) {
        const invoiceFiles = fs.readdirSync(invoicesDir);
        console.log(`   ✅ Found ${invoiceFiles.length} invoice PDFs:`);
        invoiceFiles.forEach((f) => {
          const filePath = path.join(invoicesDir, f);
          const stat = fs.statSync(filePath);
          console.log(`      📄 ${f} (${stat.size} bytes)`);
        });
      } else {
        console.log("   ❌ No invoices folder yet");
      }
    } else {
      console.log("   ❌ Uploads directory not found");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testInvoiceGeneration();
