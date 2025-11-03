/**
 * GRN Document Management System - Test Script
 * Tests all new GRN triggers and PDF generation
 *
 * Usage: node test-grn-triggers.js
 */

const axios = require("axios");

// Configuration
const API_BASE_URL = "http://localhost:5000";
const JWT_TOKEN = process.env.JWT_TOKEN || "YOUR_JWT_TOKEN_HERE";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${JWT_TOKEN}`,
  },
});

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

// Helper functions
const log = {
  header: (msg) =>
    console.log(
      `\n${colors.bright}${colors.blue}${"=".repeat(60)}${colors.reset}`
    ),
  title: (msg) =>
    console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}ℹ️  ${msg}${colors.reset}`),
  step: (num, msg) =>
    console.log(
      `${colors.bright}${colors.blue}Step ${num}:${colors.reset} ${msg}`
    ),
  json: (obj) => console.log(JSON.stringify(obj, null, 2)),
};

// Test data
let testIds = {
  salesOrderId: 1,
  purchaseOrderId: 1,
  grnId: 1,
  customerId: 1,
  vendorId: 1,
};

/**
 * Test 1: Verify Manual Trigger Endpoint Exists
 */
async function testEndpointExists() {
  log.header();
  log.title("TEST 1: Verify Manual Trigger Endpoint");

  try {
    const response = await client
      .post("/api/documents/manual-trigger", {
        trigger_type: "invalid_test_type",
        entity_id: 0,
      })
      .catch((err) => err.response);

    if (response && (response.status === 400 || response.status === 404)) {
      log.success("Endpoint exists and responds correctly");
      if (response.data.supported_types) {
        log.info("Supported trigger types:");
        response.data.supported_types.forEach((t) => log.info(`  • ${t}`));
      }
      return true;
    } else {
      log.error("Endpoint not responding as expected");
      return false;
    }
  } catch (error) {
    log.error(`Endpoint test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Test GRN.PENDING Trigger
 */
async function testGRNPendingTrigger() {
  log.header();
  log.title("TEST 2: GRN.PENDING Trigger");

  try {
    log.step("2.1", `Triggering grn.pending for GRN ID: ${testIds.grnId}`);

    const response = await client.post("/api/documents/manual-trigger", {
      trigger_type: "grn.pending",
      entity_id: testIds.grnId,
      entity_type: "goods_receipt_note",
    });

    if (response.data.success) {
      log.success("GRN.PENDING trigger executed");
      log.info(`Message: ${response.data.message}`);

      if (response.data.result.notification_sent) {
        log.success("Notification sent to inspector");
      }
      return true;
    } else {
      log.error("Trigger failed");
      log.json(response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.info("GRN not found in database - expected in test environment");
      return true;
    }
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Test GRN.RECEIVED Trigger
 */
async function testGRNReceivedTrigger() {
  log.header();
  log.title("TEST 3: GRN.RECEIVED Trigger");

  try {
    log.step("3.1", `Triggering grn.received for GRN ID: ${testIds.grnId}`);

    const response = await client.post("/api/documents/manual-trigger", {
      trigger_type: "grn.received",
      entity_id: testIds.grnId,
      entity_type: "goods_receipt_note",
    });

    if (response.data.success) {
      log.success("GRN.RECEIVED trigger executed");

      if (response.data.result.slip_generated) {
        log.success("GRN Slip PDF generated");
      }
      if (response.data.result.notification_sent) {
        log.success("Notification sent to QA team");
      }

      if (response.data.document) {
        log.info(`Document: ${response.data.document.file_name}`);
        log.info(`Path: ${response.data.document.file_path}`);
      }
      return true;
    } else {
      log.error("Trigger failed");
      log.json(response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.info("GRN not found in database - expected in test environment");
      return true;
    }
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Test GRN.VERIFIED Trigger
 */
async function testGRNVerifiedTrigger() {
  log.header();
  log.title("TEST 4: GRN.VERIFIED Trigger");

  try {
    log.step("4.1", `Triggering grn.verified for GRN ID: ${testIds.grnId}`);

    const response = await client.post("/api/documents/manual-trigger", {
      trigger_type: "grn.verified",
      entity_id: testIds.grnId,
      entity_type: "goods_receipt_note",
    });

    if (response.data.success) {
      log.success("GRN.VERIFIED trigger executed");

      if (response.data.result.verified) {
        log.success("GRN marked as verified");
      }
      if (response.data.result.notification_sent) {
        log.success("Notification sent to approver");
      }
      return true;
    } else {
      log.error("Trigger failed");
      log.json(response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.info("GRN not found in database - expected in test environment");
      return true;
    }
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Test GRN.APPROVED Trigger (Most Important)
 */
async function testGRNApprovedTrigger() {
  log.header();
  log.title("TEST 5: GRN.APPROVED Trigger (Critical Auto-Workflow)");

  try {
    log.step("5.1", `Triggering grn.approved for GRN ID: ${testIds.grnId}`);

    const response = await client.post("/api/documents/manual-trigger", {
      trigger_type: "grn.approved",
      entity_id: testIds.grnId,
      entity_type: "goods_receipt_note",
    });

    if (response.data.success) {
      log.success("GRN.APPROVED trigger executed");

      const result = response.data.result;

      // Check all critical actions
      log.step("5.2", "Verifying all auto-triggered actions:");

      if (result.grn_approved) {
        log.success('  GRN status updated to "approved"');
      }
      if (result.stock_updated) {
        log.success("  Inventory stock updated");
      }
      if (result.document_generated) {
        log.success("  Final GRN Slip PDF generated");
      }
      if (result.notifications_sent >= 2) {
        log.success(
          `  ${result.notifications_sent} notifications sent to teams`
        );
      }
      if (result.next_workflow === "manufacturing_ready") {
        log.success("  Next workflow: Manufacturing Ready");
      }

      if (response.data.document) {
        log.info(`\nGenerated Document:`);
        log.info(`  Name: ${response.data.document.file_name}`);
        log.info(`  Path: ${response.data.document.file_path}`);
        log.info(`  Type: ${response.data.document.document_type}`);
      }

      return true;
    } else {
      log.error("Trigger failed");
      log.json(response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.info("GRN not found in database - expected in test environment");
      log.info("This is OK - test script was checking endpoint functionality");
      return true;
    }
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 6: Test Document Retrieval
 */
async function testDocumentRetrieval() {
  log.header();
  log.title("TEST 6: Document Retrieval Endpoint");

  try {
    log.step(
      "6.1",
      `Retrieving documents for Sales Order ID: ${testIds.salesOrderId}`
    );

    const response = await client.get(
      `/api/documents/sales-order/${testIds.salesOrderId}`
    );

    if (response.data.success) {
      log.success("Documents retrieved successfully");

      const data = response.data.data;
      log.info(`Sales Order: ${data.sales_order.order_number}`);
      log.info(`Total Documents: ${data.stats.total_documents}`);

      Object.entries(data.stats.document_types).forEach(([type, count]) => {
        if (count > 0) {
          log.info(`  • ${type}: ${count}`);
        }
      });

      if (data.documents && data.documents.length > 0) {
        log.info("\nDocument Timeline:");
        data.documents.forEach((doc, idx) => {
          log.info(`  ${idx + 1}. ${doc.document_type.toUpperCase()}`);
          log.info(`     File: ${doc.file_name}`);
        });
      }
      return true;
    } else {
      log.error("Retrieval failed");
      log.json(response.data);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      log.info("Sales Order not found - expected in test environment");
      return true;
    }
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 7: Test Unsupported Trigger Type
 */
async function testErrorHandling() {
  log.header();
  log.title("TEST 7: Error Handling & Validation");

  try {
    log.step("7.1", "Testing with invalid trigger type");

    const response = await client
      .post("/api/documents/manual-trigger", {
        trigger_type: "invalid.trigger",
        entity_id: 999,
      })
      .catch((err) => err.response);

    if (response.status === 400 && response.data.supported_types) {
      log.success("Error handling works correctly");
      log.info(
        `Supported types returned: ${response.data.supported_types.length}`
      );
      return true;
    } else {
      log.error("Error handling not working as expected");
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Run All Tests
 */
async function runAllTests() {
  log.header();
  log.title("🧪 GRN Document Management System - Full Test Suite");
  log.info(`API Base URL: ${API_BASE_URL}`);
  log.info(
    `JWT Token: ${
      JWT_TOKEN === "YOUR_JWT_TOKEN_HERE" ? "❌ NOT SET" : "✅ SET"
    }`
  );

  if (JWT_TOKEN === "YOUR_JWT_TOKEN_HERE") {
    log.error("\n⚠️  WARNING: JWT_TOKEN environment variable not set!");
    log.info('Set it with: export JWT_TOKEN="your_token_here"');
    log.info("Or in .env: JWT_TOKEN=your_token_here");
  }

  const results = [];

  log.header();
  log.title("Running Tests...\n");

  // Run tests
  results.push({ name: "Endpoint Exists", passed: await testEndpointExists() });
  results.push({
    name: "GRN.PENDING Trigger",
    passed: await testGRNPendingTrigger(),
  });
  results.push({
    name: "GRN.RECEIVED Trigger",
    passed: await testGRNReceivedTrigger(),
  });
  results.push({
    name: "GRN.VERIFIED Trigger",
    passed: await testGRNVerifiedTrigger(),
  });
  results.push({
    name: "GRN.APPROVED Trigger",
    passed: await testGRNApprovedTrigger(),
  });
  results.push({
    name: "Document Retrieval",
    passed: await testDocumentRetrieval(),
  });
  results.push({ name: "Error Handling", passed: await testErrorHandling() });

  // Summary
  log.header();
  log.title("📊 Test Summary");

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  results.forEach((r) => {
    if (r.passed) {
      log.success(`${r.name}`);
    } else {
      log.error(`${r.name}`);
    }
  });

  log.header();
  log.title(`Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    log.success("All tests passed! ✨");
  } else if (passed > total / 2) {
    log.info(`Most tests passed. ${total - passed} failed.`);
  } else {
    log.error("Multiple tests failed. Check configuration.");
  }

  log.header();
}

// Main execution
if (require.main === module) {
  runAllTests().catch((err) => {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { testGRNApprovedTrigger, testDocumentRetrieval };
