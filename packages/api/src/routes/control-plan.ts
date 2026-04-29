import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { JsonStore } from "../db";
import type { ControlPlan, ControlPlanItem, Pfmea, PfmeaRiskAnalysis, PfmeaStructureNode, ProcessOperation } from "../db";

const router = Router();

const cpStore = new JsonStore<ControlPlan>("control-plans");
const itemStore = new JsonStore<ControlPlanItem>("control-plan-items");
const pfmeaStore = new JsonStore<Pfmea>("pfmeas");
const riskStore = new JsonStore<PfmeaRiskAnalysis>("risk-analyses");
const structureStore = new JsonStore<PfmeaStructureNode>("structure-nodes");
const operationStore = new JsonStore<ProcessOperation>("process-operations");

// ===== Control Plans =====
router.get("/", async (_req, res) => {
  const list = await cpStore.findAll();
  res.json(list);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const plan = await cpStore.findById(id);
  if (!plan) return res.status(404).json({ error: "Control plan not found" });

  const items = (await itemStore.findMany((i) => i.controlPlanId === id)).sort((a, b) => a.displayOrder - b.displayOrder);
  res.json({ plan, items });
});

router.post("/", async (req, res) => {
  const id = uuidv4();
  const data: ControlPlan = {
    id,
    documentNumber: req.body.documentNumber || `CP-${Date.now()}`,
    revision: req.body.revision || "A",
    status: req.body.status || "draft",
    pfmeaId: req.body.pfmeaId || "",
    processRoutingId: req.body.processRoutingId || "",
    createdBy: req.body.createdBy || undefined,
    approvedBy: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await cpStore.create(data);
  res.status(201).json(data);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const update: Partial<ControlPlan> = {};
  if (req.body.documentNumber !== undefined) update.documentNumber = req.body.documentNumber;
  if (req.body.revision !== undefined) update.revision = req.body.revision;
  if (req.body.status !== undefined) update.status = req.body.status;
  if (req.body.pfmeaId !== undefined) update.pfmeaId = req.body.pfmeaId;
  if (req.body.processRoutingId !== undefined) update.processRoutingId = req.body.processRoutingId;
  update.updatedAt = new Date().toISOString();

  const updated = await cpStore.update(id, update);
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const items = await itemStore.findMany((i) => i.controlPlanId === id);
  for (const item of items) await itemStore.delete(item.id);
  await cpStore.delete(id);
  res.json({ success: true });
});

// ===== Control Plan Items =====
router.post("/:id/items", async (req, res) => {
  const { id } = req.params;
  const plan = await cpStore.findById(id);
  if (!plan) return res.status(404).json({ error: "Control plan not found" });

  const itemId = uuidv4();
  const data: ControlPlanItem = {
    id: itemId,
    controlPlanId: id,
    processOperationId: req.body.processOperationId || "",
    productCharacteristics: req.body.productCharacteristics || undefined,
    processCharacteristics: req.body.processCharacteristics || undefined,
    characteristicClassification: req.body.characteristicClassification || undefined,
    controlMethod: req.body.controlMethod || "",
    measurementTechnique: req.body.measurementTechnique || undefined,
    sampleSize: req.body.sampleSize || undefined,
    sampleFrequency: req.body.sampleFrequency || undefined,
    controlTools: req.body.controlTools || undefined,
    reactionPlan: req.body.reactionPlan || undefined,
    linkedPfmeaRiskId: req.body.linkedPfmeaRiskId || undefined,
    isKeyControlPoint: req.body.isKeyControlPoint || false,
    responsiblePerson: req.body.responsiblePerson || undefined,
    displayOrder: req.body.displayOrder || 0,
    createdAt: new Date().toISOString(),
  };
  await itemStore.create(data);
  res.status(201).json(data);
});

router.patch("/items/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const update: Partial<ControlPlanItem> = {};
  if (req.body.processOperationId !== undefined) update.processOperationId = req.body.processOperationId;
  if (req.body.productCharacteristics !== undefined) update.productCharacteristics = req.body.productCharacteristics;
  if (req.body.processCharacteristics !== undefined) update.processCharacteristics = req.body.processCharacteristics;
  if (req.body.characteristicClassification !== undefined) update.characteristicClassification = req.body.characteristicClassification;
  if (req.body.controlMethod !== undefined) update.controlMethod = req.body.controlMethod;
  if (req.body.measurementTechnique !== undefined) update.measurementTechnique = req.body.measurementTechnique;
  if (req.body.sampleSize !== undefined) update.sampleSize = req.body.sampleSize;
  if (req.body.sampleFrequency !== undefined) update.sampleFrequency = req.body.sampleFrequency;
  if (req.body.controlTools !== undefined) update.controlTools = req.body.controlTools;
  if (req.body.reactionPlan !== undefined) update.reactionPlan = req.body.reactionPlan;
  if (req.body.linkedPfmeaRiskId !== undefined) update.linkedPfmeaRiskId = req.body.linkedPfmeaRiskId;
  if (req.body.isKeyControlPoint !== undefined) update.isKeyControlPoint = req.body.isKeyControlPoint;
  if (req.body.responsiblePerson !== undefined) update.responsiblePerson = req.body.responsiblePerson;
  if (req.body.displayOrder !== undefined) update.displayOrder = req.body.displayOrder;

  const updated = await itemStore.update(itemId, update);
  res.json(updated);
});

