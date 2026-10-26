import { describe, it, expect } from 'vitest';
import { validateRepairRequest, filterAndValidateRequests } from '../src/algorithm/validator';
import { RepairRequest } from '../src/types';

describe('Validator Pipeline', () => {
  const sampleValidRequest: RepairRequest = {
    id: 'REQ-TEST-001',
    title: 'Valid Pipe Repair Test',
    description: 'Test description',
    wardId: 'W-01',
    wardName: 'Heritage Ward',
    zone: 'Central',
    location: { address: 'Plot 10', lat: 28.6, lng: 77.2 },
    pipeMaterial: 'DI',
    pipeDiameterMm: 300,
    damageType: 'BURST',
    severity: 'HIGH',
    waterLossLitersPerDay: 50000,
    affectedHouseholds: 500,
    estimatedCostInr: 60000,
    estimatedLaborHours: 12,
    criticalFacility: 'HOSPITAL',
    contaminationRisk: false,
    confidenceScore: 0.9,
    status: 'REPORTED',
    reportedAt: '2026-10-25T10:00:00Z',
  };

  it('accepts a fully compliant repair request', () => {
    const res = validateRepairRequest(sampleValidRequest);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('rejects null or non-object input', () => {
    expect(validateRepairRequest(null).isValid).toBe(false);
    expect(validateRepairRequest(undefined).isValid).toBe(false);
    expect(validateRepairRequest('not an object').isValid).toBe(false);
  });

  it('rejects missing or empty ID', () => {
    const invalid = { ...sampleValidRequest, id: '' };
    const res = validateRepairRequest(invalid);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.field === 'id')).toBe(true);
  });

  it('rejects negative or zero costs and labor hours', () => {
    const invalidCost = { ...sampleValidRequest, estimatedCostInr: -500 };
    expect(validateRepairRequest(invalidCost).isValid).toBe(false);

    const zeroCost = { ...sampleValidRequest, estimatedCostInr: 0 };
    expect(validateRepairRequest(zeroCost).isValid).toBe(false);

    const invalidHours = { ...sampleValidRequest, estimatedLaborHours: -2 };
    expect(validateRepairRequest(invalidHours).isValid).toBe(false);

    const zeroHours = { ...sampleValidRequest, estimatedLaborHours: 0 };
    expect(validateRepairRequest(zeroHours).isValid).toBe(false);
  });

  it('rejects negative water loss or negative households', () => {
    const negLoss = { ...sampleValidRequest, waterLossLitersPerDay: -100 };
    expect(validateRepairRequest(negLoss).isValid).toBe(false);

    const negHouse = { ...sampleValidRequest, affectedHouseholds: -5 };
    expect(validateRepairRequest(negHouse).isValid).toBe(false);
  });

  it('detects and eliminates duplicate IDs in a batch', () => {
    const batch = [
      sampleValidRequest,
      { ...sampleValidRequest, title: 'Duplicate 1' },
      { ...sampleValidRequest, id: 'REQ-TEST-002', title: 'Unique second request' },
    ];

    const result = filterAndValidateRequests(batch);
    expect(result.validRequests.length).toBe(2);
    expect(result.rejectedDuplicates.length).toBe(1);
    expect(result.rejectedDuplicates[0].request.id).toBe('REQ-TEST-001');
  });

  it('filters out COMPLETED and CANCELLED requests from active optimization pool', () => {
    const batch: RepairRequest[] = [
      sampleValidRequest,
      { ...sampleValidRequest, id: 'REQ-TEST-002', status: 'COMPLETED' },
      { ...sampleValidRequest, id: 'REQ-TEST-003', status: 'CANCELLED' },
      { ...sampleValidRequest, id: 'REQ-TEST-004', status: 'SCHEDULED' },
    ];

    const result = filterAndValidateRequests(batch);
    expect(result.validRequests.length).toBe(2);
    expect(result.validRequests.map(r => r.id)).toEqual(['REQ-TEST-001', 'REQ-TEST-004']);
    expect(result.filteredStatus.length).toBe(2);
  });

  it('handles empty input gracefully', () => {
    const result = filterAndValidateRequests([]);
    expect(result.validRequests.length).toBe(0);
    expect(result.rejectedDuplicates.length).toBe(0);
    expect(result.rejectedInvalid.length).toBe(0);
  });

  it('safely handles non-array input without crashing', () => {
    const res1 = filterAndValidateRequests(null as any);
    expect(res1.validRequests.length).toBe(0);

    const res2 = filterAndValidateRequests(undefined as any);
    expect(res2.validRequests.length).toBe(0);
  });
});
