import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, CheckCircle2, FileText, DollarSign, ExternalLink, X } from 'lucide-react';
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

      // Filter only real requests assigned to this contractor
      const matched = combined.filter(r => {
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

    const list = [];

    assignedRequests.forEach(req => {
      const propName = req.property_name || req.propertyName || `Job #${String(req.id || req._id || '').slice(-6).toUpperCase()}`;
      const ownerName = req.ownerName || req.landownerName || 'Landowner';
      const reqId = req.id || req._id;

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
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [assignedRequests]);

  const handleNotificationClick = () => {
    setIsOpen(false);
    navigate('/contractor/assigned-jobs');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* NOTIFICATION BELL ICON BUTTON */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLiveRequests();
        }}
        className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-[#06150c] border-emerald-500/30 text-emerald-400 hover:text-white hover:border-emerald-400 hover:bg-emerald-500/10'
        }`}
        title="Live Notifications"
        aria-label="View live notifications"
      >
        <Bell size={18} />
        {liveNotifications.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
            {liveNotifications.length}
          </span>
        )}
      </button>

      {/* DROPDOWN POPOVER */}
      {isOpen && (
        <div
          className={`absolute ${dropdownAlign === 'left' ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-96 bg-[#07170e] border border-emerald-500/30 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Live Notifications
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {liveNotifications.length} Live
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Fetching live notifications...
              </div>
            ) : liveNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-2.5">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-300">No Live Notifications</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Real-time updates for assigned harvesting requests and verified payments will appear here.
                </p>
              </div>
            ) : (
              liveNotifications.map(n => (
                <div
                  key={n.id}
                  onClick={handleNotificationClick}
                  className="p-3 rounded-xl bg-black/40 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col gap-1.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-medium shrink-0">
                      {n.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {n.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {liveNotifications.length > 0 && (
            <div className="pt-3 mt-3 border-t border-emerald-500/20 text-center">
              <button
                type="button"
                onClick={handleNotificationClick}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                View Assigned Jobs <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
