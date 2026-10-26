import { RepairRequest, OptimizationConstraints, OptimizationWeights } from '../types';
import { DEMO_REPAIR_REQUESTS } from '../data/mockData';
import { DEFAULT_WEIGHTS } from '../algorithm/scoring';

const STORAGE_KEYS = {
  REQUESTS: 'aquapriority_repair_requests_v1',
  CONSTRAINTS: 'aquapriority_constraints_v1',
  WEIGHTS: 'aquapriority_weights_v1',
};

export const DEFAULT_CONSTRAINTS: OptimizationConstraints = {
  totalBudgetInr: 1200000, // ₹12 Lakhs (~$14.5k USD equivalent municipal emergency tranche)
  totalLaborHours: 160,     // 4 squads x 40 hours work cycle
  prioritizeEmergencies: true,
};

export function getStoredRequests(): RepairRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (!raw) {
      saveStoredRequests(DEMO_REPAIR_REQUESTS);
      return DEMO_REPAIR_REQUESTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    saveStoredRequests(DEMO_REPAIR_REQUESTS);
    return DEMO_REPAIR_REQUESTS;
  } catch (err) {
    console.error('Failed to parse localStorage requests, resetting to default demo data', err);
    saveStoredRequests(DEMO_REPAIR_REQUESTS);
    return DEMO_REPAIR_REQUESTS;
  }
}

export function saveStoredRequests(requests: RepairRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  } catch (err) {
    console.error('Failed to save requests to localStorage', err);
  }
}

export function addRepairRequest(request: RepairRequest): RepairRequest[] {
  const current = getStoredRequests();
  const updated = [request, ...current];
  saveStoredRequests(updated);
  return updated;
}

export function updateRepairRequest(updatedRequest: RepairRequest): RepairRequest[] {
  const current = getStoredRequests();
  const updated = current.map((r) => (r.id === updatedRequest.id ? updatedRequest : r));
  saveStoredRequests(updated);
  return updated;
}

export function deleteRepairRequest(id: string): RepairRequest[] {
  const current = getStoredRequests();
  const updated = current.filter((r) => r.id !== id);
  saveStoredRequests(updated);
  return updated;
}

export function resetToDemoData(): RepairRequest[] {
  saveStoredRequests(DEMO_REPAIR_REQUESTS);
  return DEMO_REPAIR_REQUESTS;
}

export function getStoredConstraints(): OptimizationConstraints {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONSTRAINTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        totalBudgetInr: Number(parsed.totalBudgetInr) || DEFAULT_CONSTRAINTS.totalBudgetInr,
        totalLaborHours: Number(parsed.totalLaborHours) || DEFAULT_CONSTRAINTS.totalLaborHours,
        prioritizeEmergencies: parsed.prioritizeEmergencies ?? DEFAULT_CONSTRAINTS.prioritizeEmergencies,
      };
    }
  } catch {
    // Fall back to defaults
  }
  return DEFAULT_CONSTRAINTS;
}

export function saveStoredConstraints(constraints: OptimizationConstraints): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONSTRAINTS, JSON.stringify(constraints));
  } catch (err) {
    console.error('Failed to save constraints to localStorage', err);
  }
}

export function getStoredWeights(): OptimizationWeights {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Fall back to defaults
  }
  return DEFAULT_WEIGHTS;
}

export function saveStoredWeights(weights: OptimizationWeights): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(weights));
  } catch (err) {
    console.error('Failed to save weights to localStorage', err);
  }
}
