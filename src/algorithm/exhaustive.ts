import { ScoredRepair } from '../types';

export interface ExhaustiveResult {
  optimalSelectedJobs: ScoredRepair[];
  optimalBenefitScore: number;
  totalCost: number;
  totalHours: number;
  subsetsEvaluated: number;
}

/**
 * Exhaustive Search Solver (Optimal 0/1 Multi-Dimensional Knapsack Benchmark).
 * Used for small test batches (N <= 20) to establish the true global optimum
 * benchmark to test greedy heuristic accuracy and identify suboptimality gaps.
 */
export function runExhaustiveKnapsack(
  candidates: ScoredRepair[],
  budgetLimit: number,
  hoursLimit: number
): ExhaustiveResult {
  const n = candidates.length;
  if (n === 0) {
    return {
      optimalSelectedJobs: [],
      optimalBenefitScore: 0,
      totalCost: 0,
      totalHours: 0,
      subsetsEvaluated: 1,
    };
  }

  // Cap at 20 candidates to avoid 2^N explosion (2^20 ~ 1M iterations)
  const safeCandidates = candidates.slice(0, 20);
  const count = safeCandidates.length;

  let bestScore = -1;
  let bestSelection: ScoredRepair[] = [];
  let bestCost = 0;
  let bestHours = 0;
  let subsetsEvaluated = 0;

  // Use branch & bound or bitmask enumeration
  const totalSubsets = 1 << count;

  for (let mask = 0; mask < totalSubsets; mask++) {
    subsetsEvaluated++;
    let currentCost = 0;
    let currentHours = 0;
    let currentScore = 0;
    const currentJobs: ScoredRepair[] = [];
    let fits = true;

    for (let i = 0; i < count; i++) {
      if ((mask & (1 << i)) !== 0) {
        const item = safeCandidates[i];
        currentCost += item.request.estimatedCostInr;
        currentHours += item.request.estimatedLaborHours;
        currentScore += item.benefitScore;

        if (currentCost > budgetLimit || currentHours > hoursLimit) {
          fits = false;
          break;
        }
        currentJobs.push(item);
      }
    }

    if (fits && currentScore > bestScore) {
      bestScore = currentScore;
      bestSelection = currentJobs;
      bestCost = currentCost;
      bestHours = currentHours;
    }
  }

  return {
    optimalSelectedJobs: bestSelection,
    optimalBenefitScore: Number(bestScore >= 0 ? bestScore.toFixed(4) : 0),
    totalCost: bestCost,
    totalHours: bestHours,
    subsetsEvaluated,
  };
}
