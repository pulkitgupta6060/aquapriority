import {
  RepairRequest,
  OptimizationConstraints,
  OptimizationWeights,
  OptimizationResult,
  ScoredRepair,
  DeferredJob,
  EscalatedEmergencyJob,
  DeferralReasonCode,
} from '../types';
import { filterAndValidateRequests } from './validator';
import { scoreRequests, DEFAULT_WEIGHTS } from './scoring';
import { classifyEmergency } from './emergency';

export const GREEDY_ALGORITHM_DISCLAIMER =
  'Multi-dimensional greedy selection provides an O(N log N) deterministic operational schedule. ' +
  'While near-optimal in practice, greedy heuristics are not guaranteed to achieve the mathematical global optimum ' +
  'for the multi-dimensional knapsack problem (which is NP-hard). All water savings and household impacts ' +
  'are operational model estimates, not actual audited municipal savings.';

/**
 * Pure TypeScript implementation of the Multi-Dimensional Greedy Pipeline.
 *
 * Pipeline stages:
 * 1. Validate inputs and reject invalid data.
 * 2. Filter completed/cancelled requests and detect duplicate IDs.
 * 3. Classify emergencies using explicit rules; flag critical jobs that cannot fit available resources for manual escalation.
 * 4. Calculate transparent benefit scores from normalized water-loss impact, affected households, severity and uncertainty.
 * 5. Rank repairs deterministically using documented benefit/resource ratio and stable tie-breaking.
 * 6. Select indivisible repairs only when BOTH budget and working-hour constraints fit.
 * 7. If a repair does not fit, record the exact deferral reason and continue checking later candidates.
 * 8. Return selected/deferred jobs, score explanations, totals, remaining resources and estimated impact.
 * 9. Never exceed budget or working-hour limits. Never claim greedy is globally optimal.
 */
