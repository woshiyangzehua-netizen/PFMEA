"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pfmea_1 = __importDefault(require("./routes/pfmea"));
const capp_1 = __importDefault(require("./routes/capp"));
const knowledge_base_1 = __importDefault(require("./routes/knowledge-base"));
const control_plan_1 = __importDefault(require("./routes/control-plan"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// Routes
app.use("/api/pfmea", pfmea_1.default);
app.use("/api/capp", capp_1.default);
app.use("/api/kb", knowledge_base_1.default);
app.use("/api/control-plans", control_plan_1.default);
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map