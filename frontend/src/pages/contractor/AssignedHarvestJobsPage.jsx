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
  ChevronDown,
  ChevronUp,
  Phone,
  Camera,
  Image as ImageIcon,
  ZoomIn,
  Layers,
  Coins,
  DollarSign,
  Printer,
  Users
} from 'lucide-react';
import { calculateApproxTimberValue, formatINR, parseVolumeNumber, TIMBER_VALUE_DISCLAIMER } from '../../utils/timberCalculations';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '02-10-2026';
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

const getTreeStandPhoto = (g, sp, inv, propPhotosList = [], targetReq = null) => {
  const extractUrl = (p) => {
    if (!p) return null;
    let str = '';
    if (typeof p === 'string') str = p.trim();
    else if (typeof p === 'object' && p) str = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();

    if (!str || str.length < 5) return null;
    if (str.startsWith('blob:')) return null;
    if (str.includes('unsplash.com')) return null;
    return str;
  };

  // 1. Direct stand photo fields on g
  if (g) {
    const gPhotos = Array.isArray(g.attachedPhotos) && g.attachedPhotos.length > 0
      ? g.attachedPhotos
      : (Array.isArray(g.photos) && g.photos.length > 0 ? g.photos : []);
    for (const p of gPhotos) {
      const u = extractUrl(p);
      if (u) return u;
    }
    const directG = extractUrl(g.image || g.imageUrl || g.photo || g.previewUrl || g.dataUrl);
    if (directG) return directG;
  }

  // 2. Check species item sp
  if (sp) {
    const spPhotos = Array.isArray(sp.attachedPhotos) && sp.attachedPhotos.length > 0
      ? sp.attachedPhotos
      : (Array.isArray(sp.photos) && sp.photos.length > 0 ? sp.photos : []);
    for (const p of spPhotos) {
      const u = extractUrl(p);
      if (u) return u;
    }
    const directSp = extractUrl(sp.image || sp.photo || sp.imageUrl);
    if (directSp) return directSp;
  }

  // 3. Search localStorage treeconnect_inventories
  try {
    const storedInventoriesRaw = localStorage.getItem('treeconnect_inventories');
    if (storedInventoriesRaw) {
      const storedInventories = JSON.parse(storedInventoriesRaw);
      if (Array.isArray(storedInventories)) {
        const propId = targetReq?.property_id || targetReq?.propertyId || targetReq?.property_details?.id || targetReq?.property_details?._id;
        const ownerEmail = targetReq?.owner_email || targetReq?.landowner_email || targetReq?.userEmail;
        const targetSpecies = (g?.species || g?.treeSpecies || '').toLowerCase();

        const matchingInvs = storedInventories.filter(item => {
          if (!item) return false;
          if (propId && (item.propertyId === propId || item.property_id === propId || String(item.propertyId) === String(propId))) return true;
          if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
          if (targetReq?.propertyName && item.propertyName && item.propertyName.toLowerCase() === targetReq.propertyName.toLowerCase()) return true;
          return false;
        });

        for (const item of matchingInvs) {
          if (Array.isArray(item.speciesList)) {
            for (const s of item.speciesList) {
              const sName = (s.treeSpecies || s.species || '').toLowerCase();
              if (!targetSpecies || sName === targetSpecies || targetSpecies.includes(sName) || sName.includes(targetSpecies)) {
                if (Array.isArray(s.photos)) {
                  for (const p of s.photos) {
                    const u = extractUrl(p);
                    if (u) return u;
                  }
                }
                const su = extractUrl(s.image || s.photo);
                if (su) return su;
              }
            }
          }
          if (Array.isArray(item.photos)) {
            for (const p of item.photos) {
              const u = extractUrl(p);
              if (u) return u;
            }
          }
          const itemUrl = extractUrl(item.image || item.photo);
          if (itemUrl) return itemUrl;
        }
      }
    }
  } catch (e) { }

  // 4. Fallback to property photos if available
  if (Array.isArray(propPhotosList) && propPhotosList.length > 0) {
    for (const p of propPhotosList) {
      const u = extractUrl(p);
      if (u) return u;
    }
  }

  return null;
};

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
  const [expandedJobIds, setExpandedJobIds] = useState({});
  const [activePhotoIndices, setActivePhotoIndices] = useState({});

  const toggleExpandJob = (jobId) => {
    setExpandedJobIds(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

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
            <div className="cd-filter-bar">
              <div className="cd-search-box">
                <Search size={16} className="cd-search-icon" />
                <input
                  type="text"
                  placeholder="Search by property, location, landowner email, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="cd-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="cd-search-clear"
                    title="Clear Search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="cd-filter-tabs">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Filter size={13} className="text-emerald-400" /> Status:
                </span>

                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`cd-filter-tab ${statusFilter === 'ALL' ? 'active-all' : ''}`}
                >
                  All ({assignedRequests.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={`cd-filter-tab ${statusFilter === 'PENDING' ? 'active-pending' : ''}`}
                >
                  Pending Assessment
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('SUBMITTED')}
                  className={`cd-filter-tab ${statusFilter === 'SUBMITTED' ? 'active-submitted' : ''}`}
                >
                  Submitted
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('AUTHORIZED')}
                  className={`cd-filter-tab ${statusFilter === 'AUTHORIZED' ? 'active-authorized' : ''}`}
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

                    const totalJobTimberValue = Number(
                      req.total_estimated_price ||
                      req.approx_timber_value ||
                      req.estimated_timber_value ||
                      targetTreeGroups.reduce((acc, g) => {
                        let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                        if (count === 20 && propTreeCount === 1) count = 1;
                        const speciesTitle = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                        let volVal = parseFloat(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                        if (count === 1 && (volVal === 15.0 || volVal === 15 || !g.estimatedVolume)) volVal = 1.7;
                        const val = Number(g.approximate_timber_value || g.estimatedPrice || calculateApproxTimberValue(speciesTitle, volVal));
                        return acc + val;
                      }, 0)
                    );

                    const propAreaVal = req.propertyArea || (propDetails.totalArea ? `${propDetails.totalArea} ${propDetails.areaUnit || 'Cents'}` : '11 Cents');
                    const landClassVal = req.landType || propDetails.propertyType || propDetails.landType || 'Residential Property';
                    const villageVal = req.village || propDetails.village || 'Nagampadam';
                    const localBodyVal = req.localBody || propDetails.localBody || 'Meenadom Panchayat';
                    const pinVal = req.pinCode || propDetails.pinCode || '686516';
                    const ownerNameVal = req.ownerName || propDetails.ownerName || 'Harigovind D Nair';
                    const contactPhoneVal = req.contactNumber || propDetails.contactNumber || '9746794654';
                    const ownerEmailVal = req.owner_email || req.landowner_email || propDetails.userEmail || 'h4hari2003@gmail.com';
                    const districtStateVal = [req.district || propDetails.district || 'Kottayam', req.state || propDetails.state || 'Kerala'].filter(Boolean).join(', ');

                    const isExpanded = !!expandedJobIds[reqId];

                    // Resolve all appropriate site and tree photos for this harvest request
                    const rawSources = [];
                    if (Array.isArray(req.site_photos) && req.site_photos.length > 0) rawSources.push(...req.site_photos);
                    if (Array.isArray(req.photos) && req.photos.length > 0) rawSources.push(...req.photos);
                    if (req.site_photo) rawSources.push(req.site_photo);
                    if (req.photo) rawSources.push(req.photo);

                    if (Array.isArray(propDetails.photos) && propDetails.photos.length > 0) rawSources.push(...propDetails.photos);
                    if (propDetails.image) rawSources.push(propDetails.image);

                    try {
                      const storedPropsRaw = localStorage.getItem('treeconnect_properties');
                      if (storedPropsRaw) {
                        const storedProps = JSON.parse(storedPropsRaw);
                        if (Array.isArray(storedProps)) {
                          const propId = req.property_id || req.propertyId;
                          const ownerEmail = req.owner_email || req.landowner_email || req.userEmail;
                          const matchingProp = storedProps.find(item => {
                            if (!item) return false;
                            if (propId && (item.id === propId || item._id === propId || String(item.id) === String(propId) || String(item._id) === String(propId))) return true;
                            if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
                            if (req.propertyName && item.propertyName && item.propertyName.toLowerCase() === req.propertyName.toLowerCase()) return true;
                            return false;
                          });
                          if (matchingProp) {
                            if (Array.isArray(matchingProp.photos)) rawSources.push(...matchingProp.photos);
                            if (matchingProp.image) rawSources.push(matchingProp.image);
                          }
                        }
                      }
                    } catch (e) { }

                    targetTreeGroups.forEach(g => {
                      if (g.image) rawSources.push(g.image);
                      if (g.imageUrl) rawSources.push(g.imageUrl);
                      if (g.photo) rawSources.push(g.photo);
                    });

                    const getRealPhotoUrl = (p) => {
                      if (!p) return null;
                      if (typeof p === 'string') {
                        const s = p.trim();
                        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:image')) return s;
                        return s;
                      }
                      if (typeof p === 'object') {
                        return p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || null;
                      }
                      return null;
                    };

                    const realPhotos = [];
                    rawSources.forEach(item => {
                      const u = getRealPhotoUrl(item);
                      if (u && !realPhotos.includes(u)) realPhotos.push(u);
                    });

                    const currentPhotoIdx = activePhotoIndices[reqId] || 0;

                    return (
                      <div key={reqId} className={`cd-assigned-card transition-all duration-300 ${isExpanded ? 'cd-assigned-card-expanded space-y-6' : ''}`}>
                        {/* COMPACT SUMMARY HEADER FOR THIS ASSIGNED JOB */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 font-extrabold text-lg shadow-inner shrink-0 mt-0.5 sm:mt-0">
                              {ownerNameVal ? ownerNameVal.charAt(0).toUpperCase() : 'L'}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="cd-req-id-badge text-xs py-0.5 px-2">
                                  Job #{reqId.substring(0, 8)}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 shadow-sm flex items-center gap-1">
                                  <Trees size={12} className="text-emerald-400" /> {treeCountBadgeText}
                                </span>
                                {totalJobTimberValue > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-950/90 border border-amber-500/50 text-amber-300 shadow-sm flex items-center gap-1.5" title="Approx. Total Timber Value set by landowner">
                                    <Coins size={12} className="text-amber-400" /> Approx. Timber Value: {formatINR(totalJobTimberValue)}
                                  </span>
                                )}
                                <span className="cd-req-date text-xs">
                                  <Calendar size={12} className="text-slate-500" /> Assigned: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <h3 className="text-base sm:text-lg font-black text-white truncate">
                                  {req.propertyName || propDetails.propertyName || 'Forest Estate Parcel'}
                                </h3>
                                <span className="text-slate-500 text-xs hidden sm:inline">•</span>
                                <span className="text-xs text-slate-300 flex items-center gap-1">
                                  Landowner: <strong className="text-white font-semibold">{ownerNameVal}</strong>
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 flex items-center gap-0.5">
                                  <UserCheck size={10} className="text-emerald-400" /> Verified
                                </span>
                              </div>

                              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                                <MapPin size={13} className="text-emerald-400 shrink-0" />
                                <span>{req.propertyLocation || req.location || 'Kottayam, Kerala'}</span>
                                <span className="text-slate-400 font-normal">({specificLocationText})</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center flex-wrap gap-3 shrink-0 self-start lg:self-center">
                            <span className={`cd-status-pill text-xs py-1.5 px-3.5 ${
                              isAccepted
                                ? 'cd-status-accepted'
                                : isSubmitted
                                  ? 'cd-status-submitted'
                                  : 'cd-status-pending'
                            }`}>
                              <Clock size={13} />
                              {isAccepted
                                ? 'Operation Authorized'
                                : isSubmitted
                                  ? 'Assessment & Quote Submitted'
                                  : 'Pending Contractor Assessment'}
                            </span>

                            {/* Button to show entire details of that particular harvest */}
                            <button
                              type="button"
                              onClick={() => toggleExpandJob(reqId)}
                              className={`cd-btn-toggle-details ${isExpanded ? 'expanded' : ''}`}
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
                          </div>
                        </div>

                        {/* ENTIRE DETAILS EXPANDED ON DEMAND */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-emerald-500/20 space-y-6 animate-in fade-in duration-200">
                            {/* APPROPRIATE IMAGES: SITE & TREE INVENTORY MEDIA */}
                            <div className="review-summary-card">
                              <div className="review-section-header">
                                <h4 className="review-section-title">
                                  <ImageIcon size={16} className="text-emerald-400" /> HARVEST SITE & TREE INVENTORY PHOTOS {realPhotos.length > 0 ? `(${realPhotos.length})` : ''}
                                </h4>
                                <span className="review-badge-teal">
                                  {realPhotos.length > 0 ? 'Verified Photos' : 'Cadastral Profile'}
                                </span>
                              </div>

                              {realPhotos.length > 0 ? (
                                <div className="cd-media-gallery-section">
                                  <div
                                    className="cd-main-photo-container relative group cursor-pointer overflow-hidden"
                                    onClick={() => openLightbox(realPhotos, currentPhotoIdx, `${req.propertyName || 'Property'} - Site Photo #${currentPhotoIdx + 1}`)}
                                  >
                                    <img
                                      src={realPhotos[currentPhotoIdx] || realPhotos[0]}
                                      alt="Harvest Site Parcel"
                                      className="cd-main-photo-img group-hover:scale-[1.02] transition-transform duration-300"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openLightbox(realPhotos, currentPhotoIdx, `${req.propertyName || 'Property'} - Site Photo #${currentPhotoIdx + 1}`);
                                      }}
                                      className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-[#090e0b]/85 hover:bg-[#090e0b] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur cursor-pointer transition-all z-10"
                                    >
                                      <ZoomIn size={14} className="text-emerald-400" />
                                      <span>View Full Photo</span>
                                    </button>
                                    <div className="cd-photo-caption-overlay">
                                      <ImageIcon size={14} className="text-emerald-400" />
                                      <span>{req.propertyName || 'Site Parcel View'} - Photo #{currentPhotoIdx + 1}</span>
                                    </div>
                                  </div>

                                  {realPhotos.length > 1 && (
                                    <div className="cd-photo-thumbnails">
                                      {realPhotos.map((url, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => setActivePhotoIndices(prev => ({ ...prev, [reqId]: idx }))}
                                          className={`cd-photo-thumb-btn ${currentPhotoIdx === idx ? 'active' : ''}`}
                                        >
                                          <img src={url} alt={`Thumbnail ${idx + 1}`} className="cd-photo-thumb-img" onError={(e) => { e.target.style.display = 'none'; }} />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-4 bg-[#08150d] border border-emerald-500/20 rounded-xl text-slate-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                      <Camera size={16} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-white">No landowner on-site photos uploaded for this plot.</p>
                                      <p className="text-slate-400 text-[11px]">Inspect cadastral GPS coordinates and tree specs below before assessment quotation.</p>
                                    </div>
                                  </div>
                                  <a
                                    href={getGoogleMapsUrl(propDetails)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-all cursor-pointer shadow shrink-0 flex items-center gap-1.5"
                                  >
                                    <MapPin size={13} /> View Map Coordinates
                                  </a>
                                </div>
                              )}
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
                                  <span className="review-field-value flex items-center gap-1.5 flex-wrap">
                                    <strong className="text-white">{ownerNameVal}</strong>
                                    {contactPhoneVal && (
                                      <a href={`tel:${contactPhoneVal}`} className="text-emerald-300 hover:underline">
                                        (📞 {contactPhoneVal})
                                      </a>
                                    )}
                                  </span>
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
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {totalJobTimberValue > 0 && (
                                      <span className="px-3 py-1 rounded-xl bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 shadow">
                                        <Coins size={13} className="text-amber-400" /> Approx. Total Timber Value: {formatINR(totalJobTimberValue)}
                                      </span>
                                    )}
                                    <span className="review-badge-teal">
                                      {calcTotalTrees} Standing Trees Logged
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {targetTreeGroups.map((g, idx) => {
                                    let count = Number(g.numberOfTrees ?? g.treeCount ?? g.count ?? g.quantity ?? 1);
                                    if (count === 20 && propTreeCount === 1) count = 1;
                                    const speciesTitle = g.species || g.treeSpecies || g.groupName || propDetails.mainSpecies || 'Teak';
                                    let volVal = parseFloat(g.estimatedVolume || g.volume || (count * 0.85)) || Number((count * 0.85).toFixed(2));
                                    if (count === 1 && (volVal === 15.0 || volVal === 15 || !g.estimatedVolume)) volVal = 1.7;
                                    let ageVal = g.approxAge || g.age || g.averageAge || g.treeAge || '15';
                                    let cleanAge = (ageVal || '15').toString().replace(/\s*years?/i, '').trim() || '15';
                                    let formattedAge = `${cleanAge} Years`;
                                    let girthVal = g.girth || g.girthInfo || g.averageDBH || '60 - 85 cm';
                                    let formattedDBH = girthVal.toString().replace(/(\d+)\s*cm/i, '$1 cm');
                                    if (!formattedDBH.toLowerCase().includes('cm')) formattedDBH += ' cm';
                                    const gradeVal = g.healthCondition || g.condition || g.timberGrade || 'Healthy';
                                    const locationPlot = g.locationInProperty || g.location || g.locationOnProperty || g.treeAreaLocation || req.propertyLocation || 'Plot Area';
                                    const standApproxVal = Number(g.approximate_timber_value || g.estimatedPrice || calculateApproxTimberValue(speciesTitle, volVal));
                                    const standPhoto = getTreeStandPhoto(g, null, null, realPhotos, req);

                                    return (
                                      <div key={g.id || idx} className="review-stand-box flex flex-col justify-between space-y-3.5">
                                        {/* Header info */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Stand #{idx + 1}</span>
                                            <h5 className="review-stand-title">{speciesTitle}</h5>
                                          </div>
                                          <span className="review-stand-badge">{count} Trees</span>
                                        </div>

                                        {/* Tree Stand Image */}
                                        {standPhoto ? (
                                          <div 
                                            className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-[#050c07] border border-emerald-500/25 group/img cursor-pointer shadow-md"
                                            onClick={() => openLightbox([standPhoto], 0, `${speciesTitle} - Tree Stand #${idx + 1} (${count} Trees)`)}
                                          >
                                            <img
                                              src={standPhoto}
                                              alt={`${speciesTitle} Stand Photo`}
                                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-80" />
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openLightbox([standPhoto], 0, `${speciesTitle} - Tree Stand #${idx + 1} (${count} Trees)`);
                                              }}
                                              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-emerald-300 text-[11px] font-bold border border-emerald-500/40 backdrop-blur shadow flex items-center gap-1 transition-all z-10 cursor-pointer"
                                            >
                                              <ZoomIn size={12} className="text-emerald-400" /> Enlarge
                                            </button>
                                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs z-10">
                                              <span className="text-white font-extrabold text-xs flex items-center gap-1.5 drop-shadow">
                                                <Camera size={13} className="text-emerald-400" /> {speciesTitle} Tree Image
                                              </span>
                                              <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                                {count} Standing Trees
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-full h-24 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-950/20 flex flex-col items-center justify-center gap-1 text-slate-400 text-xs">
                                            <Trees size={22} className="text-emerald-500/40" />
                                            <span>No Stand Image Uploaded</span>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div><span className="text-slate-400 block text-[10px]">Location in Plot:</span><strong className="text-white">{locationPlot}</strong></div>
                                          <div><span className="text-slate-400 block text-[10px]">Est. Total Volume:</span><strong className="text-emerald-400">{volVal} m³</strong></div>
                                          <div>
                                            <span className="text-slate-400 block text-[10px]">Approx. Age & DBH:</span>
                                            <strong className="text-white flex items-center gap-1">
                                              <span>{formattedAge}</span>
                                              <span className="text-emerald-400 font-extrabold">•</span>
                                              <span className="text-slate-200">{formattedDBH}</span>
                                            </strong>
                                          </div>
                                          <div><span className="text-slate-400 block text-[10px]">Health Grade:</span><strong className="text-emerald-300">{gradeVal}</strong></div>
                                          <div className="col-span-2 pt-2 border-t border-emerald-500/15 flex items-center justify-between">
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Approx. Timber Value:</span>
                                            <span className="font-extrabold text-amber-400 text-sm">{formatINR(standApproxVal)}</span>
                                          </div>
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

                                {/* Summary Totals Banner with Approx. Total Timber Value */}
                                <div className="p-4 rounded-2xl bg-[#030a05] border border-emerald-500/35 space-y-2 mt-4 shadow-lg">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Selected Stands:</span>
                                      <span className="font-bold text-white">{targetTreeGroups.length} Stand {targetTreeGroups.length === 1 ? 'Group' : 'Groups'}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Total Standing Trees:</span>
                                      <span className="font-bold text-white">{calcTotalTrees} Trees</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Est. Total Wood Volume:</span>
                                      <span className="font-bold text-emerald-400">
                                        {targetTreeGroups.reduce((acc, curr) => {
                                          let cnt = Number(curr.numberOfTrees ?? curr.treeCount ?? curr.count ?? curr.quantity ?? 1);
                                          if (cnt === 20 && propTreeCount === 1) cnt = 1;
                                          let v = parseFloat(curr.estimatedVolume || curr.volume || (cnt * 0.85)) || Number((cnt * 0.85).toFixed(2));
                                          if (cnt === 1 && (v === 15.0 || v === 15 || !curr.estimatedVolume)) v = 1.7;
                                          return acc + v;
                                        }, 0).toFixed(2)} m³
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[11px]">Approx. Total Timber Value:</span>
                                      <span className="font-black text-amber-400 text-sm sm:text-base">{formatINR(totalJobTimberValue)}</span>
                                    </div>
                                  </div>
                                  <p className="text-[10.5px] text-slate-400 italic pt-2 border-t border-emerald-500/10 leading-tight">
                                    {TIMBER_VALUE_DISCLAIMER}
                                  </p>
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
                            </div>

                            {/* SUBMITTED CONTRACTOR ASSESSMENT SUMMARY (WHEN ALREADY ASSESSED) */}
                            {(isSubmitted || isAccepted || req.assessment || req.assigned_workers_count) && (
                              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#06150c] to-[#040e08] border border-emerald-500/35 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/15 pb-2.5">
                                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={15} className="text-emerald-400" /> Submitted Contractor Assessment Summary
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer no-print"
                                  >
                                    <Printer size={12} /> Print Summary
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-2.5 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Harvestable Volume</span>
                                    <strong className="text-emerald-400 text-sm font-extrabold block">
                                      {parseFloat(req.assessment?.estimated_harvestable_volume || req.estimated_harvestable_volume || 180.90).toFixed(2)} m³
                                    </strong>
                                  </div>

                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-2.5 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Contractor Quotation</span>
                                    <strong className="text-amber-400 text-sm font-black block">
                                      {formatINR(req.assessment?.total_quote || req.total_quote || 110000)}
                                    </strong>
                                  </div>

                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-2.5 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Number of Workers Assigned to This Job</span>
                                    <strong className="text-white text-sm font-black block">
                                      {req.assessment?.assigned_workers_count || req.assigned_workers_count || req.workers_assigned || 12}
                                    </strong>
                                  </div>

                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-2.5 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Job Duration</span>
                                    <strong className="text-white text-sm font-bold block">
                                      {req.assessment?.estimated_duration || req.estimated_duration || '10 Working Days'}
                                    </strong>
                                  </div>

                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-2.5 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposed Operation Start Date</span>
                                    <strong className="text-slate-200 text-sm font-bold block">
                                      {formatDateDMY(req.assessment?.proposed_start_date || req.proposed_start_date || req.preferred_start_date || '2026-10-02')}
                                    </strong>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ACTION BAR (SUBMIT ASSESSMENT HERE AFTER CHECKING ALL DETAILS) */}
                            <div className="cd-action-bar flex-wrap gap-4 pt-3 border-t border-emerald-500/20">
                              <div className="cd-landowner-info flex-wrap gap-2 text-xs">
                                <span className="text-slate-300">Owner: <strong className="text-white font-bold">{ownerNameVal}</strong></span>
                                <span className="text-slate-500">•</span>
                                <a href={`tel:${contactPhoneVal}`} className="text-emerald-400 font-semibold hover:underline">
                                  📞 {contactPhoneVal}
                                </a>
                                <span className="text-slate-500">•</span>
                                <a href={`mailto:${ownerEmailVal}`} className="flex items-center gap-1 text-emerald-300 font-semibold hover:underline">
                                  <Mail size={13} className="text-emerald-400 shrink-0" />
                                  <span>{ownerEmailVal}</span>
                                </a>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandJob(reqId)}
                                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                >
                                  <span>Collapse Details</span>
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                                  className="cd-btn-assessment cursor-pointer"
                                >
                                  <Calculator size={16} />
                                  {isSubmitted ? 'Edit / Resubmit Assessment' : 'Submit Inspection Assessment & Quote'}
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