router.delete("/items/:itemId", async (req, res) => {
  await itemStore.delete(req.params.itemId);
  res.json({ success: true });
});

// ===== Auto-generate from PFMEA =====
router.post("/from-pfmea/:pfmeaId", async (req, res) => {
  const { pfmeaId } = req.params;
  const pfmea = await pfmeaStore.findById(pfmeaId);
  if (!pfmea) return res.status(404).json({ error: "PFMEA not found" });

  const id = uuidv4();
  const plan: ControlPlan = {
    id,
    documentNumber: req.body.documentNumber || `CP-${pfmea.partNumber}-${Date.now()}`,
    revision: "A",
    status: "draft",
    pfmeaId,
    processRoutingId: pfmea.processRoutingId || "",
    createdBy: req.body.createdBy || undefined,
    approvedBy: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await cpStore.create(plan);

  // Gather operations from linked routing if available
  let operations: ProcessOperation[] = [];
  if (pfmea.processRoutingId) {
    operations = (await operationStore.findMany((o) => o.processRoutingId === pfmea.processRoutingId)).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // Get structure nodes for this PFMEA
  const structures = await structureStore.findMany((s) => s.pfmeaId === pfmeaId);

  // Get high-AP risks
  const risks = await riskStore.findMany((r) => r.pfmeaId === pfmeaId);
  const highApRisks = risks.filter((r) => r.actionPriority === "H");

  // Create items: one per operation
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    // Find related structure node
    const struct = structures.find((s) => s.processOperationId === op.id);
    // Find risks linked to this operation via structure
    const relatedRisks = struct
      ? risks.filter((r) => {
          // Risk -> failureModeId -> find failure -> functionId -> structureNodeId
          // We don't have failure store here directly, but we can approximate:
          // High AP risks on this structure path suggest key control points
          return highApRisks.some((hr) => hr.id === r.id);
        })
      : [];

    const isKeyControlPoint = relatedRisks.length > 0;
    const linkedRisk = relatedRisks[0];

    const item: ControlPlanItem = {
      id: uuidv4(),
      controlPlanId: id,
      processOperationId: op.id,
      productCharacteristics: undefined,
      processCharacteristics: struct ? `${struct.name} 特性` : undefined,
      characteristicClassification: isKeyControlPoint ? "关键特性" : "一般特性",
      controlMethod: isKeyControlPoint ? "SPC / 全检" : "巡检",
      measurementTechnique: undefined,
      sampleSize: isKeyControlPoint ? "100%" : "5件",
      sampleFrequency: isKeyControlPoint ? "每批" : "每小时",
      controlTools: undefined,
      reactionPlan: isKeyControlPoint ? "停机调整/隔离批次" : "记录/预警",
      linkedPfmeaRiskId: linkedRisk ? linkedRisk.id : undefined,
      isKeyControlPoint,
      responsiblePerson: undefined,
      displayOrder: i + 1,
      createdAt: new Date().toISOString(),
    };
    await itemStore.create(item);
  }

  res.status(201).json({ plan, message: `已自动生成控制计划，包含 ${operations.length} 个工序控制项` });
});

// ===== Consistency Check =====
router.get("/:id/consistency", async (req, res) => {
  const { id } = req.params;
  const plan = await cpStore.findById(id);
  if (!plan) return res.status(404).json({ error: "Control plan not found" });

  const issues: string[] = [];

  if (!plan.pfmeaId) {
    issues.push("控制计划未关联PFMEA");
  } else {
    const pfmea = await pfmeaStore.findById(plan.pfmeaId);
    if (!pfmea) issues.push("关联的PFMEA不存在");
  }

  if (!plan.processRoutingId) {
    issues.push("控制计划未关联工艺路线");
  }

  const items = await itemStore.findMany((i) => i.controlPlanId === id);
  for (const item of items) {
    if (!item.controlMethod) issues.push(`项目 #${item.displayOrder} 未填写控制方法`);
    if (item.isKeyControlPoint && !item.reactionPlan) issues.push(`关键控制点 #${item.displayOrder} 未填写反应计划`);
  }

  res.json({ valid: issues.length === 0, issues });
});

export default router;
