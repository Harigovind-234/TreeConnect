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
  ExternalLink
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
                        : [{ groupName: 'Teak Stand #1', numberOfTrees: 1, species: 'Teak', approxAge: '15 years', girth: '60 - 80cm', estimatedVolume: '1.8 m³' }]));

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
                            const age = s.approxAge || s.standAge || s.age || '15 years';
                            const girth = s.girth || s.trunkGirth || s.averageDbh || '60 - 80cm';
                            const volume = s.estimatedVolume || s.volume || '1.8 m³';

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
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* REQUEST SPECIFICATIONS GRID */}
                      <div className="harvest-specs-grid">
                        <div className="harvest-spec-box">
                          <span className="harvest-spec-label">Reason for Harvest</span>
                          <strong className="harvest-spec-value">{req.reason || req.reasonForHarvesting || 'Mature timber'}</strong>
                        </div>
                        <div className="harvest-spec-box">
                          <span className="harvest-spec-label">Services Needed</span>
                          <span className="harvest-spec-value-highlight">{servicesNeededText}</span>
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

