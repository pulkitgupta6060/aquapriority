/**
 * AquaPriority — Core Types & Domain Models
 * Explicitly fictional Indian Municipal Water Pipeline Prioritization System
 */

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RepairStatus = 'REPORTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PipeMaterial = 'DI' | 'CI' | 'MS' | 'HDPE' | 'GI' | 'RCC';

export type DamageType = 
  | 'BURST' 
  | 'JOINT_LEAK' 
  | 'CRACK' 
  | 'VALVE_FAILURE' 
  | 'CORROSION' 
  | 'ROAD_SETTLEMENT';

export type CriticalFacilityType = 
  | 'HOSPITAL' 
  | 'DIALYSIS_CENTER' 
  | 'SCHOOL' 
  | 'RAILWAY_STATION' 
  | 'FIRE_STATION' 
  | 'DENSE_RESIDENTIAL' 
  | 'NONE';

export interface RepairLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface RepairRequest {
  id: string;
  title: string;
  description: string;
  wardId: string;
  wardName: string;
  zone: 'North' | 'South' | 'East' | 'West' | 'Central';
  location: RepairLocation;
  pipeMaterial: PipeMaterial;
  pipeDiameterMm: number;
  damageType: DamageType;
  severity: SeverityLevel;
  waterLossLitersPerDay: number; // Model estimate
  affectedHouseholds: number;    // Model estimate
  estimatedCostInr: number;       // In Indian Rupees ₹
  estimatedLaborHours: number;   // Crew working hours
  criticalFacility: CriticalFacilityType;
  contaminationRisk: boolean;
  confidenceScore: number;       // Sensor/survey confidence: 0.1 to 1.0
  status: RepairStatus;
  reportedAt: string;            // ISO date string
  isEmergencyOverride?: boolean; // Manual operator override
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface OptimizationWeights {
  waterLossWeight: number;       // Default ~ 0.35
  householdsWeight: number;      // Default ~ 0.25
  severityWeight: number;        // Default ~ 0.25
  criticalFacilityWeight: number;// Default ~ 0.15
}

export interface OptimizationConstraints {
  totalBudgetInr: number;        // Max available budget in ₹
  totalLaborHours: number;       // Max available crew labor hours
  prioritizeEmergencies: boolean;// Put verified emergencies in front
}

export interface EmergencyClassification {
  isEmergency: boolean;
  rulesTriggered: string[];
  requiresManualEscalation: boolean; // Flagged if critical emergency cannot fit constraints
}

export interface ScoredRepair {
  request: RepairRequest;
  benefitScore: number;          // Total calculated benefit score
  normalizedLoss: number;        // [0, 1]
  normalizedHouseholds: number;  // [0, 1]
  severityMultiplier: number;    // e.g. 1.0 to 3.0
  facilityBonus: number;         // e.g. 0 to 1.5
  confidenceFactor: number;      // e.g. 0.8 to 1.0
  resourceScore: number;         // Combined resource footprint in [0, 1]
  benefitRatio: number;          // Benefit / resource consumption ratio
  isEmergency: boolean;
  emergencyReasons: string[];
  scoreExplanation: string;
}

export type DeferralReasonCode = 
  | 'EXCEEDS_BUDGET'
  | 'EXCEEDS_LABOR_HOURS'
  | 'EXCEEDS_BOTH_CONSTRAINTS'
  | 'FILTERED_STATUS'
  | 'DUPLICATE_ID'
  | 'INVALID_DATA'
  | 'MANUAL_ESCALATION_REQUIRED';

export interface DeferredJob {
  scoredRepair: ScoredRepair;
  reasonCode: DeferralReasonCode;
  reasonDescription: string;
  remainingBudgetAtAttempt: number;
  remainingHoursAtAttempt: number;
  deficitBudget: number;
  deficitHours: number;
}

export interface EscalatedEmergencyJob {
  scoredRepair: ScoredRepair;
  reason: string;
  requiredBudget: number;
  requiredHours: number;
  availableBudget: number;
  availableHours: number;
  deficitBudget: number;
  deficitHours: number;
}

export interface OptimizationResult {
  // Outcomes
  selectedJobs: ScoredRepair[];
  deferredJobs: DeferredJob[];
  escalatedEmergencyJobs: EscalatedEmergencyJob[];
  
  // Resource metrics
  totalBudgetLimit: number;
  totalHoursLimit: number;
  allocatedBudget: number;
  allocatedHours: number;
  remainingBudget: number;
  remainingHours: number;
  budgetUtilizationPercent: number;
  hoursUtilizationPercent: number;

  // Impact metrics (labeled as estimates)
  totalEstWaterSavedLitersPerDay: number;
  totalEstHouseholdsProtected: number;
  totalBenefitScore: number;

  // Counts & audit
  totalCandidatesConsidered: number;
  selectedCount: number;
  deferredCount: number;
  escalatedCount: number;
  rejectedInvalidCount: number;
  filteredStatusCount: number;
  executionTimeMs: number;

  // Documented algorithm metadata
  algorithmName: string;
  algorithmDisclaimer: string;
  timestamp: string;
}

export interface CityWardSummary {
  wardId: string;
  wardName: string;
  zone: string;
  leakCount: number;
  totalWaterLossLpd: number;
  totalHouseholdsAffected: number;
  totalCostInr: number;
  criticalLeakCount: number;
}
