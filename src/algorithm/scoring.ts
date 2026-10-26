import { RepairRequest, OptimizationWeights, ScoredRepair } from '../types';
import { classifyEmergency } from './emergency';

export const DEFAULT_WEIGHTS: OptimizationWeights = {
  waterLossWeight: 0.35,
  householdsWeight: 0.25,
  severityWeight: 0.25,
  criticalFacilityWeight: 0.15,
};

const SEVERITY_FACTORS: Record<string, number> = {
  CRITICAL: 3.0,
  HIGH: 2.0,
  MEDIUM: 1.4,
  LOW: 1.0,
};

const FACILITY_FACTORS: Record<string, number> = {
  HOSPITAL: 1.0,
  DIALYSIS_CENTER: 0.95,
  FIRE_STATION: 0.75,
  SCHOOL: 0.60,
  RAILWAY_STATION: 0.50,
  DENSE_RESIDENTIAL: 0.40,
  NONE: 0.0,
};

/**
 * Calculates transparent, explainable benefit scores and resource ratios
 * for an entire batch of validated repair requests.
 */
export function scoreRequests(
  requests: RepairRequest[],
  weights: OptimizationWeights = DEFAULT_WEIGHTS,
  totalBudgetInr: number,
  totalLaborHours: number
): ScoredRepair[] {
  if (requests.length === 0) return [];

  // Determine normalizer maximums across the batch
  let maxLoss = 1;
  let maxHouseholds = 1;

  for (const r of requests) {
    if (r.waterLossLitersPerDay > maxLoss) maxLoss = r.waterLossLitersPerDay;
    if (r.affectedHouseholds > maxHouseholds) maxHouseholds = r.affectedHouseholds;
  }

  // Normalize weight sum to 1.0 to prevent scaling distortion
  const totalWeight =
    (weights.waterLossWeight || 0) +
    (weights.householdsWeight || 0) +
    (weights.severityWeight || 0) +
    (weights.criticalFacilityWeight || 0);

  const wLoss = (weights.waterLossWeight || 0) / (totalWeight || 1);
  const wHouse = (weights.householdsWeight || 0) / (totalWeight || 1);
  const wSev = (weights.severityWeight || 0) / (totalWeight || 1);
  const wFac = (weights.criticalFacilityWeight || 0) / (totalWeight || 1);

  return requests.map((req) => {
    // 1. Normalized Water Loss [0, 1]
    const normalizedLoss = Math.min(1, Math.max(0, req.waterLossLitersPerDay / maxLoss));

    // 2. Normalized Households [0, 1]
    const normalizedHouseholds = Math.min(1, Math.max(0, req.affectedHouseholds / maxHouseholds));

    // 3. Severity Multiplier normalized [0, 1]
    const sevVal = SEVERITY_FACTORS[req.severity] ?? 1.0;
    const normalizedSeverity = (sevVal - 1.0) / 2.0; // maps [1.0, 3.0] -> [0, 1]

    // 4. Critical Facility factor [0, 1]
    const facilityBonus = FACILITY_FACTORS[req.criticalFacility] ?? 0.0;

    // 5. Raw benefit composite (scale of 0 to 100)
    const rawScore = 100 * (
      wLoss * normalizedLoss +
      wHouse * normalizedHouseholds +
      wSev * normalizedSeverity +
      wFac * facilityBonus
    );

    // 6. Uncertainty discount: Sensor confidence factor in [0.70, 1.00]
    const clampedConfidence = Math.max(0.1, Math.min(1.0, req.confidenceScore ?? 0.8));
    const confidenceFactor = 0.70 + 0.30 * clampedConfidence;

    // Final Benefit Score
    const benefitScore = Number((rawScore * confidenceFactor).toFixed(4));

    // 7. Resource footprint consumption relative to constraints
    const safeBudget = Math.max(totalBudgetInr, 1);
    const safeHours = Math.max(totalLaborHours, 1);
    const normCost = req.estimatedCostInr / safeBudget;
    const normHours = req.estimatedLaborHours / safeHours;
    // Balanced multi-dimensional resource score
    const resourceScore = Math.max(0.0001, (normCost + normHours) / 2);

    // 8. Benefit-to-resource ratio
    const benefitRatio = Number((benefitScore / resourceScore).toFixed(4));

    // Emergency check
    const emergencyInfo = classifyEmergency(req, totalBudgetInr, totalLaborHours);

    // Human-readable explanation breakdown
    const scoreExplanation = 
      `Benefit Score: ${benefitScore.toFixed(2)} | ` +
      `Loss: ${(normalizedLoss * 100).toFixed(0)}% (w=${(wLoss * 100).toFixed(0)}%) + ` +
      `Households: ${(normalizedHouseholds * 100).toFixed(0)}% (w=${(wHouse * 100).toFixed(0)}%) + ` +
      `Severity: ${req.severity} (w=${(wSev * 100).toFixed(0)}%) + ` +
      `Facility: ${req.criticalFacility} (w=${(wFac * 100).toFixed(0)}%) × ` +
      `Confidence: ${(confidenceFactor * 100).toFixed(0)}% | ` +
      `Resource Footprint: ${(resourceScore * 100).toFixed(2)}% | ` +
      `Ratio: ${benefitRatio.toFixed(1)}`;

    return {
      request: req,
      benefitScore,
      normalizedLoss,
      normalizedHouseholds,
      severityMultiplier: sevVal,
      facilityBonus,
      confidenceFactor,
      resourceScore,
      benefitRatio,
      isEmergency: emergencyInfo.isEmergency,
      emergencyReasons: emergencyInfo.rulesTriggered,
      scoreExplanation,
    };
  });
}
