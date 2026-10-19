import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  FileText,
  DollarSign,
  ExternalLink,
  X,
  Clock,
  Truck,
  ArrowRight,
  Camera,
  Layers,
  RotateCw,
  CheckCheck,
  CreditCard,
  FileCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import harvestService from '../services/harvestService';

const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'Recently';
  try {
    const now = new Date();
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Recently';
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch (e) {
    return 'Recently';
  }
};

const formatINR = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Number(val).toLocaleString('en-IN');
};

const isFakeOrMockRequest = (r) => {
  if (!r) return true;
  const rId = String(r.id || r._id || '');
  const pId = String(r.property_id || r.propertyId || '');
  const mockIds = ['test_commercial_plot_001', 'p_1', 'p_2', 'inv_1', 'inv_2', 'hr_1', 'job_demo'];
  if (mockIds.includes(rId) || mockIds.includes(pId)) return true;

  const owner = String(r.ownerName || r.landownerName || r.userEmail || '').toLowerCase();
  const prop = String(r.propertyName || '').toLowerCase();
  if (owner.includes('landowner george') || prop.includes('rubber & teak estate parcel')) return true;
  return false;
};

const NotificationBell = ({ className = '', dropdownAlign = 'right' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`tc_read_notifs_${user?.email || 'default'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const containerRef = useRef(null);

  // Sync readIds to localStorage
  useEffect(() => {
    if (user?.email) {
      try {
        localStorage.setItem(`tc_read_notifs_${user.email}`, JSON.stringify(readIds));
      } catch (e) {}
    }
  }, [readIds, user?.email]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real live requests from backend and local storage
  const fetchLiveRequests = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const storedUserStr = localStorage.getItem('treeconnect_user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      const currentUser = user || storedUser;

      const cId = currentUser?.id || currentUser?._id || '';
      const cEmail = (currentUser?.email || '').toLowerCase().trim();
      const cName = (currentUser?.fullName || currentUser?.name || currentUser?.companyName || '').toLowerCase().trim();

      let backendRequests = [];
      try {
        const data = await harvestService.getHarvestRequests({ all_records: true });
        if (data && Array.isArray(data.harvest_requests)) {
          backendRequests = data.harvest_requests.filter(r => !isFakeOrMockRequest(r));
        }
      } catch (e) {
        // Fallback silently
      }

      let localRequests = [];
      try {
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localRequests = parsed.filter(r => !isFakeOrMockRequest(r));
          }
        }
      } catch (e) {}

      const allMap = new Map();
      [...backendRequests, ...localRequests].forEach(r => {
        const rId = r?.id || r?._id;
        if (rId && !allMap.has(rId) && !isFakeOrMockRequest(r)) {
          allMap.set(rId, r);
        }
      });

      const combined = Array.from(allMap.values());
      const isLandowner = (currentUser?.role || user?.role || '').toLowerCase() === 'landowner';
      const isContractor = (currentUser?.role || user?.role || '').toLowerCase() === 'contractor';

      let matched = [];
      if (isContractor) {
        // Filter only real requests assigned to this contractor
        matched = combined.filter(r => {
          if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;
          if (isFakeOrMockRequest(r)) return false;

          const reqCId = String(r.assigned_contractor_id || r.contractor_id || r.assignedContractorId || '');
          const reqCEmail = String(r.assigned_contractor_email || r.contractor_email || r.assignedContractorEmail || '').toLowerCase().trim();
          const reqCName = String(r.assigned_contractor_name || r.contractor_name || r.assignedContractorName || '').toLowerCase().trim();

          const isMatchId = Boolean(cId && reqCId && (reqCId === String(cId) || (currentUser?._id && reqCId === String(currentUser._id))));
          const isMatchEmail = Boolean(cEmail && (
            (reqCEmail && (reqCEmail === cEmail || reqCEmail.includes(cEmail) || cEmail.includes(reqCEmail))) ||
            (reqCName && reqCName === cEmail)
          ));

          const firstName = cName ? cName.split(' ')[0] : '';
          const reqFirstName = reqCName ? reqCName.split(' ')[0] : '';
          const isMatchName = Boolean(cName && reqCName && (
            reqCName === cName ||
            reqCName.includes(cName) ||
            cName.includes(reqCName) ||
            (firstName && firstName.length >= 3 && reqCName.includes(firstName)) ||
            (reqFirstName && reqFirstName.length >= 3 && cName.includes(reqFirstName))
          ));

          return isMatchId || isMatchEmail || isMatchName;
        });
      } else if (isLandowner) {
        // Filter requests submitted by this landowner (including owner_email)
        matched = combined.filter(r => {
          if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;
          if (isFakeOrMockRequest(r)) return false;

          const rEmail = String(r.owner_email || r.userEmail || r.landowner_email || r.landownerEmail || r.ownerEmail || '').toLowerCase().trim();
          const rId = String(r.landowner_id || r.landownerId || r.owner_id || r.ownerId || r.userId || '');

          const isMatchEmail = Boolean(cEmail && rEmail && (rEmail === cEmail || rEmail.includes(cEmail) || cEmail.includes(rEmail)));
          const isMatchId = Boolean(cId && rId && (rId === String(cId)));

          return isMatchEmail || isMatchId;
        });
      }

      setAssignedRequests(matched);
    } catch (err) {
      console.warn('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRequests();

    // Listen for live harvest request or payment updates across the app
    const handleUpdate = () => fetchLiveRequests();
    window.addEventListener('treeconnect_harvest_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('treeconnect_harvest_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  // Derive rich, actionable real-time notifications
  const liveNotifications = useMemo(() => {
    if (!assignedRequests || assignedRequests.length === 0) return [];

    const isLandowner = (user?.role || '').toLowerCase() === 'landowner';
    const list = [];

    assignedRequests.forEach(req => {
      const propName = req.property_name || req.propertyName || `Job #${String(req.id || req._id || '').slice(-6).toUpperCase()}`;
      const ownerName = req.ownerName || req.landownerName || 'Landowner';
      const contractorName = req.assigned_contractor_name || req.contractor_name || 'Assigned Contractor';
      const reqId = req.id || req._id;

      if (isLandowner) {
        // 1. Mobilization Advance Payment Pending (High Priority Action)
        const advReq = req.advance_payment_request || req.assessment?.advance_payment_request;
        const advStatus = req.advance_payment_status || advReq?.status;
        const isAdvanceVerified = Boolean(req.advance_payment?.verified || req.advance_payment?.status === 'VERIFIED' || req.is_advance_verified);
        const advAmount = advReq?.advance_amount || (req.total_quotation_amount ? Math.round(req.total_quotation_amount * 0.3) : 0);

        if (advReq && !isAdvanceVerified && advAmount > 0) {
          list.push({
            id: `adv_pending_${reqId}`,
            reqId,
            title: `Mobilization Advance Due: ₹${formatINR(advAmount)}`,
            text: `Contractor ${contractorName} requested ₹${formatINR(advAmount)} (30% advance) for ${propName}. Complete payment to begin tree harvest operations.`,
            time: getRelativeTime(advReq.requested_at || req.updated_at || req.updatedAt),
            timestamp: new Date(advReq.requested_at || req.updated_at || req.updatedAt || 0).getTime() + 10000,
            type: 'payment_pending',
            badge: 'Action Required',
            badgeVariant: 'amber',
            actionLabel: 'Pay Advance Now'
          });
        }

        // 2. Advance payment verified
        const adv = req.advance_payment;
        if (adv && (adv.verified || adv.status === 'VERIFIED' || adv.verified_by || isAdvanceVerified)) {
          const amt = adv?.amount ? `₹${formatINR(adv.amount)}` : (advAmount ? `₹${formatINR(advAmount)}` : '');
          list.push({
            id: `pay_ver_${reqId}`,
            reqId,
            title: 'Advance Payment Verified',
            text: `Advance Payment ${amt ? `of ${amt} ` : ''}verified for ${propName}. Work mobilization authorized.`,
            time: getRelativeTime(adv?.verified_at || adv?.payment_date || req.updated_at || req.updatedAt),
            timestamp: new Date(adv?.verified_at || adv?.payment_date || req.updated_at || req.updatedAt || 0).getTime() + 5000,
            type: 'payment_verified',
            badge: 'Verified',
            badgeVariant: 'emerald',
            actionLabel: 'View Payment'
          });
        }

        // 3. Digital Harvest Agreement Finalized
        const agr = req.digital_agreement;
        const isAgrFinalized = (agr && (agr.status === 'FINALIZED' || agr.terms_accepted || agr.ready_to_start)) || req.status === 'OPERATION_READY' || req.agreement_status === 'SIGNED';
        if (isAgrFinalized) {
          const agrId = agr?.agreement_id || `TC-AGR-${String(reqId).slice(-6).toUpperCase()}`;
          const agrAmount = agr?.total_agreed_amount || req.total_quotation_amount || req.total_quote;
          list.push({
            id: `agr_final_${reqId}`,
            reqId,
            title: 'Harvest Agreement Finalized',
            text: `Digital Contract (${agrId}) executed for ₹${formatINR(agrAmount)} with ${contractorName} for ${propName}.`,
            time: getRelativeTime(agr?.signed_at || req.agreement_signed_at || req.updated_at || req.updatedAt),
            timestamp: new Date(agr?.signed_at || req.agreement_signed_at || req.updated_at || req.updatedAt || 0).getTime() + 2000,
            type: 'agreement',
            badge: 'Contract Active',
            badgeVariant: 'cyan',
            actionLabel: 'View Agreement'
          });
        }

        // 4. Site Inspection Feasible & Certified
        const insp = req.site_inspection;
        if (insp && (insp.inspection_verdict === 'FEASIBLE' || req.site_inspected)) {
          const treeCount = req.verified_tree_count || req.tree_count || 1;
          const volume = req.estimated_harvestable_volume || 1.8;
          list.push({
            id: `insp_feas_${reqId}`,
            reqId,
            title: 'Site Inspection Approved: Feasible',
            text: `${contractorName} verified ${treeCount} tree${treeCount > 1 ? 's' : ''} (${volume} m³) and certified haul road access for ${propName}.`,
            time: getRelativeTime(insp.completed_at || req.inspected_at || req.updated_at || req.updatedAt),
            timestamp: new Date(insp.completed_at || req.inspected_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'inspection',
            badge: 'Feasible',
            badgeVariant: 'emerald',
            actionLabel: 'View Inspection'
          });
        }

        // 5. Contractor submitted quotation / assessment
        if (req.assessment && (req.assessment.total_quote || req.total_quotation_amount)) {
          const quoteAmt = req.assessment.total_quote || req.total_quotation_amount;
          list.push({
            id: `quote_${reqId}`,
            reqId,
            title: `Quotation Received: ₹${formatINR(quoteAmt)}`,
            text: `${contractorName} submitted commercial timber assessment and quotation for ${propName}.`,
            time: getRelativeTime(req.assessment.createdAt || req.assessment.submitted_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.assessment.createdAt || req.assessment.submitted_at || req.updated_at || req.updatedAt || 0).getTime() - 2000,
            type: 'quote',
            badge: 'Quotation',
            badgeVariant: 'violet',
            actionLabel: 'View Proposal'
          });
        }

        // 6. Inspection Reschedule Request
        if (req.site_inspection?.reschedule_status === 'REQUESTED' || req.inspection_status === 'RESCHEDULE_REQUESTED') {
          list.push({
            id: `resched_${reqId}`,
            reqId,
            title: 'Inspection Reschedule Requested',
            text: `${contractorName} requested to reschedule the site inspection for ${propName}.`,
            time: getRelativeTime(req.site_inspection?.reschedule_requested_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.site_inspection?.reschedule_requested_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'reschedule',
            badge: 'Reschedule',
            badgeVariant: 'orange',
            actionLabel: 'Review Date'
          });
        }

        // 7. Harvesting In Progress
        if (req.status === 'IN_PROGRESS') {
          list.push({
            id: `prog_${reqId}`,
            reqId,
            title: 'Harvest Operations Underway',
            text: `Contractor ${contractorName} has commenced active harvest operations for ${propName}.`,
            time: getRelativeTime(req.operation_started_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.operation_started_at || req.updated_at || req.updatedAt || 0).getTime() + 15000,
            type: 'progress',
            badge: 'In Progress',
            badgeVariant: 'blue',
            actionLabel: 'Track Progress'
          });
        }

        // 8. Stage milestone completions & contractor evidence submissions
        const stages = req.harvest_stages || {};
        const stageConfigs = [
          { key: 'stage_1', num: 1, name: 'Mobilization & Safety' },
          { key: 'stage_2', num: 2, name: 'Felling Operations' },
          { key: 'stage_3', num: 3, name: 'De-branching & Bucking' },
          { key: 'stage_4', num: 4, name: 'Scaling & Transit Prep' },
        ];

        stageConfigs.forEach(({ key, num, name }) => {
          const st = stages[key];
          if (st) {
            const rawStatus = String(st.status || '').toUpperCase().trim();
            const isCompleted = rawStatus === 'VERIFIED' || rawStatus === 'COMPLETED';
            const isSubmitted = rawStatus === 'SUBMITTED' || rawStatus === 'SUBMITTED_FOR_VERIFICATION';
            const hasMedia = Array.isArray(st.media) && st.media.length > 0;
            const updatedTime = st.verified_at || st.completed_at || st.submitted_at || st.updated_at || req.updated_at || req.updatedAt;

            if (isCompleted) {
              list.push({
                id: `stage_comp_${key}_${reqId}`,
                reqId,
                stageNum: num,
                title: `Stage ${num} Completed: ${name}`,
                text: `${contractorName} completed Stage ${num} (${name}) with verified logs for ${propName}.`,
                time: getRelativeTime(updatedTime),
                timestamp: new Date(updatedTime || 0).getTime() + 20000,
                type: 'stage_complete',
                badge: `Stage ${num}`,
                badgeVariant: 'emerald',
                actionLabel: 'View Milestone'
              });
            } else if (isSubmitted || hasMedia) {
              list.push({
                id: `stage_sub_${key}_${reqId}`,
                reqId,
                stageNum: num,
                title: `Stage ${num} Evidence: ${name}`,
                text: `${contractorName} uploaded work photos & evidence logs for Stage ${num} (${name}) at ${propName}.`,
                time: getRelativeTime(updatedTime),
                timestamp: new Date(updatedTime || 0).getTime() + 18000,
                type: 'stage_evidence',
                badge: `Evidence`,
                badgeVariant: 'teal',
                actionLabel: 'Review Evidence'
              });
            }
          }
        });
      } else {
        // Contractor notifications
        // 1. Advance payment requested / awaiting payment from landowner
        const advReq = req.advance_payment_request || req.assessment?.advance_payment_request;
        const isAdvanceVerified = Boolean(req.advance_payment?.verified || req.advance_payment?.status === 'VERIFIED' || req.is_advance_verified);
        if (advReq && !isAdvanceVerified) {
          const advAmount = advReq?.advance_amount || (req.total_quotation_amount ? Math.round(req.total_quotation_amount * 0.3) : 0);
          list.push({
            id: `c_adv_await_${reqId}`,
            reqId,
            title: `Mobilization Advance Awaiting Payment: ₹${formatINR(advAmount)}`,
            text: `Mobilization advance request of ₹${formatINR(advAmount)} submitted to ${ownerName} for ${propName}.`,
            time: getRelativeTime(advReq.requested_at || req.updated_at || req.updatedAt),
            timestamp: new Date(advReq.requested_at || req.updated_at || req.updatedAt || 0).getTime() + 8000,
            type: 'payment_pending',
            badge: 'Awaiting Payment',
            badgeVariant: 'amber',
            actionLabel: 'View Job Details'
          });
        }

        // 2. Advance payment verified (live real payment received)
        const adv = req.advance_payment;
        if (adv && (adv.verified || adv.status === 'VERIFIED' || adv.verified_by || isAdvanceVerified)) {
          const amt = adv?.amount ? `₹${formatINR(adv.amount)}` : '';
          list.push({
            id: `c_pay_ver_${reqId}`,
            reqId,
            title: 'Mobilization Advance Received!',
            text: `Advance Payment ${amt ? `of ${amt} ` : ''}verified for ${propName}. Work authorization active.`,
            time: getRelativeTime(adv?.verified_at || adv?.payment_date || req.updated_at || req.updatedAt),
            timestamp: new Date(adv?.verified_at || adv?.payment_date || req.updated_at || req.updatedAt || 0).getTime() + 6000,
            type: 'payment_verified',
            badge: 'Verified',
            badgeVariant: 'emerald',
            actionLabel: 'Open Assigned Job'
          });
        }

        // 3. Agreement signed / Quotation accepted
        const agr = req.digital_agreement;
        const isAgrFinalized = (agr && (agr.status === 'FINALIZED' || agr.terms_accepted || agr.ready_to_start)) || req.status === 'OPERATION_READY' || req.agreement_status === 'SIGNED';
        if (isAgrFinalized) {
          list.push({
            id: `c_agree_${reqId}`,
            reqId,
            title: 'Harvest Agreement Finalized',
            text: `Landowner '${ownerName}' finalized digital agreement for ${propName}. Ready for mobilization.`,
            time: getRelativeTime(agr?.signed_at || req.agreement_signed_at || req.updated_at || req.updatedAt),
            timestamp: new Date(agr?.signed_at || req.agreement_signed_at || req.updated_at || req.updatedAt || 0).getTime() + 3000,
            type: 'agreement',
            badge: 'Signed',
            badgeVariant: 'cyan',
            actionLabel: 'View Agreement'
          });
        }

        // 4. Site Inspection Feasible
        const insp = req.site_inspection;
        if (insp && (insp.inspection_verdict === 'FEASIBLE' || req.site_inspected)) {
          list.push({
            id: `c_insp_${reqId}`,
            reqId,
            title: 'Site Inspection Certified: Feasible',
            text: `On-site assessment completed and approved as feasible for ${propName}.`,
            time: getRelativeTime(insp.completed_at || req.inspected_at || req.updated_at || req.updatedAt),
            timestamp: new Date(insp.completed_at || req.inspected_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'inspection',
            badge: 'Certified',
            badgeVariant: 'emerald',
            actionLabel: 'View Inspection'
          });
        }

        // 5. Revision requested
        if (req.status === 'REVISION_REQUESTED') {
          list.push({
            id: `rev_${reqId}`,
            reqId,
            title: 'Revision Requested by Landowner',
            text: `Landowner '${ownerName}' requested revisions for ${propName}.`,
            time: getRelativeTime(req.revision_requested_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.revision_requested_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'revision',
            badge: 'Revision',
            badgeVariant: 'orange',
            actionLabel: 'Revise Quote'
          });
        }

        // 6. Contractor assigned
        if (req.status === 'CONTRACTOR_ASSIGNED') {
          list.push({
            id: `assign_${reqId}`,
            reqId,
            title: 'New Harvest Job Assigned',
            text: `New assignment: ${propName} assigned to you for inspection and quotation.`,
            time: getRelativeTime(req.assigned_at || req.created_at || req.createdAt),
            timestamp: new Date(req.assigned_at || req.created_at || req.createdAt || 0).getTime(),
            type: 'assignment',
            badge: 'New Job',
            badgeVariant: 'blue',
            actionLabel: 'Schedule Visit'
          });
        }

        // 7. Active harvesting in progress
        if (req.status === 'IN_PROGRESS') {
          list.push({
            id: `c_prog_${reqId}`,
            reqId,
            title: 'Operations Actively Underway',
            text: `Harvest operations in progress at ${propName}. Update stage milestones & logs.`,
            time: getRelativeTime(req.operation_started_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.operation_started_at || req.updated_at || req.updatedAt || 0).getTime() + 10000,
            type: 'progress',
            badge: 'In Progress',
            badgeVariant: 'blue',
            actionLabel: 'Log Stage Work'
          });
        }
      }
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [assignedRequests, user?.role]);

  // Unread calculations
  const unreadCount = useMemo(() => {
    return liveNotifications.filter(n => !readIds.includes(n.id)).length;
  }, [liveNotifications, readIds]);

  const displayedNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return liveNotifications.filter(n => !readIds.includes(n.id));
    }
    return liveNotifications;
  }, [liveNotifications, activeTab, readIds]);

  const markAllAsRead = () => {
    const allIds = liveNotifications.map(n => n.id);
    setReadIds(Array.from(new Set([...readIds, ...allIds])));
  };

  const handleNotificationClick = (notif) => {
    if (notif?.id && !readIds.includes(notif.id)) {
      setReadIds(prev => [...prev, notif.id]);
    }
    setIsOpen(false);

    const isLandowner = (user?.role || '').toLowerCase() === 'landowner';
    if (isLandowner) {
      if (notif?.type === 'payment_pending') {
        navigate(`/landowner/dashboard?focus=advance_payment`);
      } else if (notif?.type === 'stage_complete' || notif?.type === 'stage_evidence' || notif?.stageNum) {
        navigate(`/landowner/harvest-operations?requestId=${notif.reqId}&openStages=true`);
      } else if (notif?.type === 'agreement') {
        navigate(`/landowner/harvest-requests?requestId=${notif?.reqId || ''}&tab=agreement`);
      } else {
        navigate(`/landowner/harvest-requests?requestId=${notif?.reqId || ''}`);
      }
    } else {
      if (notif?.type === 'stage_complete' || notif?.type === 'stage_evidence' || notif?.stageNum) {
        navigate(`/contractor/assigned-jobs?requestId=${notif?.reqId || ''}&tab=stages`);
      } else {
        navigate(`/contractor/assigned-jobs?requestId=${notif?.reqId || ''}`);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_pending':
        return <CreditCard size={16} />;
      case 'payment_verified':
        return <DollarSign size={16} />;
      case 'agreement':
        return <FileCheck size={16} />;
      case 'inspection':
        return <CheckCircle2 size={16} />;
      case 'quote':
        return <FileText size={16} />;
      case 'stage_complete':
        return <CheckCircle2 size={16} />;
      case 'stage_evidence':
        return <Camera size={16} />;
      case 'reschedule':
        return <Calendar size={16} />;
      case 'progress':
        return <Truck size={16} />;
      case 'revision':
        return <AlertCircle size={16} />;
      case 'assignment':
        return <FileText size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getNotificationIconStyle = (type) => {
    switch (type) {
      case 'payment_pending':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'payment_verified':
        return 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
      case 'agreement':
        return 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]';
      case 'inspection':
        return 'bg-teal-500/15 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.2)]';
      case 'quote':
        return 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
      case 'stage_complete':
        return 'bg-emerald-500/20 border-emerald-500/45 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
      case 'stage_evidence':
        return 'bg-teal-500/20 border-teal-500/40 text-teal-300';
      case 'reschedule':
      case 'revision':
        return 'bg-orange-500/15 border-orange-500/40 text-orange-400';
      case 'progress':
      case 'assignment':
        return 'bg-blue-500/15 border-blue-500/40 text-blue-300';
      default:
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400';
    }
  };

  const getBadgeStyle = (variant) => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cyan':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'teal':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'violet':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'orange':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'blue':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  const isLandowner = (user?.role || '').toLowerCase() === 'landowner';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* NOTIFICATION BELL ICON BUTTON */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLiveRequests();
        }}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-500/20'
            : 'bg-[#08150c]/90 hover:bg-[#0c2014] border border-emerald-500/25 hover:border-emerald-400/60 text-emerald-400 hover:text-emerald-200 shadow-sm'
        }`}
        title="Live Notifications"
        aria-label="View live notifications"
      >
        <Bell size={18} className={`transition-transform duration-200 ${isOpen ? 'scale-110 text-emerald-300' : 'hover:scale-105'}`} />

        {/* Live Unread Badge with Pulsating Beacon */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-[18px] min-w-[18px] px-1 bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 text-[10px] font-black items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.6)] border border-slate-950">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div
          className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} top-full mt-2.5 w-[min(410px,calc(100vw-24px))] max-w-[calc(100vw-24px)] bg-[#07130b]/98 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl shadow-[0_25px_60px_-10px_rgba(0,0,0,0.95),0_0_35px_rgba(16,185,129,0.18)] z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Subtle Top Ambient Glow Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

          {/* Header */}
          <div className="p-4 pb-3 border-b border-emerald-500/20 bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                  Notifications
                </h4>
                <span className="text-[10px] font-mono font-bold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fetchLiveRequests()}
                  className={`p-1.5 text-slate-400 hover:text-emerald-300 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer ${loading ? 'animate-spin text-emerald-400' : ''}`}
                  title="Refresh live updates"
                  aria-label="Refresh live updates"
                >
                  <RotateCw size={13} />
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer flex items-center gap-1"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={12} />
                    <span>Read all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-emerald-500/10">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'all'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/35'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>All Updates</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-emerald-400">
                  {liveNotifications.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'unread'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/35'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Notification List Body */}
          <div className="flex flex-col gap-2 p-3 max-h-[380px] overflow-y-auto custom-scrollbar">
            {loading && liveNotifications.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '36px 16px',
                  textAlign: 'center'
                }}
              >
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-3" />
                <p className="text-xs font-medium text-slate-300">Synchronizing live notifications...</p>
              </div>
            ) : displayedNotifications.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '36px 20px',
                  textAlign: 'center'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}
                  className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  <CheckCheck size={22} />
                </div>
                <p className="text-xs font-bold text-white tracking-wide">
                  {activeTab === 'unread' ? 'No Unread Notifications' : 'All Caught Up'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                  {activeTab === 'unread'
                    ? 'All notifications have been reviewed. Switch to "All Updates" to view history.'
                    : 'Real-time alerts for advance payments, site inspections, and contracts will appear here.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map(n => {
                const isUnread = !readIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer flex gap-3 ${
                      isUnread
                        ? 'bg-gradient-to-br from-[#0c2415] to-[#07170e] border-emerald-500/40 hover:border-emerald-400 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(16,185,129,0.1)]'
                        : 'bg-[#09150e]/60 hover:bg-[#0c1f14]/80 border-emerald-500/15 hover:border-emerald-500/35'
                    }`}
                  >
                    {/* Unread Accent Indicator */}
                    {isUnread && (
                      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    )}

                    {/* Category Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getNotificationIconStyle(
                        n.type
                      )}`}
                    >
                      {getNotificationIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2 pr-3">
                        <span
                          className={`text-xs font-bold truncate leading-tight ${
                            isUnread ? 'text-white' : 'text-slate-200'
                          } group-hover:text-emerald-300 transition-colors`}
                        >
                          {n.title}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300/90 leading-relaxed font-normal line-clamp-2">
                        {n.text}
                      </p>

                      {/* Footer Metadata */}
                      <div className="flex items-center justify-between gap-2 pt-1 mt-0.5 border-t border-emerald-500/10">
                        <div className="flex items-center gap-1.5">
                          {n.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getBadgeStyle(
                                n.badgeVariant
                              )}`}
                            >
                              {n.badge}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock size={10} className="text-emerald-500/70" />
                            {n.time}
                          </span>
                        </div>

                        <span className="text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                          {n.actionLabel || (isLandowner ? 'View' : 'Open')}
                          <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-3 border-t border-emerald-500/20 bg-gradient-to-t from-white/[0.03] to-transparent text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (isLandowner) {
                  navigate('/landowner/harvest-requests');
                } else {
                  navigate('/contractor/assigned-jobs');
                }
              }}
              className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isLandowner ? 'View All Harvest Requests' : 'View All Assigned Jobs'}</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
