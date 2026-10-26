import React, { useState, useEffect } from 'react';
import { 
  X, 
  Droplets, 
  Users, 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  MapPin, 
  Activity,
  Edit3,
  Check,
  AlertCircle,
  Building2
} from 'lucide-react';
import { RepairRequest, RepairStatus, SeverityLevel } from '../types';
import { classifyEmergency } from '../algorithm/emergency';
import { validateRepairRequest } from '../algorithm/validator';

interface RequestDetailModalProps {
  request: RepairRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: RepairStatus) => void;
  onDelete: (id: string) => void;
  onUpdateRequest?: (updated: RepairRequest) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onUpdateStatus,
  onDelete,
  onUpdateRequest,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editCost, setEditCost] = useState(0);
  const [editHours, setEditHours] = useState(0);
  const [editLoss, setEditLoss] = useState(0);
  const [editHouseholds, setEditHouseholds] = useState(0);
  const [editSeverity, setEditSeverity] = useState<SeverityLevel>('HIGH');
  const [editContam, setEditContam] = useState(false);
  const [editOverride, setEditOverride] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editErrors, setEditErrors] = useState<string[]>([]);

  useEffect(() => {
    if (request) {
      setEditCost(request.estimatedCostInr);
      setEditHours(request.estimatedLaborHours);
      setEditLoss(request.waterLossLitersPerDay);
      setEditHouseholds(request.affectedHouseholds);
      setEditSeverity(request.severity);
      setEditContam(request.contaminationRisk);
      setEditOverride(!!request.isEmergencyOverride);
      setEditDesc(request.description);
      setIsEditing(false);
      setEditErrors([]);
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const emergencyInfo = classifyEmergency(request, 1000000, 160);

  const severityBadgeColors = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const statusColors = {
    REPORTED: 'bg-slate-100 text-slate-700 border-slate-200',
    SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-zinc-100 text-zinc-400 line-through border-zinc-200',
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedReq: RepairRequest = {
      ...request,
      estimatedCostInr: Number(editCost),
      estimatedLaborHours: Number(editHours),
      waterLossLitersPerDay: Number(editLoss),
      affectedHouseholds: Number(editHouseholds),
      severity: editSeverity,
      contaminationRisk: editContam,
      isEmergencyOverride: editOverride,
      description: editDesc.trim(),
    };

    const validation = validateRepairRequest(updatedReq);
    if (!validation.isValid) {
      setEditErrors(validation.errors.map(err => `${err.field}: ${err.message}`));
      return;
    }

    if (onUpdateRequest) {
      onUpdateRequest(updatedReq);
    }
    setIsEditing(false);
    setEditErrors([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                {request.id}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${severityBadgeColors[request.severity]}`}>
                {request.severity} SEVERITY
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusColors[request.status]}`}>
                {request.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{request.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Validation Errors */}
        {editErrors.length > 0 && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <div className="font-semibold flex items-center gap-1 mb-1 text-rose-700">
              <AlertCircle className="w-4 h-4" /> Please resolve validation errors:
            </div>
            <ul className="list-disc list-inside space-y-0.5">
              {editErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Emergency Alert Banner if triggered */}
        {emergencyInfo.isEmergency && !isEditing && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              Classified as Emergency Incident
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-rose-700/90 font-medium">
              {emergencyInfo.rulesTriggered.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Edit Mode Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="my-4 space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-sky-300 space-y-3">
              <div className="font-bold text-sm text-sky-800 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-sky-600" /> Edit Incident Telemetry & Scenario
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Estimated Cost (₹ INR) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={editCost}
                    onChange={(e) => setEditCost(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Estimated Labor (Hours) *</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    required
                    value={editHours}
                    onChange={(e) => setEditHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Est. Water Loss (L/day) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={editLoss}
                    onChange={(e) => setEditLoss(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Affected Households *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editHouseholds}
                    onChange={(e) => setEditHouseholds(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Severity Level</label>
                  <select
                    value={editSeverity}
                    onChange={(e) => setEditSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={editContam}
                      onChange={(e) => setEditContam(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-amber-800">Contamination Hazard</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={editOverride}
                      onChange={(e) => setEditOverride(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-rose-700">Emergency Override Flag</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 rounded-lg text-white font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  Est. Water Loss
                </div>
                <div className="text-base font-bold text-sky-700 mt-1 tabular-nums">
                  {(request.waterLossLitersPerDay / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-500">kL/day</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{request.waterLossLitersPerDay.toLocaleString()} L/day (est.)</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Households Impacted
                </div>
                <div className="text-base font-bold text-indigo-700 mt-1 tabular-nums">
                  {request.affectedHouseholds.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400">Residential meters (est.)</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  Estimated Cost
                </div>
                <div className="text-base font-bold text-emerald-700 mt-1 tabular-nums">
                  ₹{(request.estimatedCostInr / 1000).toFixed(1)}k
                </div>
                <div className="text-[10px] text-slate-400 font-mono">₹{request.estimatedCostInr.toLocaleString('en-IN')}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Crew Labor Hours
                </div>
                <div className="text-base font-bold text-amber-700 mt-1 tabular-nums">
                  {request.estimatedLaborHours} <span className="text-xs font-normal text-slate-500">hrs</span>
                </div>
                <div className="text-[10px] text-slate-400">Field squad estimate</div>
              </div>
            </div>

            {/* Technical Pipeline Specs */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                <Activity className="w-4 h-4 text-sky-600" /> Pipeline & Engineering Specifications
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block font-medium">Pipe Material:</span>
                  <span className="font-mono text-slate-900 font-bold">{request.pipeMaterial}</span> ({request.pipeDiameterMm}mm Ø)
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Failure Type:</span>
                  <span className="font-semibold text-slate-900">{request.damageType.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Critical Facility:</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    {request.criticalFacility !== 'NONE' && <Building2 className="w-3 h-3 text-indigo-500" />}
                    {request.criticalFacility.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Contamination Risk:</span>
                  <span className={request.contaminationRisk ? 'text-amber-800 font-bold' : 'text-slate-600'}>
                    {request.contaminationRisk ? '⚠ Active Infiltration Risk' : 'Safe / Negative'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Sensor Reliability:</span>
                  <span className="font-mono text-emerald-700 font-bold">{(request.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Reported Timestamp:</span>
                  <span className="text-slate-600">{new Date(request.reportedAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-medium">Location & Ward:</span>
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{request.wardName} ({request.wardId}) — {request.location.address}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Coordinates: {request.location.lat.toFixed(5)}°N, {request.location.lng.toFixed(5)}°E
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-slate-400 block mb-0.5 font-medium">Field Inspection Description:</span>
                <p className="text-slate-700 leading-relaxed">{request.description}</p>
              </div>
            </div>

            {/* Status Controller */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Change Operational Status:
              </label>
              <div className="flex flex-wrap gap-2">
                {(['REPORTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as RepairStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateStatus(request.id, st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      request.status === st
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Disclaimer & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Impacts are operational estimates, not actual municipal savings.</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && onUpdateRequest && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${request.id}?`)) {
                  onDelete(request.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
