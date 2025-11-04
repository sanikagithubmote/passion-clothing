const { sequelize } = require("./server/config/database");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  try {
    console.log("Starting activities table migration...");

    const sqlFile = path.join(__dirname, "create-activities-table.sql");
    const sql = fs.readFileSync(sqlFile, "utf8");

    // Execute the SQL
    const statements = sql.split(";").filter((stmt) => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sequelize.query(statement);
      }
    }

    console.log("✅ Activities table migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

runMigration();
