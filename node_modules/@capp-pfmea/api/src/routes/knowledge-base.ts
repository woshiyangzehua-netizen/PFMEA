import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { JsonStore } from "../db";
import type { KbProcessItem, KbProcessStep, KbFailure } from "../db";

const router = Router();

const itemStore = new JsonStore<KbProcessItem>("kb-process-items");
const stepStore = new JsonStore<KbProcessStep>("kb-process-steps");
const failureStore = new JsonStore<KbFailure>("kb-failures");

// ===== KB Process Items =====
router.get("/process-items", async (req, res) => {
  const { q } = req.query;
  let list = await itemStore.findAll();
  if (q && typeof q === "string") {
    list = list.filter((i) => i.name.includes(q) || (i.code && i.code.includes(q)));
  }
  res.json(list);
});

router.post("/process-items", async (req, res) => {
  const id = uuidv4();
  const data: KbProcessItem = {
    id,
    code: req.body.code,
    name: req.body.name,
    category: req.body.category || undefined,
    description: req.body.description || undefined,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  await itemStore.create(data);
  res.status(201).json(data);
});

router.patch("/process-items/:id", async (req, res) => {
  const { id } = req.params;
  const update: Partial<KbProcessItem> = {};
  if (req.body.code !== undefined) update.code = req.body.code;
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.category !== undefined) update.category = req.body.category;
  if (req.body.description !== undefined) update.description = req.body.description;
  const updated = await itemStore.update(id, update);
  res.json(updated);
});

router.delete("/process-items/:id", async (req, res) => {
  await itemStore.delete(req.params.id);
  res.json({ success: true });
});

// ===== KB Process Steps =====
router.get("/process-steps", async (req, res) => {
  const { processItemId } = req.query;
  let list = await stepStore.findAll();
  if (processItemId) {
    list = list.filter((s) => s.processItemId === processItemId);
  }
  res.json(list);
});

router.post("/process-steps", async (req, res) => {
  const id = uuidv4();
  const data: KbProcessStep = {
    id,
    processItemId: req.body.processItemId || undefined,
    code: req.body.code,
    name: req.body.name,
    standardEquipmentTypes: req.body.standardEquipmentTypes ? JSON.stringify(req.body.standardEquipmentTypes) : undefined,
    typicalParameters: req.body.typicalParameters ? JSON.stringify(req.body.typicalParameters) : undefined,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  await stepStore.create(data);
  res.status(201).json(data);
});

router.patch("/process-steps/:id", async (req, res) => {
  const { id } = req.params;
  const update: Partial<KbProcessStep> = {};
  if (req.body.processItemId !== undefined) update.processItemId = req.body.processItemId;
  if (req.body.code !== undefined) update.code = req.body.code;
  if (req.body.name !== undefined) update.name = req.body.name;
  if (req.body.standardEquipmentTypes !== undefined) update.standardEquipmentTypes = req.body.standardEquipmentTypes ? JSON.stringify(req.body.standardEquipmentTypes) : undefined;
  if (req.body.typicalParameters !== undefined) update.typicalParameters = req.body.typicalParameters ? JSON.stringify(req.body.typicalParameters) : undefined;
  const updated = await stepStore.update(id, update);
  res.json(updated);
});

router.delete("/process-steps/:id", async (req, res) => {
  await stepStore.delete(req.params.id);
  res.json({ success: true });
});

// ===== KB Failures =====
router.get("/failures", async (req, res) => {
  const { type } = req.query;
  let list = await failureStore.findAll();
  if (type) {
    list = list.filter((f) => f.failureType === type);
  }
  res.json(list);
});

router.post("/failures", async (req, res) => {
  const id = uuidv4();
  const data: KbFailure = {
    id,
    failureType: req.body.failureType,
    parentId: req.body.parentId || undefined,
    code: req.body.code || undefined,
    description: req.body.description,
    category: req.body.category || undefined,
    applicableProcessItemIds: req.body.applicableProcessItemIds ? JSON.stringify(req.body.applicableProcessItemIds) : undefined,
    applicableProcessStepIds: req.body.applicableProcessStepIds ? JSON.stringify(req.body.applicableProcessStepIds) : undefined,
    defaultSeverity: req.body.defaultSeverity || undefined,
    typicalPreventionMeasures: req.body.typicalPreventionMeasures ? JSON.stringify(req.body.typicalPreventionMeasures) : undefined,
    typicalDetectionMeasures: req.body.typicalDetectionMeasures ? JSON.stringify(req.body.typicalDetectionMeasures) : undefined,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  };
  await failureStore.create(data);
  res.status(201).json(data);
});

router.patch("/failures/:id", async (req, res) => {
  const { id } = req.params;
  const update: Partial<KbFailure> = {};
  if (req.body.failureType !== undefined) update.failureType = req.body.failureType;
  if (req.body.parentId !== undefined) update.parentId = req.body.parentId;
  if (req.body.code !== undefined) update.code = req.body.code;
  if (req.body.description !== undefined) update.description = req.body.description;
  if (req.body.category !== undefined) update.category = req.body.category;
  if (req.body.applicableProcessItemIds !== undefined) update.applicableProcessItemIds = req.body.applicableProcessItemIds ? JSON.stringify(req.body.applicableProcessItemIds) : undefined;
  if (req.body.applicableProcessStepIds !== undefined) update.applicableProcessStepIds = req.body.applicableProcessStepIds ? JSON.stringify(req.body.applicableProcessStepIds) : undefined;
  if (req.body.defaultSeverity !== undefined) update.defaultSeverity = req.body.defaultSeverity;
  if (req.body.typicalPreventionMeasures !== undefined) update.typicalPreventionMeasures = req.body.typicalPreventionMeasures ? JSON.stringify(req.body.typicalPreventionMeasures) : undefined;
  if (req.body.typicalDetectionMeasures !== undefined) update.typicalDetectionMeasures = req.body.typicalDetectionMeasures ? JSON.stringify(req.body.typicalDetectionMeasures) : undefined;
  const updated = await failureStore.update(id, update);
  res.json(updated);
});

router.delete("/failures/:id", async (req, res) => {
  await failureStore.delete(req.params.id);
  res.json({ success: true });
});

export default router;
