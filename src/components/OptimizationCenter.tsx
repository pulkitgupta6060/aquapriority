import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Download, 
  Droplets, 
  IndianRupee, 
  Clock, 
  Users, 
  Award, 
  HelpCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Building2,
  Check
} from 'lucide-react';
import { 
  RepairRequest, 
  OptimizationConstraints, 
  OptimizationWeights, 
  OptimizationResult 
} from '../types';
import { runGreedyOptimization } from '../algorithm/greedy';
import { DEFAULT_WEIGHTS, scoreRequests } from '../algorithm/scoring';
import { runExhaustiveKnapsack } from '../algorithm/exhaustive';

interface OptimizationCenterProps {
  requests: RepairRequest[];
  constraints: OptimizationConstraints;
  onSaveConstraints: (c: OptimizationConstraints) => void;
  weights: OptimizationWeights;
  onSaveWeights: (w: OptimizationWeights) => void;
  onSelectRequest: (r: RepairRequest) => void;
}

export const OptimizationCenter: React.FC<OptimizationCenterProps> = ({
  requests,
  constraints,
  onSaveConstraints,
  weights,
  onSaveWeights,
  onSelectRequest,
}) => {
  // Local state for interactive controls
  const [budgetInr, setBudgetInr] = useState<number>(constraints.totalBudgetInr);
  const [laborHours, setLaborHours] = useState<number>(constraints.totalLaborHours);
  const [prioritizeEmergencies, setPrioritizeEmergencies] = useState<boolean>(constraints.prioritizeEmergencies);

  // Weights state
  const [waterLossWeight, setWaterLossWeight] = useState<number>(weights.waterLossWeight);
  const [householdsWeight, setHouseholdsWeight] = useState<number>(weights.householdsWeight);
  const [severityWeight, setSeverityWeight] = useState<number>(weights.severityWeight);
  const [facilityWeight, setFacilityWeight] = useState<number>(weights.criticalFacilityWeight);
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);

  // Sync state if props change (avoids stale React state)
  useEffect(() => {
    setBudgetInr(constraints.totalBudgetInr);
    setLaborHours(constraints.totalLaborHours);
    setPrioritizeEmergencies(constraints.prioritizeEmergencies);
  }, [constraints]);

  useEffect(() => {
    setWaterLossWeight(weights.waterLossWeight);
    setHouseholdsWeight(weights.householdsWeight);
    setSeverityWeight(weights.severityWeight);
    setFacilityWeight(weights.criticalFacilityWeight);
  }, [weights]);

  // Active view tab for results
  const [activeResultsTab, setActiveResultsTab] = useState<'selected' | 'deferred' | 'escalated' | 'explainability'>('selected');
  const [expandedExplanationId, setExpandedExplanationId] = useState<string | null>(null);

  // Small exhaustive benchmark state
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Run the pure TypeScript greedy optimization algorithm
  const optimizationResult: OptimizationResult = useMemo(() => {
    const currentConstraints: OptimizationConstraints = {
      totalBudgetInr: budgetInr,
      totalLaborHours: laborHours,
      prioritizeEmergencies,
    };
    const currentWeights: OptimizationWeights = {
      waterLossWeight,
      householdsWeight,
      severityWeight,
      criticalFacilityWeight: facilityWeight,
    };
    return runGreedyOptimization(requests, currentConstraints, currentWeights);
  }, [requests, budgetInr, laborHours, prioritizeEmergencies, waterLossWeight, householdsWeight, severityWeight, facilityWeight]);

  // Apply preset constraints
  const applyPreset = (presetBudget: number, presetHours: number) => {
    setBudgetInr(presetBudget);
    setLaborHours(presetHours);
    const updated = { ...constraints, totalBudgetInr: presetBudget, totalLaborHours: presetHours };
    onSaveConstraints(updated);
  };

  // Run independent small-case exhaustive benchmark
  const handleExecuteBenchmark = () => {
    const activeValid = requests.filter(r => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
    const smallBatch = activeValid.slice(0, 14); // N <= 14 evaluates all 16,384 subsets in < 15ms
    const benchBudget = Math.min(budgetInr, 450000);
    const benchHours = Math.min(laborHours, 60);
    const currentWeights: OptimizationWeights = {
      waterLossWeight,
      householdsWeight,
      severityWeight,
      criticalFacilityWeight: facilityWeight,
    };

    // 1. Score ALL candidates in the small batch under identical constraints & weights
    const scoredBatch = scoreRequests(smallBatch, currentWeights, benchBudget, benchHours);

    // 2. Pure Mathematical Greedy Heuristic (Ratio-only, no emergency priority override)
    const mathGreedy = runGreedyOptimization(smallBatch, {
      totalBudgetInr: benchBudget,
      totalLaborHours: benchHours,
      prioritizeEmergencies: false,
    }, currentWeights);

    // 3. Operational Policy Greedy (Prioritizes emergencies first)
    const operationalGreedy = runGreedyOptimization(smallBatch, {
      totalBudgetInr: benchBudget,
      totalLaborHours: benchHours,
      prioritizeEmergencies: true,
    }, currentWeights);

    // 4. Exhaustive Search: Evaluates all 2^N feasible subsets across ALL scored candidates
    const exhaustive = runExhaustiveKnapsack(
      scoredBatch,
      benchBudget,
      benchHours
    );

    setBenchmarkResult({
      smallBatchSize: smallBatch.length,
      budget: benchBudget,
      hours: benchHours,
      mathGreedyScore: mathGreedy.totalBenefitScore,
      mathGreedyCost: mathGreedy.allocatedBudget,
      mathGreedySelected: mathGreedy.selectedCount,
      operationalScore: operationalGreedy.totalBenefitScore,
      operationalCost: operationalGreedy.allocatedBudget,
      operationalSelected: operationalGreedy.selectedCount,
      exhaustiveScore: exhaustive.optimalBenefitScore,
      exhaustiveCost: exhaustive.totalCost,
      exhaustiveSelected: exhaustive.optimalSelectedJobs.length,
      subsetsEvaluated: exhaustive.subsetsEvaluated,
    });
  };

  // Export report as CSV using Blob
  const exportCsv = () => {
    const headers = ['Rank', 'ID', 'Title', 'Ward', 'Severity', 'WaterLossLpd', 'Households', 'CostInr', 'Hours', 'BenefitScore', 'BenefitRatio', 'IsEmergency'];
    const rows = optimizationResult.selectedJobs.map((j, idx) => [
      idx + 1,
      `"${j.request.id}"`,
      `"${j.request.title.replace(/"/g, '""')}"`,
      `"${j.request.wardName}"`,
      j.request.severity,
      j.request.waterLossLitersPerDay,
      j.request.affectedHouseholds,
      j.request.estimatedCostInr,
      j.request.estimatedLaborHours,
      j.benefitScore,
      j.benefitRatio,
      j.isEmergency ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AquaPriority_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportFeedback('CSV Schedule downloaded');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  // Export report as JSON using Blob
  const exportJson = () => {
    const jsonStr = JSON.stringify(optimizationResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AquaPriority_Optimization_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportFeedback('JSON Audit file downloaded');
    setTimeout(() => setExportFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel: Resource Limit Sliders & Presets */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-600" />
              Operational Resource Constraints
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune available municipal repair budget and crew hours for the planning period
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Presets:</span>
            <button
              onClick={() => applyPreset(600000, 80)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium border border-slate-200"
            >
              Rapid (₹6L / 80h)
            </button>
            <button
              onClick={() => applyPreset(1200000, 160)}
              className="px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 transition font-semibold"
            >
              Standard (₹12L / 160h)
            </button>
            <button
              onClick={() => applyPreset(2500000, 320)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium border border-slate-200"
            >
              Monsoon Surge (₹25L / 320h)
            </button>
            <button
              onClick={() => applyPreset(350000, 48)}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition font-medium border border-slate-200"
            >
              Austerity (₹3.5L / 48h)
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* Budget Constraint Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                Total Municipal Budget Ceiling:
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-emerald-700 font-bold text-sm">
                  ₹{(budgetInr / 100000).toFixed(2)} Lakhs
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  (₹{budgetInr.toLocaleString('en-IN')})
                </span>
              </div>
            </div>
            <input
              type="range"
              min="100000"
              max="4000000"
              step="50000"
              value={budgetInr}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBudgetInr(val);
                onSaveConstraints({ ...constraints, totalBudgetInr: val });
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹1 Lakh</span>
              <span>₹12 Lakhs (Base)</span>
              <span>₹25 Lakhs</span>
              <span>₹40 Lakhs</span>
            </div>
          </div>

          {/* Working Hours Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Available Crew Labor Hours:
              </label>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-amber-700 font-bold text-sm">
                  {laborHours} Hours
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  ({(laborHours / 8).toFixed(1)} crew-days)
                </span>
              </div>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={laborHours}
              onChange={(e) => {
                const val = Number(e.target.value);
                setLaborHours(val);
                onSaveConstraints({ ...constraints, totalLaborHours: val });
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20 hrs</span>
              <span>160 hrs (Standard)</span>
              <span>320 hrs</span>
              <span>500 hrs</span>
            </div>
          </div>
        </div>

        {/* Weights customization drawer toggle & Emergency override */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={prioritizeEmergencies}
                onChange={(e) => {
                  setPrioritizeEmergencies(e.target.checked);
                  onSaveConstraints({ ...constraints, prioritizeEmergencies: e.target.checked });
                }}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
              />
              <span className="flex items-center gap-1.5 text-slate-800">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Prioritize Life-Safety & Hospital Emergencies First
              </span>
            </label>

            <button
              onClick={() => setShowWeightsConfig(!showWeightsConfig)}
              className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 transition"
            >
              {showWeightsConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showWeightsConfig ? 'Hide Benefit Weights' : 'Customize Benefit Weights'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {exportFeedback && (
              <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 animate-fade-in">
                <Check className="w-3.5 h-3.5" /> {exportFeedback}
              </span>
            )}
            <button
              onClick={exportCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
            </button>
            <button
              onClick={exportJson}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Export JSON
            </button>
          </div>
        </div>

        {/* Collapsible Benefit Weights Tuning */}
        {showWeightsConfig && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-900">Transparent Multi-Factor Benefit Scoring Weights:</span>
              <button
                onClick={() => {
                  setWaterLossWeight(DEFAULT_WEIGHTS.waterLossWeight);
                  setHouseholdsWeight(DEFAULT_WEIGHTS.householdsWeight);
                  setSeverityWeight(DEFAULT_WEIGHTS.severityWeight);
                  setFacilityWeight(DEFAULT_WEIGHTS.criticalFacilityWeight);
                  onSaveWeights(DEFAULT_WEIGHTS);
                }}
                className="text-[11px] text-sky-600 hover:underline font-semibold"
              >
                Reset to Default Weights
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Water Loss ({(waterLossWeight * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={waterLossWeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWaterLossWeight(val);
                    onSaveWeights({
                      waterLossWeight: val,
                      householdsWeight,
                      severityWeight,
                      criticalFacilityWeight: facilityWeight,
                    });
                  }}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Households ({(householdsWeight * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={householdsWeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHouseholdsWeight(val);
                    onSaveWeights({
                      waterLossWeight,
                      householdsWeight: val,
                      severityWeight,
                      criticalFacilityWeight: facilityWeight,
                    });
                  }}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Severity Multiplier ({(severityWeight * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={severityWeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSeverityWeight(val);
                    onSaveWeights({
                      waterLossWeight,
                      householdsWeight,
                      severityWeight: val,
                      criticalFacilityWeight: facilityWeight,
                    });
                  }}
                  className="w-full accent-orange-600"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Critical Facility ({(facilityWeight * 100).toFixed(0)}%)
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={facilityWeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFacilityWeight(val);
                    onSaveWeights({
                      waterLossWeight,
                      householdsWeight,
                      severityWeight,
                      criticalFacilityWeight: val,
                    });
                  }}
                  className="w-full accent-rose-600"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resource Utilization & Operational Outcomes Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Budget Utilization */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Budget Utilization
            </span>
            <span className="font-mono text-emerald-700 font-bold">
              {optimizationResult.budgetUtilizationPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, optimizationResult.budgetUtilizationPercent)}%` }}
            />
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 font-mono flex justify-between font-medium">
            <span>₹{(optimizationResult.allocatedBudget / 100000).toFixed(2)}L</span>
            <span className="text-slate-400">of ₹{(budgetInr / 100000).toFixed(2)}L</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            ₹{optimizationResult.remainingBudget.toLocaleString('en-IN')} remaining
          </div>
        </div>

        {/* Hours Utilization */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Labor Utilization
            </span>
            <span className="font-mono text-amber-700 font-bold">
              {optimizationResult.hoursUtilizationPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, optimizationResult.hoursUtilizationPercent)}%` }}
            />
          </div>
          <div className="mt-2.5 text-[11px] text-slate-600 font-mono flex justify-between font-medium">
            <span>{optimizationResult.allocatedHours} hrs</span>
            <span className="text-slate-400">of {laborHours} hrs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {optimizationResult.remainingHours} hrs crew capacity remaining
          </div>
        </div>

        {/* Est Water Saved */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold text-slate-700 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-600" /> Est. Water Saved
          </div>
          <div className="mt-2 text-2xl font-black text-sky-700 tabular-nums">
            {(optimizationResult.totalEstWaterSavedLitersPerDay / 1000000).toFixed(2)}
            <span className="text-xs font-normal text-slate-500 ml-1">MLD</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {(optimizationResult.totalEstWaterSavedLitersPerDay / 1000).toLocaleString()} kL/day
          </div>
        </div>

        {/* Est Households Protected */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold text-slate-700 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-600" /> Households Protected
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 tabular-nums">
            {optimizationResult.totalEstHouseholdsProtected.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {optimizationResult.selectedCount} selected repairs
          </div>
        </div>

        {/* Benefit Score & Telemetry */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold text-slate-700 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-violet-600" /> Total Benefit Score
          </div>
          <div className="mt-2 text-2xl font-black text-violet-700 tabular-nums">
            {optimizationResult.totalBenefitScore}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Computed in {optimizationResult.executionTimeMs} ms
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Results */}
      <div className="bg-slate-100/90 border border-slate-200 p-1 rounded-xl flex flex-wrap gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveResultsTab('selected')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeResultsTab === 'selected'
              ? 'bg-white text-sky-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Selected Repairs ({optimizationResult.selectedCount})
        </button>

        <button
          onClick={() => setActiveResultsTab('deferred')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeResultsTab === 'deferred'
              ? 'bg-white text-sky-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          Deferred Candidates ({optimizationResult.deferredCount})
        </button>

        {optimizationResult.escalatedCount > 0 && (
          <button
            onClick={() => setActiveResultsTab('escalated')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeResultsTab === 'escalated'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Manual Escalations ({optimizationResult.escalatedCount})
          </button>
        )}

        <button
          onClick={() => setActiveResultsTab('explainability')}
          className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
            activeResultsTab === 'explainability'
              ? 'bg-white text-sky-800 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-sky-600" />
          Algorithm & Suboptimality Proof
        </button>
      </div>

      {/* Tab Content 1: Selected Jobs */}
      {activeResultsTab === 'selected' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Ranked and selected by deterministic greedy benefit/resource ratio within ₹
              {budgetInr.toLocaleString('en-IN')} and {laborHours} hrs.
            </span>
            <span className="font-mono text-sky-700 font-bold">
              {optimizationResult.selectedCount} jobs scheduled
            </span>
          </div>

          <div className="divide-y divide-slate-100 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            {optimizationResult.selectedJobs.map((item, index) => {
              const isExpanded = expandedExplanationId === item.request.id;
              return (
                <div
                  key={item.request.id}
                  className="p-4 hover:bg-slate-50/70 transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs">
                          {index + 1}
                        </span>
                        <span className="font-mono text-sky-700 font-bold text-xs">
                          {item.request.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          SCHEDULED
                        </span>
                        {item.isEmergency && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            EMERGENCY PRIORITY
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">
                          Ratio: <strong className="text-sky-800">{item.benefitRatio}</strong>
                        </span>
                      </div>
                      <h3
                        onClick={() => onSelectRequest(item.request)}
                        className="text-sm font-bold text-slate-900 hover:text-sky-600 cursor-pointer transition"
                      >
                        {item.request.title}
                      </h3>
                      <div className="text-xs text-slate-500">
                        {item.request.wardName} • {item.request.pipeMaterial} {item.request.pipeDiameterMm}mm
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                      <div>
                        <div className="text-sky-700 font-bold tabular-nums">
                          {(item.request.waterLossLitersPerDay / 1000).toFixed(0)} kL/day
                        </div>
                        <div className="text-[10px] text-slate-400">water saved</div>
                      </div>

                      <div>
                        <div className="text-emerald-700 font-bold tabular-nums">
                          ₹{item.request.estimatedCostInr.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">repair cost</div>
                      </div>

                      <div>
                        <div className="text-amber-700 font-bold tabular-nums">
                          {item.request.estimatedLaborHours} hrs
                        </div>
                        <div className="text-[10px] text-slate-400">crew labor</div>
                      </div>

                      <button
                        onClick={() => setExpandedExplanationId(isExpanded ? null : item.request.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                        title="Toggle Calculation Breakdown"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Explainability Breakdown */}
                  {isExpanded && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
                      <div className="text-sky-800 font-bold">Mathematical Formula Scoring:</div>
                      <div>{item.scoreExplanation}</div>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Resource Score: {item.resourceScore.toFixed(4)} | Confidence Factor: {(item.confidenceFactor * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 2: Deferred Jobs with Exact Deferral Reasons */}
      {activeResultsTab === 'deferred' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Candidates not selected during the knapsack pass, with explicit deficit reasons.
            </span>
            <span className="font-mono text-amber-700 font-bold">
              {optimizationResult.deferredCount} jobs deferred
            </span>
          </div>

          <div className="divide-y divide-slate-100 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            {optimizationResult.deferredJobs.map((item, idx) => {
              const req = item.scoredRepair.request;
              const isEsc = item.reasonCode === 'MANUAL_ESCALATION_REQUIRED';
              return (
                <div key={req.id + idx} className="p-4 hover:bg-slate-50/70 transition">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-600 font-bold text-xs">
                          {req.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isEsc 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.reasonCode.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Score: {item.scoredRepair.benefitScore}
                        </span>
                      </div>
                      <h3
                        onClick={() => onSelectRequest(req)}
                        className="text-sm font-semibold text-slate-900 hover:text-sky-600 cursor-pointer transition"
                      >
                        {req.title}
                      </h3>
                      <p className={`text-xs font-medium ${isEsc ? 'text-rose-700' : 'text-slate-600'}`}>
                        ↳ {item.reasonDescription}
                      </p>
                    </div>

                    <div className="text-xs font-mono text-right shrink-0">
                      <div className="text-slate-800 font-bold">
                        Requires: ₹{req.estimatedCostInr.toLocaleString('en-IN')} & {req.estimatedLaborHours}h
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Deficit: ₹{item.deficitBudget.toLocaleString('en-IN')} / {item.deficitHours.toFixed(1)}h
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 3: Manual Escalations */}
      {activeResultsTab === 'escalated' && (
        <div className="space-y-3">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5 shadow-xs">
            <div className="font-bold text-sm text-rose-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              Emergency Jobs Exceeding Scheduled Resource Allocation
            </div>
            <p className="leading-relaxed">
              These repairs are verified life-safety / critical facility emergencies that could not fit into the available budget or labor hours during this scheduled run. They are automatically flagged for the Municipal Commissioner to trigger emergency off-budget mobilization.
            </p>
          </div>

          <div className="divide-y divide-slate-100 bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
            {optimizationResult.escalatedEmergencyJobs.map((esc) => {
              const req = esc.scoredRepair.request;
              return (
                <div key={req.id} className="p-4 hover:bg-slate-50/70 transition">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-rose-700 font-bold text-xs">{req.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          MANUAL ESCALATION
                        </span>
                        {req.criticalFacility !== 'NONE' && (
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {req.criticalFacility.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <h3
                        onClick={() => onSelectRequest(req)}
                        className="text-sm font-bold text-slate-900 hover:text-rose-600 cursor-pointer transition"
                      >
                        {req.title}
                      </h3>
                      <p className="text-xs text-rose-700/90">{esc.reason}</p>
                    </div>

                    <div className="text-xs font-mono text-right shrink-0">
                      <div className="text-rose-700 font-bold tabular-nums">
                        Deficit: ₹{esc.deficitBudget.toLocaleString('en-IN')}
                      </div>
                      <div className="text-slate-500 text-[11px] tabular-nums">
                        Deficit Hours: {esc.deficitHours} hrs
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content 4: Algorithm Explainability & Benchmark Proof */}
      {activeResultsTab === 'explainability' && (
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Formal knapsack suboptimality caveat */}
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-2 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Mathematical Guarantee & Knapsack Suboptimality Disclosure
            </h3>
            <p>
              AquaPriority uses a <strong>Multi-Dimensional Greedy Heuristic</strong> with an asymptotic time complexity of{' '}
              <code className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-mono">O(N log N)</code>.
            </p>
            <p className="text-slate-600">
              {optimizationResult.algorithmDisclaimer}
            </p>
          </div>

          {/* Independent Exhaustive Search Benchmark Runner */}
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Small-Case Exhaustive Search Benchmark</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Evaluates all 2^N feasible combinations on small batches (N ≤ 14) to calculate the theoretical global optimum.
                </p>
              </div>
              <button
                onClick={handleExecuteBenchmark}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs text-xs flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" /> Run Benchmark Now
              </button>
            </div>

            {benchmarkResult && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-mono space-y-3 text-xs">
                <div className="text-emerald-700 font-bold flex items-center justify-between">
                  <span>✓ Exhaustive Search Benchmark Completed</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {benchmarkResult.subsetsEvaluated.toLocaleString()} subsets evaluated for N={benchmarkResult.smallBatchSize}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">1. Exhaustive Global Optimum</span>
                    <span className="text-emerald-700 font-bold text-base">{benchmarkResult.exhaustiveScore}</span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {benchmarkResult.exhaustiveSelected} jobs • ₹{benchmarkResult.exhaustiveCost.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">2. Pure Math Greedy (Ratio-Only)</span>
                    <span className="text-sky-700 font-bold text-base">{benchmarkResult.mathGreedyScore}</span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {benchmarkResult.mathGreedySelected} jobs • ₹{benchmarkResult.mathGreedyCost.toLocaleString('en-IN')}
                      {benchmarkResult.exhaustiveScore > 0 && (
                        <span className="text-sky-700 font-bold ml-1">
                          ({((benchmarkResult.mathGreedyScore / benchmarkResult.exhaustiveScore) * 100).toFixed(1)}% of opt)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">3. Operational Policy (Emergencies First)</span>
                    <span className="text-rose-700 font-bold text-base">{benchmarkResult.operationalScore}</span>
                    <div className="text-[10px] text-slate-500 mt-1">
                      {benchmarkResult.operationalSelected} jobs • ₹{benchmarkResult.operationalCost.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200 leading-relaxed font-sans">
                  <strong>Policy vs Benchmark Distinction:</strong> The mathematical knapsack benchmark evaluates the pure ratio greedy heuristic against the true 0/1 knapsack global optimum under identical objective functions. In contrast, the operational emergency policy deliberately prioritizes life-safety and hospital connections first, which may trade off a small fraction of the theoretical knapsack score to uphold emergency service guarantees.
                </div>
              </div>
            )}
          </div>

          {/* Step-by-Step Pipeline Documentation */}
          <div className="p-4 bg-white border border-slate-200/90 rounded-xl space-y-3 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm">Deterministic 9-Stage Algorithm Pipeline:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-xs">
              <li>
                <strong className="text-slate-800">Input Validation:</strong> Reject non-positive costs, invalid hours, missing IDs, and malformed telemetry.
              </li>
              <li>
                <strong className="text-slate-800">Status Filtering & Duplicate Detection:</strong> Exclude completed/cancelled jobs; prevent double-counting duplicate IDs.
              </li>
              <li>
                <strong className="text-slate-800">Emergency Classification:</strong> Tag hospital feeds, active contamination hazards, and ruptures ≥ 200 kL/day; flag jobs exceeding total capacity for manual escalation.
              </li>
              <li>
                <strong className="text-slate-800">Normalized Benefit Scoring:</strong> Combine normalized water loss (35%), affected households (25%), severity multiplier (25%), and critical facility bonus (15%), discounted by sensor uncertainty.
              </li>
              <li>
                <strong className="text-slate-800">Deterministic Ranking:</strong> Sort by emergency flag, then by benefit-to-resource ratio, breaking ties stably by ID to ensure input-order independence.
              </li>
              <li>
                <strong className="text-slate-800">Indivisible 2D Selection:</strong> Select repair only if both remaining budget and labor hours can accommodate it.
              </li>
              <li>
                <strong className="text-slate-800">Continuous Deferral Check:</strong> When a repair does not fit, record exact deficit reasons and continue checking subsequent candidates.
              </li>
              <li>
                <strong className="text-slate-800">Audit Telemetry:</strong> Return structured selected/deferred records, resource utilization, and transparent calculation strings.
              </li>
              <li>
                <strong className="text-slate-800">Strict Bounds:</strong> Under no condition will budget or labor limits be exceeded.
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
