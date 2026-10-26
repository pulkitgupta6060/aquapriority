import React from 'react';
import { 
  Droplets, 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  ShieldAlert, 
  Sliders, 
  Layers,
  MapPin,
  Building2
} from 'lucide-react';
import { RepairRequest } from '../types';
import { classifyEmergency } from '../algorithm/emergency';
import { ActiveTab } from './Navbar';

interface OverviewProps {
  requests: RepairRequest[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectRequest: (request: RepairRequest) => void;
  onFilterWard: (wardId: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  requests,
  setActiveTab,
  onSelectRequest,
  onFilterWard,
}) => {
  // Compute active requests
  const activeRequests = requests.filter(
    (r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
  );

  const totalWaterLoss = activeRequests.reduce((sum, r) => sum + r.waterLossLitersPerDay, 0);
  const totalCostInr = activeRequests.reduce((sum, r) => sum + r.estimatedCostInr, 0);
  const totalLaborHours = activeRequests.reduce((sum, r) => sum + r.estimatedLaborHours, 0);
  const totalHouseholds = activeRequests.reduce((sum, r) => sum + r.affectedHouseholds, 0);

  // Classify emergencies
  const emergencies = activeRequests.filter((r) => {
    const cl = classifyEmergency(r, 1200000, 160);
    return cl.isEmergency;
  });

  // Ward aggregated stats
  const wardMap = new Map<string, { wardName: string; loss: number; cost: number; count: number; emergencies: number }>();
  for (const r of activeRequests) {
    const existing = wardMap.get(r.wardId) || { wardName: r.wardName, loss: 0, cost: 0, count: 0, emergencies: 0 };
    existing.loss += r.waterLossLitersPerDay;
    existing.cost += r.estimatedCostInr;
    existing.count += 1;
    if (classifyEmergency(r, 1200000, 160).isEmergency) {
      existing.emergencies += 1;
    }
    wardMap.set(r.wardId, existing);
  }

  const topWards = Array.from(wardMap.entries())
    .map(([wardId, data]) => ({ wardId, ...data }))
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Model Estimates Advisory Banner */}
      <div className="bg-sky-50/70 border border-sky-200/90 rounded-xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-700 border border-sky-300/60 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                Municipal Water SCADA & Algorithmic Allocation Model
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                Decision Support
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
              All pipeline water loss projections, affected household figures, and repair expenditures are predictive model estimates for engineering resource allocation, not audited municipal savings.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('optimization')}
          className="shrink-0 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 transition text-xs"
        >
          <Sliders className="w-4 h-4" />
          Launch Optimization Center
        </button>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active Leaks */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Active Leaks Backlog</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
              {activeRequests.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">of {requests.length} logged</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {emergencies.length} life-safety emergencies
            </span>
            <button 
              onClick={() => setActiveTab('requests')} 
              className="text-sky-600 hover:text-sky-800 font-medium transition"
            >
              Browse →
            </button>
          </div>
        </div>

        {/* Estimated Daily Water Loss */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Est. Daily Water Loss</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600 tabular-nums">
              {(totalWaterLoss / 1000000).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-700">Million Liters/day (MLD)</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Impacting ~<strong>{totalHouseholds.toLocaleString()}</strong> households</span>
            <span className="text-sky-600 font-mono text-[11px] font-semibold">
              {(totalWaterLoss / 1000).toLocaleString()} kL/d
            </span>
          </div>
        </div>

        {/* Estimated Total Repair Cost */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Est. Total Capital Needed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 tabular-nums">
              ₹{(totalCostInr / 100000).toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-700">Lakhs</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Total repair budget demand</span>
            <span className="font-mono text-[11px] text-slate-600 font-semibold">
              ₹{totalCostInr.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Total Working Labor Hours */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Crew Labor Requirement</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tabular-nums">
              {totalLaborHours}
            </span>
            <span className="text-xs font-semibold text-slate-700">Crew Hours</span>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>≈ {Math.ceil(totalLaborHours / 8)} squad-days needed</span>
            <span className="text-amber-700 font-mono text-[11px] font-semibold">
              4 squads allocated
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Critical Incident Watchlist & High Vulnerability Wards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Emergency Watchlist (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Urgent Emergency Incidents Watchlist</h2>
                <p className="text-xs text-slate-500">Repairs with life-safety facility impact or high rupture rate</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
              {emergencies.length} Flagged
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {emergencies.slice(0, 5).map((req) => (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-lg transition cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-sky-700 font-bold">{req.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase tracking-wider">
                      {req.severity}
                    </span>
                    {req.criticalFacility !== 'NONE' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {req.criticalFacility.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-sky-600 transition">
                    {req.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {req.wardName}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-sky-700 font-medium">
                      {(req.waterLossLitersPerDay / 1000).toFixed(0)} kL/day
                    </span>
                    <span>•</span>
                    <span className="font-mono text-emerald-700 font-medium">
                      ₹{req.estimatedCostInr.toLocaleString('en-IN')}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-amber-700">
                      {req.estimatedLaborHours} hrs
                    </span>
                  </div>
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRequest(req);
                  }}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 group-hover:border-sky-300 group-hover:text-sky-700 group-hover:bg-sky-50/50 transition font-medium flex items-center gap-1 shadow-2xs"
                >
                  Inspect <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hospital connections, dialysis units, and active contamination alerts receive priority dispatch.</span>
            <button
              onClick={() => setActiveTab('requests')}
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
            >
              View all {requests.length} requests →
            </button>
          </div>
        </div>

        {/* Priority Wards Ranking (1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" /> Top Water Loss Wards
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">Ranked by Loss</span>
            </div>

            <div className="mt-3.5 space-y-3">
              {topWards.map((w, idx) => {
                const percent = totalWaterLoss > 0 ? (w.loss / totalWaterLoss) * 100 : 0;
                return (
                  <div
                    key={w.wardId}
                    onClick={() => {
                      onFilterWard(w.wardId);
                      setActiveTab('requests');
                    }}
                    className="p-3 rounded-lg bg-slate-50/70 hover:bg-sky-50/50 cursor-pointer border border-slate-200/80 transition group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 group-hover:text-sky-700 transition">
                        #{idx + 1} {w.wardName}
                      </span>
                      <span className="font-mono text-sky-700 font-bold">
                        {(w.loss / 1000).toFixed(0)} kL/day
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-cyan-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(8, percent))}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{w.count} leaks ({w.emergencies} emergencies)</span>
                      <span className="font-mono text-emerald-700">₹{(w.cost / 100000).toFixed(1)}L cost</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('map')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 border border-slate-200"
            >
              Open Interactive City Ward Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Decision Support Feature Card */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              ALGORITHM ENGINE
            </span>
            <h3 className="text-base font-bold text-white">Multi-Dimensional Greedy Resource Allocator</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Deterministically maximize water savings and households protected under hard municipal budget (₹) and crew working-hour constraints. Inspect exact deferral explanations and verify with the small-case exhaustive knapsack benchmark.
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => setActiveTab('optimization')}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 transition text-xs"
          >
            <Sliders className="w-4 h-4" /> Run Optimization Now
          </button>
        </div>
      </div>
    </div>
  );
};
