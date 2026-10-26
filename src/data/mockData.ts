import { RepairRequest } from '../types';

export const CITY_NAME = 'Mayurpur Mahanagar Jal Sansthan (MMJS)';
export const CITY_STATE = 'National Capital Region, India (Fictional Municipality)';

export const WARDS_DATA = [
  { id: 'W-01', name: 'Purana Qila & Heritage Circle', zone: 'Central' as const, lat: 28.612, lng: 77.243 },
  { id: 'W-04', name: 'Rajendra Marg & Connaught Enclave', zone: 'Central' as const, lat: 28.631, lng: 77.218 },
  { id: 'W-07', name: 'Civil Lines & Raj Bhavan Link', zone: 'North' as const, lat: 28.681, lng: 77.225 },
  { id: 'W-11', name: 'Ashok Vihar Phase-II', zone: 'North' as const, lat: 28.694, lng: 77.178 },
  { id: 'W-14', name: 'Chandni Chowk Old Waterway', zone: 'Central' as const, lat: 28.650, lng: 77.230 },
  { id: 'W-18', name: 'Mayur Vihar Pocket IV', zone: 'East' as const, lat: 28.608, lng: 77.296 },
  { id: 'W-22', name: 'Anand Vihar ISBT & Rail Link', zone: 'East' as const, lat: 28.647, lng: 77.315 },
  { id: 'W-25', name: 'Preet Vihar Commercial Corridor', zone: 'East' as const, lat: 28.638, lng: 77.292 },
  { id: 'W-29', name: 'Lajpat Nagar Market Sector 3', zone: 'South' as const, lat: 28.570, lng: 77.241 },
  { id: 'W-33', name: 'Hauz Khas Reservoir Perimeter', zone: 'South' as const, lat: 28.549, lng: 77.200 },
  { id: 'W-37', name: 'Saket Medical District', zone: 'South' as const, lat: 28.524, lng: 77.216 },
  { id: 'W-42', name: 'Okhla Industrial Area Phase-I', zone: 'South' as const, lat: 28.535, lng: 77.272 },
  { id: 'W-46', name: 'Janakpuri District Center', zone: 'West' as const, lat: 28.621, lng: 77.086 },
  { id: 'W-50', name: 'Punjabi Bagh Ring Road Overpass', zone: 'West' as const, lat: 28.665, lng: 77.126 },
  { id: 'W-55', name: 'Rohini Sector 16 Sub-City', zone: 'North' as const, lat: 28.730, lng: 77.115 },
];

/**
 * 90 realistic, fictional repair requests across Indian municipal wards.
 * Explicitly labeled as operational estimates.
 */
