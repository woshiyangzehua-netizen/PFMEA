import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { JsonStore } from "../db";
import type { ProcessRouting, ProcessOperation, Equipment } from "../db";

const router = Router();

const routingStore = new JsonStore<ProcessRouting>("process-routings");
const operationStore = new JsonStore<ProcessOperation>("process-operations");
const equipmentStore = new JsonStore<Equipment>("equipment");

// ===== Process Routings =====
router.get("/routings", async (_req, res) => {
  const list = await routingStore.findAll();
  res.json(list);
});

router.get("/routings/:id", async (req, res) => {
  const { id } = req.params;
  const routing = await routingStore.findById(id);
  if (!routing) return res.status(404).json({ error: "Routing not found" });

  const operations = (await operationStore.findMany((o) => o.processRoutingId === id)).sort((a, b) => a.displayOrder - b.displayOrder);
  res.json({ routing, operations });
});

router.post("/routings", async (req, res) => {
  const id = uuidv4();
  const data: ProcessRouting = {
    id,
    routingNumber: req.body.routingNumber || `ROUTE-${Date.now()}`,
    partNumber: req.body.partNumber || "",
    partName: req.body.partName || "",
    partRevision: req.body.partRevision || null,
    routingType: req.body.routingType || "manufacturing",
    status: req.body.status || "draft",
    version: 1,
    createdBy: req.body.createdBy || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await routingStore.create(data);
  res.status(201).json(data);
});

router.patch("/routings/:id", async (req, res) => {
  const { id } = req.params;
  const update: Partial<ProcessRouting> = {};
  if (req.body.routingNumber !== undefined) update.routingNumber = req.body.routingNumber;
  if (req.body.partNumber !== undefined) update.partNumber = req.body.partNumber;
  if (req.body.partName !== undefined) update.partName = req.body.partName;
  if (req.body.partRevision !== undefined) update.partRevision = req.body.partRevision;
  if (req.body.status !== undefined) update.status = req.body.status;
  update.updatedAt = new Date().toISOString();

  const updated = await routingStore.update(id, update);
  res.json(updated);
});

router.delete("/routings/:id", async (req, res) => {
  const { id } = req.params;
  const operations = await operationStore.findMany((o) => o.processRoutingId === id);
  for (const op of operations) await operationStore.delete(op.id);
  await routingStore.delete(id);
  res.json({ success: true });
});

// ===== Operations =====
router.post("/routings/:id/operations", async (req, res) => {
  const { id } = req.params;
  const opId = uuidv4();
  const data: ProcessOperation = {
    id: opId,
    processRoutingId: id,
    operationNumber: req.body.operationNumber,
    operationName: req.body.operationName,
    operationDescription: req.body.operationDescription || null,
    department: req.body.department || null,
    workCenter: req.body.workCenter || null,
    equipmentCode: req.body.equipmentCode || null,
    setupTimeMinutes: req.body.setupTimeMinutes || null,
    cycleTimeMinutes: req.body.cycleTimeMinutes || null,
    displayOrder: req.body.displayOrder || 0,
    createdAt: new Date().toISOString(),
  };
  await operationStore.create(data);
  res.status(201).json(data);
});

router.patch("/operations/:opId", async (req, res) => {
  const { opId } = req.params;
  const update: Partial<ProcessOperation> = {};
  if (req.body.operationName !== undefined) update.operationName = req.body.operationName;
  if (req.body.operationDescription !== undefined) update.operationDescription = req.body.operationDescription;
  if (req.body.department !== undefined) update.department = req.body.department;
  if (req.body.workCenter !== undefined) update.workCenter = req.body.workCenter;
  if (req.body.equipmentCode !== undefined) update.equipmentCode = req.body.equipmentCode;
  if (req.body.displayOrder !== undefined) update.displayOrder = req.body.displayOrder;

  const updated = await operationStore.update(opId, update);
  res.json(updated);
});

router.delete("/operations/:opId", async (req, res) => {
  const { opId } = req.params;
  await operationStore.delete(opId);
  res.json({ success: true });
});

// ===== Equipment =====
router.get("/equipment", async (_req, res) => {
  const list = await equipmentStore.findAll();
  res.json(list);
});

router.post("/equipment", async (req, res) => {
  const id = uuidv4();
  const data: Equipment = {
    id,
    equipmentCode: req.body.equipmentCode,
    equipmentName: req.body.equipmentName,
    equipmentType: req.body.equipmentType || undefined,
    manufacturer: req.body.manufacturer || undefined,
    model: req.body.model || undefined,
    capabilities: req.body.capabilities ? JSON.stringify(req.body.capabilities) : undefined,
    createdAt: new Date().toISOString(),
  };
  await equipmentStore.create(data);
  res.status(201).json(data);
});

router.patch("/equipment/:id", async (req, res) => {
  const { id } = req.params;
  const update: Partial<Equipment> = {};
  if (req.body.equipmentName !== undefined) update.equipmentName = req.body.equipmentName;
  if (req.body.equipmentType !== undefined) update.equipmentType = req.body.equipmentType;
  if (req.body.manufacturer !== undefined) update.manufacturer = req.body.manufacturer;
  if (req.body.model !== undefined) update.model = req.body.model;

  const updated = await equipmentStore.update(id, update);
  res.json(updated);
});

router.delete("/equipment/:id", async (req, res) => {
  const { id } = req.params;
  await equipmentStore.delete(id);
  res.json({ success: true });
});

export default router;
