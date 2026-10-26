import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { RepairRequest } from '../types';
import { BarChart3, PieChart as PieIcon, TrendingUp, ShieldAlert, Layers } from 'lucide-react';

interface AnalyticsProps {
  requests: RepairRequest[];
}

const COLORS = ['#0284c7', '#2563eb', '#6366f1', '#ec4899', '#f97316', '#10b981'];
const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#e11d48',
  HIGH: '#ea580c',
  MEDIUM: '#d97706',
  LOW: '#0284c7',
};

export const Analytics: React.FC<AnalyticsProps> = ({ requests }) => {
  const activeRequests = useMemo(() => {
    return requests.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  }, [requests]);

  // 1. Ward-wise Analysis
  const wardData = useMemo(() => {
    const map = new Map<string, { wardName: string; waterLossKl: number; costLakhs: number; count: number }>();

    for (const req of activeRequests) {
      const existing = map.get(req.wardId) || {
        wardName: req.wardName.split(' ')[0], // short name for chart axis
        waterLossKl: 0,
        costLakhs: 0,
        count: 0,
      };
      existing.waterLossKl += req.waterLossLitersPerDay / 1000;
      existing.costLakhs += req.estimatedCostInr / 100000;
      existing.count += 1;
      map.set(req.wardId, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.waterLossKl - a.waterLossKl)
      .slice(0, 8);
  }, [activeRequests]);

  // 2. Material Breakdown
  const materialData = useMemo(() => {
    const map = new Map<string, { material: string; count: number; avgHours: number; totalHours: number }>();

    for (const req of activeRequests) {
      const existing = map.get(req.pipeMaterial) || {
        material: req.pipeMaterial,
        count: 0,
        avgHours: 0,
        totalHours: 0,
      };
      existing.count += 1;
      existing.totalHours += req.estimatedLaborHours;
      map.set(req.pipeMaterial, existing);
    }

    return Array.from(map.values()).map((m) => ({
      material: m.material,
      count: m.count,
      avgHours: Number((m.totalHours / m.count).toFixed(1)),
    }));
  }, [activeRequests]);

  // 3. Severity Distribution
  const severityData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; count: number }>();

    for (const req of activeRequests) {
      const existing = map.get(req.severity) || {
        name: req.severity,
        value: 0,
        count: 0,
      };
      existing.value += req.waterLossLitersPerDay / 1000;
      existing.count += 1;
      map.set(req.severity, existing);
    }

    return Array.from(map.values());
  }, [activeRequests]);

  // 4. Damage Type Breakdown
  const damageData = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();

    for (const req of activeRequests) {
      const label = req.damageType.replace(/_/g, ' ');
      const existing = map.get(label) || { name: label, count: 0 };
      existing.count += 1;
      map.set(label, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [activeRequests]);

  // 5. Cost vs Water Loss Frontier Curve (sorted by ratio)
  const frontierData = useMemo(() => {
    const sorted = [...activeRequests].sort(
      (a, b) =>
        b.waterLossLitersPerDay / b.estimatedCostInr -
        a.waterLossLitersPerDay / a.estimatedCostInr
    );

    let cumCost = 0;
    let cumWater = 0;
    return sorted.map((r, index) => {
      cumCost += r.estimatedCostInr / 100000;
      cumWater += r.waterLossLitersPerDay / 1000;
      return {
        step: index + 1,
        cumulativeCostLakhs: Number(cumCost.toFixed(2)),
        cumulativeWaterSavedKl: Number(cumWater.toFixed(1)),
        title: r.id,
      };
    });
  }, [activeRequests]);

  return (
    <div className="space-y-6">
      {/* Analytics Disclaimer Notice */}
      <div className="bg-sky-50/70 border border-sky-200/90 rounded-xl p-4 flex items-center gap-3 text-xs text-sky-900 shadow-xs">
        <ShieldAlert className="w-5 h-5 text-sky-600 shrink-0" />
        <div>
          <span className="font-semibold text-slate-900">Engineering Analytics Advisory:</span> All water loss curves, material failure frequencies, and frontier projections are operational models for decision support, not actual audited municipal savings.
        </div>
      </div>

      {/* Grid: 2 Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward-wise Water Loss vs Budget Need */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                Ward Water Loss (kL/day) vs Est. Cost (₹ Lakhs)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Top 8 municipal wards ranked by water loss volume</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="wardName" 
                  stroke="#64748b" 
                  fontSize={11} 
                  angle={-20} 
                  textAnchor="end" 
                  tick={{ fill: '#64748b' }}
                />
                <YAxis yAxisId="left" stroke="#0284c7" fontSize={11} tick={{ fill: '#0284c7' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#059669" fontSize={11} tick={{ fill: '#059669' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="waterLossKl" name="Water Loss (kL/day)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="costLakhs" name="Est. Cost (₹ Lakhs)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diminishing Marginal Returns / Frontier Curve */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Cumulative Water Saved vs Budget Expenditure
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Frontier curve demonstrating high initial ROI from greedy prioritization
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={frontierData} margin={{ top: 10, right: 15, left: -5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="cumulativeCostLakhs" stroke="#64748b" fontSize={11} unit=" ₹L" tick={{ fill: '#64748b' }} />
                <YAxis stroke="#0284c7" fontSize={11} unit=" kL" tick={{ fill: '#0284c7' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any, name: string) => [
                    name === 'cumulativeWaterSavedKl' ? `${val} kL` : `₹${val} Lakhs`,
                    name === 'cumulativeWaterSavedKl' ? 'Cumulative Water Saved' : 'Cumulative Cost'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeWaterSavedKl"
                  name="Water Saved (kL/day)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: 3 Medium Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pipe Material vs Average Hours */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Material Incidents & Avg Hours
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="material" stroke="#64748b" fontSize={11} tick={{ fill: '#64748b' }} />
                <YAxis stroke="#64748b" fontSize={11} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="count" name="Incidents" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgHours" name="Avg Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-rose-600" />
            Water Loss Share by Severity
          </h2>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`${Number(val).toFixed(0)} kL/day`, 'Water Loss']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Damage Type Distribution */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-600" />
            Failure Mechanism Frequency
          </h2>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={damageData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  dataKey="count"
                >
                  {damageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [`${val} leaks`, 'Incidents']}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
