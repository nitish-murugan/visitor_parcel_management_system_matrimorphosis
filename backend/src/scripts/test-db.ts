import { db } from "../config/db";
import { env } from "../config/env";

// Simple connectivity check for the configured MySQL instance
const main = async () => {
  try {
    const [rows] = await db.query("SELECT 1 AS ok");
    console.log(
      `DB connection OK to ${env.db.host}:${env.db.port}/${env.db.database}`
    );
    console.log(rows);
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error(
      "DB connection failed:",
      error instanceof Error ? error.message : error
    );
    await db.end();
    process.exit(1);
  }
};

void main();
