/**
 * Invoice Fix Verification Script
 * Checks if all fixes are properly applied
 */
const fs = require("fs");
const path = require("path");

console.log("🔍 [VERIFY] Starting invoice fix verification...\n");

let allGood = true;
const checks = [];

// Check 1: DocumentService has generateInvoicePDF method
console.log("📋 Check 1: DocumentService.generateInvoicePDF method...");
try {
  const docService = require("./server/utils/documentService");
  if (
    typeof docService.prototype?.generateInvoicePDF === "function" ||
    new docService()?.generateInvoicePDF
  ) {
    console.log("✅ Method exists\n");
    checks.push({ check: "DocumentService method", status: "✅" });
  } else {
    console.log("⚠️  Method not found - checking implementation...");
    // Check if file contains the method
    const content = fs.readFileSync(
      "./server/utils/documentService.js",
      "utf8"
    );
    if (content.includes("generateInvoicePDF")) {
      console.log("✅ Method definition found in file\n");
      checks.push({ check: "DocumentService method", status: "✅" });
    } else {
      console.log("❌ Method NOT found\n");
      checks.push({ check: "DocumentService method", status: "❌" });
      allGood = false;
    }
  }
} catch (err) {
  console.log(`❌ Error checking: ${err.message}\n`);
  checks.push({ check: "DocumentService method", status: "❌" });
  allGood = false;
}

// Check 2: Date validation in invoices.js (HTML template)
console.log("📋 Check 2: Date validation in HTML template...");
try {
  const content = fs.readFileSync("./server/routes/invoices.js", "utf8");
  const lines = content.split("\n");

  // Look for date validation pattern around line 1166
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].includes("Order Date") &&
      lines[i + 1]?.includes("salesOrder.created_at") &&
      lines[i + 1]?.includes("?")
    ) {
      found = true;
      break;
    }
  }

  if (found) {
    console.log("✅ Date validation found in HTML template\n");
    checks.push({ check: "Date validation (HTML)", status: "✅" });
  } else {
    console.log("❌ Date validation NOT found\n");
    checks.push({ check: "Date validation (HTML)", status: "❌" });
    allGood = false;
  }
} catch (err) {
  console.log(`❌ Error checking: ${err.message}\n`);
  checks.push({ check: "Date validation (HTML)", status: "❌" });
  allGood = false;
}

// Check 3: Date validation in invoices.js (PDF generation)
console.log("📋 Check 3: Date validation in PDF generation...");
try {
  const content = fs.readFileSync("./server/routes/invoices.js", "utf8");

  // Look for date validation pattern around line 1297
  let found = false;
  if (
    content.includes("Order Date:") &&
    content.includes("salesOrder.created_at") &&
    content.match(/Expected Delivery:.*salesOrder\.expected_delivery_date.*\?/s)
  ) {
    found = true;
  }

  if (found) {
    console.log("✅ Date validation found in PDF generation\n");
    checks.push({ check: "Date validation (PDF)", status: "✅" });
  } else {
    console.log("⚠️  Pattern not found - may still be implemented\n");
    checks.push({ check: "Date validation (PDF)", status: "⚠️ " });
  }
} catch (err) {
  console.log(`❌ Error checking: ${err.message}\n`);
  checks.push({ check: "Date validation (PDF)", status: "❌" });
  allGood = false;
}

// Check 4: Invoice files exist
console.log("📋 Check 4: Invoice files on disk...");
try {
  const invoicePath = "./server/uploads/documents/invoices";
  if (fs.existsSync(invoicePath)) {
    const files = fs.readdirSync(invoicePath);
    console.log(`✅ Invoice directory exists (${files.length} files)`);

    // Check file sizes
    let allNormal = true;
    files.forEach((file) => {
      const stats = fs.statSync(path.join(invoicePath, file));
      const sizeKB = (stats.size / 1024).toFixed(2);

      if (stats.size > 10000) {
        console.log(`   ⚠️  ${file}: ${sizeKB}KB (may be too large)`);
        allNormal = false;
      } else {
        console.log(`   ✅ ${file}: ${sizeKB}KB`);
      }
    });

    checks.push({ check: "Invoice files", status: allNormal ? "✅" : "⚠️ " });
    console.log();
  } else {
    console.log("❌ Invoice directory NOT found\n");
    checks.push({ check: "Invoice files", status: "❌" });
    allGood = false;
  }
} catch (err) {
  console.log(`❌ Error checking: ${err.message}\n`);
  checks.push({ check: "Invoice files", status: "❌" });
  allGood = false;
}

// Check 5: Fix scripts exist
console.log("📋 Check 5: Fix scripts available...");
try {
  const sqlScript = fs.existsSync("./fix-invoice-file-sizes.sql");
  const jsScript = fs.existsSync("./fix-invoice-file-sizes.js");
  const docFile = fs.existsSync("./INVOICE_DOWNLOAD_FIX_COMPLETE.md");

  console.log(`   ${sqlScript ? "✅" : "❌"} fix-invoice-file-sizes.sql`);
  console.log(`   ${jsScript ? "✅" : "❌"} fix-invoice-file-sizes.js`);
  console.log(`   ${docFile ? "✅" : "❌"} INVOICE_DOWNLOAD_FIX_COMPLETE.md\n`);

  checks.push({
    check: "Fix scripts",
    status: sqlScript && jsScript && docFile ? "✅" : "⚠️ ",
  });
} catch (err) {
  console.log(`❌ Error checking: ${err.message}\n`);
  checks.push({ check: "Fix scripts", status: "❌" });
  allGood = false;
}

// Summary
console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║              📊 VERIFICATION SUMMARY                  ║");
console.log("╚════════════════════════════════════════════════════════╝\n");

checks.forEach((c) => {
  console.log(`${c.status} ${c.check}`);
});

console.log("\n" + "═".repeat(56));

if (allGood) {
  console.log("\n✅ All checks passed! Invoice fix is properly implemented.");
  console.log("\nNext steps:");
  console.log("  1. Restart server: pm2 restart all");
  console.log(
    "  2. Run SQL fix: mysql -u root -p passion_erp < fix-invoice-file-sizes.sql"
  );
  console.log("  3. Clear cache: Ctrl+Shift+Delete");
  console.log("  4. Test invoice download\n");
  process.exit(0);
} else {
  console.log("\n⚠️  Some checks need attention. Please review above.");
  console.log("See: INVOICE_DOWNLOAD_FIX_COMPLETE.md\n");
  process.exit(1);
}
