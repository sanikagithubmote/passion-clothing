const fs = require("fs");
const path = require("path");

console.log("🔍 Testing Invoice PDF Generation...\n");

// 1. Check if uploads directory exists and PDFs are being created
const uploadsDir = path.join(__dirname, "server/uploads/documents");

console.log("1️⃣ Checking uploads directory structure:");
if (fs.existsSync(uploadsDir)) {
  const subdirs = fs.readdirSync(uploadsDir);
  console.log(`   ✅ Uploads directory found`);
  console.log(`   📁 Subdirectories: ${subdirs.join(", ")}`);

  // Check each subdirectory
  subdirs.forEach((dir) => {
    const dirPath = path.join(uploadsDir, dir);
    const stat = fs.statSync(dirPath);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(dirPath);
      console.log(`\n   📂 ${dir}/`);
      if (files.length === 0) {
        console.log(`      (empty)`);
      } else {
        files.forEach((file) => {
          const filePath = path.join(dirPath, file);
          const fileStat = fs.statSync(filePath);
          const sizeMB = (fileStat.size / 1024).toFixed(2);
          console.log(`      📄 ${file} (${sizeMB} KB)`);
        });
      }
    }
  });
} else {
  console.log("   ❌ Uploads directory not found!");
}

// 2. Check if pdfGenerator is working
console.log("\n2️⃣ Testing PDF Generator directly:");
try {
  const { SalesInvoicePDF } = require("./server/utils/pdfGenerator");
  console.log("   ✅ SalesInvoicePDF imported successfully");

  // Create a test invoice
  const generator = new SalesInvoicePDF();
  const testData = {
    order_number: "SO-TEST-001",
    order_date: new Date().toLocaleDateString(),
    delivery_date: new Date().toLocaleDateString(),
    final_amount: 50000,
    customer_name: "Test Customer",
    customer_email: "test@example.com",
    customer_phone: "9999999999",
    customer_address: "Test Address",
    status: "Draft",
    items: [
      {
        product_name: "Test Product",
        quantity: 10,
        unit_price: 5000,
        total_amount: 50000,
      },
    ],
    subtotal: 50000,
    tax: 0,
  };

  console.log("\n   🎯 Generating test PDF...");
  generator
    .generate(testData)
    .then((filePath) => {
      console.log(`   ✅ PDF generated successfully!`);
      console.log(`   📍 Path: ${filePath}`);

      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        console.log(`   📊 Size: ${(stat.size / 1024).toFixed(2)} KB`);
        console.log(`   ⏰ Created: ${stat.birthtime}`);
      } else {
        console.log(
          "   ⚠️ Warning: File path reported but file not accessible"
        );
      }
    })
    .catch((err) => {
      console.log(`   ❌ PDF generation failed: ${err.message}`);
    });
} catch (error) {
  console.log(`   ❌ Error: ${error.message}`);
  console.log(`   Stack: ${error.stack}`);
}
