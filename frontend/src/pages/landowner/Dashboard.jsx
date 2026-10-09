import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLandowner } from '../../context/LandownerContext';
import './LandownerDashboard.css';
import {
  Trees,
  Scale,
  Plus,
  Calculator,
  MapPin,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  CloudSun,
  CheckCircle2,
  DollarSign,
  Wind,
  Droplets,
  ChevronRight,
  Sprout,
  Leaf,
  TrendingUp,
  Calendar,
  CalendarClock,
  CalendarCheck,
  Loader2,
  Clock,
  UserCheck,
  Phone,
  FileText,
  Sliders,
  Navigation,
  ChevronDown,
  Target,
  Activity,
  ClipboardCheck,
  ExternalLink,
  FileCheck,
  Ruler,
  Truck,
  AlertTriangle,
  Printer,
  Coins,
  Handshake,
  RefreshCw,
  Layers,
  Users
} from 'lucide-react';
import RevisionRequestModal from '../../components/workflow/RevisionRequestModal';
import DigitalAgreementModal from '../../components/workflow/DigitalAgreementModal';
import AdvancePaymentCard from '../../components/workflow/AdvancePaymentCard';
import RecordAdvancePaymentModal from '../../components/workflow/RecordAdvancePaymentModal';
import harvestService from '../../services/harvestService';


import {
  formatINR,
  formatVolume,
  parseVolumeNumber
} from '../../utils/timberCalculations';

const getGoogleMapsUrl = (p) => {
  if (!p) return 'https://maps.google.com';
  if (p.latitude && p.longitude) return `https://www.google.com/maps?q=${p.latitude},${p.longitude}`;
  if (p.propertyLocation) return `https://www.google.com/maps?q=${encodeURIComponent(p.propertyLocation)}`;
  if (p.location) return `https://www.google.com/maps?q=${encodeURIComponent(p.location)}`;
  return 'https://maps.google.com';
};

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

const LandownerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Safely extract landowner context state with array fallbacks
  const landownerCtx = useLandowner() || {};
  const properties = landownerCtx.properties || [];
  const inventories = landownerCtx.inventories || [];
  const harvestRequests = landownerCtx.harvestRequests || [];
  const timberListings = landownerCtx.timberListings || [];
  const completedHarvests = landownerCtx.completedHarvests || [];
  const refreshProperties = landownerCtx.refreshProperties;
  const refreshHarvestRequests = landownerCtx.refreshHarvestRequests;

  useEffect(() => {
    if (refreshProperties) {
      refreshProperties();
    }
    if (refreshHarvestRequests) {
      refreshHarvestRequests();
    }
  }, []);

  // Modal state for viewing scheduled site visit details
  const [selectedVisitModal, setSelectedVisitModal] = useState(null);

  // Assessments Map and Workflow Modals for Landowner Quotation Verification
  const [activeAssessmentMap, setActiveAssessmentMap] = useState({});
  const [revisionModalReq, setRevisionModalReq] = useState(null);
  const [selectedAgreementModal, setSelectedAgreementModal] = useState(null);
  const [selectedRecordPaymentModal, setSelectedRecordPaymentModal] = useState(null);
  const [assessmentActionMsg, setAssessmentActionMsg] = useState({ type: '', text: '' });


  // Eagerly hydrate contractor assessments from localStorage & backend API
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            parsed.forEach(r => {
              const rId = r?.id || r?._id;
              if (rId && r.assessment) {
                setActiveAssessmentMap(prev => ({ ...prev, [rId]: r.assessment }));
              }
            });
          }
        }
      } catch (e) {}

      for (const req of (harvestRequests || [])) {
        const reqId = req.id || req._id;
        if (!reqId) continue;
        if (req.assessment) {
          setActiveAssessmentMap(prev => ({ ...prev, [reqId]: req.assessment }));
        }
        if (req.assigned_contractor_id || req.assessment || req.status === 'ASSESSMENT_SUBMITTED' || req.status === 'OPERATION_READY' || req.total_quote) {
          try {
            const data = await harvestService.getAssessment(reqId);
            if (data && (data.assessment || data.id || data.commercial_proposal_type)) {
              const assObj = data.assessment || data;
              setActiveAssessmentMap(prev => ({ ...prev, [reqId]: assObj }));
            }
          } catch (e) {
            // Silently fall back to request assessment
          }
        }
      }
    };

    fetchAssessments();
  }, [harvestRequests]);

  // Handle Landowner Action on Assessment (Accept, Reject, Request Revision)
  const handleAssessmentAction = async (requestId, action, feedbackStr = '', revisionReasons = [], counterOfferAmount = null, counterOfferStartDate = null) => {
    try {
      await harvestService.actionAssessment(requestId, {
        status: action,
        feedback: feedbackStr,
        revision_reasons: revisionReasons,
        counter_offer_amount: counterOfferAmount,
        counter_offer_start_date: counterOfferStartDate
      });

      // Synchronize in local storage treeconnect_harvest_requests
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
                  landowner_name: r.userName || r.landowner_name || r.ownerName || userName || 'Registered Landowner',
                  contractor_name: r.assigned_contractor_name || 'Rohith kumar'
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
                updatedAt: new Date().toISOString()
              };
            }
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        }
      } catch (e) {
        console.warn('Could not update localStorage treeconnect_harvest_requests:', e);
      }

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

      setAssessmentActionMsg({
        type: 'success',
        text: action === 'ACCEPTED'
          ? 'Quotation verified and accepted! Digital Harvest Agreement generated and finalized.'
          : action === 'REVISION_REQUESTED'
            ? 'Revision counter-offer submitted to contractor for adjustment.'
            : 'Contractor quotation declined.'
      });

      if (refreshHarvestRequests) {
        refreshHarvestRequests();
      }

      setTimeout(() => {
        setAssessmentActionMsg({ type: '', text: '' });
      }, 5000);
    } catch (err) {
      console.error('Failed to action assessment:', err);
      setAssessmentActionMsg({
        type: 'error',
        text: err?.message || 'Failed to submit action on assessment. Please try again.'
      });
    }
  };

  // Handle Landowner Recording Advance Mobilization Payment
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
      } catch (e) {
        console.warn('Could not sync payment record to localStorage:', e);
      }

      await harvestService.submitAdvancePayment(requestId, paymentData);
      setAssessmentActionMsg({
        type: 'success',
        text: 'Advance mobilization payment recorded successfully! Status: Verification Pending by contractor.'
      });
      if (refreshHarvestRequests) {
        refreshHarvestRequests();
      }
      setTimeout(() => setAssessmentActionMsg({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Failed to record advance payment:', err);
      setAssessmentActionMsg({
        type: 'error',
        text: 'Failed to record payment: ' + (err.message || 'Error')
      });
      setTimeout(() => setAssessmentActionMsg({ type: '', text: '' }), 5000);
    }
  };


  // Landowner Confirms / Accepts Date Preferred by Contractor
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
      setAssessmentActionMsg({
        type: 'success',
        text: `Site inspection visit on ${dateStr} successfully confirmed and accepted! Contractor notified.`
      });
      setTimeout(() => setAssessmentActionMsg({ type: '', text: '' }), 5000);

      if (refreshHarvestRequests) {
        refreshHarvestRequests();
      }
    } catch (err) {
      console.error("Error confirming inspection date:", err);
      setAssessmentActionMsg({
        type: 'error',
        text: "Failed to confirm inspection date: " + (err?.message || 'Error')
      });
      setTimeout(() => setAssessmentActionMsg({ type: '', text: '' }), 4000);
    } finally {
      setConfirmingDateId(null);
    }
  };

  // Stateful Demo Contractor Bids
  const [bids, setBids] = useState([
    {
      id: 'bid-101',
      contractor: 'Apex Timber Harvesting Ltd.',
      plot: 'Green Valley Teak Plantation',
      bidAmount: '$48,500',
      ratePerM3: '$120/m³',
      status: 'Pending Review',
      submittedAt: 'Today, 09:30 AM'
    },
    {
      id: 'bid-102',
      contractor: 'Highland Forestry Services',
      plot: 'Pine Forest Parcel B',
      bidAmount: '$32,400',
      ratePerM3: '$112/m³',
      status: 'Accepted',
      submittedAt: 'Yesterday'
    },
    {
      id: 'bid-103',
      contractor: 'Cascade Loggers Co.',
      plot: 'Cedar Estate Block 4',
      bidAmount: '$27,800',
      ratePerM3: '$110/m³',
      status: 'Pending Review',
      submittedAt: '2 days ago'
    }
  ]);

  // Calculate dynamic metrics strictly from user properties and inventories
  const totalManagedArea = (properties || []).reduce((acc, p) => acc + (parseFloat(p.totalArea) || 0), 0);
  const totalTimberVolume = (inventories || []).reduce((acc, inv) => {
    const invVol = ((inv && inv.speciesList) || []).reduce((sAcc, sp) => {
      const vol = parseFloat(sp.estimatedVolume) || (parseFloat(sp.numberOfTrees || sp.count || 0) * 0.7);
      return sAcc + vol;
    }, 0);
    return acc + invVol;
  }, 0);

  const estRevenue = Math.round(totalTimberVolume * 115);

  // Latest Active Operation or Request (strictly user records with safe fallback)
  const activeSpotlight = (harvestRequests && harvestRequests.length > 0)
    ? harvestRequests[0]
    : ((completedHarvests && completedHarvests.length > 0) 
        ? completedHarvests[0] 
        : {
            status: 'Operational Ready',
            propertyName: properties[0]?.propertyName || 'Green Valley Plantation Estate',
            location: properties[0]?.district || properties[0]?.address || 'Kottayam Sector 4',
            harvestScopeDetail: 'Teak & Hardwood Selection',
            preferredStartDate: 'Oct 01, 2026',
            contractor: 'Apex Timber Harvesting Ltd',
            estimatedVolume: '240 m³'
          });

  // Scheduled Site Inspection Visits (Active / Upcoming)
  const scheduledVisits = (harvestRequests || []).filter(
    r => (r.inspection_status === 'SCHEDULED' || r.site_inspection?.status === 'SCHEDULED' || r.inspection_status === 'CONFIRMED' || r.site_inspection?.status === 'CONFIRMED' || r.inspection_status === 'IN_PROGRESS' || r.site_inspection?.status === 'IN_PROGRESS' || Boolean(r.site_inspection?.scheduled_date)) &&
    r.inspection_status !== 'COMPLETED' && r.inspection_status !== 'REPORT_SUBMITTED' && r.site_inspection?.status !== 'COMPLETED' && r.site_inspection?.status !== 'REPORT_SUBMITTED' && !r.site_inspected
  );

  // Certified / Completed Site Inspections
  const verifiedInspections = (harvestRequests || []).filter(
    r => r.site_inspected || r.inspection_status === 'COMPLETED' || r.inspection_status === 'REPORT_SUBMITTED' || r.site_inspection?.status === 'COMPLETED' || r.site_inspection?.status === 'REPORT_SUBMITTED'
  );

  // Quick Calculator state
  const [treesCount, setTreesCount] = useState(250);
  const [avgDbh, setAvgDbh] = useState(18); // Diameter at Breast Height in inches

  // Volume estimation formula
  const calculatedVolume = Math.round(treesCount * Math.pow(avgDbh * 2.54 / 200, 2) * 3.14159 * 18 * 0.5 * 10) / 10;
  const estimatedValue = Math.round(calculatedVolume * 115);

  const handleBidStatus = (id, newStatus) => {
    setBids(bids.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const userName = user?.name || 'Harigovind D Nair';

  // 4 QUICK ACTIONS DEFINITION
  const quickActions = [
    {
      id: 'register-property',
      emoji: '🌳',
      title: 'Register Property',
      description: 'Add a forest estate or plantation parcel.',
      path: '/landowner/register-property'
    },
    {
      id: 'add-inventory',
      emoji: '🌲',
      title: 'Add Tree Inventory',
      description: 'Record standing trees and timber species.',
      path: '/landowner/add-inventory'
    },
    {
      id: 'request-harvest',
      emoji: '🪓',
      title: 'Request Harvesting',
      description: 'Submit plots to logging contractors for bids.',
      path: '/landowner/request-harvest'
    },
    {
      id: 'assigned-jobs',
      emoji: '👷',
      title: 'Assigned Jobs',
      description: 'Track assigned contractors, quotes, and harvest operations.',
      path: '/landowner/harvest-requests',
      linkText: 'Track'
    }
  ];

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        {/* Main Workspace Centered Layout */}
        <div className="landowner-dashboard-workspace">

          {/* 1. HERO COMMERCIAL FORESTRY PORTFOLIO CARD */}
          <section className="ld-card ld-hero-card">
            <div className="ld-hero-tag">
              <ShieldCheck size={14} /> COMMERCIAL FORESTRY PORTFOLIO
            </div>
            
            <h1 className="ld-hero-heading">Good Morning, {userName}</h1>
            
            <p className="ld-hero-subtext">
              Manage your timber estates, track standing volume estimates, accept contractor bidding requests, and monitor market revenue.
            </p>

            {/* Summary Pills Row */}
            <div className="ld-pills-row">
              <div className="ld-pill">
                <span className="ld-dot ld-dot-green"></span>
                <span><strong>{properties.length}</strong> Estates Registered</span>
              </div>
              <div className="ld-pill">
                <span className="ld-dot ld-dot-amber"></span>
                <span><strong>{harvestRequests.length}</strong> Harvest Requests Active</span>
              </div>
              <div className="ld-pill">
                <span className="ld-dot ld-dot-blue"></span>
                <span><strong>${estRevenue || 0}</strong> Est. Revenue Valuation</span>
              </div>
              <div className="ld-pill">
                <span className="ld-dot ld-dot-teal"></span>
                <span><strong>{bids.length}</strong> Offers Received</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="ld-hero-buttons">
              <button onClick={() => navigate('/landowner/register-property')} className="ld-btn-green">
                <Plus size={18} /> Register New Estate
              </button>
              <button onClick={() => navigate('/landowner/add-inventory')} className="ld-btn-outline">
                <Sprout size={18} /> Log Tree Standing
              </button>
            </div>
          </section>

          {/* CERTIFIED SITE INSPECTION & AUDIT REPORT BANNER (WHEN FIELD VERIFIED) */}
          {verifiedInspections.length > 0 && (() => {
            const certVisit = verifiedInspections[0];
            const ins = certVisit.site_inspection || {};
            const certId = certVisit.id || certVisit._id;
            const certInspector = ins.inspector_name || certVisit.assigned_contractor_name || 'Licensed Forestry Assessor';
            const certDate = ins.inspected_at || ins.completed_at || ins.scheduled_date;

            return (
              <section className="completed-inspection-card space-y-4">
                <div className="completed-inspection-header flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-black/30">
                      <FileCheck size={26} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
                          Site Inspected &amp; Verified — Field Assessment Certificate
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {ins.inspection_verdict === 'FEASIBLE' ? '✓ FEASIBLE FOR HARVESTING' : ins.inspection_verdict || '✓ FEASIBLE FOR HARVESTING'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        Field Assessor <strong className="text-emerald-400 font-bold">{certInspector}</strong> has verified parcel boundaries, standing timber condition, and haul road clearance for <strong className="text-white">{certVisit.propertyName || 'Registered Timber Estate'}</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Certified Date</span>
                      <span className="text-xs font-bold text-emerald-300 block">{formatDateDMY(certDate)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedVisitModal(certVisit)}
                      className="scheduled-btn-manage"
                    >
                      <FileCheck size={14} />
                      <span>View Full Certificate</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {ins.inspection_remarks && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/25 text-xs text-slate-200">
                    <strong className="text-emerald-300 block mb-0.5 font-bold uppercase tracking-wider text-[11px]">
                      Assessor Official Remarks:
                    </strong>
                    <p className="italic text-emerald-100">"{ins.inspection_remarks}"</p>
                  </div>
                )}
              </section>
            );
          })()}

          {/* ACTION FEEDBACK ALERT BANNER */}
          {assessmentActionMsg.text && (
            <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-xl transition-all ${
              assessmentActionMsg.type === 'success'
                ? 'bg-emerald-950/90 border border-emerald-500 text-emerald-200'
                : 'bg-red-950/90 border border-red-500 text-red-200'
            }`}>
              {assessmentActionMsg.type === 'success' ? (
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle size={20} className="text-red-400 shrink-0" />
              )}
              <span>{assessmentActionMsg.text}</span>
            </div>
          )}

          {/* FORMAL CONTRACTOR ASSESS QUOTATION — LANDOWNER VERIFICATION SECTION */}
          {(() => {
            const assessQuotationsToVerify = (harvestRequests || []).filter(r => {
              const rId = r.id || r._id;
              const ass = activeAssessmentMap[rId] || r.assessment || {};
              return r.status === 'ASSESSMENT_SUBMITTED' ||
                     r.status === 'REVISION_REQUESTED' ||
                     r.status === 'OPERATION_READY' ||
                     Boolean(ass.total_quote) ||
                     Boolean(ass.contractor_purchase_offer) ||
                     Boolean(ass.timber_purchase_price) ||
                     Boolean(r.total_quote) ||
                     Boolean(r.contractor_purchase_offer);
            });

            const targetQuotations = assessQuotationsToVerify.length > 0
              ? assessQuotationsToVerify
              : (verifiedInspections.length > 0 ? [verifiedInspections[0]] : []);

            if (targetQuotations.length === 0) return null;

            return targetQuotations.map((req, qIdx) => {
              const reqId = req.id || req._id;
              const assDoc = activeAssessmentMap[reqId] || req.assessment || {};
              const propType = assDoc.commercial_proposal_type || req.commercial_proposal_type || 'Harvesting Service Quotation';
              const isService = propType === 'Harvesting Service Quotation';
              const isPurchase = propType === 'Timber Purchase Offer';
              const isHybrid = propType === 'Purchase + Harvesting';

              const assessedVolume = assDoc.estimated_harvestable_volume || req.estimated_harvestable_volume || req.site_inspection?.estimated_volume || 1.80;
              const totalQuoteVal = assDoc.total_quote ?? req.total_quote ?? 110000;
              const fellingCost = assDoc.harvesting_cost ?? assDoc.felling_cost ?? req.harvesting_cost ?? req.felling_cost ?? 45000;
              const extractionCost = assDoc.extraction_cost ?? req.extraction_cost ?? 30000;
              const transportCost = assDoc.transportation_cost ?? req.transportation_cost ?? 25000;
              const otherCost = assDoc.other_cost ?? req.other_cost ?? 10000;
              const workersCount = assDoc.assigned_workers_count ?? assDoc.workers_assigned ?? req.assigned_workers_count ?? req.workers_assigned ?? 10;
              const jobDuration = assDoc.estimated_duration || req.estimated_duration || '1 Working Day';
              const proposedStartDate = assDoc.proposed_start_date || req.proposed_start_date || '2026-10-14';

              const contractorName = req.assigned_contractor_name || 'Rohith kumar';
              const contractorPhone = req.assigned_contractor_phone || '9746512243';
              
              const isUnderReview = (req.status === 'ASSESSMENT_SUBMITTED' || assDoc.status === 'SUBMITTED') && req.status !== 'OPERATION_READY' && req.status !== 'IN_PROGRESS' && req.status !== 'COMPLETED';
              const isRevisionActive = req.status === 'REVISION_REQUESTED' || assDoc.status === 'REVISION_REQUESTED';
              const isAccepted = !isUnderReview && !isRevisionActive && Boolean(
                req.status === 'OPERATION_READY' ||
                req.status === 'IN_PROGRESS' ||
                req.status === 'COMPLETED' ||
                (req.status === 'ACCEPTED' && req.digital_agreement) ||
                (assDoc.status === 'ACCEPTED' && req.digital_agreement)
              );

              const previousQuoteVal = assDoc.previous_quote ?? req.previous_quote ?? assDoc.original_quote ?? req.original_quote;
              const isRevisionQuote = Boolean(
                assDoc.is_revision ||
                req.is_revision ||
                (previousQuoteVal && previousQuoteVal !== totalQuoteVal) ||
                (assDoc.reduction && assDoc.reduction > 0) ||
                (req.reduction && req.reduction > 0)
              );
              const reductionAmt = assDoc.reduction ?? req.reduction ?? (previousQuoteVal && totalQuoteVal < previousQuoteVal ? previousQuoteVal - totalQuoteVal : 0);
              const reductionPct = (previousQuoteVal && reductionAmt > 0) ? Math.round((reductionAmt / previousQuoteVal) * 100) : 0;

              return (
                <section key={reqId || qIdx} id="quotation-verification-section" className="quotation-verification-card">
                  {/* Header with Title & Action Badges */}
                  <div className="qvc-header">
                    <div className="qvc-header-main">
                      <div className="qvc-icon-wrap">
                        <Calculator size={24} />
                      </div>
                      <div className="qvc-title-block">
                        <div className="qvc-badge-row">
                          <span className="qvc-category-pill">
                            Commercial Quotation Verification
                          </span>
                          <span className={`qvc-status-badge ${
                            isAccepted ? 'accepted' : isRevisionActive ? 'revision' : isRevisionQuote ? 'revision' : 'action'
                          }`}>
                            {isAccepted ? (
                              <>
                                <CheckCircle2 size={13} className="text-emerald-400" />
                                <span>✓ Agreement Executed &amp; Finalized</span>
                              </>
                            ) : isRevisionActive ? (
                              <>
                                <RefreshCw size={13} className="text-amber-400" />
                                <span>Counter-Offer Revision Active</span>
                              </>
                            ) : isRevisionQuote ? (
                              <>
                                <RefreshCw size={13} className="text-amber-400" />
                                <span>Revised Quotation Received</span>
                              </>
                            ) : (
                              <>
                                <span className="qvc-status-dot"></span>
                                <span>Action Required: Verify Quotation</span>
                              </>
                            )}
                          </span>
                        </div>

                        <h2 className="qvc-title">
                          Formal Contractor Assessment &amp; Commercial Quotation
                        </h2>
                        <p className="qvc-subtitle">
                          Field Assessor &amp; Contractor <strong className="highlight">{contractorName}</strong> has completed on-site assessment and submitted this official quotation for <strong className="prop-name">{req.propertyName || 'TreeConnect Property'}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Right side quote amount highlight */}
                    <div className="qvc-quote-badge">
                      {isRevisionQuote && previousQuoteVal && previousQuoteVal !== totalQuoteVal ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5 justify-end">
                            <span>Previous:</span>
                            <span className="line-through font-mono font-semibold text-slate-400">
                              {formatINR(previousQuoteVal)}
                            </span>
                          </div>
                          <span className="qvc-quote-label text-emerald-400 font-bold">
                            {isService ? 'Revised Contractor Quotation' : isPurchase ? 'Revised Purchase Offer' : 'Revised Commercial Value'}
                          </span>
                          <strong className="qvc-quote-amount text-emerald-300">
                            {formatINR(totalQuoteVal)}
                          </strong>
                          {reductionAmt > 0 && (
                            <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 mt-1 inline-flex items-center gap-1">
                              ↓ Saved {formatINR(reductionAmt)} ({reductionPct}% negotiated)
                            </span>
                          )}
                          <span className="qvc-quote-type">
                            {propType}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="qvc-quote-label">
                            {isService ? 'Total Contractor Quotation' : isPurchase ? 'Timber Purchase Offer' : 'Purchase + Harvesting Value'}
                          </span>
                          <strong className="qvc-quote-amount">
                            {formatINR(totalQuoteVal)}
                          </strong>
                          <span className="qvc-quote-type">
                            {propType}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* REVISED QUOTATION NOTICE BANNER (WHEN CONTRACTOR HAS SUBMITTED A REVISED QUOTATION) */}
                  {isRevisionQuote && !isAccepted && (
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

                  {/* KEY METRICS GRID (MATCHING CONTRACTOR EVALUATION) */}
                  <div className="qvc-metrics-grid">
                    <div className="qvc-metric-card">
                      <span className="qvc-metric-label">
                        <Layers size={13} className="text-emerald-400" /> Assessed Volume
                      </span>
                      <div>
                        <strong className="qvc-metric-value emerald">
                          {formatVolume(assessedVolume)}
                        </strong>
                        <span className="qvc-metric-subtext">Ground truth verified</span>
                      </div>
                    </div>

                    <div className="qvc-metric-card">
                      <span className="qvc-metric-label">
                        <Users size={13} className="text-emerald-400" /> Assigned Crew
                      </span>
                      <div>
                        <strong className="qvc-metric-value">
                          {workersCount} Workers
                        </strong>
                        <span className="qvc-metric-subtext">Deployed workforce</span>
                      </div>
                    </div>

                    <div className="qvc-metric-card">
                      <span className="qvc-metric-label">
                        <Clock size={13} className="text-emerald-400" /> Job Duration
                      </span>
                      <div>
                        <strong className="qvc-metric-value">
                          {jobDuration}
                        </strong>
                        <span className="qvc-metric-subtext">Operational timeline</span>
                      </div>
                    </div>

                    <div className="qvc-metric-card">
                      <span className="qvc-metric-label">
                        <Calendar size={13} className="text-emerald-400" /> Proposed Start
                      </span>
                      <div>
                        <strong className="qvc-metric-value emerald">
                          {formatDateDMY(proposedStartDate)}
                        </strong>
                        <span className="qvc-metric-subtext">Post-inspection mobilization</span>
                      </div>
                    </div>
                  </div>

                  {/* ITEMIZED SERVICE COST BREAKDOWN (MATCHING CONTRACTOR FORM SCREENSHOT) */}
                  {isService && (
                    <div className="qvc-breakdown-box">
                      <div className="qvc-breakdown-header">
                        <div className="qvc-breakdown-title">
                          <DollarSign size={15} />
                          <span>Itemized Service Cost Breakdown (₹)</span>
                        </div>
                        <span className="qvc-breakdown-total">
                          Total Contractor Quotation: <strong>{formatINR(totalQuoteVal)}</strong>
                        </span>
                      </div>

                      <div className="qvc-breakdown-grid">
                        <div className="qvc-breakdown-item">
                          <span className="qvc-breakdown-cat">Felling &amp; Logging</span>
                          <strong className="qvc-breakdown-cost">{formatINR(fellingCost)}</strong>
                          <span className="qvc-breakdown-desc">Skilled chain-saw crew</span>
                        </div>

                        <div className="qvc-breakdown-item">
                          <span className="qvc-breakdown-cat">Extraction / Skid-Trail</span>
                          <strong className="qvc-breakdown-cost">{formatINR(extractionCost)}</strong>
                          <span className="qvc-breakdown-desc">Skid-trail haulage</span>
                        </div>

                        <div className="qvc-breakdown-item">
                          <span className="qvc-breakdown-cat">Transportation / Haulage</span>
                          <strong className="qvc-breakdown-cost">{formatINR(transportCost)}</strong>
                          <span className="qvc-breakdown-desc">10-wheeler log truck</span>
                        </div>

                        <div className="qvc-breakdown-item">
                          <span className="qvc-breakdown-cat">Other / Site Clearing</span>
                          <strong className="qvc-breakdown-cost">{formatINR(otherCost)}</strong>
                          <span className="qvc-breakdown-desc">Slash &amp; debris clean-up</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONTRACTOR SITE REMARKS & AUDIT FINDINGS */}
                  {(assDoc.notes || req.site_inspection?.inspection_remarks || req.notes) && (
                    <div className="qvc-remarks-box">
                      <strong className="qvc-remarks-label">
                        Assessor &amp; Contractor Official Remarks:
                      </strong>
                      <p className="qvc-remarks-text">
                        "{assDoc.notes || req.site_inspection?.inspection_remarks || req.notes || 'Site inspection completed. Access road clear for heavy haulers.'}"
                      </p>
                    </div>
                  )}

                  {/* ACTIVE REVISION COUNTER-OFFER BANNER (WHEN IN NEGOTIATION) */}
                  {isRevision && (() => {
                    const counterAmt = assDoc.counter_offer_amount || req.counter_offer_amount;
                    const diffAmt = counterAmt ? totalQuoteVal - counterAmt : null;
                    const diffPct = (counterAmt && totalQuoteVal) ? Math.round(((totalQuoteVal - counterAmt) / totalQuoteVal) * 100) : null;

                    return (
                      <div className="qtn-counter-section">
                        <div className="qtn-counter-header">
                          <div className="qtn-counter-header-left">
                            <div className="qtn-counter-icon-wrap">
                              <RefreshCw size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="qtn-counter-title">
                                  Fair Deal Counter-Offer Active with {contractorName}
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
                            onClick={() => setRevisionModalReq({ req, assessment: assDoc })}
                            className="qtn-counter-action-btn"
                          >
                            <RefreshCw size={13} />
                            <span>Adjust Counter-Offer</span>
                          </button>
                        </div>

                        {/* Counter-Offer Parameter Grid */}
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
                              {formatDateDMY(assDoc.counter_offer_start_date || req.counter_offer_start_date || proposedStartDate)}
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
                    );
                  })()}

                  {/* DIGITAL AGREEMENT EXECUTED BANNER & ADVANCE PAYMENT (WHEN ACCEPTED) */}
                  {isAccepted && (
                    <div className="space-y-4">
                      <div className="qvc-agreement-box">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                            <FileCheck size={22} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-black text-white">
                                Digital Harvest Agreement Executed &amp; Work Finalized
                              </h4>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                                {req.digital_agreement?.agreement_id || `TC-AGR-${new Date().getFullYear()}-${String(reqId).slice(-6).toUpperCase()}`}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                              Both parties have finalized commercial terms. Harvesting operations are authorized to commence on <strong>{formatDateDMY(proposedStartDate)}</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setRevisionModalReq({ req, assessment: assDoc })}
                            className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                            title="Request quotation adjustment or renegotiate terms"
                          >
                            <RefreshCw size={13} />
                            <span>Revise Quotation</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedAgreementModal({ req, assessment: assDoc })}
                            className="qvc-btn-accept"
                          >
                            <FileCheck size={16} />
                            <span>View Digital Agreement</span>
                          </button>
                        </div>
                      </div>

                      {/* ADVANCE MOBILIZATION PAYMENT CARD */}
                      <AdvancePaymentCard
                        request={req}
                        role="landowner"
                        onRecordPayment={() => setSelectedRecordPaymentModal(req)}
                      />
                    </div>
                  )}


                  {/* VERIFICATION ACTION CONTROLS FOR LANDOWNER */}
                  {isUnderReview && (
                    <div className="qvc-actions-footer">
                      <div className="qvc-actions-tip">
                        <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                        <span>
                          {isRevisionQuote
                            ? 'Review the contractor\'s revised quotation. You can accept to authorize harvesting operations or request a further re-revision.'
                            : 'Review the itemized quotation above and verify to authorize harvesting operations.'}
                        </span>
                      </div>

                      <div className="qvc-actions-group">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to decline this contractor quotation?')) {
                              handleAssessmentAction(reqId, 'REJECTED', 'Landowner declined this commercial proposal.');
                            }
                          }}
                          className="qvc-btn-decline"
                        >
                          Decline Quotation
                        </button>

                        <button
                          type="button"
                          onClick={() => setRevisionModalReq({ req, assessment: assDoc })}
                          className="qvc-btn-revision"
                        >
                          <RefreshCw size={14} />
                          <span>{isRevisionQuote ? 'Re-revise / Further Negotiation' : 'Request Revision / Counter-Offer'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAssessmentAction(reqId, 'ACCEPTED', 'Landowner verified and accepted quotation.')}
                          className="qvc-btn-accept"
                        >
                          <CheckCircle2 size={16} />
                          <span>{isRevisionQuote ? 'Accept Revised Quotation & Authorize' : 'Accept & Authorize Quotation'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              );
            });
          })()}

          {/* UPCOMING SCHEDULED SITE INSPECTION — FULL FIELD ASSESSMENT DETAILS */}
          {scheduledVisits.length > 0 && (() => {
            const visit = scheduledVisits[0];
            const inspection = visit.site_inspection || {};
            const visitId = visit.id || visit._id;
            const inspectorName = inspection.inspector_name || visit.assigned_contractor_name || 'Assigned Field Assessor';
            const inspectorPhone = inspection.inspector_phone || visit.assigned_contractor_phone || '';
            const propName = visit.propertyName || 'Registered Timber Estate';
            const propLocation = visit.district || visit.location || visit.address || 'Kerala';
            const treeCount = visit.standing_trees_count || visit.total_trees || visit.treesCount || 1;
            const treeSpecies = visit.tree_species || visit.species || visit.mainSpecies || 'Standing Timber';

            const activeChecklist = Array.isArray(inspection.checklist || inspection.inspection_checklist) && (inspection.checklist || inspection.inspection_checklist).length > 0
              ? (inspection.checklist || inspection.inspection_checklist)
              : [
                  'Verify property location',
                  'Verify tree quantity',
                  'Confirm tree species',
                  'Assess tree condition',
                  'Record tree measurements',
                  'Check site accessibility',
                  'Check surrounding obstacles',
                  'Capture tree/property photographs'
                ];

            return (
              <section className="scheduled-inspection-card">
                <div className="scheduled-inspection-header">
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                      <Calendar size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-xl font-black text-white">
                          Site Inspection Visit Scheduled
                        </h2>
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
                        {scheduledVisits.length > 1 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-slate-300">
                            +{scheduledVisits.length - 1} more visit
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                        The assigned forestry contractor has booked an on-site field assessment to inspect parcel boundaries, tree condition, and haul road accessibility before quoting.
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
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {inspection.reschedule_reason ? (
                            <span>Reason: <em className="text-amber-200 font-semibold">"{inspection.reschedule_reason}"</em></span>
                          ) : (
                            'Awaiting contractor confirmation. Preferred slot submitted.'
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/landowner/harvest-requests', { state: { highlightRequestId: visitId } })}
                      className="scheduled-btn-modify-reschedule"
                      title="Manage suggested date in harvest requests"
                    >
                      Manage Reschedule
                    </button>
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
                        onClick={() => handleConfirmInspectionDate(visitId, inspection)}
                        disabled={confirmingDateId === visitId}
                        className="scheduled-btn-confirm"
                        title="Accept and confirm this preferred inspection date"
                      >
                        {confirmingDateId === visitId ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                        <span>{confirmingDateId === visitId ? 'Confirming...' : 'Confirm & Accept Date'}</span>
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
                      </div>

                      <div className="pt-3 border-t border-emerald-500/15">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Lead Field Assessor
                        </span>
                        <div className="flex items-center gap-2 text-white font-black text-sm">
                          <UserCheck size={16} className="text-emerald-400 shrink-0" />
                          <span>{inspectorName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                          Verified Forestry Assessor • TreeConnect Contractor Crew
                        </span>
                        {inspectorPhone && (
                          <a
                            href={`tel:${inspectorPhone}`}
                            className="text-emerald-300 hover:text-emerald-200 inline-flex items-center gap-1.5 text-xs font-bold hover:underline mt-1.5"
                          >
                            <Phone size={13} className="text-emerald-400" />
                            +91 {inspectorPhone}
                          </a>
                        )}
                      </div>

                      <div className="pt-3 border-t border-emerald-500/15">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Inspection Site Parcel
                        </span>
                        <div className="flex items-center gap-2 text-slate-200 text-xs font-semibold">
                          <MapPin size={15} className="text-emerald-400 shrink-0" />
                          <span className="truncate">{propName}</span>
                        </div>
                        <span className="text-slate-400 text-xs block truncate mt-0.5">
                          {propLocation} • {treeCount} Standing Trees ({treeSpecies})
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
                        const isActive = activeChecklist.includes(chk);
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
                    {!inspection.reschedule_requested && !inspection.landowner_confirmed ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmInspectionDate(visitId, inspection)}
                        disabled={confirmingDateId === visitId}
                        className="scheduled-btn-confirm"
                        title="Confirm and accept this preferred date for contractor's site visit"
                      >
                        {confirmingDateId === visitId ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Check size={15} />
                        )}
                        <span>{confirmingDateId === visitId ? 'Confirming...' : 'Confirm & Accept Date'}</span>
                      </button>
                    ) : !inspection.reschedule_requested && inspection.landowner_confirmed ? (
                      <div className="scheduled-confirmed-badge" title="You have confirmed this appointment date">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <span>Date Accepted by You</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="scheduled-action-group-right">
                    {inspectorPhone && (
                      <a
                        href={`tel:${inspectorPhone}`}
                        className="scheduled-btn-call"
                      >
                        <Phone size={14} />
                        <span>Call Inspector</span>
                      </a>
                    )}
                    <a
                      href={getGoogleMapsUrl(visit)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="scheduled-btn-directions"
                    >
                      <Navigation size={14} className="text-emerald-400" />
                      <span>Parcel Directions</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => navigate('/landowner/harvest-requests', { state: { highlightRequestId: visitId } })}
                      className="scheduled-btn-reschedule"
                      title="Not available on this date? Propose an alternate date in Harvest Requests"
                    >
                      <CalendarClock size={14} />
                      <span>{inspection.reschedule_requested ? 'Modify Suggested Date' : 'Suggest Alternate Date'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/landowner/harvest-requests', { state: { highlightRequestId: visitId } })}
                      className="scheduled-btn-manage"
                    >
                      <span>Manage in Harvest Requests</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* 2. 3-COLUMN WIDGETS ROW */}
          <div className="ld-widgets-grid">
            
            {/* Widget 1: Regional Weather */}
            <div className="ld-widget-card">
              <div className="ld-widget-header">
                <span className="ld-widget-title">
                  <CloudSun size={18} className="text-emerald-400" /> Regional Weather
                </span>
                <span className="ld-badge-green">Harvest Optimal</span>
              </div>
              <div className="ld-weather-body">
                <div>
                  <div className="ld-weather-temp">64°F</div>
                  <div className="ld-weather-location">Partly Cloudy • Willamette / Kottayam</div>
                </div>
                <div className="ld-weather-stats">
                  <div className="flex items-center gap-1 justify-end"><Wind size={13} /> 7 mph SW</div>
                  <div className="flex items-center gap-1 justify-end"><Droplets size={13} /> 48% Hum</div>
                </div>
              </div>
            </div>

            {/* Widget 2: Today's Tasks */}
            <div className="ld-widget-card">
              <div className="ld-widget-header">
                <span className="ld-widget-title">
                  <CheckCircle2 size={18} className="text-emerald-400" /> Today's Tasks
                </span>
                <span className="ld-badge-amber">
                  {(scheduledVisits.length > 0 || verifiedInspections.length > 0) ? `${3 + (scheduledVisits.length > 0 ? 1 : 0) + (verifiedInspections.length > 0 ? 1 : 0)} Action Items` : '3 Action Items'}
                </span>
              </div>
              <div className="ld-task-list">
                {verifiedInspections.length > 0 && (
                  <div
                    onClick={() => setSelectedVisitModal(verifiedInspections[0])}
                    className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-950/60 transition-colors flex items-center justify-between cursor-pointer"
                    title="Click to view certified site inspection report"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-white font-bold text-xs">
                        Audit Certified: {verifiedInspections[0].propertyName || 'Estate'} ({formatDateDMY(verifiedInspections[0].site_inspection?.inspected_at || verifiedInspections[0].site_inspection?.scheduled_date)})
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/50">
                      Certified
                    </span>
                  </div>
                )}
                {scheduledVisits.length > 0 && (
                  <div
                    onClick={() => setSelectedVisitModal(scheduledVisits[0])}
                    className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 hover:bg-emerald-950/70 transition-colors flex items-center justify-between cursor-pointer"
                    title="Click to view scheduled site visit details"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Calendar size={14} className="text-emerald-400 shrink-0" />
                      <span className="text-white font-bold text-xs truncate">
                        Site Visit: {scheduledVisits[0].propertyName || 'Estate'} ({formatDateDMY(scheduledVisits[0].site_inspection?.scheduled_date)})
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/50 shrink-0 ml-2">
                      Confirmed
                    </span>
                  </div>
                )}
                <label className="ld-task-row">
                  <input type="checkbox" id="t-chk-1" />
                  <span>Approve Apex Harvesting Bid</span>
                </label>
                <label className="ld-task-row">
                  <input type="checkbox" id="t-chk-2" />
                  <span>Review Q3 Timber Volume Audit Report</span>
                </label>
                <label className="ld-task-row">
                  <input type="checkbox" id="t-chk-3" />
                  <span>Verify Sector 4 Access Road Entrance</span>
                </label>
              </div>
            </div>

            {/* Widget 3: Spot Rate Index */}
            <div className="ld-widget-card">
              <div className="ld-widget-header">
                <span className="ld-widget-title">
                  <DollarSign size={18} className="text-emerald-400" /> Spot Rate Index
                </span>
                <span className="ld-badge-live">LIVE RATES</span>
              </div>
              <div className="ld-spot-list">
                <div className="ld-spot-item">
                  <span className="ld-spot-name">Rubber Wood Logs</span>
                  <div>
                    <span className="ld-spot-price">$115/m³</span>
                    <span className="ld-spot-up">+2.4%</span>
                  </div>
                </div>
                <div className="ld-spot-item">
                  <span className="ld-spot-name">Western Red Cedar</span>
                  <div>
                    <span className="ld-spot-price">$140/m³</span>
                    <span className="ld-spot-up">+1.8%</span>
                  </div>
                </div>
                <div className="ld-spot-item">
                  <span className="ld-spot-name">Teak Grade A</span>
                  <div>
                    <span className="ld-spot-price">$220/m³</span>
                    <span className="ld-spot-up">+3.1%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3. QUICK ACTIONS GRID */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-white tracking-tight">Landowner Shortcuts</h2>
            <div className="ld-quick-grid">
              {quickActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="ld-quick-card group"
                >
                  <div>
                    <div className="ld-quick-emoji">{action.emoji}</div>
                    <h3 className="ld-quick-title group-hover:text-emerald-400 transition-colors">{action.title}</h3>
                    <p className="ld-quick-sub">{action.description}</p>
                  </div>
                  <div className="ld-quick-link">
                    <span>{action.linkText || 'Initiate'}</span>
                    <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. UNIFORM KPI CARDS */}
          <section className="ld-kpi-grid">
            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon"><Trees size={20} /></div>
                <span className="ld-badge-green flex items-center gap-1"><TrendingUp size={12} /> +12.5% YoY</span>
              </div>
              <div>
                <div className="ld-kpi-number">{totalManagedArea} Acres</div>
                <div className="ld-kpi-label">Total Managed Land</div>
              </div>
            </div>

            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon"><Calculator size={20} /></div>
                <span className="ld-badge-green flex items-center gap-1"><TrendingUp size={12} /> High Yield</span>
              </div>
              <div>
                <div className="ld-kpi-number">{totalTimberVolume.toLocaleString()} m³</div>
                <div className="ld-kpi-label">Est. Standing Volume</div>
              </div>
            </div>

            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon text-amber-400 bg-amber-500/10 border-amber-500/20"><Scale size={20} /></div>
                <span className="ld-badge-amber">{bids.length} Active</span>
              </div>
              <div>
                <div className="ld-kpi-number">{bids.length} Offers</div>
                <div className="ld-kpi-label">Contractor Bids Received</div>
              </div>
            </div>

            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon text-blue-400 bg-blue-500/10 border-blue-500/20"><DollarSign size={20} /></div>
                <span className="ld-badge-live flex items-center gap-1"><TrendingUp size={12} /> Live Rate</span>
              </div>
              <div>
                <div className="ld-kpi-number">${estRevenue.toLocaleString()}</div>
                <div className="ld-kpi-label">Est. Timber Revenue</div>
              </div>
            </div>
          </section>

          {/* 5. ACTIVE HARVEST SPOTLIGHT */}
          <section className="ld-spotlight-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="ld-dot ld-dot-green animate-pulse"></span>
                <h2 className="text-lg font-extrabold text-white">Active Harvest Operation Spotlight</h2>
              </div>
              <span className="ld-badge-green">{activeSpotlight?.status || 'In Progress'}</span>
            </div>

            <div className="ld-spotlight-inner">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">{activeSpotlight?.propertyName || 'Estate Harvest Operation'}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="text-emerald-400" />
                    <span>{activeSpotlight?.location || 'Estate Plot'} • {activeSpotlight?.harvestScopeDetail || 'Timber Operation'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Completion Target</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{activeSpotlight?.preferredStartDate || 'Sep 15, 2026'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Harvest Logging Progress</span>
                  <span className="text-emerald-400">45% Completed (144 / 320 m³)</span>
                </div>
                <div className="ld-progress-bg">
                  <div className="ld-progress-fill" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Contractor</span>
                  <span className="font-bold text-white mt-0.5 block">{activeSpotlight?.contractor || 'Apex Timber Harvesting'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Est. Volume</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">{activeSpotlight?.estimatedVolume || '320 m³'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Log Destination</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">Kottayam Sawmill</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Audit Code</span>
                  <span className="font-mono text-emerald-400 mt-0.5 block">#TH-2026-88B</span>
                </div>
              </div>
            </div>
          </section>

          {/* 6. REGISTERED PROPERTIES PORTFOLIO */}
          <section className="ld-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-white">Registered Timber Estates</h2>
                <p className="text-xs text-slate-400">Commercial forest stands registered under your portfolio</p>
              </div>
              <button onClick={() => navigate('/landowner/properties')} className="ld-btn-outline py-1.5 px-3 text-xs">
                View All ({properties.length}) <ChevronRight size={14} />
              </button>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-[#0a0f0d]/50 rounded-2xl border border-slate-800/80">
                <Trees size={40} className="text-emerald-500/40 mx-auto" />
                <h3 className="font-bold text-white text-sm">No Registered Timber Estates</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You have not registered any timber estates yet. Click below to add your property.
                </p>
                <button onClick={() => navigate('/landowner/register-property')} className="ld-btn-green text-xs py-2 px-4 mx-auto inline-flex items-center gap-1.5" style={{ width: 'auto' }}>
                  <Plus size={14} /> Register Property
                </button>
              </div>
            ) : (
              <div className="ld-estates-grid">
                {properties.slice(0, 3).map((p) => {
                  const pId = p.id || p._id;
                  const photos = (p.photos || []).filter(ph => typeof ph === 'string' && !ph.includes('unsplash.com'));
                  const coverPhoto = photos.length > 0 ? photos[0] : (p.image && !p.image.includes('unsplash.com') ? p.image : null);
                  return (
                    <div key={pId} className="ld-estate-item group">
                      <div>
                        <div className="ld-estate-cover">
                          {coverPhoto ? (
                            <img src={coverPhoto} alt={p.propertyName} className="ld-estate-img" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#060d08] text-slate-500 p-4 text-center">
                              <Trees size={32} className="text-emerald-500/30 mb-1" />
                              <span className="text-[11px] font-bold text-slate-300">No Photo Uploaded</span>
                            </div>
                          )}
                          <span className="absolute top-3 right-3 ld-badge-green shadow">
                            {p.status || 'Active Estate'}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">{p.propertyName}</h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={13} className="text-emerald-400 shrink-0" /> {p.district || p.address || 'Kerala'}, {p.state || 'Kerala'}</p>
                          </div>

                          <div className="bg-[#14171d] border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Area</span>
                              <span className="font-bold text-white mt-0.5 block">{p.totalArea ? `${p.totalArea} ${p.areaUnit || 'Acres'}` : 'Plot'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                              <span className="font-bold text-white mt-0.5 block truncate">{p.propertyType || p.mainSpecies || 'Estate'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Trees</span>
                              <span className="font-extrabold text-emerald-400 mt-0.5 block">{p.approxTreesCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex items-center gap-2">
                        <button onClick={() => navigate(`/landowner/add-inventory?propertyId=${pId}`)} className="ld-btn-outline flex-1 text-xs py-2 px-2 justify-center">
                          + Inventory
                        </button>
                        {(() => {
                          const pIdStr = String(pId || '');
                          const hasActiveReq = (harvestRequests || []).some((req) => {
                            if (!req || req.status === 'CANCELLED' || req.status === 'DELETED' || req.status === 'COMPLETED') return false;
                            const reqPropId = String(req.property_id || req.propertyId || '');
                            return pIdStr && reqPropId === pIdStr;
                          });

                          return hasActiveReq ? (
                            <button onClick={() => navigate('/landowner/harvest-requests')} className="ld-btn-outline flex-1 text-xs py-2 px-2 justify-center text-emerald-400 border-emerald-500/30 font-bold" title="Harvest request already sent to contractor. Click to view request details.">
                              <CheckCircle2 size={12} /> Request Sent
                            </button>
                          ) : (
                            <button onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)} className="ld-btn-outline flex-1 text-xs py-2 px-2 justify-center text-amber-400 border-amber-500/30">
                              Harvest
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 7. BIDS TABLE & QUICK ESTIMATOR */}
          <div className="ld-split-grid">
            {/* Contractor Bids Table */}
            <section className="ld-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Scale size={18} className="text-emerald-400" /> Contractor Bids Received
                </h2>
                <span className="text-xs text-slate-400">{bids.length} Active Bids</span>
              </div>
              <div className="overflow-x-auto">
                <table className="ld-table">
                  <thead>
                    <tr>
                      <th>Contractor</th>
                      <th>Target Parcel</th>
                      <th>Bid Total</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((b) => (
                      <tr key={b.id}>
                        <td className="font-bold text-white">{b.contractor}</td>
                        <td className="text-slate-300">{b.plot}</td>
                        <td className="text-emerald-400 font-extrabold">{b.bidAmount}</td>
                        <td>{b.ratePerM3}</td>
                        <td>
                          <span className={b.status === 'Accepted' ? 'ld-badge-green' : b.status === 'Rejected' ? 'ld-badge-live' : 'ld-badge-amber'}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {b.status === 'Pending Review' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-pointer transition-colors"
                                title="Accept Bid"
                                onClick={() => handleBidStatus(b.id, 'Accepted')}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 cursor-pointer transition-colors"
                                title="Reject Bid"
                                onClick={() => handleBidStatus(b.id, 'Rejected')}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Quick Timber Volume Estimator */}
            <section className="ld-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calculator size={18} className="text-emerald-400" /> Quick Timber Estimator
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Tree Count</span>
                    <span className="text-white text-sm font-black">{treesCount} trees</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="25"
                    value={treesCount}
                    onChange={(e) => setTreesCount(Number(e.target.value))}
                    className="ld-slider-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Avg Trunk DBH (Inches)</span>
                    <span className="text-white text-sm font-black">{avgDbh} in</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    step="1"
                    value={avgDbh}
                    onChange={(e) => setAvgDbh(Number(e.target.value))}
                    className="ld-slider-input"
                  />
                </div>

                <div className="bg-[#0f1115] border border-slate-800 rounded-xl p-4 flex items-center justify-around text-center mt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Est Volume</span>
                    <span className="text-xl font-extrabold text-emerald-400 block mt-0.5">{calculatedVolume} m³</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Market Revenue</span>
                    <span className="text-xl font-extrabold text-amber-400 block mt-0.5">${estimatedValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 8. ENVIRONMENTAL & CARBON OFFSET IMPACT */}
          <section className="ld-card flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                <Leaf size={14} /> Environmental &amp; Carbon Offset Rating
              </div>
              <h3 className="text-base font-bold text-white">Sustainable Commercial Forestry Rating</h3>
              <p className="text-xs text-slate-400">Your managed forest parcels absorb CO₂ emissions and support regional biodiversity.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CO₂ Sequestration</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">~420 Tons/Yr</span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Forest Health</span>
                <span className="text-xl font-black text-white mt-0.5 block">94% Optimal</span>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* SCHEDULED SITE VISIT DETAILS MODAL */}
      {selectedVisitModal && (() => {
        const ins = selectedVisitModal.site_inspection || {};
        const assessorName = ins.inspector_name || selectedVisitModal.assigned_contractor_name || 'Rohith kumar';
        const assessorPhone = ins.inspector_phone || selectedVisitModal.assigned_contractor_phone || '9746512243';
        const propName = selectedVisitModal.propertyName || selectedVisitModal.property_name || 'TreeConnect Property';
        const propLoc = selectedVisitModal.propertyLocation || selectedVisitModal.location || 'Kottayam, Kerala';
        const ownerName = selectedVisitModal.ownerName || userName || 'Harigovind D Nair';
        const visitDateStr = formatDateDMY(ins.scheduled_date) || '07-10-2026';
        const reqId = selectedVisitModal.id || selectedVisitModal._id;
        const currentStage = ins.status || selectedVisitModal.inspection_status || 'SCHEDULED';
        const inspectionPurpose = ins.inspection_purpose || 'Tree and property assessment';

        const checklistItems = [
          'Verify property location',
          'Verify tree quantity',
          'Confirm tree species',
          'Assess tree condition',
          'Record tree measurements',
          'Check site accessibility',
          'Check surrounding obstacles',
          'Capture tree/property photographs'
        ];

        const activeChecklist = Array.isArray(ins.checklist || ins.inspection_checklist) && (ins.checklist || ins.inspection_checklist).length > 0
          ? (ins.checklist || ins.inspection_checklist)
          : checklistItems;

        const isVerified = Boolean(
          selectedVisitModal.site_inspected ||
          selectedVisitModal.inspection_status === 'COMPLETED' ||
          selectedVisitModal.inspection_status === 'REPORT_SUBMITTED' ||
          ins.status === 'COMPLETED' ||
          ins.status === 'REPORT_SUBMITTED'
        );

        const inspectionStages = [
          { id: 'SCHEDULED', label: 'Scheduled', step: 1 },
          { id: 'CONFIRMED', label: 'Confirmed', step: 2 },
          { id: 'IN_PROGRESS', label: 'In Progress', step: 3 },
          { id: 'COMPLETED', label: 'Completed', step: 4 },
          { id: 'REPORT_SUBMITTED', label: 'Report Submitted', step: 5 }
        ];

        if (isVerified) {
          return (
            <div
              className="cd-inspection-modal-overlay"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedVisitModal(null);
              }}
            >
              <div
                className="cd-inspection-modal-box cd-schedule-modal max-w-3xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="cd-schedule-modal-header">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                        Certified Field Inspection Certificate
                      </h3>
                      <p className="text-[13px] text-slate-300">
                        {propName} • Verified by {assessorName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVisitModal(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="Close Dialog"
                    aria-label="Close Dialog"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="cd-schedule-modal-body">
                  {/* Official Verdict Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#06180e] via-[#092214] to-[#06180e] border border-emerald-500/35 shadow-lg shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Official Feasibility Verdict
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase">
                            Report Submitted
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                          {ins.inspection_verdict === 'FEASIBLE' ? '✓ FEASIBLE FOR HARVESTING' : ins.inspection_verdict || '✓ FEASIBLE FOR HARVESTING'}
                        </h4>
                      </div>
                    </div>

                    <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-500/20 text-xs text-slate-300">
                      <span className="text-[11px] text-slate-400 font-medium">Certified Inspection Date</span>
                      <span className="font-semibold text-white flex items-center gap-1.5 mt-0.5">
                        <Calendar size={13} className="text-emerald-400" />
                        {formatDateDMY(ins.inspected_at || ins.completed_at || ins.scheduled_date) || 'Recent Audit'}
                      </span>
                    </div>
                  </div>

                  {/* Property & Site Location Info Card */}
                  <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/25">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-500/15">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <MapPin size={15} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block leading-none mb-1">
                            Audited Parcel Location
                          </span>
                          <span className="text-white font-semibold text-sm">
                            {propLoc}
                          </span>
                        </div>
                      </div>

                      <a
                        href={getGoogleMapsUrl(selectedVisitModal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors shrink-0 hover:underline"
                        title="Open in Google Maps"
                      >
                        <Navigation size={13} />
                        <span>Open in Google Maps</span>
                        <ExternalLink size={11} className="opacity-75" />
                      </a>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-400">Landowner:</span>
                        <span className="text-white font-semibold">{ownerName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span className="text-slate-400">Assessor Contact:</span>
                        <a
                          href={`tel:${assessorPhone}`}
                          className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline flex items-center gap-1"
                          title="Call inspector"
                        >
                          <Phone size={12} className="text-emerald-400" />
                          <span>+91 {assessorPhone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Inspection Purpose & Scope Checklist */}
                  <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/25 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1.5">
                        <Target size={13} className="text-emerald-400" /> Inspection Purpose:
                      </span>
                      <strong className="text-emerald-300 font-semibold text-xs sm:text-sm">
                        {ins.inspection_purpose || 'Tree and property assessment'}
                      </strong>
                    </div>

                    <div className="pt-2.5 border-t border-emerald-500/15">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Verified Scope Checklist ({checklistItems.length}/8 Certified)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {checklistItems.map((chk) => (
                          <div
                            key={chk}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/25 text-slate-200 text-xs font-medium flex items-center gap-2"
                          >
                            <span className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 font-bold">
                              ✓
                            </span>
                            <span className="truncate">{chk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Technical Audit Findings Grid (8 Metric Cards) */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Certified On-Site Assessment Findings
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* 1. Lead Assessor */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Lead Assessor</span>
                          <span className="text-white font-semibold text-xs sm:text-sm">{ins.inspector_name || assessorName}</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <UserCheck size={14} />
                        </div>
                      </div>

                      {/* 2. Contact Phone */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Assessor Phone</span>
                          <a href={`tel:${assessorPhone}`} className="text-emerald-300 hover:underline font-semibold text-xs sm:text-sm flex items-center gap-1">
                            +91 {assessorPhone}
                          </a>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Phone size={14} />
                        </div>
                      </div>

                      {/* 3. Verified Standing Trees */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Verified Standing Trees</span>
                          <span className="text-emerald-300 font-bold text-xs sm:text-sm">{ins.verified_tree_count || selectedVisitModal.approxTreesCount || 20} Trees Audited</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Trees size={14} />
                        </div>
                      </div>

                      {/* 4. Measured Avg. DBH */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            {ins.canopy_height && ins.canopy_height !== '18 - 24 m' && ins.canopy_height !== '20m'
                              ? 'Avg. DBH / Canopy Height'
                              : 'Measured Avg. DBH'}
                          </span>
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            {ins.measured_avg_dbh || '70 - 80 cm'}
                            {ins.canopy_height && ins.canopy_height !== '18 - 24 m' && ins.canopy_height !== '20m'
                              ? ` • ${ins.canopy_height}`
                              : ''}
                          </span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Ruler size={14} />
                        </div>
                      </div>

                      {/* 5. Timber Soundness */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Timber Soundness</span>
                          <span className="text-emerald-300 font-semibold text-xs sm:text-sm">{ins.timber_condition || 'Sound & Top Quality'}</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck size={14} />
                        </div>
                      </div>

                      {/* 6. Haul Road Approach */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Haul Road Approach</span>
                          <span className="text-white font-semibold text-xs sm:text-sm">{ins.road_access_verification || 'Heavy truck accessible'}</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Truck size={14} />
                        </div>
                      </div>

                      {/* 7. Distance to Paved Road */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Distance to Paved Road</span>
                          <span className="text-white font-semibold text-xs sm:text-sm">{ins.distance_to_haul_road || '25 meters'}</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <Navigation size={14} />
                        </div>
                      </div>

                      {/* 8. Surrounding Hazards */}
                      <div className="p-3 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Surrounding Obstacles / Hazards</span>
                          <span className="text-white font-semibold text-xs sm:text-sm">{ins.overhead_hazards || 'Clear'}</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <AlertTriangle size={14} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Landowner Access Instructions */}
                  {ins.notes && (
                    <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/20 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <FileText size={12} className="text-emerald-400" /> Landowner Access Instructions
                      </span>
                      <p className="text-slate-200 leading-relaxed font-normal">{ins.notes}</p>
                    </div>
                  )}

                  {/* Inspector Field Remarks */}
                  {ins.inspection_remarks && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/25 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                        <ClipboardCheck size={12} /> Assessor Field Notes & Remarks
                      </span>
                      <p className="text-emerald-100 italic leading-relaxed">{ins.inspection_remarks}</p>
                    </div>
                  )}

                  {/* Attached Photos */}
                  {Array.isArray(ins.inspection_photos) && ins.inspection_photos.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Attached Field Inspection Photos ({ins.inspection_photos.length})
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {ins.inspection_photos.map((ph, idx) => (
                          <img
                            key={idx}
                            src={ph}
                            alt={`Inspection ${idx + 1}`}
                            className="h-20 w-full object-cover rounded-lg border border-emerald-500/30 hover:scale-105 transition-transform cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notice for Landowner */}
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong className="text-white">Notice for Landowner:</strong> This parcel has been officially site-inspected and audited. Tree count, species soundness, and machinery extraction feasibility have been verified on-site.
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="cd-schedule-modal-footer">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="mr-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/40 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Printer size={14} />
                    <span>Print Certificate</span>
                  </button>

                  {assessorPhone && (
                    <a
                      href={`tel:${assessorPhone}`}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone size={13} />
                      <span>Call Assessor</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedVisitModal(null)}
                    className="cd-btn-modal-cancel"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVisitModal(null);
                      navigate('/landowner/harvest-requests', { state: { highlightRequestId: reqId } });
                    }}
                    className="cd-btn-confirm-schedule"
                  >
                    <FileCheck size={14} /> View in Harvest Requests
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            className="cd-inspection-modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedVisitModal(null);
            }}
          >
            <div
              className="cd-inspection-modal-box cd-schedule-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="cd-schedule-modal-header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
                      Scheduled Site Inspection Details
                    </h3>
                    <p className="text-[13px] text-slate-300">
                      {propName} • Owner: <strong className="text-slate-100 font-semibold">{ownerName}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVisitModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Close Dialog"
                  aria-label="Close Dialog"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="cd-schedule-modal-body">
                {/* Property & Location Info Card */}
                <div className="p-3.5 rounded-xl bg-[#08150e]/90 border border-emerald-500/25">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-500/15">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <MapPin size={15} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block leading-none mb-1">
                          Inspection Site Location
                        </span>
                        <span className="text-white font-semibold text-sm">
                          {propLoc}
                        </span>
                      </div>
                    </div>

                    <a
                      href={getGoogleMapsUrl(selectedVisitModal)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors shrink-0 hover:underline"
                      title="Open in Google Maps"
                    >
                      <Navigation size={13} />
                      <span>Open in Google Maps</span>
                      <ExternalLink size={11} className="opacity-75" />
                    </a>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-slate-400">Landowner:</span>
                      <span className="text-white font-semibold">{ownerName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <span className="text-slate-400">Inspector Direct Phone:</span>
                      <a
                        href={`tel:${assessorPhone}`}
                        className="text-emerald-300 hover:text-emerald-200 font-semibold hover:underline flex items-center gap-1"
                        title="Call inspector"
                      >
                        <Phone size={12} className="text-emerald-400" />
                        <span>{assessorPhone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Inspection Status Pipeline */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="cd-inspection-label mb-0">
                      <Activity size={13} className="text-emerald-400" /> Inspection Status
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Status: <strong className="text-emerald-400 uppercase font-semibold">{currentStage}</strong>
                    </span>
                  </div>

                  <div className="cd-inspection-status-pipeline">
                    {inspectionStages.map((st, idx) => {
                      const isCurrent = currentStage === st.id;
                      const currentIndex = inspectionStages.findIndex(s => s.id === currentStage);
                      const isPast = currentIndex > idx;
                      return (
                        <React.Fragment key={st.id}>
                          <div
                            className={`cd-status-step ${isCurrent ? 'active' : isPast ? 'completed' : 'inactive'}`}
                          >
                            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                              isCurrent ? 'bg-emerald-500 text-slate-950' : isPast ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {isPast ? '✓' : st.step}
                            </span>
                            <span>{st.label}</span>
                          </div>
                          {idx < inspectionStages.length - 1 && (
                            <span className="cd-status-arrow">→</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Inspection Purpose */}
                <div>
                  <label className="cd-inspection-label mb-1.5">
                    <Target size={13} className="text-emerald-400" /> Inspection Purpose
                  </label>
                  <div className="cd-inspection-input text-white font-medium flex items-center justify-between">
                    <span>{inspectionPurpose}</span>
                    <span className="text-[11px] text-slate-400">Pre-Quotation Assessment</span>
                  </div>
                </div>

                {/* Proposed Inspection Date */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="cd-inspection-label mb-0">
                      <Calendar size={13} className="text-emerald-400" /> Proposed Inspection Date
                    </label>
                    <span className="text-[12px] text-slate-400 font-normal">Working days: Mon–Sat</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="cd-inspection-input flex-1 flex items-center justify-between font-medium">
                      <span className="text-white font-semibold">{visitDateStr}</span>
                      <span className="text-xs text-slate-400">
                        {ins.original_scheduled_date ? 'Rescheduled Date' : 'Scheduled Date'}
                      </span>
                    </div>
                    <span className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {ins.original_scheduled_date ? 'Rescheduled Visit' : 'Confirmed Appointment'}
                    </span>
                  </div>
                  {ins.original_scheduled_date && ins.original_scheduled_date !== ins.scheduled_date && (
                    <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 px-1 font-medium">
                      <span>Originally booked for:</span>
                      <span className="line-through text-slate-300">{formatDateDMY(ins.original_scheduled_date)}</span>
                    </div>
                  )}
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <label className="cd-inspection-label mb-1.5">
                    <Clock size={13} className="text-emerald-400" /> Preferred Time Slot
                  </label>
                  <div className="cd-inspection-input flex items-center justify-between text-slate-200">
                    <span className="font-medium">{ins.time_slot ? ins.time_slot : 'Morning (09:00 AM - 12:00 PM)'}</span>
                    <Clock size={14} className="text-slate-400 shrink-0" />
                  </div>
                </div>

                {/* Lead Inspector & Contact Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="cd-inspection-label mb-1.5">
                      <UserCheck size={13} className="text-emerald-400" /> Lead Inspector / Field Assessor
                    </label>
                    <div className="cd-inspection-input text-white font-medium">
                      {assessorName}
                    </div>
                  </div>
                  <div>
                    <label className="cd-inspection-label mb-1.5">
                      <Phone size={13} className="text-emerald-400" /> Inspector Contact Number
                    </label>
                    <div className="cd-inspection-input text-white font-medium">
                      {assessorPhone ? (assessorPhone.startsWith('+') ? assessorPhone : `+91 ${assessorPhone}`) : '9746512243'}
                    </div>
                  </div>
                </div>

                {/* Inspection Checklist */}
                <div>
                  <label className="cd-inspection-label mb-1">
                    <ClipboardCheck size={13} className="text-emerald-400" /> Inspection Checklist
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Scope of on-site assessment to be conducted prior to quotation:
                  </p>
                  <div className="cd-checklist-grid">
                    {checklistItems.map((chk) => {
                      const isActive = activeChecklist.includes(chk);
                      return (
                        <div
                          key={chk}
                          className={`cd-checklist-card ${isActive ? 'checked' : 'unchecked'}`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                            isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-600 text-transparent'
                          }`}>
                            {isActive ? '✓' : ''}
                          </div>
                          <span className="truncate">{chk}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Access / Instructions for Inspector */}
                <div>
                  <label className="cd-inspection-label mb-1.5">
                    <FileText size={13} className="text-emerald-400" /> Access / Instructions for Inspector
                  </label>
                  <div className="cd-inspection-textarea text-slate-200 leading-relaxed text-xs sm:text-sm" style={{ minHeight: '85px' }}>
                    {ins.notes || 'Please ensure estate access gate is open and property boundaries are accessible.'}
                  </div>
                </div>

                {/* Preparation Tip for Landowner */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-slate-300">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="text-white">Notice for Landowner:</strong> The contractor is visiting the property only to inspect and assess trees, terrain, and boundaries before preparing a quotation. No tree cutting will take place during this visit.
                  </span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="cd-schedule-modal-footer">
                {assessorPhone ? (
                  <a
                    href={`tel:${assessorPhone}`}
                    className="mr-auto text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1.5 font-semibold"
                  >
                    <Phone size={13} /> Call Inspector (+91 {assessorPhone})
                  </a>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => setSelectedVisitModal(null)}
                  className="cd-btn-modal-cancel"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVisitModal(null);
                    navigate('/landowner/harvest-requests', { state: { highlightRequestId: reqId } });
                  }}
                  className="cd-btn-confirm-schedule"
                >
                  <Calendar size={14} /> View in Harvest Requests
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* REVISION REQUEST COUNTER-OFFER MODAL */}
      {revisionModalReq && (
        <RevisionRequestModal
          request={revisionModalReq.req}
          assessment={revisionModalReq.assessment}
          contractorName={revisionModalReq.req?.assigned_contractor_name || 'Rohith kumar'}
          onClose={() => setRevisionModalReq(null)}
          onSubmit={(reasons, notes, counterAmount, counterDate) => {
            handleAssessmentAction(
              revisionModalReq.req?.id || revisionModalReq.req?._id,
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

      {/* DIGITAL HARVEST AGREEMENT MODAL */}
      {selectedAgreementModal && (
        <DigitalAgreementModal
          request={selectedAgreementModal.req}
          assessment={selectedAgreementModal.assessment}
          onClose={() => setSelectedAgreementModal(null)}
        />
      )}

      {/* RECORD ADVANCE PAYMENT MODAL */}
      {selectedRecordPaymentModal && (
        <RecordAdvancePaymentModal
          request={selectedRecordPaymentModal}
          onClose={() => setSelectedRecordPaymentModal(null)}
          onSubmit={(data) => handleRecordAdvancePayment(selectedRecordPaymentModal.id || selectedRecordPaymentModal._id, data)}
        />
      )}
    </div>

  );
};

export default LandownerDashboard;
