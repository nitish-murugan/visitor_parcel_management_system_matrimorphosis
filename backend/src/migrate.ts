import { db } from "./config/db";

async function runMigration() {
  try {
    console.log("Running migration: Add phone column to users table...");

    const connection = await db.getConnection();

    try {
      await connection.execute(
        `ALTER TABLE users ADD COLUMN phone VARCHAR(15) DEFAULT NULL AFTER email`
      );
      console.log("✓ Phone column added successfully");
    } catch (e: any) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log("✓ Phone column already exists");
      } else {
        throw e;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration().then(() => {
  console.log("Migration completed successfully");
  process.exit(0);
});