export const INITIAL_REPAIR_REQUESTS: RepairRequest[] = [
  {
    id: 'REQ-2026-001',
    title: '600mm DI Feeder Main Rupture near Safdarjung Civil Hospital',
    description: 'Sudden pressure drop reported along main arterial feeder pipe; risk of total water shutdown to pediatric ICU and emergency wing.',
    wardId: 'W-37',
    wardName: 'Saket Medical District',
    zone: 'South',
    location: { address: 'Opposite Gate 3, Safdarjung Annex Rd', lat: 28.528, lng: 77.218 },
    pipeMaterial: 'DI',
    pipeDiameterMm: 600,
    damageType: 'BURST',
    severity: 'CRITICAL',
    waterLossLitersPerDay: 280000,
    affectedHouseholds: 4200,
    estimatedCostInr: 210000,
    estimatedLaborHours: 24,
    criticalFacility: 'HOSPITAL',
    contaminationRisk: true,
    confidenceScore: 0.95,
    status: 'REPORTED',
    reportedAt: '2026-10-24T06:15:00Z',
    isEmergencyOverride: true,
  },
  {
    id: 'REQ-2026-002',
    title: '450mm CI Main Joint Shear at Anand Vihar Transit Terminal',
    description: 'Sub-surface shear at bell-and-spigot joint causing sinkhole near interstate bus terminal bay 4.',
    wardId: 'W-22',
    wardName: 'Anand Vihar ISBT & Rail Link',
    zone: 'East',
    location: { address: 'Platform 4 Access Road, ISBT Complex', lat: 28.648, lng: 77.316 },
    pipeMaterial: 'CI',
    pipeDiameterMm: 450,
    damageType: 'JOINT_LEAK',
    severity: 'HIGH',
    waterLossLitersPerDay: 135000,
    affectedHouseholds: 2800,
    estimatedCostInr: 125000,
    estimatedLaborHours: 16,
    criticalFacility: 'RAILWAY_STATION',
    contaminationRisk: false,
    confidenceScore: 0.92,
    status: 'REPORTED',
    reportedAt: '2026-10-24T08:30:00Z',
  },
  {
    id: 'REQ-2026-003',
    title: '300mm MS Pipeline Pinhole Leakage near Shishu Vidya Niketan',
    description: 'Perennial ponding adjacent to school playground; telemetry shows steady pressure dip in sector branch.',
    wardId: 'W-11',
    wardName: 'Ashok Vihar Phase-II',
    zone: 'North',
    location: { address: 'Pocket B, Behind Shishu Vidya School', lat: 28.692, lng: 77.176 },
    pipeMaterial: 'MS',
    pipeDiameterMm: 300,
    damageType: 'CORROSION',
    severity: 'MEDIUM',
    waterLossLitersPerDay: 48000,
    affectedHouseholds: 850,
    estimatedCostInr: 45000,
    estimatedLaborHours: 8,
    criticalFacility: 'SCHOOL',
    contaminationRisk: false,
    confidenceScore: 0.88,
    status: 'REPORTED',
    reportedAt: '2026-10-24T09:45:00Z',
  },
  {
    id: 'REQ-2026-004',
    title: '150mm HDPE Distribution Pipe Squeeze Crack at Janakpuri C-Block',
    description: 'Excavation machinery damage during fiber optic cabling; minor road flooding affecting local market lane.',
    wardId: 'W-46',
    wardName: 'Janakpuri District Center',
    zone: 'West',
    location: { address: 'Lane 12, Block C, Janakpuri', lat: 28.623, lng: 77.089 },
    pipeMaterial: 'HDPE',
    pipeDiameterMm: 150,
    damageType: 'CRACK',
    severity: 'LOW',
    waterLossLitersPerDay: 22000,
    affectedHouseholds: 320,
    estimatedCostInr: 28000,
    estimatedLaborHours: 6,
    criticalFacility: 'NONE',
    contaminationRisk: false,
    confidenceScore: 0.84,
    status: 'REPORTED',
    reportedAt: '2026-10-24T11:20:00Z',
  },
  {
    id: 'REQ-2026-005',
    title: '900mm RCC Raw Water Bulk Conduit Sluice Valve Failure',
    description: 'Master bypass valve jammed partially open; continuous drainage overflow threatening Okhla industrial corridor.',
    wardId: 'W-42',
    wardName: 'Okhla Industrial Area Phase-I',
    zone: 'South',
    location: { address: 'Shed 44-B, Okhla Ph-1 Industrial Trunk', lat: 28.536, lng: 77.275 },
    pipeMaterial: 'RCC',
    pipeDiameterMm: 900,
    damageType: 'VALVE_FAILURE',
    severity: 'HIGH',
    waterLossLitersPerDay: 210000,
    affectedHouseholds: 5600,
    estimatedCostInr: 185000,
    estimatedLaborHours: 20,
    criticalFacility: 'NONE',
    contaminationRisk: false,
    confidenceScore: 0.91,
    status: 'SCHEDULED',
    reportedAt: '2026-10-24T13:00:00Z',
  },
  {
    id: 'REQ-2026-006',
    title: '200mm CI Sluice Joint Seepage near Nephrology Dialysis Center',
    description: 'Intermittent pressure loss impacting reverse osmosis water feed to community dialysis unit.',
    wardId: 'W-29',
    wardName: 'Lajpat Nagar Market Sector 3',
    zone: 'South',
    location: { address: 'Block K, Near LifeLine Kidney Care', lat: 28.572, lng: 77.243 },
    pipeMaterial: 'CI',
    pipeDiameterMm: 200,
    damageType: 'JOINT_LEAK',
    severity: 'CRITICAL',
    waterLossLitersPerDay: 95000,
    affectedHouseholds: 1400,
    estimatedCostInr: 88000,
    estimatedLaborHours: 12,
    criticalFacility: 'DIALYSIS_CENTER',
    contaminationRisk: true,
    confidenceScore: 0.94,
    status: 'REPORTED',
    reportedAt: '2026-10-24T14:10:00Z',
  },
  {
    id: 'REQ-2026-007',
    title: '300mm DI Sub-Main Fracture beneath Punjabi Bagh Ring Road',
    description: 'Heavy vehicular traffic loading resulted in longitudinal shear; localized asphalt buckling observed.',
    wardId: 'W-50',
    wardName: 'Punjabi Bagh Ring Road Overpass',
    zone: 'West',
    location: { address: 'Pillar 28, Ring Road Service Lane', lat: 28.667, lng: 77.128 },
    pipeMaterial: 'DI',
    pipeDiameterMm: 300,
    damageType: 'ROAD_SETTLEMENT',
    severity: 'HIGH',
    waterLossLitersPerDay: 140000,
    affectedHouseholds: 2100,
    estimatedCostInr: 145000,
    estimatedLaborHours: 18,
    criticalFacility: 'FIRE_STATION',
    contaminationRisk: false,
    confidenceScore: 0.89,
    status: 'REPORTED',
    reportedAt: '2026-10-24T15:35:00Z',
  },
  {
    id: 'REQ-2026-008',
    title: '100mm GI Service Line Burst at Chandni Chowk Haveli Lane',
    description: 'Corroded legacy pipe burst in narrow pedestrian galli; drinking water entering open storm drain.',
    wardId: 'W-14',
    wardName: 'Chandni Chowk Old Waterway',
    zone: 'Central',
    location: { address: 'Gali Paranthe Wali, Haveli 18', lat: 28.651, lng: 77.232 },
    pipeMaterial: 'GI',
    pipeDiameterMm: 100,
    damageType: 'BURST',
    severity: 'MEDIUM',
    waterLossLitersPerDay: 35000,
    affectedHouseholds: 650,
    estimatedCostInr: 32000,
    estimatedLaborHours: 7,
    criticalFacility: 'DENSE_RESIDENTIAL',
    contaminationRisk: true,
    confidenceScore: 0.86,
    status: 'REPORTED',
    reportedAt: '2026-10-24T16:50:00Z',
  },
  {
    id: 'REQ-2026-009',
    title: '250mm DI Feeder Leak near Hauz Khas Heritage Reservoir',
    description: 'Soil saturation detected near reservoir embankment; acoustic loggers pinpoint 2 bar pressure drop.',
    wardId: 'W-33',
    wardName: 'Hauz Khas Reservoir Perimeter',
    zone: 'South',
    location: { address: 'Deer Park Northern Boundary Gate', lat: 28.551, lng: 77.202 },
    pipeMaterial: 'DI',
    pipeDiameterMm: 250,
    damageType: 'CRACK',
    severity: 'MEDIUM',
    waterLossLitersPerDay: 62000,
    affectedHouseholds: 1100,
    estimatedCostInr: 58000,
    estimatedLaborHours: 10,
    criticalFacility: 'NONE',
    contaminationRisk: false,
    confidenceScore: 0.90,
    status: 'REPORTED',
    reportedAt: '2026-10-24T18:00:00Z',
  },
  {
    id: 'REQ-2026-010',
    title: '150mm CI Feeder Joint Leakage at Mayur Vihar Pocket IV',
    description: 'Persistent seepage at flange coupling under residential footpath; muddy tap discharge reported.',
    wardId: 'W-18',
    wardName: 'Mayur Vihar Pocket IV',
    zone: 'East',
    location: { address: 'Opposite Community Hall, Pocket 4', lat: 28.610, lng: 77.298 },
    pipeMaterial: 'CI',
    pipeDiameterMm: 150,
    damageType: 'JOINT_LEAK',
    severity: 'LOW',
    waterLossLitersPerDay: 19000,
    affectedHouseholds: 410,
    estimatedCostInr: 24000,
    estimatedLaborHours: 5,
    criticalFacility: 'DENSE_RESIDENTIAL',
    contaminationRisk: false,
    confidenceScore: 0.82,
    status: 'REPORTED',
    reportedAt: '2026-10-24T19:15:00Z',
  },
  // We will generate the rest programmatically to reach 90 rich records
];

