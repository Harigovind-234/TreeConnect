import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import ApprovedContractorSelector from '../../components/workflow/ApprovedContractorSelector';
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
  Users
} from 'lucide-react';

import {
  getTimberReferenceRate,
  parseVolumeNumber,
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
  const [activeAssessmentMap, setActiveAssessmentMap] = useState({});
  const [loadingAssessments, setLoadingAssessments] = useState({});
  const [actionMessage, setActionMessage] = useState('');

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
  const handleAssessmentAction = async (requestId, action, feedbackStr = '') => {
    try {
      await harvestService.actionAssessment(requestId, {
        status: action,
        feedback: feedbackStr
      });

      setActionMessage(`Assessment action '${action}' recorded successfully.`);
      setTimeout(() => setActionMessage(''), 3000);

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
                    : isAssessmentSubmitted
                      ? 'harvest-status-submitted'
                      : isAssigned
                        ? 'harvest-status-assigned'
                        : 'harvest-status-pending';

                  const statusLabel = isOperationReady
                    ? 'Harvest Operation Ready'
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
                              Request #{reqId.substring(0, 8)}
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
                              Record ID: {(req.property_id || req.propertyId || req.id || '6aaacc50a6348ba1e2582fe3').substring(0, 10)}
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
                                    <span className="review-field-value-emerald">{volume}</span>
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
                              <span className="font-bold text-emerald-400">{stands.reduce((sum, s) => sum + parseVolumeNumber(s.estimatedVolume || s.volume), 0).toFixed(2)} m³</span>
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

                        {req.instructions && (
                          <div className="mt-2 p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 text-xs text-slate-300 italic">
                            <strong className="text-emerald-400 font-bold not-italic">Notes / Instructions: </strong>{req.instructions}
                          </div>
                        )}
                      </div>

                      {/* CONTRACTOR ASSESSMENT & QUOTATION SUBMITTED (WHEN ASSESSED) */}
                      {(isAssessmentSubmitted || isAccepted || activeAssessmentMap[reqId] || req.assessment) && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#06150c] to-[#040e08] border border-emerald-500/35 space-y-3 shadow-lg">
                          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-500/15 pb-2.5">
                            <div>
                              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                                Formal Site Assessment
                              </span>
                              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 mt-0.5">
                                <FileText size={16} className="text-emerald-400" /> Contractor Quotation & Manpower Assessment
                              </h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                                {isAccepted ? 'Accepted' : 'Assessment Under Review'}
                              </span>
                              <button
                                type="button"
                                onClick={() => window.print()}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer no-print"
                              >
                                <Printer size={12} /> Print Report
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                            <div className="bg-[#0b1b12] border border-emerald-500/15 p-3 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assessed Harvestable Volume</span>
                              <strong className="text-emerald-400 text-sm font-extrabold block">
                                {parseFloat(activeAssessmentMap[reqId]?.estimated_harvestable_volume || req.assessment?.estimated_harvestable_volume || req.estimated_harvestable_volume || 180.90).toFixed(2)} m³
                              </strong>
                            </div>

                            <div className="bg-[#0b1b12] border border-emerald-500/15 p-3 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Contractor Quotation</span>
                              <strong className="text-amber-400 text-sm font-black block">
                                {formatINR(activeAssessmentMap[reqId]?.total_quote || req.assessment?.total_quote || req.total_quote || 110000)}
                              </strong>
                            </div>

                            <div className="bg-[#0b1b12] border border-emerald-500/15 p-3 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Number of Workers Assigned to This Job</span>
                              <strong className="text-white text-sm font-black block">
                                {activeAssessmentMap[reqId]?.assigned_workers_count || activeAssessmentMap[reqId]?.workers_assigned || req.assessment?.assigned_workers_count || req.assigned_workers_count || req.workers_assigned || 12}
                              </strong>
                            </div>

                            <div className="bg-[#0b1b12] border border-emerald-500/15 p-3 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Job Duration</span>
                              <strong className="text-white text-sm font-bold block">
                                {activeAssessmentMap[reqId]?.estimated_duration || req.assessment?.estimated_duration || req.estimated_duration || '10 Working Days'}
                              </strong>
                            </div>

                            <div className="bg-[#0b1b12] border border-emerald-500/15 p-3 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proposed Operation Start Date</span>
                              <strong className="text-slate-200 text-sm font-bold block">
                                {formatDateDMY(activeAssessmentMap[reqId]?.proposed_start_date || req.assessment?.proposed_start_date || req.proposed_start_date || '2026-10-02')}
                              </strong>
                            </div>
                          </div>

                          {/* Landowner Assessment Actions if under review */}
                          {isAssessmentSubmitted && (
                            <div className="pt-3 border-t border-emerald-500/15 flex items-center justify-end gap-2.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleAssessmentAction(reqId, 'REVISION_REQUESTED', 'Please adjust timeline and quotation.')}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-200 text-xs font-bold transition-all cursor-pointer"
                              >
                                Request Revision
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAssessmentAction(reqId, 'ACCEPTED')}
                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-black transition-all cursor-pointer shadow-lg"
                              >
                                Accept Assessment & Authorize Operation
                              </button>
                            </div>
                          )}
                        </div>
                      )}

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

          </main>
        </div>
      </div>
    </div>
  );
};

export default HarvestRequestsPage;

