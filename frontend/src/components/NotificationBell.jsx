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
  ArrowRight
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
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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
  const containerRef = useRef(null);

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
        // Filter requests submitted by this landowner
        matched = combined.filter(r => {
          if (!r || r.status === 'CANCELLED' || r.status === 'DELETED') return false;
          if (isFakeOrMockRequest(r)) return false;

          const rEmail = String(r.userEmail || r.landowner_email || r.landownerEmail || r.ownerEmail || '').toLowerCase().trim();
          const rId = String(r.landowner_id || r.landownerId || r.owner_id || '');

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

  // Derive ONLY real notifications from real assigned requests
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
        // 1. Contractor submitted quotation / assessment
        if (req.status === 'ASSESSMENT_SUBMITTED' || (req.assessment && (req.assessment.total_quote || req.assessment.total_quote_inr))) {
          list.push({
            id: `quote_${reqId}`,
            reqId,
            title: 'Quotation Received',
            text: `${contractorName} submitted timber assessment & quotation for ${propName}.`,
            time: getRelativeTime(req.assessment?.submitted_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.assessment?.submitted_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'quote'
          });
        }

        // 2. Inspection Reschedule Request
        if (req.site_inspection?.reschedule_status === 'REQUESTED' || req.inspection_status === 'RESCHEDULE_REQUESTED') {
          list.push({
            id: `resched_${reqId}`,
            reqId,
            title: 'Inspection Reschedule Requested',
            text: `${contractorName} requested to reschedule site inspection for ${propName}.`,
            time: getRelativeTime(req.site_inspection?.reschedule_requested_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.site_inspection?.reschedule_requested_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'reschedule'
          });
        }

        // 3. Advance payment verified
        const adv = req.advance_payment;
        if (adv && (adv.verified || adv.status === 'VERIFIED' || adv.verified_by)) {
          const amt = adv.amount ? `₹ ${formatINR(adv.amount)}` : '';
          list.push({
            id: `pay_${reqId}`,
            reqId,
            title: 'Advance Payment Verified',
            text: `Advance Payment ${amt ? `of ${amt} ` : ''}verified for ${propName}.`,
            time: getRelativeTime(adv.verified_at || adv.payment_date || req.updated_at || req.updatedAt),
            timestamp: new Date(adv.verified_at || adv.payment_date || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'payment'
          });
        }

        // 4. Harvesting In Progress
        if (req.status === 'IN_PROGRESS') {
          list.push({
            id: `prog_${reqId}`,
            reqId,
            title: 'Harvesting In Progress',
            text: `Harvesting operations are actively underway for ${propName}.`,
            time: getRelativeTime(req.operation_started_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.operation_started_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'progress'
          });
        }
      } else {
        // Contractor notifications
        // 1. Advance payment verified (live real payment)
        const adv = req.advance_payment;
        if (adv && (adv.verified || adv.status === 'VERIFIED' || adv.verified_by)) {
          const amt = adv.amount ? `₹ ${formatINR(adv.amount)}` : '';
          list.push({
            id: `pay_${reqId}`,
            reqId,
            title: 'Advance Payment Verified',
            text: `Advance Payment ${amt ? `of ${amt} ` : ''}verified for ${propName}.`,
            time: getRelativeTime(adv.verified_at || adv.payment_date || req.updated_at || req.updatedAt),
            timestamp: new Date(adv.verified_at || adv.payment_date || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'payment'
          });
        }

        // 2. Quotation accepted / Agreement signed (live real status)
        if (req.status === 'ASSESSMENT_ACCEPTED' || req.status === 'OPERATION_READY' || req.agreement_status === 'SIGNED' || req.agreement_signed) {
          list.push({
            id: `agree_${reqId}`,
            reqId,
            title: 'Quotation Accepted',
            text: `Landowner '${ownerName}' accepted your quotation for ${propName}.`,
            time: getRelativeTime(req.agreement_signed_at || req.accepted_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.agreement_signed_at || req.accepted_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'agreement'
          });
        }

        // 3. Revision requested (live real status)
        if (req.status === 'REVISION_REQUESTED') {
          list.push({
            id: `rev_${reqId}`,
            reqId,
            title: 'Revision Requested',
            text: `Landowner '${ownerName}' requested revisions for ${propName}.`,
            time: getRelativeTime(req.revision_requested_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.revision_requested_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'revision'
          });
        }

        // 4. Contractor assigned (live real assignment)
        if (req.status === 'CONTRACTOR_ASSIGNED') {
          list.push({
            id: `assign_${reqId}`,
            reqId,
            title: 'New Harvest Job Assigned',
            text: `New assignment: ${propName} assigned to you for inspection and quotation.`,
            time: getRelativeTime(req.assigned_at || req.created_at || req.createdAt),
            timestamp: new Date(req.assigned_at || req.created_at || req.createdAt || 0).getTime(),
            type: 'assignment'
          });
        }

        // 5. Active harvesting in progress
        if (req.status === 'IN_PROGRESS') {
          list.push({
            id: `prog_${reqId}`,
            reqId,
            title: 'Harvesting In Progress',
            text: `Harvesting operations are actively underway for ${propName}.`,
            time: getRelativeTime(req.operation_started_at || req.updated_at || req.updatedAt),
            timestamp: new Date(req.operation_started_at || req.updated_at || req.updatedAt || 0).getTime(),
            type: 'progress'
          });
        }
      }
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [assignedRequests, user?.role]);

  const handleNotificationClick = () => {
    setIsOpen(false);
    if ((user?.role || '').toLowerCase() === 'landowner') {
      navigate('/landowner/harvest-requests');
    } else {
      navigate('/contractor/assigned-jobs');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment':
        return <DollarSign size={15} />;
      case 'agreement':
      case 'quote':
        return <CheckCircle2 size={15} />;
      case 'assignment':
        return <FileText size={15} />;
      case 'revision':
      case 'reschedule':
        return <AlertCircle size={15} />;
      case 'progress':
        return <Truck size={15} />;
      default:
        return <Bell size={15} />;
    }
  };

  const getNotificationIconClass = (type) => {
    switch (type) {
      case 'payment':
        return 'bg-amber-500/15 border-amber-500/35 text-amber-400';
      case 'agreement':
      case 'quote':
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400';
      case 'assignment':
        return 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400';
      case 'revision':
      case 'reschedule':
        return 'bg-orange-500/15 border-orange-500/35 text-orange-400';
      case 'progress':
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400';
      default:
        return 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400';
    }
  };

  const isLandowner = (user?.role || '').toLowerCase() === 'landowner';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* NOTIFICATION BELL ICON BUTTON (CLEAN CUTOUT NOTCH) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLiveRequests();
        }}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          isOpen
            ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.35)]'
            : 'bg-[#06150c] hover:bg-[#0a2013] border border-emerald-500/25 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-200 shadow-sm'
        }`}
        title="Live Notifications"
        aria-label="View live notifications"
      >
        <Bell size={18} className="transition-transform hover:scale-105" />
        {liveNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black border-2 border-[#06150c] flex items-center justify-center shadow-md animate-pulse">
            {liveNotifications.length}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER (HIGH CONTRAST, OPAQUE, SHARP BORDERS & CARDS) */}
      {isOpen && (
        <div
          className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} mt-2.5 w-[min(384px,calc(100vw-24px))] max-w-[calc(100vw-24px)] bg-[#06140b] border border-emerald-500/35 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(16,185,129,0.15)] p-3.5 sm:p-4 z-[9999] animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bell size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  Live Notifications
                </h4>
                <p className="text-[10px] text-emerald-400/80 font-medium">Real-time status updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {liveNotifications.length > 0 && (
                <span className="text-[10px] font-mono font-extrabold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/25">
                  {liveNotifications.length} Active
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body List */}
          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent mb-2" />
                <p>Checking live notifications...</p>
              </div>
            ) : liveNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2.5">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-bold text-white">All Caught Up</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Real-time notifications for quotations, payments, and site contracts will appear here.
                </p>
              </div>
            ) : (
              liveNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={handleNotificationClick}
                  className="p-3 rounded-xl bg-gradient-to-br from-[#081a10] to-[#040e08] hover:from-[#0c2417] hover:to-[#07160d] border border-emerald-500/25 hover:border-emerald-500/50 transition-all cursor-pointer flex gap-3 group shadow-sm"
                >
                  {/* Distinct Category Icon Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getNotificationIconClass(n.type)}`}>
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                        <Clock size={10} className="text-emerald-500/70" />
                        {n.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {n.text}
                    </p>
                    <div className="pt-0.5">
                      <span className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                        {isLandowner ? 'View Harvest Request' : 'View Assigned Job'}
                        <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer CTA */}
          {liveNotifications.length > 0 && (
            <div className="pt-3 mt-3 border-t border-emerald-500/20 text-center">
              <button
                type="button"
                onClick={handleNotificationClick}
                className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{isLandowner ? 'Open Harvest Requests Page' : 'Open Assigned Jobs Page'}</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
