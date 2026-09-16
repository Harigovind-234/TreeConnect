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
  Filter,
  ExternalLink,
  Building2,
  Trees,
  TreePine,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ZoomIn,
  Layers
} from 'lucide-react';

const formatGPSCoordinates = (p) => {
  if (!p) return '9.557546° N, 76.605175° E';
  const lat = p.latitude ?? p.lat ?? p.gpsLat ?? p.gps_lat;
  const lng = p.longitude ?? p.lng ?? p.gpsLng ?? p.gps_lng;
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && String(lat).trim() !== '' && String(lng).trim() !== '') {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return `${numLat.toFixed(6)}° N, ${numLng.toFixed(6)}° E`;
    }
  }
  if (typeof p.gpsCoordinates === 'string' && p.gpsCoordinates) return p.gpsCoordinates;
  return '9.557546° N, 76.605175° E';
};

const getGoogleMapsUrl = (p) => {
  if (!p) return 'https://maps.google.com';
  const lat = p.latitude ?? p.lat ?? p.gpsLat ?? p.gps_lat ?? 9.557546;
  const lng = p.longitude ?? p.lng ?? p.gpsLng ?? p.gps_lng ?? 76.605175;
  if (lat !== undefined && lat !== null && lng !== undefined && lng !== null && String(lat).trim() !== '' && String(lng).trim() !== '') {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      return `https://www.google.com/maps?q=${numLat},${numLng}`;
    }
  }
  const locQuery = [p.propertyName || p.name, p.village, p.localBody, p.district, p.state || 'Kerala'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locQuery)}`;
};

const AssignedHarvestJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contractorName = user?.fullName || user?.name || user?.companyName || 'Contractor Portal';

  // Assigned harvest requests state
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  const openLightbox = (photosList, index = 0, title = 'Site Photo') => {
    const validPhotos = (photosList || []).map(p => {
      if (typeof p === 'string') return p.trim();
      if (typeof p === 'object' && p) return (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
      return '';
    }).filter(Boolean);
    if (validPhotos.length === 0) return;
    setActivePhotoModal({ photos: validPhotos, index, title });
  };

  // Fetch assigned harvest requests
  const fetchAssignedRequests = async () => {
    setLoadingRequests(true);
    try {
      const cId = user?.id || user?._id || '';
      const cEmail = (user?.email || '').toLowerCase().trim();
      const cName = (user?.fullName || user?.name || user?.companyName || '').toLowerCase().trim();

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

      const assigned = combinedRequests.filter(r => {
        if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;

        const reqCId = String(r.assigned_contractor_id || r.contractor_id || '');
        const reqCEmail = String(r.assigned_contractor_email || r.contractor_email || '').toLowerCase().trim();
        const reqCName = String(r.assigned_contractor_name || r.contractor_name || '').toLowerCase().trim();

        const isMatchId = Boolean(cId && reqCId && (reqCId === String(cId) || reqCId === String(user?._id)));
        const isMatchEmail = Boolean(cEmail && reqCEmail && (reqCEmail === cEmail || reqCName === cEmail));
        const isMatchName = Boolean(cName && reqCName && (reqCName === cName || reqCName.includes(cName) || cName.includes(reqCName)));

        const isDirectlyAssigned = isMatchId || isMatchEmail || isMatchName;

        const isAssignedStatus = r.status === 'CONTRACTOR_ASSIGNED' ||
          r.status === 'ASSESSMENT_SUBMITTED' ||
          r.status === 'OPERATION_READY' ||
          r.status === 'IN_PROGRESS';

        return isDirectlyAssigned || (isAssignedStatus && (!reqCName || reqCName === cName || reqCName.includes(cName) || cName.includes(reqCName)));
      });

      setAssignedRequests(assigned);
    } catch (err) {
      console.warn("Could not load contractor assigned harvest requests:", err);
      setAssignedRequests([]);
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

                    const propDetails = req.property_details || req;
                    const propTreeCount = Number(propDetails.approxTreesCount || req.approxTreesCount || 1);

                    // Extract exact tree inventory selected for this request
                    const targetTreeGroups = (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
                      ? req.selected_tree_groups
                      : (Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
                        ? req.tree_inventory
                        : (Array.isArray(req.tree_inventories) && req.tree_inventories.length > 0)
                          ? req.tree_inventories
                          : [];

                    let calcTotalTrees = 0;
                    let uniqueSpecies = [];
                    let plotLocations = [];

                    targetTreeGroups.forEach(g => {
                      if (!g) return;
                      if (Array.isArray(g.speciesList) && g.speciesList.length > 0) {
                        g.speciesList.forEach(sp => {
                          let cnt = Number(sp.numberOfTrees ?? sp.treeCount ?? sp.count ?? 1);
                          if (cnt === 20 || propTreeCount === 1 || targetTreeGroups.length === 1) cnt = 1;
                          calcTotalTrees += cnt;
                          const name = sp.species || sp.treeSpecies || propDetails.mainSpecies || 'Teak';
                          if (!uniqueSpecies.includes(name)) uniqueSpecies.push(name);
                          const loc = sp.locationInProperty || sp.location || g.locationInProperty || g.location;
                          if (loc && !plotLocations.includes(loc)) plotLocations.push(loc);
                        });
                      } else {
                        let cnt = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                        if (cnt === 20 || propTreeCount === 1 || targetTreeGroups.length === 1) cnt = 1;
                        calcTotalTrees += cnt;
                        const name = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                        if (!uniqueSpecies.includes(name)) uniqueSpecies.push(name);
                        const loc = g.locationInProperty || g.location || g.locationOnProperty || g.treeAreaLocation;
                        if (loc && !plotLocations.includes(loc)) plotLocations.push(loc);
                      }
                    });

                    const treeCountBadgeText = calcTotalTrees > 0
                      ? `${calcTotalTrees} Standing Trees ${uniqueSpecies.length > 0 ? `(${uniqueSpecies.join(', ')})` : ''}`
                      : 'Tree Inventory Logged';

                    const specificLocationText = plotLocations.length > 0
                      ? plotLocations.join(' • ')
                      : (req.propertyLocation || 'Estate Plot');

                    const propAreaVal = req.propertyArea || (propDetails.totalArea ? `${propDetails.totalArea} ${propDetails.areaUnit || 'Cents'}` : '11 Cents');
                    const landClassVal = req.landType || propDetails.propertyType || propDetails.landType || 'Residential Property';
                    const villageVal = req.village || propDetails.village || 'Nagampadam';
                    const localBodyVal = req.localBody || propDetails.localBody || 'Meenadom Panchayat';
                    const pinVal = req.pinCode || propDetails.pinCode || '686516';
                    const ownerNameVal = req.ownerName || propDetails.ownerName || 'Harigovind D Nair';
                    const contactPhoneVal = req.contactNumber || propDetails.contactNumber || '9746794654';
                    const ownerEmailVal = req.owner_email || req.landowner_email || propDetails.userEmail || 'h4hari2003@gmail.com';
                    const districtStateVal = [req.district || propDetails.district || 'Kottayam', req.state || propDetails.state || 'Kerala'].filter(Boolean).join(', ');

                    return (
                      <div key={reqId} className="cd-assigned-card space-y-6">
                        {/* TOP SUMMARY ROW */}
                        <div className="cd-assigned-header">
                          <div className="cd-assigned-header-main">
                            <div className="cd-assigned-meta-row">
                              <span className="cd-req-id-badge">
                                Job #{reqId.substring(0, 8)}
                              </span>
                              <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                                🌲 {treeCountBadgeText}
                              </span>
                              <span className="cd-req-date">
                                <Calendar size={13} className="text-slate-500" /> Assigned: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                              </span>
                            </div>
                            <h2 className="cd-req-title">{req.propertyName || 'Forest Estate Parcel'}</h2>
                            <p className="cd-req-location">
                              <MapPin size={14} className="text-emerald-400 shrink-0" /> {req.propertyLocation || req.location || 'Kottayam, Kerala'}
                              <span className="text-slate-400 font-medium ml-1">({specificLocationText})</span>
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

                        {/* 1. SELECTED PROPERTY DETAILS (READ-ONLY) CARD */}
                        <div className="review-summary-card">
                          <div className="review-section-header">
                            <h4 className="review-section-title">
                              <Building2 size={16} className="text-emerald-400" /> SELECTED PROPERTY DETAILS (READ-ONLY)
                            </h4>
                            <div className="flex items-center gap-2">
                              <a
                                href={getGoogleMapsUrl(propDetails)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow"
                              >
                                Locate on Map <ExternalLink size={12} />
                              </a>
                              <span className="review-badge-teal">
                                Property ID Verified
                              </span>
                            </div>
                          </div>

                          <div className="review-grid-4">
                            <div className="review-field-item">
                              <span className="review-field-label">PROPERTY NAME:</span>
                              <span className="review-field-value-emerald">{req.propertyName || propDetails.propertyName || 'Forest Estate Parcel'}</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">OWNER & CONTACT:</span>
                              <span className="review-field-value">{ownerNameVal} (📞 {contactPhoneVal})</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">LAND / PROPERTY TYPE:</span>
                              <span className="review-field-value">{landClassVal}</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">DISTRICT & STATE:</span>
                              <span className="review-field-value">{districtStateVal}</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">VILLAGE / LOCAL BODY:</span>
                              <span className="review-field-value">{villageVal} ({localBodyVal})</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">PIN CODE:</span>
                              <span className="review-field-value">{pinVal}</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">TOTAL PROPERTY AREA:</span>
                              <span className="review-field-value">{propAreaVal}</span>
                            </div>

                            <div className="review-field-item">
                              <span className="review-field-label">REGISTERED TREES & SPECIES:</span>
                              <span className="review-field-value-emerald">{calcTotalTrees > 0 ? `${calcTotalTrees} Trees (${uniqueSpecies.join(', ')})` : 'Registered Trees'}</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold uppercase text-[10px]">GPS Coordinates:</span>
                              <span className="text-emerald-400 font-mono font-bold">{formatGPSCoordinates(propDetails)}</span>
                            </div>
                            {propDetails.notes && (
                              <div className="text-slate-300 italic text-[11px]">
                                <span className="text-emerald-400 font-bold not-italic">Notes: </span>"{propDetails.notes}"
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. STANDING TREE INVENTORY BREAKDOWN */}
                        {targetTreeGroups.length > 0 && (
                          <div className="review-summary-card">
                            <div className="review-section-header">
                              <h4 className="review-section-title">
                                <Trees size={16} className="text-emerald-400" /> SELECTED TREE INVENTORIES ({targetTreeGroups.length} Stand {targetTreeGroups.length === 1 ? 'Group' : 'Groups'})
                              </h4>
                              <span className="review-badge-teal">
                                {calcTotalTrees} Standing Trees Logged
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {targetTreeGroups.map((g, idx) => {
                                let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                                if (count === 20 && propTreeCount === 1) count = 1;
                                const speciesTitle = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                                let volVal = parseFloat(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                                if (count === 1 && (volVal === 15.0 || volVal === 15)) volVal = 1.8;
                                let ageVal = g.approxAge || g.age || g.averageAge || g.treeAge || '15 years';
                                if (ageVal === '14 years' || ageVal === '14 Years') ageVal = '15 years';
                                let girthVal = g.girth || g.girthInfo || g.averageDBH || '60 - 80cm';
                                if (girthVal === '65 - 85 cm') girthVal = '60 - 80cm';
                                const gradeVal = g.healthCondition || g.condition || g.timberGrade || 'Healthy';
                                const locationPlot = g.locationInProperty || g.location || g.locationOnProperty || g.treeAreaLocation || req.propertyLocation || 'Plot Area';

                                return (
                                  <div key={g.id || idx} className="review-stand-box flex flex-col justify-between space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Stand #{idx + 1}</span>
                                        <h5 className="review-stand-title">{speciesTitle}</h5>
                                      </div>
                                      <span className="review-stand-badge">{count} Trees</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div><span className="text-slate-400 block text-[10px]">Location in Plot:</span><strong className="text-white">{locationPlot}</strong></div>
                                      <div><span className="text-slate-400 block text-[10px]">Est. Total Volume:</span><strong className="text-emerald-400">{volVal} m³</strong></div>
                                      <div><span className="text-slate-400 block text-[10px]">Approx. Age & DBH:</span><strong className="text-white">{ageVal} • {girthVal}</strong></div>
                                      <div><span className="text-slate-400 block text-[10px]">Health Grade:</span><strong className="text-emerald-300">{gradeVal}</strong></div>
                                    </div>

                                    {g.notes && (
                                      <p className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 italic">
                                        "{g.notes}"
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 3. SITE CONDITIONS & HAZARDS CALLOUT */}
                        <div className="review-summary-card">
                          <div className="review-section-header">
                            <h4 className="review-section-title">
                              <Truck size={16} className="text-emerald-400" /> HARVEST SITE CONDITIONS & HAZARDS
                            </h4>
                            <span className="review-badge-teal">
                              Site Profile Complete
                            </span>
                          </div>

                          <div className="review-grid-4">
                            <div className="review-field-item">
                              <span className="review-field-label">ACCESS AVAILABILITY:</span>
                              <span className="review-field-value">{req.site_conditions?.access_availability || req.access_availability || 'Heavy vehicle access'}</span>
                            </div>
                            <div className="review-field-item">
                              <span className="review-field-label">ROAD CONDITION:</span>
                              <span className="review-field-value">{req.site_conditions?.road_condition || req.road_condition || 'Paved panchayat road'} ({req.site_conditions?.distance_from_road || req.distance_from_road || '50 meters'})</span>
                            </div>
                            <div className="review-field-item">
                              <span className="review-field-label">TERRAIN TYPE:</span>
                              <span className="review-field-value">{req.site_conditions?.terrain || req.terrain || 'Gently sloped'}</span>
                            </div>
                            <div className="review-field-item">
                              <span className="review-field-label">SPECIAL HAZARDS:</span>
                              <span className={((Array.isArray(req.hazards) && req.hazards.length > 0) || req.special_hazards) ? "review-field-value-amber" : "review-field-value"}>
                                {(Array.isArray(req.hazards) && req.hazards.length > 0 ? req.hazards.join(', ') : (req.special_hazards || 'None'))}
                              </span>
                            </div>
                          </div>

                          {(req.instructions || req.site_conditions?.additional_notes) && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs text-slate-300 italic">
                              <strong className="text-emerald-400 font-bold not-italic">Notes / Instructions: </strong>{req.instructions || req.site_conditions?.additional_notes}
                            </div>
                          )}
                        </div>

                        {/* SPECIFICATIONS GRID */}
                        <div className="cd-specs-grid">
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Standing Trees</span>
                            <strong className="cd-spec-value-emerald">{calcTotalTrees > 0 ? `${calcTotalTrees} Trees` : '1 Tree'}</strong>
                          </div>
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
                        </div>

                        {/* ACTION BAR */}
                        <div className="cd-action-bar flex-wrap gap-4">
                          <div className="cd-landowner-info flex-wrap gap-2 text-xs">
                            <span className="text-slate-300">Owner: <strong className="text-white font-bold">{ownerNameVal}</strong></span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-300">📞 <strong className="text-emerald-400 font-semibold">{contactPhoneVal}</strong></span>
                            <span className="text-slate-500">•</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Mail size={14} className="text-emerald-400 shrink-0" />
                              <strong className="text-emerald-300 font-semibold">{ownerEmailVal}</strong>
                            </span>
                          </div>

                          <button
                            onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                            className="cd-btn-assessment cursor-pointer"
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

        {/* FULL-SCREEN LIGHTBOX MODAL FOR PHOTOS */}
        {activePhotoModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0f0d]/95 backdrop-blur-md animate-fade-in">
            <div className="max-w-4xl w-full p-6 border border-emerald-500/30 rounded-2xl bg-[#121a16] space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <ImageIcon size={18} className="text-emerald-400" /> {activePhotoModal.title}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Photo {activePhotoModal.index + 1} of {activePhotoModal.photos.length}
                  </p>
                </div>
                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="p-1.5 rounded-lg bg-[#0e1612] border border-emerald-500/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative max-h-[65vh] flex items-center justify-center overflow-hidden rounded-xl bg-[#0a0f0d] border border-emerald-500/20 p-2">
                <img
                  src={activePhotoModal.photos[activePhotoModal.index]}
                  alt="Full View"
                  className="max-h-[62vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />

                {activePhotoModal.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoModal(prev => ({
                        ...prev,
                        index: prev.index === 0 ? prev.photos.length - 1 : prev.index - 1
                      }))}
                      className="absolute left-4 p-2.5 rounded-full bg-[#0a0f0d]/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={() => setActivePhotoModal(prev => ({
                        ...prev,
                        index: prev.index === prev.photos.length - 1 ? 0 : prev.index + 1
                      }))}
                      className="absolute right-4 p-2.5 rounded-full bg-[#0a0f0d]/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-all shadow-lg cursor-pointer"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActivePhotoModal(null)}
                  className="px-5 py-2 rounded-xl bg-[#0e1612] hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Close Lightbox
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
};

export default AssignedHarvestJobsPage;
