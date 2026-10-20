import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import './BuyerCards.css';
import {
  ShoppingBag,
  Handshake,
  Truck,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Award,
  Building,
  FileText,
  CheckCircle2,
  Trees,
  Phone,
  Mail,
  DollarSign,
  Layers,
  MapPin,
  Clock
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerCompany = user?.companyName || user?.company_name || 'timberbuyers';
  const buyerEmail = (user?.email || 'arunbuyer@gmail.com').toLowerCase().trim();
  const buyerPhone = user?.phone || user?.contactPhone || '+91 97465 12243';

  // Live real-time data states
  const [listings, setListings] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [orders, setOrders] = useState([]);

  const loadData = () => {
    const allListings = marketplaceService.getListings().filter(l => l && l.status !== 'Sold');
    const allNegs = marketplaceService.getNegotiations();
    const allOrders = marketplaceService.getOrders();

    setListings(allListings);

    // Real-time filter strictly for this logged-in buyer
    const myNegs = allNegs.filter(n => {
      if (!n) return false;
      const bEmail = (n.buyerEmail || '').toLowerCase().trim();
      const bName = (n.buyerName || '').toLowerCase().trim();
      return (buyerEmail && bEmail === buyerEmail) || (bName && bName === buyerName.toLowerCase().trim());
    });
    setNegotiations(myNegs);

    const myOrds = allOrders.filter(o => {
      if (!o) return false;
      const bEmail = (o.buyerEmail || '').toLowerCase().trim();
      const bName = (o.buyerName || '').toLowerCase().trim();
      return (buyerEmail && bEmail === buyerEmail) || (bName && bName === buyerName.toLowerCase().trim());
    });
    setOrders(myOrds);
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

  // Real-time metrics
  const activeNegotiationsCount = negotiations.filter(n => n.status === 'Pending Review' || n.status === 'Counter-Offer').length;
  const inTransitOrdersCount = orders.filter(o => o.status?.includes('Transit') || o.status?.includes('Scheduled')).length;
  const totalProcurementSpend = orders.reduce((sum, ord) => sum + (Number(ord.totalNum) || 0), 0);

  const distinctSpecies = [...new Set(listings.map(l => l.timberSpecies).filter(Boolean))];
  const speciesDisplay = distinctSpecies.length > 0 ? distinctSpecies.slice(0, 2).join(', ') + (distinctSpecies.length > 2 ? '...' : '') : 'No lots published';
  const distinctSellers = [...new Set(listings.map(l => l.sellerName).filter(Boolean))];
  const sellersDisplay = distinctSellers.length > 0 ? `${distinctSellers.length} Active ${distinctSellers.length === 1 ? 'Seller' : 'Sellers'}` : '0 Active Sellers';
  const waitingCountersCount = negotiations.filter(n => n.status === 'Counter-Offer').length;
  const closedDealsCount = negotiations.filter(n => n.status === 'Accepted').length + orders.length;
  const activeDeliveryText = orders.length === 0
    ? 'No active orders placed yet'
    : `${orders.length} active ${orders.length === 1 ? 'order' : 'orders'} (Pass: ${orders[0]?.passNo || 'Cleared'})`;

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
            
            {/* ========================================================= */}
            {/* 1. BUYER PROFILE & LIVE AT-A-GLANCE CARD (IMAGE 1 STYLE) */}
            {/* ========================================================= */}
            <div className="tc-buyer-card">
              {/* Header Row */}
              <div className="tc-buyer-header">
                <div className="tc-buyer-user-info">
                  <div className="tc-buyer-avatar-badge">
                    <Building size={22} />
                  </div>
                  <div className="tc-buyer-title-group">
                    <div className="tc-buyer-title-row">
                      <span className="tc-buyer-title">{buyerName}</span>
                      <span className="tc-buyer-verified-badge">
                        <Award size={12} /> Verified Commercial Buyer
                      </span>
                    </div>
                    <p className="tc-buyer-subtitle">
                      Commercial timber procurement department for <strong className="text-white">{buyerCompany}</strong> • Kerala Forest Department Registered Exchange Partner.
                    </p>
                  </div>
                </div>

                <div className="tc-buyer-header-actions">
                  <span className="tc-buyer-pill-btn">
                    <Phone size={13} /> {buyerPhone}
                  </span>
                  <span className="tc-buyer-pill-btn">
                    <Mail size={13} /> {buyerEmail}
                  </span>
                </div>
              </div>

              {/* 4-Cell Live Metrics Grid (Image 1 Style) */}
              <div className="tc-buyer-metrics-grid">
                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">AVAILABLE LOTS</span>
                  <div className="tc-buyer-metric-val">
                    <Trees size={16} className="text-emerald" />
                    <span>{listings.length} {listings.length === 1 ? 'Lot' : 'Lots'}</span>
                  </div>
                  <span className="tc-buyer-metric-hint">{listings.length > 0 ? 'Verified Kerala Stands' : 'No stands listed yet'}</span>
                </div>

                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">ACTIVE NEGOTIATIONS</span>
                  <div className="tc-buyer-metric-val">
                    <Handshake size={16} className="text-amber-400" />
                    <span className="text-amber-400">{activeNegotiationsCount} Pending</span>
                  </div>
                  <span className="tc-buyer-metric-hint">{negotiations.length} total {negotiations.length === 1 ? 'bid' : 'bids'} submitted</span>
                </div>

                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">IN-TRANSIT SHIPMENTS</span>
                  <div className="tc-buyer-metric-val">
                    <Truck size={16} className="text-blue-400" />
                    <span className="text-blue-400">{inTransitOrdersCount} Active</span>
                  </div>
                  <span className="tc-buyer-metric-hint">{orders.length} confirmed {orders.length === 1 ? 'order' : 'orders'}</span>
                </div>

                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">PROCUREMENT SPEND</span>
                  <div className="tc-buyer-metric-val">
                    <DollarSign size={16} className="text-emerald" />
                    <span className="text-emerald">₹ {totalProcurementSpend.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="tc-buyer-metric-hint">TreeConnect Safe Escrow</span>
                </div>
              </div>

              {/* Bottom Financial / Action Row (Image 1 Style) */}
              <div className="tc-buyer-bottom-grid">
                <div className="tc-buyer-highlight-cell">
                  <span className="tc-buyer-metric-label">CONFIRMED PURCHASE VALUE</span>
                  <div className="text-xl font-extrabold text-emerald font-mono">
                    ₹ {totalProcurementSpend.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-muted">Across {orders.length} accepted {orders.length === 1 ? 'contract' : 'contracts'}</span>
                </div>

                <div className="tc-buyer-amber-cell">
                  <span className="tc-buyer-metric-label text-amber-300">OPEN BIDS REQUIRING ATTENTION</span>
                  <div className="text-lg font-extrabold text-amber-400 font-mono">
                    {activeNegotiationsCount} Pending Action
                  </div>
                  <Link to="/buyer/negotiations" className="tc-buyer-action-amber-btn">
                    <Handshake size={14} /> Review Bids & Counters →
                  </Link>
                </div>

                <div className="tc-buyer-highlight-cell">
                  <span className="tc-buyer-metric-label">DEFAULT RECEIVING MILL</span>
                  <div className="text-sm font-bold text-white truncate">
                    Ernakulam Mill Yard #2
                  </div>
                  <span className="text-[11px] text-emerald font-medium flex items-center gap-1">
                    <ShieldCheck size={12} /> Weighbridge Gate Active
                  </span>
                </div>

                <div className="tc-buyer-highlight-cell">
                  <span className="tc-buyer-metric-label">TIMBER MARKET ACCESS</span>
                  <div className="text-sm font-bold text-white">
                    {listings.length} {listings.length === 1 ? 'Lot' : 'Lots'} Available
                  </div>
                  <Link to="/buyer/marketplace" className="tc-buyer-action-emerald-btn">
                    <ShoppingBag size={14} /> Procure Timber Lots →
                  </Link>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. BUYER PORTAL OPTIONS CARDS (IMAGE 1 STYLE) */}
            {/* ========================================================= */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h2 className="text-base font-bold text-main flex items-center gap-2">
                  <Layers size={18} className="text-emerald" />
                  Buyer Portal Operations
                </h2>
                <span className="text-xs text-muted font-medium">Core Procurement Services</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CARD 1: TIMBER MARKETPLACE */}
                <div className="tc-buyer-card">
                  <div className="tc-buyer-header">
                    <div className="tc-buyer-user-info">
                      <div className="tc-buyer-avatar-badge">
                        <ShoppingBag size={22} />
                      </div>
                      <div className="tc-buyer-title-group">
                        <div className="tc-buyer-title-row">
                          <span className="tc-buyer-title">Timber Marketplace</span>
                          <span className="tc-buyer-verified-badge">
                            {listings.length} Live Lots
                          </span>
                        </div>
                        <p className="tc-buyer-subtitle">
                          Browse certified hardwood sawlogs & veneer lots directly from verified estate landowners and harvesting contractors.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="tc-buyer-metrics-grid">
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">AVAILABLE SPECIES</span>
                      <div className="tc-buyer-metric-val">{speciesDisplay}</div>
                      <span className="tc-buyer-metric-hint">Kerala Hardwoods</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">SELLERS</span>
                      <div className="tc-buyer-metric-val">{sellersDisplay}</div>
                      <span className="tc-buyer-metric-hint">Verified Stands</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">PRICING MODE</span>
                      <div className="tc-buyer-metric-val text-emerald">Bidding Open</div>
                      <span className="tc-buyer-metric-hint">Direct Negotiations</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">TRANSIT COMPLIANCE</span>
                      <div className="tc-buyer-metric-val">100% Passes</div>
                      <span className="tc-buyer-metric-hint">KL Forest Dept</span>
                    </div>
                  </div>

                  <div className="tc-buyer-bottom-grid">
                    <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                      <span className="tc-buyer-metric-label">MARKET INVENTORY</span>
                      <div className="text-sm font-semibold text-slate-200">
                        {listings.length} verified commercial lots ready for bidding
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-end">
                      <Link to="/buyer/marketplace" className="tc-buyer-action-btn w-full justify-center">
                        <ShoppingBag size={15} /> Enter Timber Marketplace →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* CARD 2: MY NEGOTIATIONS */}
                <div className="tc-buyer-card tc-buyer-card-amber">
                  <div className="tc-buyer-header">
                    <div className="tc-buyer-user-info">
                      <div className="tc-buyer-avatar-badge text-amber-400 bg-amber-500/15 border-amber-500/30">
                        <Handshake size={22} />
                      </div>
                      <div className="tc-buyer-title-group">
                        <div className="tc-buyer-title-row">
                          <span className="tc-buyer-title">My Negotiations</span>
                          <span className="tc-buyer-verified-badge tc-buyer-verified-badge-amber">
                            {negotiations.length} Total Bids
                          </span>
                        </div>
                        <p className="tc-buyer-subtitle">
                          Commercial bargaining engine: submit custom volume rates, review seller counter-proposals, and finalize contracts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="tc-buyer-metrics-grid">
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">TOTAL BIDS SUBMITTED</span>
                      <div className="tc-buyer-metric-val">{negotiations.length} Bids</div>
                      <span className="tc-buyer-metric-hint">Active & Closed</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">COUNTER-OFFERS</span>
                      <div className="tc-buyer-metric-val text-amber-400">
                        {waitingCountersCount} Waiting
                      </div>
                      <span className="tc-buyer-metric-hint">Requires Action</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">DEALS CLOSED</span>
                      <div className="tc-buyer-metric-val text-emerald">
                        {closedDealsCount} Agreed
                      </div>
                      <span className="tc-buyer-metric-hint">Converted to Orders</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">TERMS</span>
                      <div className="tc-buyer-metric-val">Custom / m³</div>
                      <span className="tc-buyer-metric-hint">Volume Discounts</span>
                    </div>
                  </div>

                  <div className="tc-buyer-bottom-grid">
                    <div className="tc-buyer-amber-cell col-span-1 sm:col-span-2">
                      <span className="tc-buyer-metric-label text-amber-300">ACTIVE PRICE DISCUSSIONS</span>
                      <div className="text-sm font-semibold text-slate-200">
                        {activeNegotiationsCount} deals currently in discussion
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-end">
                      <Link to="/buyer/negotiations" className="tc-buyer-action-amber-btn w-full justify-center">
                        <Handshake size={15} /> Manage Negotiations & Bids →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* CARD 3: PURCHASE ORDERS & LOGISTICS */}
                <div className="tc-buyer-card tc-buyer-card-blue">
                  <div className="tc-buyer-header">
                    <div className="tc-buyer-user-info">
                      <div className="tc-buyer-avatar-badge text-blue-400 bg-blue-500/15 border-blue-500/30">
                        <Truck size={22} />
                      </div>
                      <div className="tc-buyer-title-group">
                        <div className="tc-buyer-title-row">
                          <span className="tc-buyer-title">Purchase Orders & Logistics</span>
                          <span className="tc-buyer-verified-badge tc-buyer-verified-badge-blue">
                            {orders.length} Confirmed
                          </span>
                        </div>
                        <p className="tc-buyer-subtitle">
                          Records of successful purchase offers, highway log hauling tracking, transit passes, and gate weighbridge receipts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="tc-buyer-metrics-grid">
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">CONFIRMED ORDERS</span>
                      <div className="tc-buyer-metric-val">{orders.length} Orders</div>
                      <span className="tc-buyer-metric-hint">Contracted Lots</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">IN-TRANSIT TRUCKS</span>
                      <div className="tc-buyer-metric-val text-blue-400">{inTransitOrdersCount} Trucks</div>
                      <span className="tc-buyer-metric-hint">Highway Dispatch</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">ESCROW SECURITY</span>
                      <div className="tc-buyer-metric-val text-emerald">100% Protected</div>
                      <span className="tc-buyer-metric-hint">Weighbridge Payout</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">DESTINATION</span>
                      <div className="tc-buyer-metric-val truncate">Mill Yard #2</div>
                      <span className="tc-buyer-metric-hint">Ernakulam, KL</span>
                    </div>
                  </div>

                  <div className="tc-buyer-bottom-grid">
                    <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                      <span className="tc-buyer-metric-label">DELIVERY STATUS</span>
                      <div className="text-sm font-semibold text-slate-200">
                        {activeDeliveryText}
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-end">
                      <Link to="/buyer/orders" className="tc-buyer-action-btn w-full justify-center">
                        <Truck size={15} /> Track Shipments & Passes →
                      </Link>
                    </div>
                  </div>
                </div>

                {/* CARD 4: MARKET TRENDS & INTELLIGENCE */}
                <div className="tc-buyer-card">
                  <div className="tc-buyer-header">
                    <div className="tc-buyer-user-info">
                      <div className="tc-buyer-avatar-badge text-purple-400 bg-purple-500/15 border-purple-500/30">
                        <TrendingUp size={22} />
                      </div>
                      <div className="tc-buyer-title-group">
                        <div className="tc-buyer-title-row">
                          <span className="tc-buyer-title">Market Trends & Rates</span>
                          <span className="tc-buyer-verified-badge">
                            Live Kerala Index
                          </span>
                        </div>
                        <p className="tc-buyer-subtitle">
                          District-wise timber benchmark rates, quarterly auction trends, and species price charts across Kerala depots.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="tc-buyer-metrics-grid">
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">TEAKWOOD BENCHMARK</span>
                      <div className="tc-buyer-metric-val text-emerald">₹ 42,500/m³</div>
                      <span className="tc-buyer-metric-hint">+2.4% this quarter</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">ROSEWOOD BENCHMARK</span>
                      <div className="tc-buyer-metric-val text-emerald">₹ 58,000/m³</div>
                      <span className="tc-buyer-metric-hint">Prime Veneer Grade</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">RUBBERWOOD RATE</span>
                      <div className="tc-buyer-metric-val">₹ 12,800/m³</div>
                      <span className="tc-buyer-metric-hint">Industrial Furniture</span>
                    </div>
                    <div className="tc-buyer-metric-cell">
                      <span className="tc-buyer-metric-label">MAHOGANY RATE</span>
                      <div className="tc-buyer-metric-val">₹ 24,000/m³</div>
                      <span className="tc-buyer-metric-hint">Commercial Joinery</span>
                    </div>
                  </div>

                  <div className="tc-buyer-bottom-grid">
                    <div className="tc-buyer-highlight-cell col-span-1 sm:col-span-2">
                      <span className="tc-buyer-metric-label">INTELLIGENCE SCOPE</span>
                      <div className="text-sm font-semibold text-slate-200">
                        Official benchmark rates for Wayanad, Palakkad & Ernakulam
                      </div>
                    </div>
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-end">
                      <button
                        onClick={() => alert('Market intelligence report: Kerala Forest Dept hardwood auction indices update quarterly. Use these benchmark rates during your price negotiations.')}
                        className="tc-buyer-pill-btn w-full justify-center"
                      >
                        <TrendingUp size={15} /> View Price Guidelines →
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. RELATED SETTLEMENT & SECURITY CARD (IMAGE 1 STYLE) */}
            {/* ========================================================= */}
            <div className="tc-buyer-card">
              <div className="tc-buyer-header">
                <div className="tc-buyer-user-info">
                  <div className="tc-buyer-avatar-badge">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="tc-buyer-title-group">
                    <div className="tc-buyer-title-row">
                      <span className="tc-buyer-title">TreeConnect Buyer Protection & Escrow Guarantee</span>
                      <span className="tc-buyer-verified-badge">
                        100% Insured
                      </span>
                    </div>
                    <p className="tc-buyer-subtitle">
                      Commercial settlement standards: funds are held in secure escrow and released only upon mill weighbridge inspection confirmation.
                    </p>
                  </div>
                </div>

                <div className="tc-buyer-header-actions">
                  <Link to="/profile" className="tc-buyer-pill-btn">
                    <Building size={13} /> Mill Profile Settings
                  </Link>
                </div>
              </div>

              <div className="tc-buyer-metrics-grid">
                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">ESCROW PROTECTION</span>
                  <div className="tc-buyer-metric-val text-emerald">Active</div>
                  <span className="tc-buyer-metric-hint">Milestone Payouts</span>
                </div>
                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">WEIGHBRIDGE CLEARANCE</span>
                  <div className="tc-buyer-metric-val">Mandatory</div>
                  <span className="tc-buyer-metric-hint">Pre-Release Check</span>
                </div>
                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">TRANSIT PASS REGISTRY</span>
                  <div className="tc-buyer-metric-val">Form IV / IV-A</div>
                  <span className="tc-buyer-metric-hint">Kerala Forest Dept</span>
                </div>
                <div className="tc-buyer-metric-cell">
                  <span className="tc-buyer-metric-label">DISPUTE MEDIATION</span>
                  <div className="tc-buyer-metric-val text-blue-400">Guaranteed</div>
                  <span className="tc-buyer-metric-hint">24hr Arbitration</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-muted flex items-center justify-between border-t border-color/40">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald flex-shrink-0" />
                  <span>Logged in as: <strong className="text-slate-200">{buyerName}</strong> ({buyerEmail})</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">Buyer ID: {buyerEmail}</span>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
