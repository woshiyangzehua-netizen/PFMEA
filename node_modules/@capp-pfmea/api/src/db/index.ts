export { JsonStore, readJsonFile, writeJsonFile } from "./json-store";

// Type definitions for JSON store entities (mirroring the original schema)

export interface ProcessRouting {
  id: string;
  routingNumber: string;
  partNumber: string;
  partName: string;
  partRevision?: string;
  routingType?: string;
  status?: string;
  version?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProcessOperation {
  id: string;
  processRoutingId: string;
  operationNumber: string;
  operationName: string;
  operationDescription?: string;
  department?: string;
  workCenter?: string;
  equipmentCode?: string;
  setupTimeMinutes?: number;
  cycleTimeMinutes?: number;
  displayOrder: number;
  createdAt?: string;
}

export interface Equipment {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  capabilities?: string;
  createdAt?: string;
}

export interface Pfmea {
  id: string;
  documentNumber: string;
  revision?: string;
  status?: string;
  productName: string;
  partNumber: string;
  processRoutingId?: string;
  analysisBoundary?: string;
  analysisTeam?: string;
  startDate?: string;
  targetCompletionDate?: string;
  currentStep?: number;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PfmeaStructureNode {
  id: string;
  pfmeaId: string;
  nodeType: "process_item" | "process_step" | "work_element";
  parentId?: string;
  processOperationId?: string;
  dimension4m?: "Man" | "Machine" | "Material" | "Milieu";
  name: string;
  description?: string;
  focusElement?: string;
  nextHigherLevel?: string;
  nextLowerLevel?: string;
  displayOrder: number;
  createdAt?: string;
}

export interface PfmeaFunction {
  id: string;
  pfmeaId: string;
  structureNodeId: string;
  functionType: string;
  functionDescription: string;
  requirement?: string;
  createdAt?: string;
}

export interface PfmeaFailure {
  id: string;
  pfmeaId: string;
  functionId: string;
  failureType: "failure_effect" | "failure_mode" | "failure_cause";
  parentFailureId?: string;
  relatedFailureEffectId?: string;
  description: string;
  severity?: number;
  kbFailureId?: string;
  createdAt?: string;
}

export interface PfmeaRiskAnalysis {
  id: string;
  pfmeaId: string;
  failureModeId: string;
  currentPreventionMeasures?: string;
  currentDetectionMeasures?: string;
  occurrence?: number;
  detection?: number;
  severity?: number;
  actionPriority?: "H" | "M" | "L";
  recommendedActions?: string;
  responsiblePerson?: string;
  targetDate?: string;
  actionStatus?: string;
  optimizedPreventionMeasures?: string;
  optimizedDetectionMeasures?: string;
  optimizedOccurrence?: number;
  optimizedDetection?: number;
  optimizedSeverity?: number;
  optimizedAp?: "H" | "M" | "L";
  verificationMethod?: string;
  verificationResult?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ControlPlan {
  id: string;
  documentNumber: string;
  revision?: string;
  status?: string;
  pfmeaId: string;
  processRoutingId: string;
  createdBy?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ControlPlanItem {
  id: string;
  controlPlanId: string;
  processOperationId: string;
  productCharacteristics?: string;
  processCharacteristics?: string;
  characteristicClassification?: string;
  controlMethod: string;
  measurementTechnique?: string;
  sampleSize?: string;
  sampleFrequency?: string;
  controlTools?: string;
  reactionPlan?: string;
  linkedPfmeaRiskId?: string;
  isKeyControlPoint?: boolean;
  responsiblePerson?: string;
  displayOrder: number;
  createdAt?: string;
}

export interface KbProcessItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  usageCount?: number;
  createdAt?: string;
}

export interface KbProcessStep {
  id: string;
  processItemId?: string;
  code: string;
  name: string;
  standardEquipmentTypes?: string;
  typicalParameters?: string;
  usageCount?: number;
  createdAt?: string;
}

export interface KbFailure {
  id: string;
  failureType: "effect" | "mode" | "cause";
  parentId?: string;
  code?: string;
  description: string;
  category?: string;
  applicableProcessItemIds?: string;
  applicableProcessStepIds?: string;
  defaultSeverity?: number;
  typicalPreventionMeasures?: string;
  typicalDetectionMeasures?: string;
  usageCount?: number;
  createdAt?: string;
}

export interface CbrCase {
  id: string;
  caseName: string;
  productType?: string;
  material?: string;
  keyDimensions?: string;
  processMethods?: string;
  equipmentTypes?: string;
  sourcePfmeaId?: string;
  failurePatterns: string;
  usageCount?: number;
  effectivenessRating?: number;
  createdAt?: string;
}
