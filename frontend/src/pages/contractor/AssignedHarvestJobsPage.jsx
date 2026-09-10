import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
import './ContractorDashboard.css';
import {
  Axe,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  X,
  Filter
} from 'lucide-react';

const AssignedHarvestJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contractorName = user?.fullName || user?.name || user?.companyName || 'Contractor Portal';

  // Assigned harvest requests state
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch assigned harvest requests
  const fetchAssignedRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await harvestService.getHarvestRequests({ all_records: true });
      if (data && Array.isArray(data.harvest_requests)) {
        const cId = user?.id || user?._id || user?.email;
        const assigned = data.harvest_requests.filter(r =>
          r.assigned_contractor_id === cId ||
          r.assigned_contractor_email === user?.email ||
          r.status === 'CONTRACTOR_ASSIGNED' ||
          r.status === 'ASSESSMENT_SUBMITTED' ||
          r.status === 'OPERATION_READY'
        );

        if (assigned.length > 0) {
          setAssignedRequests(assigned);
        } else {
          // Fallback sample assigned harvest request
          setAssignedRequests([
            {
              id: 'hr_demo_99',
              _id: 'hr_demo_99',
              propertyName: 'Green Valley Teak Plantation',
              propertyLocation: 'Kottayam, Kerala',
              owner_email: 'h4hari2003@gmail.com',
              reason: 'Mature timber harvest',
              preferred_start_date: '2026-09-10',
              preferred_end_date: '2026-09-25',
              required_services: ['Tree felling', 'Cutting', 'Timber extraction', 'Transportation', 'Site clearing'],
              site_conditions: {
                access_availability: 'Heavy vehicle access',
                road_condition: 'Paved panchayat road',
                distance_from_road: '50 meters',
                terrain: 'Gently sloped',
                additional_notes: 'Easy access from main road. Clear haul path.'
              },
              hazards: ['Power lines nearby'],
              status: 'CONTRACTOR_ASSIGNED',
              createdAt: '2026-09-10'
            }
          ]);
        }
      }
    } catch (err) {
      console.warn("Could not load contractor assigned harvest requests:", err);
      // Fallback sample on error
      setAssignedRequests([
        {
          id: 'hr_demo_99',
          _id: 'hr_demo_99',
          propertyName: 'Green Valley Teak Plantation',
          propertyLocation: 'Kottayam, Kerala',
          owner_email: 'h4hari2003@gmail.com',
          reason: 'Mature timber harvest',
          preferred_start_date: '2026-09-10',
          preferred_end_date: '2026-09-25',
          required_services: ['Tree felling', 'Timber extraction', 'Transportation'],
          site_conditions: {
            access_availability: 'Heavy vehicle access',
            road_condition: 'Paved road',
            distance_from_road: '50m',
            terrain: 'Gently sloped'
          },
          status: 'CONTRACTOR_ASSIGNED',
          createdAt: '2026-09-10'
        }
      ]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAssignedRequests();
  }, [user?.email]);

  // Filter requests
  const filteredRequests = assignedRequests.filter((req) => {
    const matchesSearch =
      !searchQuery ||
      req.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.propertyLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason?.toLowerCase().includes(searchQuery.toLowerCase());

    const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
    const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';
    const isPending = !isSubmitted && !isAccepted;

    let matchesStatus = true;
    if (statusFilter === 'PENDING') matchesStatus = isPending;
    if (statusFilter === 'SUBMITTED') matchesStatus = isSubmitted;
    if (statusFilter === 'AUTHORIZED') matchesStatus = isAccepted;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="w-full max-w-6xl mx-auto py-6 flex flex-col gap-8">

            {/* HERO HEADER CARD */}
            <div className="flex flex-wrap items-center justify-between gap-6 bg-gradient-to-r from-[#07170e] via-[#0b2416] to-[#07170e] border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                  <Axe size={14} /> CONTRACTOR JOBS PORTAL
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  Assigned Harvest Jobs & Assessment Quotations
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  Inspect landowner harvest site specifications, evaluate standing timber inventories, and submit formal contractor quotations for client authorization.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  {assignedRequests.length} Active {assignedRequests.length === 1 ? 'Job' : 'Jobs'} Assigned
                </span>
              </div>
            </div>

            {/* CONTROLS BAR: SEARCH & STATUS FILTER */}
            <div className="bg-[#0b1b12] border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="relative flex-1 w-full max-w-md">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by property, location, landowner email, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#050f09] border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Filter size={14} className="text-emerald-400" /> Status:
                </span>

                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    statusFilter === 'ALL'
                      ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                      : 'bg-[#050f09] text-slate-300 border border-emerald-500/20 hover:text-white'
                  }`}
                >
                  All ({assignedRequests.length})
                </button>

                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    statusFilter === 'PENDING'
                      ? 'bg-blue-500 text-slate-950 font-extrabold shadow-md'
                      : 'bg-[#050f09] text-slate-300 border border-emerald-500/20 hover:text-white'
                  }`}
                >
                  Pending Assessment
                </button>

                <button
                  onClick={() => setStatusFilter('SUBMITTED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    statusFilter === 'SUBMITTED'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                      : 'bg-[#050f09] text-slate-300 border border-emerald-500/20 hover:text-white'
                  }`}
                >
                  Submitted
                </button>

                <button
                  onClick={() => setStatusFilter('AUTHORIZED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    statusFilter === 'AUTHORIZED'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-md'
                      : 'bg-[#050f09] text-slate-300 border border-emerald-500/20 hover:text-white'
                  }`}
                >
                  Operation Ready
                </button>
              </div>
            </div>

            {/* JOBS LIST / EMPTY STATE */}
            {loadingRequests ? (
              <div className="bg-[#0b1b12] border border-emerald-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="text-emerald-400 animate-spin" />
                <h3 className="text-white font-bold text-base">Fetching Assigned Harvest Jobs...</h3>
                <p className="text-slate-400 text-xs">Loading harvest requests assigned by verified landowners.</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-[#0b1b12] border border-emerald-500/20 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
                <Axe size={48} className="text-emerald-500/30 mx-auto" />
                <h3 className="text-white font-bold text-lg">No Assigned Harvest Jobs Found</h3>
                <p className="text-slate-400 text-xs max-w-md">
                  {assignedRequests.length === 0
                    ? 'No harvest requests are currently assigned to your company. Check back once landowners assign your profile for site assessments.'
                    : 'No assigned jobs match your search or status filter criteria.'}
                </p>
                {statusFilter !== 'ALL' && (
                  <button
                    onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {filteredRequests.map((req) => {
                  const reqId = req.id || req._id || 'job_demo';
                  const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                  const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';

                  // Format schedule dates cleanly
                  const startDate = req.preferred_start_date || req.preferredStartDate;
                  const endDate = req.preferred_end_date || req.preferredCompletionDate;
                  let scheduleText = 'Flexible Schedule';
                  if (startDate && endDate) {
                    scheduleText = `${startDate} to ${endDate}`;
                  } else if (startDate) {
                    scheduleText = `From ${startDate}`;
                  } else if (endDate) {
                    scheduleText = `By ${endDate}`;
                  }

                  // Format services needed cleanly
                  const servicesNeededText = Array.isArray(req.required_services) && req.required_services.length > 0
                    ? req.required_services.join(', ')
                    : (req.servicesNeeded || 'Tree Felling & Extraction');

                    return (
                      <div key={reqId} className="cd-assigned-card">
                        {/* TOP SUMMARY ROW */}
                        <div className="cd-assigned-header">
                          <div className="cd-assigned-header-main">
                            <div className="cd-assigned-meta-row">
                              <span className="cd-req-id-badge">
                                Job #{reqId.substring(0, 8)}
                              </span>
                              <span className="cd-req-date">
                                <Calendar size={13} className="text-slate-500" /> Assigned: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                              </span>
                            </div>
                            <h2 className="cd-req-title">{req.propertyName || 'Forest Estate Parcel'}</h2>
                            <p className="cd-req-location">
                              <MapPin size={14} className="text-emerald-400 shrink-0" /> {req.propertyLocation || req.location || 'Kottayam, Kerala'}
                            </p>
                          </div>

                          <div className="shrink-0 self-start sm:self-center">
                            <span className={`cd-status-pill ${
                              isAccepted
                                ? 'cd-status-accepted'
                                : isSubmitted
                                  ? 'cd-status-submitted'
                                  : 'cd-status-pending'
                            }`}>
                              <Clock size={14} />
                              {isAccepted
                                ? 'Harvest Operation Authorized'
                                : isSubmitted
                                  ? 'Assessment & Quote Submitted'
                                  : 'Pending Contractor Assessment'}
                            </span>
                          </div>
                        </div>

                        {/* SPECIFICATIONS GRID */}
                        <div className="cd-specs-grid">
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Reason for Harvest</span>
                            <strong className="cd-spec-value">{req.reason || req.reasonForHarvesting || 'Mature timber harvest'}</strong>
                          </div>
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Preferred Period</span>
                            <strong className="cd-spec-value">{scheduleText}</strong>
                          </div>
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Services Required</span>
                            <strong className="cd-spec-value-emerald">{servicesNeededText}</strong>
                          </div>
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Site Access</span>
                            <strong className="cd-spec-value truncate">
                              {req.site_conditions?.access_availability || 'Heavy vehicle access'}
                            </strong>
                          </div>
                        </div>

                        {/* SITE CONDITIONS CALLOUT */}
                        {req.site_conditions && (
                          <div className="bg-[#050e08]/90 p-4 sm:p-5 rounded-2xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Truck size={14} /> Harvest Site Specifications:
                            </span>
                            <div className="flex flex-wrap gap-4 sm:gap-6 text-slate-300 text-xs">
                              <span>Road: <strong className="text-white font-semibold">{req.site_conditions.road_condition || 'Paved road'} ({req.site_conditions.distance_from_road || '50m'})</strong></span>
                              <span>Terrain: <strong className="text-white font-semibold">{req.site_conditions.terrain || 'Gently sloped'}</strong></span>
                              <span>Access: <strong className="text-white font-semibold">{req.site_conditions.access_availability || 'Heavy vehicle access'}</strong></span>
                            </div>
                          </div>
                        )}

                        {/* ACTION BAR */}
                        <div className="cd-action-bar">
                          <div className="cd-landowner-info">
                            <Mail size={14} className="text-emerald-400 shrink-0" />
                            <span>Landowner Email: <strong className="text-white font-semibold">{req.owner_email || req.landowner_email || 'landowner@treeconnect.in'}</strong></span>
                          </div>

                          <button
                            onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                            className="cd-btn-assessment"
                          >
                            <Calculator size={16} />
                            {isSubmitted ? 'Edit / Resubmit Assessment' : 'Submit Inspection Assessment & Quote'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </main>
          </div>
        </div>
      </div>
  );
};

export default AssignedHarvestJobsPage;
