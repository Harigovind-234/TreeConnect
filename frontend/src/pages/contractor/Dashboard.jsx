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
  ExternalLink
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
      const data = await harvestService.getHarvestRequests({ all_records: true });
      if (data && Array.isArray(data.harvest_requests)) {
        const cId = user?.id || user?._id;
        const cEmail = user?.email?.toLowerCase();
        const cName = (user?.fullName || user?.name || user?.companyName || '').toLowerCase();

        const assigned = data.harvest_requests.filter(r => {
          if (r.status === 'CANCELLED' || r.status === 'DELETED') return false;
          // Skip if request has a property_id but property_details is missing/empty (property was deleted)
          if (r.property_id && (!r.property_details || Object.keys(r.property_details).length === 0)) return false;

          const reqCId = r.assigned_contractor_id;
          const reqCEmail = (r.assigned_contractor_email || '').toLowerCase();
          const reqCName = (r.assigned_contractor_name || '').toLowerCase();

          const isDirectlyAssigned = (cId && reqCId === cId) ||
            (cEmail && (reqCEmail === cEmail || reqCName === cEmail)) ||
            (cName && reqCName === cName);

          const isAssignedStatus = r.status === 'CONTRACTOR_ASSIGNED' ||
            r.status === 'ASSESSMENT_SUBMITTED' ||
            r.status === 'OPERATION_READY';

          return isDirectlyAssigned || isAssignedStatus;
        });

        if (assigned.length > 0) {
          const enriched = assigned.map(req => ({
            ...req,
            propertyArea: req.propertyArea || (req.property_details?.totalArea ? `${req.property_details?.totalArea} ${req.property_details?.areaUnit || 'Acres'}` : '14.5 Acres'),
            surveyNumber: req.surveyNumber || req.property_details?.surveyNumber || 'Sy. #184/3B',
            landType: req.landType || req.property_details?.propertyType || 'Commercial Hardwood Plantation',
            propertyPhotos: (Array.isArray(req.propertyPhotos) && req.propertyPhotos.length > 0) ? req.propertyPhotos : [],
            tree_inventory: (Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
              ? req.tree_inventory
              : (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
                ? req.selected_tree_groups
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
  }, [user?.email]);

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

                    const landownerEmail = req.owner_email || req.landowner_email || propDetails.userEmail || 'landowner@treeconnect.in';

                    const isRealPhoto = (p) => {
                      if (!p) return false;
                      let url = '';
                      if (typeof p === 'string') url = p.trim();
                      else if (typeof p === 'object' && p) url = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
                      return url && typeof url === 'string' && url.length >= 5;
                    };

                    const getRealPhotoUrl = (p) => {
                      if (!p) return null;
                      if (typeof p === 'string') {
                        const s = p.trim();
                        if (s.length >= 5) return s;
                      } else if (typeof p === 'object' && p) {
                        const s = (p.previewUrl || p.dataUrl || p.fileUrl || p.url || p.src || '').trim();
                        if (s.length >= 5) return s;
                      }
                      return null;
                    };

                    // Gather real landowner site & property photos across all DB & local sources
                    const rawSitePhotoSources = [
                      ...(Array.isArray(req.photos) ? req.photos : (req.photos ? [req.photos] : [])),
                      ...(Array.isArray(req.propertyPhotos) ? req.propertyPhotos : (req.propertyPhotos ? [req.propertyPhotos] : [])),
                      ...(Array.isArray(propDetails.photos) ? propDetails.photos : (propDetails.photos ? [propDetails.photos] : [])),
                      propDetails.image
                    ];

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
                            if (Array.isArray(matchingProp.photos)) rawSitePhotoSources.push(...matchingProp.photos);
                            if (matchingProp.image) rawSitePhotoSources.push(matchingProp.image);
                          }
                        }
                      }
                    } catch (e) {}

                    const realSitePhotoUrls = [];
                    rawSitePhotoSources.forEach(item => {
                      const u = getRealPhotoUrl(item);
                      if (u && !realSitePhotoUrls.includes(u)) {
                        realSitePhotoUrls.push(u);
                      }
                    });

                    const photos = realSitePhotoUrls.map((url, idx) => ({
                      url,
                      caption: `${propName} Parcel Photo #${idx + 1}`
                    }));

                    // Tree Inventory (Live inventory breakdown from DB request/property if available)
                    let rawInventory = req.tree_inventory || req.selected_tree_groups || req.tree_inventories || propDetails.tree_inventory || propDetails.tree_inventories || [];
                    let treeInventory = [];

                    const getTreePhoto = (speciesName, sp, inv) => {
                      const directSources = [
                        ...(sp?.attachedPhotos || []),
                        ...(sp?.photos || []),
                        sp?.image, sp?.photo, sp?.previewUrl, sp?.dataUrl,
                        ...(inv?.attachedPhotos || []),
                        ...(inv?.photos || []),
                        inv?.image, inv?.photo, inv?.previewUrl, inv?.dataUrl
                      ];

                      for (const p of directSources) {
                        const u = getRealPhotoUrl(p);
                        if (u) return u;
                      }

                      try {
                        const storedInventoriesRaw = localStorage.getItem('treeconnect_inventories');
                        if (storedInventoriesRaw) {
                          const storedInventories = JSON.parse(storedInventoriesRaw);
                          if (Array.isArray(storedInventories)) {
                            const propId = req?.property_id || req?.propertyId || inv?.propertyId || inv?.property_id;
                            const ownerEmail = req?.owner_email || req?.landowner_email || req?.userEmail;

                            const matchingInvs = storedInventories.filter(item => {
                              if (!item) return false;
                              if (propId && (item.propertyId === propId || item.property_id === propId || String(item.propertyId) === String(propId))) return true;
                              if (ownerEmail && item.userEmail && item.userEmail.toLowerCase() === ownerEmail.toLowerCase()) return true;
                              if (req?.propertyName && item.propertyName && item.propertyName.toLowerCase() === req.propertyName.toLowerCase()) return true;
                              return false;
                            });

                            for (const item of matchingInvs) {
                              if (Array.isArray(item.photos)) {
                                for (const p of item.photos) {
                                  const u = getRealPhotoUrl(p);
                                  if (u) return u;
                                }
                              }
                              if (Array.isArray(item.speciesList)) {
                                for (const s of item.speciesList) {
                                  if (Array.isArray(s.photos)) {
                                    for (const p of s.photos) {
                                      const u = getRealPhotoUrl(p);
                                      if (u) return u;
                                    }
                                  }
                                  const su = getRealPhotoUrl(s.image || s.photo);
                                  if (su) return su;
                                }
                              }
                              const itemUrl = getRealPhotoUrl(item.image || item.photo);
                              if (itemUrl) return itemUrl;
                            }
                          }
                        }
                      } catch (e) {}

                      return null;
                    };

                    if (Array.isArray(rawInventory) && rawInventory.length > 0) {
                      rawInventory.forEach((inv, iIdx) => {
                        if (Array.isArray(inv.speciesList) && inv.speciesList.length > 0) {
                          inv.speciesList.forEach((sp, sIdx) => {
                            const count = Number(sp.numberOfTrees || sp.count || sp.treeCount || inv.numberOfTrees || inv.count || 1);
                            const speciesTitle = sp.species || sp.treeSpecies || sp.groupName || inv.species || 'Teak';
                            treeInventory.push({
                              id: sp.id || `${inv.id || iIdx}_sp_${sIdx}`,
                              species: speciesTitle,
                              treeCount: count,
                              estimatedVolume: Number(sp.estimatedVolume || sp.volume || inv.estimatedVolume || (count * 0.85).toFixed(2)),
                              averageAge: sp.approxAge || sp.age || sp.averageAge || inv.approxAge || inv.age || '15 Years',
                              averageDBH: sp.girth || sp.averageDBH || inv.girth || '45 - 65 cm Girth',
                              averageHeight: sp.averageHeight || sp.height || inv.averageHeight || '14 Meters',
                              timberGrade: sp.healthCondition || sp.condition || sp.timberGrade || inv.healthCondition || 'Healthy',
                              location: sp.locationInProperty || sp.location || inv.locationInProperty || inv.location || inv.treeAreaLocation || req.propertyLocation || 'Front yard / Boundary area',
                              notes: sp.notes || inv.notes || '',
                              image: getTreePhoto(speciesTitle, sp, inv)
                            });
                          });
                        } else {
                          const count = Number(inv.numberOfTrees || inv.count || inv.treeCount || 1);
                          const speciesTitle = inv.species || inv.treeSpecies || inv.groupName || 'Teak';
                          treeInventory.push({
                            id: inv.id || `inv_${iIdx}`,
                            species: speciesTitle,
                            treeCount: count,
                            estimatedVolume: Number(inv.estimatedVolume || inv.volume || (count * 0.85).toFixed(2)),
                            averageAge: inv.approxAge || inv.age || inv.averageAge || '15 Years',
                            averageDBH: inv.girth || inv.averageDBH || '45 - 65 cm Girth',
                            averageHeight: inv.averageHeight || inv.height || '14 Meters',
                            timberGrade: inv.healthCondition || inv.condition || inv.timberGrade || 'Healthy',
                            location: inv.locationInProperty || inv.location || inv.treeAreaLocation || req.propertyLocation || 'Front yard / Boundary area',
                            notes: inv.notes || '',
                            image: getTreePhoto(speciesTitle, null, inv)
                          });
                        }
                      });
                    }

                    if (treeInventory.length === 0) {
                      const speciesTitle = propDetails.mainSpecies ? `${propDetails.mainSpecies} Stand` : 'Teak Stand';
                      treeInventory = [
                        {
                          id: 'inv_live_1',
                          species: speciesTitle,
                          treeCount: Number(propDetails.approxTreesCount || 1),
                          estimatedVolume: 0.85,
                          averageAge: '15 Years',
                          averageDBH: '45 - 65 cm Girth',
                          averageHeight: '14 Meters',
                          timberGrade: 'Healthy',
                          location: req.propertyLocation || 'Front yard / Boundary area',
                          notes: '',
                          image: getTreePhoto(speciesTitle, null, null)
                        }
                      ];
                    }

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
                            <h3 className="cd-req-title">{propName}</h3>
                            <p className="cd-req-location">
                              <MapPin size={14} className="text-emerald-400 shrink-0" /> {propLocation}
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
                              <Clock size={13} />
                              {isAccepted ? 'Operation Authorized' : isSubmitted ? 'Assessment Submitted' : 'Pending Contractor Assessment'}
                            </span>
                          </div>
                        </div>

                        {/* LAND PARCEL & PROPERTY SPECIFICATIONS */}
                        <div className="cd-site-context-card">
                          <div className="cd-site-context-header">
                            <div className="flex items-center gap-2">
                              <Compass className="text-emerald-400" size={18} />
                              <h4 className="cd-site-context-title">Land Parcel & Property Specifications</h4>
                            </div>
                            <span className="text-xs font-bold text-slate-300 bg-emerald-950/80 border border-emerald-700/50 px-3 py-1 rounded-full">
                              Survey #{surveyNo}
                            </span>
                          </div>

                          {/* PARCEL METRICS GRID */}
                          <div className="cd-parcel-metrics-grid">
                            <div className="cd-metric-chip">
                              <span className="cd-metric-label">Land Parcel Area</span>
                              <span className="cd-metric-value">{landArea}</span>
                            </div>
                            <div className="cd-metric-chip">
                              <span className="cd-metric-label">Cadastral Survey #</span>
                              <span className="cd-metric-value">{surveyNo}</span>
                            </div>
                            <div className="cd-metric-chip">
                              <span className="cd-metric-label">Land Classification</span>
                              <span className="cd-metric-value">{landClassification}</span>
                            </div>
                          </div>

                          {/* SPECIFICATIONS GRID */}
                          <div className="cd-specs-grid">
                            <div className="cd-spec-item">
                              <span className="cd-spec-label">Reason</span>
                              <strong className="cd-spec-value">{req.reason || 'Mature timber harvest'}</strong>
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
                              <span className="cd-spec-label">Site Access & Road</span>
                              <strong className="cd-spec-value truncate">{req.site_conditions?.access_availability || 'Heavy vehicle access'} ({req.site_conditions?.road_condition || 'Paved panchayat road'})</strong>
                            </div>
                          </div>

                          {/* PROPERTY MEDIA PHOTOS */}
                          <div className="cd-media-gallery-section">
                            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-emerald-400 pt-2">
                              <span className="flex items-center gap-1.5"><ImageIcon size={15} /> Site Photos & Parcel Imagery</span>
                              <span className="text-[11px] text-slate-400 font-normal">{photos.length} Verified Photos</span>
                            </div>
                            {photos.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {photos.map((photo, pIdx) => (
                                  <div key={pIdx} className="relative rounded-xl overflow-hidden border border-emerald-500/25 h-36 group bg-slate-950">
                                    <img
                                      src={photo.url}
                                      alt={photo.caption || `Site Photo ${pIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-2.5">
                                      <span className="text-[11px] font-bold text-white leading-tight flex items-center gap-1">
                                        <ImageIcon size={11} className="text-emerald-400 shrink-0" />
                                        <span className="line-clamp-1">{photo.caption || `Photo #${pIdx + 1}`}</span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-[#08150d] border border-emerald-500/20 rounded-xl text-slate-400 text-xs flex items-center justify-center gap-2 mt-2">
                                <ImageIcon size={16} className="text-slate-500" />
                                <span>No site photos uploaded by landowner for this request</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* STANDING TREE INVENTORY & TIMBER BREAKDOWN */}
                        <div className="cd-inventory-section space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/15">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                                <Trees size={22} className="text-emerald-400" /> Logged Tree Inventory ({treeInventory.length} Groups)
                              </h3>
                              <p className="text-xs text-slate-400 mt-1">
                                Standing tree species specifications, quantities, location plots, and health conditions.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-sm flex items-center gap-1.5">
                                <Trees size={13} /> {treeInventory.reduce((sum, t) => sum + (t.treeCount || 0), 0)} Standing Trees
                              </span>
                              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/60 shadow-sm flex items-center gap-1.5">
                                <Layers size={13} /> {treeInventory.reduce((sum, t) => sum + (t.estimatedVolume || 0), 0).toFixed(1)} m³ Est. Vol.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {treeInventory.map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="bg-[#050e08] border border-emerald-500/20 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xl hover:border-emerald-500/40 transition-all duration-300"
                              >
                                <div className="space-y-4">
                                  {/* Tree Image / Placeholder Banner */}
                                  {item.image ? (
                                    <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-[#090e0b] border border-emerald-500/20 group/treeimg shadow-md">
                                      <img
                                        src={item.image}
                                        alt={item.species}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                        className="w-full h-full object-cover group-hover/treeimg:scale-105 transition-transform duration-500"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-[#090e0b] via-transparent to-transparent opacity-85" />

                                      <a
                                        href={item.image}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-[#090e0b]/80 hover:bg-[#090e0b] border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow flex items-center gap-1.5 backdrop-blur transition-all z-10"
                                      >
                                        <ZoomIn size={14} className="text-emerald-400" />
                                        <span>View Photo</span>
                                      </a>

                                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                                        <span className="px-3 py-1 rounded-xl bg-[#090e0b]/90 backdrop-blur border border-emerald-500/35 text-white text-xs font-extrabold flex items-center gap-1.5 shadow">
                                          <Trees size={14} className="text-emerald-400" /> {item.species} Stand
                                        </span>
                                        <span className="px-3 py-1 rounded-xl bg-emerald-900/90 backdrop-blur border border-emerald-500/35 text-emerald-300 text-xs font-bold shadow">
                                          {item.treeCount} Standing Trees
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1e12] to-[#040e08] border border-emerald-500/20 shadow-md flex items-center justify-center p-4">
                                      <div className="flex flex-col items-center gap-1.5 text-center">
                                        <Trees size={24} className="text-emerald-500/50" />
                                        <span className="text-xs font-semibold text-slate-400">No tree photo uploaded by landowner</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Group Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-emerald-500/15">
                                    <div>
                                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                        Tree Group #{idx + 1}
                                      </span>
                                      <h4 className="text-xl font-extrabold text-white mt-0.5">
                                        {item.species}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                                        {item.treeCount} Trees
                                      </span>
                                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                        (item.timberGrade || '').toLowerCase().includes('healthy') || (item.timberGrade || '').toLowerCase().includes('grade a')
                                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                      }`}>
                                        {item.timberGrade || 'Healthy'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Specifications Subcards Grid */}
                                  <div className="grid grid-cols-2 gap-3.5 text-xs">
                                    <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approximate Age</span>
                                      <span className="font-bold text-white text-sm block">{item.averageAge || '15 years'}</span>
                                    </div>
                                    <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl space-y-1">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logged Quantity</span>
                                      <span className="font-bold text-emerald-400 text-sm block">{item.treeCount} Standing Trees</span>
                                    </div>
                                  </div>

                                  {/* Plot Position */}
                                  <div className="bg-[#0b1b12] border border-emerald-500/15 p-3.5 rounded-xl text-xs space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Location / Plot Position within Estate</span>
                                    <span className="font-semibold text-slate-200 flex items-center gap-1.5 mt-0.5">
                                      📍 {item.location || req.propertyLocation || 'Front yard / Boundary area'}
                                    </span>
                                  </div>

                                  {/* Special Notes / Observations */}
                                  {item.notes && (
                                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                                        Special Notes / Observations
                                      </span>
                                      <p className="text-amber-200 leading-relaxed">{item.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ACTION BAR */}
                        <div className="cd-action-bar">
                          <span className="cd-landowner-info">
                            <Mail size={14} className="text-emerald-400 shrink-0" />
                            Landowner Email: <strong className="text-white font-semibold">{landownerEmail}</strong>
                          </span>

                          <button
                            onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                            className="cd-btn-assessment"
                          >
                            <Calculator size={15} />
                            {isSubmitted ? 'Edit / Resubmit Assessment' : 'Submit Inspection Assessment & Quote'}
                          </button>
                        </div>
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
    </div>
  );
};

export default ContractorDashboard;

