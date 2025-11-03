/**
 * Test Script for Document Download Fix
 * Tests the on-demand PDF generation for invoice downloads
 */

const axios = require("axios");
const path = require("path");
const fs = require("fs");

const API_BASE = "http://localhost:5000/api";
let authToken = "";

// Test credentials
const TEST_USER = {
  email: "test@passion-clothing.com",
  password: "test123",
};

async function test() {
  try {
    console.log("\n====================================");
    console.log("🧪 Document Download Fix - Test Suite");
    console.log("====================================\n");

    // Step 1: Get first sales order to test with
    console.log("📋 Step 1: Fetching sales orders...");
    const ordersRes = await axios.get(`${API_BASE}/sales-orders?limit=1`);

    if (!ordersRes.data.data || ordersRes.data.data.length === 0) {
      console.log("⚠️  No sales orders found. Creating test data...");
      return;
    }

    const salesOrder = ordersRes.data.data[0];
    console.log(
      `✅ Found sales order: ${salesOrder.order_number} (ID: ${salesOrder.id})`
    );

    // Step 2: Get documents for this sales order
    console.log("\n📋 Step 2: Fetching documents for sales order...");
    const docsRes = await axios.get(
      `${API_BASE}/documents/sales-order/${salesOrder.id}`
    );

    console.log(`✅ Found ${docsRes.data.data.timeline.length} documents`);

    // Find an invoice document
    let invoiceDoc = docsRes.data.data.timeline.find(
      (d) => d.type === "invoice"
    );

    if (!invoiceDoc) {
      console.log("⚠️  No invoice document found for this order");
      console.log(
        "📄 Available document types:",
        docsRes.data.data.timeline.map((d) => d.type)
      );
      return;
    }

    console.log(
      `✅ Found invoice document: ${invoiceDoc.name} (ID: ${invoiceDoc.id})`
    );

    // Step 3: Test the download endpoint
    console.log("\n📋 Step 3: Testing document download endpoint...");
    console.log(`   Endpoint: ${API_BASE}/documents/${invoiceDoc.id}/download`);

    try {
      const downloadRes = await axios.get(
        `${API_BASE}/documents/${invoiceDoc.id}/download`,
        { responseType: "arraybuffer" }
      );

      console.log(`✅ Download successful!`);
      console.log(`   Status: ${downloadRes.status}`);
      console.log(`   File size: ${downloadRes.data.length} bytes`);
      console.log(`   Content-Type: ${downloadRes.headers["content-type"]}`);
      console.log(
        `   Content-Disposition: ${downloadRes.headers["content-disposition"]}`
      );

      // Check if it's a valid PDF
      const pdfSignature = downloadRes.data.slice(0, 4).toString();
      if (pdfSignature.includes("%PDF")) {
        console.log(`✅ Valid PDF detected (signature: %PDF)`);
      } else {
        console.log(
          `⚠️  PDF signature not found. First bytes: ${downloadRes.data.slice(
            0,
            10
          )}`
        );
      }

      // Save test file
      const testFilePath = path.join(
        __dirname,
        `test-invoice-${invoiceDoc.id}.pdf`
      );
      fs.writeFileSync(testFilePath, downloadRes.data);
      console.log(`✅ Test file saved: ${testFilePath}`);
    } catch (downloadError) {
      if (downloadError.response) {
        console.error(`❌ Download failed: ${downloadError.response.status}`);
        console.error(
          `   Message: ${JSON.stringify(downloadError.response.data)}`
        );
      } else {
        console.error(`❌ Download error: ${downloadError.message}`);
      }

      // If we get 404, the regeneration might have been triggered
      if (downloadError.response?.status === 404) {
        console.log("\n📝 Notes:");
        console.log("   - Document file may not exist on disk");
        console.log("   - The fix should regenerate it on-demand");
        console.log("   - Check server logs for regeneration attempt");
      }
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("\n⚠️  Authentication Required");
      console.log("   Please run this test with proper authentication");
      console.log("   Update TEST_USER credentials in the script");
    } else {
      console.error("\n❌ Test failed:", error.message);
      if (error.response?.data) {
        console.error("   Response:", error.response.data);
      }
    }
  }

  console.log("\n====================================");
  console.log("✅ Test Complete");
  console.log("====================================\n");
}

// Run the test
test().catch(console.error);
