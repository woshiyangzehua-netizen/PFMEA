"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const db_1 = require("../db");
const ap_calculator_1 = require("../utils/ap-calculator");
const router = (0, express_1.Router)();
const pfmeaStore = new db_1.JsonStore("pfmea");
const structureStore = new db_1.JsonStore("pfmea-structure-nodes");
const functionStore = new db_1.JsonStore("pfmea-functions");
const failureStore = new db_1.JsonStore("pfmea-failures");
const riskStore = new db_1.JsonStore("pfmea-risk-analyses");
// List all PFMEAs
router.get("/", async (_req, res) => {
    const list = await pfmeaStore.findAll();
    res.json(list);
});
// Get single PFMEA with full details
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const pfmea = await pfmeaStore.findById(id);
    if (!pfmea)
        return res.status(404).json({ error: "PFMEA not found" });
    const structures = (await structureStore.findMany((s) => s.pfmeaId === id)).sort((a, b) => a.displayOrder - b.displayOrder);
    const functions = await functionStore.findMany((f) => f.pfmeaId === id);
    const failures = await failureStore.findMany((f) => f.pfmeaId === id);
    const risks = await riskStore.findMany((r) => r.pfmeaId === id);
    res.json({ pfmea, structures, functions, failures, risks });
});
// Create PFMEA
router.post("/", async (req, res) => {
    const id = (0, uuid_1.v4)();
    const data = {
        id,
        documentNumber: req.body.documentNumber || `PFMEA-${Date.now()}`,
        revision: req.body.revision || "A",
        status: req.body.status || "draft",
        productName: req.body.productName || "",
        partNumber: req.body.partNumber || "",
        processRoutingId: req.body.processRoutingId || undefined,
        analysisBoundary: req.body.analysisBoundary || undefined,
        analysisTeam: req.body.analysisTeam ? JSON.stringify(req.body.analysisTeam) : undefined,
        startDate: req.body.startDate || undefined,
        targetCompletionDate: req.body.targetCompletionDate || undefined,
        currentStep: req.body.currentStep || 1,
        createdBy: req.body.createdBy || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await pfmeaStore.create(data);
    res.status(201).json(data);
});
// Update PFMEA
router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const update = {};
    if (req.body.documentNumber !== undefined)
        update.documentNumber = req.body.documentNumber;
    if (req.body.revision !== undefined)
        update.revision = req.body.revision;
    if (req.body.status !== undefined)
        update.status = req.body.status;
    if (req.body.productName !== undefined)
        update.productName = req.body.productName;
    if (req.body.partNumber !== undefined)
        update.partNumber = req.body.partNumber;
    if (req.body.analysisBoundary !== undefined)
        update.analysisBoundary = req.body.analysisBoundary;
    if (req.body.analysisTeam !== undefined)
        update.analysisTeam = JSON.stringify(req.body.analysisTeam);
    if (req.body.currentStep !== undefined)
        update.currentStep = req.body.currentStep;
    update.updatedAt = new Date().toISOString();
    const updated = await pfmeaStore.update(id, update);
    res.json(updated);
});
// Delete PFMEA
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    // Cascade delete
    const risks = await riskStore.findMany((r) => r.pfmeaId === id);
    for (const r of risks)
        await riskStore.delete(r.id);
    const failures = await failureStore.findMany((f) => f.pfmeaId === id);
    for (const f of failures)
        await failureStore.delete(f.id);
    const functions = await functionStore.findMany((f) => f.pfmeaId === id);
    for (const f of functions)
        await functionStore.delete(f.id);
    const structures = await structureStore.findMany((s) => s.pfmeaId === id);
    for (const s of structures)
        await structureStore.delete(s.id);
    await pfmeaStore.delete(id);
    res.json({ success: true });
});
// ===== Structure Nodes =====
router.post("/:id/structures", async (req, res) => {
    const { id } = req.params;
    const nodeId = (0, uuid_1.v4)();
    const data = {
        id: nodeId,
        pfmeaId: id,
        nodeType: req.body.nodeType,
        parentId: req.body.parentId || null,
        processOperationId: req.body.processOperationId || null,
        dimension4m: req.body.dimension4m || null,
        name: req.body.name,
        description: req.body.description || null,
        focusElement: req.body.focusElement || null,
        nextHigherLevel: req.body.nextHigherLevel || null,
        nextLowerLevel: req.body.nextLowerLevel || null,
        displayOrder: req.body.displayOrder || 0,
        createdAt: new Date().toISOString(),
    };
    await structureStore.create(data);
    res.status(201).json(data);
});
router.patch("/:id/structures/:nodeId", async (req, res) => {
    const { nodeId } = req.params;
    const update = {};
    if (req.body.name !== undefined)
        update.name = req.body.name;
    if (req.body.description !== undefined)
        update.description = req.body.description;
    if (req.body.parentId !== undefined)
        update.parentId = req.body.parentId;
    if (req.body.displayOrder !== undefined)
        update.displayOrder = req.body.displayOrder;
    if (req.body.focusElement !== undefined)
        update.focusElement = req.body.focusElement;
    const updated = await structureStore.update(nodeId, update);
    res.json(updated);
});
router.delete("/:id/structures/:nodeId", async (req, res) => {
    const { nodeId } = req.params;
    await structureStore.delete(nodeId);
    res.json({ success: true });
});
// ===== Functions =====
router.post("/:id/functions", async (req, res) => {
    const { id } = req.params;
    const funcId = (0, uuid_1.v4)();
    const data = {
        id: funcId,
        pfmeaId: id,
        structureNodeId: req.body.structureNodeId,
        functionType: req.body.functionType,
        functionDescription: req.body.functionDescription,
        requirement: req.body.requirement || null,
        createdAt: new Date().toISOString(),
    };
    await functionStore.create(data);
    res.status(201).json(data);
});
// ===== Failures =====
router.post("/:id/failures", async (req, res) => {
    const { id } = req.params;
    const failureId = (0, uuid_1.v4)();
    const data = {
        id: failureId,
        pfmeaId: id,
        functionId: req.body.functionId,
        failureType: req.body.failureType,
        parentFailureId: req.body.parentFailureId || null,
        relatedFailureEffectId: req.body.relatedFailureEffectId || null,
        description: req.body.description,
        severity: req.body.severity || null,
        kbFailureId: req.body.kbFailureId || null,
        createdAt: new Date().toISOString(),
    };
    await failureStore.create(data);
    res.status(201).json(data);
});
// ===== Risk Analysis =====
router.post("/:id/risks", async (req, res) => {
    const { id } = req.params;
    const riskId = (0, uuid_1.v4)();
    const s = Number(req.body.severity) || 1;
    const o = Number(req.body.occurrence) || 1;
    const d = Number(req.body.detection) || 1;
    const data = {
        id: riskId,
        pfmeaId: id,
        failureModeId: req.body.failureModeId,
        currentPreventionMeasures: req.body.currentPreventionMeasures ? JSON.stringify(req.body.currentPreventionMeasures) : undefined,
        currentDetectionMeasures: req.body.currentDetectionMeasures ? JSON.stringify(req.body.currentDetectionMeasures) : undefined,
        occurrence: o,
        detection: d,
        severity: s,
        actionPriority: (0, ap_calculator_1.calculateAP)(s, o, d),
        recommendedActions: req.body.recommendedActions ? JSON.stringify(req.body.recommendedActions) : undefined,
        responsiblePerson: req.body.responsiblePerson || undefined,
        targetDate: req.body.targetDate || undefined,
        actionStatus: req.body.actionStatus || "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    await riskStore.create(data);
    res.status(201).json(data);
});
router.patch("/:id/risks/:riskId", async (req, res) => {
    const { riskId } = req.params;
    const update = {};
    if (req.body.occurrence !== undefined)
        update.occurrence = Number(req.body.occurrence);
    if (req.body.detection !== undefined)
        update.detection = Number(req.body.detection);
    if (req.body.severity !== undefined)
        update.severity = Number(req.body.severity);
    if (req.body.currentPreventionMeasures !== undefined)
        update.currentPreventionMeasures = JSON.stringify(req.body.currentPreventionMeasures);
    if (req.body.currentDetectionMeasures !== undefined)
        update.currentDetectionMeasures = JSON.stringify(req.body.currentDetectionMeasures);
    if (req.body.recommendedActions !== undefined)
        update.recommendedActions = JSON.stringify(req.body.recommendedActions);
    if (req.body.responsiblePerson !== undefined)
        update.responsiblePerson = req.body.responsiblePerson;
    if (req.body.targetDate !== undefined)
        update.targetDate = req.body.targetDate;
    if (req.body.actionStatus !== undefined)
        update.actionStatus = req.body.actionStatus;
    if (req.body.optimizedOccurrence !== undefined)
        update.optimizedOccurrence = Number(req.body.optimizedOccurrence);
    if (req.body.optimizedDetection !== undefined)
        update.optimizedDetection = Number(req.body.optimizedDetection);
    if (req.body.optimizedSeverity !== undefined)
        update.optimizedSeverity = Number(req.body.optimizedSeverity);
    // Recalculate AP if S/O/D changed
    const existing = await riskStore.findById(riskId);
    if (existing) {
        const sev = update.severity ?? existing.severity ?? 1;
        const occ = update.occurrence ?? existing.occurrence ?? 1;
        const det = update.detection ?? existing.detection ?? 1;
        update.actionPriority = (0, ap_calculator_1.calculateAP)(sev, occ, det);
        if (update.optimizedOccurrence || update.optimizedDetection || update.optimizedSeverity) {
            const os = update.optimizedSeverity ?? existing.optimizedSeverity ?? sev;
            const oo = update.optimizedOccurrence ?? existing.optimizedOccurrence ?? occ;
            const od = update.optimizedDetection ?? existing.optimizedDetection ?? det;
            update.optimizedAp = (0, ap_calculator_1.calculateAP)(os, oo, od);
        }
    }
    update.updatedAt = new Date().toISOString();
    const updated = await riskStore.update(riskId, update);
    res.json(updated);
});
// ===== Excel Export =====
const exceljs_1 = __importDefault(require("exceljs"));
router.get("/:id/export", async (req, res) => {
    const { id } = req.params;
    const pfmea = await pfmeaStore.findById(id);
    if (!pfmea)
        return res.status(404).json({ error: "PFMEA not found" });
    const structures = (await structureStore.findMany((s) => s.pfmeaId === id)).sort((a, b) => a.displayOrder - b.displayOrder);
    const funcs = await functionStore.findMany((f) => f.pfmeaId === id);
    const failures = await failureStore.findMany((f) => f.pfmeaId === id);
    const risks = await riskStore.findMany((r) => r.pfmeaId === id);
    const workbook = new exceljs_1.default.Workbook();
    const ws = workbook.addWorksheet("PFMEA");
    // Header info
    ws.addRow(["文件编号", pfmea.documentNumber, "版本", pfmea.revision || "A"]);
    ws.addRow(["产品名称", pfmea.productName, "零件号", pfmea.partNumber]);
    ws.addRow([]);
    // Column headers
    ws.addRow([
        "过程项", "过程步骤", "工作要素",
        "功能", "要求",
        "失效模式", "失效影响", "失效起因",
        "S", "O", "D", "AP",
        "当前预防措施", "当前探测措施",
        "建议措施", "责任人", "目标日期", "措施状态",
    ]);
    // Build rows by flattening structure
    for (const structure of structures) {
        const sFuncs = funcs.filter((f) => f.structureNodeId === structure.id);
        for (const f of sFuncs) {
            const fFailures = failures.filter((fa) => fa.functionId === f.id && fa.failureType === "failure_mode");
            for (const fm of fFailures) {
                const fmEffects = failures.filter((fa) => fa.failureType === "failure_effect" && (fa.parentFailureId === fm.id || fa.relatedFailureEffectId === fm.id));
                const fmCauses = failures.filter((fa) => fa.failureType === "failure_cause" && fa.parentFailureId === fm.id);
                const risk = risks.find((r) => r.failureModeId === fm.id);
                const parentItem = structures.find((s) => s.id === structure.parentId);
                const effectStr = fmEffects.map((e) => e.description).join("; ") || "";
                const causeStr = fmCauses.map((c) => c.description).join("; ") || "";
                ws.addRow([
                    parentItem?.name || (structure.nodeType === "process_item" ? structure.name : ""),
                    structure.nodeType === "process_step" ? structure.name : "",
                    structure.nodeType === "work_element" ? `${structure.name} (${structure.dimension4m})` : "",
                    f.functionDescription,
                    f.requirement || "",
                    fm.description,
                    effectStr,
                    causeStr,
                    risk?.severity ?? "",
                    risk?.occurrence ?? "",
                    risk?.detection ?? "",
                    risk?.actionPriority ?? "",
                    risk?.currentPreventionMeasures ? JSON.parse(risk.currentPreventionMeasures).join("; ") : "",
                    risk?.currentDetectionMeasures ? JSON.parse(risk.currentDetectionMeasures).join("; ") : "",
                    risk?.recommendedActions ? JSON.parse(risk.recommendedActions).join("; ") : "",
                    risk?.responsiblePerson || "",
                    risk?.targetDate || "",
                    risk?.actionStatus || "",
                ]);
            }
        }
    }
    // Style header row
    const headerRow = ws.getRow(4);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center" };
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${pfmea.documentNumber}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
});
exports.default = router;
//# sourceMappingURL=pfmea.js.map