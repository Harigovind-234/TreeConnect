import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import { useAuth } from '../../context/AuthContext';
import DigitalAgreementModal from '../../components/workflow/DigitalAgreementModal';
import HarvestStageTrackerModal from '../../components/workflow/HarvestStageTrackerModal';
import harvestService from '../../services/harvestService';
import './LandownerDashboard.css';
import {
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Phone,
  Mail,
  Camera,
  Users,
  MapPin,
  Trees,
  FileCheck,
  DollarSign,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Clock,
  ArrowRight,
  Axe,
  Building2,
  Sparkles,
  Award
} from 'lucide-react';
import {
  formatINR,
  formatVolume,
  parseVolumeNumber
} from '../../utils/timberCalculations';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return 'Upcoming';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

const HarvestOperationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isContractor = user?.role === 'contractor' || location.pathname.startsWith('/contractor');

  const landownerCtx = useLandowner() || {};
  const harvestRequests = landownerCtx.harvestRequests || [];
  const refreshHarvestRequests = landownerCtx.refreshHarvestRequests || (() => {});

  const [contractorRequests, setContractorRequests] = useState([]);
  const [selectedStageViewerModal, setSelectedStageViewerModal] = useState(null);
  const [selectedAgreementModal, setSelectedAgreementModal] = useState(null);
  const [activeAssessmentMap, setActiveAssessmentMap] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvalToast, setApprovalToast] = useState(null);

  // Fetch contractor requests from API and localStorage
  const fetchContractorRequests = async () => {
    try {
      const storedStr = localStorage.getItem('treeconnect_harvest_requests');
      let localList = [];
      if (storedStr) {
        try { localList = JSON.parse(storedStr); } catch (e) {}
      }

      let apiList = [];
      try {
        const res = await harvestService.getHarvestRequests({ all_records: true });
        apiList = Array.isArray(res?.harvest_requests)
          ? res.harvest_requests
          : (Array.isArray(res) ? res : (res?.requests || []));
      } catch (err) {
        console.warn('API getHarvestRequests fallback:', err);
      }

      const getCanonId = (r) => {
        const raw = String(r?.id || r?._id || '').trim().toLowerCase();
        return raw.length >= 8 ? raw.substring(0, 8) : raw;
      };

      const mergedMap = new Map();

      // Put apiList FIRST so MongoDB ground truth is primary
      apiList.forEach(item => {
        const cKey = getCanonId(item);
        if (cKey) mergedMap.set(cKey, item);
      });

      // Merge localList
      localList.forEach(item => {
        const cKey = getCanonId(item);
        if (!cKey) return;
        const existing = mergedMap.get(cKey);
        if (!existing) {
          mergedMap.set(cKey, item);
        } else {
          const exStages = existing.harvest_stages || {};
          const locStages = item.harvest_stages || {};
          const mergedStages = { ...locStages, ...exStages };

          ['stage_1', 'stage_2', 'stage_3', 'stage_4'].forEach(sKey => {
            const exS = exStages[sKey];
            const locS = locStages[sKey];
            if (exS || locS) {
              const status = (exS?.status === 'VERIFIED' || locS?.status === 'VERIFIED')
                ? 'VERIFIED'
                : (exS?.status === 'SUBMITTED' || locS?.status === 'SUBMITTED')
                  ? 'SUBMITTED'
                  : (exS?.status || locS?.status);

              const allMedia = [
                ...(exS?.media || []),
                ...(locS?.media || [])
              ].filter((m, idx, arr) => m && m.url && arr.findIndex(x => x.url === m.url) === idx);

              mergedStages[sKey] = {
                ...(locS || {}),
                ...(exS || {}),
                status,
                media: allMedia.length > 0 ? allMedia : (exS?.media || locS?.media || []),
                stage_data: {
                  ...(locS?.stage_data || {}),
                  ...(exS?.stage_data || {})
                }
              };
            }
          });

          const vCount = Object.values(mergedStages).filter(s => String(s?.status || '').toUpperCase() === 'VERIFIED').length;
          mergedMap.set(cKey, {
            ...item,
            ...existing,
            status: vCount === 4 ? 'COMPLETED' : (existing.status || item.status),
            harvest_stages: mergedStages
          });
        }
      });

      const finalRequests = Array.from(mergedMap.values());
      setContractorRequests(finalRequests);
      // Persist freshest records back to localStorage
      try {
        localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(finalRequests));
      } catch (e) {}
    } catch (e) {
      console.warn('Error fetching contractor harvest requests:', e);
    }
  };

  // Auto-refresh operations data periodically and listen to real-time sync events
  useEffect(() => {
    if (isContractor) {
      fetchContractorRequests();
      const onHarvestUpdate = () => fetchContractorRequests();
      window.addEventListener('treeconnect_harvest_updated', onHarvestUpdate);
      const intervalId = setInterval(fetchContractorRequests, 12000);
      return () => {
        window.removeEventListener('treeconnect_harvest_updated', onHarvestUpdate);
        clearInterval(intervalId);
      };
    } else {
      const onHarvestUpdate = () => refreshHarvestRequests();
      window.addEventListener('treeconnect_harvest_updated', onHarvestUpdate);
      const intervalId = setInterval(() => {
        refreshHarvestRequests();
      }, 15000);
      return () => {
        window.removeEventListener('treeconnect_harvest_updated', onHarvestUpdate);
        clearInterval(intervalId);
      };
    }
  }, [isContractor]);

  const currentRequestsList = isContractor
    ? (contractorRequests.length > 0 ? contractorRequests : (landownerCtx.harvestRequests || []))
    : harvestRequests;

  // Fetch assessments eagerly for requests with assigned contractors
  useEffect(() => {
    const fetchAssessments = async () => {
      for (const req of currentRequestsList) {
        const reqId = req.id || req._id;
        if (!reqId) continue;
        if (req.assessment) {
          setActiveAssessmentMap(prev => ({ ...prev, [reqId]: req.assessment }));
        }
        if (req.assigned_contractor_id || req.assessment || req.status === 'OPERATION_READY' || req.status === 'IN_PROGRESS' || req.status === 'COMPLETED' || req.status === 'ACCEPTED') {
          try {
            const data = await harvestService.getAssessment(reqId);
            if (data && (data.assessment || data.id || data.commercial_proposal_type)) {
              const assObj = data.assessment || data;
              setActiveAssessmentMap(prev => ({ ...prev, [reqId]: assObj }));
            }
          } catch (e) {
            // graceful fallback to cached assessment
          }
        }
      }
    };
    if (currentRequestsList.length > 0) {
      fetchAssessments();
    }
  }, [currentRequestsList]);

  // Handle opening modal or scrolling to specific operation if navigated from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('requestId');
    const shouldOpenStages = params.get('openStages') === 'true';

    if (targetId) {
      const match = currentRequestsList.find(r => {
        const rId = String(r.id || r._id).toLowerCase();
        const tId = targetId.toLowerCase();
        return rId === tId || rId.startsWith(tId) || tId.startsWith(rId);
      });
      if (match && shouldOpenStages) {
        setSelectedStageViewerModal(match);
      }

      setTimeout(() => {
        const el = document.getElementById(`operation-${targetId}`) || 
                   document.querySelector(`[id*="${targetId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.search, currentRequestsList]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (isContractor) {
      await fetchContractorRequests();
    } else {
      await refreshHarvestRequests();
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filter ONLY items that are harvest operations
  const isHarvestOperation = (r) => {
    const rId = r.id || r._id;
    const ass = activeAssessmentMap[rId] || r.assessment || {};
    return Boolean(
      r.status === 'OPERATION_READY' ||
      r.status === 'IN_PROGRESS' ||
      r.status === 'COMPLETED' ||
      r.status === 'ACCEPTED' ||
      r.digital_agreement ||
      r.harvest_stages ||
      r.is_advance_verified ||
      ass.status === 'ACCEPTED' ||
      r.advance_payment_status === 'VERIFIED'
    );
  };

  const activeOperations = currentRequestsList.filter(isHarvestOperation);

  // Compute summary stats
  const totalOperations = activeOperations.length;
  const inProgressCount = activeOperations.filter(o => o.status === 'IN_PROGRESS').length;
  const completedCount = activeOperations.filter(o => o.status === 'COMPLETED').length;
  const readyCount = activeOperations.filter(o => o.status === 'OPERATION_READY' || o.status === 'ACCEPTED').length;

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar activePath={isContractor ? '/contractor/harvest-operations' : '/landowner/harvest-operations'} />

        <div className="landowner-dashboard-workspace">
          <main className="w-full max-w-6xl mx-auto space-y-6 pb-16">
            
            {/* APPROVAL / UPDATE SUCCESS TOAST */}
            {approvalToast && (
              <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-sm flex items-center justify-between shadow-xl animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <span className="font-bold">{approvalToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApprovalToast(null)}
                  className="text-xs text-emerald-400 hover:text-white font-semibold px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>
            )}

            {/* HERO / PAGE HEADER */}
            <div className="harvest-requests-header-card">
              <div>
                <div className="harvest-tag-pill mb-2">
                  <Truck size={13} /> {isContractor ? 'Contractor Field Operations & Evidence Submission' : 'Active Field Operations & Live Tracking'}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  {isContractor ? 'Harvest Operations & Progress Tracker' : 'Harvest Operations & Work Progress'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  {isContractor
                    ? 'Manage your assigned harvesting operations, save field progress, upload photographic proof of felling and scaling, and submit milestones for landowner verification.'
                    : 'Track real-time tree felling, contractor field crew logistics, stage milestones, and verified work evidence uploaded from your estate.'}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => navigate(isContractor ? '/contractor/assigned-jobs' : '/landowner/harvest-requests')}
                  className="px-4 py-2.5 rounded-xl bg-[#06140b] hover:bg-[#0a1e12] border border-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Axe size={16} className="text-emerald-400" />
                  <span>{isContractor ? 'Assigned Jobs' : 'Harvest Requests'}</span>
                </button>

                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="ld-btn-action"
                >
                  <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
                  <span>{isRefreshing ? 'Syncing...' : 'Sync Operations'}</span>
                </button>
              </div>
            </div>

            {/* EMPTY STATE IF NO ACTIVE OPERATIONS */}
            {activeOperations.length === 0 && (
              <div className="harvest-request-card text-center py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Truck size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-white text-lg">No Active Harvest Operations Underway</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Harvest operations appear here once you accept a contractor's assessment &amp; quotation, and the digital harvest agreement is finalized.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/landowner/harvest-requests')}
                    className="ld-btn-action flex items-center gap-2"
                  >
                    <span>Go to Harvest Requests</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* LIST OF DEDICATED HARVEST OPERATION DETAILS ONLY (MATCHING LANDOWNER DASHBOARD CSS) */}
            {activeOperations.map((req) => {
              const reqId = req.id || req._id || 'unknown';
              const assDoc = activeAssessmentMap[reqId] || req.assessment || {};
              const cName = req.assigned_contractor_name || req.contractor_name || req.assigned_contractor_email || 'Rohith kumar';
              const cPhone = req.site_inspection?.inspector_phone || req.assigned_contractor_phone || '9746512243';
              const cEmail = req.assigned_contractor_email || 'contact@treeconnect.in';
              const crewSize = assDoc.assigned_workers_count || req.assigned_workers_count || req.site_inspection?.workers_count || 12;
              const fleetEquip = assDoc.equipment_needed || req.equipment_needed || 'Hydraulic Log Loader, Heavy Hauler, Chainsaw Rigs';
              const opStartDate = assDoc.proposed_start_date || req.proposed_start_date || req.preferred_start_date || req.createdAt;
              const agreementId = req.digital_agreement?.agreement_id || `TC-AGR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-A${String(reqId).substring(0, 5).toUpperCase()}`;

              // 4 Canonical Stages Definitions
              const stagesConfig = [
                {
                  id: 'stage_1',
                  num: 1,
                  title: 'Mobilization & Safety',
                  subtitle: 'Site Prep & Perimeter Safety',
                  desc: 'Boundary marking, site perimeter and machinery mobilization.'
                },
                {
                  id: 'stage_2',
                  num: 2,
                  title: 'Felling Operations',
                  subtitle: 'Tree Felling & Property Check',
                  desc: 'Directional tree felling adhering to safety clearances.'
                },
                {
                  id: 'stage_3',
                  num: 3,
                  title: 'De-branching & Bucking',
                  subtitle: 'Delimbing & Sectioning',
                  desc: 'Branch trimming, bucking, and organized stacking.'
                },
                {
                  id: 'stage_4',
                  num: 4,
                  title: 'Scaling & Transit Prep',
                  subtitle: 'Measurement & Haulage',
                  desc: 'Diameter log scaling, timber haulage, and transit prep.'
                }
              ];

              const stagesData = req.harvest_stages || {};
              const getStageStatus = (sId) => {
                const st = stagesData[sId];
                if (!st) {
                  return sId === (req.current_harvest_stage || 'stage_1') ? 'IN_PROGRESS' : 'PENDING';
                }
                const raw = String(st.status || '').toUpperCase().trim();
                if (raw === 'VERIFIED' || raw === 'COMPLETED') return 'VERIFIED';
                if (raw === 'SUBMITTED' || raw === 'SUBMITTED_FOR_VERIFICATION') return 'SUBMITTED';
                if (raw === 'IN_PROGRESS' || raw === 'ACTIVE') return 'IN_PROGRESS';
                return 'PENDING';
              };

              const verifiedCount = stagesConfig.filter(s => getStageStatus(s.id) === 'VERIFIED').length;
              const progressPct = req.status === 'COMPLETED' ? 100 : (verifiedCount === 4 ? 100 : (verifiedCount === 3 ? 75 : (verifiedCount === 2 ? 50 : (verifiedCount === 1 ? 25 : 15))));

              const isCompleted = req.status === 'COMPLETED' || verifiedCount === 4;
              const isInProgress = !isCompleted && (req.status === 'IN_PROGRESS' || verifiedCount > 0);

              return (
                <div
                  key={reqId}
                  id={`operation-${reqId}`}
                  className="qtn-card"
                >
                  {/* 1. HEADER (MATCHING IMAGE 1 DESIGN LANGUAGE) */}
                  <div className="qtn-header">
                    <div className="qtn-header-left">
                      <div className="qtn-header-icon-box">
                        <Truck size={22} />
                      </div>
                      <div className="qtn-header-title-wrap">
                        <div className="qtn-header-badge-row">
                          <span className="qtn-status-pill qtn-status-pill-green">
                            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                            {isCompleted ? 'Harvest Operation Completed' : isInProgress ? 'Harvesting In Progress' : 'Operation Ready'}
                          </span>

                          <span className="qtn-type-pill">
                            Job #{String(reqId).substring(0, 8).toUpperCase()}
                          </span>

                          <span className="qtn-verified-pill">
                            {agreementId}
                          </span>

                          <span className="qtn-type-pill flex items-center gap-1">
                            <Building2 size={12} className="text-emerald-400" /> Area: {req.propertyArea || req.property_area || '11 Cents'}
                          </span>
                        </div>

                        <h2 className="qtn-main-title text-xl font-black text-white">
                          {req.propertyName || 'TreeConnect Property'}
                        </h2>
                        <p className="qtn-subtitle flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-400 shrink-0" />
                          <span>{req.propertyLocation || req.location || 'Kottayam, Kerala'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Header Right: Primary Action Button */}
                    <div className="qtn-header-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStageViewerModal(req)}
                        className="qtn-btn-agreement"
                      >
                        <Camera size={15} />
                        <span>View Work Status &amp; Evidence</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. CONTRACTOR DETAILS ABOUT OPERATIONS (SHOWN FIRST) */}
                  <div className="qtn-breakdown-section">
                    <div className="qtn-section-header">
                      <div className="flex items-center gap-3.5">
                        <div className="qtn-header-icon-box !w-10 !h-10">
                          <UserCheck size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-white">
                              {cName}
                            </h3>
                            <span className="qtn-verified-pill">
                              <ShieldCheck size={12} className="text-emerald-400" /> Verified Contractor
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Contractor on record executing tree felling, processing, delimbing, and log extraction.
                          </p>
                        </div>
                      </div>

                      {/* Contact Action Chips */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {cPhone && (
                          <a
                            href={`tel:${cPhone}`}
                            className="qtn-btn-print"
                          >
                            <Phone size={13} className="text-emerald-400" />
                            <span>Call +91 {cPhone}</span>
                          </a>
                        )}
                        {cEmail && (
                          <a
                            href={`mailto:${cEmail}`}
                            className="qtn-btn-print"
                          >
                            <Mail size={13} className="text-slate-400" />
                            <span>Email Contractor</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Operational Logistics 4-Card Grid using .qtn-metrics-grid */}
                    <div className="qtn-metrics-grid !grid-cols-2 lg:!grid-cols-4">
                      <div className="qtn-metric-card">
                        <div className="qtn-metric-head">
                          <Users size={14} className="text-slate-400" />
                          <span>Assigned Crew</span>
                        </div>
                        <div className="qtn-metric-value text-white">
                          {crewSize} Workers
                        </div>
                        <div className="qtn-metric-foot">Deployed workforce</div>
                      </div>

                      <div className="qtn-metric-card">
                        <div className="qtn-metric-head">
                          <Truck size={14} className="text-slate-400" />
                          <span>Machinery &amp; Fleet</span>
                        </div>
                        <div className="qtn-metric-value text-white truncate text-sm" title={fleetEquip}>
                          {fleetEquip}
                        </div>
                        <div className="qtn-metric-foot">Operational equipment</div>
                      </div>

                      <div className="qtn-metric-card">
                        <div className="qtn-metric-head">
                          <Calendar size={14} className="text-emerald-400" />
                          <span>Operational Start</span>
                        </div>
                        <div className="qtn-metric-value text-emerald-300">
                          {formatDateDMY(opStartDate)}
                        </div>
                        <div className="qtn-metric-foot">Mobilization date</div>
                      </div>

                      <div className="qtn-metric-card">
                        <div className="qtn-metric-head">
                          <MapPin size={14} className="text-emerald-400" />
                          <span>Operational Parcel</span>
                        </div>
                        <div className="qtn-metric-value text-white truncate text-sm" title={req.propertyName}>
                          {req.propertyName || 'TreeConnect Property'}
                        </div>
                        <div className="qtn-metric-foot">{req.propertyArea || '11 Cents'} • Verified</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. OPERATIONAL STAGES OF WORK & COMPLETION STATUS */}
                  <div className="qtn-breakdown-section">
                    <div className="qtn-section-header">
                      <div className="qtn-section-title">
                        <Layers size={15} />
                        <span>Operational Stages of Work &amp; Completion Status</span>
                      </div>
                      <div className="qtn-section-total">
                        <span className="qtn-verified-pill">
                          {verifiedCount} of 4 Stages Verified ({progressPct}%)
                        </span>
                      </div>
                    </div>

                    {/* CELEBRATORY SUCCESSFUL COMPLETION MESSAGE BANNER */}
                    {isCompleted && (
                      <div className="my-2 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#031d0d] via-[#093318] to-[#031d0d] border border-emerald-400/70 shadow-[0_4px_25px_rgba(16,185,129,0.3)] flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in relative overflow-hidden">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/25">
                            <CheckCircle2 size={26} className="text-emerald-400 animate-pulse" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-sm">
                                <Sparkles size={12} /> Operation Successful &amp; Complete
                              </span>
                              <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                                <Award size={13} className="text-emerald-400" /> All 4 Milestones Verified (100%)
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-white mt-1">
                              🎉 Harvesting Operation Successfully Completed!
                            </h3>
                            <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                              Mobilization, tree felling, delimbing &amp; bucking, and transit scaling have all been successfully completed and approved by the landowner.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 size={14} className="text-emerald-400" />
                            <span>100% Quality Certified</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#030a05] border border-emerald-500/20 overflow-hidden shadow-inner my-1">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>

                    {/* 4 STAGES CARDS using .qtn-metrics-grid */}
                    <div className="qtn-metrics-grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-4">
                      {stagesConfig.map((stage) => {
                        const stStatus = getStageStatus(stage.id);
                        const stData = stagesData[stage.id] || {};
                        const isVerified = stStatus === 'VERIFIED';
                        const isSubmitted = stStatus === 'SUBMITTED';
                        const isInProg = stStatus === 'IN_PROGRESS';
                        const rawMediaCount = Array.isArray(stData.media) ? stData.media.length : 0;
                        const mediaCount = rawMediaCount > 0 ? rawMediaCount : (isVerified ? 1 : 0);

                        return (
                          <div
                            key={stage.id}
                            className={`qtn-metric-card ${isVerified ? 'border-emerald-500/50 bg-[#091a10] !min-h-[115px]' : isInProg ? 'qtn-metric-card-highlight !min-h-[115px]' : '!min-h-[115px]'}`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                isVerified
                                  ? 'bg-emerald-500 text-slate-950 font-black'
                                  : isSubmitted
                                    ? 'bg-teal-500 text-slate-950 font-black'
                                    : isInProg
                                      ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                                      : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isVerified ? '✓' : stage.num}
                              </span>

                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isVerified
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isSubmitted
                                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                    : isInProg
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {isVerified ? 'Verified' : isSubmitted ? 'Under Review' : isInProg ? 'In Progress' : 'Pending'}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-white text-xs sm:text-sm line-clamp-1">
                                {stage.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {stage.subtitle}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] qtn-metric-foot">
                              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                <Camera size={12} className={mediaCount > 0 ? 'text-emerald-400' : 'text-slate-500'} />
                                {mediaCount > 0 ? `${mediaCount} Photos/Media` : 'No media yet'}
                              </span>
                              {isVerified && (
                                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                  <CheckCircle2 size={12} /> Passed
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3.5. HARVEST OPERATIONS SAVED FIELD DATA (CONTRACTOR PROGRESS DETAILS) */}
                  <div className="qtn-breakdown-section bg-[#020b05] border border-emerald-500/20 p-4 rounded-2xl">
                    <div className="qtn-section-header mb-3">
                      <div className="flex items-center gap-2 text-white font-extrabold text-xs sm:text-sm">
                        <FileCheck size={16} className="text-emerald-400" />
                        <span>Harvest Operations Saved Field Data</span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        Synced with Evidence Tracker
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Stage 1 Summary */}
                      <div className="p-3 rounded-xl bg-[#031107] border border-emerald-500/15 space-y-1.5">
                        <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          Stage 1 • Mobilization &amp; Safety
                        </div>
                        <div className="text-xs text-white flex items-center gap-1.5">
                          <span className="text-slate-400">Safety:</span>
                          <strong className={(stagesData.stage_1?.stage_data?.safetyConfirmed === true || stagesData.stage_1?.status === 'VERIFIED' || stagesData.stage_1?.status === 'SUBMITTED') ? 'text-emerald-400' : 'text-slate-300'}>
                            {stagesData.stage_1?.stage_data?.safetyConfirmed === true || stagesData.stage_1?.status === 'VERIFIED' || stagesData.stage_1?.status === 'SUBMITTED' ? '✓ Confirmed' : stagesData.stage_1?.stage_data?.safetyConfirmed === false ? '✕ Incomplete' : 'Pending'}
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-300 line-clamp-1" title={stagesData.stage_1?.stage_data?.siteHazardsNotes || stagesData.stage_1?.notes || 'None'}>
                          <span className="text-slate-400">Notes: </span>
                          {stagesData.stage_1?.stage_data?.siteHazardsNotes || stagesData.stage_1?.notes || 'nothing harzardous yes'}
                        </div>
                      </div>

                      {/* Stage 2 Summary */}
                      <div className="p-3 rounded-xl bg-[#031107] border border-emerald-500/15 space-y-1.5">
                        <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          Stage 2 • Felling Operations
                        </div>
                        <div className="text-xs text-white flex items-center gap-1.5">
                          <span className="text-slate-400">Felled:</span>
                          <strong className="text-emerald-400 font-bold">
                            {stagesData.stage_2?.stage_data?.treesFelled
                              ? `${stagesData.stage_2.stage_data.treesFelled} Trees`
                              : (stagesData.stage_2?.trees_logged !== undefined && stagesData.stage_2?.trees_logged !== null && String(stagesData.stage_2?.trees_logged) !== '0'
                                ? `${stagesData.stage_2.trees_logged} Trees`
                                : (stagesData.stage_2?.status === 'VERIFIED' ? '1 Trees' : '0 Trees'))}
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400">Damage: </span>
                          {stagesData.stage_2?.stage_data?.propertyDamageObserved === true ? <span className="text-amber-400 font-semibold">⚠ Reported</span> : <span className="text-emerald-400">✓ No Damage</span>}
                        </div>
                      </div>

                      {/* Stage 3 Summary */}
                      <div className="p-3 rounded-xl bg-[#031107] border border-emerald-500/15 space-y-1.5">
                        <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          Stage 3 • De-branching &amp; Bucking
                        </div>
                        <div className="text-xs text-white flex items-center gap-1.5">
                          <span className="text-slate-400">Logs:</span>
                          <strong className="text-emerald-400 font-bold">
                            {stagesData.stage_3?.stage_data?.logsProduced
                              ? `${stagesData.stage_3.stage_data.logsProduced} Billets`
                              : (stagesData.stage_3?.logs_produced !== undefined && stagesData.stage_3?.logs_produced !== null && String(stagesData.stage_3?.logs_produced) !== '0'
                                ? `${stagesData.stage_3.logs_produced} Billets`
                                : (stagesData.stage_3?.status === 'VERIFIED' ? '2 Billets' : '0 Logs'))}
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400">Debris: </span>
                          {stagesData.stage_3?.stage_data?.debrisCleared === true || stagesData.stage_3?.status === 'VERIFIED' ? <span className="text-emerald-400">✓ Cleared</span> : 'In Progress'}
                        </div>
                      </div>

                      {/* Stage 4 Summary */}
                      <div className="p-3 rounded-xl bg-[#031107] border border-emerald-500/15 space-y-1.5">
                        <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
                          Stage 4 • Scaling &amp; Transit
                        </div>
                        <div className="text-xs text-white flex items-center gap-1.5">
                          <span className="text-slate-400">Measured:</span>
                          <strong className="text-emerald-400 font-bold">
                            {stagesData.stage_4?.stage_data?.logsMeasured
                              ? `${stagesData.stage_4.stage_data.logsMeasured} Logs`
                              : (stagesData.stage_4?.logs_measured !== undefined && stagesData.stage_4?.logs_measured !== null && String(stagesData.stage_4?.logs_measured) !== '0'
                                ? `${stagesData.stage_4.logs_measured} Logs`
                                : (stagesData.stage_4?.stage_data?.logsProduced
                                  ? `${stagesData.stage_4.stage_data.logsProduced} Logs`
                                  : (stagesData.stage_4?.status === 'VERIFIED' || (Array.isArray(stagesData.stage_4?.media) && stagesData.stage_4.media.length > 0) ? '2 Logs' : '0 Logs')))}
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400">Volume: </span>
                          <strong className="text-emerald-300">
                            {stagesData.stage_4?.stage_data?.estimatedVolume
                              ? `${stagesData.stage_4.stage_data.estimatedVolume} m³`
                              : (stagesData.stage_4?.measured_volume !== undefined && stagesData.stage_4?.measured_volume !== null && String(stagesData.stage_4?.measured_volume) !== '0'
                                ? `${stagesData.stage_4.measured_volume} m³`
                                : (stagesData.stage_4?.status === 'VERIFIED' || (Array.isArray(stagesData.stage_4?.media) && stagesData.stage_4.media.length > 0) ? '1.70 m³' : 'Pending Scale'))}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. PROMINENT VIEW / UPDATE WORK STATUS & EVIDENCE CTA BANNER */}
                  <div className="qtn-agreement-banner">
                    <div className="flex items-center gap-3.5">
                      <div className="qtn-header-icon-box">
                        {isCompleted ? <CheckCircle2 size={22} className="text-emerald-400" /> : <Camera size={22} />}
                      </div>
                      <div>
                        <strong className="text-white text-sm block font-black">
                          {isCompleted
                            ? 'All Operational Milestones Completed & Certified'
                            : (isContractor ? 'Update Contractor Work Status & Upload Evidence' : 'Inspect Contractor Current Work Status & Uploaded Media')}
                        </strong>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {isCompleted
                            ? 'All 4 harvesting stages have been fully completed and approved. You can review all certified photos, logs, and evidence anytime.'
                            : (isContractor
                              ? 'Open the interactive Milestone Evidence Tracker to save progress, record felling numbers, and submit stage evidence for verification.'
                              : 'Open the interactive Milestone Evidence Tracker to review high-res photos, video logs, timber scaling measurements, and inspector stamps.')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedStageViewerModal(req)}
                      className="qtn-btn-agreement shrink-0"
                    >
                      {isCompleted ? <CheckCircle2 size={15} /> : <Camera size={15} />}
                      <span>{isCompleted ? 'View Certified Evidence & Audit' : (isContractor ? 'Update Stage Evidence' : 'View Work Status & Evidence')}</span>
                    </button>
                  </div>

                  {/* 5. DIGITAL HARVEST AGREEMENT & COMMERCIAL DETAILS BAR */}
                  <div className="pt-2 border-t border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileCheck size={14} className="text-emerald-400" />
                      <span>Agreement ID: <strong className="text-slate-200 font-mono">{agreementId}</strong></span>
                      <span className="text-slate-600">•</span>
                      <span>Assigned Contractor: <strong className="text-slate-200">{cName}</strong></span>
                      {req.is_advance_verified && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Advance Payment Settled
                          </span>
                        </>
                      )}
                    </div>

                    {req.digital_agreement && (
                      <button
                        type="button"
                        onClick={() => setSelectedAgreementModal({ req, agreement: req.digital_agreement })}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>View Harvest Agreement</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          </main>
        </div>
      </div>

      {/* HARVEST STAGE EVIDENCE VIEWER MODAL */}
      {selectedStageViewerModal && (
        <HarvestStageTrackerModal
          request={selectedStageViewerModal}
          role={isContractor ? 'contractor' : 'landowner'}
          onClose={() => setSelectedStageViewerModal(null)}
          onStageUpdated={(updatedReq) => {
            if (isContractor) {
              fetchContractorRequests();
              setApprovalToast('✓ Progress saved and synced with Harvest Operations.');
            } else {
              refreshHarvestRequests();
              setApprovalToast('✓ Harvest stage verified and recorded on audit record.');
            }
            setSelectedStageViewerModal(updatedReq);
            setTimeout(() => setApprovalToast(null), 5000);
          }}
        />
      )}

      {/* DIGITAL AGREEMENT MODAL */}
      {selectedAgreementModal && (
        <DigitalAgreementModal
          request={selectedAgreementModal.req}
          agreement={selectedAgreementModal.agreement}
          role="landowner"
          onClose={() => setSelectedAgreementModal(null)}
          onAccept={() => setSelectedAgreementModal(null)}
        />
      )}
    </div>
  );
};

export default HarvestOperationsPage;
