import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowRight,
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trees, 
  Filter, 
  Search, 
  X, 
  Download, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw,
  Coins,
  ChevronRight,
  Printer,
  Sparkles
} from 'lucide-react';
import harvestService from '../../services/harvestService';
import { formatINR } from '../../utils/timberCalculations';
import './LandownerDashboard.css';
import './LandownerPayments.css';

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [detailsPayment, setDetailsPayment] = useState(null);
  const [copiedRef, setCopiedRef] = useState(null);

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
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(pReq => {
            if (!reqsToProcess.find(r => (r.id || r._id) === (pReq.id || pReq._id))) {
              reqsToProcess.push(pReq);
            }
          });
        }
      }

      if (reqsToProcess.length > 0) {
        reqsToProcess.forEach(req => {
          const lEmail = user?.email?.toLowerCase().trim();
          const reqLEmail = String(req.owner_email || req.ownerEmail || req.userEmail || '').toLowerCase().trim();
          
          const isAssigned = Boolean(lEmail && reqLEmail && reqLEmail === lEmail);

          if (isAssigned) {
            // Consolidate payments
            const reqPayments = Array.isArray(req.payments) ? [...req.payments] : [];
            const latest = req.latest_payment || req.assessment?.latest_payment;
            if (latest && !reqPayments.find(p => (p.payment_id || p.id) === (latest.payment_id || latest.id))) {
              reqPayments.push(latest);
            }

            // If no specific payment objects exist but advance is verified, generate one
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

            // Calculate overall job financials
            const acceptedQuotation = Number(req.total_quotation_amount || req.total_quote || req.assessment?.total_quote || 110000);
            const totalPaidForJob = reqPayments
              .filter(p => p.status === 'COMPLETED' || p.status === 'VERIFIED' || p.status === 'PAID')
              .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
            const totalPendingForJob = Math.max(0, acceptedQuotation - totalPaidForJob);
            const isJobFullySettled = Boolean(req.is_fully_paid || totalPendingForJob <= 0);

            reqPayments.forEach(payment => {
              const isFinalPay = payment.payment_purpose === 'FINAL_PAYMENT' ||
                String(payment.reference_number || payment.ref || payment.transaction_reference || payment.payment_id || '').startsWith('PAY-FIN');
              const isTimber = payment.payment_purpose === 'TIMBER_PURCHASE_PAYOUT' || payment.payment_purpose === 'TIMBER_PURCHASE_SETTLEMENT';
              const paymentType = payment.type || (isTimber ? 'Timber Purchase Payout' : isFinalPay ? 'Final Contract Settlement' : 'Advance Mobilization (30%)');

              extractedPayments.push({
                id: payment.payment_id || payment.id || `txn_${Math.random().toString(36).substr(2, 9)}`,
                date: payment.paid_at || payment.recorded_at || payment.created_at || req.updated_at,
                amount: payment.amount || 0,
                type: paymentType,
                status: (payment.status === 'VERIFIED' || payment.status === 'PAID') ? 'COMPLETED' : (payment.status || 'COMPLETED'),
                jobName: req.property_details?.propertyName || req.propertyName || req.parcel || `Harvest Request #${String(req.id).slice(-6).toUpperCase()}`,
                ref: payment.reference_number || payment.payment_id || payment.id || 'N/A',
                contractorName: req.assigned_contractor_name || req.contractor_name || req.assignedContractorName || 'Assigned Contractor',
                reqId: req.id || req._id,
                overallAmount: acceptedQuotation,
                totalPaidForJob,
                totalPendingForJob,
                isJobFullySettled,
                paymentDetails: payment
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
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayments();
  };

  const handleCopyRef = (refText) => {
    if (!refText) return;
    navigator.clipboard.writeText(refText);
    setCopiedRef(refText);
    setTimeout(() => {
      setCopiedRef(null);
    }, 2000);
  };

  const uniqueContractors = Array.from(new Set(payments.map(p => p.contractorName))).filter(Boolean);

  const contractorStats = uniqueContractors.map(name => {
    const userPayments = payments.filter(pay => pay.contractorName === name);
    const r = userPayments.filter(pay => pay.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);
    const p = userPayments.filter(pay => pay.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);
    return { name, totalReceived: r, totalPending: p, count: userPayments.length };
  });

  const handleDownloadReceipt = (payment) => {
    setReceiptPayment(payment);
  };

  const handleViewDetails = (payment) => {
    setDetailsPayment(payment);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filtered Payments
  const filteredPayments = payments.filter(payment => {
    // Contractor filter
    if (selectedContractor !== 'ALL' && payment.contractorName !== selectedContractor) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'ALL' && payment.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchJob = String(payment.jobName || '').toLowerCase().includes(q);
      const matchContractor = String(payment.contractorName || '').toLowerCase().includes(q);
      const matchRef = String(payment.ref || '').toLowerCase().includes(q);
      const matchType = String(payment.type || '').toLowerCase().includes(q);
      if (!matchJob && !matchContractor && !matchRef && !matchType) {
        return false;
      }
    }
    return true;
  });

  const totalPaid = payments.filter(p => p.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPendingBalance = payments.reduce((acc, curr) => acc + (curr.totalPendingForJob || 0), 0);
  const totalTransactionsCount = payments.length;

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />
        
        <div className="landowner-dashboard-workspace">
          <div className="lopay-container">
            
            {/* 1. Hero Header Banner */}
            <section className="lopay-hero-card">
              <div className="lopay-hero-left">
                <div className="lopay-hero-badge">
                  <span className="lopay-pulse-dot"></span>
                  Financial Overview & Disbursements
                </div>
                <h1 className="lopay-hero-heading">Payment Details & Ledger</h1>
                <p className="lopay-hero-subtext">
                  Track advance mobilizations, milestone disbursements, and settlement transactions for certified timber harvests.
                </p>
              </div>

              <div className="lopay-hero-actions">
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="lopay-btn-secondary"
                  title="Refresh payment records"
                >
                  <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-[#34d399]' : ''} />
                  <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
                </button>

                <button 
                  onClick={() => navigate('/landowner/harvest-operations')}
                  className="lopay-btn-primary"
                >
                  <span>Harvest Operations</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </section>

            {/* 2. Top Executive Metric Cards */}
            <section className="lopay-metrics-grid">
              {/* Card 1: Total Paid Outflow */}
              <div className="lopay-metric-card lopay-card-emerald">
                <div>
                  <div className="lopay-metric-header">
                    <span className="lopay-metric-label">Total Mobilized / Paid</span>
                    <div className="lopay-icon-badge lopay-icon-emerald">
                      <IndianRupee size={20} />
                    </div>
                  </div>
                  <div className="lopay-metric-value">{formatINR(totalPaid)}</div>
                </div>
                <div className="lopay-metric-footer">
                  <ShieldCheck size={14} className="text-[#34d399]" />
                  <span className="text-[#34d399]">100% Razorpay Escrow Verified</span>
                </div>
              </div>

              {/* Card 2: Pending Balance Commitments */}
              <div className="lopay-metric-card lopay-card-amber">
                <div>
                  <div className="lopay-metric-header">
                    <span className="lopay-metric-label">Remaining Balance</span>
                    <div className="lopay-icon-badge lopay-icon-amber">
                      <Coins size={20} />
                    </div>
                  </div>
                  <div className="lopay-metric-value">{formatINR(totalPendingBalance)}</div>
                </div>
                <div className="lopay-metric-footer">
                  <Clock size={14} className="text-[#fbbf24]" />
                  <span>Due upon harvest completion & timber dispatch</span>
                </div>
              </div>

              {/* Card 3: Total Transactions Count */}
              <div className="lopay-metric-card lopay-card-blue">
                <div>
                  <div className="lopay-metric-header">
                    <span className="lopay-metric-label">Audited Records</span>
                    <div className="lopay-icon-badge lopay-icon-blue">
                      <CreditCard size={20} />
                    </div>
                  </div>
                  <div className="lopay-metric-value">{totalTransactionsCount}</div>
                </div>
                <div className="lopay-metric-footer">
                  <CheckCircle2 size={14} className="text-[#60a5fa]" />
                  <span>Digital tax invoices generated</span>
                </div>
              </div>
            </section>

            {/* 3. Milestone Cashflow Flow Banner */}
            <section className="lopay-flow-card">
              <div className="lopay-flow-header">
                <div className="lopay-flow-title">
                  <Sparkles size={16} />
                  Harvest Payment Workflow Lifecycle
                </div>
                <span className="text-xs text-[#9ca3af]">TreeConnect Standard Commercial Milestones</span>
              </div>

              <div className="lopay-flow-steps">
                {/* Step 1 */}
                <div className="lopay-step-item completed">
                  <div className="lopay-step-num">✓</div>
                  <div className="lopay-step-content">
                    <span className="lopay-step-label">Stage 1: Advance Mobilization</span>
                    <span className="lopay-step-desc">30% upfront on work agreement sign-off</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="lopay-step-item active">
                  <div className="lopay-step-num">2</div>
                  <div className="lopay-step-content">
                    <span className="lopay-step-label">Stage 2: Felling & Processing</span>
                    <span className="lopay-step-desc">Field operations tracked stage-by-stage</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="lopay-step-item upcoming">
                  <div className="lopay-step-num">3</div>
                  <div className="lopay-step-content">
                    <span className="lopay-step-label">Stage 3: Final Settlement</span>
                    <span className="lopay-step-desc">70% remaining balance upon timber dispatch</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Controls: Search, Contractor Chips & Status Filters */}
            <section className="lopay-controls-card">
              <div className="lopay-controls-row">
                {/* Search Bar */}
                <div className="lopay-search-wrap">
                  <Search size={16} className="lopay-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search property, contractor, or ref..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="lopay-search-input"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="lopay-search-clear"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`lopay-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                  >
                    All Statuses
                  </button>
                  <button
                    onClick={() => setStatusFilter('COMPLETED')}
                    className={`lopay-pill-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                  >
                    <CheckCircle2 size={13} className="text-[#34d399]" />
                    Completed
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDING')}
                    className={`lopay-pill-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                  >
                    <Clock size={13} className="text-[#fbbf24]" />
                    Pending
                  </button>
                </div>
              </div>

              {/* Contractor Filter Row */}
              {uniqueContractors.length > 0 && (
                <div className="flex items-center gap-3 pt-2 border-t border-[#10b981]/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9ca3af] shrink-0">
                    <Filter size={13} /> Contractor:
                  </div>

                  <div className="lopay-contractor-pills">
                    <button
                      onClick={() => setSelectedContractor('ALL')}
                      className={`lopay-pill-btn ${selectedContractor === 'ALL' ? 'active' : ''}`}
                    >
                      All ({payments.length})
                    </button>

                    {contractorStats.map(stat => (
                      <button
                        key={stat.name}
                        onClick={() => setSelectedContractor(stat.name)}
                        className={`lopay-pill-btn ${selectedContractor === stat.name ? 'active' : ''}`}
                      >
                        <span className="lopay-pill-avatar">
                          {stat.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{stat.name}</span>
                        <span className="lopay-pill-count">({stat.count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filter Summary Bar */}
              {(searchQuery || selectedContractor !== 'ALL' || statusFilter !== 'ALL') && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#10b981]/10 text-[#9ca3af]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                    Showing <strong className="text-[#34d399]">{filteredPayments.length}</strong> of <strong>{payments.length}</strong> payments
                    {selectedContractor !== 'ALL' && <span> for contractor <strong className="text-white">{selectedContractor}</strong></span>}
                    {statusFilter !== 'ALL' && <span> with status <strong className="text-white">{statusFilter}</strong></span>}
                    {searchQuery && <span> matching "<strong className="text-white">{searchQuery}</strong>"</span>}
                  </span>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedContractor('ALL');
                      setStatusFilter('ALL');
                    }}
                    className="text-[#34d399] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X size={12} /> Reset Filters
                  </button>
                </div>
              )}
            </section>

            {/* 5. Transactions Ledger Section */}
            <section className="lopay-transactions-section">
              <div className="lopay-section-header">
                <h2 className="lopay-section-title">
                  <Clock size={18} className="text-[#34d399]" />
                  Disbursement Ledger
                </h2>
                <span className="text-xs text-[#9ca3af]">
                  {filteredPayments.length} {filteredPayments.length === 1 ? 'transaction' : 'transactions'} found
                </span>
              </div>

              {loading ? (
                <div className="lopay-empty-card">
                  <Loader2 className="animate-spin text-[#34d399]" size={36} />
                  <span className="text-sm text-[#9ca3af]">Loading verified transactions...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="lopay-empty-card">
                  <div className="lopay-empty-icon">
                    <AlertCircle size={28} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-bold text-white">No transactions match your criteria.</p>
                    <p className="text-xs text-[#9ca3af]">
                      Try clearing search terms or selecting "All" in the contractor filters.
                    </p>
                  </div>
                  {(searchQuery || selectedContractor !== 'ALL' || statusFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedContractor('ALL');
                        setStatusFilter('ALL');
                      }}
                      className="lopay-btn-secondary text-xs"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredPayments.map(payment => (
                    <article key={payment.id} className="lopay-card">
                      
                      {/* Top Row: Property, Contractor & Amount */}
                      <div className="lopay-card-top">
                        <div className="lopay-card-identity">
                          <div className="lopay-card-avatar">
                            <Trees size={22} />
                          </div>

                          <div className="lopay-card-title-group">
                            <h3 className="lopay-card-title">{payment.jobName}</h3>
                            <div className="lopay-card-subline">
                              <span className="lopay-contractor-tag">
                                <ShieldCheck size={13} /> {payment.contractorName}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(payment.date).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount & Status Pill */}
                        <div className="lopay-card-amount-block">
                          <div className="lopay-card-amount-val">{formatINR(payment.amount)}</div>
                          {payment.status === 'COMPLETED' || payment.status === 'PAID' ? (
                            <span className="lopay-status-badge lopay-status-completed">
                              <CheckCircle2 size={13} /> Completed
                            </span>
                          ) : (
                            <span className="lopay-status-badge lopay-status-pending">
                              <Clock size={13} /> Pending Verification
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="lopay-card-details-grid">
                        <div className="lopay-info-item">
                          <span className="lopay-info-label">Payment Purpose</span>
                          <span className="lopay-info-value">{payment.type}</span>
                        </div>

                        <div className="lopay-info-item">
                          <span className="lopay-info-label">Transaction Reference</span>
                          <button 
                            onClick={() => handleCopyRef(payment.ref)}
                            className="lopay-ref-copy-btn"
                            title="Click to copy reference"
                          >
                            <span>{payment.ref}</span>
                            {copiedRef === payment.ref ? (
                              <Check size={12} className="text-[#34d399]" />
                            ) : (
                              <Copy size={12} className="text-[#9ca3af]" />
                            )}
                          </button>
                        </div>

                        <div className="lopay-info-item">
                          <span className="lopay-info-label">Contract Commitment</span>
                          <div className="lopay-job-progress">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#34d399] font-bold">{formatINR(payment.totalPaidForJob)} Paid</span>
                              <span className="text-[#9ca3af]">{formatINR(payment.overallAmount)} Total</span>
                            </div>
                            <div className="lopay-progress-track">
                              <div 
                                className="lopay-progress-fill"
                                style={{
                                  width: `${Math.min(100, Math.round((payment.totalPaidForJob / (payment.overallAmount || 1)) * 100))}%`
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="lopay-card-actions">
                        {payment.totalPendingForJob > 0 && !payment.isJobFullySettled && (
                          <button 
                            onClick={() => navigate(`/landowner/harvest-operations`)}
                            className="lopay-btn-settle"
                          >
                            <CreditCard size={15} />
                            <span>Pay Pending Balance ({formatINR(payment.totalPendingForJob)})</span>
                          </button>
                        )}

                        <button 
                          onClick={() => handleDownloadReceipt(payment)}
                          className="lopay-btn-receipt"
                        >
                          <FileText size={15} />
                          <span>View Official Receipt</span>
                        </button>

                        <button 
                          onClick={() => handleViewDetails(payment)}
                          className="lopay-btn-details"
                        >
                          <ArrowUpRight size={15} />
                          <span>Financial Breakdown</span>
                        </button>
                      </div>

                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>

      {/* =========================================================================
          RECEIPT MODAL (Optimized for Screen & Print)
          ========================================================================= */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0b1410] border border-[#1b3826] rounded-[24px] w-full max-w-[540px] overflow-hidden flex flex-col shadow-2xl max-h-[calc(100dvh-32px)] print-receipt-container">
            
            {/* Modal Header (Hidden on Print) */}
            <div className="flex items-center justify-between p-6 border-b border-[#1b3826] print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#12281c] border border-[#1b432a] flex items-center justify-center text-[#34d399]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Receipt</h3>
                  <p className="text-xs text-[#9ca3af]">Official Transaction Voucher</p>
                </div>
              </div>
              <button 
                onClick={() => setReceiptPayment(null)}
                className="w-9 h-9 rounded-full bg-[#12281c] border border-[#1b432a] flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Body */}
            <div className="p-6 sm:p-8 flex-1 overflow-y-auto">
              
              {/* Success Badge & Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#10b981]/15 border border-[#10b981]/30 mb-3 text-[#34d399]">
                  <CheckCircle2 size={30} />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Payment Completed</h2>
                <p className="text-xs text-[#34d399] font-medium mt-0.5">Automated Razorpay Reconciled Voucher</p>
              </div>

              {/* Amount Box */}
              <div className="bg-[#0e1d15] border border-[#1b3826] rounded-2xl p-5 mb-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider">Amount Disbursed</span>
                  <span className="text-xs text-[#34d399] font-semibold flex items-center gap-1">
                    <ShieldCheck size={13} /> Secured Escrow
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-black text-[#34d399] tracking-tight">
                    {formatINR(receiptPayment.amount)}
                  </span>
                  <span className="text-xs text-[#9ca3af]">INR (Inclusive of Taxes)</span>
                </div>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="flex flex-col border border-[#1b3826] rounded-2xl divide-y divide-[#1b3826] bg-[#07110c]/80 text-sm">
                
                <div className="flex justify-between items-center p-4">
                  <span className="text-[#9ca3af] text-xs font-semibold">Transaction Date</span>
                  <span className="text-white font-mono font-bold text-xs">
                    {new Date(receiptPayment.date).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="text-[#9ca3af] text-xs font-semibold">Reference ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-xs">{receiptPayment.ref}</span>
                    <button 
                      onClick={() => handleCopyRef(receiptPayment.ref)}
                      className="text-[#34d399] hover:text-white print:hidden"
                      title="Copy Ref"
                    >
                      {copiedRef === receiptPayment.ref ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="text-[#9ca3af] text-xs font-semibold">Disbursement Type</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#10b981]/15 text-[#34d399] text-xs font-bold border border-[#10b981]/30">
                    {receiptPayment.type}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="text-[#9ca3af] text-xs font-semibold">Assigned Contractor</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-[#10b981]/20 text-[#34d399] flex items-center justify-center text-[10px] font-bold">
                      {receiptPayment.contractorName ? receiptPayment.contractorName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className="text-white font-bold text-xs">{receiptPayment.contractorName}</span>
                    <ShieldCheck size={13} className="text-[#34d399]" />
                  </div>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="text-[#9ca3af] text-xs font-semibold">Property Project</span>
                  <span className="text-white font-bold text-xs truncate max-w-[200px] text-right">
                    {receiptPayment.jobName}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="text-[#9ca3af] text-xs font-semibold">Payment Gateway</span>
                  <span className="text-white font-semibold text-xs flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#34d399]" /> Razorpay Secured
                  </span>
                </div>
              </div>

              {/* Informative Note */}
              <div className="mt-5 bg-[#0a1610] border border-[#173022] rounded-xl p-4 flex items-start gap-3 print:hidden">
                <AlertCircle size={17} className="text-[#34d399] shrink-0 mt-0.5" />
                <p className="text-xs text-[#9ca3af] leading-relaxed">
                  Disbursed against Feasible for Harvesting Certificate. Timber parcel boundaries and preliminary timber volumes verified on-site by certified contractor.
                </p>
              </div>

            </div>

            {/* Modal Actions (Hidden on Print) */}
            <div className="p-6 border-t border-[#1b3826] bg-[#07110c] flex gap-3 print:hidden">
              <button
                onClick={() => setReceiptPayment(null)}
                className="lopay-btn-secondary flex-1 justify-center"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="lopay-btn-primary flex-[1.5] justify-center"
              >
                <Printer size={16} />
                <span>Download / Print PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          FINANCIAL BREAKDOWN MODAL
          ========================================================================= */}
      {detailsPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-[#0b1410] border border-[#1b3826] rounded-2xl w-full max-w-[580px] overflow-hidden flex flex-col shadow-2xl max-h-[calc(100dvh-32px)]">
            
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-[#1b3826]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#142838] border border-[#1e3c54] flex items-center justify-center text-[#60a5fa]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Project Financials</h3>
                  <p className="text-xs text-[#9ca3af]">Contract Summary & Remaining Due</p>
                </div>
              </div>
              <button 
                onClick={() => setDetailsPayment(null)}
                className="w-9 h-9 rounded-full bg-[#12281c] border border-[#1b432a] flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto flex flex-col gap-5">
              {/* Project Card */}
              <div className="bg-[#0e1d15] border border-[#1b3826] p-4 rounded-xl flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Property & Contractor</span>
                <p className="text-base font-bold text-white">{detailsPayment.jobName}</p>
                <p className="text-xs text-[#34d399] flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Assigned to {detailsPayment.contractorName}
                </p>
              </div>

              {/* Financial Metric Trio */}
              <div className="flex flex-col gap-3">
                {/* Total Agreed Quotation */}
                <div className="bg-[#07110c] border border-[#1b3826] rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/30 flex items-center justify-center text-[#60a5fa]">
                      <IndianRupee size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide block">Accepted Quotation</span>
                      <span className="text-[11px] text-[#9ca3af]">Total contract value</span>
                    </div>
                  </div>
                  <div className="text-xl font-black text-white">{formatINR(detailsPayment.overallAmount)}</div>
                </div>

                {/* Total Disbursed / Paid */}
                <div className="bg-[#07110c] border border-[#10b981]/30 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center text-[#34d399]">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#34d399] uppercase tracking-wide block">Mobilized & Disbursed</span>
                      <span className="text-[11px] text-[#9ca3af]">Completed payments</span>
                    </div>
                  </div>
                  <div className="text-xl font-black text-[#34d399]">{formatINR(detailsPayment.totalPaidForJob)}</div>
                </div>

                {/* Pending Final Settlement */}
                <div className="bg-[#07110c] border border-[#f59e0b]/30 rounded-xl p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#f59e0b]/15 border border-[#f59e0b]/30 flex items-center justify-center text-[#fbbf24]">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#fbbf24] uppercase tracking-wide block">Pending Balance</span>
                      <span className="text-[11px] text-[#9ca3af]">To be settled upon completion</span>
                    </div>
                  </div>
                  <div className="text-xl font-black text-[#fbbf24]">{formatINR(detailsPayment.totalPendingForJob)}</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-[#0e1d15] border border-[#1b3826] p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white">Financial Settlement Progress</span>
                  <span className="text-[#34d399]">
                    {Math.min(100, Math.round((detailsPayment.totalPaidForJob / (detailsPayment.overallAmount || 1)) * 100))}% Settled
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round((detailsPayment.totalPaidForJob / (detailsPayment.overallAmount || 1)) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Transaction Spec Block */}
              <div className="bg-[#07110c] border border-[#1b3826] rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#9ca3af] block">Transaction ID:</span>
                  <span className="font-mono text-white font-bold break-all">{detailsPayment.ref}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af] block">Payment Purpose:</span>
                  <span className="text-white font-bold">{detailsPayment.type}</span>
                </div>
                <div>
                  <span className="text-[#9ca3af] block">Disbursement Date:</span>
                  <span className="text-white font-bold">
                    {new Date(detailsPayment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[#9ca3af] block">Payment Gateway:</span>
                  <span className="text-[#34d399] font-bold">Razorpay Escrow</span>
                </div>
              </div>

            </div>
            
            <div className="p-4 border-t border-[#1b3826] bg-[#07110c] flex gap-3">
              {detailsPayment.totalPendingForJob > 0 && !detailsPayment.isJobFullySettled && (
                <button
                  onClick={() => {
                    setDetailsPayment(null);
                    navigate('/landowner/harvest-operations');
                  }}
                  className="lopay-btn-primary flex-1 justify-center"
                >
                  <CreditCard size={15} />
                  <span>Pay Balance ({formatINR(detailsPayment.totalPendingForJob)})</span>
                </button>
              )}
              <button
                onClick={() => setDetailsPayment(null)}
                className="lopay-btn-secondary flex-1 justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PaymentsPage;
