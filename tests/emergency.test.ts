import { describe, it, expect } from 'vitest';
import { classifyEmergency } from '../src/algorithm/emergency';
import { RepairRequest } from '../src/types';

describe('Emergency Classification & Escalation Engine', () => {
  const baseRequest: RepairRequest = {
    id: 'REQ-EMERG-001',
    title: 'Hospital Feeder Rupture',
    description: 'Critical line supply',
    wardId: 'W-01',
    wardName: 'Central Ward',
    zone: 'Central',
    location: { address: 'Main Rd', lat: 28.6, lng: 77.2 },
    pipeMaterial: 'DI',
    pipeDiameterMm: 500,
    damageType: 'BURST',
    severity: 'HIGH',
    waterLossLitersPerDay: 50000,
    affectedHouseholds: 300,
    estimatedCostInr: 80000,
    estimatedLaborHours: 12,
    criticalFacility: 'HOSPITAL',
    contaminationRisk: false,
    confidenceScore: 0.95,
    status: 'REPORTED',
    reportedAt: '2026-10-25T10:00:00Z',
  };

  it('classifies Hospital and Dialysis Center connections as emergency', () => {
    const hosp = classifyEmergency(baseRequest, 500000, 100);
    expect(hosp.isEmergency).toBe(true);
    expect(hosp.rulesTriggered.some(r => r.includes('Hospital'))).toBe(true);

    const dial = classifyEmergency({ ...baseRequest, criticalFacility: 'DIALYSIS_CENTER' }, 500000, 100);
    expect(dial.isEmergency).toBe(true);
    expect(dial.rulesTriggered.some(r => r.includes('Dialysis'))).toBe(true);
  });

  it('classifies active contamination risk as emergency', () => {
    const contam = classifyEmergency({ ...baseRequest, criticalFacility: 'NONE', contaminationRisk: true }, 500000, 100);
    expect(contam.isEmergency).toBe(true);
    expect(contam.rulesTriggered.some(r => r.includes('contamination'))).toBe(true);
  });

  it('classifies massive burst (>= 200,000 L/day) as emergency', () => {
    const burst = classifyEmergency({
      ...baseRequest,
      criticalFacility: 'NONE',
      damageType: 'BURST',
      waterLossLitersPerDay: 250000,
    }, 500000, 100);
    expect(burst.isEmergency).toBe(true);
    expect(burst.rulesTriggered.some(r => r.includes('catastrophic'))).toBe(true);
  });

  it('classifies critical severity affecting >= 1200 households as emergency', () => {
    const dense = classifyEmergency({
      ...baseRequest,
      criticalFacility: 'NONE',
      severity: 'CRITICAL',
      affectedHouseholds: 1800,
      damageType: 'CRACK',
      waterLossLitersPerDay: 40000,
    }, 500000, 100);
    expect(dense.isEmergency).toBe(true);
    expect(dense.rulesTriggered.some(r => r.includes('humanitarian impact'))).toBe(true);
  });

  it('flags manual escalation when emergency exceeds total available budget or hours', () => {
    // Total budget is 50,000, but emergency costs 80,000
    const underBudget = classifyEmergency(baseRequest, 50000, 100);
    expect(underBudget.isEmergency).toBe(true);
    expect(underBudget.requiresManualEscalation).toBe(true);

    // Total hours is 8, but emergency needs 12 hours
    const underHours = classifyEmergency(baseRequest, 200000, 8);
    expect(underHours.isEmergency).toBe(true);
    expect(underHours.requiresManualEscalation).toBe(true);

    // Fits both
    const fits = classifyEmergency(baseRequest, 200000, 20);
    expect(fits.isEmergency).toBe(true);
    expect(fits.requiresManualEscalation).toBe(false);
  });
});
