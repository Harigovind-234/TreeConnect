import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
import './ContractorDashboard.css';
import {
  Truck,
  Compass,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  TrendingUp,
  ShieldCheck,
  Plus,
  DollarSign,
  Calculator,
  Activity,
  CloudSun,
  Wind,
  Droplets,
  Bell,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
  X,
  AlertTriangle,
  Award,
  TreePine,
  Trees,
  ZoomIn,
  Image as ImageIcon,
  Camera,
  Loader2,
  Mail,
  ExternalLink,
  UserCheck,
  Phone,
  Building2
} from 'lucide-react';

const DEFAULT_PROPERTY_PHOTOS = [];

const DEFAULT_TREE_INVENTORY = [];

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contractorName = user?.fullName || user?.name || user?.companyName || 'Apex Harvesting Co.';

  // Assigned harvest requests from backend DB
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Compact / Expandable state for harvest requests
  const [expandedReqs, setExpandedReqs] = useState({});
  const [detailModalReq, setDetailModalReq] = useState(null);

  const toggleExpandReq = (reqId) => {
    setExpandedReqs(prev => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };

  // Legacy Bid Modal state
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [bidRateInput, setBidRateInput] = useState('');
  const [bidNotesInput, setBidNotesInput] = useState('');

  const [jobs, setJobs] = useState([
    {
      id: 'job_1',
      owner: 'Robert Pine / Green Valley Estate',
      parcel: 'Wayanad Teak & Hardwood Plantation (35 Acres)',
      location: 'Wayanad, Kerala',
      species: 'Teakwood & Rosewood',
      volume: '850 m³',
      deadline: 'Aug 28, 2026',
      estBudget: '₹ 14,50,000',
      myBid: null
    },
    {
      id: 'job_2',
      owner: 'Pacific Lumber & Timber Co.',
      parcel: 'Palakkad Rubberwood Stand #9',
      location: 'Palakkad, Kerala',
      species: 'Rubberwood & Mahogany',
      volume: '1,400 m³',
      deadline: 'Sep 15, 2026',
      estBudget: '₹ 18,20,000',
      myBid: '₹ 17,80,000'
    }
  ]);

  const [fleetEquipment, setFleetEquipment] = useState([
    { id: 1, name: 'Caterpillar 545D Skidder', category: 'Skidder', status: 'In Operation', location: 'Wayanad Stand #1', operator: 'Dave Miller', lastService: '2026-07-20' },
    { id: 2, name: 'Tigercat 870D Feller Buncher', category: 'Feller Buncher', status: 'In Operation', location: 'Wayanad Stand #1', operator: 'Sarah Jenkins', lastService: '2026-07-15' },
    { id: 3, name: 'Komatsu XT445L-5 Harvester', category: 'Harvester', status: 'Maintenance', location: 'Central Workshop', operator: 'Unassigned', lastService: '2026-08-01' },
    { id: 4, name: 'Volvo FMX Log Hauler Truck', category: 'Log Truck', status: 'In Operation', location: 'Palakkad Route #4', operator: 'Rajesh Kumar', lastService: '2026-07-28' }
  ]);

  // Fetch assigned harvest requests
  const fetchAssignedRequests = async () => {
    setLoadingRequests(true);
    try {
      const storedUserStr = localStorage.getItem('treeconnect_user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const currentUser = user || storedUser;

      const cId = currentUser?.id || currentUser?._id || '';
      const cEmail = (currentUser?.email || '').toLowerCase().trim();
      const cName = (currentUser?.fullName || currentUser?.name || currentUser?.companyName || currentUser?.username || '').toLowerCase().trim();

      // Combine backend & local storage harvest requests, deduplicating by ID
      let backendRequests = [];
      try {
        const data = await harvestService.getHarvestRequests({ all_records: true });
        if (data && Array.isArray(data.harvest_requests)) {
          backendRequests = data.harvest_requests;
        }
      } catch (e) {
        console.warn("Backend harvest requests fetch failed:", e);
      }

      let localRequests = [];
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          localRequests = JSON.parse(stored);
        }
      } catch (e) { }

      const allMap = new Map();
      [...backendRequests, ...localRequests].forEach(r => {
        const rId = r?.id || r?._id;
        if (rId && !allMap.has(rId)) {
          allMap.set(rId, r);
        }
      });
      const combinedRequests = Array.from(allMap.values());

      let assigned = combinedRequests.filter(r => {
        if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;

        const reqCId = String(r.assigned_contractor_id || r.contractor_id || r.assignedContractorId || '');
        const reqCEmail = String(r.assigned_contractor_email || r.contractor_email || r.assignedContractorEmail || '').toLowerCase().trim();
        const reqCName = String(r.assigned_contractor_name || r.contractor_name || r.assignedContractorName || '').toLowerCase().trim();

        // 1. Direct ID match
        const isMatchId = Boolean(cId && reqCId && (reqCId === String(cId) || (currentUser?._id && reqCId === String(currentUser._id))));

        // 2. Direct email match
        const isMatchEmail = Boolean(cEmail && (
          (reqCEmail && (reqCEmail === cEmail || reqCEmail.includes(cEmail) || cEmail.includes(reqCEmail))) ||
          (reqCName && reqCName === cEmail)
        ));

        // 3. Name match (exact or partial / first name match e.g. "Rohith" vs "Rohith kumar")
        const firstName = cName ? cName.split(' ')[0] : '';
        const reqFirstName = reqCName ? reqCName.split(' ')[0] : '';

        const isMatchName = Boolean(cName && reqCName && (
          reqCName === cName ||
          reqCName.includes(cName) ||
          cName.includes(reqCName) ||
          (firstName && firstName.length >= 3 && reqCName.includes(firstName)) ||
          (reqFirstName && reqFirstName.length >= 3 && cName.includes(reqFirstName))
        ));

        const isDirectlyAssigned = isMatchId || isMatchEmail || isMatchName;

        const isAssignedStatus = r.status === 'CONTRACTOR_ASSIGNED' ||
          r.status === 'ASSESSMENT_SUBMITTED' ||
          r.status === 'OPERATION_READY' ||
          r.status === 'IN_PROGRESS';

        if (isDirectlyAssigned) return true;

        if (isAssignedStatus) {
          if (!reqCName && !reqCId && !reqCEmail) return true;
          if (firstName && firstName.length >= 3 && reqCName && reqCName.includes(firstName)) return true;
          if (reqFirstName && reqFirstName.length >= 3 && cName && cName.includes(reqFirstName)) return true;
          if (currentUser?.role === 'contractor' && (reqCName || reqCId || reqCEmail)) return true;
        }

        return false;
      });

      // Fallback matching if name/ID format had slight discrepancy
      if (assigned.length === 0 && combinedRequests.length > 0) {
        const activeAssigned = combinedRequests.filter(r => {
          if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;
          const statusMatch = r.status === 'CONTRACTOR_ASSIGNED' || r.status === 'ASSESSMENT_SUBMITTED' || r.status === 'OPERATION_READY' || r.status === 'IN_PROGRESS';
          if (!statusMatch) return false;

          const reqCName = String(r.assigned_contractor_name || r.contractor_name || '').toLowerCase().trim();
          if (!reqCName) return true;

          const firstName = cName ? cName.split(' ')[0] : '';
          const reqFirstName = reqCName ? reqCName.split(' ')[0] : '';
          return !cName || (firstName && reqCName.includes(firstName)) || (reqFirstName && cName.includes(reqFirstName));
        });
        if (activeAssigned.length > 0) {
          assigned = activeAssigned;
        }
      }

      if (assigned.length > 0) {
        const enriched = assigned.map(req => ({
          ...req,
          propertyArea: req.propertyArea || (req.property_details?.totalArea ? `${req.property_details?.totalArea} ${req.property_details?.areaUnit || 'Acres'}` : '14.5 Acres'),
          surveyNumber: req.surveyNumber || req.property_details?.surveyNumber || 'Sy. #184/3B',
          landType: req.landType || req.property_details?.propertyType || 'Commercial Hardwood Plantation',
          propertyPhotos: (Array.isArray(req.photos) && req.photos.length > 0) ? req.photos : ((Array.isArray(req.propertyPhotos) && req.propertyPhotos.length > 0) ? req.propertyPhotos : []),
          tree_inventory: (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
            ? req.selected_tree_groups
            : (Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
              ? req.tree_inventory
              : (Array.isArray(req.tree_inventories) && req.tree_inventories.length > 0)
                ? req.tree_inventories
                : (Array.isArray(req.property_details?.tree_inventory) && req.property_details.tree_inventory.length > 0)
                  ? req.property_details.tree_inventory
                  : (Array.isArray(req.property_details?.tree_inventories) && req.property_details.tree_inventories.length > 0)
                    ? req.property_details.tree_inventories
                    : []
        }));
        setAssignedRequests(enriched);
      } else {
        setAssignedRequests([]);
      }
    } catch (err) {
      console.warn("Could not load contractor assigned harvest requests:", err);
      setAssignedRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAssignedRequests();

    const handleStorageChange = (e) => {
      if (!e || e.key === 'treeconnect_harvest_requests' || e.key === 'treeconnect_user') {
        fetchAssignedRequests();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', fetchAssignedRequests);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', fetchAssignedRequests);
    };
  }, [user]);

  const handleOpenBidModal = (job) => {
    setSelectedJob(job);
    setBidAmountInput('');
    setBidRateInput('');
    setBidNotesInput('');
    setShowBidModal(true);
  };

  const handleSubmitBid = (e) => {
    e.preventDefault();
    if (!bidAmountInput || !selectedJob) return;

    setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, myBid: `₹ ${Number(bidAmountInput).toLocaleString('en-IN')}` } : j));
    setShowBidModal(false);
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content">

            {/* HERO WELCOME CARD */}
            <section className="hero-welcome-card card">
              <div className="hero-welcome-body">
                <div className="hero-welcome-text">
                  <span className="hero-greeting-badge">
                    <Award size={14} /> Verified Kerala Harvesting Contractor
                  </span>
                  <h1 className="hero-title-text">Welcome Back, {contractorName}</h1>
                  <p className="hero-subtitle-text">
                    Review assigned landowner harvest requests, inspect site specifications & tree inventories, and submit formal contractor assessments & quotations.
                  </p>
                </div>
              </div>
            </section>

            {/* ASSIGNED LANDOWNER HARVEST REQUESTS (ASSESSMENT WORKFLOW) */}
            <section className="dashboard-section card highlight-card border border-emerald-500/30">
              <div className="card-header flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="live-indicator"><span className="pulse-dot"></span> ASSIGNED HARVEST JOBS</span>
                  <h2 className="section-heading">Assigned Harvest Requests & Assessment Quotations</h2>
                  <p className="section-subtext">Inspect landowner site conditions & tree inventory to submit harvestable volume & price quotations</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="dash-user-count font-semibold text-emerald">{assignedRequests.length} Assigned</span>
                  <button
                    onClick={() => navigate('/contractor/assigned-jobs')}
                    className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    View All Dedicated <ExternalLink size={13} />
                  </button>
                </div>
              </div>

              {loadingRequests ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                  <span>Loading assigned harvest jobs...</span>
                </div>
              ) : assignedRequests.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No landowner harvest requests currently assigned to your company.
                </div>
              ) : (
                <div className="flex flex-col gap-6 pt-2">
                  {assignedRequests.map((req) => {
                    const reqId = req.id || req._id || 'job_demo';
                    const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                    const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';

                    const propDetails = req.property_details || {};
                    const propName = req.propertyName || propDetails.propertyName || 'Forest Estate Parcel';

                    const district = propDetails.district || propDetails.village || 'Kottayam';
                    const state = propDetails.state || 'Kerala';
                    const propLocation = req.propertyLocation || req.location || `${district}, ${state}`;

                    // Live land parcel metrics
                    const landArea = propDetails.totalArea
                      ? `${propDetails.totalArea} ${propDetails.areaUnit || 'Acres'}`
                      : (req.propertyArea || '11.93 Cents');

                    const surveyNo = propDetails.surveyNumber || propDetails.survey_number || propDetails.cadastralNo || req.surveyNumber || `Sy. #${(req.property_id || reqId).substring(0, 8)}`;

                    const landClassification = propDetails.propertyType || propDetails.landType || req.landType || 'Residential Forestry Plot';

                    // Schedule & services
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

                    const servicesNeededText = Array.isArray(req.required_services) && req.required_services.length > 0
                      ? req.required_services.join(', ')
                      : (req.servicesNeeded || 'Tree Felling & Extraction');

                    // Resolve Landowner Details
                    let matchingStoredProp = null;
                    try {
                      const storedPropsRaw = localStorage.getItem('treeconnect_properties');
                      if (storedPropsRaw) {
                        const storedProps = JSON.parse(storedPropsRaw);
                        if (Array.isArray(storedProps)) {
                          const propId = req.property_id || req.propertyId;
                          const ownerEmail = req.owner_email || req.landowner_email || req.userEmail;
                          matchingStoredProp = storedProps.find(item => {
                            if (!item) return false;
                            if (propId && (item.id === propId || item._id === propId || String(item.id) === String(propId) || String(item._id) === String(propId))) return true;
                            if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
                            if (req.propertyName && item.propertyName && item.propertyName.toLowerCase() === req.propertyName.toLowerCase()) return true;
                            return false;
                          });
                        }
                      }
                    } catch (e) {}

                    const ownerNameVal = req.ownerName || propDetails.ownerName || matchingStoredProp?.ownerName || req.landownerName || 'Harigovind D Nair';
                    const contactPhoneVal = req.contactNumber || propDetails.contactNumber || matchingStoredProp?.contactNumber || '9746794654';
                    const ownerEmailVal = req.owner_email || req.landowner_email || propDetails.userEmail || matchingStoredProp?.userEmail || 'h4hari2003@gmail.com';
                    const villageVal = req.village || propDetails.village || matchingStoredProp?.village || 'Nagampadam';
                    const localBodyVal = req.localBody || propDetails.localBody || matchingStoredProp?.localBody || 'Meenadom Panchayat';
                    const pinVal = req.pinCode || propDetails.pinCode || matchingStoredProp?.pinCode || '686516';
                    const districtStateVal = [req.district || propDetails.district || matchingStoredProp?.district || 'Kottayam', req.state || propDetails.state || matchingStoredProp?.state || 'Kerala'].filter(Boolean).join(', ');
                    const landownerEmail = ownerEmailVal;



                    const isExpanded = !!expandedReqs[reqId];

                    return (
                      <div key={reqId} className={`cd-assigned-card transition-all duration-300 ${isExpanded ? 'cd-assigned-card-expanded' : ''}`}>
                        {/* COMPACT SUMMARY ROW */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left: Landowner & Essential Information */}
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 font-extrabold text-base shadow-inner shrink-0 mt-0.5 sm:mt-0">
                              {ownerNameVal ? ownerNameVal.charAt(0).toUpperCase() : 'L'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-extrabold text-white truncate">{ownerNameVal}</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 flex items-center gap-1 shrink-0">
                                  <UserCheck size={11} className="text-emerald-400" /> Verified Landowner
                                </span>
                                <span className="cd-req-id-badge text-[11px] py-0.5 px-2">
                                  Job #{reqId.substring(0, 8)}
                                </span>
                              </div>

                              {/* Essential Info Row */}
                              <div className="flex items-center gap-2.5 text-xs text-slate-300 mt-1 flex-wrap">
                                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                                  <Trees size={13} className="shrink-0" />
                                  <span className="truncate max-w-[180px] sm:max-w-none">{propName}</span>
                                </span>
                                <span className="text-slate-600 hidden sm:inline">•</span>
                                <span className="flex items-center gap-1 text-slate-300">
                                  <MapPin size={13} className="text-emerald-400 shrink-0" />
                                  <span>{propLocation}</span>
                                </span>
                                <span className="text-slate-600 hidden md:inline">•</span>
                                <span className="cd-req-date hidden md:inline-flex items-center gap-1 text-slate-400">
                                  <Calendar size={12} className="text-slate-500" /> Assigned: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Status Pill & Action Buttons */}
                          <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start lg:self-center">
                            <span className={`cd-status-pill text-xs py-1.5 px-3.5 ${
                              isAccepted
                                ? 'cd-status-accepted'
                                : isSubmitted
                                  ? 'cd-status-submitted'
                                  : 'cd-status-pending'
                            }`}>
                              <Clock size={12} />
                              {isAccepted ? 'Authorized' : isSubmitted ? 'Quote Submitted' : 'Pending Assessment'}
                            </span>

                            {/* Button to show entire details about that harvest request */}
                            <button
                              type="button"
                              onClick={() => toggleExpandReq(reqId)}
                              className={`cd-btn-toggle-details ${isExpanded ? 'expanded' : ''}`}
                              title={isExpanded ? "Collapse Details" : "Show Entire Details"}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={14} className="text-emerald-400" />
                                  <span>Hide Details</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={14} className="text-emerald-400" />
                                  <span>Show Entire Details</span>
                                </>
                              )}
                            </button>

                            {/* Button to check all details in dedicated Assigned Jobs */}
                            <button
                              type="button"
                              onClick={() => navigate('/contractor/assigned-jobs')}
                              className="cd-btn-view-portal"
                            >
                              <Trees size={14} />
                              <span>Check Details in Assigned Jobs</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>

                        {/* ENTIRE DETAILS ACCORDION (REVEALED ON DEMAND) */}
                        {isExpanded && (
                          <div className="mt-2 pt-4 border-t border-emerald-500/20 flex flex-col gap-4 animate-in fade-in duration-200">
                            {/* Contact & Modal Bar */}
                            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#041008] p-3 rounded-xl border border-emerald-500/20">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-300 font-semibold">Landowner Contact & Verification:</span>
                                <span className="text-xs font-mono text-emerald-300 font-bold">{ownerNameVal}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`mailto:${ownerEmailVal}`}
                                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                  <Mail size={12} className="text-emerald-400" /> Email Landowner
                                </a>
                                {contactPhoneVal && (
                                  <a
                                    href={`tel:${contactPhoneVal}`}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-600/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                                  >
                                    <Phone size={12} className="text-emerald-400" /> Call ({contactPhoneVal})
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDetailModalReq({
                                    reqId,
                                    ownerNameVal,
                                    contactPhoneVal,
                                    ownerEmailVal,
                                    villageVal,
                                    localBodyVal,
                                    pinVal,
                                    districtStateVal,
                                    propName,
                                    propLocation,
                                    scheduleText,
                                    servicesNeededText,
                                    reason: req.reason,
                                    createdAt: req.createdAt,
                                    status: req.status
                                  })}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Open in Pop-up Modal"
                                >
                                  <ExternalLink size={12} /> Pop-up Modal
                                </button>
                              </div>
                            </div>

                            {/* Complete 6-field Landowner & Property Grid */}
                            <div className="cd-landowner-grid">
                              <div className="cd-landowner-item">
                                <span className="cd-landowner-label">Landowner Email</span>
                                <span className="cd-landowner-val text-emerald-300 font-mono flex items-center gap-1.5">
                                  <Mail size={13} className="text-slate-400 shrink-0" />
                                  <a href={`mailto:${ownerEmailVal}`} className="hover:underline truncate">{ownerEmailVal}</a>
                                </span>
                              </div>

                              <div className="cd-landowner-item">
                                <span className="cd-landowner-label">Contact Phone</span>
                                <span className="cd-landowner-val text-white font-mono flex items-center gap-1.5">
                                  <Phone size={13} className="text-slate-400 shrink-0" />
                                  <a href={`tel:${contactPhoneVal}`} className="hover:underline">{contactPhoneVal}</a>
                                </span>
                              </div>

                              <div className="cd-landowner-item">
                                <span className="cd-landowner-label">Village & Local Body</span>
                                <span className="cd-landowner-val text-white flex items-center gap-1.5">
                                  <Building2 size={13} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{villageVal} ({localBodyVal})</span>
                                </span>
                              </div>

                              <div className="cd-landowner-item">
                                <span className="cd-landowner-label">District & State</span>
                                <span className="cd-landowner-val text-white flex items-center gap-1.5">
                                  <MapPin size={13} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{districtStateVal} - {pinVal}</span>
                                </span>
                              </div>

                              <div className="cd-landowner-item">
                                <span className="cd-landowner-label">Registered Property</span>
                                <span className="cd-landowner-val text-emerald-400 font-bold flex items-center gap-1.5">
                                  <Trees size={13} className="text-emerald-400 shrink-0" />
                                  <span className="truncate">{propName}</span>
                                </span>
                              </div>

                              <div className="cd-landowner-item">
                                <span className="cd-landowner-label">Harvest Reason & Schedule</span>
                                <span className="cd-landowner-val text-white flex items-center gap-1.5">
                                  <Calendar size={13} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{req.reason || 'Mature timber harvest'} ({scheduleText})</span>
                                </span>
                              </div>
                            </div>

                            {/* Prompt Box with Quick Links */}
                            <div className="cd-assigned-prompt-box flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs text-slate-300">
                                <Trees size={16} className="text-emerald-400 shrink-0" />
                                <span>
                                  Complete standing tree inventory, DBH & height specs, cadastral survey, parcel specifications, and high-resolution site photos are available in the <strong>Assigned Jobs</strong> portal.
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => navigate('/contractor/assigned-jobs')}
                                  className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <span>Tree Inventory</span>
                                  <ChevronRight size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleExpandReq(reqId)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>Close</span>
                                  <ChevronUp size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* AVAILABLE HARVESTING JOB BOARD */}
            <section className="dashboard-section card">
              <div className="card-header">
                <div>
                  <h2 className="section-heading">Available Timber Harvesting Job Board</h2>
                  <p className="section-subtext">Verified timber land listings open for contractor bids in Kerala</p>
                </div>
                <span className="dash-user-count font-semibold text-emerald">{jobs.length} Active Listings</span>
              </div>

              <div className="contractor-jobs-list">
                {jobs.map((j) => (
                  <div key={j.id} className="contractor-job-card">
                    <div className="contractor-job-header">
                      <div>
                        <h4 className="contractor-job-title">{j.parcel}</h4>
                        <p className="contractor-job-owner">
                          <span>{j.owner}</span>
                          <span className="contractor-job-loc"><MapPin size={13} /> {j.location}</span>
                        </p>
                      </div>
                      <span className="contractor-volume-badge">{j.volume}</span>
                    </div>

                    <div className="contractor-job-details">
                      <div className="contractor-job-detail-item">
                        <span className="contractor-detail-label">Target Species</span>
                        <span className="contractor-detail-value">{j.species}</span>
                      </div>
                      <div className="contractor-job-detail-item">
                        <span className="contractor-detail-label">Bid Deadline</span>
                        <span className="contractor-detail-value">{j.deadline}</span>
                      </div>
                    </div>

                    <div className="contractor-job-footer">
                      <div className="text-xs text-slate-300 font-medium">
                        Est. Project Budget: <strong className="text-emerald-400 font-extrabold">{j.estBudget}</strong>
                      </div>
                      {j.myBid ? (
                        <span className="contractor-bid-badge">
                          <CheckCircle2 size={14} className="text-emerald-400" /> Bid Submitted: {j.myBid}
                        </span>
                      ) : (
                        <button
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
                          onClick={() => handleOpenBidModal(j)}
                        >
                          <Send size={14} /> Submit Harvest Bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* MACHINERY FLEET */}
            <section className="dashboard-section card">
              <div className="card-header">
                <div>
                  <h2 className="section-heading"><Truck size={18} /> Logging Machinery Fleet Status</h2>
                  <p className="section-subtext">Monitor equipment deployment, assigned operators, and maintenance schedule</p>
                </div>
                <span className="dash-user-count font-semibold">{fleetEquipment.length} Fleet Units</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Machinery Model</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Deployed Location</th>
                      <th>Assigned Operator</th>
                      <th>Last Serviced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetEquipment.map((eq) => (
                      <tr key={eq.id}>
                        <td className="font-semibold text-white">{eq.name}</td>
                        <td><span className="dash-tag">{eq.category}</span></td>
                        <td>
                          <span className={`status-pill ${eq.status === 'In Operation' ? 'status-green' : 'status-yellow'}`}>
                            {eq.status === 'In Operation' ? <CheckCircle2 size={13} /> : <Wrench size={13} />}
                            {eq.status}
                          </span>
                        </td>
                        <td className="text-slate-300">{eq.location}</td>
                        <td className="text-white font-medium">{eq.operator}</td>
                        <td className="text-slate-400 text-xs">{eq.lastService}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </main>

          {/* RIGHT PANEL */}
          <aside className="right-insights-panel">
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><ShieldCheck size={16} /> Verification Status</span>
                <span className="widget-badge badge-green font-semibold">Active</span>
              </div>
              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 mt-2">
                <p className="text-xs text-emerald-300 font-bold mb-1">Licensed Kerala Contractor</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Verified by TreeConnect Administrator. Authorized for commercial timber felling and log transport.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Submit Harvest Bid Modal */}
      {showBidModal && selectedJob && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-lg w-full">
            <div className="modal-header flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send size={18} className="text-emerald-400" />
                <span>Submit Harvesting Bid</span>
              </h3>
              <button className="btn-icon cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowBidModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitBid} className="modal-body space-y-4 pt-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-white text-sm">{selectedJob.parcel}</p>
                <p className="text-slate-300">Owner: {selectedJob.owner} • Location: {selectedJob.location}</p>
                <p className="text-emerald-400 font-semibold">Target Volume: {selectedJob.volume} • Species: {selectedJob.species}</p>
              </div>

              <div className="form-group">
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Total Bid Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1450000"
                  value={bidAmountInput}
                  onChange={(e) => setBidAmountInput(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-white font-bold"
                />
              </div>

              <div className="modal-actions flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBidModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={15} /> Confirm & Submit Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HARVEST REQUEST ENTIRE DETAILS POPUP MODAL */}
      {detailModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#07170e] border border-emerald-500/40 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 font-extrabold text-xl shadow-inner">
                  {detailModalReq.ownerNameVal ? detailModalReq.ownerNameVal.charAt(0).toUpperCase() : 'L'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{detailModalReq.ownerNameVal}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/90 border border-emerald-600/40 text-emerald-300 flex items-center gap-1">
                      <UserCheck size={11} className="text-emerald-400" /> Verified Landowner
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Harvest Request • Job #{detailModalReq.reqId?.substring(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailModalReq(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#030d07] p-3.5 rounded-2xl border border-emerald-500/15">
              <span className="text-xs text-slate-300 font-semibold">Direct Contact Channels</span>
              <div className="flex items-center gap-2">
                <a
                  href={`mailto:${detailModalReq.ownerEmailVal}`}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Mail size={13} className="text-emerald-400" /> Email Landowner
                </a>
                {detailModalReq.contactPhoneVal && (
                  <a
                    href={`tel:${detailModalReq.contactPhoneVal}`}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-600/40 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Phone size={13} className="text-emerald-400" /> Call ({detailModalReq.contactPhoneVal})
                  </a>
                )}
              </div>
            </div>

            <div className="cd-landowner-grid">
              <div className="cd-landowner-item">
                <span className="cd-landowner-label">Landowner Email</span>
                <span className="cd-landowner-val text-emerald-300 font-mono flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <a href={`mailto:${detailModalReq.ownerEmailVal}`} className="hover:underline truncate">{detailModalReq.ownerEmailVal}</a>
                </span>
              </div>

              <div className="cd-landowner-item">
                <span className="cd-landowner-label">Contact Phone</span>
                <span className="cd-landowner-val text-white font-mono flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <a href={`tel:${detailModalReq.contactPhoneVal}`} className="hover:underline">{detailModalReq.contactPhoneVal}</a>
                </span>
              </div>

              <div className="cd-landowner-item">
                <span className="cd-landowner-label">Village & Local Body</span>
                <span className="cd-landowner-val text-white flex items-center gap-1.5">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  <span>{detailModalReq.villageVal} ({detailModalReq.localBodyVal})</span>
                </span>
              </div>

              <div className="cd-landowner-item">
                <span className="cd-landowner-label">District & State</span>
                <span className="cd-landowner-val text-white flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{detailModalReq.districtStateVal} - {detailModalReq.pinVal}</span>
                </span>
              </div>

              <div className="cd-landowner-item">
                <span className="cd-landowner-label">Registered Property</span>
                <span className="cd-landowner-val text-emerald-400 font-bold flex items-center gap-1.5">
                  <Trees size={13} className="text-emerald-400 shrink-0" />
                  <span>{detailModalReq.propName}</span>
                </span>
              </div>

              <div className="cd-landowner-item">
                <span className="cd-landowner-label">Harvest Reason & Schedule</span>
                <span className="cd-landowner-val text-white flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{detailModalReq.reason || 'Mature timber harvest'} ({detailModalReq.scheduleText})</span>
                </span>
              </div>
            </div>

            <div className="cd-assigned-prompt-box">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Trees size={16} className="text-emerald-400 shrink-0" />
                <span>
                  Complete standing tree inventory, DBH & height specs, cadastral survey, parcel specifications, and high-resolution site photos are available in the <strong>Assigned Jobs</strong> portal.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
              <button
                type="button"
                onClick={() => setDetailModalReq(null)}
                className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close Details
              </button>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalReq(null);
                    navigate('/contractor/assigned-jobs');
                  }}
                  className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/25 transition-all"
                >
                  <Trees size={14} /> Tree Inventory Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = detailModalReq.reqId;
                    setDetailModalReq(null);
                    navigate(`/contractor/assessment/${id}`);
                  }}
                  className="cd-btn-assessment py-2 px-4 text-xs font-bold cursor-pointer"
                >
                  <Calculator size={14} /> Assessment & Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;

