import express from "express";
import cors from "cors";
import pfmeaRoutes from "./routes/pfmea";
import cappRoutes from "./routes/capp";
import kbRoutes from "./routes/knowledge-base";
import controlPlanRoutes from "./routes/control-plan";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/pfmea", pfmeaRoutes);
app.use("/api/capp", cappRoutes);
app.use("/api/kb", kbRoutes);
app.use("/api/control-plans", controlPlanRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
