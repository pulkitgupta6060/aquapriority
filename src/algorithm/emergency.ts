import { RepairRequest, EmergencyClassification } from '../types';

/**
 * Explicit rule-based Emergency Classification Engine.
 * Tests domain rules to classify emergency status and identify
 * critical failures that cannot fit scheduled municipal capacity.
 */
export function classifyEmergency(
  request: RepairRequest,
  totalAvailableBudget: number,
  totalAvailableHours: number
): EmergencyClassification {
  const rulesTriggered: string[] = [];

  // Rule 1: Medical / Life-Safety critical facilities
  if (request.criticalFacility === 'HOSPITAL') {
    rulesTriggered.push('Life-safety risk: Critical water supply connection to Hospital');
  } else if (request.criticalFacility === 'DIALYSIS_CENTER') {
    rulesTriggered.push('Health risk: Dialysis center requires uninterrupted pure water');
  }

  // Rule 2: Bacterial or chemical contamination hazard
  if (request.contaminationRisk) {
    rulesTriggered.push('Water quality alert: Active sewage infiltration / contamination risk');
  }

  // Rule 3: Catastrophic pipe burst
  if (request.damageType === 'BURST' && request.waterLossLitersPerDay >= 200000) {
    rulesTriggered.push(`High-volume rupture: Estimated catastrophic loss of ${request.waterLossLitersPerDay.toLocaleString()} L/day`);
  }

  // Rule 4: Critical severity affecting large population
  if (request.severity === 'CRITICAL' && request.affectedHouseholds >= 1200) {
    rulesTriggered.push(`Widespread humanitarian impact: Critical severity affecting ${request.affectedHouseholds.toLocaleString()} households`);
  }

  // Rule 5: Manual administrative override
  if (request.isEmergencyOverride) {
    rulesTriggered.push('Operator priority override flagged by Executive Engineer');
  }

  const isEmergency = rulesTriggered.length > 0;

  // Escalation rule: Emergency job whose individual cost or hours exceed TOTAL resource ceiling
  const requiresManualEscalation = isEmergency && (
    request.estimatedCostInr > totalAvailableBudget ||
    request.estimatedLaborHours > totalAvailableHours
  );

  return {
    isEmergency,
    rulesTriggered,
    requiresManualEscalation,
  };
}
