import { RepairRequest, ValidationResult, ValidationIssue } from '../types';

/**
 * Validates a single repair request record.
 * Checks for required fields, numeric boundaries, and data integrity.
 */
export function validateRepairRequest(request: unknown): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (!request || typeof request !== 'object') {
    return {
      isValid: false,
      errors: [{ field: 'request', message: 'Request must be a non-null object', severity: 'error' }],
      warnings: [],
    };
  }

  const req = request as Record<string, unknown>;

  // ID validation
  if (!req.id || typeof req.id !== 'string' || req.id.trim() === '') {
    errors.push({ field: 'id', message: 'Request ID is required and must be a non-empty string', severity: 'error' });
  }

  // Title validation
  if (!req.title || typeof req.title !== 'string' || req.title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required', severity: 'error' });
  }

  // Ward validation
  if (!req.wardId || typeof req.wardId !== 'string') {
    errors.push({ field: 'wardId', message: 'Ward ID is required', severity: 'error' });
  }

  // Cost validation (must be positive number)
  if (typeof req.estimatedCostInr !== 'number' || isNaN(req.estimatedCostInr)) {
    errors.push({ field: 'estimatedCostInr', message: 'Estimated cost (INR) must be a valid number', severity: 'error' });
  } else if (req.estimatedCostInr <= 0) {
    errors.push({ field: 'estimatedCostInr', message: 'Estimated cost (INR) must be strictly greater than 0', severity: 'error' });
  }

  // Labor hours validation (must be positive number)
  if (typeof req.estimatedLaborHours !== 'number' || isNaN(req.estimatedLaborHours)) {
    errors.push({ field: 'estimatedLaborHours', message: 'Estimated labor hours must be a valid number', severity: 'error' });
  } else if (req.estimatedLaborHours <= 0) {
    errors.push({ field: 'estimatedLaborHours', message: 'Estimated labor hours must be strictly greater than 0', severity: 'error' });
  }

  // Water loss validation
  if (typeof req.waterLossLitersPerDay !== 'number' || isNaN(req.waterLossLitersPerDay)) {
    errors.push({ field: 'waterLossLitersPerDay', message: 'Estimated water loss must be a valid number', severity: 'error' });
  } else if (req.waterLossLitersPerDay < 0) {
    errors.push({ field: 'waterLossLitersPerDay', message: 'Estimated water loss cannot be negative', severity: 'error' });
  }

  // Households affected validation
  if (typeof req.affectedHouseholds !== 'number' || isNaN(req.affectedHouseholds)) {
    errors.push({ field: 'affectedHouseholds', message: 'Affected households must be a valid number', severity: 'error' });
  } else if (req.affectedHouseholds < 0) {
    errors.push({ field: 'affectedHouseholds', message: 'Affected households cannot be negative', severity: 'error' });
  }

  // Confidence score validation (0 to 1)
  if (typeof req.confidenceScore === 'number') {
    if (req.confidenceScore < 0 || req.confidenceScore > 1) {
      warnings.push({ field: 'confidenceScore', message: 'Confidence score should be between 0.0 and 1.0; clamping will apply', severity: 'warning' });
    }
  }

  // Pipe Material validation
  const validMaterials = ['DI', 'CI', 'MS', 'HDPE', 'GI', 'RCC'];
  if (!validMaterials.includes(String(req.pipeMaterial))) {
    warnings.push({ field: 'pipeMaterial', message: `Unknown pipe material: ${req.pipeMaterial}`, severity: 'warning' });
  }

  // Severity validation
  const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (!validSeverities.includes(String(req.severity))) {
    errors.push({ field: 'severity', message: `Invalid severity level: ${req.severity}`, severity: 'error' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a batch of requests, filters out invalid and duplicate IDs,
 * and splits them into clean active candidates vs rejected entries.
 */
export function filterAndValidateRequests(requests: RepairRequest[]): {
  validRequests: RepairRequest[];
  rejectedDuplicates: { request: RepairRequest; reason: string }[];
  rejectedInvalid: { request: unknown; errors: ValidationIssue[] }[];
  filteredStatus: { request: RepairRequest; status: string }[];
} {
  const validRequests: RepairRequest[] = [];
  const rejectedDuplicates: { request: RepairRequest; reason: string }[] = [];
  const rejectedInvalid: { request: unknown; errors: ValidationIssue[] }[] = [];
  const filteredStatus: { request: RepairRequest; status: string }[] = [];
  const seenIds = new Set<string>();

  if (!Array.isArray(requests)) {
    return {
      validRequests,
      rejectedDuplicates,
      rejectedInvalid,
      filteredStatus,
    };
  }

  for (const item of requests) {
    const validation = validateRepairRequest(item);
    if (!validation.isValid) {
      rejectedInvalid.push({ request: item, errors: validation.errors });
      continue;
    }

    const req = item as RepairRequest;

    // Check duplicate ID
    if (seenIds.has(req.id)) {
      rejectedDuplicates.push({
        request: req,
        reason: `Duplicate ID '${req.id}' encountered. Only first instance is evaluated.`,
      });
      continue;
    }
    seenIds.add(req.id);

    // Filter completed and cancelled requests
    if (req.status === 'COMPLETED' || req.status === 'CANCELLED') {
      filteredStatus.push({ request: req, status: req.status });
      continue;
    }

    validRequests.push(req);
  }

  return {
    validRequests,
    rejectedDuplicates,
    rejectedInvalid,
    filteredStatus,
  };
}
