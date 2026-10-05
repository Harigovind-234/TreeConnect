import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import ApprovedContractorSelector from '../../components/workflow/ApprovedContractorSelector';
import RevisionRequestModal from '../../components/workflow/RevisionRequestModal';
import harvestService from '../../services/harvestService';
import './LandownerDashboard.css';
import {
  Axe,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FileText,
  DollarSign,
  Truck,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Mail,
  Trash2,
  Building2,
  Trees,
  TreePine,
  AlertTriangle,
  ExternalLink,
  Printer,
  Users,
  ZoomIn,
  Camera,
  ChevronLeft,
  X,
  Coins,
  Handshake,
  Briefcase
} from 'lucide-react';

import {
  getTimberReferenceRate,
  parseVolumeNumber,
  formatVolume,
  calculateApproxTimberValue,
  formatINR,
  TIMBER_VALUE_DISCLAIMER
} from '../../utils/timberCalculations';

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

const HarvestRequestsPage = () => {
  const navigate = useNavigate();
  const landownerCtx = useLandowner() || {};
  const harvestRequests = landownerCtx.harvestRequests || [];
  const refreshHarvestRequests = landownerCtx.refreshHarvestRequests || (() => { });
  const assignContractorToRequest = landownerCtx.assignContractorToRequest || (() => { });
  const deleteHarvestRequest = landownerCtx.deleteHarvestRequest || (() => { });

  const [selectedRequestForContractor, setSelectedRequestForContractor] = useState(null);
  const [revisionModalReq, setRevisionModalReq] = useState(null);
  const [activeAssessmentMap, setActiveAssessmentMap] = useState({});
  const [loadingAssessments, setLoadingAssessments] = useState({});
  const [actionMessage, setActionMessage] = useState('');
  const [activePhotoModal, setActivePhotoModal] = useState(null); // { photos: [], index: 0, title: '' }

  const openPhotoLightbox = (photos, index = 0, title = 'Harvest Site Photo') => {
    const rawList = Array.isArray(photos) ? photos : [photos];
    const validPhotos = rawList
      .map(p => (typeof p === 'string' ? p : (p?.previewUrl || p?.dataUrl || p?.url || '')))
      .filter(p => typeof p === 'string' && p.length > 5);
    if (validPhotos.length === 0) return;
    setActivePhotoModal({ photos: validPhotos, index, title });
  };

  const handleDeleteHarvestRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to cancel and delete this harvest request? This action cannot be undone.")) {
      try {
        await deleteHarvestRequest(requestId);
        setActionMessage("Harvest request deleted successfully.");
        setTimeout(() => setActionMessage(''), 3000);
        refreshHarvestRequests();
      } catch (err) {
        console.error("Error deleting harvest request:", err);
        setActionMessage("Failed to delete harvest request.");
      }
    }
  };

  // Fetch assessments for requests that are ASSESSMENT_SUBMITTED or ACCEPTED/OPERATION_READY
  useEffect(() => {
    const fetchAssessments = async () => {
      for (const req of harvestRequests) {
        const reqId = req.id || req._id;
        if (reqId && (req.status === 'ASSESSMENT_SUBMITTED' || req.status === 'OPERATION_READY' || req.status === 'ACCEPTED' || req.status === 'REVISION_REQUESTED')) {
          setLoadingAssessments(prev => ({ ...prev, [reqId]: true }));
          try {
            const data = await harvestService.getAssessment(reqId);
            if (data && data.assessment) {
              setActiveAssessmentMap(prev => ({ ...prev, [reqId]: data.assessment }));
            }
          } catch (e) {
            console.warn(`No backend assessment found for request ${reqId}`, e);
          } finally {
            setLoadingAssessments(prev => ({ ...prev, [reqId]: false }));
          }
        }
      }
    };

    if (harvestRequests.length > 0) {
      fetchAssessments();
    }
  }, [harvestRequests]);

  // Handle Landowner Action on Assessment (Accept, Reject, Request Revision)
  const handleAssessmentAction = async (requestId, action, feedbackStr = '', revisionReasons = []) => {
    try {
      await harvestService.actionAssessment(requestId, {
        status: action,
        feedback: feedbackStr,
        revision_reasons: revisionReasons
      });

      // Instantly update activeAssessmentMap in local state
      setActiveAssessmentMap(prev => ({
        ...prev,
        [requestId]: {
          ...(prev[requestId] || {}),
          status: action,
          landowner_feedback: feedbackStr,
          revision_reasons: revisionReasons
        }
      }));

      setActionMessage(
        action === 'REVISION_REQUESTED'
          ? "Revision request with your specifications sent to contractor successfully."
          : `Assessment action '${action}' recorded successfully.`
      );
      setTimeout(() => setActionMessage(''), 4000);

      // Refresh requests list
      refreshHarvestRequests();
    } catch (err) {
      console.error("Error updating assessment status:", err);
      setActionMessage("Failed to update assessment status.");
    }
  };

  // Handle Contractor Selection
  const handleAssignContractor = async (contractor) => {
    if (!selectedRequestForContractor) return;
    const reqId = selectedRequestForContractor.id || selectedRequestForContractor._id;

    try {
      await assignContractorToRequest(reqId, {
        contractor_id: contractor.id || contractor._id,
        contractor_name: contractor.companyName || contractor.name,
        contractor_email: contractor.email
      });

      setSelectedRequestForContractor(null);
      setActionMessage(`Assigned contractor ${contractor.companyName || contractor.name} successfully!`);
      setTimeout(() => setActionMessage(''), 3000);
      refreshHarvestRequests();
    } catch (err) {
      console.error("Error assigning contractor:", err);
    }
  };

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full max-w-6xl mx-auto py-6 flex flex-col gap-8">

            {/* HEADER */}
            <div className="harvest-requests-header-card">
              <div>
                <div className="harvest-tag-pill mb-3">
                  <Axe size={14} /> Registered Estate Harvesting Requests
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  Harvest Requests & Contractor Assessments
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  Track submitted harvest requests, assign platform-verified contractors, and review contractor assessments & quotations.
                </p>
              </div>

              <button
                onClick={() => navigate('/landowner/request-harvest')}
                className="ld-btn-action"
              >
                <Plus size={18} /> Submit New Harvest Request
              </button>
            </div>

            {/* ACTION ALERT MESSAGE */}
            {actionMessage && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 font-bold shadow-lg">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* REQUEST LIST */}
            {harvestRequests.length === 0 ? (
              <div className="ld-card text-center py-16 flex flex-col items-center justify-center gap-4">
                <Axe size={48} className="text-emerald-500/30 mx-auto" />
                <h3 className="font-bold text-white text-lg">No Active Harvest Requests Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You haven't submitted any harvesting requests for your registered properties yet.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/landowner/request-harvest')}
                    className="ld-btn-action"
                  >
                    <Plus size={16} /> Submit Harvest Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {harvestRequests.map((req) => {
                  const reqId = req.id || req._id || 'unknown';
                  const assessment = activeAssessmentMap[reqId];
                  const isLoadingAssessment = loadingAssessments[reqId];

                  const isPendingContractor = !req.assigned_contractor_id && !req.assigned_contractor_email;
                  const isAssigned = Boolean(req.assigned_contractor_id || req.assigned_contractor_email);
                  const isAssessmentSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                  const isOperationReady = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';
                  const isRevisionRequested = req.status === 'REVISION_REQUESTED' || assessment?.status === 'REVISION_REQUESTED';
                  const isAccepted = isOperationReady;

                  // Format schedule dates cleanly
                  const startDate = req.preferred_start_date || req.preferredStartDate;
                  const endDate = req.preferred_end_date || req.preferredCompletionDate;
                  const customSchedule = req.preferred_schedule || req.schedule;

                  let scheduleText = 'Flexible Schedule';
                  if (customSchedule) {
                    scheduleText = customSchedule;
                  } else if (startDate && endDate) {
                    scheduleText = `${startDate} to ${endDate}`;
                  } else if (startDate) {
                    const createdDateStr = req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : '';
                    if (startDate === createdDateStr) {
                      scheduleText = `Immediate (From ${startDate})`;
                    } else {
                      scheduleText = `From ${startDate}`;
                    }
                  } else if (endDate) {
                    scheduleText = `By ${endDate}`;
                  }

                  // Format services needed cleanly
                  const servicesNeededText = Array.isArray(req.required_services) && req.required_services.length > 0
                    ? req.required_services.join(', ')
                    : (req.servicesNeeded || 'Felling & Extraction');

                  const statusClass = isOperationReady
                    ? 'harvest-status-ready'
                    : isRevisionRequested
                      ? 'harvest-status-revision'
                      : isAssessmentSubmitted
                        ? 'harvest-status-submitted'
                        : isAssigned
                          ? 'harvest-status-assigned'
                          : 'harvest-status-pending';

                  const statusLabel = isOperationReady
                    ? 'Harvest Operation Ready'
                    : isRevisionRequested
                      ? 'Quotation Revision Requested'
                      : isAssessmentSubmitted
                        ? 'Contractor Assessment Submitted'
                        : isAssigned
                          ? 'Contractor Assigned'
                          : 'Pending Contractor Assignment';

                  const stands = (Array.isArray(req.selected_tree_groups) && req.selected_tree_groups.length > 0)
                    ? req.selected_tree_groups
                    : ((Array.isArray(req.selected_tree_inventories) && req.selected_tree_inventories.length > 0)
                      ? req.selected_tree_inventories
                      : ((Array.isArray(req.tree_inventory) && req.tree_inventory.length > 0)
                        ? req.tree_inventory
                        : [{ groupName: 'Teak Stand #1', numberOfTrees: 1, species: 'Teak', approxAge: '15', girth: '60 - 85cm', estimatedVolume: '1.7 m³' }]));

                  return (
                    <div key={reqId} className="harvest-request-card">

                      {/* TOP SUMMARY ROW */}
                      <div className="harvest-card-top">
                        <div>
                          <div className="harvest-pills-row">
                            <span className="harvest-tag-pill">
                              Request #{String(reqId).substring(0, 8)}
                            </span>
                            <span className="harvest-date-pill">
                              <Calendar size={13} className="text-slate-500" /> Created: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                            </span>
                            <span className="harvest-date-pill bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1">
                              <Building2 size={13} className="text-emerald-400" /> Area: {req.propertyArea || req.property_area || '11 Cents'}
                            </span>
                            <span className="harvest-date-pill bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 font-mono">
                              <MapPin size={13} className="text-emerald-400" /> GPS: {formatGPSCoordinates(req)}
                            </span>
                            <span className="harvest-tag-pill font-mono text-[11px]">
                              Record ID: {String(req.property_id || req.propertyId || req.id || '6aaacc50a6348ba1e2582fe3').substring(0, 10)}
                            </span>
                          </div>
                          <h2 className="harvest-card-title">{req.propertyName || 'Registered Property'}</h2>
                          <p className="harvest-card-location">
                            <MapPin size={14} className="text-emerald-400 shrink-0" /> {req.propertyLocation || req.location || 'Kottayam, Kerala'}
                          </p>
                        </div>

                        {/* STATUS PILL & DELETE BUTTON */}
                        <div className="shrink-0 self-start sm:self-center flex items-center gap-3">
                          <span className={`harvest-status-pill ${statusClass}`}>
                            <Clock size={14} />
                            {statusLabel}
                          </span>
                          <button
                            onClick={() => handleDeleteHarvestRequest(reqId)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                            title="Cancel & Delete Harvest Request"
                          >
                            <Trash2 size={15} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* SELECTED PROPERTY DETAILS (READ-ONLY) CARD */}
                      <div className="review-summary-card">
                        <div className="review-section-header">
                          <h4 className="review-section-title">
                            <CheckCircle2 size={16} className="text-emerald-400" /> SELECTED PROPERTY DETAILS (READ-ONLY)
                          </h4>
                          <span className="review-badge-green">
                            Active Estate
                          </span>
                        </div>

                        <div className="review-grid-4">
                          <div className="review-field-item">
                            <span className="review-field-label">Property Name:</span>
                            <span className="review-field-value">{req.propertyName || 'TreeConnect Property'}</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">Property Owner:</span>
                            <span className="review-field-value">{req.ownerName || req.landowner_name || 'Harigovind D Nair'}</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">Contact Number:</span>
                            <span className="review-field-value">{req.contactNumber || '9746794654'}</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">Property Type:</span>
                            <span className="review-field-value-emerald">{req.landType || req.propertyType || 'Residential Property'}</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">District & State:</span>
                            <span className="review-field-value">{req.propertyLocation || 'Kottayam, Kerala'}</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">Village / Location:</span>
                            <span className="review-field-value">{req.village || 'Nagampadam'} ({req.localBody || 'Meenadom Panchayat'})</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">PIN Code:</span>
                            <span className="review-field-value">{req.pinCode || '686516'}</span>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">Total Registered Area:</span>
                            <span className="review-field-value-emerald">{req.propertyArea || '11 Cents'}</span>
                          </div>
                          <div className="review-field-item sm:col-span-2">
                            <span className="review-field-label">GPS Coordinates & Location:</span>
                            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                              <span className="review-id-code font-mono text-emerald-300">
                                {formatGPSCoordinates(req)}
                              </span>
                              <a
                                href={getGoogleMapsUrl(req)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow hover:text-emerald-200"
                                title="Open property location on Google Maps"
                              >
                                <ExternalLink size={13} className="text-emerald-400" />
                                <span>Locate on Map</span>
                              </a>
                            </div>
                          </div>
                          <div className="review-field-item">
                            <span className="review-field-label">Registered Trees & Species:</span>
                            <span className="review-field-value">
                              {stands.reduce((sum, s) => sum + Number(s.numberOfTrees ?? s.treeCount ?? s.count ?? s.quantity ?? 1), 0)} Trees ({[...new Set(stands.map(s => s.species || s.treeSpecies).filter(Boolean))].join(', ') || 'Teak'})
                            </span>
                          </div>
                          <div className="review-field-item sm:col-span-2">
                            <span className="review-field-label">Estate Description / Notes:</span>
                            <span className="text-slate-300 italic text-xs">{req.instructions || req.description || 'Registered forestry estate plot in Kottayam district.'}</span>
                          </div>
                        </div>
                      </div>

                      {/* SELECTED TREE INVENTORIES STAND BREAKDOWN */}
                      <div className="review-summary-card">
                        <div className="review-section-header">
                          <h4 className="review-section-title">
                            <Trees size={16} className="text-emerald-400" /> SELECTED TREE INVENTORIES ({stands.length} STANDS)
                          </h4>
                          <span className="review-badge-green">
                            {stands.reduce((sum, s) => sum + Number(s.numberOfTrees ?? s.treeCount ?? s.count ?? s.quantity ?? 1), 0)} Stand(s) Selected
                          </span>
                        </div>

                        <div className={`grid grid-cols-1 ${stands.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
                          {stands.map((s, idx) => {
                            const count = s.numberOfTrees ?? s.treeCount ?? s.count ?? s.quantity ?? 1;
                            const standName = s.groupName || s.standName || s.name || `${s.species || 'Teak'} Stand #${idx + 1}`;
                            const species = s.species || s.treeSpecies || 'Teak';
                            const age = (s.approxAge || s.standAge || s.age || '15').toString().replace(/\s*years?/i, '').trim() || '15';
                            const girth = s.girth || s.trunkGirth || s.averageDbh || '60 - 85cm';
                            const volume = s.estimatedVolume || s.volume || '1.7 m³';
                            const approxValue = calculateApproxTimberValue(species, volume);

                            return (
                              <div key={s.id || idx} className="review-stand-box">
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/15">
                                  <span className="font-extrabold text-white text-base flex items-center gap-2">
                                    <TreePine size={16} className="text-emerald-400" /> {standName}
                                  </span>
                                  <span className="review-badge-green">
                                    {count} Trees
                                  </span>
                                </div>
                                <div className="review-grid-4 gap-y-3 pt-1">
                                  <div className="review-field-item">
                                    <span className="review-field-label">SPECIES:</span>
                                    <span className="review-field-value-emerald">{species}</span>
                                  </div>
                                  <div className="review-field-item">
                                    <span className="review-field-label">STAND AGE:</span>
                                    <span className="review-field-value">{age}</span>
                                  </div>
                                  <div className="review-field-item">
                                    <span className="review-field-label">TRUNK GIRTH:</span>
                                    <span className="review-field-value">{girth}</span>
                                  </div>
                                  <div className="review-field-item">
                                    <span className="review-field-label">EST. VOLUME:</span>
                                    <span className="review-field-value-emerald">{formatVolume(volume)}</span>
                                  </div>
                                  <div className="review-field-item sm:col-span-2">
                                    <span className="review-field-label">APPROX. TIMBER VALUE:</span>
                                    <span className="text-amber-400 font-black text-sm">{formatINR(approxValue)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Summary Totals & Disclaimer Notice */}
                        <div className="p-4 rounded-xl bg-[#030a05] border border-emerald-500/30 space-y-2 mt-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Selected Stands:</span>
                              <span className="font-bold text-white">{stands.length} Stand(s)</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Total Selected Trees:</span>
                              <span className="font-bold text-white">{stands.reduce((sum, s) => sum + Number(s.numberOfTrees ?? s.treeCount ?? s.count ?? s.quantity ?? 1), 0)} trees</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Est. Total Volume:</span>
                              <span className="font-bold text-emerald-400">{formatVolume(stands.reduce((sum, s) => sum + parseVolumeNumber(s.estimatedVolume || s.volume), 0))}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Approx. Total Timber Value:</span>
                              <span className="font-black text-amber-400 text-sm">{formatINR(stands.reduce((sum, s) => sum + calculateApproxTimberValue(s.species || s.treeSpecies, s.estimatedVolume || s.volume), 0))}</span>
                            </div>
                          </div>
                          <p className="text-[10.5px] text-slate-400 italic pt-2 border-t border-emerald-500/10 leading-tight">
                            {TIMBER_VALUE_DISCLAIMER}
                          </p>
                        </div>
                      </div>

                      {/* REQUEST SPECIFICATIONS GRID */}
                      <div className="harvest-specs-grid">
                        <div className="harvest-spec-box">
                          <span className="harvest-spec-label">Reason for Harvest</span>
                          <strong className="harvest-spec-value">{req.reason || req.reasonForHarvesting || 'Mature timber'}</strong>
                        </div>
                        <div className="harvest-spec-box">
                          <span className="harvest-spec-label">Assigned Contractor</span>
                          <strong className="harvest-spec-value truncate" title={req.assigned_contractor_name || req.assigned_contractor_email}>
                            {req.assigned_contractor_name || req.assigned_contractor_email || 'None Assigned'}
                          </strong>
                        </div>
                      </div>

                      {/* SITE CONDITIONS SUMMARY BAR & HAZARDS */}
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

                        {/* Special Instructions / Site Notes */}
                        {req.instructions && (
                          <div className="mt-1 p-3.5 rounded-xl bg-[#06140b]/90 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2.5 shadow-sm">
                            <FileText size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="text-emerald-300 font-bold block mb-0.5 uppercase tracking-wide text-[11px]">
                                Special Instructions / Site Notes:
                              </strong>
                              <span className="text-slate-200 leading-relaxed italic">{req.instructions}</span>
                            </div>
                          </div>
                        )}

                        {/* Uploaded Site Photos Gallery Bar */}
                        {Array.isArray(req.photos) && req.photos.length > 0 && req.photos[0] && (
                          <div className="mt-2 p-3.5 rounded-xl bg-[#06140b]/90 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div
                                onClick={() => openPhotoLightbox(req.photos, 0, `${req.property_name || 'Harvest Site'} - Inspection Photo`)}
                                className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-500/35 shrink-0 bg-[#030a05] cursor-pointer group shadow-md"
                                title="Click to view photo"
                              >
                                <img
                                  src={typeof req.photos[0] === 'string' ? req.photos[0] : (req.photos[0]?.previewUrl || req.photos[0]?.dataUrl)}
                                  alt="Harvest Site Photo"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                  <ZoomIn size={16} className="text-white" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <strong className="text-emerald-300 text-xs font-bold uppercase tracking-wider">
                                    Harvest Site Photo Attached
                                  </strong>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    {req.photos.length} Photo{req.photos.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-0.5">
                                  Visual parcel logs uploaded for contractor quotation &amp; site inspection.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => openPhotoLightbox(req.photos, 0, `${req.property_name || 'Harvest Site'} - Inspection Photo`)}
                              className="self-start sm:self-center px-3.5 py-1.5 rounded-lg bg-[#0e2013] hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                            >
                              <ZoomIn size={13} />
                              <span>View Full Photo</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* CONTRACTOR ASSESSMENT & COMMERCIAL PROPOSAL SUBMITTED (WHEN ASSESSED) */}
                      {(isAssessmentSubmitted || isAccepted || isRevisionRequested || activeAssessmentMap[reqId] || req.assessment) && (() => {
                        const assDoc = activeAssessmentMap[reqId] || req.assessment || {};
                        const propType = assDoc.commercial_proposal_type || req.commercial_proposal_type || 'Harvesting Service Quotation';
                        const isPurchase = propType === 'Timber Purchase Offer';
                        const isHybrid = propType === 'Purchase + Harvesting';
                        const isService = propType === 'Harvesting Service Quotation';

                        const assessedVolume = assDoc.estimated_harvestable_volume || req.estimated_harvestable_volume || stands.reduce((sum, s) => sum + parseVolumeNumber(s.estimatedVolume || s.volume), 0);
                        const totalQuoteVal = assDoc.total_quote ?? req.total_quote ?? 110000;
                        const purchaseOfferVal = assDoc.contractor_purchase_offer ?? req.contractor_purchase_offer;
                        const purchasePriceVal = assDoc.timber_purchase_price ?? req.timber_purchase_price;
                        const harvestArrangementCostVal = assDoc.harvesting_arrangement_cost ?? req.harvesting_arrangement_cost;
                        const refVal = assDoc.estimated_timber_value ?? req.estimated_timber_value;
                        const paymentTermsVal = assDoc.payment_terms || req.payment_terms;
                        const validUntilVal = assDoc.offer_valid_until || req.offer_valid_until;

                        return (
                          <div className="assessment-summary-card">
                            <div className="review-section-header">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                  {isPurchase ? <Coins size={16} /> : isHybrid ? <Handshake size={16} /> : <FileText size={16} />}
                                </div>
                                <div>
                                  <h4 className="review-section-title uppercase tracking-wide">
                                    {isPurchase
                                      ? 'Contractor Timber Purchase Offer'
                                      : isHybrid
                                        ? 'Purchase + Harvesting Commercial Proposal'
                                        : 'Contractor Quotation & Manpower Assessment'}
                                  </h4>
                                  <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                    {isPurchase
                                      ? 'Formal offer by contractor to purchase the timber from you.'
                                      : isHybrid
                                        ? 'Combined agreement: contractor purchases timber and undertakes harvesting operations.'
                                        : 'Formal on-site evaluation, estimated harvest yield, and operational quotation.'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={isAccepted ? "review-badge-green" : isRevisionRequested ? "review-badge-amber border-amber-500/50" : "review-badge-amber"}>
                                  {isAccepted ? (
                                    <>
                                      <CheckCircle2 size={13} className="text-emerald-400" />
                                      <span>Proposal Accepted & Authorized</span>
                                    </>
                                  ) : isRevisionRequested ? (
                                    <>
                                      <RefreshCw size={13} className="text-amber-400" />
                                      <span>Revision Requested by You</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={13} className="text-amber-400" />
                                      <span>Proposal Under Review</span>
                                    </>
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer no-print shadow"
                                  title="Print Formal Assessment Report"
                                >
                                  <Printer size={13} />
                                  <span>Print Report</span>
                                </button>
                              </div>
                            </div>

                            {/* COMMERCIAL ARRANGEMENT EXPLANATORY BANNER (REQUIREMENT 10) */}
                            <div className={`commercial-flow-banner ${
                              isPurchase
                                ? 'commercial-flow-banner-purchase'
                                : isHybrid
                                  ? 'commercial-flow-banner-hybrid'
                                  : 'commercial-flow-banner-service'
                            }`}>
                              <div className="flex items-center gap-3.5">
                                <div className={`commercial-flow-icon ${
                                  isPurchase
                                    ? 'commercial-flow-icon-purchase'
                                    : isHybrid
                                      ? 'commercial-flow-icon-hybrid'
                                      : 'commercial-flow-icon-service'
                                }`}>
                                  {isPurchase ? (
                                    <Coins size={20} />
                                  ) : isHybrid ? (
                                    <Handshake size={20} />
                                  ) : (
                                    <Truck size={20} />
                                  )}
                                </div>
                                <div>
                                  <strong className="block text-sm sm:text-base font-extrabold text-white tracking-tight">
                                    {isService && (
                                      <>
                                        Contractor is offering harvesting services for{' '}
                                        <span className="text-amber-300 font-black">{formatINR(totalQuoteVal)}</span>.
                                      </>
                                    )}
                                    {isPurchase && (
                                      <>
                                        Contractor is offering to purchase the timber for{' '}
                                        <span className="text-emerald-400 font-black">{formatINR(purchaseOfferVal || 0)}</span>.
                                      </>
                                    )}
                                    {isHybrid && (
                                      <>
                                        Contractor is offering to purchase the timber for{' '}
                                        <span className="text-emerald-400 font-black">{formatINR(purchasePriceVal || 0)}</span>{' '}
                                        and undertake the harvesting operation under the stated terms.
                                      </>
                                    )}
                                  </strong>
                                  <span className="text-xs text-slate-300 font-medium block mt-1">
                                    {isService && 'Money flow: Landowner → Contractor (You pay contractor for harvesting operations).'}
                                    {isPurchase && 'Money flow: Contractor → Landowner (Contractor pays you to purchase the timber. No harvesting charges).'}
                                    {isHybrid && 'Money flow: Commercial purchase with agreed operational harvesting arrangement.'}
                                  </span>
                                </div>
                              </div>
                              <span className={`commercial-flow-badge ${
                                isPurchase
                                  ? 'commercial-flow-badge-purchase'
                                  : isHybrid
                                    ? 'commercial-flow-badge-hybrid'
                                    : 'commercial-flow-badge-service'
                              }`}>
                                {propType}
                              </span>
                            </div>

                            {/* RESPONSIVE SPECIFICATION GRID (TAILORED TO PROPOSAL TYPE) */}
                            <div className="assessment-metrics-grid">
                              {/* 1. Assessed Volume */}
                              <div className="assessment-metric-item">
                                <span className="assessment-metric-label">
                                  <Layers size={13} className="text-emerald-400 shrink-0" /> Assessed Volume
                                </span>
                                <strong className="assessment-metric-value-emerald">
                                  {formatVolume(assessedVolume)}
                                </strong>
                              </div>

                              {/* 2 & 3: Proposal Specific Financial Values */}
                              {isService && (
                                <>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <DollarSign size={13} className="text-amber-400 shrink-0" /> Total Quotation
                                    </span>
                                    <strong className="assessment-metric-value-amber">
                                      {formatINR(totalQuoteVal)}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Users size={13} className="text-slate-400 shrink-0" /> Assigned Crew
                                    </span>
                                    <strong className="assessment-metric-value">
                                      {assDoc.assigned_workers_count || assDoc.workers_assigned || req.assigned_workers_count || req.workers_assigned || 12} Workers
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Clock size={13} className="text-slate-400 shrink-0" /> Job Duration
                                    </span>
                                    <strong className="assessment-metric-value">
                                      {assDoc.estimated_duration || req.estimated_duration || '10 Working Days'}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Calendar size={13} className="text-slate-400 shrink-0" /> Proposed Start
                                    </span>
                                    <strong className="assessment-metric-value">
                                      {formatDateDMY(assDoc.proposed_start_date || req.proposed_start_date || '2026-10-02')}
                                    </strong>
                                  </div>
                                </>
                              )}

                              {isPurchase && (
                                <>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Coins size={13} className="text-emerald-400 shrink-0" /> Reference Timber Value
                                    </span>
                                    <strong className="assessment-metric-value-emerald">
                                      {formatINR(refVal || 0)}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Coins size={13} className="text-amber-400 shrink-0" /> Contractor Purchase Offer
                                    </span>
                                    <strong className="text-amber-400 font-extrabold text-base">
                                      {formatINR(purchaseOfferVal || 0)}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Calendar size={13} className="text-slate-400 shrink-0" /> Offer Valid Until
                                    </span>
                                    <strong className="assessment-metric-value">
                                      {formatDateDMY(validUntilVal)}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <FileText size={13} className="text-slate-400 shrink-0" /> Payment Terms
                                    </span>
                                    <strong className="assessment-metric-value text-xs truncate" title={paymentTermsVal || 'As agreed'}>
                                      {paymentTermsVal || 'Full settlement'}
                                    </strong>
                                  </div>
                                </>
                              )}

                              {isHybrid && (
                                <>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Coins size={13} className="text-emerald-400 shrink-0" /> Timber Purchase Price
                                    </span>
                                    <strong className="assessment-metric-value-emerald">
                                      {formatINR(purchasePriceVal || 0)}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Truck size={13} className="text-amber-400 shrink-0" /> Harvesting Arrangement
                                    </span>
                                    <strong className="assessment-metric-value-amber text-xs truncate">
                                      {harvestArrangementCostVal ? formatINR(harvestArrangementCostVal) : 'Included / As Agreed'}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Calendar size={13} className="text-slate-400 shrink-0" /> Offer Valid Until
                                    </span>
                                    <strong className="assessment-metric-value">
                                      {formatDateDMY(validUntilVal)}
                                    </strong>
                                  </div>
                                  <div className="assessment-metric-item">
                                    <span className="assessment-metric-label">
                                      <Calendar size={13} className="text-slate-400 shrink-0" /> Operation Start
                                    </span>
                                    <strong className="assessment-metric-value">
                                      {formatDateDMY(assDoc.proposed_start_date || req.proposed_start_date || 'Flexible')}
                                    </strong>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* PAYMENT TERMS & REMARKS CALLOUT */}
                            {(paymentTermsVal || assDoc.notes || req.assessment?.notes) && (
                              <div className="assessment-remarks-callout">
                                {paymentTermsVal && (
                                  <div className="flex items-baseline gap-2">
                                    <strong className="text-emerald-400 font-bold shrink-0">Commercial Payment Terms: </strong>
                                    <span className="text-slate-200">{paymentTermsVal}</span>
                                  </div>
                                )}
                                {(assDoc.notes || req.assessment?.notes || assDoc.site_notes) && (
                                  <div className="flex items-baseline gap-2">
                                    <strong className="text-emerald-400 font-bold shrink-0">Contractor Site Remarks: </strong>
                                    <span className="text-slate-200">{assDoc.notes || req.assessment?.notes || assDoc.site_notes}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* LANDOWNER REVISION STATUS (WHEN REVISION IS REQUESTED) */}
                            {isRevisionRequested ? (
                              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/35 flex flex-col gap-3 shadow-lg">
                                <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                                      <RefreshCw size={16} />
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-amber-300 text-sm block">
                                        Revision Requested from {req.assigned_contractor_name || 'Contractor'}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        Contractor has been notified to review and submit an updated assessment.
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setRevisionModalReq({ reqId, req, assessment: assDoc })}
                                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                                  >
                                    <RefreshCw size={12} />
                                    <span>Update Revision Request</span>
                                  </button>
                                </div>

                                {/* Display requested points */}
                                {Array.isArray(assDoc.revision_reasons || req.revision_reasons) && (assDoc.revision_reasons || req.revision_reasons).length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap pt-1">
                                    <span className="text-xs text-slate-400 font-semibold">Specified adjustments:</span>
                                    {(assDoc.revision_reasons || req.revision_reasons).map((reason, idx) => (
                                      <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/90 border border-amber-500/40 text-amber-300 shadow-sm">
                                        {reason}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Display landowner feedback notes */}
                                {(assDoc.landowner_feedback || req.landowner_feedback) && (
                                  <div className="p-3 rounded-xl bg-black/50 border border-amber-500/25 text-xs text-slate-200 italic leading-relaxed">
                                    "{assDoc.landowner_feedback || req.landowner_feedback}"
                                  </div>
                                )}
                              </div>
                            ) : isAssessmentSubmitted ? (
                              <div className="assessment-action-bar">
                                <div className="assessment-action-hint">
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                    <ShieldCheck size={15} />
                                  </div>
                                  <span>
                                    {isPurchase
                                      ? 'Accepting the purchase offer enters into a binding timber sale agreement with the contractor.'
                                      : isHybrid
                                        ? 'Accepting confirms the timber purchase valuation and authorizes harvesting operations.'
                                        : 'Authorizing the assessment confirms the quotation and schedules the contractor for operations.'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleAssessmentAction(reqId, 'REJECTED', 'Landowner declined this commercial proposal.')}
                                    className="assessment-btn-decline"
                                  >
                                    <XCircle size={15} />
                                    <span>Decline Proposal</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setRevisionModalReq({ reqId, req, assessment: assDoc })}
                                    className="assessment-btn-revision"
                                  >
                                    <RefreshCw size={14} />
                                    <span>Request Revision</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAssessmentAction(reqId, 'ACCEPTED')}
                                    className="assessment-btn-accept"
                                  >
                                    <CheckCircle2 size={16} />
                                    <span>
                                      {isPurchase
                                        ? 'Accept Purchase Offer'
                                        : isHybrid
                                          ? 'Accept Proposal & Authorize'
                                          : 'Accept Assessment & Authorize'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}

                      {/* ASSIGNED CONTRACTOR / SELECTION FOOTER BAR */}
                      {isAssigned ? (
                        <div className="harvest-contractor-footer">
                          <div className="harvest-contractor-info">
                            <div className="harvest-contractor-avatar">
                              <UserCheck size={20} />
                            </div>
                            <div>
                              <span className="harvest-contractor-subhead">
                                Assigned Harvesting Contractor
                              </span>
                              <h4 className="harvest-contractor-name">
                                {req.assigned_contractor_name || req.assigned_contractor_email}
                              </h4>
                              <p className="harvest-contractor-desc">
                                Contractor on record for site inspection & operational execution.
                              </p>
                            </div>
                          </div>

                          <div className="harvest-contractor-actions">
                            {req.assigned_contractor_email && (
                              <a
                                href={`mailto:${req.assigned_contractor_email}`}
                                className="harvest-btn-contact"
                              >
                                <Mail size={14} /> Contact
                              </a>
                            )}
                            <button
                              onClick={() => setSelectedRequestForContractor(req)}
                              className="harvest-btn-change"
                            >
                              <ShieldCheck size={14} /> Change Contractor
                            </button>
                          </div>
                        </div>
                      ) : isPendingContractor ? (
                        <div className="harvest-contractor-footer">
                          <div>
                            <span className="harvest-contractor-subhead">
                              Contractor Selection Required
                            </span>
                            <h4 className="harvest-contractor-name flex items-center gap-2">
                              <ShieldCheck size={16} className="text-emerald-400" /> Assign Admin-Approved Contractor
                            </h4>
                            <p className="harvest-contractor-desc">
                              Select from platform-verified active contractors to perform a site inspection and execute harvesting operations.
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedRequestForContractor(req)}
                            className="harvest-btn-assign"
                          >
                            <UserCheck size={16} /> Select Approved Contractor
                          </button>
                        </div>
                      ) : null}

                    </div>
                  );
                })}
              </div>
            )}

            {/* MODAL FOR CONTRACTOR SELECTION */}
            {selectedRequestForContractor && (
              <ApprovedContractorSelector
                selectedContractorId={selectedRequestForContractor.assigned_contractor_id}
                onSelectContractor={handleAssignContractor}
                onCancel={() => setSelectedRequestForContractor(null)}
                isModal={true}
              />
            )}

            {/* MODAL FOR REVISION REQUEST */}
            {revisionModalReq && (
              <RevisionRequestModal
                request={revisionModalReq.req}
                assessment={revisionModalReq.assessment}
                contractorName={revisionModalReq.req?.assigned_contractor_name || 'Assigned Contractor'}
                onClose={() => setRevisionModalReq(null)}
                onSubmit={async (reasons, notes) => {
                  await handleAssessmentAction(
                    revisionModalReq.reqId,
                    'REVISION_REQUESTED',
                    notes,
                    reasons
                  );
                  setRevisionModalReq(null);
                }}
              />
            )}

            {/* LIGHTBOX MODAL FOR HARVEST SITE PHOTOS */}
            {activePhotoModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0a0f0d]/95 backdrop-blur-md animate-fade-in">
                <div className="max-w-4xl w-full p-6 border border-emerald-500/30 rounded-2xl bg-[#121a16] space-y-4 shadow-2xl relative">
                  <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Camera size={18} className="text-emerald-400" /> {activePhotoModal.title}
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
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default HarvestRequestsPage;

