import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  ArrowUpDown, 
  Droplets, 
  IndianRupee, 
  Clock, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X,
  Building2,
  AlertCircle
} from 'lucide-react';
import { RepairRequest, SeverityLevel, RepairStatus } from '../types';
import { WARDS_DATA } from '../data/mockData';
import { classifyEmergency } from '../algorithm/emergency';

interface RequestListProps {
  requests: RepairRequest[];
  onSelectRequest: (request: RepairRequest) => void;
  onOpenCreateModal: () => void;
  initialWardFilter?: string;
  onClearInitialWardFilter?: () => void;
}

export const RequestList: React.FC<RequestListProps> = ({
  requests,
  onSelectRequest,
  onOpenCreateModal,
  initialWardFilter,
  onClearInitialWardFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [wardFilter, setWardFilter] = useState<string>(initialWardFilter || 'ALL');
  const [materialFilter, setMaterialFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const [sortField, setSortField] = useState<'waterLoss' | 'cost' | 'hours' | 'households' | 'date'>('waterLoss');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sync initial ward filter if prop changes
  React.useEffect(() => {
    if (initialWardFilter) {
      setWardFilter(initialWardFilter);
    }
  }, [initialWardFilter]);

  // Filtering logic
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          req.id.toLowerCase().includes(query) ||
          req.title.toLowerCase().includes(query) ||
          req.wardName.toLowerCase().includes(query) ||
          req.location.address.toLowerCase().includes(query) ||
          req.pipeMaterial.toLowerCase().includes(query) ||
          req.damageType.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Severity
      if (severityFilter !== 'ALL' && req.severity !== severityFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

      // Ward
      if (wardFilter !== 'ALL' && req.wardId !== wardFilter) return false;

      // Material
      if (materialFilter !== 'ALL' && req.pipeMaterial !== materialFilter) return false;

      // Facility
      if (facilityFilter !== 'ALL' && req.criticalFacility !== facilityFilter) return false;

      // Emergency
      if (emergencyOnly) {
        const isEm = classifyEmergency(req, 1200000, 160).isEmergency;
        if (!isEm) return false;
      }

      return true;
    });
  }, [requests, searchTerm, severityFilter, statusFilter, wardFilter, materialFilter, facilityFilter, emergencyOnly]);

  // Sorting logic
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'waterLoss') {
        comparison = a.waterLossLitersPerDay - b.waterLossLitersPerDay;
      } else if (sortField === 'cost') {
        comparison = a.estimatedCostInr - b.estimatedCostInr;
      } else if (sortField === 'hours') {
        comparison = a.estimatedLaborHours - b.estimatedLaborHours;
      } else if (sortField === 'households') {
        comparison = a.affectedHouseholds - b.affectedHouseholds;
      } else if (sortField === 'date') {
        comparison = new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredRequests, sortField, sortOrder]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / itemsPerPage));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRequests.slice(start, start + itemsPerPage);
  }, [sortedRequests, currentPage, itemsPerPage]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
    setWardFilter('ALL');
    setMaterialFilter('ALL');
    setFacilityFilter('ALL');
    setEmergencyOnly(false);
    setCurrentPage(1);
    if (onClearInitialWardFilter) onClearInitialWardFilter();
  };

  const severityBadges: Record<SeverityLevel, string> = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const statusBadges: Record<RepairStatus, string> = {
    REPORTED: 'bg-slate-100 text-slate-700 border-slate-200',
    SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-zinc-100 text-zinc-400 line-through border-zinc-200',
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Pipeline Repair Requests
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold">
              {filteredRequests.length} results
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time municipal intake, acoustic logger alarms, and field telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Log Repair Request
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ID, location, ward, pipe material, damage type..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:bg-white font-medium"
            >
              <option value="waterLoss">Est. Water Loss</option>
              <option value="cost">Estimated Cost</option>
              <option value="hours">Labor Hours</option>
              <option value="households">Affected Households</option>
              <option value="date">Date Logged</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title={`Switch to ${sortOrder === 'desc' ? 'Ascending' : 'Descending'}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span>Filters:</span>
          </div>

          {/* Severity filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 text-xs font-medium"
          >
            <option value="ALL">Severity: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 text-xs font-medium"
          >
            <option value="ALL">Status: All</option>
            <option value="REPORTED">Reported</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Ward filter */}
          <select
            value={wardFilter}
            onChange={(e) => {
              setWardFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 text-xs font-medium max-w-[160px] truncate"
          >
            <option value="ALL">Ward: All Wards</option>
            {WARDS_DATA.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id}: {w.name}
              </option>
            ))}
          </select>

          {/* Material filter */}
          <select
            value={materialFilter}
            onChange={(e) => {
              setMaterialFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 text-xs font-medium"
          >
            <option value="ALL">Material: All</option>
            <option value="DI">DI (Ductile Iron)</option>
            <option value="CI">CI (Cast Iron)</option>
            <option value="MS">MS (Mild Steel)</option>
            <option value="HDPE">HDPE</option>
            <option value="GI">GI (Galvanized)</option>
            <option value="RCC">RCC (Concrete)</option>
          </select>

          {/* Facility filter */}
          <select
            value={facilityFilter}
            onChange={(e) => {
              setFacilityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-sky-500 text-xs font-medium"
          >
            <option value="ALL">Facility: All</option>
            <option value="HOSPITAL">Hospital</option>
            <option value="DIALYSIS_CENTER">Dialysis Center</option>
            <option value="SCHOOL">School</option>
            <option value="RAILWAY_STATION">Railway / Bus</option>
            <option value="FIRE_STATION">Fire Station</option>
            <option value="DENSE_RESIDENTIAL">Dense Residential</option>
          </select>

          {/* Emergency only toggle */}
          <button
            onClick={() => {
              setEmergencyOnly(!emergencyOnly);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              emergencyOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergencies Only</span>
          </button>

          {(severityFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            wardFilter !== 'ALL' ||
            materialFilter !== 'ALL' ||
            facilityFilter !== 'ALL' ||
            emergencyOnly ||
            searchTerm) && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-sky-600 hover:text-sky-800 ml-auto flex items-center gap-1 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">ID & Title</th>
                <th className="py-3 px-4">Ward & Pipe Specs</th>
                <th className="py-3 px-4">Est. Water Loss</th>
                <th className="py-3 px-4">Impacted</th>
                <th className="py-3 px-4">Cost & Hours</th>
                <th className="py-3 px-4">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800">No repair requests match current filters</p>
                    <button
                      onClick={resetAllFilters}
                      className="mt-2 text-xs text-sky-600 hover:underline font-semibold"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((req) => {
                  const emergency = classifyEmergency(req, 1200000, 160);
                  return (
                    <tr
                      key={req.id}
                      onClick={() => onSelectRequest(req)}
                      className="hover:bg-slate-50/80 cursor-pointer transition group"
                    >
                      {/* ID, Title, Severity */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sky-700 font-bold">{req.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] border uppercase tracking-wider ${
                              severityBadges[req.severity]
                            }`}
                          >
                            {req.severity}
                          </span>
                          {emergency.isEmergency && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              EMERGENCY
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 group-hover:text-sky-600 line-clamp-1 transition">
                          {req.title}
                        </div>
                        {req.criticalFacility !== 'NONE' && (
                          <div className="text-[11px] text-indigo-700 mt-0.5 font-medium flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-500" />
                            Vicinity: {req.criticalFacility.replace(/_/g, ' ')}
                          </div>
                        )}
                      </td>

                      {/* Ward & Pipe Specs */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{req.wardName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {req.pipeMaterial} • {req.pipeDiameterMm}mm Ø • {req.damageType.replace(/_/g, ' ')}
                        </div>
                        {req.contaminationRisk && (
                          <span className="text-[10px] font-semibold text-amber-700 flex items-center gap-1 mt-0.5">
                            ⚠ Contamination Risk
                          </span>
                        )}
                      </td>

                      {/* Water Loss */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-sky-700 text-sm tabular-nums">
                          <Droplets className="w-3.5 h-3.5 text-sky-500" />
                          {(req.waterLossLitersPerDay / 1000).toFixed(0)} <span className="text-xs font-normal text-slate-500">kL/day</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {req.waterLossLitersPerDay.toLocaleString()} L/day (est.)
                        </div>
                      </td>

                      {/* Households */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          {req.affectedHouseholds.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-500">Households (est.)</div>
                      </td>

                      {/* Cost & Hours */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold text-emerald-700 tabular-nums">
                          <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                          ₹{req.estimatedCostInr.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-amber-700 flex items-center gap-1 mt-0.5 font-medium tabular-nums">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {req.estimatedLaborHours} hrs crew labor
                        </div>
                      </td>

                      {/* Status & Action */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              statusBadges[req.status]
                            }`}
                          >
                            {req.status.replace(/_/g, ' ')}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRequest(req);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="py-3 px-4 bg-slate-50/70 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, sortedRequests.length)} of {sortedRequests.length} requests
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
