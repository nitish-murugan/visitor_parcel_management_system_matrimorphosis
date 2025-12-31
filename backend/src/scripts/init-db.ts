import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

async function initializeDatabase() {
  let connection;
  try {
    console.log("Connecting to MySQL...");
    
    // First connect without database to create it
    connection = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
    });

    console.log("✓ Connected to MySQL");

    // Drop existing database if it exists
    console.log("Dropping existing database if it exists...");
    await (connection as any).query("DROP DATABASE IF EXISTS vpms");
    console.log("✓ Dropped existing database");

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, "../../db/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Execute the schema file
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      // Use query() for USE statements since they don't support prepared statements
      if (statement.toUpperCase().startsWith("USE")) {
        await (connection as any).query(statement);
      } else {
        await connection.execute(statement);
      }
    }

    console.log("✓ Database schema initialized successfully");

  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase().then(() => {
  console.log("✓ Database setup completed");
  process.exit(0);
});