// Helper to expand with realistic, repeatable, deterministic mock data up to 90 items
const MATERIALS: RepairRequest['pipeMaterial'][] = ['DI', 'CI', 'MS', 'HDPE', 'GI', 'RCC'];
const DAMAGES: RepairRequest['damageType'][] = ['BURST', 'JOINT_LEAK', 'CRACK', 'VALVE_FAILURE', 'CORROSION', 'ROAD_SETTLEMENT'];
const SEVERITIES: RepairRequest['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const FACILITIES: RepairRequest['criticalFacility'][] = ['NONE', 'NONE', 'DENSE_RESIDENTIAL', 'SCHOOL', 'HOSPITAL', 'FIRE_STATION', 'RAILWAY_STATION', 'DIALYSIS_CENTER'];

function generateFullDataset(): RepairRequest[] {
  const result: RepairRequest[] = [...INITIAL_REPAIR_REQUESTS];

  // Seeded deterministic pseudo-random generator
  let seed = 42;
  function random(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = 11; i <= 90; i++) {
    const ward = WARDS_DATA[Math.floor(random() * WARDS_DATA.length)];
    const material = MATERIALS[Math.floor(random() * MATERIALS.length)];
    const damage = DAMAGES[Math.floor(random() * DAMAGES.length)];
    const severity = SEVERITIES[Math.floor(random() * SEVERITIES.length)];
    const facility = FACILITIES[Math.floor(random() * FACILITIES.length)];
    
    // Status distribution: 70% REPORTED/SCHEDULED, 15% IN_PROGRESS, 10% COMPLETED, 5% CANCELLED
    const rStatus = random();
    let status: RepairRequest['status'] = 'REPORTED';
    if (rStatus > 0.95) status = 'CANCELLED';
    else if (rStatus > 0.85) status = 'COMPLETED';
    else if (rStatus > 0.70) status = 'IN_PROGRESS';
    else if (rStatus > 0.50) status = 'SCHEDULED';

    // Realistic scales based on severity and material
    const baseDiameter = material === 'RCC' ? 600 : (material === 'DI' ? 350 : 200);
    const diameter = baseDiameter + Math.floor(random() * 4) * 50;

    let lossBase = 25000;
    let costBase = 35000;
    let hoursBase = 8;
    let houseBase = 500;

    if (severity === 'CRITICAL') {
      lossBase = 180000 + Math.floor(random() * 140000);
      costBase = 160000 + Math.floor(random() * 150000);
      hoursBase = 20 + Math.floor(random() * 24);
      houseBase = 2500 + Math.floor(random() * 3500);
    } else if (severity === 'HIGH') {
      lossBase = 90000 + Math.floor(random() * 80000);
      costBase = 90000 + Math.floor(random() * 70000);
      hoursBase = 14 + Math.floor(random() * 12);
      houseBase = 1200 + Math.floor(random() * 1500);
    } else if (severity === 'MEDIUM') {
      lossBase = 40000 + Math.floor(random() * 40000);
      costBase = 45000 + Math.floor(random() * 40000);
      hoursBase = 8 + Math.floor(random() * 8);
      houseBase = 600 + Math.floor(random() * 600);
    } else {
      lossBase = 12000 + Math.floor(random() * 20000);
      costBase = 18000 + Math.floor(random() * 25000);
      hoursBase = 4 + Math.floor(random() * 5);
      houseBase = 150 + Math.floor(random() * 400);
    }

    const contaminationRisk = random() < 0.22;
    const confidenceScore = Number((0.68 + random() * 0.30).toFixed(2));
    const padId = String(i).padStart(3, '0');

    // Slight coordinate jitter around ward center
    const lat = Number((ward.lat + (random() - 0.5) * 0.02).toFixed(5));
    const lng = Number((ward.lng + (random() - 0.5) * 0.02).toFixed(5));

    const id = `REQ-2026-${padId}`;
    const titles = {
      BURST: `${diameter}mm ${material} Main Pipeline Burst near ${ward.name}`,
      JOINT_LEAK: `${diameter}mm Flange Gasket Shear Leakage, ${ward.name}`,
      CRACK: `${diameter}mm Stress Fracture on ${material} Branch, Sector 4`,
      VALVE_FAILURE: `${diameter}mm Pressure Regulation Valve Stall at Main Sump`,
      CORROSION: `${diameter}mm Wall Thinning and Seepage Pinhole Cluster`,
      ROAD_SETTLEMENT: `${diameter}mm Conduit Deformation beneath Urban Arterial`,
    };

    result.push({
      id,
      title: titles[damage] || `${diameter}mm ${material} Leakage at ${ward.name}`,
      description: `Dispatched field inspection reported ${damage.toLowerCase()} on ${diameter}mm ${material} line. Groundwater testing indicates ${contaminationRisk ? 'high contamination risk' : 'stable quality'}.`,
      wardId: ward.id,
      wardName: ward.name,
      zone: ward.zone,
      location: {
        address: `Plot ${Math.floor(random() * 200) + 1}, Sector ${Math.floor(random() * 12) + 1}, ${ward.name}`,
        lat,
        lng,
      },
      pipeMaterial: material,
      pipeDiameterMm: diameter,
      damageType: damage,
      severity,
      waterLossLitersPerDay: lossBase,
      affectedHouseholds: houseBase,
      estimatedCostInr: costBase,
      estimatedLaborHours: hoursBase,
      criticalFacility: facility,
      contaminationRisk,
      confidenceScore,
      status,
      reportedAt: `2026-10-${Math.floor(15 + random() * 10).toString().padStart(2, '0')}T${Math.floor(random() * 14 + 8).toString().padStart(2, '0')}:${Math.floor(random() * 60).toString().padStart(2, '0')}:00Z`,
      isEmergencyOverride: random() < 0.08,
    });
  }

  return result;
}

export const DEMO_REPAIR_REQUESTS: RepairRequest[] = generateFullDataset();
