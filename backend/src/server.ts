import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import { db } from "./config/db";
import authRoutes from "./routes/authRoutes";
import visitorRoutes from "./routes/visitorRoutes";
import parcelRoutes from "./routes/parcelRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/parcels", parcelRoutes);

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    res.status(200).json({ success: true, status: "ok", db: "reachable" });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "error",
      message: "Database unreachable",
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Not found",
  });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Export the app for serverless (Vercel) while still supporting local dev
export default app;

if (!process.env.VERCEL) {
  const port = env.port || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
