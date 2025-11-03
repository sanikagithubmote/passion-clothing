/**
 * Fix Invoice File Sizes in Database
 * Corrects file_size records to match actual file sizes on disk
 */
const fs = require("fs");
const path = require("path");
const db = require("./server/config/database");

async function fixFileSizes() {
  const transaction = await db.sequelize.transaction();

  try {
    console.log("🔧 [FIX] Starting file size correction...\n");

    // Find all document attachments with file_size = 102400 (the bad value)
    const badDocuments = await db.DocumentAttachment.findAll({
      where: {
        file_size: 102400,
        document_type: "invoice",
      },
      transaction,
    });

    console.log(
      `📋 Found ${badDocuments.length} documents with incorrect file size\n`
    );

    let fixedCount = 0;
    let errorCount = 0;

    for (const doc of badDocuments) {
      try {
        // Check if file exists
        const fullPath = path.join(__dirname, "server", doc.file_path);

        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          const actualSize = stats.size;

          // Update the record
          await doc.update({ file_size: actualSize }, { transaction });

          console.log(`✅ Fixed: ${doc.file_name}`);
          console.log(
            `   Old Size: 102400 bytes → New Size: ${actualSize} bytes\n`
          );
          fixedCount++;
        } else {
          console.log(`⚠️  File not found: ${doc.file_path}`);
          errorCount++;
        }
      } catch (err) {
        console.error(`❌ Error fixing ${doc.file_name}:`, err.message);
        errorCount++;
      }
    }

    await transaction.commit();

    console.log("\n📊 [SUMMARY]");
    console.log(`✅ Fixed: ${fixedCount} documents`);
    console.log(`❌ Errors: ${errorCount} documents`);
    console.log(`Total: ${badDocuments.length} documents processed\n`);

    if (fixedCount === badDocuments.length) {
      console.log("🎉 All file sizes corrected successfully!");
    }

    process.exit(fixedCount === badDocuments.length ? 0 : 1);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

fixFileSizes();
