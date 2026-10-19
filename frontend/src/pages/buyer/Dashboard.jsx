import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import {
  LayoutDashboard,
  ShoppingBag,
  Filter,
  Truck,
  DollarSign,
  Package,
  Check,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
  X,
  FileText,
  Building,
  Award,
  Trees,
  Search,
  MessageSquare,
  Handshake,
  RotateCcw,
  Sparkles,
  Phone,
  Eye,
  AlertCircle
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerCompany = user?.companyName || user?.company_name || 'timberbuyers';
  const buyerEmail = (user?.email || 'buyer@treeconnect.com').toLowerCase().trim();

  // Helper to map route path to active tab
  const getTabFromPath = (path) => {
    if (path === '/buyer/dashboard' || path === '/buyer') return 'hub';
    if (path === '/buyer/marketplace') return 'marketplace';
    if (path === '/buyer/negotiations') return 'negotiations';
    if (path === '/buyer/orders') return 'orders';
    if (path === '/buyer/analytics') return 'analytics';
    return 'hub';
  };

  // Active view tab: 'hub' | 'marketplace' | 'negotiations' | 'orders' | 'analytics'
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const tabRoutes = {
      hub: '/buyer/dashboard',
      marketplace: '/buyer/marketplace',
      negotiations: '/buyer/negotiations',
      orders: '/buyer/orders',
      analytics: '/buyer/analytics'
    };
    if (tabRoutes[tabKey] && location.pathname !== tabRoutes[tabKey]) {
      navigate(tabRoutes[tabKey]);
    }
  };

  // Data state from marketplaceService
  const [listings, setListings] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sellerRoleFilter, setSellerRoleFilter] = useState('All'); // 'All' | 'landowner' | 'contractor'
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'volume_desc'

  // Modals
  const [selectedListingForDetails, setSelectedListingForDetails] = useState(null);

  // Negotiation Modal
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false);
  const [negotiateTarget, setNegotiateTarget] = useState(null);
  const [negotiateForm, setNegotiateForm] = useState({
    offeredPricePerM3: '',
    requestedVolume: '',
    deliveryPreference: 'Seller Contractor Hauling to Mill',
    destinationMill: 'Ernakulam Timber Mill Yard #2',
    paymentTerms: '50% Advance Escrow + 50% Post-Weighbridge',
    notes: ''
  });

  // Buy Now Modal
  const [buyNowModalOpen, setBuyNowModalOpen] = useState(false);
  const [buyNowTarget, setBuyNowTarget] = useState(null);
  const [buyNowForm, setBuyNowForm] = useState({
    volume: '',
    destinationMill: 'Ernakulam Timber Mill Yard #2',
    haulingCarrier: 'Kerala Agro Logistics Fleet',
    paymentMethod: 'TreeConnect Escrow (Standard Safe Settlement)',
    notes: ''
  });

  // Counter response modal (for buyer to reply to seller's counter)
  const [counterReplyModalOpen, setCounterReplyModalOpen] = useState(false);
  const [selectedNegotiationForReply, setSelectedNegotiationForReply] = useState(null);
  const [counterReplyPrice, setCounterReplyPrice] = useState('');
  const [counterReplyMessage, setCounterReplyMessage] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    setListings(marketplaceService.getListings());
    setNegotiations(marketplaceService.getNegotiations());
    setOrders(marketplaceService.getOrders());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('treeconnect_marketplace_updated', handleUpdate);
    return () => window.removeEventListener('treeconnect_marketplace_updated', handleUpdate);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Buyer's negotiations
  const myNegotiations = negotiations.filter(n => {
    if (!n) return false;
    const bEmail = (n.buyerEmail || '').toLowerCase().trim();
    if (buyerEmail && bEmail === buyerEmail) return true;
    return true; // default include seed negotiations for preview
  });

  // Buyer's orders
  const myOrders = orders.filter(o => {
    if (!o) return false;
    const bEmail = (o.buyerEmail || '').toLowerCase().trim();
    if (buyerEmail && bEmail === buyerEmail) return true;
    return true;
  });

  // Metrics
  const totalMarketVolume = listings
    .filter(l => l.status === 'Published' || l.status === 'Under Negotiation')
    .reduce((sum, item) => sum + (Number(item.volume) || 0), 0);

  const activeNegotiationsCount = myNegotiations.filter(n => n.status === 'Pending Review' || n.status === 'Counter-Offer').length;
  const activeShipmentsCount = myOrders.filter(o => o.status?.includes('Transit') || o.status?.includes('Scheduled')).length;

  const totalProcurementSpend = myOrders.reduce((sum, ord) => sum + (Number(ord.totalNum) || 0), 0);

  // Filtered & Sorted listings
  const filteredListings = listings.filter((item) => {
    if (item.status === 'Sold') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSpecies = (item.timberSpecies || '').toLowerCase().includes(q);
      const matchSeller = (item.sellerName || '').toLowerCase().includes(q);
      const matchLocation = (item.district || '').toLowerCase().includes(q) || (item.storageLocation || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSpecies && !matchSeller && !matchLocation) return false;
    }

    // Seller Role
    if (sellerRoleFilter !== 'All' && item.sellerRole !== sellerRoleFilter) {
      return false;
    }

    // Species
    if (selectedSpecies !== 'All' && !item.timberSpecies?.toLowerCase().includes(selectedSpecies.toLowerCase())) {
      return false;
    }

    // Grade
    if (selectedGrade !== 'All' && !item.gradeQuality?.toLowerCase().includes(selectedGrade.toLowerCase())) {
      return false;
    }

    // District
    if (selectedDistrict !== 'All' && item.district !== selectedDistrict) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return (Number(a.pricePerM3) || 0) - (Number(b.pricePerM3) || 0);
    if (sortBy === 'price_desc') return (Number(b.pricePerM3) || 0) - (Number(a.pricePerM3) || 0);
    if (sortBy === 'volume_desc') return (Number(b.volume) || 0) - (Number(a.volume) || 0);
    return (b.id || '').localeCompare(a.id || '');
  });

  // Handler: Open Negotiation Modal
  const handleOpenNegotiate = (listing) => {
    setNegotiateTarget(listing);
    setNegotiateForm({
      offeredPricePerM3: Math.round((listing.pricePerM3 || 35000) * 0.92), // default ~8% lower for opening bid
      requestedVolume: listing.volume || 25,
      deliveryPreference: listing.transportAvailable ? 'Seller Contractor Hauling to Mill' : 'Buyer Logistics / Mill Truck Dispatch',
      destinationMill: 'Ernakulam Timber Mill Yard #2',
      paymentTerms: '50% Advance Escrow + 50% Post-Weighbridge',
      notes: `We are interested in procuring this ${listing.timberSpecies} lot. Ready to dispatch trucks upon permit approval.`
    });
    setNegotiateModalOpen(true);
  };

  // Handler: Submit Negotiation
  const handleSubmitNegotiation = (e) => {
    e.preventDefault();
    if (!negotiateTarget) return;

    try {
      marketplaceService.createNegotiation({
        listingId: negotiateTarget.id,
        timberTitle: negotiateTarget.title || `${negotiateTarget.gradeQuality} ${negotiateTarget.timberSpecies}`,
        timberSpecies: negotiateTarget.timberSpecies,
        sellerRole: negotiateTarget.sellerRole,
        sellerName: negotiateTarget.sellerName,
        sellerEmail: negotiateTarget.sellerEmail,
        buyerName,
        buyerEmail,
        buyerCompany,
        originalPricePerM3: negotiateTarget.pricePerM3,
        offeredPricePerM3: Number(negotiateForm.offeredPricePerM3),
        requestedVolume: Number(negotiateForm.requestedVolume),
        deliveryPreference: negotiateForm.deliveryPreference,
        paymentTerms: negotiateForm.paymentTerms,
        notes: negotiateForm.notes
      }, user);

      setNegotiateModalOpen(false);
      showToast(`Negotiation offer submitted to ${negotiateTarget.sellerName} (${negotiateTarget.sellerRole})!`);
      loadData();
      handleTabChange('negotiations');
    } catch (err) {
      console.error(err);
      alert('Failed to submit negotiation offer');
    }
  };

  // Handler: Open Buy Now
  const handleOpenBuyNow = (listing) => {
    setBuyNowTarget(listing);
    setBuyNowForm({
      volume: listing.volume || 30,
      destinationMill: 'Ernakulam Timber Mill Yard #2',
      haulingCarrier: listing.sellerRole === 'contractor' ? `${listing.sellerName} Fleet` : 'Kerala Forest Freight Logistics',
      paymentMethod: 'TreeConnect Escrow (Standard Safe Settlement)',
      notes: 'Standard delivery requested with KL forest department transit pass.'
    });
    setBuyNowModalOpen(true);
  };

  // Handler: Confirm Purchase Order
  const handleConfirmPurchase = (e) => {
    e.preventDefault();
    if (!buyNowTarget) return;

    try {
      const newOrder = marketplaceService.createOrder({
        listingId: buyNowTarget.id,
        timberItem: buyNowTarget.title || `${buyNowTarget.timberSpecies} Sawlogs`,
        species: buyNowTarget.timberSpecies,
        volume: Number(buyNowForm.volume),
        unitPrice: buyNowTarget.pricePerM3,
        sellerRole: buyNowTarget.sellerRole,
        sellerName: buyNowTarget.sellerName,
        sellerEmail: buyNowTarget.sellerEmail,
        destinationMill: buyNowForm.destinationMill,
        contractor: buyNowForm.haulingCarrier,
        paymentTerms: buyNowForm.paymentMethod,
        buyerName,
        buyerEmail
      }, user);

      setBuyNowModalOpen(false);
      showToast(`Purchase order ${newOrder.id} confirmed! Timber dispatch scheduled.`);
      loadData();
      handleTabChange('orders');
    } catch (err) {
      console.error(err);
      alert('Failed to process purchase order');
    }
  };

  // Handler: Accept Counter-Offer from Seller
  const handleAcceptSellerCounter = (neg) => {
    const finalPrice = neg.counterOffer ? neg.counterOffer.pricePerM3 : neg.offeredPricePerM3;

    try {
      // 1. Mark negotiation accepted
      marketplaceService.respondToNegotiation(neg.id, 'accept', {
        sender: 'Buyer',
        senderName: buyerName,
        message: `Buyer accepted counter-offer of ₹${finalPrice.toLocaleString('en-IN')}/m³.`
      });

      // 2. Open purchase checkout with agreed price
      const listing = marketplaceService.getListingById(neg.listingId) || {
        id: neg.listingId,
        title: neg.timberTitle,
        timberSpecies: neg.timberSpecies,
        sellerRole: neg.sellerRole,
        sellerName: neg.sellerName,
        sellerEmail: neg.sellerEmail,
        pricePerM3: finalPrice,
        volume: neg.requestedVolume
      };

      setBuyNowTarget({ ...listing, pricePerM3: finalPrice, volume: neg.requestedVolume });
      setBuyNowForm({
        volume: neg.requestedVolume,
        destinationMill: 'Ernakulam Timber Mill Yard #2',
        haulingCarrier: neg.sellerRole === 'contractor' ? `${neg.sellerName} Fleet` : 'Kerala Agro Logistics',
        paymentMethod: neg.paymentTerms || 'TreeConnect Escrow (Standard Safe Settlement)',
        notes: `Purchase from agreed negotiation #${neg.id}.`
      });
      setBuyNowModalOpen(true);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-7xl mx-auto py-6">

            {/* HERO BANNER */}
            <section className="hero-welcome-card card mb-6 border border-color rounded-2xl bg-card overflow-hidden">
              <div className="hero-welcome-body p-6 flex flex-wrap items-center justify-between gap-6">
                <div className="hero-welcome-text max-w-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="hero-greeting-badge px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                      <Award size={14} /> Commercial Timber Procurement Portal
                    </span>
                    <span className="text-xs text-muted font-medium">Kerala Forest Exchange</span>
                  </div>

                  <h1 className="hero-title-text text-3xl font-extrabold text-main mb-2">
                    Welcome Back, {buyerName}
                  </h1>
                  <p className="hero-subtitle-text text-sm text-muted leading-relaxed">
                    Browse certified timber lots uploaded directly by <strong className="text-emerald">Estate Landowners</strong> and <strong className="text-blue-400">Harvesting Contractors</strong>. Negotiate custom rates, buy lots directly, and track live mill deliveries.
                  </p>

                  {/* Summary Metric Pills */}
                  <div className="today-summary-pills flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
                    <div className="summary-pill px-3 py-1.5 rounded-lg bg-surface border border-color flex items-center gap-2">
                      <span className="pill-dot w-2 h-2 rounded-full bg-emerald"></span>
                      <span className="pill-val text-white font-mono">{totalMarketVolume.toFixed(1)} m³</span> Available Volume
                    </div>
                    <div className="summary-pill px-3 py-1.5 rounded-lg bg-surface border border-color flex items-center gap-2">
                      <span className="pill-dot w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="pill-val text-white font-mono">{activeNegotiationsCount}</span> Active Negotiations
                    </div>
                    <div className="summary-pill px-3 py-1.5 rounded-lg bg-surface border border-color flex items-center gap-2">
                      <span className="pill-dot w-2 h-2 rounded-full bg-blue-400"></span>
                      <span className="pill-val text-white font-mono">{activeShipmentsCount}</span> Active Shipments
                    </div>
                    <div className="summary-pill px-3 py-1.5 rounded-lg bg-surface border border-color flex items-center gap-2">
                      <span className="pill-dot w-2 h-2 rounded-full bg-gold"></span>
                      <span className="pill-val text-gold font-mono">₹ {(totalProcurementSpend / 10000000).toFixed(2)} Cr</span> Total Procurement
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="flex flex-col gap-2.5 min-w-[200px]">
                  <button
                    onClick={() => handleTabChange('marketplace')}
                    className="btn btn-primary btn-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald/20"
                  >
                    <ShoppingBag size={16} /> Procure Timber Lots
                  </button>
                  <button
                    onClick={() => handleTabChange('negotiations')}
                    className="btn btn-secondary btn-sm flex items-center justify-center gap-2"
                  >
                    <Handshake size={16} /> My Negotiations ({activeNegotiationsCount})
                  </button>
                  <button
                    onClick={() => handleTabChange('orders')}
                    className="btn btn-secondary btn-sm flex items-center justify-center gap-2"
                  >
                    <Truck size={16} /> Track Shipments ({activeShipmentsCount})
                  </button>
                </div>
              </div>
            </section>

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center gap-3 shadow-xl animate-fade-in">
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                <span className="font-semibold text-sm">{toastMessage}</span>
              </div>
            )}

            {/* KPI METRIC CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div
                onClick={() => handleTabChange('marketplace')}
                className="kpi-card card p-4 rounded-xl border border-color bg-card cursor-pointer hover:border-emerald/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Market Inventory</span>
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <ShoppingBag size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-main font-mono">{totalMarketVolume.toFixed(1)} m³</div>
                <div className="text-xs text-emerald flex items-center gap-1 mt-1 font-semibold">
                  <TrendingUp size={12} /> {listings.length} verified listings across Kerala
                </div>
              </div>

              <div
                onClick={() => handleTabChange('negotiations')}
                className="kpi-card card p-4 rounded-xl border border-color bg-card cursor-pointer hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Active Price Bids</span>
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <Handshake size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">{activeNegotiationsCount} Deals</div>
                <div className="text-xs text-muted mt-1">Bargaining with Landowners & Contractors</div>
              </div>

              <div
                onClick={() => handleTabChange('orders')}
                className="kpi-card card p-4 rounded-xl border border-color bg-card cursor-pointer hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Active Mill Transit</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald/15 text-emerald flex items-center justify-center">
                    <Truck size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald font-mono">{activeShipmentsCount} Shipments</div>
                <div className="text-xs text-emerald flex items-center gap-1 mt-1 font-semibold">
                  <ShieldCheck size={12} /> 100% Forest Pass Clearance
                </div>
              </div>

              <div
                onClick={() => handleTabChange('orders')}
                className="kpi-card card p-4 rounded-xl border border-color bg-card cursor-pointer hover:border-gold/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Procurement Spend</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-gold font-mono">
                  ₹ {(totalProcurementSpend / 10000000).toFixed(2)} Cr
                </div>
                <div className="text-xs text-muted mt-1">Through TreeConnect Escrow</div>
              </div>
            </section>

            {/* TAB CONTROLS */}
            <div className="flex items-center gap-2 border-b border-color mb-6 overflow-x-auto pb-1">
              <button
                onClick={() => handleTabChange('hub')}
                className={`px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'hub'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                <LayoutDashboard size={18} /> Procurement Hub
              </button>

              <button
                onClick={() => handleTabChange('marketplace')}
                className={`px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'marketplace'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                <ShoppingBag size={18} /> Timber Marketplace ({filteredListings.length})
              </button>

              <button
                onClick={() => handleTabChange('negotiations')}
                className={`px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 relative cursor-pointer ${
                  activeTab === 'negotiations'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Handshake size={18} /> My Negotiations
                {activeNegotiationsCount > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-black font-bold">
                    {activeNegotiationsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('orders')}
                className={`px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Truck size={18} /> Purchase Orders ({myOrders.length})
              </button>

              <button
                onClick={() => handleTabChange('analytics')}
                className={`px-5 py-3 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-card text-emerald border-b-2 border-emerald shadow-sm'
                    : 'text-muted hover:text-main'
                }`}
              >
                <TrendingUp size={18} /> Market Trends
              </button>
            </div>

            {/* ========================================================= */}
            {/* TAB 0: PROCUREMENT HUB (EXECUTIVE COMMAND CENTER) */}
            {/* ========================================================= */}
            {activeTab === 'hub' && (
              <div className="space-y-6">
                {/* 4 Command Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    onClick={() => handleTabChange('marketplace')}
                    className="card p-5 rounded-2xl border border-color bg-card hover:border-emerald/60 transition-all cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald/15 text-emerald flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag size={20} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                        {listings.length} Lots
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-main group-hover:text-emerald transition-colors">Timber Marketplace</h3>
                    <p className="text-xs text-muted mt-1 mb-3">
                      Procure verified hardwood sawlogs from certified landowners & contractors across Kerala.
                    </p>
                    <div className="text-xs font-bold text-emerald flex items-center gap-1">
                      Browse Marketplace <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div
                    onClick={() => handleTabChange('negotiations')}
                    className="card p-5 rounded-2xl border border-color bg-card hover:border-amber-500/60 transition-all cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Handshake size={20} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        {activeNegotiationsCount} Active
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-main group-hover:text-amber-400 transition-colors">My Negotiations</h3>
                    <p className="text-xs text-muted mt-1 mb-3">
                      Direct volume bargaining, counter-offers, and transparent pricing with timber sellers.
                    </p>
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      Review Offers <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div
                    onClick={() => handleTabChange('orders')}
                    className="card p-5 rounded-2xl border border-color bg-card hover:border-blue-500/60 transition-all cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck size={20} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/60">
                        {activeShipmentsCount} In-Transit
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-main group-hover:text-blue-400 transition-colors">Purchase Orders & Hauling</h3>
                    <p className="text-xs text-muted mt-1 mb-3">
                      Live mill yard dispatch tracking, weighbridge slips, and Forest Dept transit passes.
                    </p>
                    <div className="text-xs font-bold text-blue-400 flex items-center gap-1">
                      Track Shipments <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  <div
                    onClick={() => handleTabChange('analytics')}
                    className="card p-5 rounded-2xl border border-color bg-card hover:border-purple-500/60 transition-all cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60">
                        Live Index
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-main group-hover:text-purple-400 transition-colors">Market Trends & Rates</h3>
                    <p className="text-xs text-muted mt-1 mb-3">
                      District-wise timber benchmark rates, quarterly auction trends, and species price charts.
                    </p>
                    <div className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      Explore Trends <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* ACTIVE NEGOTIATIONS ALERT STRIP (if any) */}
                {myNegotiations.length > 0 && (
                  <div className="card p-5 rounded-2xl border border-amber-500/40 bg-amber-950/20 shadow-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                        <h3 className="text-sm font-bold text-amber-300">
                          Active Negotiations Snapshot ({myNegotiations.length} Pending Actions)
                        </h3>
                      </div>
                      <button
                        onClick={() => handleTabChange('negotiations')}
                        className="btn btn-secondary btn-xs text-xs flex items-center gap-1 text-amber-300 hover:text-white"
                      >
                        Open Full Negotiations View <ArrowRight size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {myNegotiations.slice(0, 2).map((neg) => {
                        const isCounter = neg.status === 'Counter-Offer';
                        return (
                          <div
                            key={neg.id}
                            className={`p-3.5 rounded-xl border bg-card/80 text-xs flex flex-col justify-between gap-2.5 ${
                              isCounter ? 'border-amber-500/60' : 'border-color'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-white text-sm line-clamp-1">{neg.timberTitle}</span>
                                <span className="text-muted block text-[11px] mt-0.5">
                                  Seller: <strong className="text-slate-300">{neg.sellerName}</strong> • {neg.volume || neg.requestedVolume} m³
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCounter ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-surface text-muted border border-color'
                                }`}
                              >
                                {neg.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-color/60">
                              <span className="font-mono text-slate-300">
                                Bid: <strong className="text-emerald">₹{Number(neg.offeredPricePerM3).toLocaleString('en-IN')}/m³</strong>
                                {neg.counterOffer && (
                                  <span className="text-amber-400 font-bold ml-2">
                                    Counter: ₹{Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')}/m³
                                  </span>
                                )}
                              </span>
                              {isCounter ? (
                                <button
                                  onClick={() => handleAcceptSellerCounter(neg)}
                                  className="btn btn-primary btn-xs text-[11px] font-bold py-1 px-2.5"
                                >
                                  Accept Counter
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleTabChange('negotiations')}
                                  className="btn btn-secondary btn-xs text-[11px] py-1 px-2.5"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ACTIVE LOGISTICS SHIPMENT SPOTLIGHT (if any) */}
                {myOrders.length > 0 && myOrders[0] && (
                  <div className="card p-5 rounded-2xl border border-blue-500/40 bg-card shadow-lg space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-color">
                      <div className="flex items-center gap-2">
                        <Truck size={20} className="text-blue-400" />
                        <div>
                          <h3 className="text-sm font-bold text-main">Live Mill Dispatch: {myOrders[0].timberItem}</h3>
                          <p className="text-xs text-muted">
                            Order {myOrders[0].id} • Contractor: <strong className="text-slate-300">{myOrders[0].contractor}</strong>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="btn btn-secondary btn-xs text-xs flex items-center gap-1 text-blue-300 hover:text-white"
                      >
                        All Orders & Shipments <ArrowRight size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface p-3 rounded-xl border border-color">
                      <div>
                        <span className="text-muted block">Volume</span>
                        <span className="font-bold text-emerald font-mono">{myOrders[0].volume}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Transit Pass</span>
                        <span className="font-bold text-white font-mono">{myOrders[0].passNo || 'KL-FD-2026-981'}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Destination Mill</span>
                        <span className="font-bold text-white line-clamp-1">{myOrders[0].mill}</span>
                      </div>
                      <div>
                        <span className="text-muted block">ETA Delivery</span>
                        <span className="font-bold text-amber-400 font-mono">{myOrders[0].ETA}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                        <span className="text-slate-300">Highway Hauling Progress</span>
                        <span className="text-emerald font-mono font-bold">{myOrders[0].progress || 75}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface overflow-hidden border border-color">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
                          style={{ width: `${myOrders[0].progress || 75}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURED MARKETPLACE LOTS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-main flex items-center gap-2">
                        <Sparkles size={18} className="text-emerald" /> Fresh Timber Lots Ready for Mill Procurement
                      </h2>
                      <p className="text-xs text-muted">Direct from certified Wayanad, Palakkad, Kottayam and Idukki plantations</p>
                    </div>
                    <button
                      onClick={() => handleTabChange('marketplace')}
                      className="btn btn-secondary btn-sm flex items-center gap-1.5 font-bold text-emerald hover:text-white"
                    >
                      Browse All ({listings.length}) <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.slice(0, 3).map((item) => {
                      const isContractor = item.sellerRole === 'contractor';
                      return (
                        <div
                          key={item.id}
                          className="card rounded-2xl border border-color bg-card overflow-hidden hover:border-emerald/50 transition-all flex flex-col justify-between shadow-lg group"
                        >
                          {/* Image / Header Banner */}
                          <div className="relative h-44 bg-surface overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-muted">
                                <ShoppingBag size={40} className="mb-2 opacity-40 text-emerald" />
                                <span className="text-sm font-semibold text-slate-300">{item.timberSpecies}</span>
                                <span className="text-[11px] text-muted">{item.category}</span>
                              </div>
                            )}

                            <div className="absolute top-3 left-3">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-md ${
                                  isContractor
                                    ? 'bg-blue-600/95 text-white'
                                    : 'bg-emerald-600/95 text-white'
                                }`}
                              >
                                {isContractor ? <Truck size={12} /> : <Trees size={12} />}
                                {isContractor ? 'Contractor Lot' : 'Landowner Lot'}
                              </span>
                            </div>

                            <div className="absolute top-3 right-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-sm text-emerald-300 border border-emerald-500/40">
                                Available
                              </span>
                            </div>

                            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-slate-200">
                              <span className="flex items-center gap-1 font-semibold">
                                <ShieldCheck size={12} className="text-emerald" /> {item.certification || 'Verified Farm Forestry'}
                              </span>
                            </div>
                          </div>

                          {/* Details Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                                <span>
                                  Sold by: <strong className="text-emerald font-semibold">{item.sellerName}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-[11px]">
                                  <MapPin size={11} className="text-muted" /> {item.district}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-main line-clamp-1 group-hover:text-emerald transition-colors">
                                {item.title || `${item.timberSpecies} Sawlogs`}
                              </h3>
                              <p className="text-xs text-muted line-clamp-2 mt-1">{item.description}</p>
                            </div>

                            {/* Volume & Price Box */}
                            <div className="p-3 rounded-xl bg-surface border border-color grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted block text-[11px]">Available Volume:</span>
                                <span className="font-extrabold text-emerald text-base font-mono">{item.volume} m³</span>
                                {item.logCount && <div className="text-[10px] text-muted">({item.logCount} logs)</div>}
                              </div>

                              <div className="text-right">
                                <span className="text-muted block text-[11px]">Rate / m³:</span>
                                <span className="font-extrabold text-white text-base font-mono">
                                  ₹ {Number(item.pricePerM3).toLocaleString('en-IN')}
                                </span>
                                <div className="text-[10px] text-muted">per cubic meter</div>
                              </div>

                              <div className="col-span-2 pt-2 border-t border-color/60 flex items-center justify-between text-[11px]">
                                <span className="text-muted">Quality Grade:</span>
                                <span className="font-bold text-slate-200">{item.grade}</span>
                              </div>

                              <div className="col-span-2 flex items-center justify-between text-[11px]">
                                <span className="text-muted">Total Asking Price:</span>
                                <span className="font-bold text-gold font-mono">
                                  ₹ {Number(item.totalAskingPrice || (item.volume * item.pricePerM3)).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            {/* Actions: Specs, Negotiate, Buy Now */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-color">
                              <button
                                onClick={() => setSelectedListingForDetails(item)}
                                className="btn btn-secondary btn-sm text-xs py-2 px-2 flex items-center justify-center gap-1 font-semibold"
                                title="View log specifications"
                              >
                                <Eye size={13} /> Specs
                              </button>

                              <button
                                onClick={() => handleOpenNegotiate(item)}
                                className="btn btn-secondary btn-sm text-xs py-2 px-2 flex items-center justify-center gap-1 font-semibold text-amber-400 hover:text-white"
                                title="Submit price counter-offer"
                              >
                                <Handshake size={13} /> Negotiate
                              </button>

                              <button
                                onClick={() => handleOpenBuyNow(item)}
                                className="btn btn-primary btn-sm text-xs py-2 px-2 flex items-center justify-center gap-1 font-bold shadow-md shadow-emerald/20"
                                title="Instant escrow purchase"
                              >
                                Buy Now <ArrowRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 1: BROWSE TIMBER MARKETPLACE (CORE BUYER FEED) */}
            {/* ========================================================= */}
            {activeTab === 'marketplace' && (
              <div className="space-y-6">

                {/* SEARCH & MULTI-FILTER BAR */}
                <div className="card p-5 rounded-2xl border border-color bg-card shadow-lg space-y-4">
                  <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by timber species (Teak, Rosewood), estate, yard, or district..."
                        className="form-input pl-10 text-sm font-medium w-full bg-surface"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Quick Seller Role Filter Buttons */}
                    <div className="flex items-center gap-1.5 p-1 bg-surface rounded-xl border border-color text-xs">
                      <button
                        onClick={() => setSellerRoleFilter('All')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          sellerRoleFilter === 'All'
                            ? 'bg-emerald text-dark shadow-sm'
                            : 'text-muted hover:text-white'
                        }`}
                      >
                        All Sellers
                      </button>
                      <button
                        onClick={() => setSellerRoleFilter('landowner')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          sellerRoleFilter === 'landowner'
                            ? 'bg-emerald text-dark shadow-sm'
                            : 'text-muted hover:text-white'
                        }`}
                      >
                        <Trees size={14} /> Landowners
                      </button>
                      <button
                        onClick={() => setSellerRoleFilter('contractor')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          sellerRoleFilter === 'contractor'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-muted hover:text-white'
                        }`}
                      >
                        <Truck size={14} /> Contractors
                      </button>
                    </div>
                  </div>

                  {/* Secondary Filter Dropdowns */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-color text-xs">
                    <div>
                      <label className="text-muted block mb-1 font-semibold">Species</label>
                      <select
                        value={selectedSpecies}
                        onChange={(e) => setSelectedSpecies(e.target.value)}
                        className="form-input text-xs py-1.5"
                      >
                        <option value="All">All Species</option>
                        <option value="Teakwood">Teakwood</option>
                        <option value="Rosewood">Rosewood</option>
                        <option value="Rubberwood">Rubberwood</option>
                        <option value="Mahogany">Mahogany</option>
                        <option value="Eucalyptus">Eucalyptus</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-muted block mb-1 font-semibold">Quality Grade</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="form-input text-xs py-1.5"
                      >
                        <option value="All">All Grades</option>
                        <option value="Grade A">Grade A Prime Sawlogs</option>
                        <option value="Veneer">Premium Veneer Grade</option>
                        <option value="Industrial">Industrial Furniture</option>
                        <option value="Joinery">Joinery Grade</option>
                        <option value="Pole">Poles & Posts</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-muted block mb-1 font-semibold">District</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="form-input text-xs py-1.5"
                      >
                        <option value="All">All Districts</option>
                        <option value="Wayanad">Wayanad</option>
                        <option value="Palakkad">Palakkad</option>
                        <option value="Kottayam">Kottayam</option>
                        <option value="Idukki">Idukki</option>
                        <option value="Ernakulam">Ernakulam</option>
                        <option value="Thrissur">Thrissur</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-muted block mb-1 font-semibold">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="form-input text-xs py-1.5"
                      >
                        <option value="newest">Newest Listed</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="volume_desc">Volume: Largest First</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* TIMBER LISTINGS GRID */}
                {filteredListings.length === 0 ? (
                  <div className="card p-12 text-center rounded-2xl border border-color bg-card">
                    <Trees size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Timber Lots Match Your Filter</h3>
                    <p className="text-xs text-muted max-w-md mx-auto mb-4">
                      Try clearing filters or search terms to view all available timber inventory across Kerala.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSellerRoleFilter('All');
                        setSelectedSpecies('All');
                        setSelectedGrade('All');
                        setSelectedDistrict('All');
                      }}
                      className="btn btn-secondary inline-flex items-center gap-2"
                    >
                      <RotateCcw size={16} /> Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => {
                      const isContractorSeller = listing.sellerRole === 'contractor';

                      return (
                        <div
                          key={listing.id}
                          className="card border border-color rounded-2xl overflow-hidden bg-card flex flex-col justify-between hover:border-emerald/50 transition-all duration-300 shadow-md hover:shadow-2xl group"
                        >
                          <div>
                            {/* Card Media Header */}
                            <div className="h-48 bg-surface relative overflow-hidden">
                              {listing.images?.[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.timberSpecies}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#06140b] to-[#030805] text-slate-500 p-4 text-center">
                                  {isContractorSeller ? (
                                    <Truck size={42} className="text-blue-500/40 mb-2" />
                                  ) : (
                                    <Trees size={42} className="text-emerald-500/40 mb-2" />
                                  )}
                                  <span className="text-sm font-bold text-slate-200">{listing.timberSpecies}</span>
                                  <span className="text-xs text-slate-500">{listing.timberType}</span>
                                </div>
                              )}

                              {/* SELLER IDENTITY BADGE (The key user requirement!) */}
                              <div className="absolute top-3 left-3">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-md ${
                                    isContractorSeller
                                      ? 'bg-blue-950/90 text-blue-300 border border-blue-500/60'
                                      : 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                                  }`}
                                >
                                  {isContractorSeller ? (
                                    <>
                                      <Truck size={13} className="text-blue-400" /> Contractor Lot
                                    </>
                                  ) : (
                                    <>
                                      <Trees size={13} className="text-emerald-400" /> Landowner Lot
                                    </>
                                  )}
                                </span>
                              </div>

                              {/* FSC / Verification Badge */}
                              {listing.fscCert && (
                                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                                  <ShieldCheck size={12} /> {listing.fscCert}
                                </span>
                              )}

                              {/* Status Chip */}
                              <span
                                className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow ${
                                  listing.status === 'Under Negotiation'
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-emerald text-dark'
                                }`}
                              >
                                {listing.status === 'Under Negotiation' ? 'Under Negotiation' : 'Available'}
                              </span>
                            </div>

                            {/* Card Content */}
                            <div className="p-5 space-y-3.5">
                              {/* Seller Name & Location Subtitle */}
                              <div className="flex items-center justify-between text-xs text-muted">
                                <span className="font-semibold text-slate-300 flex items-center gap-1">
                                  Sold by: <strong className={isContractorSeller ? 'text-blue-400' : 'text-emerald'}>{listing.sellerName}</strong>
                                </span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <MapPin size={12} className="text-emerald" /> {listing.district}
                                </span>
                              </div>

                              <div>
                                <h3 className="text-lg font-bold text-main leading-snug line-clamp-1 group-hover:text-emerald transition-colors">
                                  {listing.title || `${listing.gradeQuality} ${listing.timberSpecies}`}
                                </h3>
                                <p className="text-xs text-muted line-clamp-2 mt-1">
                                  {listing.description || 'Verified timber logs from private plantation stand.'}
                                </p>
                              </div>

                              {/* Specs Matrix */}
                              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-surface border border-color text-xs">
                                <div>
                                  <span className="text-muted block text-[11px]">Available Volume:</span>
                                  <span className="font-extrabold text-emerald font-mono text-base">
                                    {listing.volume} m³
                                  </span>
                                  <span className="text-[10px] text-muted block">({listing.quantity || 50} logs)</span>
                                </div>

                                <div>
                                  <span className="text-muted block text-[11px]">Rate / m³:</span>
                                  <span className="font-extrabold text-main font-mono text-base">
                                    ₹ {Number(listing.pricePerM3).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[10px] text-muted block">per cubic meter</span>
                                </div>

                                <div>
                                  <span className="text-muted block text-[11px]">Quality Grade:</span>
                                  <span className="font-semibold text-slate-200 line-clamp-1">
                                    {listing.gradeQuality}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-muted block text-[11px]">Total Asking Price:</span>
                                  <span className="font-bold text-gold font-mono">
                                    ₹ {Number(listing.askingPrice).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>

                              {/* Dimensions and Hauling Support indicator */}
                              <div className="text-[11px] text-muted space-y-1">
                                {listing.logDimensions && (
                                  <div>
                                    <strong className="text-slate-400">Dimensions:</strong> {listing.logDimensions}
                                  </div>
                                )}
                                {listing.transportAvailable && (
                                  <div className="text-blue-400 flex items-center gap-1 font-semibold">
                                    <Truck size={12} /> Seller fleet hauling available to buyer mill
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ACTION BUTTONS: NEGOTIATE OR BUY NOW */}
                          <div className="p-4 border-t border-color bg-surface/50 flex items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedListingForDetails(listing)}
                              className="btn btn-secondary btn-sm text-xs px-2.5"
                              title="View Full Specifications"
                            >
                              <Eye size={14} /> Specs
                            </button>

                            <div className="flex items-center gap-2">
                              {listing.negotiable === 'Yes' && (
                                <button
                                  onClick={() => handleOpenNegotiate(listing)}
                                  className="btn btn-secondary btn-sm text-xs flex items-center gap-1 font-bold text-amber-400 border-amber-500/40 hover:bg-amber-500/10 cursor-pointer"
                                >
                                  <Handshake size={14} /> Negotiate
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenBuyNow(listing)}
                                className="btn btn-primary btn-sm text-xs flex items-center gap-1 font-bold cursor-pointer shadow-md shadow-emerald/20"
                              >
                                Buy Now <ArrowRight size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: ACTIVE NEGOTIATIONS (BARGAINING DIALOGUE TRACKER) */}
            {/* ========================================================= */}
            {activeTab === 'negotiations' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-color flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-main flex items-center gap-2">
                      <Handshake size={20} className="text-amber-400" /> Active Price Negotiations & Bargaining Hub
                    </h2>
                    <p className="text-xs text-muted">
                      Track custom price offers you submitted to Landowners and Contractors. Review seller responses, accept counter-rates, or counter again.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface border border-color text-main">
                    {myNegotiations.length} Active Bargains
                  </span>
                </div>

                {myNegotiations.length === 0 ? (
                  <div className="card p-12 text-center rounded-2xl border border-color bg-card">
                    <Handshake size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Negotiations Underway</h3>
                    <p className="text-xs text-muted max-w-md mx-auto mb-4">
                      When you click "Negotiate" on any timber listing, your offer and bargaining timeline will appear here.
                    </p>
                    <button onClick={() => handleTabChange('marketplace')} className="btn btn-primary">
                      Browse Timber Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myNegotiations.map((neg) => {
                      const isCounter = neg.status === 'Counter-Offer';
                      const isAccepted = neg.status === 'Accepted';
                      const isPending = neg.status === 'Pending Review';
                      const isContractorSeller = neg.sellerRole === 'contractor';

                      return (
                        <div
                          key={neg.id}
                          className={`card p-5 rounded-2xl border bg-card transition-all space-y-4 ${
                            isCounter ? 'border-blue-500/60 ring-1 ring-blue-500/20' : 'border-color'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-color">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    isContractorSeller
                                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  }`}
                                >
                                  {isContractorSeller ? '🚜 Contractor Seller' : '🌲 Landowner Seller'}
                                </span>
                                <span className="text-xs text-muted font-mono">{neg.id}</span>
                              </div>

                              <h3 className="text-base font-bold text-main">{neg.timberTitle}</h3>
                              <p className="text-xs text-muted mt-0.5">
                                Seller: <strong className="text-white">{neg.sellerName}</strong> ({neg.sellerEmail})
                              </p>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isAccepted
                                  ? 'bg-emerald/20 text-emerald border border-emerald/40'
                                  : isCounter
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {neg.status}
                            </span>
                          </div>

                          {/* Rate Comparison Strip */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface border border-color text-xs">
                            <div>
                              <span className="text-muted block">Original Asking Rate:</span>
                              <span className="font-semibold text-slate-300 font-mono">
                                ₹ {Number(neg.originalPricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                            </div>

                            <div>
                              <span className="text-muted block">Your Submitted Bid:</span>
                              <span className="font-extrabold text-amber-400 font-mono text-sm">
                                ₹ {Number(neg.offeredPricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                            </div>

                            <div>
                              <span className="text-muted block">Target Volume:</span>
                              <span className="font-bold text-white font-mono">{neg.requestedVolume} m³</span>
                            </div>

                            <div>
                              <span className="text-muted block">Total Deal Value:</span>
                              <span className="font-extrabold text-gold font-mono text-sm">
                                ₹ {Number(neg.totalOffered).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* COUNTER-OFFER ALERT BOX */}
                          {isCounter && neg.counterOffer && (
                            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs text-blue-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-blue-300 flex items-center gap-1.5">
                                  <RotateCcw size={15} /> Seller Proposed Counter-Offer:
                                </span>
                                <span className="font-extrabold text-emerald text-base font-mono">
                                  ₹ {Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')} / m³
                                </span>
                              </div>
                              <p className="text-slate-300 italic">"{neg.counterOffer.message}"</p>
                            </div>
                          )}

                          {/* Timeline / Chat history */}
                          {neg.timeline && neg.timeline.length > 0 && (
                            <div className="text-xs space-y-1.5 p-3 rounded-xl bg-surface/50 border border-color">
                              <span className="text-muted font-semibold block text-[11px] uppercase">Negotiation History:</span>
                              {neg.timeline.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-slate-300">
                                  <span className="text-muted font-mono text-[10px] mt-0.5">{item.date}</span>
                                  <span><strong className="text-emerald">{item.senderName}:</strong> {item.message}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-color">
                            {isCounter && (
                              <>
                                <button
                                  onClick={() => handleAcceptSellerCounter(neg)}
                                  className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-md shadow-emerald/20"
                                >
                                  <Check size={14} /> Accept Counter-Offer & Buy Now (₹{Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')}/m³)
                                </button>
                              </>
                            )}

                            {isAccepted && (
                              <button
                                onClick={() => handleAcceptSellerCounter(neg)}
                                className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold"
                              >
                                <ShoppingBag size={14} /> Proceed to Order Checkout
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: PURCHASE ORDERS & LOGISTICS TRACKING */}
            {/* ========================================================= */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-card border border-color flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-main flex items-center gap-2">
                      <Truck size={20} className="text-emerald" /> Procurement Contracts & Mill Logistics Tracking
                    </h2>
                    <p className="text-xs text-muted">
                      Monitor highway log truck transit, Kerala forest transit passes, and mill gate weighbridge deliveries.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded bg-surface border border-color text-emerald font-bold">
                    {myOrders.length} Confirmed Orders
                  </span>
                </div>

                {myOrders.length === 0 ? (
                  <div className="card p-12 text-center rounded-2xl border border-color bg-card">
                    <Truck size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Orders Placed Yet</h3>
                    <p className="text-xs text-muted max-w-md mx-auto mb-4">
                      Purchase timber lots directly from the marketplace to track fulfillment and transport permits here.
                    </p>
                    <button onClick={() => handleTabChange('marketplace')} className="btn btn-primary">
                      Procure Timber
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Active Transit Spotlight Card */}
                    {myOrders[0] && (
                      <div className="card p-6 rounded-2xl border border-emerald/50 bg-card shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-color">
                          <div>
                            <span className="live-indicator inline-flex items-center gap-1.5 text-xs font-bold text-emerald uppercase tracking-wider mb-1">
                              <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span> Active Freight Haulage
                            </span>
                            <h3 className="text-lg font-bold text-main">
                              Order {myOrders[0].id}: {myOrders[0].timberItem}
                            </h3>
                            <p className="text-xs text-muted">
                              Hauling Partner: <strong className="text-white">{myOrders[0].contractor}</strong> • Pass No: <span className="font-mono text-emerald">{myOrders[0].passNo}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-muted block">Contract Value</span>
                            <span className="text-lg font-extrabold text-gold font-mono">{myOrders[0].total}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-300 font-semibold">Delivery Transit Progress to {myOrders[0].mill}</span>
                            <span className="font-extrabold text-emerald font-mono">{myOrders[0].progress || 75}%</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-surface overflow-hidden border border-color">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${myOrders[0].progress || 75}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Milestones */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
                          {myOrders[0].milestones?.map((m, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border ${
                                m.done
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                                  : 'bg-surface border-color text-muted'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-1">
                                {m.done ? <CheckCircle2 size={14} className="text-emerald" /> : <Clock size={14} />}
                                <span>Step {idx + 1}</span>
                              </div>
                              <div className="font-semibold text-slate-200 line-clamp-1">{m.step}</div>
                              <div className="text-[11px] text-muted mt-0.5">{m.date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Orders Table */}
                    <div className="table-wrapper card p-0 rounded-2xl overflow-hidden border border-color">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>Timber Description</th>
                            <th>Seller / Supplier</th>
                            <th>Volume</th>
                            <th>Contract Total</th>
                            <th>Destination Mill</th>
                            <th>Status</th>
                            <th>ETA</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myOrders.map((ord) => (
                            <tr key={ord.id}>
                              <td className="font-mono font-bold text-white">{ord.id}</td>
                              <td className="font-semibold text-main">{ord.timberItem}</td>
                              <td className="text-xs">
                                <div className="font-bold text-slate-200">{ord.sellerName}</div>
                                <span className={`text-[10px] font-bold uppercase ${
                                  ord.sellerRole === 'contractor' ? 'text-blue-400' : 'text-emerald'
                                }`}>
                                  {ord.sellerRole || 'Seller'}
                                </span>
                              </td>
                              <td className="text-emerald font-mono font-bold">{ord.volume}</td>
                              <td className="text-gold font-mono font-bold">{ord.total}</td>
                              <td className="text-xs text-muted">{ord.mill}</td>
                              <td>
                                <span className={`status-pill ${ord.status?.includes('Delivered') ? 'status-green' : 'status-yellow'}`}>
                                  {ord.status?.includes('Delivered') ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                                  {ord.status}
                                </span>
                              </td>
                              <td className="text-xs text-muted font-mono">{ord.ETA}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: MARKET TRENDS & PRICE BENCHMARKS */}
            {/* ========================================================= */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-card border border-color">
                  <h2 className="text-base font-bold text-main">Kerala Timber Rate Index & Price Benchmarks</h2>
                  <p className="text-xs text-muted">
                    Quarterly commercial sawlog price averages compiled across Kerala forest auctions and private estate transactions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card p-5 rounded-2xl border border-color bg-card space-y-3">
                    <span className="text-xs font-bold text-emerald uppercase tracking-wider">Hardwood Premium</span>
                    <h3 className="text-lg font-bold text-main">Nilambur & Wayanad Teak</h3>
                    <div className="text-2xl font-extrabold text-gold font-mono">₹ 42,000 - ₹ 46,500 / m³</div>
                    <p className="text-xs text-muted">
                      High demand for Grade A1 export sawlogs with girth &gt; 130cm. Prices holding firm.
                    </p>
                  </div>

                  <div className="card p-5 rounded-2xl border border-color bg-card space-y-3">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Luxury Decorative</span>
                    <h3 className="text-lg font-bold text-main">Malabar Rosewood (Eetti)</h3>
                    <div className="text-2xl font-extrabold text-gold font-mono">₹ 56,000 - ₹ 62,000 / m³</div>
                    <p className="text-xs text-muted">
                      Limited supply from regulated estate replanting. Veneer slicer demand remains strong.
                    </p>
                  </div>

                  <div className="card p-5 rounded-2xl border border-color bg-card space-y-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Industrial Plantation</span>
                    <h3 className="text-lg font-bold text-main">Seasoned Rubberwood</h3>
                    <div className="text-2xl font-extrabold text-gold font-mono">₹ 12,500 - ₹ 13,800 / m³</div>
                    <p className="text-xs text-muted">
                      Consistent supply across Kottayam and Pathanamthitta replanting parcels.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* NEGOTIATION / MAKE OFFER MODAL */}
            {/* ========================================================= */}
            {negotiateModalOpen && negotiateTarget && (
              <div className="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-container bg-card border border-color rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-up space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-color">
                    <h3 className="text-lg font-bold text-main flex items-center gap-2">
                      <Handshake size={20} className="text-amber-400" /> Submit Negotiation Offer
                    </h3>
                    <button
                      onClick={() => setNegotiateModalOpen(false)}
                      className="text-muted hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Summary of listing */}
                  <div className="p-3.5 rounded-xl bg-surface border border-color text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-sm">{negotiateTarget.title || negotiateTarget.timberSpecies}</strong>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        negotiateTarget.sellerRole === 'contractor' ? 'bg-blue-950 text-blue-300' : 'bg-emerald-950 text-emerald-300'
                      }`}>
                        {negotiateTarget.sellerRole === 'contractor' ? 'Contractor' : 'Landowner'}: {negotiateTarget.sellerName}
                      </span>
                    </div>
                    <div className="text-muted flex items-center justify-between">
                      <span>Original Asking Rate: <strong className="text-slate-200">₹ {Number(negotiateTarget.pricePerM3).toLocaleString('en-IN')}/m³</strong></span>
                      <span>Total Available: <strong className="text-emerald">{negotiateTarget.volume} m³</strong></span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitNegotiation} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="form-label text-xs">Your Offered Rate (₹ / m³) *</label>
                        <input
                          type="number"
                          value={negotiateForm.offeredPricePerM3}
                          onChange={(e) => setNegotiateForm({ ...negotiateForm, offeredPricePerM3: e.target.value })}
                          className="form-input text-base font-bold font-mono text-emerald"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label text-xs">Requested Volume (m³) *</label>
                        <input
                          type="number"
                          step="0.5"
                          value={negotiateForm.requestedVolume}
                          onChange={(e) => setNegotiateForm({ ...negotiateForm, requestedVolume: e.target.value })}
                          className="form-input text-base font-bold font-mono text-white"
                          required
                        />
                      </div>
                    </div>

                    {/* Computed deal amount */}
                    <div className="p-3 bg-surface rounded-xl border border-color text-xs flex items-center justify-between">
                      <span className="text-muted">Total Proposed Deal Value:</span>
                      <span className="text-base font-extrabold text-gold font-mono">
                        ₹ {((Number(negotiateForm.offeredPricePerM3) || 0) * (Number(negotiateForm.requestedVolume) || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Haulage & Logistics Preference</label>
                      <select
                        value={negotiateForm.deliveryPreference}
                        onChange={(e) => setNegotiateForm({ ...negotiateForm, deliveryPreference: e.target.value })}
                        className="form-input text-xs"
                      >
                        <option value="Seller Contractor Hauling to Mill">Seller Arranged Transport to Buyer Mill</option>
                        <option value="Buyer Arranged Truck Pickup from Yard">Buyer Self-Pickup (We Dispatch Trucks to Yard)</option>
                        <option value="Shared Freight 50/50">Shared Freight Costs</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Destination Mill Yard</label>
                      <input
                        type="text"
                        value={negotiateForm.destinationMill}
                        onChange={(e) => setNegotiateForm({ ...negotiateForm, destinationMill: e.target.value })}
                        className="form-input text-xs"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Payment Terms Proposed</label>
                      <select
                        value={negotiateForm.paymentTerms}
                        onChange={(e) => setNegotiateForm({ ...negotiateForm, paymentTerms: e.target.value })}
                        className="form-input text-xs"
                      >
                        <option value="50% Advance Escrow + 50% Post-Weighbridge">50% Advance Escrow + 50% Weighbridge Inspection</option>
                        <option value="100% Escrow on Dispatch">100% Escrow on Forest Transit Clearance</option>
                        <option value="Commercial Letter of Credit (LC)">Commercial Letter of Credit (Net 30)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Note to Seller</label>
                      <textarea
                        rows="2"
                        value={negotiateForm.notes}
                        onChange={(e) => setNegotiateForm({ ...negotiateForm, notes: e.target.value })}
                        className="form-input text-xs"
                        placeholder="State your purchase readiness, inspection preferences..."
                      ></textarea>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-color">
                      <button
                        type="button"
                        onClick={() => setNegotiateModalOpen(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold"
                      >
                        <Handshake size={15} /> Send Offer to Seller
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* BUY NOW / PURCHASE CHECKOUT MODAL */}
            {/* ========================================================= */}
            {buyNowModalOpen && buyNowTarget && (
              <div className="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-container bg-card border border-color rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-up space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-color">
                    <h3 className="text-lg font-bold text-main flex items-center gap-2">
                      <ShoppingBag size={20} className="text-emerald" /> Timber Purchase Checkout
                    </h3>
                    <button
                      onClick={() => setBuyNowModalOpen(false)}
                      className="text-muted hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface border border-color text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{buyNowTarget.title || buyNowTarget.timberSpecies}</span>
                      <span className="text-emerald font-bold">{buyNowTarget.gradeQuality}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <span>Seller: <strong className="text-slate-200">{buyNowTarget.sellerName}</strong></span>
                      <span>Rate: <strong className="text-main font-mono">₹ {Number(buyNowTarget.pricePerM3).toLocaleString('en-IN')}/m³</strong></span>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmPurchase} className="space-y-4">
                    <div className="form-group">
                      <label className="form-label text-xs">Procurement Volume (m³)</label>
                      <input
                        type="number"
                        step="0.5"
                        max={buyNowTarget.volume}
                        value={buyNowForm.volume}
                        onChange={(e) => setBuyNowForm({ ...buyNowForm, volume: e.target.value })}
                        className="form-input text-base font-bold font-mono text-emerald"
                        required
                      />
                      <span className="text-[11px] text-muted block mt-1">
                        Available in lot: {buyNowTarget.volume} m³
                      </span>
                    </div>

                    <div className="p-3 bg-surface rounded-xl border border-color text-xs flex items-center justify-between">
                      <span className="text-muted">Total Purchase Price:</span>
                      <span className="text-lg font-extrabold text-gold font-mono">
                        ₹ {((Number(buyNowForm.volume) || 0) * Number(buyNowTarget.pricePerM3)).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Destination Sawmill / Processing Depot</label>
                      <input
                        type="text"
                        value={buyNowForm.destinationMill}
                        onChange={(e) => setBuyNowForm({ ...buyNowForm, destinationMill: e.target.value })}
                        className="form-input text-xs"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Hauling & Logistics Carrier</label>
                      <input
                        type="text"
                        value={buyNowForm.haulingCarrier}
                        onChange={(e) => setBuyNowForm({ ...buyNowForm, haulingCarrier: e.target.value })}
                        className="form-input text-xs"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Safe Settlement Method</label>
                      <select
                        value={buyNowForm.paymentMethod}
                        onChange={(e) => setBuyNowForm({ ...buyNowForm, paymentMethod: e.target.value })}
                        className="form-input text-xs"
                      >
                        <option value="TreeConnect Escrow (Standard Safe Settlement)">TreeConnect Safe Escrow (Released on Weighbridge Acceptance)</option>
                        <option value="Bank Wire / Letter of Credit">Commercial Bank LC / Wire Transfer</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
                      <span>
                        Protected by TreeConnect Buyer Protection: Funds held safely in escrow until logs pass gate inspection.
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-color">
                      <button
                        type="button"
                        onClick={() => setBuyNowModalOpen(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold shadow-lg shadow-emerald/20"
                      >
                        <Check size={15} /> Confirm Purchase & Secure Lot
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TIMBER SPECIFICATIONS MODAL */}
            {/* ========================================================= */}
            {selectedListingForDetails && (
              <div className="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-container bg-card border border-color rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-scale-up space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-color">
                    <h3 className="text-lg font-bold text-main">
                      {selectedListingForDetails.title || `${selectedListingForDetails.gradeQuality} ${selectedListingForDetails.timberSpecies}`}
                    </h3>
                    <button
                      onClick={() => setSelectedListingForDetails(null)}
                      className="text-muted hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface border border-color">
                      <div>
                        <span className="text-muted block">Seller Type:</span>
                        <span className="font-bold text-emerald uppercase">{selectedListingForDetails.sellerRole}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Seller Name:</span>
                        <span className="font-semibold text-white">{selectedListingForDetails.sellerName}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Location:</span>
                        <span className="font-semibold text-white">{selectedListingForDetails.district}, Kerala</span>
                      </div>
                      <div>
                        <span className="text-muted block">Storage Yard:</span>
                        <span className="font-semibold text-white">{selectedListingForDetails.storageLocation || 'Central Yard'}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Log Dimensions:</span>
                        <span className="font-semibold text-white">{selectedListingForDetails.logDimensions || 'Standard'}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Certification:</span>
                        <span className="font-semibold text-emerald">{selectedListingForDetails.fscCert || 'Forest Clearance Pass'}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface border border-color">
                      <span className="text-muted block mb-1 font-semibold">Description & Inspection Notes:</span>
                      <p className="text-slate-200 leading-relaxed">
                        {selectedListingForDetails.description || 'Verified timber lot from certified Kerala stand.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedListingForDetails(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Close
                      </button>
                      {selectedListingForDetails.negotiable === 'Yes' && (
                        <button
                          onClick={() => {
                            const l = selectedListingForDetails;
                            setSelectedListingForDetails(null);
                            handleOpenNegotiate(l);
                          }}
                          className="btn btn-secondary btn-sm text-amber-400 font-bold"
                        >
                          Negotiate Price
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const l = selectedListingForDetails;
                          setSelectedListingForDetails(null);
                          handleOpenBuyNow(l);
                        }}
                        className="btn btn-primary btn-sm font-bold"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
