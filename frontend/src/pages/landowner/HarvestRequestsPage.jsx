import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import {
  Axe,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

const HarvestRequestsPage = () => {
  const navigate = useNavigate();
  const { harvestRequests } = useLandowner();

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-6xl mx-auto py-6">

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-main flex items-center gap-2">
                  <Axe className="text-emerald" size={26} /> Harvest Requests
                </h1>
                <p className="text-sm text-muted">Track submitted harvest requests and review licensed contractor quotations.</p>
              </div>

              <button
                onClick={() => navigate('/landowner/request-harvest')}
                className="btn btn-primary"
              >
                <Plus size={16} /> Request Harvesting
              </button>
            </div>

            {/* Request List */}
            <div className="space-y-4">
              {harvestRequests.map((req) => (
                <div key={req.id} className="card p-6 border border-color rounded-xl bg-card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-color pb-3">
                    <div>
                      <span className="text-xs text-muted block">Harvest Request #{req.id}</span>
                      <h2 className="text-lg font-bold text-main">{req.propertyName}</h2>
                      <p className="text-xs text-muted flex items-center gap-1">
                        <MapPin size={13} className="text-emerald" /> {req.location} • {req.area}
                      </p>
                    </div>

                    <span className="status-pill status-yellow text-xs font-semibold flex items-center gap-1">
                      <Clock size={12} /> {req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted block mb-1">Scope & Detail:</span>
                      <span className="font-semibold text-main block">{req.harvestScope}</span>
                      <span className="text-emerald">{req.harvestScopeDetail}</span>
                    </div>

                    <div>
                      <span className="text-muted block mb-1">Est. Volume:</span>
                      <span className="font-bold text-emerald text-sm font-mono">{req.estimatedVolume}</span>
                    </div>

                    <div>
                      <span className="text-muted block mb-1">Reason:</span>
                      <span className="font-semibold text-main">{req.reasonForHarvesting}</span>
                    </div>

                    <div>
                      <span className="text-muted block mb-1">Requested Dates:</span>
                      <span className="font-semibold text-main">{req.preferredStartDate} to {req.preferredCompletionDate}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-color flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {req.requiredServices.map(s => (
                        <span key={s} className="px-2 py-0.5 rounded bg-surface border border-color text-muted">
                          {s}
                        </span>
                      ))}
                    </div>
                    <span className="text-muted">Submitted: {req.submittedAt}</span>
                  </div>
                </div>
              ))}
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default HarvestRequestsPage;
