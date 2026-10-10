import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import ApprovedContractorSelector from '../../components/workflow/ApprovedContractorSelector';
import RevisionRequestModal from '../../components/workflow/RevisionRequestModal';
import DigitalAgreementModal from '../../components/workflow/DigitalAgreementModal';
import RescheduleInspectionModal from '../../components/workflow/RescheduleInspectionModal';
import RecordAdvancePaymentModal from '../../components/workflow/RecordAdvancePaymentModal';
import AdvancePaymentCard from '../../components/workflow/AdvancePaymentCard';
import harvestService from '../../services/harvestService';
import './LandownerDashboard.css';
import {
  Axe,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  CalendarClock,
  CalendarCheck,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  Briefcase,
  Phone,
  Navigation,
  ClipboardCheck,
  Check,
  Target,
  FileCheck,
  Ruler
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
  const location = useLocation();
  const landownerCtx = useLandowner() || {};
  const harvestRequests = landownerCtx.harvestRequests || [];
  const refreshHarvestRequests = landownerCtx.refreshHarvestRequests || (() => { });
  const assignContractorToRequest = landownerCtx.assignContractorToRequest || (() => { });
  const deleteHarvestRequest = landownerCtx.deleteHarvestRequest || (() => { });
  const setHarvestRequests = landownerCtx.setHarvestRequests;

  const triggerUIUpdate = () => {
    if (setHarvestRequests) {
      try {
        const stored = JSON.parse(localStorage.getItem('treeconnect_harvest_requests'));
        if (stored) setHarvestRequests(stored);
      } catch (e) {}
    }
    refreshHarvestRequests();
  };

  const [selectedRequestForContractor, setSelectedRequestForContractor] = useState(null);
  const [revisionModalReq, setRevisionModalReq] = useState(null);
  const [selectedAgreementModal, setSelectedAgreementModal] = useState(null);
  const [rescheduleModalReq, setRescheduleModalReq] = useState(null);
  const [selectedRecordPaymentModal, setSelectedRecordPaymentModal] = useState(null);
  const [activeAssessmentMap, setActiveAssessmentMap] = useState({});
  const [loadingAssessments, setLoadingAssessments] = useState({});
  const [actionMessage, setActionMessage] = useState('');
  const [expandedRequests, setExpandedRequests] = useState({});

  const toggleRequestExpanded = (reqId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [reqId]: !prev[reqId]
    }));
  };
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
        triggerUIUpdate();
      } catch (err) {
        console.error("Error deleting harvest request:", err);
        setActionMessage("Failed to delete harvest request.");
      }
    }
  };

  // Fetch assessments eagerly for any request with assigned contractor or assessment
  // Auto-refresh data every 15 seconds to ensure the page automatically loads changes
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshHarvestRequests();
    }, 15000);
    return () => clearInterval(intervalId);
  }, []); // Only run once on mount

  useEffect(() => {
    const fetchAssessments = async () => {
      for (const req of harvestRequests) {
        const reqId = req.id || req._id;
        if (!reqId) continue;

        // Eagerly hydrate from local request object if present
        if (req.assessment) {
          setActiveAssessmentMap(prev => ({ ...prev, [reqId]: req.assessment }));
        }

        if (req.assigned_contractor_id || req.assessment || req.status === 'ASSESSMENT_SUBMITTED' || req.status === 'OPERATION_READY' || req.status === 'ACCEPTED' || req.status === 'REVISION_REQUESTED') {
          setLoadingAssessments(prev => ({ ...prev, [reqId]: true }));
          try {
            const data = await harvestService.getAssessment(reqId);
            if (data && (data.assessment || data.id || data.commercial_proposal_type)) {
              const assObj = data.assessment || data;
              setActiveAssessmentMap(prev => ({ ...prev, [reqId]: assObj }));
            }
          } catch (e) {
            // Silently fall back to existing req.assessment or localStorage
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

  // Handle Landowner Action on Assessment (Accept, Reject, Request Revision with Counter-Proposal)
  const handleAssessmentAction = async (requestId, action, feedbackStr = '', revisionReasons = [], counterOfferAmount = null, counterOfferStartDate = null) => {
    try {
      await harvestService.actionAssessment(requestId, {
        status: action,
        feedback: feedbackStr,
        revision_reasons: revisionReasons,
        counter_offer_amount: counterOfferAmount,
        counter_offer_start_date: counterOfferStartDate
      });

      // Synchronize in local storage treeconnect_harvest_requests for instant zero-latency UI
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(r => {
            if (String(r.id) === String(requestId) || String(r._id) === String(requestId)) {
              const newStatus = action === 'ACCEPTED' ? 'OPERATION_READY' : (action === 'REVISION_REQUESTED' ? 'REVISION_REQUESTED' : action);
              const digitalAgr = action === 'ACCEPTED' ? {
                agreement_id: `TC-AGR-${new Date().getFullYear()}-${String(requestId).slice(-6).toUpperCase()}`,
                signed_at: new Date().toISOString(),
                status: 'EXECUTED_AND_BINDING',
                parties: {
                  landowner_name: r.userName || r.landowner_name || r.ownerName || 'Registered Landowner',
                  contractor_name: r.assigned_contractor_name || 'Assigned Harvesting Contractor'
                }
              } : r.digital_agreement;

              return {
                ...r,
                status: newStatus,
                landowner_feedback: feedbackStr,
                revision_reasons: revisionReasons,
                counter_offer_amount: counterOfferAmount,
                counter_offer_start_date: counterOfferStartDate,
                digital_agreement: digitalAgr,
                assessment: {
                  ...(r.assessment || {}),
                  status: action,
                  landowner_feedback: feedbackStr,
                  revision_reasons: revisionReasons,
                  counter_offer_amount: counterOfferAmount,
                  counter_offer_start_date: counterOfferStartDate
                }
              };
            }
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (errLocal) {
        console.warn("Could not sync action to localStorage:", errLocal);
      }

      // Instantly update activeAssessmentMap in local state
      setActiveAssessmentMap(prev => ({
        ...prev,
        [requestId]: {
          ...(prev[requestId] || {}),
          status: action,
          landowner_feedback: feedbackStr,
          revision_reasons: revisionReasons,
          counter_offer_amount: counterOfferAmount,
          counter_offer_start_date: counterOfferStartDate
        }
      }));

      setActionMessage(
        action === 'REVISION_REQUESTED'
          ? "Fair deal counter-proposal and revision specifications sent to contractor successfully!"
          : action === 'ACCEPTED'
            ? "Proposal accepted! Binding Digital Harvest Agreement generated and finalized."
            : `Assessment action '${action}' recorded successfully.`
      );
      setTimeout(() => setActionMessage(''), 4500);

      // Refresh requests list
      triggerUIUpdate();
    } catch (err) {
      console.error("Error updating assessment status:", err);
      setActionMessage("Failed to update assessment status: " + (err.message || 'Error'));
    }
  };

  // Handle Landowner Suggesting Alternate Site Inspection Date
  const handleRescheduleInspection = async (requestId, rescheduleData) => {
    try {
      await harvestService.rescheduleInspection(requestId, rescheduleData);

      // Instantly synchronize in local storage for instant zero-latency UI update
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(r => {
            if (String(r.id) === String(requestId) || String(r._id) === String(requestId)) {
              return {
                ...r,
                reschedule_requested: true,
                inspection_status: 'RESCHEDULE_REQUESTED',
                site_inspection: {
                  ...(r.site_inspection || {}),
                  original_scheduled_date: r.site_inspection?.original_scheduled_date || r.site_inspection?.scheduled_date || r.inspection_scheduled_date,
                  reschedule_requested: true,
                  reschedule_status: 'PENDING_CONTRACTOR',
                  suggested_date: rescheduleData.suggested_date,
                  suggested_time_slot: rescheduleData.suggested_time_slot,
                  reschedule_reason: rescheduleData.reschedule_reason,
                  reschedule_notes: rescheduleData.reschedule_notes,
                  reschedule_requested_at: new Date().toISOString(),
                  reschedule_history: [
                    ...(Array.isArray(r.site_inspection?.reschedule_history) ? r.site_inspection.reschedule_history : []),
                    {
                      original_scheduled_date: r.site_inspection?.scheduled_date || r.inspection_scheduled_date,
                      suggested_date: rescheduleData.suggested_date,
                      suggested_time_slot: rescheduleData.suggested_time_slot,
                      reschedule_reason: rescheduleData.reschedule_reason,
                      reschedule_notes: rescheduleData.reschedule_notes,
                      requested_at: new Date().toISOString(),
                      requested_by: 'LANDOWNER'
                    }
                  ]
                }
              };
            }
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (errLocal) {
        console.warn("Could not sync reschedule to localStorage:", errLocal);
      }

      setActionMessage(`Suggested alternate inspection date (${formatDateDMY(rescheduleData.suggested_date)}). Contractor has been notified.`);
      setTimeout(() => setActionMessage(''), 5000);
      triggerUIUpdate();
    } catch (err) {
      console.error("Error submitting inspection reschedule:", err);
      setActionMessage("Failed to submit reschedule request: " + (err?.message || 'Error'));
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  // Withdraw Reschedule Request (retains original schedule)
  const handleWithdrawReschedule = async (requestId) => {
    try {
      await harvestService.respondReschedule(requestId, { action: 'CANCEL_REQUEST' });

      // Synchronize localStorage
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(r => {
            if (String(r.id) === String(requestId) || String(r._id) === String(requestId)) {
              const prevIns = r.site_inspection || {};
              return {
                ...r,
                reschedule_requested: false,
                inspection_status: prevIns.status || 'SCHEDULED',
                site_inspection: {
                  ...prevIns,
                  reschedule_requested: false,
                  reschedule_status: 'CANCELLED_BY_LANDOWNER'
                }
              };
            }
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (errLocal) {
        console.warn("Could not sync cancel to localStorage:", errLocal);
      }

      setActionMessage("Reschedule request withdrawn. Original appointment schedule retained.");
      setTimeout(() => setActionMessage(''), 4000);
      triggerUIUpdate();
    } catch (err) {
      console.error("Error withdrawing reschedule request:", err);
    }
  };

  // Handle Landowner Confirming / Accepting Date Preferred by Contractor
  const [confirmingDateId, setConfirmingDateId] = useState(null);

  const handleConfirmInspectionDate = async (requestId, inspection) => {
    setConfirmingDateId(requestId);
    try {
      const nowIso = new Date().toISOString();
      await harvestService.confirmInspectionDate(requestId, {
        confirmed_by: 'LANDOWNER',
        notes: 'Date accepted by landowner'
      });

      // Synchronize in localStorage for instant reactive update
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(r => {
            if (String(r.id) === String(requestId) || String(r._id) === String(requestId)) {
              return {
                ...r,
                reschedule_requested: false,
                inspection_status: 'CONFIRMED',
                site_inspection: {
                  ...(r.site_inspection || {}),
                  landowner_confirmed: true,
                  landowner_confirmed_at: nowIso,
                  status: 'CONFIRMED',
                  reschedule_requested: false
                }
              };
            }
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (errLocal) {
        console.warn("Could not sync confirmation to localStorage:", errLocal);
      }

      const dateStr = formatDateDMY(inspection?.scheduled_date);
      setActionMessage(`Site inspection visit on ${dateStr} successfully confirmed and accepted! Contractor notified.`);
      setTimeout(() => setActionMessage(''), 5000);
      triggerUIUpdate();
    } catch (err) {
      console.error("Error confirming inspection date:", err);
      setActionMessage("Failed to confirm inspection date: " + (err?.message || 'Error'));
      setTimeout(() => setActionMessage(''), 4000);
    } finally {
      setConfirmingDateId(null);
    }
  };

  // Handle Landowner Recording Advance Payment
  const handleRecordAdvancePayment = async (requestId, paymentData) => {
    try {
      const nowIso = new Date().toISOString();
      const newPayment = {
        payment_id: `PAY-ADV-${Date.now()}`,
        harvest_request_id: String(requestId),
        amount: Number(paymentData.amount),
        payment_method: paymentData.payment_method,
        transaction_reference: paymentData.transaction_reference,
        payment_date: paymentData.payment_date,
        receipt_url: paymentData.receipt_url || '',
        notes: paymentData.notes || '',
        status: 'VERIFICATION_PENDING',
        created_at: nowIso,
        updated_at: nowIso
      };

      // Optimistically update localStorage for zero-latency reactive UI
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(r => {
            if (String(r.id) === String(requestId) || String(r._id) === String(requestId)) {
              const prevPayments = Array.isArray(r.payments) ? r.payments : [];
              return {
                ...r,
                advance_payment_status: 'VERIFICATION_PENDING',
                is_advance_verified: false,
                latest_payment: newPayment,
                payments: [newPayment, ...prevPayments.filter(p => p.transaction_reference !== newPayment.transaction_reference)],
                assessment: {
                  ...(r.assessment || {}),
                  advance_payment_status: 'VERIFICATION_PENDING',
                  latest_payment: newPayment
                }
              };
            }
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (errLocal) {
        console.warn("Could not sync payment record to localStorage:", errLocal);
      }

      await harvestService.submitAdvancePayment(requestId, paymentData);
      setActionMessage("Advance mobilization payment recorded successfully! Status: Verification Pending by contractor.");
      setTimeout(() => setActionMessage(''), 5000);
      refreshHarvestRequests();
    } catch (err) {
      console.error("Error recording advance payment:", err);
      setActionMessage("Failed to record payment: " + (err.message || 'Error'));
      setTimeout(() => setActionMessage(''), 5000);
    }
  };


  // Scroll to targeted inspection visit or request if navigated from dashboard
  useEffect(() => {
    if (location.state?.highlightRequestId) {
      const targetId = location.state.highlightRequestId;
      setTimeout(() => {
        const el = document.getElementById(`inspection-visit-${targetId}`) || document.getElementById(`harvest-request-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }
  }, [location.state, harvestRequests]);

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
          <main className="w-full max-w-5xl mx-auto flex flex-col gap-6">

            {/* HEADER */}
            <div className="harvest-requests-header-card">
              <div>
                <div className="harvest-tag-pill mb-2">
                  <Axe size={13} /> Registered Estate Harvesting Requests
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  Harvest Requests &amp; Contractor Assessments
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  Track submitted harvest requests, assign platform-verified contractors, and review contractor assessments &amp; quotations.
                </p>
              </div>

              <button
                onClick={() => navigate('/landowner/request-harvest')}
                className="ld-btn-action"
              >
                <Plus size={16} /> Submit New Harvest Request
              </button>
            </div>

            {/* ACTION ALERT MESSAGE */}
            {actionMessage && (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 font-bold shadow-lg">
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
              <div className="flex flex-col gap-6">
                {harvestRequests.map((req) => {
                  const reqId = req.id || req._id || 'unknown';
                  const assessment = activeAssessmentMap[reqId];
                  const isLoadingAssessment = loadingAssessments[reqId];

                  const isPendingContractor = !req.assigned_contractor_id && !req.assigned_contractor_email;
                  const isAssigned = Boolean(req.assigned_contractor_id || req.assigned_contractor_email);
                  const isAssessmentSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                  const isOperationReady = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED' || req.status === 'IN_PROGRESS' || req.status === 'COMPLETED';
                  const isRevisionRequested = req.status === 'REVISION_REQUESTED' || assessment?.status === 'REVISION_REQUESTED';
                  const isAccepted = isOperationReady;

                  const isExpanded = expandedRequests[reqId] !== undefined ? expandedRequests[reqId] : !isOperationReady;

                  const isUnderReview = (req.status === 'ASSESSMENT_SUBMITTED' || assessment?.status === 'SUBMITTED') && req.status !== 'OPERATION_READY' && req.status !== 'IN_PROGRESS' && req.status !== 'COMPLETED';
                  const isAgreementReady = !isUnderReview && Boolean(
                    isAccepted ||
                    req.status === 'OPERATION_READY' ||
                    req.status === 'IN_PROGRESS' ||
                    req.status === 'COMPLETED' ||
                    (req.status === 'ACCEPTED' && req.digital_agreement) ||
                    (assessment?.status === 'ACCEPTED' && req.digital_agreement)
                  );

                  const inspection = req.site_inspection || {};
                  const isInspectionCompleted = Boolean(
                    req.site_inspected ||
                    req.inspection_status === 'COMPLETED' ||
                    req.inspection_status === 'REPORT_SUBMITTED' ||
                    inspection.status === 'COMPLETED' ||
                    inspection.status === 'REPORT_SUBMITTED'
                  );
                  const isInspectionScheduled = !isInspectionCompleted && Boolean(
                    req.inspection_status === 'SCHEDULED' ||
                    req.inspection_status === 'CONFIRMED' ||
                    req.inspection_status === 'IN_PROGRESS' ||
                    inspection.status === 'SCHEDULED' ||
                    inspection.status === 'CONFIRMED' ||
                    inspection.status === 'IN_PROGRESS' ||
                    Boolean(inspection.scheduled_date)
                  );

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

                  const statusClass = isInspectionScheduled
                    ? 'harvest-status-scheduled'
                    : isOperationReady
                      ? 'harvest-status-ready'
                      : isRevisionRequested
                        ? 'harvest-status-revision'
                        : isAssessmentSubmitted
                          ? 'harvest-status-submitted'
                          : isInspectionCompleted
                            ? 'harvest-status-inspected'
                            : isAssigned
                              ? 'harvest-status-assigned'
                              : 'harvest-status-pending';

                  const statusLabel = isInspectionScheduled
                    ? 'Site Visit Scheduled'
                    : isOperationReady
                      ? 'Harvest Operation Ready'
                      : isRevisionRequested
                        ? 'Quotation Revision Requested'
                        : isAssessmentSubmitted
                          ? 'Contractor Assessment Submitted'
                          : isInspectionCompleted
                            ? 'Site Inspected & Verified'
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
                    <div key={reqId} id={`harvest-request-${reqId}`} className="harvest-request-card">

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
                            {isInspectionScheduled && (
                              <span className="harvest-date-pill bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm animate-pulse">
                                <Calendar size={13} className="text-emerald-400" /> Site Visit: {formatDateDMY(inspection.scheduled_date)}
                              </span>
                            )}
                            {isInspectionCompleted && (
                              <span className="harvest-date-pill bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 shadow-sm">
                                <CheckCircle2 size={13} className="text-emerald-400" /> Site Inspected &amp; Verified
                              </span>
                            )}
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
                            onClick={() => toggleRequestExpanded(reqId)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                            title={isExpanded ? "Collapse Details" : "View Details"}
                          >
                            {isExpanded ? <><ChevronUp size={15} /><span className="hidden sm:inline">Less</span></> : <><ChevronDown size={15} /><span className="hidden sm:inline">Details</span></>}
                          </button>
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

                      {isExpanded && (
                        <>
                          {/* FORMAL CONTRACTOR ASSESSMENT & COMMERCIAL PROPOSAL (SHOWN BEFORE & AFTER SITE VISIT) */}
                      {(isAssessmentSubmitted || isAccepted || isRevisionRequested || activeAssessmentMap[reqId] || req.assessment || req.total_quote || req.contractor_purchase_offer) && (() => {
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
                        const paymentTermsVal = assDoc.payment_terms || req.payment_terms;
                        const isInspectedSite = Boolean(req.site_inspected || isInspectionCompleted || assDoc.is_reassessed_after_inspection || req.inspection_status === 'COMPLETED');

                        const previousQuoteVal = assDoc.previous_quote ?? req.previous_quote ?? assDoc.original_quote ?? req.original_quote;
                        const isRevision = Boolean(
                          assDoc.is_revision ||
                          req.is_revision ||
                          (previousQuoteVal && previousQuoteVal !== totalQuoteVal) ||
                          (assDoc.reduction && assDoc.reduction > 0) ||
                          (req.reduction && req.reduction > 0)
                        );
                        const reductionAmt = assDoc.reduction ?? req.reduction ?? (previousQuoteVal && totalQuoteVal < previousQuoteVal ? previousQuoteVal - totalQuoteVal : 0);
                        const reductionPct = (previousQuoteVal && reductionAmt > 0) ? Math.round((reductionAmt / previousQuoteVal) * 100) : 0;

                        const fellingCost = assDoc.harvesting_cost ?? assDoc.felling_cost ?? req.harvesting_cost ?? req.felling_cost ?? 45000;
                        const extractionCost = assDoc.extraction_cost ?? req.extraction_cost ?? 30000;
                        const transportCost = assDoc.transportation_cost ?? req.transportation_cost ?? 25000;
                        const otherCost = assDoc.other_cost ?? req.other_cost ?? 10000;
                        const totalBreakdown = fellingCost + extractionCost + transportCost + otherCost || totalQuoteVal || 110000;
                        const fellingPct = Math.round((fellingCost / totalBreakdown) * 100);
                        const extractionPct = Math.round((extractionCost / totalBreakdown) * 100);
                        const transportPct = Math.round((transportCost / totalBreakdown) * 100);
                        const otherPct = Math.max(0, 100 - fellingPct - extractionPct - transportPct);

                        const counterAmt = assDoc.counter_offer_amount || req.counter_offer_amount;
                        const diffAmt = counterAmt ? totalQuoteVal - counterAmt : null;
                        const diffPct = (counterAmt && totalQuoteVal) ? Math.round(((totalQuoteVal - counterAmt) / totalQuoteVal) * 100) : null;

                        return (
                          <div className="qtn-card">
                            {/* 1. QUOTATION HEADER */}
                            <div className="qtn-header">
                              <div className="qtn-header-left">
                                <div className="qtn-header-icon-box">
                                  {isPurchase ? <Coins size={22} /> : isHybrid ? <Handshake size={22} /> : <Truck size={22} />}
                                </div>
                                <div className="qtn-header-title-wrap">
                                  <div className="qtn-header-badge-row">
                                    <span className="qtn-type-pill">
                                      {propType}
                                    </span>
                                    {isInspectedSite ? (
                                      <span className="qtn-verified-pill">
                                        <ClipboardCheck size={12} /> Post-Inspection Verified
                                      </span>
                                    ) : (
                                      <span className="qtn-pending-pill">
                                        <Clock size={12} /> Initial Estimate (Subject to Site Visit)
                                      </span>
                                    )}
                                    {isRevisionRequested ? (
                                      <span className="qtn-status-pill qtn-status-pill-amber">
                                        <RefreshCw size={12} /> Active Negotiation
                                      </span>
                                    ) : isAgreementReady ? (
                                      <span className="qtn-status-pill qtn-status-pill-green">
                                        <CheckCircle2 size={12} /> Executed &amp; Finalized
                                      </span>
                                    ) : isRevision ? (
                                      <span className="qtn-status-pill qtn-status-pill-amber">
                                        <RefreshCw size={12} /> Revised Quotation Received
                                      </span>
                                    ) : (
                                      <span className="qtn-status-pill qtn-status-pill-blue">
                                        <Clock size={12} /> Proposal Under Review
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="qtn-main-title">
                                    {isService && 'Contractor is offering harvesting services'}
                                    {isPurchase && 'Contractor is offering to purchase the timber'}
                                    {isHybrid && 'Contractor purchase offer with harvesting arrangement'}
                                  </h3>

                                  <p className="qtn-subtitle">
                                    {isService && 'Money flow: Landowner → Contractor (You pay contractor for harvesting operations).'}
                                    {isPurchase && 'Money flow: Contractor → Landowner (Contractor pays you to purchase the timber).'}
                                    {isHybrid && 'Money flow: Commercial purchase with agreed operational harvesting arrangement.'}
                                  </p>
                                </div>
                              </div>

                              {/* Header Right: Price & Print */}
                              <div className="qtn-header-right">
                                <div className="qtn-price-highlight">
                                  {isRevision && previousQuoteVal && previousQuoteVal !== totalQuoteVal ? (
                                    <div className="flex flex-col items-end">
                                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <span>Previous Quote:</span>
                                        <span className="line-through font-mono font-semibold text-slate-400">
                                          {formatINR(previousQuoteVal)}
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-1.5 mt-0.5">
                                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-400">
                                          Revised Quote:
                                        </span>
                                        <span className="qtn-price-val text-emerald-300">
                                          {formatINR(isPurchase ? (purchaseOfferVal || 0) : isHybrid ? (purchasePriceVal || 0) : totalQuoteVal)}
                                        </span>
                                      </div>
                                      {reductionAmt > 0 && (
                                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 mt-1 flex items-center gap-1">
                                          <span>↓ Saved {formatINR(reductionAmt)} ({reductionPct}% negotiated)</span>
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <>
                                      <span className="qtn-price-label">
                                        {isPurchase ? 'Purchase Offer' : isHybrid ? 'Purchase Price' : 'Total Quotation'}
                                      </span>
                                      <span className="qtn-price-val">
                                        {formatINR(isPurchase ? (purchaseOfferVal || 0) : isHybrid ? (purchasePriceVal || 0) : totalQuoteVal)}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="qtn-btn-print no-print"
                                  title="Print Formal Assessment Report"
                                >
                                  <Printer size={13} />
                                  <span>Print Report</span>
                                </button>
                              </div>
                            </div>



                            {/* REVISED QUOTATION NOTICE BANNER (WHEN CONTRACTOR HAS SUBMITTED A REVISED QUOTATION) */}
                            {isRevision && !isAgreementReady && (
                              <div className="qtn-revision-banner">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="qtn-revision-icon-box">
                                    <RefreshCw size={18} />
                                  </div>
                                  <div className="qtn-revision-info">
                                    <div className="qtn-revision-title-row">
                                      <h4 className="qtn-revision-title">
                                        Contractor Revised Quotation Submitted
                                      </h4>
                                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                                        Adjusted to {formatINR(totalQuoteVal)}
                                      </span>
                                      {reductionAmt > 0 && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                                          ↓ Saved {formatINR(reductionAmt)} ({reductionPct}% negotiated)
                                        </span>
                                      )}
                                    </div>
                                    <p className="qtn-revision-desc">
                                      Contractor has adjusted this commercial quotation based on mutual negotiation.
                                      {previousQuoteVal && previousQuoteVal > totalQuoteVal && (
                                        <> Baseline quotation was <strong className="text-slate-300 line-through font-mono font-semibold">{formatINR(previousQuoteVal)}</strong>.</>
                                      )}
                                      {' '}Review the revised terms below to <strong>Accept</strong> or request a <strong>Re-revision</strong>.
                                    </p>
                                  </div>
                                </div>

                                <div className="qtn-revision-comparison-capsule self-start sm:self-auto">
                                  <div className="qtn-revision-comp-col text-right">
                                    <span className="qtn-revision-comp-label text-slate-400">Previous</span>
                                    <span className="text-xs text-slate-400 line-through font-mono font-semibold">
                                      {formatINR(previousQuoteVal || totalQuoteVal)}
                                    </span>
                                  </div>
                                  <div className="qtn-revision-comp-arrow">
                                    →
                                  </div>
                                  <div className="qtn-revision-comp-col text-left">
                                    <span className="qtn-revision-comp-label text-emerald-400 font-bold">Revised</span>
                                    <span className="text-sm sm:text-base text-emerald-300 font-mono font-black">
                                      {formatINR(totalQuoteVal)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 2. KEY METRICS GRID (4-5 CARDS) */}
                            <div className="qtn-metrics-grid">
                              {/* 1. Assessed Volume */}
                              <div className="qtn-metric-card">
                                <div className="qtn-metric-head">
                                  <Layers size={14} className="text-emerald-400" />
                                  <span>Assessed Volume</span>
                                </div>
                                <div className="qtn-metric-value text-emerald-400">
                                  {formatVolume(assessedVolume)}
                                </div>
                                <div className="qtn-metric-foot">Ground truth verified</div>
                              </div>

                              {/* 2. Total Quotation / Purchase Offer */}
                              <div className="qtn-metric-card qtn-metric-card-highlight">
                                <div className="qtn-metric-head">
                                  <DollarSign size={14} className="text-amber-400" />
                                  <span>{isPurchase ? 'Purchase Offer' : 'Total Quotation'}</span>
                                </div>
                                <div className="qtn-metric-value text-amber-300">
                                  {formatINR(isPurchase ? (purchaseOfferVal || 0) : totalQuoteVal)}
                                </div>
                                <div className="qtn-metric-foot">{isPurchase ? 'Direct landowner payout' : 'Agreed harvest quotation'}</div>
                              </div>

                              {/* 3. Assigned Crew */}
                              <div className="qtn-metric-card">
                                <div className="qtn-metric-head">
                                  <Users size={14} className="text-slate-400" />
                                  <span>Assigned Crew</span>
                                </div>
                                <div className="qtn-metric-value text-white">
                                  {assDoc.assigned_workers_count || assDoc.workers_assigned || req.assigned_workers_count || req.workers_assigned || 10} Workers
                                </div>
                                <div className="qtn-metric-foot">Deployed workforce</div>
                              </div>

                              {/* 4. Job Duration */}
                              <div className="qtn-metric-card">
                                <div className="qtn-metric-head">
                                  <Clock size={14} className="text-slate-400" />
                                  <span>Job Duration</span>
                                </div>
                                <div className="qtn-metric-value text-white">
                                  {assDoc.estimated_duration || req.estimated_duration || '1 Working Day'}
                                </div>
                                <div className="qtn-metric-foot">Operational timeline</div>
                              </div>

                              {/* 5. Proposed Start */}
                              <div className="qtn-metric-card">
                                <div className="qtn-metric-head">
                                  <Calendar size={14} className="text-emerald-400" />
                                  <span>Proposed Start</span>
                                </div>
                                <div className="qtn-metric-value text-emerald-300">
                                  {formatDateDMY(assDoc.proposed_start_date || req.proposed_start_date || '2026-10-14')}
                                </div>
                                <div className="qtn-metric-foot">Post-inspection mobilization</div>
                              </div>
                            </div>

                            {/* 3. COST BREAKDOWN */}
                            {isService && (
                              <div className="qtn-breakdown-section">
                                <div className="qtn-section-header">
                                  <div className="qtn-section-title">
                                    <DollarSign size={15} className="text-emerald-400" />
                                    <span>Itemized Service Cost Breakdown</span>
                                  </div>
                                  <div className="qtn-section-total">
                                    Total Contractor Quotation: <strong className="text-amber-300 font-mono">{formatINR(totalQuoteVal)}</strong>
                                  </div>
                                </div>

                                <div className="qtn-breakdown-grid">
                                  <div className="qtn-breakdown-card">
                                    <div className="qtn-breakdown-card-top">
                                      <span className="qtn-breakdown-cat">Felling &amp; Logging</span>
                                      <span className="qtn-breakdown-pct">{fellingPct}%</span>
                                    </div>
                                    <div className="qtn-breakdown-cost">{formatINR(fellingCost)}</div>
                                    <p className="qtn-breakdown-desc">Chainsaw crew &amp; precision falling</p>
                                  </div>

                                  <div className="qtn-breakdown-card">
                                    <div className="qtn-breakdown-card-top">
                                      <span className="qtn-breakdown-cat">Extraction / Skid-Trail</span>
                                      <span className="qtn-breakdown-pct">{extractionPct}%</span>
                                    </div>
                                    <div className="qtn-breakdown-cost">{formatINR(extractionCost)}</div>
                                    <p className="qtn-breakdown-desc">Skid-trail haulage &amp; log handling</p>
                                  </div>

                                  <div className="qtn-breakdown-card">
                                    <div className="qtn-breakdown-card-top">
                                      <span className="qtn-breakdown-cat">Transportation / Haulage</span>
                                      <span className="qtn-breakdown-pct">{transportPct}%</span>
                                    </div>
                                    <div className="qtn-breakdown-cost">{formatINR(transportCost)}</div>
                                    <p className="qtn-breakdown-desc">10-wheeler log truck haulage</p>
                                  </div>

                                  <div className="qtn-breakdown-card">
                                    <div className="qtn-breakdown-card-top">
                                      <span className="qtn-breakdown-cat">Other / Site Clearing</span>
                                      <span className="qtn-breakdown-pct">{otherPct}%</span>
                                    </div>
                                    <div className="qtn-breakdown-cost">{formatINR(otherCost)}</div>
                                    <p className="qtn-breakdown-desc">Slash, debris &amp; boundary clearing</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isPurchase && (
                              <div className="qtn-breakdown-section border-amber-500/25">
                                <div className="qtn-section-header border-amber-500/20">
                                  <div className="qtn-section-title text-amber-400">
                                    <Coins size={15} />
                                    <span>Timber Purchase Commercial Terms</span>
                                  </div>
                                  <div className="qtn-section-total">
                                    Payable to Landowner: <strong className="text-emerald-400 font-mono">{formatINR(purchaseOfferVal || 0)}</strong>
                                  </div>
                                </div>

                                <div className="qtn-breakdown-grid">
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Contractor Purchase Offer</span>
                                    <div className="qtn-breakdown-cost text-emerald-400">{formatINR(purchaseOfferVal || 0)}</div>
                                    <p className="qtn-breakdown-desc">Net payout directly to landowner</p>
                                  </div>
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Reference Timber Value</span>
                                    <div className="qtn-breakdown-cost text-white">{formatINR(assDoc.estimated_timber_value || req.total_estimated_price || 237133)}</div>
                                    <p className="qtn-breakdown-desc">Market estimation based on girth &amp; volume</p>
                                  </div>
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Offer Valid Until</span>
                                    <div className="qtn-breakdown-cost text-slate-200 text-sm font-bold">{formatDateDMY(assDoc.offer_valid_until || 'Flexible')}</div>
                                    <p className="qtn-breakdown-desc">Guaranteed proposal window</p>
                                  </div>
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Harvesting Responsibilities</span>
                                    <div className="qtn-breakdown-cost text-emerald-300 text-sm font-bold">Contractor Handled</div>
                                    <p className="qtn-breakdown-desc">Zero harvesting fees for landowner</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {isHybrid && (
                              <div className="qtn-breakdown-section">
                                <div className="qtn-section-header">
                                  <div className="qtn-section-title">
                                    <Handshake size={15} />
                                    <span>Commercial Purchase + Operational Arrangement</span>
                                  </div>
                                  <div className="qtn-section-total">
                                    Purchase Price: <strong className="text-emerald-400 font-mono">{formatINR(purchasePriceVal || 0)}</strong>
                                  </div>
                                </div>

                                <div className="qtn-breakdown-grid">
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Timber Purchase Price</span>
                                    <div className="qtn-breakdown-cost text-emerald-400">{formatINR(purchasePriceVal || 0)}</div>
                                    <p className="qtn-breakdown-desc">Payment to landowner for standing trees</p>
                                  </div>
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Harvesting Arrangement</span>
                                    <div className="qtn-breakdown-cost text-white text-sm font-bold">{harvestArrangementCostVal ? formatINR(harvestArrangementCostVal) : 'Contractor Arranged'}</div>
                                    <p className="qtn-breakdown-desc">Field felling &amp; extraction terms</p>
                                  </div>
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Transport Logistics</span>
                                    <div className="qtn-breakdown-cost text-slate-200 text-sm font-bold">{assDoc.transportation_arrangement || 'Contractor Managed'}</div>
                                    <p className="qtn-breakdown-desc">Haulage from estate to mill</p>
                                  </div>
                                  <div className="qtn-breakdown-card">
                                    <span className="qtn-breakdown-cat">Offer Valid Until</span>
                                    <div className="qtn-breakdown-cost text-slate-200 text-sm font-bold">{formatDateDMY(assDoc.offer_valid_until || 'Flexible')}</div>
                                    <p className="qtn-breakdown-desc">Commercial validity timeline</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* 4. SITE REMARKS */}
                            {(assDoc.notes || req.assessment?.notes || assDoc.site_notes || paymentTermsVal || req.notes) && (
                              <div className="qtn-remarks-card">
                                <div className="qtn-remarks-icon-wrap">
                                  <FileText size={16} className="text-emerald-400" />
                                </div>
                                <div className="qtn-remarks-body">
                                  <div className="qtn-remarks-title">Contractor Site Remarks &amp; Observations</div>
                                  <p className="qtn-remarks-content">
                                    "{assDoc.notes || req.assessment?.notes || assDoc.site_notes || req.notes || 'Site Inspection completed. Access road clear for heavy haulers.'}"
                                  </p>
                                  {paymentTermsVal && (
                                    <div className="qtn-remarks-terms">
                                      <strong>Commercial Payment Terms: </strong>
                                      <span>{paymentTermsVal}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 5. COUNTER-OFFER SECTION (ACTIVE NEGOTIATION) */}
                            {isRevisionRequested && (
                              <div className="qtn-counter-section">

                                <div className="qtn-counter-header">
                                  <div className="qtn-counter-header-left">
                                    <div className="qtn-counter-icon-wrap">
                                      <RefreshCw size={16} />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="qtn-counter-title">
                                          Fair Deal Counter-Offer Active with {req.assigned_contractor_name || 'Contractor'}
                                        </span>
                                        <span className="qtn-counter-tag">Under Review</span>
                                      </div>
                                      <p className="qtn-counter-subtitle">
                                        Contractor has been notified with your counter-offer parameters to review and adjust the quotation.
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setRevisionModalReq({ reqId, req, assessment: assDoc })}
                                    className="qtn-counter-action-btn"
                                  >
                                    <RefreshCw size={13} />
                                    <span>Adjust Counter-Offer</span>
                                  </button>
                                </div>

                                {/* Counter-Offer Parameter Comparison Grid */}
                                <div className="qtn-counter-grid">
                                  <div className="qtn-counter-cell">
                                    <span className="qtn-counter-cell-label">Current Quote (Contractor)</span>
                                    <strong className="qtn-counter-cell-val text-slate-300">
                                      {formatINR(totalQuoteVal)}
                                    </strong>
                                    <span className="qtn-counter-cell-hint">Original submitted quote</span>
                                  </div>

                                  <div className="qtn-counter-cell qtn-counter-cell-target">
                                    <span className="qtn-counter-cell-label">Your Target Budget</span>
                                    <strong className="qtn-counter-cell-val text-amber-300">
                                      {formatINR(counterAmt || 93500)}
                                    </strong>
                                    <span className="qtn-counter-cell-hint text-amber-400/80">Proposed counter-offer</span>
                                  </div>

                                  <div className="qtn-counter-cell">
                                    <span className="qtn-counter-cell-label">Requested Start Date</span>
                                    <strong className="qtn-counter-cell-val text-white">
                                      {formatDateDMY(assDoc.counter_offer_start_date || req.counter_offer_start_date || assDoc.proposed_start_date)}
                                    </strong>
                                    <span className="qtn-counter-cell-hint">Alternative timeline</span>
                                  </div>

                                  <div className="qtn-counter-cell">
                                    <span className="qtn-counter-cell-label">Negotiated Variance</span>
                                    <strong className="qtn-counter-cell-val text-emerald-400">
                                      {diffAmt && diffAmt > 0 ? `-${formatINR(diffAmt)} (-${diffPct}%)` : 'Terms & Date Adjustment'}
                                    </strong>
                                    <span className="qtn-counter-cell-hint">Landowner savings</span>
                                  </div>
                                </div>

                                {/* Specified Adjustment Reason Pills */}
                                {Array.isArray(assDoc.revision_reasons || req.revision_reasons) && (assDoc.revision_reasons || req.revision_reasons).length > 0 && (
                                  <div className="qtn-counter-reasons-row">
                                    <span className="qtn-counter-reasons-label">Specified adjustments:</span>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {(assDoc.revision_reasons || req.revision_reasons).map((reason, idx) => (
                                        <span key={idx} className="qtn-counter-reason-pill">
                                          {reason}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Landowner Feedback / Note */}
                                {(assDoc.landowner_feedback || req.landowner_feedback) && (
                                  <div className="qtn-counter-feedback-box">
                                    <span className="qtn-counter-feedback-label">Your Specific Instructions:</span>
                                    <p className="qtn-counter-feedback-text">
                                      "{assDoc.landowner_feedback || req.landowner_feedback}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Bar (When proposal is under review and not yet accepted) */}
                            {!isAgreementReady && !isRevisionRequested && (
                              <div className="qtn-action-bar">
                                <div className="qtn-action-hint">
                                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                                  <span>
                                    {isRevision
                                      ? 'Review the contractor\'s revised quotation. You can accept to generate the binding agreement or request a re-revision.'
                                      : (isPurchase
                                        ? 'Accepting enters into a binding timber sale agreement with the contractor.'
                                        : isHybrid
                                          ? 'Accepting confirms the valuation and generates a binding digital contract.'
                                          : 'Accepting authorizes the quotation, generates the Digital Harvest Agreement, and readies work for execution.')}
                                  </span>
                                </div>

                                <div className="qtn-action-btns">
                                  <button
                                    type="button"
                                    onClick={() => handleAssessmentAction(reqId, 'REJECTED', 'Landowner declined this commercial proposal.')}
                                    className="qtn-btn-decline"
                                  >
                                    <XCircle size={15} />
                                    <span>Decline Proposal</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setRevisionModalReq({ reqId, req, assessment: assDoc })}
                                    className="qtn-btn-negotiate"
                                  >
                                    <RefreshCw size={14} />
                                    <span>{isRevision ? 'Re-revise / Further Negotiation' : 'Negotiate / Counter-Offer'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAssessmentAction(reqId, 'ACCEPTED')}
                                    className="qtn-btn-accept"
                                  >
                                    <CheckCircle2 size={16} />
                                    <span>
                                      {isRevision
                                        ? 'Accept Revised Quotation & Execute Agreement'
                                        : (isPurchase
                                          ? 'Accept Offer & Execute Contract'
                                          : isHybrid
                                            ? 'Accept Proposal & Execute Contract'
                                            : 'Accept Quote & Execute Agreement')}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* DIGITAL AGREEMENT & ADVANCE MOBILIZATION WORKFLOW */}
                            {isAgreementReady && (
                              <div className="space-y-4 pt-3">
                                {/* DIGITAL HARVEST AGREEMENT FINALIZED BANNER */}
                                <div className="cd-agreement-strip">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="cd-inspection-icon-box cd-inspection-icon-completed shrink-0">
                                      <FileCheck size={18} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-extrabold text-white">
                                          Digital Harvest Agreement Finalized &amp; Binding
                                        </h4>
                                        <span className="cd-payment-status-pill cd-payment-pill-verified font-mono">
                                          {req.digital_agreement?.agreement_id || `TC-AGR-${String(reqId).slice(-6).toUpperCase()}`}
                                        </span>
                                      </div>
                                      <p className="cd-inspection-desc">
                                        Agreement executed with <strong className="text-slate-200">{req.assigned_contractor_name || 'Assigned Contractor'}</strong>. Proposed operation start date: <strong className="text-emerald-300">{formatDateDMY(assDoc.proposed_start_date || req.proposed_start_date)}</strong>.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedAgreementModal({ req, assessment: assDoc })}
                                      className="cd-btn-inspect-primary shrink-0 cursor-pointer"
                                    >
                                      <FileCheck size={14} />
                                      <span>View Digital Agreement</span>
                                    </button>
                                  </div>
                                </div>

                                {/* ADVANCE PAYMENT MANAGEMENT CARD */}
                                <AdvancePaymentCard
                                  request={req}
                                  role="landowner"
                                  onRecordPayment={() => setSelectedRecordPaymentModal(req)}
                                />
                              </div>
                            )}
                          </div>

                        );
                      })()}

                      {/* SCHEDULED SITE INSPECTION VISIT (ACTIVE APPOINTMENT) */}
                      {isInspectionScheduled && !isAgreementReady && !isAccepted && (
                        <div id={`inspection-visit-${reqId}`} className="scheduled-inspection-card">
                          <div className="scheduled-inspection-header">
                            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                                <Calendar size={24} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h3 className="text-base sm:text-xl font-black text-white">
                                    Site Inspection Visit Scheduled
                                  </h3>
                                  {inspection.reschedule_requested ? (
                                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                      Reschedule Requested
                                    </span>
                                  ) : inspection.landowner_confirmed ? (
                                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                                      <CheckCircle2 size={13} className="text-emerald-400" />
                                      Visit Confirmed &amp; Accepted by You
                                    </span>
                                  ) : (inspection.reschedule_status === 'ACCEPTED' || (inspection.original_scheduled_date && inspection.original_scheduled_date !== inspection.scheduled_date)) ? (
                                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                      ✓ Rescheduled Visit Confirmed
                                    </span>
                                  ) : (
                                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 flex items-center gap-1.5">
                                      <Clock size={13} className="text-emerald-400 animate-pulse" />
                                      Date Preferred by Contractor
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                  The assigned contractor has booked an on-site field assessment to inspect parcel boundaries, tree condition, and haul road accessibility before quoting.
                                </p>
                              </div>
                            </div>

                            <div className="scheduled-date-highlight">
                              <span className="text-[11px] uppercase font-extrabold text-emerald-400 tracking-wider block">
                                {(inspection.reschedule_status === 'ACCEPTED' || (inspection.original_scheduled_date && inspection.original_scheduled_date !== inspection.scheduled_date)) ? 'Rescheduled Date' : 'Inspection Date'}
                              </span>
                              <span className="text-base sm:text-lg font-black text-white block mt-0.5">
                                {formatDateDMY(inspection.scheduled_date)}
                              </span>
                              <span className="text-xs text-emerald-300 font-semibold block mt-0.5">
                                {inspection.time_slot || 'Morning (09:00 AM - 12:00 PM)'}
                              </span>
                              {(inspection.reschedule_status === 'ACCEPTED' || (inspection.original_scheduled_date && inspection.original_scheduled_date !== inspection.scheduled_date)) && inspection.original_scheduled_date && (
                                <span className="text-[10px] text-slate-400 block mt-1 font-medium">
                                  Orig: <span className="line-through">{formatDateDMY(inspection.original_scheduled_date)}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* PENDING RESCHEDULE NOTICE BANNER */}
                          {inspection.reschedule_requested && (
                            <div className="scheduled-reschedule-alert">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                                  <CalendarClock size={19} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-amber-300 text-sm">
                                      Alternate Date Suggested: {formatDateDMY(inspection.suggested_date)}
                                    </span>
                                    <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                                      {inspection.suggested_time_slot || 'Morning Slot'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    <span className="text-slate-400">Current Confirmed Visit: <strong className="text-white">{formatDateDMY(inspection.scheduled_date)}</strong></span>
                                    {inspection.reschedule_reason && (
                                      <span className="block mt-0.5">Reason: <em className="text-amber-200 font-semibold">"{inspection.reschedule_reason}"</em></span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 mt-2 sm:mt-0">
                                <button
                                  type="button"
                                  onClick={() => setRescheduleModalReq(req)}
                                  className="scheduled-btn-modify-reschedule"
                                  title="Change your suggested date or note"
                                >
                                  Modify Suggestion
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleWithdrawReschedule(reqId)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                                  title="Cancel reschedule request and retain the originally confirmed appointment"
                                >
                                  Keep Original
                                </button>
                              </div>
                            </div>
                          )}

                          {/* PROMPT TO CONFIRM CONTRACTOR PREFERRED DATE BANNER */}
                          {!inspection.reschedule_requested && !inspection.landowner_confirmed && (
                            <div className="scheduled-btn-confirm-banner">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                                  <CalendarCheck size={20} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-white text-sm">
                                      Date Preferred by Contractor: <strong className="text-emerald-300">{formatDateDMY(inspection.scheduled_date)} ({inspection.time_slot || 'Morning Slot'})</strong>
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                                      Acceptance Needed
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                    The contractor has proposed this visit window. Click <strong>Confirm &amp; Accept Date</strong> to accept, or suggest an alternate date if unavailable.
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto mt-2 sm:mt-0">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmInspectionDate(reqId, inspection)}
                                  disabled={confirmingDateId === reqId}
                                  className="scheduled-btn-confirm"
                                  title="Accept and confirm this preferred inspection date"
                                >
                                  {confirmingDateId === reqId ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Check size={16} />
                                  )}
                                  <span>{confirmingDateId === reqId ? 'Confirming...' : 'Confirm & Accept Date'}</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* CONFIRMED NOTICE BANNER */}
                          {!inspection.reschedule_requested && inspection.landowner_confirmed && (
                            <div className="scheduled-confirmed-banner">
                              <div className="flex items-start sm:items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                                  <CheckCircle2 size={19} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-emerald-300 text-sm">
                                      ✓ Visit Date Confirmed &amp; Accepted by You
                                    </span>
                                    <span className="text-[10.5px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                      {formatDateDMY(inspection.scheduled_date)} • {inspection.time_slot || 'Morning Slot'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                                    You have confirmed and accepted this inspection date. The field assessor will arrive during this window.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Details Grid: Balanced 2-Panel Layout */}
                          <div className="scheduled-details-grid">
                            {/* Panel 1: Timing, Assessor & Site Details */}
                            <div className="scheduled-panel-card justify-between">
                              <div className="space-y-3.5">
                                <div>
                                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                    Appointment Window
                                  </span>
                                  <div className="flex items-center gap-2 text-white font-black text-sm">
                                    <Clock size={16} className="text-emerald-400 shrink-0" />
                                    <span>{formatDateDMY(inspection.scheduled_date)}</span>
                                  </div>
                                  <span className="text-emerald-300 text-xs block font-semibold mt-0.5">
                                    {inspection.time_slot || 'Morning Slot'}
                                  </span>
                                  {(inspection.reschedule_status === 'ACCEPTED' || (inspection.original_scheduled_date && inspection.original_scheduled_date !== inspection.scheduled_date)) && inspection.original_scheduled_date && (
                                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                      <span>Rescheduled from:</span>
                                      <span className="text-slate-300 line-through font-semibold">{formatDateDMY(inspection.original_scheduled_date)}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-emerald-500/15">
                                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                    Lead Field Assessor
                                  </span>
                                  <div className="flex items-center gap-2 text-white font-black text-sm">
                                    <UserCheck size={16} className="text-emerald-400 shrink-0" />
                                    <span>{inspection.inspector_name || req.assigned_contractor_name || 'Assigned Field Assessor'}</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                                    Verified Forestry Assessor • TreeConnect Contractor Crew
                                  </span>
                                  {(inspection.inspector_phone || req.assigned_contractor_phone) && (
                                    <a
                                      href={`tel:${inspection.inspector_phone || req.assigned_contractor_phone}`}
                                      className="text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1.5 text-xs font-bold hover:underline mt-1.5"
                                    >
                                      <Phone size={13} className="text-emerald-400" />
                                      +91 {inspection.inspector_phone || req.assigned_contractor_phone}
                                    </a>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-emerald-500/15">
                                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                    Inspection Site Parcel
                                  </span>
                                  <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold">
                                    <MapPin size={15} className="text-emerald-400 shrink-0" />
                                    <span className="truncate">{req.propertyName || 'Registered Timber Estate'}</span>
                                  </div>
                                  <span className="text-slate-400 text-xs block truncate mt-0.5">
                                    {req.district || req.location || req.address || 'Kerala'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Panel 2: Inspection Purpose & Scope Checklist */}
                            <div className="scheduled-panel-card">
                              <div>
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                                  Inspection Purpose &amp; Scope:
                                </span>
                                <div className="text-white text-xs sm:text-sm font-semibold mb-3 flex items-center gap-2">
                                  <Target size={15} className="text-emerald-400 shrink-0" />
                                  <span>{inspection.inspection_purpose || 'Pre-quotation tree and property assessment'}</span>
                                </div>
                              </div>

                              <div className="scheduled-checklist-grid">
                                {[
                                  'Verify property location',
                                  'Verify tree quantity',
                                  'Confirm tree species',
                                  'Assess tree condition',
                                  'Record tree measurements',
                                  'Check site accessibility',
                                  'Check surrounding obstacles',
                                  'Capture tree/property photographs'
                                ].map((chk, idx) => {
                                  const isActive = Array.isArray(inspection.checklist || inspection.inspection_checklist) && (inspection.checklist || inspection.inspection_checklist).length > 0
                                    ? (inspection.checklist || inspection.inspection_checklist).includes(chk)
                                    : true;
                                  return (
                                    <div
                                      key={idx}
                                      className={`scheduled-checklist-chip ${isActive ? 'active' : 'inactive'}`}
                                    >
                                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 font-bold ${
                                        isActive ? 'bg-emerald-500 text-slate-950' : 'border border-slate-600 text-transparent'
                                      }`}>
                                        {isActive ? '✓' : ''}
                                      </span>
                                      <span className="truncate">{chk}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Landowner Instructions / Note */}
                          {inspection.notes && (
                            <div className="scheduled-note-box text-xs sm:text-sm text-slate-100">
                              <FileText size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <strong className="text-emerald-300 block font-black mb-1 text-xs uppercase tracking-wider">
                                  Contractor Access Note &amp; Instructions:
                                </strong>
                                <p className="leading-relaxed font-medium italic text-slate-200">
                                  "{inspection.notes}"
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Preparation Tip for Landowner */}
                          <div className="scheduled-tip-box text-xs sm:text-sm">
                            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1 leading-relaxed text-slate-300">
                              <strong className="text-white font-bold mr-1.5">Preparation Tip:</strong>
                              <span>Please ensure estate entrance gate is accessible and boundaries are marked for the survey crew. No tree cutting occurs during this visit.</span>
                            </div>
                          </div>

                          {/* Action Bar */}
                          <div className="scheduled-action-bar text-xs sm:text-sm">
                            <div className="scheduled-action-group-left">
                              {/* Confirm and Accept Date preferred by contractor */}
                              {!inspection.reschedule_requested && !inspection.landowner_confirmed ? (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmInspectionDate(reqId, inspection)}
                                  disabled={confirmingDateId === reqId}
                                  className="scheduled-btn-confirm"
                                  title="Confirm and accept this preferred date for contractor's site visit"
                                >
                                  {confirmingDateId === reqId ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Check size={15} />
                                  )}
                                  <span>{confirmingDateId === reqId ? 'Confirming...' : 'Confirm & Accept Date'}</span>
                                </button>
                              ) : !inspection.reschedule_requested && inspection.landowner_confirmed ? (
                                <div className="scheduled-confirmed-badge" title="You have confirmed this appointment date">
                                  <CheckCircle2 size={15} className="text-emerald-400" />
                                  <span>Date Accepted by You</span>
                                </div>
                              ) : null}
                            </div>

                            <div className="scheduled-action-group-right">
                              <button
                                type="button"
                                onClick={() => setRescheduleModalReq(req)}
                                className="scheduled-btn-reschedule"
                                title="Not available on this date? Suggest a convenient date for the contractor to visit"
                              >
                                <CalendarClock size={15} />
                                <span>{inspection.reschedule_requested ? 'Modify Suggested Date' : 'Suggest Alternate Date / Reschedule'}</span>
                              </button>
                              {(inspection.inspector_phone || req.assigned_contractor_phone) && (
                                <a
                                  href={`tel:${inspection.inspector_phone || req.assigned_contractor_phone}`}
                                  className="scheduled-btn-call"
                                >
                                  <Phone size={14} />
                                  <span>Call Inspector</span>
                                </a>
                              )}
                              <a
                                href={getGoogleMapsUrl(req)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="scheduled-btn-directions"
                              >
                                <Navigation size={14} className="text-emerald-400" />
                                <span>Parcel Directions</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CERTIFIED ON-SITE FIELD AUDIT REPORT (WHEN COMPLETED) */}
                      {isInspectionCompleted && !isAgreementReady && !isAccepted && (
                        <div className="completed-inspection-card">
                          {/* 1. Official Certificate Header */}
                          <div className="cert-header">
                            <div className="cert-header-left">
                              <div className="cert-badge-icon">
                                <FileCheck size={26} />
                              </div>
                              <div className="cert-header-content">
                                <div className="cert-title-row">
                                  <h3 className="cert-main-title">
                                    Site Inspected &amp; Verified — Field Assessment Certificate
                                  </h3>
                                  <span className="cert-status-badge">
                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                    <span>
                                      {inspection.inspection_verdict === 'FEASIBLE' ? 'FEASIBLE FOR HARVESTING' : inspection.inspection_verdict || 'FEASIBLE FOR HARVESTING'}
                                    </span>
                                  </span>
                                </div>
                                <p className="cert-header-desc">
                                  Field audit certified by contractor assessor. Parcel boundaries, standing timber volume, and haul truck accessibility verified.
                                </p>
                              </div>
                            </div>

                            <div className="cert-header-right">
                              <button
                                type="button"
                                onClick={() => window.print()}
                                className="cert-print-btn"
                              >
                                <Printer size={14} />
                                <span>Print Certificate</span>
                              </button>
                              <div className="cert-date-block">
                                <span className="cert-date-label">Certified Date</span>
                                <span className="cert-date-value">
                                  {formatDateDMY(inspection.inspected_at || inspection.completed_at || inspection.scheduled_date)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 2. Inspection Purpose */}
                          <div className="cert-purpose-section">
                            <span className="cert-purpose-label">
                              <Target size={14} className="text-emerald-400" />
                              <span>Inspection Purpose</span>
                            </span>
                            <div className="cert-purpose-value">
                              {inspection.inspection_purpose || 'Tree and property assessment'}
                            </div>
                          </div>

                          {/* 3. Verified Scope Checklist */}
                          <div className="cert-checklist-section">
                            <span className="cert-section-heading">
                              Verified Scope Checklist (Certified Ground Truth)
                            </span>
                            <div className="cert-checklist-grid">
                              {[
                                'Verify property location',
                                'Verify tree quantity',
                                'Confirm tree species',
                                'Assess tree condition',
                                'Record tree measurements',
                                'Check site accessibility',
                                'Check surrounding obstacles',
                                'Capture tree/property photographs'
                              ].map((chk, idx) => (
                                <div key={idx} className="cert-checklist-row">
                                  <span className="cert-checklist-badge">✓</span>
                                  <span>{chk}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 4. Certified Technical Audit Findings */}
                          <div className="cert-findings-section">
                            <span className="cert-section-heading">
                              Certified Technical Audit Findings
                            </span>
                            <div className="cert-findings-grid">
                              {/* 1. Lead Assessor */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Lead Assessor</span>
                                  <span className="cert-finding-value">
                                    {inspection.inspector_name || req.assigned_contractor_name || 'Rohith kumar'}
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <UserCheck size={16} />
                                </div>
                              </div>

                              {/* 2. Assessor Phone */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Assessor Phone</span>
                                  <a
                                    href={`tel:${inspection.inspector_phone || req.assigned_contractor_phone || '9746512243'}`}
                                    className="cert-finding-value text-emerald-300 hover:underline"
                                  >
                                    +91 {inspection.inspector_phone || req.assigned_contractor_phone || '9746512243'}
                                  </a>
                                </div>
                                <div className="cert-finding-icon">
                                  <Phone size={15} />
                                </div>
                              </div>

                              {/* 3. Verified Standing Trees */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Verified Standing Trees</span>
                                  <span className="cert-finding-value cert-finding-value-highlight">
                                    {inspection.verified_tree_count || stands.reduce((sum, s) => sum + Number(s.numberOfTrees ?? 1), 0)} Trees Audited
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <Trees size={16} />
                                </div>
                              </div>

                              {/* 4. Measured Avg. DBH */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">
                                    {inspection.canopy_height && inspection.canopy_height !== '18 - 24 m' && inspection.canopy_height !== '20m'
                                      ? 'Avg. DBH / Canopy Height'
                                      : 'Measured Avg. DBH'}
                                  </span>
                                  <span className="cert-finding-value">
                                    {inspection.measured_avg_dbh || '70 - 80 cm'}
                                    {inspection.canopy_height && inspection.canopy_height !== '18 - 24 m' && inspection.canopy_height !== '20m'
                                      ? ` • ${inspection.canopy_height}`
                                      : ''}
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <Ruler size={16} />
                                </div>
                              </div>

                              {/* 5. Timber Soundness */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Timber Soundness</span>
                                  <span className="cert-finding-value cert-finding-value-highlight">
                                    {inspection.timber_condition || 'Sound & Top Quality'}
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <ShieldCheck size={16} />
                                </div>
                              </div>

                              {/* 6. Haul Road Approach */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Haul Road Approach</span>
                                  <span className="cert-finding-value">
                                    {inspection.road_access_verification || 'Heavy truck accessible'}
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <Truck size={16} />
                                </div>
                              </div>

                              {/* 7. Distance to Paved Road */}
                              <div className="cert-finding-card">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Distance to Paved Road</span>
                                  <span className="cert-finding-value">
                                    {inspection.distance_to_haul_road || '25 meters'}
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <Navigation size={15} />
                                </div>
                              </div>

                              {/* 8. Terrain & Overhead Hazards (spans 2 columns on 3-column desktop) */}
                              <div className="cert-finding-card cert-finding-card-span-2">
                                <div className="cert-finding-info">
                                  <span className="cert-finding-label">Terrain / Overhead Hazards</span>
                                  <span className="cert-finding-value">
                                    {inspection.terrain_assessment || 'Gentle slope'} • {inspection.overhead_hazards || 'Clear of power lines'}
                                  </span>
                                </div>
                                <div className="cert-finding-icon">
                                  <AlertTriangle size={16} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 5. Landowner Access Instructions & Assessor Audit Remarks */}
                          {(inspection.notes || inspection.inspection_remarks) && (
                            <div className="cert-notes-grid">
                              {inspection.notes && (
                                <div className="cert-note-card cert-note-card-instructions">
                                  <div className="cert-note-icon">
                                    <FileText size={15} />
                                  </div>
                                  <div className="cert-note-content">
                                    <span className="cert-note-title cert-note-title-instructions">
                                      Landowner Access Instructions
                                    </span>
                                    <p className="cert-note-text">
                                      {inspection.notes}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {inspection.inspection_remarks && (
                                <div className="cert-note-card cert-note-card-remarks">
                                  <div className="cert-note-icon">
                                    <ClipboardCheck size={15} />
                                  </div>
                                  <div className="cert-note-content">
                                    <span className="cert-note-title cert-note-title-remarks">
                                      Assessor Audit Remarks
                                    </span>
                                    <p className="cert-note-text cert-note-text-remarks">
                                      {inspection.inspection_remarks}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 6. Attached Field Inspection Photos */}
                          {Array.isArray(inspection.inspection_photos) && inspection.inspection_photos.length > 0 && (
                            <div className="cert-photos-section">
                              <span className="cert-section-heading">
                                Attached Field Inspection Photos ({inspection.inspection_photos.length})
                              </span>
                              <div className="cert-photos-grid">
                                {inspection.inspection_photos.map((ph, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => openPhotoLightbox(inspection.inspection_photos, idx, `Field Inspection Photo #${idx + 1}`)}
                                    className="cert-photo-item group"
                                    title="Click to view full photo"
                                  >
                                    <img
                                      src={ph}
                                      alt={`Inspection ${idx + 1}`}
                                      className="cert-photo-img"
                                    />
                                    <div className="cert-photo-overlay">
                                      <ZoomIn size={18} className="text-emerald-300" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 7. Landowner Notice Banner */}
                          <div className="cert-notice-box">
                            <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-white">Notice for Landowner:</strong> This parcel has been officially site-inspected and audited. Tree count, species soundness, and machinery extraction feasibility have been verified on-site by the licensed contractor.
                            </span>
                          </div>

                          {/* Next Step / Pending Assessment Notice for Landowner */}
                          {!isAssessmentSubmitted && !isAccepted && !isRevisionRequested && !activeAssessmentMap[reqId] && !req.assessment && (
                            <div className="p-4 rounded-xl bg-[#030e06] border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
                                  <Clock size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong className="text-white font-bold text-sm">Next Step: Formal Contractor Assessment &amp; Quotation</strong>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      Pending Contractor Submission
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                                    Lead Assessor <strong>{inspection.inspector_name || req.assigned_contractor_name || 'Rohith kumar'}</strong> has certified this inspection. The contractor is now completing the Formal Assessment Form with itemized costs (felling, extraction, haulage) and timber volume valuation. As soon as the contractor submits their proposal, the full quotation breakdown and contract authorization controls will appear right here.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

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

                        </>
                      )}
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

            {/* MODAL FOR REVISION REQUEST & FAIR DEAL COUNTER-OFFER */}
            {revisionModalReq && (
              <RevisionRequestModal
                request={revisionModalReq.req}
                assessment={revisionModalReq.assessment}
                contractorName={revisionModalReq.req?.assigned_contractor_name || 'Assigned Contractor'}
                onClose={() => setRevisionModalReq(null)}
                onSubmit={async (reasons, notes, counterAmount, counterDate) => {
                  await handleAssessmentAction(
                    revisionModalReq.reqId,
                    'REVISION_REQUESTED',
                    notes,
                    reasons,
                    counterAmount,
                    counterDate
                  );
                  setRevisionModalReq(null);
                }}
              />
            )}

            {/* MODAL FOR DIGITAL HARVEST AGREEMENT */}
            {selectedAgreementModal && (
              <DigitalAgreementModal
                request={selectedAgreementModal.req}
                assessment={selectedAgreementModal.assessment}
                onClose={() => setSelectedAgreementModal(null)}
              />
            )}

            {/* MODAL FOR SUGGESTING ALTERNATE SITE INSPECTION DATE */}
            {rescheduleModalReq && (
              <RescheduleInspectionModal
                request={rescheduleModalReq}
                onClose={() => setRescheduleModalReq(null)}
                onSubmit={(data) => handleRescheduleInspection(rescheduleModalReq.id || rescheduleModalReq._id, data)}
                onWithdraw={() => handleWithdrawReschedule(rescheduleModalReq.id || rescheduleModalReq._id)}
              />
            )}

            {/* MODAL FOR RECORDING ADVANCE PAYMENT */}
            {selectedRecordPaymentModal && (
              <RecordAdvancePaymentModal
                request={selectedRecordPaymentModal}
                onClose={() => setSelectedRecordPaymentModal(null)}
                onSubmit={(data) => handleRecordAdvancePayment(selectedRecordPaymentModal.id || selectedRecordPaymentModal._id, data)}
                onPaymentSuccess={() => {
                  refreshHarvestRequests();
                  setActionMessage('Advance payment verified successfully via Razorpay! Operations are authorized to begin.');
                  setTimeout(() => {
                    setActionMessage('');
                    navigate('/landowner/payments');
                  }, 2500);
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

