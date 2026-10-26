import React from 'react';
import { 
  Droplets, 
  LayoutDashboard, 
  Wrench, 
  Sliders, 
  BarChart3, 
  Map, 
  RotateCcw,
  AlertTriangle,
  Activity
} from 'lucide-react';

export type ActiveTab = 'overview' | 'requests' | 'optimization' | 'analytics' | 'map';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalRequestsCount: number;
  emergencyCount: number;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalRequestsCount,
  emergencyCount,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Top Municipal Meta Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] font-medium border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold tracking-wide">
            Mayurpur Mahanagar Jal Sansthan (MMJS)
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            Engineering Division IV • Pipeline SCADA & Operations
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Telemetry: <strong>Operational (90 Wards Monitored)</strong></span>
          </div>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400">Cycle: Q4-2026</span>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Context */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-sm ring-1 ring-sky-500/20">
              <Droplets className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">AquaPriority</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold uppercase tracking-wide">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate hidden sm:block">
                Water Repair Resource Prioritization Platform
              </p>
            </div>
          </div>

          {/* Navigation Items (Segmented / Pill Style) */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'requests'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              Repair Requests
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'requests' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {totalRequestsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('optimization')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'optimization'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Optimization Center
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'map'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              City Map
            </button>
          </nav>

          {/* Quick Actions & Emergency Tag */}
          <div className="flex items-center gap-2.5">
            {emergencyCount > 0 && (
              <button 
                onClick={() => setActiveTab('requests')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition shadow-xs"
                title={`${emergencyCount} active emergency incidents requiring urgent dispatch`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{emergencyCount} Emergencies</span>
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm('Reset all pipeline repair requests to the standard 90-record fictional dataset? Any logged additions or status edits will be reset.')) {
                  onResetData();
                }
              }}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition shadow-xs"
              title="Reset Demo Data (Fictional Municipal Records)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 bg-slate-50 text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${activeTab === 'overview' ? 'text-sky-600 font-semibold' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${activeTab === 'requests' ? 'text-sky-600 font-semibold' : 'text-slate-500'}`}
        >
          <Wrench className="w-4 h-4" />
          <span>Requests</span>
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${activeTab === 'optimization' ? 'text-sky-600 font-semibold' : 'text-slate-500'}`}
        >
          <Sliders className="w-4 h-4" />
          <span>Optimize</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${activeTab === 'analytics' ? 'text-sky-600 font-semibold' : 'text-slate-500'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${activeTab === 'map' ? 'text-sky-600 font-semibold' : 'text-slate-500'}`}
        >
          <Map className="w-4 h-4" />
          <span>Map</span>
        </button>
      </div>
    </header>
  );
};
