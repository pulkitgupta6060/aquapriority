import { describe, it, expect } from 'vitest';
import { runGreedyOptimization } from '../src/algorithm/greedy';
import { RepairRequest, OptimizationConstraints } from '../src/types';

describe('Greedy Multi-Dimensional Optimization Engine', () => {
  const mockCandidates: RepairRequest[] = [
    {
      id: 'REQ-A',
      title: 'High Ratio Moderate Leak',
      description: 'Quick valve fix',
      wardId: 'W-01',
      wardName: 'Ward 1',
      zone: 'Central',
      location: { address: 'A St', lat: 28.6, lng: 77.2 },
      pipeMaterial: 'DI',
      pipeDiameterMm: 200,
      damageType: 'VALVE_FAILURE',
      severity: 'HIGH',
      waterLossLitersPerDay: 80000,
      affectedHouseholds: 1000,
      estimatedCostInr: 50000,
      estimatedLaborHours: 10,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 0.9,
      status: 'REPORTED',
      reportedAt: '2026-10-25T01:00:00Z',
    },
    {
      id: 'REQ-B',
      title: 'Huge Expensive Burst',
      description: 'Heavy main line burst',
      wardId: 'W-02',
      wardName: 'Ward 2',
      zone: 'North',
      location: { address: 'B St', lat: 28.7, lng: 77.2 },
      pipeMaterial: 'RCC',
      pipeDiameterMm: 600,
      damageType: 'BURST',
      severity: 'CRITICAL',
      waterLossLitersPerDay: 250000,
      affectedHouseholds: 3000,
      estimatedCostInr: 200000,
      estimatedLaborHours: 30,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 0.95,
      status: 'REPORTED',
      reportedAt: '2026-10-25T02:00:00Z',
    },
    {
      id: 'REQ-C',
      title: 'Small Rapid Patch',
      description: 'Pinhole fix',
      wardId: 'W-03',
      wardName: 'Ward 3',
      zone: 'East',
      location: { address: 'C St', lat: 28.6, lng: 77.3 },
      pipeMaterial: 'GI',
      pipeDiameterMm: 100,
      damageType: 'CORROSION',
      severity: 'LOW',
      waterLossLitersPerDay: 15000,
      affectedHouseholds: 200,
      estimatedCostInr: 20000,
      estimatedLaborHours: 5,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 0.85,
      status: 'REPORTED',
      reportedAt: '2026-10-25T03:00:00Z',
    },
    {
      id: 'REQ-D',
      title: 'Medium Joint Seal',
      description: 'Sleeve replacement',
      wardId: 'W-04',
      wardName: 'Ward 4',
      zone: 'West',
      location: { address: 'D St', lat: 28.6, lng: 77.1 },
      pipeMaterial: 'HDPE',
      pipeDiameterMm: 150,
      damageType: 'JOINT_LEAK',
      severity: 'MEDIUM',
      waterLossLitersPerDay: 35000,
      affectedHouseholds: 500,
      estimatedCostInr: 30000,
      estimatedLaborHours: 6,
      criticalFacility: 'NONE',
      contaminationRisk: false,
      confidenceScore: 0.9,
      status: 'REPORTED',
      reportedAt: '2026-10-25T04:00:00Z',
    },
  ];

  it('never exceeds budget or working-hour limits', () => {
    const constraints: OptimizationConstraints = {
      totalBudgetInr: 100000,
      totalLaborHours: 20,
      prioritizeEmergencies: false,
    };

    const result = runGreedyOptimization(mockCandidates, constraints);

    expect(result.allocatedBudget).toBeLessThanOrEqual(constraints.totalBudgetInr);
    expect(result.allocatedHours).toBeLessThanOrEqual(constraints.totalLaborHours);
    expect(result.remainingBudget).toBeGreaterThanOrEqual(0);
    expect(result.remainingHours).toBeGreaterThanOrEqual(0);
  });

  it('accurately tallies totals matching the individual selected items', () => {
    const constraints: OptimizationConstraints = {
      totalBudgetInr: 300000,
      totalLaborHours: 50,
      prioritizeEmergencies: true,
    };

    const result = runGreedyOptimization(mockCandidates, constraints);

    const calculatedCost = result.selectedJobs.reduce((sum, j) => sum + j.request.estimatedCostInr, 0);
    const calculatedHours = result.selectedJobs.reduce((sum, j) => sum + j.request.estimatedLaborHours, 0);
    const calculatedLoss = result.selectedJobs.reduce((sum, j) => sum + j.request.waterLossLitersPerDay, 0);
    const calculatedHouseholds = result.selectedJobs.reduce((sum, j) => sum + j.request.affectedHouseholds, 0);

    expect(result.allocatedBudget).toBe(calculatedCost);
    expect(result.allocatedHours).toBe(calculatedHours);
    expect(result.totalEstWaterSavedLitersPerDay).toBe(calculatedLoss);
    expect(result.totalEstHouseholdsProtected).toBe(calculatedHouseholds);
    expect(result.remainingBudget).toBe(constraints.totalBudgetInr - calculatedCost);
    expect(result.remainingHours).toBe(constraints.totalLaborHours - calculatedHours);
  });

  it('skips a candidate that exceeds remaining limits and continues checking subsequent candidates', () => {
    // Budget: 75,000 INR, Hours: 18
    // If a high-benefit expensive job (REQ-B: 200k) does not fit, it must NOT stop;
    // it should skip REQ-B and still select smaller fitting jobs like REQ-C (20k) and REQ-D (30k).
    const constraints: OptimizationConstraints = {
      totalBudgetInr: 60000,
      totalLaborHours: 15,
      prioritizeEmergencies: false,
    };

    const result = runGreedyOptimization(mockCandidates, constraints);

    // REQ-A costs 50,000, 10 hrs. Remaining: 10,000 INR, 5 hrs.
    // REQ-B costs 200k (fails), REQ-D costs 30k (fails budget), REQ-C costs 20k (fails budget).
    // Let's verify deferred jobs exist and specify reasons
    expect(result.deferredJobs.length).toBeGreaterThan(0);
    expect(result.deferredJobs.some(d => d.reasonCode.startsWith('EXCEEDS'))).toBe(true);

    // Now give budget 80,000 and hours 22:
    // REQ-A takes 50k / 10h -> leaves 30k / 12h
    // REQ-D takes 30k / 6h -> fits!
    const result2 = runGreedyOptimization(mockCandidates, {
      totalBudgetInr: 80000,
      totalLaborHours: 22,
      prioritizeEmergencies: false,
    });

    const selectedIds = result2.selectedJobs.map(j => j.request.id);
    expect(selectedIds).toContain('REQ-A');
    expect(selectedIds).toContain('REQ-D');
    // REQ-B was evaluated earlier in ranking or skipped, but smaller job REQ-D was accepted
    expect(selectedIds).not.toContain('REQ-B');
  });

  it('handles exact limit matches (where candidate cost exactly equals remaining budget)', () => {
    const item1: RepairRequest = { ...mockCandidates[0], id: 'EXACT-1', estimatedCostInr: 50000, estimatedLaborHours: 10 };
    const item2: RepairRequest = { ...mockCandidates[1], id: 'EXACT-2', estimatedCostInr: 50000, estimatedLaborHours: 10, damageType: 'VALVE_FAILURE' };

    const result = runGreedyOptimization([item1, item2], {
      totalBudgetInr: 100000,
      totalLaborHours: 20,
      prioritizeEmergencies: false,
    });

    expect(result.allocatedBudget).toBe(100000);
    expect(result.allocatedHours).toBe(20);
    expect(result.remainingBudget).toBe(0);
    expect(result.remainingHours).toBe(0);
    expect(result.selectedCount).toBe(2);
    expect(result.deferredCount).toBe(0);
  });

  it('handles insufficient resources (zero budget or hours) without throwing', () => {
    const resultZero = runGreedyOptimization(mockCandidates, {
      totalBudgetInr: 0,
      totalLaborHours: 0,
      prioritizeEmergencies: false,
    });

    expect(resultZero.selectedCount).toBe(0);
    expect(resultZero.allocatedBudget).toBe(0);
    expect(resultZero.allocatedHours).toBe(0);
    expect(resultZero.deferredCount).toBe(mockCandidates.length);
  });

  it('demonstrates input-order independence (permuting input yields identical selection)', () => {
    const constraints: OptimizationConstraints = {
      totalBudgetInr: 120000,
      totalLaborHours: 25,
      prioritizeEmergencies: true,
    };

    const order1 = [...mockCandidates];
    const order2 = [...mockCandidates].reverse();
    const order3 = [mockCandidates[2], mockCandidates[0], mockCandidates[3], mockCandidates[1]];

    const res1 = runGreedyOptimization(order1, constraints);
    const res2 = runGreedyOptimization(order2, constraints);
    const res3 = runGreedyOptimization(order3, constraints);

    const ids1 = res1.selectedJobs.map(j => j.request.id).sort();
    const ids2 = res2.selectedJobs.map(j => j.request.id).sort();
    const ids3 = res3.selectedJobs.map(j => j.request.id).sort();

    expect(ids1).toEqual(ids2);
    expect(ids2).toEqual(ids3);
    expect(res1.allocatedBudget).toBe(res2.allocatedBudget);
    expect(res1.totalBenefitScore).toBe(res2.totalBenefitScore);
  });

  it('maintains strict determinism across multiple runs', () => {
    const constraints: OptimizationConstraints = {
      totalBudgetInr: 150000,
      totalLaborHours: 30,
      prioritizeEmergencies: true,
    };

    const run1 = runGreedyOptimization(mockCandidates, constraints);
    const run2 = runGreedyOptimization(mockCandidates, constraints);

    expect(run1.selectedJobs.map(j => j.request.id)).toEqual(run2.selectedJobs.map(j => j.request.id));
    expect(run1.allocatedBudget).toBe(run2.allocatedBudget);
    expect(run1.allocatedHours).toBe(run2.allocatedHours);
    expect(run1.totalBenefitScore).toBe(run2.totalBenefitScore);
  });

  it('visibly flags unserviceable emergencies for manual escalation when remaining resources are insufficient', () => {
    const em1: RepairRequest = {
      ...mockCandidates[0],
      id: 'EM-1',
      criticalFacility: 'HOSPITAL',
      estimatedCostInr: 60000,
      estimatedLaborHours: 10,
    };
    const em2: RepairRequest = {
      ...mockCandidates[1],
      id: 'EM-2',
      criticalFacility: 'HOSPITAL',
      damageType: 'BURST',
      estimatedCostInr: 50000,
      estimatedLaborHours: 10,
    };

    const result = runGreedyOptimization([em1, em2], {
      totalBudgetInr: 80000,
      totalLaborHours: 15,
      prioritizeEmergencies: true,
    });

    // EM-2 has higher ratio (250k loss, 50k cost) so it is scheduled first
    expect(result.selectedCount).toBe(1);
    expect(result.selectedJobs[0].request.id).toBe('EM-2');
    // EM-1 requires 60k but only 30k remains; unserviceable emergency is flagged for manual escalation
    expect(result.escalatedCount).toBe(1);
    expect(result.escalatedEmergencyJobs[0].scoredRepair.request.id).toBe('EM-1');
    expect(result.deferredJobs.some(d => d.scoredRepair.request.id === 'EM-1' && d.reasonCode === 'MANUAL_ESCALATION_REQUIRED')).toBe(true);
  });
});
