import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  Filter, 
  Eye, 
  ShieldCheck, 
  Compass,
  Building2
} from 'lucide-react';
import { RepairRequest, SeverityLevel } from '../types';
import { WARDS_DATA } from '../data/mockData';
import { classifyEmergency } from '../algorithm/emergency';

interface MapViewProps {
  requests: RepairRequest[];
  onSelectRequest: (request: RepairRequest) => void;
}

export const MapView: React.FC<MapViewProps> = ({ requests, onSelectRequest }) => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'EMERGENCY' | 'CRITICAL_HIGH'>('ALL');
  const [selectedPin, setSelectedPin] = useState<RepairRequest | null>(null);

  // Geographic bounds for Mayurpur NCR grid
  const MIN_LAT = 28.50;
  const MAX_LAT = 28.76;
  const MIN_LNG = 77.06;
  const MAX_LNG = 77.34;

  const projectCoord = (lat: number, lng: number) => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 800;
    const y = (1 - (lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 600;
    return {
      x: Math.max(20, Math.min(780, x)),
      y: Math.max(20, Math.min(580, y)),
    };
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (r.status === 'COMPLETED' || r.status === 'CANCELLED') return false;

      if (selectedZone !== 'ALL' && r.zone !== selectedZone) return false;

      if (filterMode === 'EMERGENCY') {
        return classifyEmergency(r, 1200000, 160).isEmergency;
      }
      if (filterMode === 'CRITICAL_HIGH') {
        return r.severity === 'CRITICAL' || r.severity === 'HIGH';
      }

      return true;
    });
  }, [requests, selectedZone, filterMode]);

  const severityPinColors: Record<SeverityLevel, { fill: string; ring: string }> = {
    CRITICAL: { fill: '#e11d48', ring: 'rgba(225, 29, 72, 0.4)' },
    HIGH: { fill: '#ea580c', ring: 'rgba(234, 88, 12, 0.3)' },
    MEDIUM: { fill: '#d97706', ring: 'rgba(217, 119, 6, 0.3)' },
    LOW: { fill: '#0284c7', ring: 'rgba(2, 132, 199, 0.3)' },
  };

  const totalVisibleWaterLoss = filteredRequests.reduce((sum, r) => sum + r.waterLossLitersPerDay, 0);

  return (
    <div className="space-y-4">
      {/* Map Control Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Mayurpur Metropolitan Pipeline Grid Map
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {filteredRequests.length} active pins
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Interactive spatial view of active leaks across 15 municipal wards
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Zone:</span>
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 font-medium"
          >
            <option value="ALL">All Zones (NCR)</option>
            <option value="Central">Central Zone</option>
            <option value="North">North Zone</option>
            <option value="South">South Zone</option>
            <option value="East">East Zone</option>
            <option value="West">West Zone</option>
          </select>

          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterMode === 'ALL' ? 'bg-white text-sky-800 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Leaks
            </button>
            <button
              onClick={() => setFilterMode('EMERGENCY')}
              className={`px-2.5 py-1 rounded text-xs transition flex items-center gap-1 ${
                filterMode === 'EMERGENCY'
                  ? 'bg-rose-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              Emergencies
            </button>
            <button
              onClick={() => setFilterMode('CRITICAL_HIGH')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterMode === 'CRITICAL_HIGH'
                  ? 'bg-orange-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Critical & High
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SVG Interactive Map (3 cols) */}
        <div className="lg:col-span-3 bg-slate-50/70 border border-slate-200/90 rounded-xl relative overflow-hidden shadow-xs min-h-[520px]">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Map Header Bar in Overlay */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Water Grid Telemetry: <strong className="font-mono text-sky-700">{(totalVisibleWaterLoss / 1000).toFixed(0)} kL/day</strong> visible</span>
          </div>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur border border-slate-200 p-2.5 rounded-lg text-[11px] text-slate-600 space-y-1 shadow-xs">
            <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">Severity Pins</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span>Critical (Hospital / Rupture)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>High Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Medium Severity</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <span>Low Severity</span>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full select-none"
            style={{ minHeight: '520px' }}
          >
            {/* River Mayur / Yamuna tributary stylization */}
            <path
              d="M 520,0 C 500,120 480,240 540,360 C 580,440 600,520 620,600"
              fill="none"
              stroke="#bae6fd"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d="M 520,0 C 500,120 480,240 540,360 C 580,440 600,520 620,600"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Major Arterial Water Feeder Aqueducts */}
            <path
              d="M 120,300 L 400,280 L 680,260"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.7"
            />
            <path
              d="M 380,80 L 400,280 L 420,540"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.7"
            />

            {/* Ward Centroid Nodes & Labels */}
            {WARDS_DATA.map((ward) => {
              const { x, y } = projectCoord(ward.lat, ward.lng);
              return (
                <g key={ward.id} className="opacity-80">
                  <circle
                    cx={x}
                    cy={y}
                    r={32}
                    fill="#f1f5f9"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.6"
                  />
                  <text
                    x={x}
                    y={y + 26}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {ward.id}
                  </text>
                </g>
              );
            })}

            {/* Pipeline Repair Leak Pins */}
            {filteredRequests.map((req) => {
              const { x, y } = projectCoord(req.location.lat, req.location.lng);
              const colors = severityPinColors[req.severity] || severityPinColors.LOW;
              const isSelected = selectedPin?.id === req.id;
              const isEmergency = classifyEmergency(req, 1200000, 160).isEmergency;
              const pinRadius = req.waterLossLitersPerDay > 150000 ? 7 : (req.waterLossLitersPerDay > 60000 ? 5.5 : 4);

              return (
                <g
                  key={req.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => {
                    setSelectedPin(req);
                  }}
                  className="cursor-pointer transition-transform duration-200"
                >
                  {/* Emergency pulsing aura */}
                  {isEmergency && (
                    <circle
                      cx="0"
                      cy="0"
                      r={pinRadius + 6}
                      fill={colors.fill}
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r={pinRadius + 4}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                  )}

                  {/* Core Pin */}
                  <circle
                    cx="0"
                    cy="0"
                    r={pinRadius}
                    fill={colors.fill}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    className="drop-shadow-xs"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Incident Drawer / Sidebar (1 col) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Pipeline Pin Details
              </h2>
              {selectedPin && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                  {selectedPin.id}
                </span>
              )}
            </div>

            {selectedPin ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedPin.severity === 'CRITICAL'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : selectedPin.severity === 'HIGH'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {selectedPin.severity}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {selectedPin.wardId} • {selectedPin.zone}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedPin.title}
                  </h3>
                  <p className="text-slate-500 text-[11px] mt-1">{selectedPin.location.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Est. Loss:</span>
                    <span className="font-bold text-sky-700 font-mono">
                      {(selectedPin.waterLossLitersPerDay / 1000).toFixed(0)} kL/day
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Repair Cost:</span>
                    <span className="font-bold text-emerald-700 font-mono">
                      ₹{selectedPin.estimatedCostInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Labor:</span>
                    <span className="font-bold text-amber-700 font-mono">
                      {selectedPin.estimatedLaborHours} hrs
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Material:</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {selectedPin.pipeMaterial} ({selectedPin.pipeDiameterMm}mm)
                    </span>
                  </div>
                </div>

                {selectedPin.criticalFacility !== 'NONE' && (
                  <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span><strong>Vicinity:</strong> {selectedPin.criticalFacility.replace(/_/g, ' ')}</span>
                  </div>
                )}

                {selectedPin.contaminationRisk && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
                    ⚠ Active sewage infiltration / drinking water contamination risk
                  </div>
                )}

                <button
                  onClick={() => onSelectRequest(selectedPin)}
                  className="w-full mt-2 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Full Inspection Report
                </button>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">Click any leak pin on the map</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  View pipe diameter, loss volume, cost, and facility proximity.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Map coordinates & impacts are simulated operational models.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
