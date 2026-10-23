import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import harvestService from '../services/harvestService';
import { formatINR } from '../utils/timberCalculations';

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

export const useNotifications = () => {
  const { user } = useAuth();
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(`tc_read_notifs_${user?.email || 'default'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync readIds to localStorage
  useEffect(() => {
    if (user?.email) {
      try {
        localStorage.setItem(`tc_read_notifs_${user.email}`, JSON.stringify(readIds));
      } catch (e) {}
    }
  }, [readIds, user?.email]);

  const fetchLiveRequests = useCallback(async () => {
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
      } catch (e) {}

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
      console.warn('useNotifications fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLiveRequests();

    const handleUpdate = () => fetchLiveRequests();
    window.addEventListener('treeconnect_harvest_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('treeconnect_harvest_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchLiveRequests]);

  // Derived Notifications Array
  const notifications = useMemo(() => {
    if (!assignedRequests || assignedRequests.length === 0) return [];

    const isLandowner = (user?.role || '').toLowerCase() === 'landowner';
    const list = [];

    assignedRequests.forEach(req => {
      const propName = req.property_name || req.propertyName || `Job #${String(req.id || req._id || '').slice(-6).toUpperCase()}`;
      const contractorName = req.assigned_contractor_name || req.contractor_name || 'Assigned Contractor';
      const reqId = req.id || req._id;

      if (isLandowner) {
        // 1. Advance Due
        const advReq = req.advance_payment_request || req.assessment?.advance_payment_request;
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
            category: 'payments',
            badge: 'Action Required',
            badgeVariant: 'amber',
            actionLabel: 'Pay Advance Now',
            actionPath: '/landowner/payments'
          });
        }

        // 2. Advance Verified
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
            category: 'payments',
            badge: 'Verified',
            badgeVariant: 'emerald',
            actionLabel: 'View Payment',
            actionPath: '/landowner/payments'
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
            category: 'agreements',
            badge: 'Contract Active',
            badgeVariant: 'cyan',
            actionLabel: 'View Agreement',
            actionPath: '/landowner/harvest-agreements'
          });
        }

        // 4. Site Inspection Feasible
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
            category: 'inspections',
            badge: 'Feasible',
            badgeVariant: 'emerald',
            actionLabel: 'View Inspection',
            actionPath: '/landowner/harvest-requests'
          });
        }

        // 5. Quotation received
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
            category: 'payments',
            badge: 'Quotation',
            badgeVariant: 'violet',
            actionLabel: 'View Proposal',
            actionPath: '/landowner/harvest-requests'
          });
        }

        // 6. Harvesting In Progress
        if (req.status === 'IN_PROGRESS') {
          list.push({
            id: `prog_${reqId}`,
            reqId,
            title: 'Harvest Operations Underway',
            text: `Contractor ${contractorName} has commenced active harvest operations for ${propName}.`,
            time: getRelativeTime(req.operation_started_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.operation_started_at || req.updated_at || req.updatedAt || 0).getTime() + 15000,
            type: 'progress',
            category: 'operations',
            badge: 'In Progress',
            badgeVariant: 'blue',
            actionLabel: 'Track Progress',
            actionPath: '/landowner/harvest-operations'
          });
        }

        // 7. Stages
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
                category: 'operations',
                badge: `Stage ${num}`,
                badgeVariant: 'emerald',
                actionLabel: 'View Milestone',
                actionPath: '/landowner/harvest-operations'
              });
            }
          }
        });
      }
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [assignedRequests, user?.role]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  const markAsRead = useCallback((id) => {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id]);
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(notifications.map(n => n.id));
  }, [notifications]);

  const clearAll = useCallback(() => {
    setReadIds(notifications.map(n => n.id));
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    readIds,
    loading,
    markAsRead,
    markAllAsRead,
    clearAll,
    refresh: fetchLiveRequests
  };
};

export default useNotifications;
