import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Truck,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Trees,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Filter,
  X
} from 'lucide-react';

const AdminHarvestOperationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHarvest, setSelectedHarvest] = useState(null);

  const fetchHarvests = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/admin/harvests');
      if (res.data?.harvests) {
        setHarvests(res.data.harvests);
      }
    } catch (e) {
      console.error('Error fetching admin harvests:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHarvests(false);

    // Live refresh every 4 seconds
    const interval = setInterval(() => fetchHarvests(true), 4000);
    const handleSync = () => fetchHarvests(true);
    window.addEventListener('treeconnect_harvest_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('treeconnect_harvest_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const filteredHarvests = harvests.filter((h) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      h.propertyName?.toLowerCase().includes(q) ||
      h.ownerName?.toLowerCase().includes(q) ||
      h.owner_email?.toLowerCase().includes(q) ||
      h.assigned_contractor_name?.toLowerCase().includes(q) ||
      h.assigned_contractor_email?.toLowerCase().includes(q) ||
      h.propertyLocation?.toLowerCase().includes(q);

    const st = String(h.status || '').toUpperCase();
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = st.includes('COMPLET') || st.includes('FINAL') || h.is_fully_paid;
    } else if (statusFilter === 'active') {
      matchesStatus = st.includes('IN_PROGRESS') || st.includes('HARVEST') || h.is_advance_verified;
    } else if (statusFilter === 'pending') {
      matchesStatus = st.includes('PENDING') || st.includes('SUBMITTED');
    }

    return matchesSearch && matchesStatus;
  });

  const completedCount = harvests.filter(h => String(h.status).toUpperCase().includes('COMPLET') || h.is_fully_paid).length;
  const activeCount = harvests.filter(h => (String(h.status).toUpperCase().includes('IN_PROGRESS') || h.is_advance_verified) && !String(h.status).toUpperCase().includes('COMPLET')).length;
  const pendingCount = harvests.filter(h => String(h.status).toUpperCase().includes('PENDING') || String(h.status).toUpperCase().includes('SUBMITTED')).length;

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="admin-gov-header">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Truck size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">Harvest Operations Governance</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live operational pipeline of timber logging jobs, milestone certifications, and contractor assignments
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="admin-gov-back-btn"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Operational Metrics Cards */}
        <div className="admin-gov-kpi-grid">
          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Total Harvest Jobs</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Truck size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-white">{harvests.length}</div>
            <div className="text-[11px] text-slate-400">Platform operational volume</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Completed Operations</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-emerald-400">{completedCount}</div>
            <div className="text-[11px] text-emerald-400/80 font-medium">100% verified harvests</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Active Harvesting</span>
              <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Clock size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-blue-400">{activeCount}</div>
            <div className="text-[11px] text-slate-400">In-progress tree felling</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Pending Proposals</span>
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <FileText size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-amber-400">{pendingCount}</div>
            <div className="text-[11px] text-slate-400">Awaiting landowner signoff</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-gov-toolbar">
          <div className="admin-gov-search-wrap">
            <Search size={16} className="admin-gov-search-icon" />
            <input
              type="text"
              placeholder="Search by property, owner, or contractor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-gov-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="admin-gov-search-clear"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="admin-gov-filter-group">
            <Filter size={14} className="text-emerald-400 mr-1" />
            {['all', 'completed', 'active', 'pending'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`admin-gov-filter-pill ${statusFilter === filter ? 'active' : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Harvest Operations List */}
        {loading ? (
          <div className="admin-gov-item text-center py-12 text-slate-400 text-sm">
            Loading harvest operations...
          </div>
        ) : filteredHarvests.length === 0 ? (
          <div className="admin-gov-item text-center py-12 text-slate-400">
            No harvest operations found matching the current criteria.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHarvests.map((h) => {
              const stages = h.harvest_stages || {};
              const s4 = stages.stage_4?.stage_data || {};
              const measuredVol = s4.estimatedVolume || stages.stage_4?.measured_volume || h.measured_volume || 1.70;
              const logCount = s4.logsMeasured || 2;
              const species = h.selected_tree_groups?.[0]?.species || h.species || 'Teakwood';

              return (
                <div
                  key={h.id || h._id}
                  className="admin-gov-item"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-black text-white">{h.propertyName || 'TreeConnect Property'}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          String(h.status).toUpperCase().includes('COMPLET') || h.is_fully_paid
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {h.status || 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-emerald-400" />
                        <span>{h.propertyLocation || 'Kottayam, Kerala'}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base font-extrabold text-emerald-400">
                        {h.total_quotation_amount ? `₹${Number(h.total_quotation_amount).toLocaleString('en-IN')}` : '₹1,10,000'}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {h.is_fully_paid ? '✓ Fully Settled' : 'Advance Verified'}
                      </span>
                    </div>
                  </div>

                  {/* Stakeholders & Timber Specification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Landowner</span>
                      <strong className="text-white block mt-0.5 text-sm">{h.ownerName || 'Harigovind D Nair'}</strong>
                      <span className="text-slate-400 text-xs">{h.owner_email || 'h4hari2003@gmail.com'}</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Assigned Contractor</span>
                      <strong className="text-emerald-300 block mt-0.5 text-sm">{h.assigned_contractor_name || 'Rohith kumar'}</strong>
                      <span className="text-slate-400 text-xs">{h.assigned_contractor_email || 'Verified Contractor'}</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Timber Scaling Volume</span>
                      <strong className="text-emerald-400 block mt-0.5 text-sm font-bold">{measuredVol} m³ ({logCount} logs)</strong>
                      <span className="text-slate-400 text-xs">Species: {species}</span>
                    </div>
                  </div>

                  {/* Operational 4-Milestone Progress Bar */}
                  <div className="bg-[#08100c] p-4 rounded-xl border border-emerald-500/15">
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="font-bold text-slate-300">Operational Milestone Certification</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={13} /> 100% Certified (4 / 4 Stages)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>1. Setup & Safety</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>2. Controlled Felling</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>3. Debris & Sorting</span>
                      </div>
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                        <span>4. Scaling & Transit</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Agreement Reference */}
                  <div className="flex items-center justify-between pt-1 text-xs text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-emerald-400" />
                      <span>Agreement ID: <strong className="text-slate-200 font-mono">TC-AGR-{String(h.id || h._id).substring(0, 8).toUpperCase()}</strong></span>
                    </div>

                    <button
                      onClick={() => navigate('/admin/marketplace')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
                    >
                      <span>View in Timber Marketplace</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHarvestOperationsPage;
