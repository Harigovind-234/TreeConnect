import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
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
  Phone
} from 'lucide-react';

const PurchaseOrdersPage = () => {
  const { user } = useAuth();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerEmail = (user?.email || 'arunbuyer@gmail.com').toLowerCase().trim();
  const [orders, setOrders] = useState([]);

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
                    <Truck size={13} /> Purchase Orders
                  </span>
                  <span className="text-xs text-muted font-medium">Real-Time Fulfillment & Logistics</span>
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

            {/* ========================================================= */}
            {/* ORDERS LIST (IMAGE 1 CARD DESIGN SYSTEM) */}
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
                  const milestones = ord.milestones || [
                    { step: 'Order Placed & Escrow Secured', done: true },
                    { step: 'Yard Log Loading & Stenciling', done: true },
                    { step: 'Transit Pass Clearance (KL Forest Dept)', done: false },
                    { step: 'Mill Gate Arrival & Quality Check', done: false }
                  ];

                  return (
                    <div key={ord.id} className="tc-buyer-card tc-buyer-card-blue">
                      {/* Top Header Row (Image 1 Style) */}
                      <div className="tc-buyer-header">
                        <div className="tc-buyer-user-info">
                          <div className="tc-buyer-avatar-badge text-blue-400 bg-blue-500/15 border-blue-500/30">
                            <Truck size={22} />
                          </div>
                          <div className="tc-buyer-title-group">
                            <div className="tc-buyer-title-row">
                              <span className="tc-buyer-title">{ord.timberItem}</span>
                              <span className="tc-buyer-verified-badge tc-buyer-verified-badge-blue">
                                {ord.status || 'Order Confirmed'}
                              </span>
                              <span className="font-mono text-xs text-slate-300 px-2 py-0.5 rounded bg-surface border border-color">
                                {ord.id}
                              </span>
                            </div>
                            <p className="tc-buyer-subtitle">
                              Seller: <strong className="text-white">{ord.sellerName}</strong> ({ord.sellerRole}) • Logistics Hauler: <strong className="text-slate-300">{ord.contractor}</strong> • Placed on: {ord.createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="tc-buyer-header-actions">
                          <span className="tc-buyer-pill-btn">
                            <ShieldCheck size={13} className="text-emerald" /> {ord.passNo || 'Transit Pass Cleared'}
                          </span>
                        </div>
                      </div>

                      {/* 4-Cell Middle Metrics Grid (Image 1 Style) */}
                      <div className="tc-buyer-metrics-grid">
                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">SPECIES & VOLUME</span>
                          <div className="tc-buyer-metric-val">
                            <Trees size={15} className="text-emerald" />
                            <span>{ord.volume || `${ord.volumeNum} m³`}</span>
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
                          <span className="tc-buyer-metric-label">DESTINATION MILL</span>
                          <div className="tc-buyer-metric-val truncate">
                            <Building size={15} className="text-blue-400" />
                            <span>{ord.mill || 'Ernakulam Yard #2'}</span>
                          </div>
                          <span className="tc-buyer-metric-hint">Receiving Yard Gate</span>
                        </div>

                        <div className="tc-buyer-metric-cell">
                          <span className="tc-buyer-metric-label">FOREST TRANSIT PASS</span>
                          <div className="tc-buyer-metric-val truncate font-mono text-xs">
                            <span>{ord.passNo || 'KL-FD-2026-981'}</span>
                          </div>
                          <span className="tc-buyer-metric-hint text-emerald">Clearance Approved</span>
                        </div>
                      </div>

                      {/* Delivery Milestones Tracker */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Logistics & Mill Gate Milestones:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          {milestones.map((m, idx) => (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                m.done
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                  : 'bg-black/40 border-color/40 text-muted'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                  m.done ? 'bg-emerald text-black' : 'bg-surface text-muted border border-color'
                                }`}
                              >
                                {m.done ? <CheckCircle2 size={12} /> : idx + 1}
                              </div>
                              <span className="text-[11px] font-medium leading-tight">{m.step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Financial / Action Grid (Image 1 Style) */}
                      <div className="tc-buyer-bottom-grid">
                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">TOTAL AGREED CONTRACT VALUE</span>
                          <div className="text-xl font-extrabold text-gold font-mono">
                            {ord.total || `₹ ${Number(ord.totalNum || 0).toLocaleString('en-IN')}`}
                          </div>
                          <span className="text-[11px] text-muted">TreeConnect Escrow Secured</span>
                        </div>

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">SETTLEMENT METHOD</span>
                          <div className="text-sm font-bold text-white">
                            TreeConnect Escrow
                          </div>
                          <span className="text-[11px] text-slate-300">
                            {ord.paymentTerms || 'Weighbridge Acceptance Release'}
                          </span>
                        </div>

                        <div className="tc-buyer-highlight-cell">
                          <span className="tc-buyer-metric-label">PAYOUT CONDITION</span>
                          <div className="text-sm font-bold text-emerald flex items-center gap-1">
                            <ShieldCheck size={14} /> Gate Slip Verification
                          </div>
                          <span className="text-[11px] text-muted">Released upon weight inspection</span>
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

          </main>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersPage;
