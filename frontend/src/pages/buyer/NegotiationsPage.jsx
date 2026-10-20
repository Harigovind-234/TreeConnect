import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import './BuyerCards.css';
import {
  Handshake,
  Check,
  X,
  RotateCcw,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  DollarSign,
  Clock,
  Building,
  Layers,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Trees,
  Calendar
} from 'lucide-react';

const NegotiationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerEmail = (user?.email || 'arunbuyer@gmail.com').toLowerCase().trim();

  const [negotiations, setNegotiations] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'counter' | 'pending' | 'closed'
  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    const all = marketplaceService.getNegotiations();
    // Strictly real-time negotiations for this logged in buyer
    const realBuyerNegs = all.filter(n => {
      if (!n) return false;
      const bEmail = (n.buyerEmail || '').toLowerCase().trim();
      const bName = (n.buyerName || '').toLowerCase().trim();
      return (buyerEmail && bEmail === buyerEmail) || (bName && bName === buyerName.toLowerCase().trim());
    });
    setNegotiations(realBuyerNegs);
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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const activeCounters = negotiations.filter(n => n.status === 'Counter-Offer');
  const pendingReviews = negotiations.filter(n => n.status === 'Pending Review');
  const closedDeals = negotiations.filter(n => n.status === 'Accepted' || n.status === 'Rejected');

  const displayedList = negotiations.filter((n) => {
    if (filterTab === 'counter') return n.status === 'Counter-Offer';
    if (filterTab === 'pending') return n.status === 'Pending Review';
    if (filterTab === 'closed') return n.status === 'Accepted' || n.status === 'Rejected';
    return true;
  });

  // Action: Accept Counter-Offer (Deal Made -> Converts to Purchase Order)
  const handleAcceptDeal = (neg) => {
    const finalPrice = neg.counterOffer ? Number(neg.counterOffer.pricePerM3) : Number(neg.offeredPricePerM3);
    const volume = Number(neg.requestedVolume) || 25;

    try {
      marketplaceService.respondToNegotiation(neg.id, 'accept', {
        sender: 'Buyer',
        senderName: buyerName,
        message: `Buyer accepted agreed rate of ₹${finalPrice.toLocaleString('en-IN')}/m³. Proceeding to procurement order.`
      });

      const newOrder = marketplaceService.createOrder({
        listingId: neg.listingId,
        timberItem: neg.timberTitle || `${neg.timberSpecies} Sawlogs`,
        species: neg.timberSpecies,
        volume,
        unitPrice: finalPrice,
        sellerRole: neg.sellerRole,
        sellerName: neg.sellerName,
        sellerEmail: neg.sellerEmail,
        destinationMill: 'Ernakulam Timber Mill Yard #2',
        contractor: neg.sellerRole === 'contractor' ? neg.sellerName : 'Kerala Agro Logistics',
        paymentTerms: neg.paymentTerms || 'Bank Escrow / Verified Weighbridge Payout',
        buyerName,
        buyerEmail,
        notes: `Contract created from agreed negotiation deal #${neg.id}.`
      }, user);

      loadData();
      showToast(`Deal agreed! Order ${newOrder.id} created successfully.`);
      setTimeout(() => {
        navigate('/buyer/orders');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to accept deal');
    }
  };

  // Action: Decline / Walk Away (No Deal)
  const handleDeclineDeal = (neg) => {
    if (!window.confirm('Are you sure you want to decline this negotiation? This will close the deal with no purchase.')) {
      return;
    }

    try {
      marketplaceService.respondToNegotiation(neg.id, 'reject', {
        sender: 'Buyer',
        senderName: buyerName,
        message: 'Buyer declined the seller terms. Negotiation closed with no agreement.'
      });

      loadData();
      showToast(`Negotiation #${neg.id} closed (No Deal).`);
    } catch (err) {
      console.error(err);
      alert('Failed to decline offer');
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-6">
            
            {/* TOAST ALERT */}
            {toastMessage && (
              <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 flex items-center gap-3 shadow-xl animate-fade-in">
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-sm">{toastMessage}</span>
              </div>
            )}

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-color">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1.5">
                    <Handshake size={13} /> My Negotiations
                  </span>
                  <span className="text-xs text-muted font-medium">Real-Time Bidding & Deal-Closing Engine</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
                  Price Offers & Counter-Bids
                </h1>
                <p className="text-sm text-muted mt-1 max-w-2xl">
                  Review volume bids, evaluate seller counter-proposals, and finalize agreed contracts with estate landowners and contractors.
                </p>
              </div>

              <Link to="/buyer/marketplace" className="btn btn-secondary btn-sm flex items-center gap-2">
                <ShoppingBag size={15} /> Browse More Lots
              </Link>
            </div>

            {/* FILTER TABS */}
            <div className="flex items-center gap-2 border-b border-color overflow-x-auto pb-1 text-xs font-bold">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                All Negotiations ({negotiations.length})
              </button>

              <button
                onClick={() => setFilterTab('counter')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 relative cursor-pointer ${
                  filterTab === 'counter'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Action Needed: Counter-Offers
                {activeCounters.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500 text-black font-bold">
                    {activeCounters.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterTab('pending')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'pending'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Pending Seller Review ({pendingReviews.length})
              </button>

              <button
                onClick={() => setFilterTab('closed')}
                className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  filterTab === 'closed'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                Closed Deals ({closedDeals.length})
              </button>
            </div>

            {/* ========================================================= */}
            {/* NEGOTIATIONS LIST (IMAGE 1 CARD DESIGN SYSTEM) */}
            {/* ========================================================= */}
            {displayedList.length === 0 ? (
              <div className="tc-buyer-card text-center py-12">
                <Handshake size={44} className="mx-auto text-amber-400 mb-3" />
                <h3 className="text-base font-bold text-main mb-1">No Real-Time Negotiations Found</h3>
                <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                  You haven't placed any offers on timber lots yet. Browse the Timber Marketplace to place custom price bids.
                </p>
                <Link to="/buyer/marketplace" className="tc-buyer-action-btn mx-auto inline-flex">
                  <ShoppingBag size={14} /> Go to Timber Marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {displayedList.map((neg) => {
                  const isCounter = neg.status === 'Counter-Offer';
                  const isAccepted = neg.status === 'Accepted';
                  const isRejected = neg.status === 'Rejected';
                  const isPending = neg.status === 'Pending Review';

                  return (
                    <div
                      key={neg.id}
                      className={`tc-buyer-card ${isCounter ? 'tc-buyer-card-amber' : ''}`}
                    >
                      {/* Top Header Row (Image 1 Style) */}
                      <div className="tc-buyer-header">
                        <div className="tc-buyer-user-info">
                          <div className={`tc-buyer-avatar-badge ${isCounter ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' : ''}`}>
                            <Handshake size={22} />
                          </div>
                          <div className="tc-buyer-title-group">
                            <div className="tc-buyer-title-row">
                              <span className="tc-buyer-title">{neg.timberTitle}</span>
                              <span
                                className={`tc-buyer-verified-badge ${
                                  isCounter
                                    ? 'tc-buyer-verified-badge-amber'
                                    : isAccepted
                                    ? ''
                                    : 'tc-buyer-verified-badge-blue'
                                }`}
                              >
                                {neg.status}
                              </span>
                            </div>
                            <p className="tc-buyer-subtitle">
                              Seller: <strong className="text-white">{neg.sellerName}</strong> ({neg.sellerRole}) • Deal Reference: <span className="font-mono text-slate-300">{neg.id}</span> • Date: {neg.createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="tc-buyer-header-actions">
                          <span className="tc-buyer-pill-btn">
                            <Phone size={13} /> {neg.sellerPhone || '+91 94471 28901'}
                          </span>
                        </div>
                      </div>

                      {/* 4-Cell Middle Metrics Grid (Image 1 Style) */}
                      <div className="tc-buyer-metrics-grid">
                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">ORIGINAL ASKING RATE</span>
                          <div className="tc-buyer-metric-val">
                            <DollarSign size={14} className="text-slate-400" />
                            <span>₹ {Number(neg.originalPricePerM3 || 0).toLocaleString('en-IN')}/m³</span>
                          </div>
                          <span className="tc-buyer-metric-hint">Seller Catalogue Rate</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">YOUR OFFERED RATE</span>
                          <div className="tc-buyer-metric-val text-emerald">
                            <DollarSign size={14} className="text-emerald" />
                            <span className="text-emerald">₹ {Number(neg.offeredPricePerM3 || 0).toLocaleString('en-IN')}/m³</span>
                          </div>
                          <span className="tc-buyer-metric-hint">Your Proposed Bid</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">REQUESTED VOLUME</span>
                          <div className="tc-buyer-metric-val">
                            <Trees size={14} className="text-emerald" />
                            <span>{neg.requestedVolume} m³</span>
                          </div>
                          <span className="tc-buyer-metric-hint">{neg.deliveryPreference || 'Mill Delivery'}</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">TOTAL DEAL VALUE</span>
                          <div className="tc-buyer-metric-val text-gold">
                            <span className="text-gold">₹ {Number(neg.totalOffered || (neg.requestedVolume * neg.offeredPricePerM3)).toLocaleString('en-IN')}</span>
                          </div>
                          <span className="tc-buyer-metric-hint">Escrow Settlement</span>
                        </div>
                      </div>

                      {/* COUNTER-OFFER ALERT BOX (if any) */}
                      {isCounter && neg.counterOffer && (
                        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                              <RotateCcw size={16} /> Seller Counter-Proposal:
                            </span>
                            <span className="font-extrabold text-emerald text-base font-mono">
                              ₹ {Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')} / m³
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 italic bg-card/70 p-2.5 rounded-lg border border-amber-500/20">
                            "{neg.counterOffer.message}"
                          </p>
                          <div className="text-[11px] text-muted">
                            New Total Value: <strong className="text-gold font-mono">₹ {(Number(neg.counterOffer.pricePerM3) * Number(neg.requestedVolume)).toLocaleString('en-IN')}</strong> for {neg.requestedVolume} m³
                          </div>
                        </div>
                      )}

                      {/* Discussion History */}
                      {neg.timeline && neg.timeline.length > 0 && (
                        <div className="text-xs space-y-1.5 p-3 rounded-xl bg-black/40 border border-color/40">
                          <span className="text-muted font-bold block text-[10px] uppercase">Message History:</span>
                          {neg.timeline.map((msg, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-300">
                              <span className="text-muted font-mono text-[10px] mt-0.5">{msg.date}</span>
                              <span><strong className="text-emerald">{msg.senderName}:</strong> {msg.message}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Financial / Action Row (Image 1 Style) */}
                      <div className="tc-buyer-bottom-grid">
                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">DEAL STATUS</span>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            {isAccepted ? (
                              <span className="text-emerald flex items-center gap-1"><CheckCircle2 size={14} /> Deal Agreed</span>
                            ) : isRejected ? (
                              <span className="text-red-400 flex items-center gap-1"><X size={14} /> Declined / Closed</span>
                            ) : isCounter ? (
                              <span className="text-amber-400 flex items-center gap-1"><RotateCcw size={14} /> Counter Received</span>
                            ) : (
                              <span className="text-slate-300 flex items-center gap-1"><Clock size={14} /> Waiting for Seller</span>
                            )}
                          </div>
                          {neg.surveyVisitDate ? (
                            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Calendar size={12} /> Survey: {neg.surveyVisitDate} ({neg.surveyTimeSlot || 'Morning'})
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted">{neg.paymentTerms || 'Survey Visit Requested'}</span>
                          )}
                        </div>

                        {isCounter ? (
                          <>
                            <div className="tc-buyer-amber-cell col-span-1 sm:col-span-2">
                              <span className="tc-buyer-metric-label text-amber-300">ACTION REQUIRED</span>
                              <div className="text-xs text-slate-200">
                                Accept seller's counter-offer to generate official purchase order, or decline to walk away.
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => handleAcceptDeal(neg)}
                                  className="tc-buyer-action-amber-btn flex-1"
                                >
                                  <Check size={14} /> Accept Deal (₹{Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')}/m³)
                                </button>
                                <button
                                  onClick={() => handleDeclineDeal(neg)}
                                  className="tc-buyer-pill-btn text-red-400 border-red-500/40 hover:bg-red-950/40"
                                >
                                  <X size={14} /> Decline
                                </button>
                              </div>
                            </div>
                          </>
                        ) : isPending ? (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label">STATUS NOTE</span>
                            <div className="text-xs text-slate-300">
                              Offer is currently under review by {neg.sellerName}. You will be notified when they accept or counter.
                            </div>
                            <button
                              onClick={() => handleDeclineDeal(neg)}
                              className="text-xs text-muted hover:text-red-400 mt-1 underline text-left"
                            >
                              Withdraw this offer
                            </button>
                          </div>
                        ) : isAccepted ? (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-emerald">CONFIRMED PURCHASE CONTRACT</span>
                            <div className="text-xs text-slate-300">
                              Deal closed and accepted! Log delivery and Forest Department transit pass scheduled.
                            </div>
                            <Link to="/buyer/orders" className="tc-buyer-action-emerald-btn mt-1">
                              <Truck size={14} /> View in Purchase Orders →
                            </Link>
                          </div>
                        ) : (
                          <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                            <span className="tc-buyer-metric-label text-red-400">NO DEAL CONCLUDED</span>
                            <div className="text-xs text-muted">
                              This negotiation was declined. No financial commitment made.
                            </div>
                          </div>
                        )}

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">SECURITY & ESCROW</span>
                          <div className="text-xs font-semibold text-emerald flex items-center gap-1">
                            <ShieldCheck size={14} /> 100% Protected
                          </div>
                          <span className="text-[10px] text-muted">Payout on Weighbridge acceptance</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default NegotiationsPage;
