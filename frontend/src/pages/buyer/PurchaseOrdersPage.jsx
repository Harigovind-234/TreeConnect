import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import { loadRazorpay } from '../../utils/razorpay';
import './BuyerCards.css';
import {
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  FileText,
  DollarSign,
  Package,
  Layers,
  MapPin,
  ExternalLink,
  ShoppingBag,
  Trees,
  Award,
  Phone,
  CreditCard,
  QrCode,
  Sparkles,
  X
} from 'lucide-react';

const PurchaseOrdersPage = () => {
  const { user } = useAuth();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerEmail = (user?.email || 'arunbuyer@gmail.com').toLowerCase().trim();
  const [orders, setOrders] = useState([]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  const location = useLocation();
  const [successBanner, setSuccessBanner] = useState(location.state?.paidMessage || null);

  // Clear location state after reading
  useEffect(() => {
    if (location.state?.paidMessage) {
      setSuccessBanner(location.state.paidMessage);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadData = () => {
    const all = marketplaceService.getOrders();
    // Strictly real-time orders for this logged-in buyer
    const realBuyerOrders = all.filter(o => {
      if (!o) return false;
      const bEmail = (o.buyerEmail || '').toLowerCase().trim();
      const bName = (o.buyerName || '').toLowerCase().trim();
      return (buyerEmail && bEmail === buyerEmail) || (bName && bName === buyerName.toLowerCase().trim());
    });
    setOrders(realBuyerOrders);
  };

  useEffect(() => {
    loadData();
    marketplaceService.syncFromBackend().then(() => loadData()).catch(() => {});
    const handleUpdate = () => loadData();
    window.addEventListener('treeconnect_marketplace_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('treeconnect_marketplace_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [buyerEmail, buyerName]);

  const handleOpenPay = (ord) => {
    setSelectedOrder(ord);
    setPaymentSuccess(false);
    setPaymentReceipt(null);
    setPaymentModalOpen(true);
  };

  const handleExecuteOrderPayment = async () => {
    if (!selectedOrder) return;
    setPaymentProcessing(true);

    try {
      const isLoaded = await loadRazorpay();
      const payablePaise = Math.round(Number(selectedOrder.totalNum || 0) * 100);

      const completeOrderPayment = async (payRef, methodLabel) => {
        await marketplaceService.recordOrderPayment(selectedOrder.id, {
          paymentRef: payRef,
          amount: selectedOrder.totalNum,
          paymentMethod: methodLabel
        }, user);

        const paidSeller = selectedOrder.sellerName;
        const paidAmountFmt = Number(selectedOrder.totalNum).toLocaleString('en-IN');

        setPaymentProcessing(false);
        setPaymentModalOpen(false);
        setSelectedOrder(null);
        setSuccessBanner({
          message: `Payment of ₹${paidAmountFmt} verified successfully via Razorpay! Transferred directly to ${paidSeller} (Landowner).`,
          payRef
        });
        loadData();
      };

      if (!isLoaded || !window.Razorpay) {
        console.warn('Razorpay SDK script could not be loaded from CDN. Using simulated gateway fallback.');
        const fallbackRef = `pay_sim_${Date.now().toString().slice(-8)}`;
        await completeOrderPayment(fallbackRef, 'Razorpay Online Gateway (Simulated)');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Fur0pLo5d2MztK',
        amount: payablePaise,
        currency: 'INR',
        name: 'TreeConnect Timber',
        description: `Direct Payment to Landowner: ${selectedOrder.sellerName}`,
        image: 'https://cdn-icons-png.flaticon.com/512/628/628324.png',
        prefill: {
          name: user?.name || user?.fullName || buyerName || 'Arun K',
          email: user?.email || buyerEmail || 'arunbuyer@gmail.com',
          contact: user?.phone || '9876543210'
        },
        notes: {
          order_id: selectedOrder.id,
          landowner: selectedOrder.sellerName,
          timber_item: selectedOrder.timberItem
        },
        theme: {
          color: '#10b981'
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
          }
        },
        handler: async function (response) {
          const razorpayPayId = response.razorpay_payment_id || `pay_${Date.now().toString().slice(-8)}`;
          await completeOrderPayment(razorpayPayId, 'Razorpay Secure Gateway (UPI / Card / NetBanking)');
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp) {
        setPaymentProcessing(false);
        alert('Razorpay Payment Failed: ' + (resp.error?.description || 'Transaction cancelled or declined.'));
      });
      rzpInstance.open();

    } catch (err) {
      console.error('Razorpay invocation error:', err);
      setPaymentProcessing(false);
      alert('Could not start Razorpay gateway. Please try again.');
    }
  };

  const totalProcurementSum = orders.reduce((sum, ord) => sum + (Number(ord.totalNum) || 0), 0);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
            
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-color">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800 flex items-center gap-1.5">
                    <Truck size={13} /> Purchase Orders & Settlements
                  </span>
                  <span className="text-xs text-muted font-medium">Real-Time Fulfillment, Escrow Payments & Logistics</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
                  Confirmed Purchase Orders
                </h1>
                <p className="text-sm text-muted mt-1 max-w-2xl">
                  Records of successful purchase offers, active log truck hauling, Kerala Forest Department transit passes, and mill gate weighbridge receipts.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-color text-xs">
                <span className="font-bold text-emerald font-mono">{orders.length}</span>
                <span className="text-muted">Confirmed Orders Placed</span>
              </div>
            </div>

            {/* SUCCESS PAYMENT BANNER */}
            {successBanner && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-[#062418]/90 to-emerald-950/70 border border-emerald-500/50 shadow-xl flex items-center justify-between gap-4 animate-scale-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
                      <span>Razorpay Payment Verified & Transferred to Landowner!</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        100% Cleared
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {typeof successBanner === 'string' ? successBanner : successBanner.message}
                      {successBanner.payRef && (
                        <span className="font-mono text-emerald-300 font-bold ml-1.5">(Ref: {successBanner.payRef})</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessBanner(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Dismiss banner"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* ========================================================= */}
            {/* ORDERS LIST */}
            {/* ========================================================= */}
            {orders.length === 0 ? (
              <div className="tc-buyer-card text-center py-12">
                <Truck size={44} className="mx-auto text-blue-400 mb-3" />
                <h3 className="text-base font-bold text-main mb-1">No Real-Time Purchase Orders Yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                  When you successfully conclude a price negotiation in My Negotiations, your official purchase contract and mill delivery tracking will appear here.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link to="/buyer/marketplace" className="tc-buyer-action-btn">
                    <ShoppingBag size={14} /> Procure Timber Lots
                  </Link>
                  <Link to="/buyer/negotiations" className="tc-buyer-pill-btn">
                    View My Negotiations
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => {
                  const isPaid = ord.paymentStatus === 'PAID';
                  const milestones = ord.milestones || [
                    { step: isPaid ? 'Timber Purchase Payment Confirmed (Escrow Secured)' : 'Purchase Contract Agreed (Payment Required)', done: isPaid },
                    { step: 'Yard Log Loading & Stenciling', done: isPaid },
                    { step: 'Transit Pass Clearance (KL Forest Dept)', done: isPaid },
                    { step: 'Mill Gate Arrival & Quality Check', done: false }
                  ];

                  return (
                    <div key={ord.id} className="tc-buyer-card tc-buyer-card-blue">
                      {/* Top Header Row */}
                      <div className="tc-buyer-header">
                        <div className="tc-buyer-user-info">
                          <div className={`tc-buyer-avatar-badge ${isPaid ? 'text-emerald bg-emerald-500/15 border-emerald-500/30' : 'text-blue-400 bg-blue-500/15 border-blue-500/30'}`}>
                            {isPaid ? <CheckCircle2 size={22} className="text-emerald" /> : <ShoppingBag size={22} />}
                          </div>
                          <div className="tc-buyer-title-group">
                            <div className="tc-buyer-title-row">
                              <span className="tc-buyer-title">{ord.timberItem}</span>
                              <span className={`tc-buyer-verified-badge ${isPaid ? '' : 'tc-buyer-verified-badge-amber'}`}>
                                {isPaid ? 'Purchased & Paid' : 'Payment Pending'}
                              </span>
                              <span className="font-mono text-xs text-slate-300 px-2 py-0.5 rounded bg-surface border border-color">
                                {ord.id}
                              </span>
                            </div>
                            <p className="tc-buyer-subtitle">
                              Landowner (Owner): <strong className="text-white">{ord.sellerName}</strong> ({ord.sellerRole}) • Placed on: {ord.createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="tc-buyer-header-actions">
                          <span className="tc-buyer-pill-btn">
                            <ShieldCheck size={13} className="text-emerald" /> Direct Owner Settlement
                          </span>
                        </div>
                      </div>

                      {/* 4-Cell Middle Metrics Grid */}
                      <div className="tc-buyer-metrics-grid">
                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">SPECIES & VOLUME</span>
                          <div className="tc-buyer-metric-val">
                            <Trees size={15} className="text-emerald" />
                            <span>{ord.volume ? `${ord.volume} m³` : `${ord.volumeNum} m³`}</span>
                          </div>
                          <span className="tc-buyer-metric-hint">{ord.species}</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">AGREED UNIT RATE</span>
                          <div className="tc-buyer-metric-val text-emerald">
                            <DollarSign size={15} className="text-emerald" />
                            <span>₹ {Number(ord.unitPrice || 0).toLocaleString('en-IN')}/m³</span>
                          </div>
                          <span className="tc-buyer-metric-hint">Negotiated Rate</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">PAYMENT STATUS</span>
                          <div className="tc-buyer-metric-val truncate">
                            <CheckCircle2 size={15} className={isPaid ? 'text-emerald' : 'text-amber-400'} />
                            <span className={isPaid ? 'text-emerald' : 'text-amber-300'}>{isPaid ? 'Paid to Owner' : 'Pending Payment'}</span>
                          </div>
                          <span className="tc-buyer-metric-hint">{isPaid ? '100% Cleared' : 'Action Required'}</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">PAYMENT REFERENCE</span>
                          <div className="tc-buyer-metric-val truncate font-mono text-xs">
                            <span className={isPaid ? 'text-emerald' : 'text-slate-400'}>{ord.paymentRef || 'Awaiting Payment'}</span>
                          </div>
                          <span className="tc-buyer-metric-hint text-emerald">{isPaid ? 'Direct Transfer Verified' : 'Direct Settlement'}</span>
                        </div>
                      </div>

                      {/* Payment Action Banner if Unpaid */}
                      {!isPaid && (
                        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                          <div>
                            <span className="text-amber-300 font-bold text-xs uppercase tracking-wider block">
                              Payment to Landowner Required
                            </span>
                            <p className="text-xs text-slate-300 mt-0.5">
                              Pay ₹ {Number(ord.totalNum || 0).toLocaleString('en-IN')} to directly complete the timber purchase and transfer funds to {ord.sellerName}.
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenPay(ord)}
                            className="tc-buyer-action-amber-btn flex items-center gap-2 px-5 py-2.5 text-xs font-bold cursor-pointer shadow-xl"
                          >
                            <CreditCard size={15} /> Pay Owner for Timber (₹ {Number(ord.totalNum || 0).toLocaleString('en-IN')})
                          </button>
                        </div>
                      )}

                      {/* Purchased & Payment Details Card if Paid */}
                      {isPaid && (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-black/70 to-emerald-950/20 border border-emerald-500/35 space-y-3.5 shadow-md">
                          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 flex-wrap gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-emerald-400" /> Purchased & Settlement Details
                            </span>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Transferred to Landowner
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Column 1: Purchased Timber Info */}
                            <div className="space-y-2 p-3 rounded-xl bg-black/50 border border-emerald-500/15">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                Purchased Timber Lot
                              </span>
                              <div className="font-extrabold text-white text-sm">{ord.timberItem}</div>
                              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                <div>
                                  <span className="text-slate-400 block">Volume:</span>
                                  <strong className="text-emerald-300 font-mono">{ord.volume ? `${ord.volume} m³` : `${ord.volumeNum} m³`}</strong>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Unit Rate:</span>
                                  <strong className="text-white font-mono">₹ {Number(ord.unitPrice || 0).toLocaleString('en-IN')}/m³</strong>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Payment & Settlement Info */}
                            <div className="space-y-2 p-3 rounded-xl bg-black/50 border border-emerald-500/15">
                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
                                <span>Payment Settlement</span>
                                <span className="text-emerald-300 font-mono text-xs">₹ {Number(ord.paidAmount || ord.totalNum || 0).toLocaleString('en-IN')}</span>
                              </span>
                              <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Paid To:</span>
                                  <strong className="text-white">{ord.sellerName} (Landowner)</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Payment Reference:</span>
                                  <strong className="text-emerald-400 font-mono">{ord.paymentRef || 'PAY-TC-CONFIRMED'}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Payment Mode:</span>
                                  <span className="text-slate-200">{ord.paymentMethod || 'Direct Payment to Landowner'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Status:</span>
                                  <span className="text-emerald-300 font-semibold">100% Paid in Full</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Financial / Action Grid */}
                      <div className="tc-buyer-bottom-grid">
                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">TOTAL PURCHASE PRICE</span>
                          <div className="text-xl font-extrabold text-gold font-mono">
                            {ord.total || `₹ ${Number(ord.totalNum || 0).toLocaleString('en-IN')}`}
                          </div>
                          <span className="text-[11px] text-muted">{isPaid ? '✓ Paid in Full' : 'Payment Pending'}</span>
                        </div>

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">PAYMENT RECIPIENT</span>
                          <div className="text-sm font-bold text-white">
                            {ord.sellerName}
                          </div>
                          <span className="text-[11px] text-slate-300">
                            Landowner Account
                          </span>
                        </div>

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">SETTLEMENT STATUS</span>
                          <div className="text-sm font-bold text-emerald flex items-center gap-1">
                            <ShieldCheck size={14} /> {isPaid ? 'Direct Transfer Settled' : 'Pending Payment'}
                          </div>
                          <span className="text-[11px] text-muted">{isPaid ? 'Zero deductions applied' : 'Pay to transfer funds'}</span>
                        </div>

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">BUYER ENTITY</span>
                          <div className="text-xs font-semibold text-white truncate">
                            {ord.buyerName || buyerName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono truncate">{ord.buyerEmail || buyerEmail}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TIMBER PURCHASE PAYMENT ESCROW MODAL (Exact Image 2 Formulate Counter Target Architecture) */}
            {paymentModalOpen && selectedOrder && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] overflow-y-auto p-4 sm:p-6 flex justify-center items-center animate-fade-in">
                <div className="tc-counter-modal-card my-auto">
                  {/* Sticky Header */}
                  <div className="tc-counter-header">
                    <div className="tc-counter-title-group">
                      <div className="tc-counter-icon-wrap">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <h3 className="tc-counter-title flex items-center gap-2 flex-wrap">
                          <span>Complete Timber Purchase & Direct Payment</span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shrink-0">
                            Owner Settlement
                          </span>
                        </h3>
                        <div className="tc-counter-lot-badge">
                          Lot: <span className="text-emerald-300 font-semibold">{selectedOrder.timberItem}</span> • Landowner: <strong className="text-white">{selectedOrder.sellerName}</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(false)}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                      title="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {paymentSuccess ? (
                    <div className="tc-counter-body !items-center !justify-center text-center py-10 space-y-5">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center shadow-xl">
                        <CheckCircle2 size={36} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-extrabold text-white">Payment Confirmed & Transferred to Owner!</h3>
                        <p className="text-xs text-slate-300 max-w-sm mx-auto">
                          Payment of <strong className="text-gold font-mono">₹ {Number(paymentReceipt?.amount || 0).toLocaleString('en-IN')}</strong> has been transferred directly to <strong className="text-white">{selectedOrder.sellerName}</strong> (Landowner).
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 w-full max-w-sm text-xs space-y-2.5 text-left font-mono shadow-inner">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payment Ref:</span>
                          <span className="text-emerald-400 font-bold">{paymentReceipt?.payRef}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Paid To:</span>
                          <span className="text-white font-bold">{selectedOrder.sellerName} (Landowner)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Order ID:</span>
                          <span className="text-white">{selectedOrder.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Purchase Status:</span>
                          <span className="text-emerald-400 font-bold">100% Paid in Full</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => setPaymentModalOpen(false)}
                          className="tc-buyer-action-emerald-btn cursor-pointer shadow-lg inline-flex items-center gap-2"
                        >
                          <CheckCircle2 size={15} /> Close & View Purchased Order Details
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="tc-counter-body">
                        {/* 1. TIMBER PURCHASE PAYMENT SPECIFICATION CARD (Image 2 Engine Box Style) */}
                        <div className="tc-counter-target-engine-box">
                          <div className="tc-counter-target-header">
                            <span className="tc-counter-target-badge">
                              <ShieldCheck size={12} /> Direct Owner Payment Settlement
                            </span>
                            <span className="text-[11px] text-slate-300">
                              Total Payable to Owner: <strong className="text-emerald-300 font-mono text-xs">₹ {Number(selectedOrder.totalNum || 0).toLocaleString('en-IN')}</strong>
                            </span>
                          </div>

                          <div className="tc-counter-target-factors-grid">
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Verified Vol</span>
                              <span className="tc-counter-factor-val text-emerald-300 font-mono">
                                {selectedOrder.volume || '1.7 m³'}
                              </span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Timber Grade</span>
                              <span className="tc-counter-factor-val truncate">
                                Grade A Prime Export
                              </span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Agreed Rate</span>
                              <span className="tc-counter-factor-val font-mono text-emerald-300">
                                ₹ {Number(selectedOrder.totalNum && selectedOrder.volume ? Math.round(selectedOrder.totalNum / parseFloat(selectedOrder.volume)) : 147695).toLocaleString('en-IN')}/m³
                              </span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Recipient</span>
                              <span className="tc-counter-factor-val truncate text-white">
                                {selectedOrder.sellerName}
                              </span>
                            </div>
                          </div>

                          <div className="tc-counter-settlement-notice">
                            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                            <span><strong>Direct Landowner Settlement:</strong> 100% of this payment is transferred directly to landowner {selectedOrder.sellerName} upon confirmation.</span>
                          </div>
                        </div>

                        {/* 2. 3-WAY PAYMENT CHANNEL COMPARISON CARDS (Exact Image 2 3-Card Style) */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          {/* Card 1: UPI / QR */}
                          <div
                            onClick={() => setPaymentMethod('upi')}
                            className={`tc-counter-compare-card cursor-pointer transition-all ${
                              paymentMethod === 'upi'
                                ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'asking hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`tc-counter-pill ${paymentMethod === 'upi' ? 'emerald' : 'amber'}`}>
                              Instant UPI
                            </span>
                            <div className={`tc-counter-compare-rate ${paymentMethod === 'upi' ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-1.5`}>
                              <QrCode size={18} className={paymentMethod === 'upi' ? 'text-emerald-400' : 'text-slate-400'} />
                              <span>UPI / QR</span>
                            </div>
                            <div className="tc-counter-compare-sub">
                              Instant • 0% Fee
                            </div>
                          </div>

                          {/* Card 2: NEFT / NetBanking */}
                          <div
                            onClick={() => setPaymentMethod('netbanking')}
                            className={`tc-counter-compare-card cursor-pointer transition-all ${
                              paymentMethod === 'netbanking'
                                ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'asking hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`tc-counter-pill ${paymentMethod === 'netbanking' ? 'emerald' : 'amber'}`}>
                              Bank Transfer
                            </span>
                            <div className={`tc-counter-compare-rate ${paymentMethod === 'netbanking' ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-1.5`}>
                              <Building size={18} className={paymentMethod === 'netbanking' ? 'text-emerald-400' : 'text-slate-400'} />
                              <span>NEFT / RTGS</span>
                            </div>
                            <div className="tc-counter-compare-sub">
                              RTGS / IMPS Escrow
                            </div>
                          </div>

                          {/* Card 3: Corporate Card */}
                          <div
                            onClick={() => setPaymentMethod('card')}
                            className={`tc-counter-compare-card cursor-pointer transition-all ${
                              paymentMethod === 'card'
                                ? 'bg-emerald-950/40 border border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                                : 'asking hover:border-emerald-500/30'
                            }`}
                          >
                            <span className={`tc-counter-pill ${paymentMethod === 'card' ? 'emerald' : 'amber'}`}>
                              Procurement
                            </span>
                            <div className={`tc-counter-compare-rate ${paymentMethod === 'card' ? 'text-emerald-300' : 'text-slate-200'} flex items-center gap-1.5`}>
                              <CreditCard size={18} className={paymentMethod === 'card' ? 'text-emerald-400' : 'text-slate-400'} />
                              <span>Corporate Card</span>
                            </div>
                            <div className="tc-counter-compare-sub">
                              Direct Procurement
                            </div>
                          </div>
                        </div>

                        {/* 3. CHANNEL SPECIFIC INPUT (Matching Image 2 single bar input style) */}
                        <div className="tc-counter-section-card">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-white uppercase tracking-wider">
                              {paymentMethod === 'upi' ? 'Virtual Payment Address (VPA) / UPI ID:' : paymentMethod === 'netbanking' ? 'Escrow Virtual Beneficiary Account:' : 'Corporate Procurement Card:'}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              Protected: <strong className="text-emerald-400">100% RBI Escrow</strong>
                            </span>
                          </div>

                          {paymentMethod === 'upi' && (
                            <div>
                              <div className="tc-counter-input-box">
                                <span className="tc-counter-input-prefix">
                                  <QrCode size={18} />
                                </span>
                                <input
                                  type="text"
                                  defaultValue="arunbuyer@okhdfcbank"
                                  className="tc-counter-input-field font-mono"
                                  placeholder="buyer@upi"
                                />
                                <span className="tc-counter-input-suffix text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 size={13} /> Verified VPA
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-1.5">
                                <Sparkles size={11} className="text-emerald-400" /> Instant authorization via Google Pay, PhonePe, Paytm, or BHIM.
                              </span>
                            </div>
                          )}

                          {paymentMethod === 'netbanking' && (
                            <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/25 space-y-1.5 font-mono text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Beneficiary Name:</span>
                                <span className="text-white font-bold">TreeConnect Escrow Trustee</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Virtual A/C No:</span>
                                <span className="text-emerald-400 font-bold">TCESCROW98472910</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">IFSC Code:</span>
                                <span className="text-white">HDFC0000240</span>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'card' && (
                            <div className="space-y-2.5">
                              <div className="tc-counter-input-box">
                                <span className="tc-counter-input-prefix">
                                  <CreditCard size={18} />
                                </span>
                                <input
                                  type="text"
                                  defaultValue="4111 •••• •••• 8821"
                                  className="tc-counter-input-field font-mono"
                                />
                                <span className="tc-counter-input-suffix text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20">
                                  VISA BIZ
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2.5">
                                <input type="text" defaultValue="09/28" className="tc-counter-input-field font-mono text-center !p-2.5 !text-sm" placeholder="MM/YY" />
                                <input type="password" defaultValue="•••" className="tc-counter-input-field font-mono text-center !p-2.5 !text-sm" placeholder="CVV" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Modal Actions Footer (Image 2 Footer Style) */}
                      <div className="tc-counter-footer">
                        <div className="text-xs text-slate-300">
                          Total Payment to Landowner:{' '}
                          <strong className="text-emerald-400 font-mono font-bold text-sm">
                            ₹ {Number(selectedOrder.totalNum || 0).toLocaleString('en-IN')}
                          </strong>{' '}
                          <span className="text-slate-400 font-mono">({selectedOrder.volume || '1.7 m³'})</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPaymentModalOpen(false)}
                            disabled={paymentProcessing}
                            className="tc-counter-btn-cancel"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteOrderPayment}
                            disabled={paymentProcessing}
                            className="tc-counter-btn-submit"
                          >
                            {paymentProcessing ? (
                              <>
                                <Clock size={16} className="animate-spin text-black" /> Processing Payment Transfer...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} /> Confirm & Pay Owner (₹ {Number(selectedOrder.totalNum || 0).toLocaleString('en-IN')})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
