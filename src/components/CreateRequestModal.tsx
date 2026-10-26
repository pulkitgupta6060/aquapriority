import React, { useState } from 'react';
import { X, AlertCircle, PlusCircle, Check } from 'lucide-react';
import { RepairRequest, PipeMaterial, DamageType, SeverityLevel, CriticalFacilityType } from '../types';
import { WARDS_DATA } from '../data/mockData';
import { validateRepairRequest } from '../algorithm/validator';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newRequest: RepairRequest) => void;
  existingRequests: RepairRequest[];
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingRequests,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wardId, setWardId] = useState(WARDS_DATA[0].id);
  const [address, setAddress] = useState('');
  const [pipeMaterial, setPipeMaterial] = useState<PipeMaterial>('DI');
  const [pipeDiameterMm, setPipeDiameterMm] = useState<number>(300);
  const [damageType, setDamageType] = useState<DamageType>('BURST');
  const [severity, setSeverity] = useState<SeverityLevel>('HIGH');
  const [waterLossLpd, setWaterLossLpd] = useState<number>(65000);
  const [households, setHouseholds] = useState<number>(1200);
  const [costInr, setCostInr] = useState<number>(75000);
  const [laborHours, setLaborHours] = useState<number>(12);
  const [criticalFacility, setCriticalFacility] = useState<CriticalFacilityType>('NONE');
  const [contaminationRisk, setContaminationRisk] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(0.85);
  const [isEmergencyOverride, setIsEmergencyOverride] = useState(false);

  const [formErrors, setFormErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedWard = WARDS_DATA.find((w) => w.id === wardId) || WARDS_DATA[0];

    // Compute highest existing numeric ID suffix to guarantee zero collisions
    const maxIdNum = existingRequests.reduce((max, r) => {
      const match = r.id.match(/\d+$/);
      const num = match ? parseInt(match[0], 10) : 0;
      return Math.max(max, num);
    }, 0);
    const generatedId = `REQ-2026-${String(maxIdNum + 1).padStart(3, '0')}`;

    const newReq: RepairRequest = {
      id: generatedId,
      title: title.trim(),
      description: description.trim() || `Field engineer inspection on ${pipeDiameterMm}mm ${pipeMaterial} pipeline.`,
      wardId: selectedWard.id,
      wardName: selectedWard.name,
      zone: selectedWard.zone,
      location: {
        address: address.trim() || `Main Service Road, ${selectedWard.name}`,
        lat: Number((selectedWard.lat + (Math.random() - 0.5) * 0.01).toFixed(5)),
        lng: Number((selectedWard.lng + (Math.random() - 0.5) * 0.01).toFixed(5)),
      },
      pipeMaterial,
      pipeDiameterMm: Number(pipeDiameterMm),
      damageType,
      severity,
      waterLossLitersPerDay: Number(waterLossLpd),
      affectedHouseholds: Number(households),
      estimatedCostInr: Number(costInr),
      estimatedLaborHours: Number(laborHours),
      criticalFacility,
      contaminationRisk,
      confidenceScore: Number(confidenceScore),
      status: 'REPORTED',
      reportedAt: new Date().toISOString(),
      isEmergencyOverride,
    };

    const validation = validateRepairRequest(newReq);
    if (!validation.isValid) {
      setFormErrors(validation.errors.map((err) => `${err.field}: ${err.message}`));
      return;
    }

    onAdd(newReq);
    setTitle('');
    setDescription('');
    setAddress('');
    setWaterLossLpd(65000);
    setHouseholds(1200);
    setCostInr(75000);
    setLaborHours(12);
    setContaminationRisk(false);
    setIsEmergencyOverride(false);
    setFormErrors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 my-8 text-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <PlusCircle className="w-5 h-5 text-sky-600" />
              Log New Pipeline Repair Request
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Municipal Grid Intake • Mayurpur Mahanagar Jal Sansthan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formErrors.length > 0 && (
          <div className="my-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <div className="font-semibold flex items-center gap-1.5 mb-1 text-rose-700">
              <AlertCircle className="w-4 h-4" /> Please resolve validation errors:
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {formErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 300mm DI Pipeline Rupture near District Hospital"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Description & Telemetry Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dispatched squad noted sub-surface water ponding and road fracture."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ward / Location *
              </label>
              <select
                value={wardId}
                onChange={(e) => setWardId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                {WARDS_DATA.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id}: {w.name} ({w.zone} Zone)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Near Gate 2, Metro Feeder Lane"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pipe Material
              </label>
              <select
                value={pipeMaterial}
                onChange={(e) => setPipeMaterial(e.target.value as PipeMaterial)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="DI">DI (Ductile Iron)</option>
                <option value="CI">CI (Cast Iron)</option>
                <option value="MS">MS (Mild Steel)</option>
                <option value="HDPE">HDPE</option>
                <option value="GI">GI (Galvanized)</option>
                <option value="RCC">RCC (Concrete)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diameter (mm)
              </label>
              <input
                type="number"
                min="50"
                max="1200"
                step="25"
                value={pipeDiameterMm}
                onChange={(e) => setPipeDiameterMm(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Damage Type
              </label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value as DamageType)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="BURST">Pipe Burst</option>
                <option value="JOINT_LEAK">Joint Leak</option>
                <option value="CRACK">Crack / Fracture</option>
                <option value="VALVE_FAILURE">Valve Failure</option>
                <option value="CORROSION">Pinhole Corrosion</option>
                <option value="ROAD_SETTLEMENT">Road Settlement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Est. Loss (L/day) *
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={waterLossLpd}
                onChange={(e) => setWaterLossLpd(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Households Impacted *
              </label>
              <input
                type="number"
                min="1"
                required
                value={households}
                onChange={(e) => setHouseholds(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Est. Cost (₹ INR) *
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={costInr}
                onChange={(e) => setCostInr(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Labor (Hours) *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                required
                value={laborHours}
                onChange={(e) => setLaborHours(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Critical Facility Vicinity
              </label>
              <select
                value={criticalFacility}
                onChange={(e) => setCriticalFacility(e.target.value as CriticalFacilityType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="NONE">None / General Sector</option>
                <option value="HOSPITAL">Civil Hospital / ICU</option>
                <option value="DIALYSIS_CENTER">Dialysis / Kidney Center</option>
                <option value="FIRE_STATION">Fire Brigade Station</option>
                <option value="SCHOOL">School / College Complex</option>
                <option value="RAILWAY_STATION">Railway / Bus Junction</option>
                <option value="DENSE_RESIDENTIAL">High-Density Urban Slum</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sensor / Survey Confidence ({(confidenceScore * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                className="w-full accent-sky-600 mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.4 (Preliminary Call)</span>
                <span>0.7 (Acoustic Sensor)</span>
                <span>1.0 (Field Verified)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={contaminationRisk}
                onChange={(e) => setContaminationRisk(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className="text-amber-800">Active Contamination / Sewage Ingress Risk</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isEmergencyOverride}
                onChange={(e) => setIsEmergencyOverride(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span className="text-rose-700">Executive Emergency Override Flag</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <Check className="w-4 h-4" /> Save & Log Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
