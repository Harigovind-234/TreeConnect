import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, ArrowUpRight, ArrowDownRight, IndianRupee, Clock, CheckCircle2, AlertCircle, Loader2, Trees, Filter, Search, X, Download, FileText } from 'lucide-react';
import harvestService from '../../services/harvestService';
import { formatINR } from '../../utils/timberCalculations';
import '../contractor/ContractorDashboard.css';

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState('ALL');
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [detailsPayment, setDetailsPayment] = useState(null);

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
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // merge unique
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

                reqPayments.forEach(payment => {
                  extractedPayments.push({
                    id: payment.payment_id || payment.id || `txn_${Math.random().toString(36).substr(2, 9)}`,
                    date: payment.paid_at || payment.recorded_at || payment.created_at || req.updated_at,
                    amount: payment.amount || 0,
                    type: payment.type || 'Advance Payment',
                    status: (payment.status === 'VERIFIED' || payment.status === 'PAID') ? 'COMPLETED' : (payment.status || 'COMPLETED'),
                    jobName: req.property_details?.propertyName || req.propertyName || req.parcel || `Harvest Request #${String(req.id).slice(-6).toUpperCase()}`,
                    ref: payment.reference_number || payment.payment_id || payment.id || 'N/A',
                    contractorName: req.assigned_contractor_name || req.contractor_name || req.assignedContractorName || 'Assigned Contractor',
                    reqId: req.id || req._id,
                    overallAmount: acceptedQuotation,
                    totalPaidForJob,
                    totalPendingForJob,
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
      }
    };

    fetchPayments();
  }, [user]);

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

  const filteredPayments = selectedContractor === 'ALL' 
    ? payments 
    : payments.filter(p => p.contractorName === selectedContractor);

  const totalReceived = filteredPayments.filter(p => p.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = filteredPayments.filter(p => p.status === 'PENDING').reduce((acc, curr) => acc + curr.amount, 0);


  return (
    <div className="contractor-dashboard-page !bg-[#070B08] text-[#F5F7F5] selection:bg-[#43C58A]/30 selection:text-white">
      <Navbar />
      <div className="contractor-dashboard-container">
        <Sidebar />
        
        <div className="contractor-dashboard-workspace">
          <main className="w-full flex flex-col gap-6 max-w-7xl mx-auto">
            
            {/* 1. Header Area */}
            <section className="flex flex-col gap-2 bg-[#101C14] border border-[#263B2E] rounded-2xl p-6 shadow-sm">
              <div className="inline-flex items-center gap-2 text-[#43C58A] text-xs font-bold uppercase tracking-wider bg-[#43C58A]/10 px-3 py-1 rounded-full w-fit border border-[#43C58A]/20">
                <CreditCard size={14} /> Financial Overview
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#F5F7F5] tracking-tight mt-1">Payment Details & History</h1>
              <p className="text-base text-[#9CAAA1]">
                Track advance mobilizations and milestone payments you've made to contractors.
              </p>
            </section>

            {/* 2. Financial Summary Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#101C14] border border-[#263B2E] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-[#43C58A]/30 transition-colors h-full">
                <div className="flex items-center gap-3 text-[#43C58A]">
                  <div className="p-2 bg-[#43C58A]/10 rounded-lg">
                    <IndianRupee size={20} className="shrink-0" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9CAAA1]">Total Paid</span>
                </div>
                <div className="text-3xl font-black text-[#F5F7F5]">{formatINR(totalReceived)}</div>
              </div>
              <div className="bg-[#101C14] border border-[#263B2E] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-[#F4B82E]/30 transition-colors h-full">
                <div className="flex items-center gap-3 text-[#F4B82E]">
                  <div className="p-2 bg-[#F4B82E]/10 rounded-lg">
                    <Clock size={20} className="shrink-0" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9CAAA1]">Pending Payments</span>
                </div>
                <div className="text-3xl font-black text-[#F5F7F5]">{formatINR(totalPending)}</div>
              </div>
              <div className="bg-[#101C14] border border-[#263B2E] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-sm hover:border-[#60A5FA]/30 transition-colors h-full">
                <div className="flex items-center gap-3 text-[#60A5FA]">
                  <div className="p-2 bg-[#60A5FA]/10 rounded-lg">
                    <CreditCard size={20} className="shrink-0" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9CAAA1]">Total Transactions</span>
                </div>
                <div className="text-3xl font-black text-[#F5F7F5]">{filteredPayments.length}</div>
              </div>
            </section>

            {/* 3. Secondary Layout: Contractor Filter */}
            <div className="flex flex-col xl:flex-row xl:items-center gap-4 bg-[#101C14] border border-[#263B2E] rounded-xl p-4">
              <div className="flex-1 max-w-md flex items-center gap-2 bg-[#070B08] border border-[#263B2E] rounded-lg px-3 py-2 focus-within:border-[#43C58A]/50 transition-colors">
                <Search size={16} className="text-[#9CAAA1] shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search by contractor name or ref..." 
                  className="w-full bg-transparent text-sm text-[#F5F7F5] focus:outline-none placeholder:text-[#9CAAA1]"
                />
              </div>

              <div className="hidden xl:block w-px h-8 bg-[#263B2E]"></div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
                <div className="flex items-center gap-1.5 text-[#9CAAA1] font-bold text-xs uppercase tracking-wider shrink-0">
                  <Filter size={14} /> Filter:
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedContractor('ALL')}
                      className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all border ${
                        selectedContractor === 'ALL'
                          ? 'bg-[#43C58A]/10 border-[#43C58A]/40 text-[#43C58A]'
                          : 'bg-[#070B08] border-[#263B2E] text-[#9CAAA1] hover:border-[#43C58A]/30 hover:text-[#F5F7F5]'
                      }`}
                    >
                      All ({payments.length})
                    </button>

                    {contractorStats.map(stat => (
                      <button
                        key={stat.name}
                        onClick={() => setSelectedContractor(stat.name)}
                        className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all border ${
                          selectedContractor === stat.name
                            ? 'bg-[#43C58A]/10 border-[#43C58A]/40 text-[#43C58A]'
                            : 'bg-[#070B08] border-[#263B2E] text-[#9CAAA1] hover:border-[#43C58A]/30 hover:text-[#F5F7F5]'
                        }`}
                      >
                        {stat.name} ({stat.count})
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* 4. Transactions List */}
            <section className="bg-[#101C14] border border-[#263B2E] rounded-2xl p-5 md:p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#263B2E]">
                <h2 className="text-lg font-bold text-[#F5F7F5] flex items-center gap-2">
                  <Clock size={18} className="text-[#43C58A]" /> Recent Transactions
                </h2>
              </div>
              
              {loading ? (
                <div className="p-16 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-[#43C58A] mb-4" size={32} />
                  <span className="text-sm text-[#9CAAA1]">Loading transactions...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-[#9CAAA1]">
                  <AlertCircle className="mb-3 opacity-50" size={40} />
                  <p className="text-base font-medium text-[#F5F7F5]">No payments recorded yet.</p>
                  <p className="text-sm mt-1">Transactions for this filter will appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredPayments.map(payment => (
                    <div key={payment.id} className="relative bg-[#070B08] border border-[#263B2E] hover:border-[#43C58A]/40 transition-colors rounded-xl p-5 flex flex-col gap-5">
                      
                      {/* Top row: Title and Status Button */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex flex-col gap-1.5">
                          <h3 className="text-base md:text-lg font-bold text-[#F5F7F5] tracking-tight">
                            {payment.jobName}
                          </h3>
                          <div className="text-sm text-[#9CAAA1] flex flex-wrap items-center gap-2">
                            {selectedContractor === 'ALL' && (
                              <>
                                <span className="font-medium text-[#F5F7F5]">{payment.contractorName}</span>
                                <span className="opacity-50">•</span>
                              </>
                            )}
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {new Date(payment.date).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="shrink-0">
                          {payment.status === 'COMPLETED' || payment.status === 'PAID' ? (
                            <div className="px-3 py-1.5 rounded-full border border-[#43C58A]/30 bg-[#43C58A]/10 text-[#43C58A] text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Completed
                            </div>
                          ) : (
                            <div className="px-3 py-1.5 rounded-full border border-[#F4B82E]/30 bg-[#F4B82E]/10 text-[#F4B82E] text-xs font-bold flex items-center gap-1.5">
                              <Clock size={14} /> Pending
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Inner Data Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#101C14] rounded-lg p-4 border border-[#263B2E]">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-[#9CAAA1] uppercase tracking-wider">Payment Type</span>
                          <span className="font-medium text-[#F5F7F5] text-sm">{payment.type}</span>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-[11px] font-bold text-[#9CAAA1] uppercase tracking-wider">Transaction Ref</span>
                          <span className="font-mono text-[#F5F7F5] text-sm truncate" title={payment.ref}>{payment.ref}</span>
                        </div>
                        <div className="flex flex-col gap-1 sm:text-right">
                          <span className="text-[11px] font-bold text-[#9CAAA1] uppercase tracking-wider">Amount</span>
                          <span className="font-black text-[#43C58A] text-lg tracking-tight">{formatINR(payment.amount)}</span>
                        </div>
                      </div>

                      {/* Bottom action row */}
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-1">
                         <button 
                           onClick={() => handleDownloadReceipt(payment)}
                           className="select-none flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-[#263B2E] bg-[#101C14] hover:border-[#43C58A]/50 hover:bg-[#43C58A]/10 text-[#F5F7F5] hover:text-[#43C58A] text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                         >
                           <Download size={16} /> Receipt
                         </button>
                         <button 
                           onClick={() => handleViewDetails(payment)}
                           className="select-none flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-[#263B2E] bg-[#101C14] hover:border-[#60A5FA]/50 hover:bg-[#60A5FA]/10 text-[#F5F7F5] hover:text-[#60A5FA] text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                         >
                           <ArrowUpRight size={16} /> Details
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </main>
        </div>
      </div>

      {/* Receipt Modal */}
      {receiptPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-[#0A100D] border border-[#172D21] rounded-[24px] w-full max-w-[520px] overflow-hidden flex flex-col shadow-2xl max-h-[calc(100dvh-24px)] print:border-none print:shadow-none print:bg-white print:text-black print:max-h-none print:w-full print:max-w-none">
            
            {/* Header (hidden on print) */}
            <div className="flex items-center justify-between p-6 lg:p-7 border-b border-[#172D21] print:hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#091F14] border border-[#133E26] flex items-center justify-center text-[#43C58A]">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#F5F7F5] leading-tight tracking-tight">Payment Receipt</h3>
                </div>
              </div>
              <button 
                onClick={() => setReceiptPayment(null)}
                className="w-10 h-10 rounded-full bg-[#121C17] flex items-center justify-center text-[#9CAAA1] hover:text-[#F5F7F5] hover:bg-[#1A2620] transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Area */}
            <div className="p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-[#43C58A] mb-5 print:border-green-600 bg-transparent">
                  <CheckCircle2 size={28} className="text-[#43C58A] print:text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-[#F5F7F5] print:text-black mb-2 tracking-tight">Payment Successful</h2>
                <p className="text-[#43C58A]/80 print:text-gray-600 text-sm">Confirmation for your records</p>
              </div>

              {/* Amount Box */}
              <div className="bg-[#0C1611] border border-[#172D21] print:bg-white print:border-gray-200 rounded-[20px] p-6 lg:p-7 mb-8 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-4">
                    <span className="text-[#9CAAA1] print:text-gray-500 font-bold uppercase tracking-[0.1em] text-xs">Amount Paid</span>
                    <div className="flex items-center gap-2 mt-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#43C58A]"></div>
                      <span className="text-xs text-[#43C58A] font-semibold">Paid via UPI • Auto Reconciled</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[34px] leading-none font-black text-[#43C58A] print:text-black tracking-tighter">{formatINR(receiptPayment.amount)}</span>
                    <span className="text-[11px] text-[#9CAAA1] mt-1">INR (Taxes Included)</span>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="flex flex-col border border-[#172D21] rounded-[20px] print:border-gray-200 divide-y divide-[#172D21]">
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Transaction Date</span>
                  <span className="text-[#F5F7F5] print:text-black text-sm font-bold font-mono text-right">
                    {new Date(receiptPayment.date).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }).replace(',', '')}
                  </span>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Ref Number</span>
                  <div className="flex items-center gap-3 justify-end min-w-0">
                    <span className="text-[#F5F7F5] print:text-black text-[13px] font-bold font-mono text-right truncate">{receiptPayment.ref}</span>
                    <button className="text-[#43C58A] hover:text-[#F5F7F5] print:hidden shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Payment Type</span>
                  <div className="px-3 py-1.5 rounded-full border border-[#133E26] bg-[#0A1A12] text-[#43C58A] text-xs font-bold text-right">
                    {receiptPayment.type}
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Contractor</span>
                  <div className="flex items-center gap-2 justify-end min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#0A1A12] border border-[#133E26] flex items-center justify-center text-[#43C58A] text-[10px] font-bold shrink-0">
                      {receiptPayment.contractorName ? receiptPayment.contractorName.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <span className="text-[#F5F7F5] print:text-black text-sm font-bold truncate">{receiptPayment.contractorName}</span>
                    <span className="flex items-center text-[#43C58A] text-[11px] ml-1 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Verified
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Project Name</span>
                  <div className="flex items-center gap-2 text-[#F5F7F5] font-bold text-sm justify-end min-w-0">
                    <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#43C58A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    <span className="truncate">{receiptPayment.jobName}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center p-5 lg:p-6 gap-4">
                  <span className="text-[#9CAAA1] print:text-gray-600 text-sm font-medium shrink-0">Payment Gateway</span>
                  <div className="flex items-center gap-2 text-[#F5F7F5] text-sm justify-end">
                    <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#43C58A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Razorpay Secure
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-[#0A1610] border border-[#172D21] rounded-2xl p-5 flex gap-4 print:hidden">
                <div className="text-[#43C58A] shrink-0 mt-0.5">
                  <AlertCircle size={18} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[#F5F7F5] text-[13px] font-bold tracking-wide">Timber Harvest Mobilization</span>
                  <span className="text-[#9CAAA1] text-xs leading-relaxed">
                    Disbursed against Feasible for Harvesting Certificate (ID: TC-HARV-101026). Timber parcel boundaries verified by Field Assessor {receiptPayment.contractorName}.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-2 bg-[#0A100D] print:hidden">
              <div className="border-t border-dashed border-[#172D21] w-full mb-6 lg:mb-8"></div>
              <div className="flex gap-4">
                <button
                  onClick={() => setReceiptPayment(null)}
                  className="select-none flex-1 py-4 rounded-[14px] font-bold text-sm bg-transparent border border-[#172D21] text-[#F5F7F5] hover:bg-[#121C17] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintReceipt}
                  className="select-none flex-[1.5] py-4 rounded-[14px] font-bold text-sm bg-[#6BFFB2] text-[#051A10] hover:bg-[#5AE59D] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#6BFFB2]/10"
                >
                  <Download size={18} /> Download / Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0C130F] border border-[#263B2E] rounded-2xl w-full max-w-[min(640px,100%)] overflow-hidden flex flex-col shadow-2xl max-h-[calc(100dvh-32px)]">
            
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-[#263B2E]">
              <h3 className="text-lg font-bold text-[#F5F7F5] flex items-center gap-2">
                <FileText size={18} className="text-[#60A5FA]" /> Job Financial Details
              </h3>
              <button 
                onClick={() => setDetailsPayment(null)}
                className="text-[#9CAAA1] hover:text-[#F5F7F5] p-1.5 rounded-full hover:bg-[#101C14] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto">
              {/* Header Info */}
              <div className="mb-6 bg-[#101C14] border border-[#263B2E] p-5 rounded-xl flex flex-col gap-1.5">
                <h4 className="text-xs font-bold text-[#9CAAA1] uppercase tracking-wider">Project</h4>
                <p className="text-xl font-bold text-[#F5F7F5] leading-tight break-words">{detailsPayment.jobName}</p>
                <p className="text-sm text-[#9CAAA1] mt-1">Contractor: <span className="font-semibold text-[#F5F7F5]">{detailsPayment.contractorName}</span></p>
              </div>

              <h4 className="text-xs font-bold text-[#9CAAA1] uppercase tracking-wider mb-3">Financial Breakdown</h4>
              <div className="flex flex-col gap-3">
                {/* Overall Amount */}
                <div className="bg-[#101C14] border border-[#263B2E] rounded-xl p-4 md:p-5 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#60A5FA]/10 flex items-center justify-center shrink-0">
                      <IndianRupee size={20} className="text-[#60A5FA]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#9CAAA1] uppercase tracking-wide">Overall Amount</span>
                      <span className="text-[11px] text-[#9CAAA1]/70">Total Quotation</span>
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[#F5F7F5] whitespace-nowrap">{formatINR(detailsPayment.overallAmount)}</div>
                </div>

                {/* Total Paid */}
                <div className="bg-[#101C14] border border-[#263B2E] rounded-xl p-4 md:p-5 flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#43C58A]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={20} className="text-[#43C58A]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#9CAAA1] uppercase tracking-wide">Total Paid</span>
                      <span className="text-[11px] text-[#9CAAA1]/70">Successfully completed</span>
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[#43C58A] whitespace-nowrap">{formatINR(detailsPayment.totalPaidForJob)}</div>
                </div>

                {/* Pending Amount */}
                <div className="bg-[#101C14] border border-[#F4B82E]/30 rounded-xl p-4 md:p-5 flex justify-between items-center relative overflow-hidden gap-4">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F4B82E]"></div>
                  <div className="flex items-center gap-3 pl-2">
                    <div className="w-10 h-10 rounded-full bg-[#F4B82E]/10 flex items-center justify-center shrink-0">
                      <Clock size={20} className="text-[#F4B82E]" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-[#F4B82E] uppercase tracking-wide">Pending Amount</span>
                      <span className="text-[11px] text-[#9CAAA1]">To be paid after work</span>
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-black text-[#F4B82E] whitespace-nowrap">{formatINR(detailsPayment.totalPendingForJob)}</div>
                </div>
              </div>

              {/* Current Transaction Context */}
              <div className="mt-8">
                <h4 className="text-xs font-bold text-[#9CAAA1] uppercase tracking-wider mb-3">Transaction Info</h4>
                <div className="bg-[#070B08] border border-[#263B2E] rounded-xl p-4 md:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#9CAAA1] uppercase tracking-wider">Date</span>
                    <span className="text-sm font-bold text-[#F5F7F5]">
                      {new Date(detailsPayment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#9CAAA1] uppercase tracking-wider">Amount</span>
                    <span className="text-sm font-bold text-[#43C58A]">{formatINR(detailsPayment.amount)}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#9CAAA1] uppercase tracking-wider">Status</span>
                    <span className="text-sm font-bold text-[#F5F7F5]">{detailsPayment.status}</span>
                  </div>
                  <div className="flex flex-col gap-1 col-span-2 sm:col-span-4 mt-2 sm:mt-0">
                    <span className="text-[10px] text-[#9CAAA1] uppercase tracking-wider">Ref Number</span>
                    <span className="text-sm font-bold text-[#F5F7F5] font-mono break-all">{detailsPayment.ref}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-5 border-t border-[#263B2E] bg-[#101C14] flex">
              <button
                onClick={() => setDetailsPayment(null)}
                className="select-none w-full px-5 py-3 rounded-lg font-bold text-sm bg-[#263B2E] text-[#F5F7F5] hover:bg-[#344b3c] transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
