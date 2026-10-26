import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { Overview } from './components/Overview';
import { RequestList } from './components/RequestList';
import { OptimizationCenter } from './components/OptimizationCenter';
import { Analytics } from './components/Analytics';
import { MapView } from './components/MapView';
import { CreateRequestModal } from './components/CreateRequestModal';
import { RequestDetailModal } from './components/RequestDetailModal';

import { RepairRequest, RepairStatus, OptimizationConstraints, OptimizationWeights } from './types';
import { 
  getStoredRequests, 
  addRepairRequest, 
  updateRepairRequest, 
  deleteRepairRequest, 
  resetToDemoData,
  getStoredConstraints,
  saveStoredConstraints,
  getStoredWeights,
  saveStoredWeights
} from './storage/storage';
import { classifyEmergency } from './algorithm/emergency';
import { Droplet, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [constraints, setConstraints] = useState<OptimizationConstraints>(getStoredConstraints());
  const [weights, setWeights] = useState<OptimizationWeights>(getStoredWeights());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);

  // Cross-view filtering link
  const [initialWardFilter, setInitialWardFilter] = useState<string | undefined>(undefined);

  // Load initial data on mount
  useEffect(() => {
    const loadedRequests = getStoredRequests();
    setRequests(loadedRequests);
  }, []);

  // Emergency count calculation
  const emergencyCount = useMemo(() => {
    return requests.filter((r) => {
      if (r.status === 'COMPLETED' || r.status === 'CANCELLED') return false;
      return classifyEmergency(r, constraints.totalBudgetInr, constraints.totalLaborHours).isEmergency;
    }).length;
  }, [requests, constraints]);

  // Handlers
  const handleAddRequest = (newReq: RepairRequest) => {
    const updated = addRepairRequest(newReq);
    setRequests(updated);
  };

  const handleUpdateStatus = (id: string, newStatus: RepairStatus) => {
    const req = requests.find((r) => r.id === id);
    if (req) {
      const updatedItem: RepairRequest = { ...req, status: newStatus };
      const updatedList = updateRepairRequest(updatedItem);
      setRequests(updatedList);
      setSelectedRequest(updatedItem);
    }
  };

  const handleUpdateRequest = (updatedItem: RepairRequest) => {
    const updatedList = updateRepairRequest(updatedItem);
    setRequests(updatedList);
    setSelectedRequest(updatedItem);
  };

  const handleDeleteRequest = (id: string) => {
    const updated = deleteRepairRequest(id);
    setRequests(updated);
    if (selectedRequest?.id === id) {
      setSelectedRequest(null);
    }
  };

  const handleResetData = () => {
    const fresh = resetToDemoData();
    setRequests(fresh);
    setSelectedRequest(null);
  };

  const handleSaveConstraints = (newConstraints: OptimizationConstraints) => {
    setConstraints(newConstraints);
    saveStoredConstraints(newConstraints);
  };

  const handleSaveWeights = (newWeights: OptimizationWeights) => {
    setWeights(newWeights);
    saveStoredWeights(newWeights);
  };

  const handleFilterWardFromOverview = (wardId: string) => {
    setInitialWardFilter(wardId);
    setActiveTab('requests');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRequestsCount={requests.length}
        emergencyCount={emergencyCount}
        onResetData={handleResetData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <Overview
            requests={requests}
            setActiveTab={setActiveTab}
            onSelectRequest={(r) => setSelectedRequest(r)}
            onFilterWard={handleFilterWardFromOverview}
          />
        )}

        {activeTab === 'requests' && (
          <RequestList
            requests={requests}
            onSelectRequest={(r) => setSelectedRequest(r)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            initialWardFilter={initialWardFilter}
            onClearInitialWardFilter={() => setInitialWardFilter(undefined)}
          />
        )}

        {activeTab === 'optimization' && (
          <OptimizationCenter
            requests={requests}
            constraints={constraints}
            onSaveConstraints={handleSaveConstraints}
            weights={weights}
            onSaveWeights={handleSaveWeights}
            onSelectRequest={(r) => setSelectedRequest(r)}
          />
        )}

        {activeTab === 'analytics' && <Analytics requests={requests} />}

        {activeTab === 'map' && (
          <MapView
            requests={requests}
            onSelectRequest={(r) => setSelectedRequest(r)}
          />
        )}
      </main>

      {/* Footer with Mandatory Disclaimer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-800">AquaPriority</span>
            <span className="text-slate-500">— Mayurpur Mahanagar Jal Sansthan (MMJS) Division IV</span>
          </div>

          <div className="flex items-center gap-1.5 text-center text-slate-600">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              All figures and impacts are operational model estimates, not audited municipal savings. Built with pure deterministic greedy knapsack scheduling.
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Fictional Indian City Dataset • 90 Wards & Pipelines
          </div>
        </div>
      </footer>

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdd={handleAddRequest}
        existingRequests={requests}
      />

      {/* Request Inspection Modal */}
      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteRequest}
        onUpdateRequest={handleUpdateRequest}
      />
    </div>
  );
};
