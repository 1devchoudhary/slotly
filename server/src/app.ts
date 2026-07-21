import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import assistantRoutes from "./routes/assistant";
import adminRoutes from "./routes/admin";
import cronRoutes from "./routes/cron";
import { connectDB } from "./config/db";

dotenv.config();

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