export function runGreedyOptimization(
  rawRequests: RepairRequest[],
  constraints: OptimizationConstraints,
  weights: OptimizationWeights = DEFAULT_WEIGHTS
): OptimizationResult {
  const startTime = performance.now();

  const totalBudgetLimit = Math.max(0, constraints.totalBudgetInr);
  const totalHoursLimit = Math.max(0, constraints.totalLaborHours);
  const prioritizeEmergencies = constraints.prioritizeEmergencies ?? true;

  // Step 1 & 2: Filter and Validate
  const {
    validRequests,
    rejectedDuplicates,
    rejectedInvalid,
    filteredStatus,
  } = filterAndValidateRequests(rawRequests);

  // Step 3 & 4: Score valid requests with transparent weights
  const scoredCandidates = scoreRequests(validRequests, weights, totalBudgetLimit, totalHoursLimit);

  // Identify manual escalation emergencies
  const candidatesToConsider: ScoredRepair[] = [];
  const initialEscalatedEmergencyJobs: EscalatedEmergencyJob[] = [];

  for (const candidate of scoredCandidates) {
    const classification = classifyEmergency(candidate.request, totalBudgetLimit, totalHoursLimit);
    if (classification.requiresManualEscalation) {
      initialEscalatedEmergencyJobs.push({
        scoredRepair: candidate,
        reason: `Emergency repair requires ₹${candidate.request.estimatedCostInr.toLocaleString('en-IN')} and ${candidate.request.estimatedLaborHours} hrs, which exceeds the total scheduled limits (₹${totalBudgetLimit.toLocaleString('en-IN')}, ${totalHoursLimit} hrs). Flagged for executive escalation.`,
        requiredBudget: candidate.request.estimatedCostInr,
        requiredHours: candidate.request.estimatedLaborHours,
        availableBudget: totalBudgetLimit,
        availableHours: totalHoursLimit,
        deficitBudget: Math.max(0, candidate.request.estimatedCostInr - totalBudgetLimit),
        deficitHours: Math.max(0, candidate.request.estimatedLaborHours - totalHoursLimit),
      });
      // Escalated jobs cannot fit inside scheduled run; they require out-of-band dispatch
    } else {
      candidatesToConsider.push(candidate);
    }
  }

  // Step 5: Deterministic Ranking with multi-level tie-breaking
  // Stable sorting ensures 100% input-order independence
  const sortedCandidates = [...candidatesToConsider].sort((a, b) => {
    // Level 1: Emergencies first if prioritization is enabled
    if (prioritizeEmergencies) {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
    }

    // Level 2: Benefit-to-resource ratio descending (Primary heuristic)
    const ratioDiff = b.benefitRatio - a.benefitRatio;
    if (Math.abs(ratioDiff) > 1e-5) {
      return ratioDiff;
    }

    // Level 3: Benefit score descending
    const benefitDiff = b.benefitScore - a.benefitScore;
    if (Math.abs(benefitDiff) > 1e-4) {
      return benefitDiff;
    }

    // Level 4: Estimated cost ascending (leaner jobs preferred when equal ratio)
    const costDiff = a.request.estimatedCostInr - b.request.estimatedCostInr;
    if (costDiff !== 0) {
      return costDiff;
    }

    // Level 5: Unique ID ascending (strict deterministic tie-breaker)
    return a.request.id.localeCompare(b.request.id);
  });

  // Step 6 & 7: Greedy selection with indivisible 2D constraints
  let remainingBudget = totalBudgetLimit;
  let remainingHours = totalHoursLimit;
  let allocatedBudget = 0;
  let allocatedHours = 0;

  let totalEstWaterSavedLitersPerDay = 0;
  let totalEstHouseholdsProtected = 0;
  let totalBenefitScore = 0;

  const selectedJobs: ScoredRepair[] = [];
  const deferredJobs: DeferredJob[] = [];
  const runtimeEscalatedEmergencyJobs: EscalatedEmergencyJob[] = [];

  for (const candidate of sortedCandidates) {
    const cost = candidate.request.estimatedCostInr;
    const hours = candidate.request.estimatedLaborHours;

    const fitsBudget = cost <= remainingBudget;
    const fitsHours = hours <= remainingHours;

    if (fitsBudget && fitsHours) {
      // Step 6: Select job
      selectedJobs.push(candidate);
      allocatedBudget += cost;
      allocatedHours += hours;
      remainingBudget -= cost;
      remainingHours -= hours;

      totalEstWaterSavedLitersPerDay += candidate.request.waterLossLitersPerDay;
      totalEstHouseholdsProtected += candidate.request.affectedHouseholds;
      totalBenefitScore += candidate.benefitScore;
    } else {
      // Step 7: Record exact deferral reason and CONTINUE checking later candidates
      let reasonCode: DeferralReasonCode = 'EXCEEDS_BOTH_CONSTRAINTS';
      let reasonDescription = '';

      if (!fitsBudget && !fitsHours) {
        reasonCode = 'EXCEEDS_BOTH_CONSTRAINTS';
        reasonDescription = `Exceeds remaining budget by ₹${(cost - remainingBudget).toLocaleString('en-IN')} and remaining labor by ${(hours - remainingHours).toFixed(1)} hrs.`;
      } else if (!fitsBudget) {
        reasonCode = 'EXCEEDS_BUDGET';
        reasonDescription = `Requires ₹${cost.toLocaleString('en-IN')} but only ₹${remainingBudget.toLocaleString('en-IN')} budget remains (deficit: ₹${(cost - remainingBudget).toLocaleString('en-IN')}).`;
      } else {
        reasonCode = 'EXCEEDS_LABOR_HOURS';
        reasonDescription = `Requires ${hours} hrs but only ${remainingHours.toFixed(1)} crew hrs remain (deficit: ${(hours - remainingHours).toFixed(1)} hrs).`;
      }

      // If an emergency cannot fit remaining capacity, visibly flag for manual escalation
      if (candidate.isEmergency) {
        reasonCode = 'MANUAL_ESCALATION_REQUIRED';
        reasonDescription = `[UNSERVICEABLE EMERGENCY] ${reasonDescription} Flagged for manual executive escalation.`;
        runtimeEscalatedEmergencyJobs.push({
          scoredRepair: candidate,
          reason: `Critical emergency repair requiring ₹${cost.toLocaleString('en-IN')} and ${hours} hrs could not be scheduled within remaining resources (remaining: ₹${remainingBudget.toLocaleString('en-IN')}, ${remainingHours.toFixed(1)} hrs). Flagged for manual executive escalation.`,
          requiredBudget: cost,
          requiredHours: hours,
          availableBudget: remainingBudget,
          availableHours: remainingHours,
          deficitBudget: Math.max(0, cost - remainingBudget),
          deficitHours: Math.max(0, hours - remainingHours),
        });
      }

      deferredJobs.push({
        scoredRepair: candidate,
        reasonCode,
        reasonDescription,
        remainingBudgetAtAttempt: remainingBudget,
        remainingHoursAtAttempt: remainingHours,
        deficitBudget: Math.max(0, cost - remainingBudget),
        deficitHours: Math.max(0, hours - remainingHours),
      });
    }
  }

  // Combine initial over-capacity emergencies and runtime unserviceable emergencies
  const escalatedEmergencyJobs: EscalatedEmergencyJob[] = [
    ...initialEscalatedEmergencyJobs,
    ...runtimeEscalatedEmergencyJobs,
  ];

  // Include initial over-capacity emergencies into deferred jobs list with explicit code
  for (const esc of initialEscalatedEmergencyJobs) {
    deferredJobs.push({
      scoredRepair: esc.scoredRepair,
      reasonCode: 'MANUAL_ESCALATION_REQUIRED',
      reasonDescription: esc.reason,
      remainingBudgetAtAttempt: totalBudgetLimit,
      remainingHoursAtAttempt: totalHoursLimit,
      deficitBudget: esc.deficitBudget,
      deficitHours: esc.deficitHours,
    });
  }

  const executionTimeMs = performance.now() - startTime;

  const budgetUtilizationPercent =
    totalBudgetLimit > 0 ? (allocatedBudget / totalBudgetLimit) * 100 : 0;
  const hoursUtilizationPercent =
    totalHoursLimit > 0 ? (allocatedHours / totalHoursLimit) * 100 : 0;

  // Step 8 & 9: Return structured result
  return {
    selectedJobs,
    deferredJobs,
    escalatedEmergencyJobs,

    totalBudgetLimit,
    totalHoursLimit,
    allocatedBudget,
    allocatedHours,
    remainingBudget,
    remainingHours,
    budgetUtilizationPercent: Number(budgetUtilizationPercent.toFixed(2)),
    hoursUtilizationPercent: Number(hoursUtilizationPercent.toFixed(2)),

    totalEstWaterSavedLitersPerDay,
    totalEstHouseholdsProtected,
    totalBenefitScore: Number(totalBenefitScore.toFixed(2)),

    totalCandidatesConsidered: validRequests.length,
    selectedCount: selectedJobs.length,
    deferredCount: deferredJobs.length,
    escalatedCount: escalatedEmergencyJobs.length,
    rejectedInvalidCount: rejectedInvalid.length,
    filteredStatusCount: filteredStatus.length + rejectedDuplicates.length,
    executionTimeMs: Number(executionTimeMs.toFixed(3)),

    algorithmName: 'Deterministic Multi-Dimensional Greedy Heuristic (O(N log N))',
    algorithmDisclaimer: GREEDY_ALGORITHM_DISCLAIMER,
    timestamp: new Date().toISOString(),
  };
}
