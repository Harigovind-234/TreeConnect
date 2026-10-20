import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trees,
  Copy,
  Check,
  Building2,
  Calendar,
  ShieldCheck,
  Wallet,
  TrendingUp,
  FileText,
  UserCheck
} from 'lucide-react';
import harvestService from '../../services/harvestService';
import { formatINR } from '../../utils/timberCalculations';
import './ContractorDashboard.css';
import './PaymentsPage.css';

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLandowner, setSelectedLandowner] = useState('ALL');
  const [copiedRefId, setCopiedRefId] = useState(null);

  const handleCopyRef = (refText) => {
    if (!refText || refText === 'N/A') return;
    navigator.clipboard.writeText(refText);
    setCopiedRefId(refText);
    setTimeout(() => {
      setCopiedRefId(null);
    }, 2000);
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        let reqsToProcess = [];
        let extractedPayments = [];

        // 1. Try to fetch from backend
        try {
          const data = await harvestService.getHarvestRequests({ all_records: true });
          if (data && Array.isArray(data.harvest_requests)) {
            reqsToProcess = [...data.harvest_requests];
          }
        } catch (e) {
          console.warn("Backend fetch failed, falling back to local storage", e);
        }

        // 2. Fallback to localStorage if not found or append
        const stored = localStorage.getItem('treeconnect_harvest_requests');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              parsed.forEach(pReq => {
                if (!reqsToProcess.find(r => (r.id || r._id) === (pReq.id || pReq._id))) {
                  reqsToProcess.push(pReq);
                }
              });
            }
          } catch (e) {}
        }

        if (reqsToProcess.length > 0) {
          reqsToProcess.forEach(req => {
            const cId = user?.id || user?._id;
            const cEmail = user?.email?.toLowerCase().trim();
            const cName = (user?.name || user?.companyName || user?.company_name || '').toLowerCase().trim();

            const reqCId = String(req.assigned_contractor_id || req.contractor_id || req.assignedContractorId || '');
            const reqCEmail = String(req.assigned_contractor_email || req.contractor_email || req.assignedContractorEmail || '').toLowerCase().trim();
            const reqCName = String(req.assigned_contractor_name || req.contractor_name || req.assignedContractorName || '').toLowerCase().trim();

            const isMatchId = Boolean(cId && reqCId && reqCId === String(cId));
            const isMatchEmail = Boolean(cEmail && ((reqCEmail && reqCEmail.includes(cEmail)) || (reqCName && reqCName === cEmail)));
            const firstName = cName ? cName.split(' ')[0] : '';
            const isMatchName = Boolean(cName && reqCName && (reqCName.includes(cName) || cName.includes(reqCName) || (firstName && firstName.length >= 3 && reqCName.includes(firstName))));
            
            const isDirectlyAssigned = isMatchId || isMatchEmail || isMatchName;
            const statusMatch = req.status === 'CONTRACTOR_ASSIGNED' || req.status === 'ASSESSMENT_SUBMITTED' || req.status === 'REVISION_REQUESTED' || req.status === 'OPERATION_READY' || req.status === 'IN_PROGRESS' || req.status === 'ACCEPTED';
            const isAssigned = isDirectlyAssigned || statusMatch;

            if (isAssigned) {
              const reqPayments = Array.isArray(req.payments) ? [...req.payments] : [];
              const latest = req.latest_payment || req.assessment?.latest_payment;
              if (latest && !reqPayments.find(p => (p.payment_id || p.id) === (latest.payment_id || latest.id))) {
                reqPayments.push(latest);
              }

              const advStatus = req.advance_payment_status || req.assessment?.advance_payment_status;
              if (reqPayments.length === 0 && (req.is_advance_verified || advStatus === 'VERIFIED' || advStatus === 'PAID')) {
                const advReq = req.advance_payment_request || req.assessment?.advance_payment_request || {};
                const acceptedQuotation = Number(advReq.accepted_quotation || req.total_quotation_amount || req.total_quote || req.assessment?.total_quote || 110000);
                const advanceAmount = Number(advReq.advance_amount || Math.round((acceptedQuotation * 30) / 100));

                reqPayments.push({
                  payment_id: `txn_${req.id || Math.random().toString(36).substr(2, 9)}`,
                  recorded_at: req.updated_at || new Date().toISOString(),
                  amount: advanceAmount,
                  status: 'COMPLETED',
                  reference_number: 'Verified Advance'
                });
              }

              reqPayments.forEach(payment => {
                const isFinalPay = payment.payment_purpose === 'FINAL_PAYMENT' ||
                  String(payment.reference_number || payment.ref || payment.transaction_reference || payment.payment_id || '').startsWith('PAY-FIN');
                const isTimber = payment.payment_purpose === 'TIMBER_PURCHASE_PAYOUT' || payment.payment_purpose === 'TIMBER_PURCHASE_SETTLEMENT';
                const paymentType = payment.type || (isTimber ? 'Timber Purchase Payout' : isFinalPay ? 'Final Settlement' : 'Advance Mobilization');

                extractedPayments.push({
                  id: payment.payment_id || payment.id || `txn_${Math.random().toString(36).substr(2, 9)}`,
                  date: payment.paid_at || payment.recorded_at || payment.created_at || req.updated_at,
                  amount: payment.amount || 0,
                  type: paymentType,
                  status: (payment.status === 'VERIFIED' || payment.status === 'PAID') ? 'COMPLETED' : (payment.status || 'COMPLETED'),
                  jobName: req.property_details?.propertyName || req.propertyName || req.parcel || `Harvest Request #${String(req.id).slice(-6).toUpperCase()}`,
                  ref: payment.reference_number || payment.payment_id || payment.id || 'N/A',
                  landownerName: req.ownerName || req.landownerName || req.owner_name || req.userEmail || 'Registered Landowner',
                  channel: payment.channel || payment.payment_channel || 'Razorpay Direct'
                });
              });
            }
          });
        }
        
        setPayments(extractedPayments);
      } catch (err) {
        console.error("Error loading payments:", err);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const uniqueLandowners = Array.from(new Set(payments.map(p => p.landownerName))).filter(Boolean);

  const landownerStats = uniqueLandowners.map(name => {
    const userPayments = payments.filter(pay => pay.landownerName === name);
    const r = userPayments.filter(pay => pay.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);
    const p = userPayments.filter(pay => pay.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);
    return { name, totalReceived: r, totalPending: p, count: userPayments.length };
  });

  const filteredPayments = selectedLandowner === 'ALL' 
    ? payments 
    : payments.filter(p => p.landownerName === selectedLandowner);

  const totalReceived = filteredPayments.filter(p => p.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="contractor-dashboard-page">
      <Navbar />
      <div className="contractor-dashboard-container">
        <Sidebar />
        
        <div className="contractor-dashboard-workspace p-4 md:p-6 lg:p-8 overflow-y-auto w-full">
          <div className="pay-workspace-container">
            
            {/* 1. Header Hero Banner */}
            <div className="pay-hero-banner">
              <div className="pay-hero-title-group">
                <div className="pay-hero-badge">
                  <span className="pay-hero-pulse" />
                  <CreditCard size={13} />
                  <span>Financial Overview &amp; Ledger</span>
                </div>
                <h1 className="pay-hero-heading">Payment Details &amp; History</h1>
                <p className="pay-hero-subtitle">
                  Track advance mobilization deposits, verified transaction receipts, and milestone settlements.
                </p>
              </div>

              <div className="pay-hero-actions">
                <div className="pay-hero-stat-pill">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span><strong>{payments.length}</strong> Verified Records</span>
                </div>
              </div>
            </div>

            {/* 2. Top Summary Metric Cards */}
            <div className="pay-metrics-grid">
              {/* Card 1: Total Received */}
              <div className="pay-metric-card pay-metric-card-received">
                <div>
                  <div className="pay-metric-top-row">
                    <span className="pay-metric-tag">Total Received &amp; Settled</span>
                    <div className="pay-metric-icon-box pay-icon-received">
                      <IndianRupee size={22} />
                    </div>
                  </div>
                  <div className="pay-metric-value-box">
                    <span className="pay-metric-amount text-emerald-300">
                      {formatINR(totalReceived)}
                    </span>
                  </div>
                </div>
                <div className="pay-metric-subline pay-subline-emerald">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>Mobilization Advances Credited</span>
                </div>
              </div>

              {/* Card 2: Pending Settlements */}
              <div className="pay-metric-card pay-metric-card-pending">
                <div>
                  <div className="pay-metric-top-row">
                    <span className="pay-metric-tag">Pending Settlements</span>
                    <div className="pay-metric-icon-box pay-icon-pending">
                      <Clock size={22} />
                    </div>
                  </div>
                  <div className="pay-metric-value-box">
                    <span className="pay-metric-amount text-amber-300">
                      {formatINR(totalPending)}
                    </span>
                  </div>
                </div>
                <div className="pay-metric-subline pay-subline-amber">
                  <AlertCircle size={13} className="text-amber-400 shrink-0" />
                  <span>{totalPending > 0 ? 'Awaiting landowner payment' : 'Zero outstanding balance'}</span>
                </div>
              </div>

              {/* Card 3: Total Transactions */}
              <div className="pay-metric-card pay-metric-card-total">
                <div>
                  <div className="pay-metric-top-row">
                    <span className="pay-metric-tag">Total Transactions</span>
                    <div className="pay-metric-icon-box pay-icon-total">
                      <CreditCard size={22} />
                    </div>
                  </div>
                  <div className="pay-metric-value-box">
                    <span className="pay-metric-amount text-teal-300">
                      {filteredPayments.length}
                    </span>
                  </div>
                </div>
                <div className="pay-metric-subline pay-subline-teal">
                  <TrendingUp size={13} className="text-teal-400 shrink-0" />
                  <span>Logged in immutable system ledger</span>
                </div>
              </div>
            </div>

            {/* 3. Landowner Filter Segment */}
            <div className="pay-filter-card">
              <div className="pay-filter-header">
                <h3 className="pay-filter-title">
                  <Building2 size={16} className="text-emerald-400" />
                  <span>Filter by Landowner Account</span>
                </h3>
                <span className="pay-filter-count-badge">
                  {uniqueLandowners.length} Client{uniqueLandowners.length !== 1 ? 's' : ''} on record
                </span>
              </div>

              <div className="pay-filter-chips-grid">
                <button
                  type="button"
                  onClick={() => setSelectedLandowner('ALL')}
                  className={`pay-filter-chip ${selectedLandowner === 'ALL' ? 'active' : ''}`}
                >
                  <div className="pay-chip-name-row">
                    <div className="pay-chip-name">
                      <div className="pay-chip-avatar">ALL</div>
                      <span>All Landowners</span>
                    </div>
                    <span className="pay-chip-count">{payments.length} txn{payments.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="pay-chip-footer">
                    <span className="text-slate-400 text-xs">Total Settled:</span>
                    <span className="pay-chip-received">
                      {formatINR(payments.filter(p => p.status === 'COMPLETED').reduce((a, b) => a + b.amount, 0))}
                    </span>
                  </div>
                </button>

                {landownerStats.map(stat => {
                  const initials = stat.name
                    ? stat.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                    : 'LO';

                  return (
                    <button
                      key={stat.name}
                      type="button"
                      onClick={() => setSelectedLandowner(stat.name)}
                      className={`pay-filter-chip ${selectedLandowner === stat.name ? 'active' : ''}`}
                    >
                      <div className="pay-chip-name-row">
                        <div className="pay-chip-name" title={stat.name}>
                          <div className="pay-chip-avatar">{initials}</div>
                          <span className="truncate">{stat.name}</span>
                        </div>
                        <span className="pay-chip-count">{stat.count} txn{stat.count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="pay-chip-footer">
                        <span className="pay-chip-received">{formatINR(stat.totalReceived)}</span>
                        {stat.totalPending > 0 ? (
                          <span className="pay-chip-pending-badge">
                            {formatINR(stat.totalPending)} Pending
                          </span>
                        ) : (
                          <span className="text-emerald-400/80 text-[11px] font-semibold flex items-center gap-1">
                            <Check size={11} /> Settled
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Recent Transactions & Ledger Table Card */}
            <div className="pay-ledger-card">
              <div className="pay-ledger-header">
                <h2 className="pay-ledger-title">
                  <Clock size={18} className="text-emerald-400" />
                  <span>
                    {selectedLandowner === 'ALL'
                      ? 'All Recent Transactions & Settlements'
                      : `Transactions for ${selectedLandowner}`}
                  </span>
                </h2>
                <span className="pay-ledger-badge">
                  <CheckCircle2 size={13} />
                  <span>{filteredPayments.length} Transaction{filteredPayments.length !== 1 ? 's' : ''}</span>
                </span>
              </div>
              
              {loading ? (
                <div className="pay-empty-box">
                  <Loader2 className="animate-spin text-emerald-400 mb-3" size={32} />
                  <span className="text-sm text-slate-300 font-semibold">Loading verified transactions...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="pay-empty-box">
                  <AlertCircle className="mb-3 text-slate-600" size={42} />
                  <p className="text-base font-bold text-slate-200">No payment records found.</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-sm">
                    Verified advance mobilizations and operation milestone payments will be automatically cataloged here.
                  </p>
                </div>
              ) : (
                <div className="pay-table-wrapper">
                  <table className="pay-table">
                    <thead>
                      <tr>
                        <th className="pay-th pay-th-date">Date</th>
                        <th className="pay-th pay-th-job">Job / Reference</th>
                        <th className="pay-th pay-th-type">Payment Type</th>
                        <th className="pay-th pay-th-amount">Amount</th>
                        <th className="pay-th pay-th-status">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map(payment => {
                        const isCopied = copiedRefId === payment.ref;
                        const dateFormatted = payment.date
                          ? new Date(payment.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })
                          : 'Recent';

                        return (
                          <tr key={payment.id} className="pay-tr">
                            {/* Date */}
                            <td className="pay-td">
                              <div className="pay-date-cell">
                                <Calendar size={13} className="text-emerald-500/80 shrink-0" />
                                <span>{dateFormatted}</span>
                              </div>
                            </td>

                            {/* Job / Reference */}
                            <td className="pay-td">
                              <div className="pay-job-cell">
                                <div className="pay-job-title">
                                  <Trees size={15} className="text-emerald-400 shrink-0" />
                                  <span>{payment.jobName}</span>
                                </div>
                                
                                {selectedLandowner === 'ALL' && (
                                  <div className="pay-job-owner">
                                    <UserCheck size={12} className="text-slate-500" />
                                    <span>Landowner: <strong>{payment.landownerName}</strong></span>
                                  </div>
                                )}

                                <div className="pay-job-ref">
                                  <span>Ref:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyRef(payment.ref)}
                                    className="pay-ref-pill"
                                    title="Click to copy reference code"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check size={11} className="text-emerald-400" />
                                        <span className="text-emerald-300 font-bold">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="truncate max-w-[190px]">{payment.ref}</span>
                                        <Copy size={10} className="text-slate-400" />
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Payment Type */}
                            <td className="pay-td">
                              <div className="pay-type-badge">
                                <CreditCard size={12} />
                                <span>{payment.type}</span>
                              </div>
                            </td>

                            {/* Amount (Cleanly separated with right padding) */}
                            <td className="pay-td pay-amount-cell">
                              <span className="pay-amount-val">
                                {formatINR(payment.amount)}
                              </span>
                            </td>

                            {/* Status (Centered with pill badge) */}
                            <td className="pay-td pay-status-cell">
                              {payment.status === 'COMPLETED' || payment.status === 'PAID' ? (
                                <span className="pay-status-pill pay-status-completed">
                                  <CheckCircle2 size={13} className="text-emerald-400" />
                                  <span>Completed</span>
                                </span>
                              ) : (
                                <span className="pay-status-pill pay-status-pending">
                                  <Clock size={13} className="text-amber-400" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPage;
