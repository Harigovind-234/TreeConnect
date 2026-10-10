import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, ArrowUpRight, ArrowDownRight, IndianRupee, Clock, CheckCircle2, AlertCircle, Loader2, Trees } from 'lucide-react';
import harvestService from '../../services/harvestService';
import { formatINR } from '../../utils/timberCalculations';
import './ContractorDashboard.css';

const PaymentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLandowner, setSelectedLandowner] = useState('ALL');

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
              
              const isAssigned = isDirectlyAssigned || statusMatch; // Broad fallback for demo purposes

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

                reqPayments.forEach(payment => {
                  extractedPayments.push({
                    id: payment.payment_id || payment.id || `txn_${Math.random().toString(36).substr(2, 9)}`,
                    date: payment.paid_at || payment.recorded_at || payment.created_at || req.updated_at,
                    amount: payment.amount || 0,
                    type: payment.type || 'Advance Payment',
                    status: (payment.status === 'VERIFIED' || payment.status === 'PAID') ? 'COMPLETED' : (payment.status || 'COMPLETED'),
                    jobName: req.property_details?.propertyName || req.propertyName || req.parcel || `Harvest Request #${String(req.id).slice(-6).toUpperCase()}`,
                    ref: payment.reference_number || payment.payment_id || payment.id || 'N/A',
                    landownerName: req.ownerName || req.landownerName || req.owner_name || req.userEmail || 'Registered Landowner'
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
  }, []);

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
        
        <div className="contractor-dashboard-workspace p-4 md:p-6 overflow-y-auto w-full">
          <div className="max-w-6xl mx-auto flex flex-col space-y-6">
            
            {/* 1. Header Area */}
            <div className="flex flex-col gap-2 border-b border-emerald-500/20 pb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold w-fit mb-1">
                <CreditCard size={14} />
                <span>Financial Overview</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Payment Details & History</h1>
              <p className="text-sm text-slate-400">Track advance mobilizations and milestone payments for your operations.</p>
            </div>

            {/* 2. Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-gradient-to-br from-[#0a1610] to-[#050f0a] border border-emerald-500/20 p-5 rounded-2xl shadow-lg flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <IndianRupee size={22} />
                  </div>
                  <span className="text-slate-300 font-bold text-sm tracking-wide uppercase">Total Received</span>
                </div>
                <div className="text-3xl lg:text-4xl font-black text-white">{formatINR(totalReceived)}</div>
              </div>
              <div className="bg-gradient-to-br from-[#0a1610] to-[#050f0a] border border-amber-500/20 p-5 rounded-2xl shadow-lg flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
                    <Clock size={22} />
                  </div>
                  <span className="text-slate-300 font-bold text-sm tracking-wide uppercase">Pending Payments</span>
                </div>
                <div className="text-3xl lg:text-4xl font-black text-white">{formatINR(totalPending)}</div>
              </div>
              <div className="bg-gradient-to-br from-[#0a1610] to-[#050f0a] border border-blue-500/20 p-5 rounded-2xl shadow-lg flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
                    <CreditCard size={22} />
                  </div>
                  <span className="text-slate-300 font-bold text-sm tracking-wide uppercase">Total Transactions</span>
                </div>
                <div className="text-3xl lg:text-4xl font-black text-white">{filteredPayments.length}</div>
              </div>
            </div>

            {/* 3. Secondary Layout: Landowner Filter */}
            <div className="w-full bg-[#050f0a] border border-slate-800 rounded-2xl p-5 flex flex-col shadow-md">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Trees size={16} className="text-emerald-500" /> Filter by Landowner
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  <button
                    onClick={() => setSelectedLandowner('ALL')}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      selectedLandowner === 'ALL'
                        ? 'bg-emerald-950/60 border-emerald-500/60 shadow-inner'
                        : 'bg-[#0a1610] border-slate-800 hover:border-emerald-500/30'
                    }`}
                  >
                    <div className="font-bold text-white">All Landowners</div>
                    <div className="text-xs text-slate-400 mt-1">{payments.length} total transactions</div>
                  </button>

                  {landownerStats.map(stat => (
                    <button
                      key={stat.name}
                      onClick={() => setSelectedLandowner(stat.name)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        selectedLandowner === stat.name
                          ? 'bg-emerald-950/60 border-emerald-500/60 shadow-inner'
                          : 'bg-[#0a1610] border-slate-800 hover:border-emerald-500/30'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-emerald-300 truncate">{stat.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{stat.count} transaction{stat.count !== 1 && 's'}</div>
                      </div>
                      <div className="text-xs font-mono text-slate-300 mt-3 border-t border-slate-800/60 pt-2 flex justify-between items-center w-full">
                        <span className="text-emerald-400 font-semibold">{formatINR(stat.totalReceived)}</span>
                        {stat.totalPending > 0 && <span className="text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded">{formatINR(stat.totalPending)} Pending</span>}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* 4. Transactions List */}
            <div className="bg-[#050f0a] border border-slate-800 rounded-2xl shadow-md overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-[#08150f]">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock size={18} className="text-emerald-500" />
                  {selectedLandowner === 'ALL' ? 'All Recent Transactions' : `Transactions for ${selectedLandowner}`}
                </h2>
              </div>
              
              {loading ? (
                <div className="p-16 flex flex-col items-center justify-center min-h-[200px]">
                  <Loader2 className="animate-spin text-emerald-500 mb-4" size={32} />
                  <span className="text-sm text-slate-400">Loading transactions...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                  <AlertCircle className="mb-3 opacity-50" size={40} />
                  <p className="text-base font-medium text-slate-300">No payments recorded yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Transactions for this filter will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold w-[120px]">Date</th>
                        <th className="p-4 font-semibold max-w-[250px]">Job / Reference</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold text-right">Amount</th>
                        <th className="p-4 font-semibold w-[140px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredPayments.map(payment => (
                        <tr key={payment.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                            {new Date(payment.date).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="p-4 max-w-[250px] overflow-hidden text-ellipsis">
                            <div className="text-sm font-bold text-white truncate" title={payment.jobName}>{payment.jobName}</div>
                            {selectedLandowner === 'ALL' && (
                              <div className="text-xs text-slate-400 mt-1 truncate">Landowner: <span className="text-emerald-300 font-semibold">{payment.landownerName}</span></div>
                            )}
                            <div className="text-xs text-slate-500 font-mono mt-1 truncate" title={payment.ref}>Ref: {payment.ref}</div>
                          </td>
                          <td className="p-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium whitespace-nowrap">
                              {payment.type}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-sm font-bold text-white whitespace-nowrap">{formatINR(payment.amount)}</div>
                          </td>
                          <td className="p-4">
                            {payment.status === 'COMPLETED' || payment.status === 'PAID' ? (
                              <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold px-2 py-1 bg-emerald-500/10 rounded-lg whitespace-nowrap">
                                <CheckCircle2 size={14} /> Completed
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold px-2 py-1 bg-amber-500/10 rounded-lg whitespace-nowrap">
                                <Clock size={14} /> Pending
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
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
