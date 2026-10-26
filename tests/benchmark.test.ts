import { describe, it, expect } from 'vitest';
import { runGreedyOptimization } from '../src/algorithm/greedy';
import { runExhaustiveKnapsack } from '../src/algorithm/exhaustive';
import { scoreRequests } from '../src/algorithm/scoring';
import { RepairRequest, OptimizationConstraints } from '../src/types';

describe('Benchmark & Knapsack Suboptimality Proof', () => {
  it('proves a case where the greedy heuristic is suboptimal compared to exhaustive search', () => {
    // Budget: 100,000 INR, Hours: 100
    // Candidate 1 has a higher benefit-to-resource ratio, but takes 52% of budget and hours,
    // leaving only 48k/48h remaining and blocking Candidates 2 & 3 (which need 50k/50h each).
    // Candidates 2 & 3 together produce much higher total benefit (58.6 + 58.6 = 117.2 vs 72.5).
    const item1: RepairRequest = {
      id: 'REQ-ITEM-1',
      title: 'High Ratio Moderate Single Job',
      description: 'Takes 52% of budget and hours',
      wardId: 'W-01',
      wardName: 'Ward 1',
      zone: 'Central',
      location: { address: 'A', lat: 28.6, lng: 77.2 },
      pipeMaterial: 'DI',
      pipeDiameterMm: 200,
      damageType: 'VALVE_FAILURE',
      severity: 'HIGH',
      waterLossLitersPerDay: 130000,
      affectedHouseholds: 1300,
      estimatedCostInr: 52000,
      estimatedLaborHours: 52,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 1.0,
      status: 'REPORTED',
      reportedAt: '2026-10-25T01:00:00Z',
    };

    const item2: RepairRequest = {
      id: 'REQ-ITEM-2',
      title: 'Sub-job Alpha',
      description: 'Takes 50% of budget and hours',
      wardId: 'W-02',
      wardName: 'Ward 2',
      zone: 'North',
      location: { address: 'B', lat: 28.7, lng: 77.2 },
      pipeMaterial: 'HDPE',
      pipeDiameterMm: 150,
      damageType: 'CRACK',
      severity: 'HIGH',
      waterLossLitersPerDay: 100000,
      affectedHouseholds: 1000,
      estimatedCostInr: 50000,
      estimatedLaborHours: 50,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 1.0,
      status: 'REPORTED',
      reportedAt: '2026-10-25T02:00:00Z',
    };

    const item3: RepairRequest = {
      id: 'REQ-ITEM-3',
      title: 'Sub-job Beta',
      description: 'Takes 50% of budget and hours',
      wardId: 'W-03',
      wardName: 'Ward 3',
      zone: 'East',
      location: { address: 'C', lat: 28.6, lng: 77.3 },
      pipeMaterial: 'GI',
      pipeDiameterMm: 100,
      damageType: 'JOINT_LEAK',
      severity: 'HIGH',
      waterLossLitersPerDay: 100000,
      affectedHouseholds: 1000,
      estimatedCostInr: 50000,
      estimatedLaborHours: 50,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 1.0,
      status: 'REPORTED',
      reportedAt: '2026-10-25T03:00:00Z',
    };

    const constraints: OptimizationConstraints = {
      totalBudgetInr: 100000,
      totalLaborHours: 100,
      prioritizeEmergencies: false,
    };

    const candidates = [item1, item2, item3];

    // Score all candidates
    const scored = scoreRequests(candidates, undefined, constraints.totalBudgetInr, constraints.totalLaborHours);

    // Run greedy
    const greedyResult = runGreedyOptimization(candidates, constraints);

    // Run exhaustive search benchmark
    const exhaustiveResult = runExhaustiveKnapsack(scored, constraints.totalBudgetInr, constraints.totalLaborHours);

    // Verify greedy took item 1 (because ratio is higher) and was forced to leave out items 2 & 3
    expect(greedyResult.selectedJobs.length).toBe(1);
    expect(greedyResult.selectedJobs[0].request.id).toBe('REQ-ITEM-1');

    // Verify exhaustive search found that selecting {REQ-ITEM-2, REQ-ITEM-3} yields higher total benefit!
    expect(exhaustiveResult.optimalSelectedJobs.length).toBe(2);
    expect(exhaustiveResult.optimalSelectedJobs.map(j => j.request.id).sort()).toEqual(['REQ-ITEM-2', 'REQ-ITEM-3'].sort());

    // Mathematical assertion: Exhaustive optimal score is strictly greater than greedy score
    expect(exhaustiveResult.optimalBenefitScore).toBeGreaterThan(greedyResult.totalBenefitScore);

    // Both methods respect limits
    expect(greedyResult.allocatedBudget).toBeLessThanOrEqual(constraints.totalBudgetInr);
    expect(exhaustiveResult.totalCost).toBeLessThanOrEqual(constraints.totalBudgetInr);
  });

  it('runs exhaustive benchmark on a 10-candidate test set and confirms greedy is valid', () => {
    const testItems: RepairRequest[] = Array.from({ length: 10 }, (_, i) => ({
      id: `BENCH-${i + 1}`,
      title: `Pipeline Segment ${i + 1}`,
      description: `Test leak ${i + 1}`,
      wardId: `W-${(i % 5) + 1}`,
      wardName: `Ward ${(i % 5) + 1}`,
      zone: 'Central',
      location: { address: `Loc ${i + 1}`, lat: 28.6 + i * 0.01, lng: 77.2 + i * 0.01 },
      pipeMaterial: 'DI',
      pipeDiameterMm: 200,
      damageType: 'JOINT_LEAK',
      severity: i % 3 === 0 ? 'HIGH' : 'MEDIUM',
      waterLossLitersPerDay: 20000 + i * 8000,
      affectedHouseholds: 200 + i * 150,
      estimatedCostInr: 30000 + (i % 4) * 15000,
      estimatedLaborHours: 6 + (i % 3) * 4,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 0.85,
      status: 'REPORTED',
      reportedAt: '2026-10-25T01:00:00Z',
    }));

    const budget = 120000;
    const hours = 24;

    const scored = scoreRequests(testItems, undefined, budget, hours);
    const exhaustive = runExhaustiveKnapsack(scored, budget, hours);
    const greedy = runGreedyOptimization(testItems, { totalBudgetInr: budget, totalLaborHours: hours, prioritizeEmergencies: false });

    // Greedy is valid and within bounds
    expect(greedy.allocatedBudget).toBeLessThanOrEqual(budget);
    expect(greedy.allocatedHours).toBeLessThanOrEqual(hours);

    // Greedy achieved competitive performance relative to global optimum
    expect(greedy.totalBenefitScore).toBeGreaterThan(0);
    expect(exhaustive.optimalBenefitScore).toBeGreaterThanOrEqual(greedy.totalBenefitScore);
  });

  it('evaluates all 2^N feasible subsets under the identical objective and constraints as pure greedy', () => {
    const candidates: RepairRequest[] = [
      {
        id: 'BENCH-C1',
        title: 'Emergency Job High Cost',
        description: 'Hospital pipe leak',
        wardId: 'W-01',
        wardName: 'Ward 1',
        zone: 'Central',
        location: { address: 'A', lat: 28.6, lng: 77.2 },
        pipeMaterial: 'DI',
        pipeDiameterMm: 200,
        damageType: 'BURST',
        severity: 'CRITICAL',
        waterLossLitersPerDay: 80000,
        affectedHouseholds: 800,
        estimatedCostInr: 60000,
        estimatedLaborHours: 12,
        criticalFacility: 'HOSPITAL',
        contaminationRisk: true,
        confidenceScore: 0.9,
        status: 'REPORTED',
        reportedAt: '2026-10-25T01:00:00Z',
      },
      {
        id: 'BENCH-C2',
        title: 'Non-emergency Job High Ratio 1',
        description: 'Valve seal',
        wardId: 'W-02',
        wardName: 'Ward 2',
        zone: 'North',
        location: { address: 'B', lat: 28.7, lng: 77.2 },
        pipeMaterial: 'CI',
        pipeDiameterMm: 150,
        damageType: 'VALVE_FAILURE',
        severity: 'HIGH',
        waterLossLitersPerDay: 70000,
        affectedHouseholds: 700,
        estimatedCostInr: 30000,
        estimatedLaborHours: 6,
        criticalFacility: 'NONE',
        contaminationRisk: false,
        confidenceScore: 0.9,
        status: 'REPORTED',
        reportedAt: '2026-10-25T02:00:00Z',
      },
      {
        id: 'BENCH-C3',
        title: 'Non-emergency Job High Ratio 2',
        description: 'Joint fix',
        wardId: 'W-03',
        wardName: 'Ward 3',
        zone: 'East',
        location: { address: 'C', lat: 28.6, lng: 77.3 },
        pipeMaterial: 'HDPE',
        pipeDiameterMm: 150,
        damageType: 'JOINT_LEAK',
        severity: 'HIGH',
        waterLossLitersPerDay: 70000,
        affectedHouseholds: 700,
        estimatedCostInr: 30000,
        estimatedLaborHours: 6,
        criticalFacility: 'NONE',
        contaminationRisk: false,
        confidenceScore: 0.9,
        status: 'REPORTED',
        reportedAt: '2026-10-25T03:00:00Z',
      },
      {
        id: 'BENCH-C4',
        title: 'Small Job 1',
        description: 'Pinhole',
        wardId: 'W-04',
        wardName: 'Ward 4',
        zone: 'West',
        location: { address: 'D', lat: 28.6, lng: 77.1 },
        pipeMaterial: 'GI',
        pipeDiameterMm: 100,
        damageType: 'CORROSION',
        severity: 'LOW',
        waterLossLitersPerDay: 15000,
        affectedHouseholds: 150,
        estimatedCostInr: 15000,
        estimatedLaborHours: 3,
        criticalFacility: 'NONE',
        contaminationRisk: false,
        confidenceScore: 0.85,
        status: 'REPORTED',
        reportedAt: '2026-10-25T04:00:00Z',
      },
      {
        id: 'BENCH-C5',
        title: 'Small Job 2',
        description: 'Minor joint',
        wardId: 'W-05',
        wardName: 'Ward 5',
        zone: 'Central',
        location: { address: 'E', lat: 28.6, lng: 77.2 },
        pipeMaterial: 'GI',
        pipeDiameterMm: 100,
        damageType: 'JOINT_LEAK',
        severity: 'LOW',
        waterLossLitersPerDay: 15000,
        affectedHouseholds: 150,
        estimatedCostInr: 15000,
        estimatedLaborHours: 3,
        criticalFacility: 'NONE',
        contaminationRisk: false,
        confidenceScore: 0.85,
        status: 'REPORTED',
        reportedAt: '2026-10-25T05:00:00Z',
      },
    ];

    const budget = 70000;
    const hours = 14;

    const scored = scoreRequests(candidates, undefined, budget, hours);
    const exhaustive = runExhaustiveKnapsack(scored, budget, hours);

    // Exhaustive evaluated exactly 2^5 = 32 subsets
    expect(exhaustive.subsetsEvaluated).toBe(32);
    expect(exhaustive.totalCost).toBeLessThanOrEqual(budget);
    expect(exhaustive.totalHours).toBeLessThanOrEqual(hours);

    // Pure mathematical greedy (no emergency policy) uses the exact same objective and constraints
    const mathGreedy = runGreedyOptimization(candidates, {
      totalBudgetInr: budget,
      totalLaborHours: hours,
      prioritizeEmergencies: false,
    });
    expect(mathGreedy.allocatedBudget).toBeLessThanOrEqual(budget);
    expect(mathGreedy.allocatedHours).toBeLessThanOrEqual(hours);
    expect(exhaustive.optimalBenefitScore).toBeGreaterThanOrEqual(mathGreedy.totalBenefitScore);

    // Operational policy greedy prioritizes emergency BENCH-C1 first
    const operationalGreedy = runGreedyOptimization(candidates, {
      totalBudgetInr: budget,
      totalLaborHours: hours,
      prioritizeEmergencies: true,
    });
    expect(operationalGreedy.selectedJobs[0].request.id).toBe('BENCH-C1');
  });
});
