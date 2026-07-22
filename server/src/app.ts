// MUST be first. ES imports are evaluated before any statement in this file, so
// calling dotenv.config() further down would leave every module below reading an
// empty process.env at import time.
import "dotenv/config";

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import assistantRoutes from "./routes/assistant";
import adminRoutes from "./routes/admin";
import cronRoutes from "./routes/cron";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cron", cronRoutes);

export default app;
