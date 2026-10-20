import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import './TimberMarketplacePage.css';
import {
  ShoppingBag,
  Plus,
  Tag,
  DollarSign,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Trees,
  MessageSquare,
  Truck,
  TrendingUp,
  AlertCircle,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Trash2,
  Eye,
  Filter,
  Phone
} from 'lucide-react';

const TimberMarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentEmail = (user?.email || '').toLowerCase().trim();

  const [activeTab, setActiveTab] = useState('my_listings'); // 'my_listings' | 'negotiations' | 'orders' | 'all_listings'
  const [listings, setListings] = useState([]);
  const [negotiations, setNegotiations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Counter offer modal
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedNegotiation, setSelectedNegotiation] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Success message toast
  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    const allListings = marketplaceService.getListings();
    setListings(allListings);

    const allNegs = marketplaceService.getNegotiations();
    setNegotiations(allNegs);

    const allOrders = marketplaceService.getOrders();
    setOrders(allOrders);
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
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Filter listings owned by this landowner (or match landowner role)
  const myListings = listings.filter(l => {
    if (!l) return false;
    const lEmail = (l.sellerEmail || '').toLowerCase().trim();
    if (currentEmail && lEmail === currentEmail) return true;
    return l.sellerRole === 'landowner';
  });

  // Filter negotiations on listings owned by this landowner
  const myNegotiations = negotiations.filter(n => {
    if (!n) return false;
    const sEmail = (n.sellerEmail || '').toLowerCase().trim();
    if (currentEmail && sEmail === currentEmail) return true;
    return n.sellerRole === 'landowner';
  });

  // Filter orders for this landowner
  const myOrders = orders.filter(o => {
    if (!o) return false;
    const sEmail = (o.sellerEmail || '').toLowerCase().trim();
    if (currentEmail && sEmail === currentEmail) return true;
    return o.sellerRole === 'landowner';
  });

  // KPI calculations
  const totalVolume = myListings.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
  const totalValue = myListings.reduce((sum, item) => sum + (Number(item.askingPrice) || 0), 0);
  const pendingNegotiations = myNegotiations.filter(n => n.status === 'Pending Review' || n.status === 'Counter-Offer');

  const handleStatusChange = (id, newStatus) => {
    marketplaceService.updateListingStatus(id, newStatus);
    showToast(`Listing status updated to ${newStatus}`);
    loadData();
  };

  const handleDeleteListing = (id) => {
    if (window.confirm('Are you sure you want to remove this timber listing?')) {
      marketplaceService.deleteListing(id);
      showToast('Timber listing removed from marketplace');
      loadData();
    }
  };

  const handleAcceptOffer = (neg) => {
    marketplaceService.respondToNegotiation(neg.id, 'accept', {
      sender: 'Landowner',
      senderName: user?.name || neg.sellerName,
      message: `Offer accepted by landowner. You can now finalize purchase and arrange logistics.`
    });
    showToast(`Accepted offer from ${neg.buyerName}!`);
    loadData();
  };

  const handleRejectOffer = (neg) => {
    if (window.confirm('Are you sure you want to decline this buyer offer?')) {
      marketplaceService.respondToNegotiation(neg.id, 'reject', {
        sender: 'Landowner',
        senderName: user?.name || neg.sellerName,
        message: 'The proposed terms or price are below the estate reserve price.'
      });
      showToast(`Declined offer from ${neg.buyerName}.`);
      loadData();
    }
  };

  const openCounterModal = (neg) => {
    setSelectedNegotiation(neg);
    setCounterPrice(neg.originalPricePerM3 || '');
    setCounterMessage(`We can agree to sell at ₹${Number(neg.originalPricePerM3 || 0).toLocaleString('en-IN')}/m³ with prompt yard pickup.`);
    setCounterModalOpen(true);
  };

  const submitCounterOffer = (e) => {
    e.preventDefault();
    if (!selectedNegotiation || !counterPrice) return;

    marketplaceService.respondToNegotiation(selectedNegotiation.id, 'counter', {
      sender: 'Landowner',
      senderName: user?.name || selectedNegotiation.sellerName,
      pricePerM3: Number(counterPrice),
      message: counterMessage
    });

    setCounterModalOpen(false);
    showToast('Counter-offer submitted to buyer!');
    loadData();
  };

  // Filtered view for my listings
  const filteredMyListings = myListings.filter(l => {
    if (filterSpecies !== 'All' && !l.timberSpecies?.toLowerCase().includes(filterSpecies.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'All' && l.status !== filterStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <div className="dashboard-workspace">
          <main className="dashboard-content max-w-7xl mx-auto py-6 tmp-container">

            {/* Header */}
            <div className="tmp-header">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="tmp-badge-pill">
                    Landowner Portal
                  </span>
                  <span className="text-xs text-muted">Kerala Timber Exchange</span>
                </div>
                <h1 className="tmp-title">
                  <ShoppingBag className="text-emerald-400" size={28} /> Timber Marketplace & Sales Hub
                </h1>
                <p className="tmp-subtitle">
                  List your estate timber, negotiate with verified commercial sawmill buyers, and track sales payouts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/landowner/create-timber-listing')}
                  className="tmp-btn-primary"
                >
                  <Plus size={18} /> Add Timber to Sell
                </button>
              </div>
            </div>

            {/* TOAST ALERT */}
            {toastMessage && (
              <div className="tmp-toast">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* KPI METRIC CARDS */}
            <div className="tmp-kpi-grid">
              <div className="tmp-kpi-card">
                <div className="tmp-kpi-top">
                  <span className="tmp-kpi-label">My Active Listings</span>
                  <span className="tmp-kpi-icon tmp-kpi-icon-emerald">
                    <ShoppingBag size={18} />
                  </span>
                </div>
                <div className="tmp-kpi-value">{myListings.length}</div>
                <div className="tmp-kpi-hint">Available for buyer purchase</div>
              </div>

              <div className="tmp-kpi-card">
                <div className="tmp-kpi-top">
                  <span className="tmp-kpi-label">Total Volume</span>
                  <span className="tmp-kpi-icon tmp-kpi-icon-blue">
                    <Trees size={18} />
                  </span>
                </div>
                <div className="tmp-kpi-value text-emerald-400">{totalVolume.toFixed(1)} m³</div>
                <div className="tmp-kpi-hint">Certified Kerala timber stock</div>
              </div>

              <div className="tmp-kpi-card">
                <div className="tmp-kpi-top">
                  <span className="tmp-kpi-label">Buyer Inquiries & Offers</span>
                  <span className="tmp-kpi-icon tmp-kpi-icon-amber">
                    <MessageSquare size={18} />
                  </span>
                </div>
                <div className="tmp-kpi-value text-amber-400">{pendingNegotiations.length}</div>
                <div className="tmp-kpi-hint text-amber-400/80">
                  {pendingNegotiations.length > 0 ? 'Action required: Review offers' : 'No pending offers'}
                </div>
              </div>

              <div className="tmp-kpi-card">
                <div className="tmp-kpi-top">
                  <span className="tmp-kpi-label">Total Inventory Value</span>
                  <span className="tmp-kpi-icon tmp-kpi-icon-gold">
                    <DollarSign size={18} />
                  </span>
                </div>
                <div className="tmp-kpi-value text-amber-300">
                  ₹ {(totalValue / 100000).toFixed(2)} Lakh
                </div>
                <div className="tmp-kpi-hint">Across all published lots</div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="tmp-tabs-bar">
              <button
                onClick={() => setActiveTab('my_listings')}
                className={`tmp-tab-btn ${activeTab === 'my_listings' ? 'active' : ''}`}
              >
                <Tag size={16} /> My Timber Listings ({myListings.length})
              </button>

              <button
                onClick={() => setActiveTab('negotiations')}
                className={`tmp-tab-btn ${activeTab === 'negotiations' ? 'active' : ''}`}
              >
                <MessageSquare size={16} /> Buyer Offers & Negotiations
                {pendingNegotiations.length > 0 && (
                  <span className="tmp-badge-count">
                    {pendingNegotiations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`tmp-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              >
                <Truck size={16} /> Completed Sales & Orders ({myOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('all_listings')}
                className={`tmp-tab-btn ${activeTab === 'all_listings' ? 'active' : ''}`}
              >
                <Layers size={16} /> All Marketplace Listings ({listings.length})
              </button>
            </div>

            {/* TAB 1: MY TIMBER LISTINGS */}
            {activeTab === 'my_listings' && (
              <div>
                {/* Filters */}
                <div className="tmp-filter-bar">
                  <div className="tmp-filter-group">
                    <span className="tmp-filter-label">
                      <Filter size={15} className="text-emerald-400" /> Filter:
                    </span>

                    <select
                      value={filterSpecies}
                      onChange={(e) => setFilterSpecies(e.target.value)}
                      className="tmp-filter-select"
                    >
                      <option value="All">All Species</option>
                      <option value="Teakwood">Teakwood</option>
                      <option value="Rosewood">Rosewood</option>
                      <option value="Rubberwood">Rubberwood</option>
                      <option value="Mahogany">Mahogany</option>
                      <option value="Eucalyptus">Eucalyptus</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="tmp-filter-select"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Published">Published (Active)</option>
                      <option value="Under Negotiation">Under Negotiation</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <span className="tmp-filter-count">
                    Showing <strong>{filteredMyListings.length}</strong> {filteredMyListings.length === 1 ? 'listing' : 'listings'}
                  </span>
                </div>

                {/* Listings Grid */}
                {filteredMyListings.length === 0 ? (
                  <div className="tmp-empty-card">
                    <div className="tmp-empty-icon">
                      <Trees size={32} />
                    </div>
                    <h3 className="tmp-empty-title">No Timber Listings Found</h3>
                    <p className="tmp-empty-subtitle">
                      You haven't listed any timber yet, or no items match your current filter. Add your first felled timber or standing parcel for commercial buyers!
                    </p>
                    <button
                      onClick={() => navigate('/landowner/create-timber-listing')}
                      className="tmp-btn-primary"
                    >
                      <Plus size={16} /> List Timber Now
                    </button>
                  </div>
                ) : (
                  <div className="tmp-listings-grid">
                    {filteredMyListings.map((listing) => {
                      const listingNegs = myNegotiations.filter(n => n.listingId === listing.id);

                      return (
                        <div key={listing.id} className="tmp-listing-card">
                          <div>
                            {/* Card Media / Header */}
                            <div className="tmp-card-media">
                              {listing.images?.[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.timberSpecies}
                                  className="tmp-card-img"
                                />
                              ) : (
                                <div className="tmp-media-placeholder">
                                  <Trees size={36} className="text-emerald-500/40 mb-2" />
                                  <span className="text-xs font-bold text-slate-300">{listing.timberSpecies}</span>
                                  <span className="text-[10px] text-slate-500">{listing.timberType}</span>
                                </div>
                              )}
                              <div className="tmp-media-overlay" />

                              {/* Status Badge */}
                              <span
                                className={`tmp-status-badge ${
                                  listing.status === 'Sold'
                                    ? 'sold'
                                    : listing.status === 'Under Negotiation'
                                    ? 'under-negotiation'
                                    : 'published'
                                }`}
                              >
                                {listing.status}
                              </span>

                              {/* FSC or Verification Badge */}
                              {listing.fscCert && (
                                <span className="tmp-cert-badge">
                                  <ShieldCheck size={11} /> {listing.fscCert}
                                </span>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="tmp-card-body">
                              <div className="tmp-card-tags">
                                <span className="tmp-tag-type">{listing.timberType}</span>
                                <span className="tmp-tag-grade">{listing.gradeQuality}</span>
                              </div>

                              <h3 className="tmp-card-title">
                                {listing.title || `${listing.gradeQuality} ${listing.timberSpecies}`}
                              </h3>

                              <p className="tmp-card-desc">
                                {listing.description || 'Verified timber lot available for direct pickup.'}
                              </p>

                              {/* Specs Grid */}
                              <div className="tmp-specs-box">
                                <div className="tmp-spec-item">
                                  <span className="tmp-spec-label">Volume</span>
                                  <span className="tmp-spec-value-emerald">{listing.volume} m³</span>
                                </div>
                                <div className="tmp-spec-item">
                                  <span className="tmp-spec-label">Total Price</span>
                                  <span className="tmp-spec-value-gold">
                                    ₹ {Number(listing.askingPrice).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="tmp-spec-item">
                                  <span className="tmp-spec-label">Rate / m³</span>
                                  <span className="tmp-spec-value-sub">
                                    ₹ {Number(listing.pricePerM3).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="tmp-spec-item">
                                  <span className="tmp-spec-label">Negotiable</span>
                                  {listing.negotiable === 'Yes' ? (
                                    <span className="tmp-spec-pill-yes">Yes</span>
                                  ) : (
                                    <span className="tmp-spec-pill-no">{listing.negotiable || 'No'}</span>
                                  )}
                                </div>
                              </div>

                              <div className="tmp-location-row">
                                <MapPin size={13} className="tmp-location-icon" />
                                <span className="truncate">{listing.district} • {listing.storageLocation || 'Estate Yard'}</span>
                              </div>

                              {/* Offers notification strip */}
                              {listingNegs.length > 0 && (
                                <div className="tmp-offers-banner">
                                  <span className="flex items-center gap-1.5 font-semibold">
                                    <MessageSquare size={13} /> {listingNegs.length} Buyer Offer{listingNegs.length > 1 ? 's' : ''}
                                  </span>
                                  <button
                                    onClick={() => setActiveTab('negotiations')}
                                    className="tmp-offers-link"
                                  >
                                    View Offers →
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="tmp-card-footer">
                            <select
                              value={listing.status}
                              onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                              className="tmp-select-status"
                            >
                              <option value="Published">Active</option>
                              <option value="Under Negotiation">Under Offer</option>
                              <option value="Sold">Sold</option>
                            </select>

                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="tmp-delete-btn"
                              title="Delete Listing"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: BUYER OFFERS & NEGOTIATIONS */}
            {activeTab === 'negotiations' && (
              <div className="space-y-4">
                <div className="tmp-section-header-box">
                  <div>
                    <h2 className="tmp-section-title">Commercial Buyer Bargaining Inbox</h2>
                    <p className="tmp-section-desc">
                      Review bids submitted by sawmills and timber procurement companies. You can accept, propose counter-rates, or decline.
                    </p>
                  </div>
                  <span className="tmp-filter-count">
                    {myNegotiations.length} Total Negotiations
                  </span>
                </div>

                {myNegotiations.length === 0 ? (
                  <div className="tmp-empty-card">
                    <div className="tmp-empty-icon">
                      <MessageSquare size={32} />
                    </div>
                    <h3 className="tmp-empty-title">No Buyer Offers Yet</h3>
                    <p className="tmp-empty-subtitle">
                      When buyers on TreeConnect submit price offers or bargaining proposals on your timber listings, they will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myNegotiations.map((neg) => {
                      const isPending = neg.status === 'Pending Review';
                      const isCounter = neg.status === 'Counter-Offer';
                      const isAccepted = neg.status === 'Accepted';
                      const isRejected = neg.status === 'Rejected';

                      return (
                        <div
                          key={neg.id}
                          className="tc-landowner-neg-card"
                        >
                          {/* Top Header Row */}
                          <div className="tc-neg-header">
                            <div>
                              <div className="tc-neg-title-row">
                                <span className="tc-neg-badge-species">
                                  <Trees size={12} /> {neg.timberSpecies || 'Teak'}
                                </span>
                                <span className="tc-neg-badge-ref">
                                  #{String(neg.id).replace('neg_', '').slice(-6)}
                                </span>
                              </div>
                              <h3 className="tc-neg-title">{neg.timberTitle}</h3>
                              <div className="tc-neg-buyer-line">
                                <span>Buyer: <strong className="text-white">{neg.buyerName}</strong></span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-300 font-medium">{neg.buyerCompany}</span>
                                {neg.buyerPhone && (
                                  <>
                                    <span className="text-slate-500">•</span>
                                    <a href={`tel:${neg.buyerPhone}`} className="text-emerald-400 font-mono hover:underline inline-flex items-center gap-1">
                                      <Phone size={11} /> {neg.buyerPhone}
                                    </a>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                                  isAccepted
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                                    : isRejected
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : isCounter
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                                }`}
                              >
                                {isPending && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
                                {neg.status}
                              </span>
                            </div>
                          </div>

                          {/* 4-Cell Offer Comparison Grid */}
                          <div className="tc-neg-metrics-grid">
                            <div className="tc-neg-metric-box">
                              <span className="tc-neg-metric-label">ORIGINAL ASKING</span>
                              <div className="tc-neg-metric-val text-slate-300">
                                ₹ {Number(neg.originalPricePerM3).toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ m³</span>
                              </div>
                              <span className="tc-neg-metric-sub">Catalogue Rate</span>
                            </div>

                            <div className="tc-neg-metric-box tc-neg-metric-box-highlight">
                              <span className="tc-neg-metric-label text-emerald-400">BUYER'S OFFERED RATE</span>
                              <div className="tc-neg-metric-val text-emerald-400">
                                ₹ {Number(neg.offeredPricePerM3).toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-300">/ m³</span>
                              </div>
                              <span className="tc-neg-metric-sub text-emerald-300 font-medium">Proposed Bid</span>
                            </div>

                            <div className="tc-neg-metric-box">
                              <span className="tc-neg-metric-label">REQUESTED VOLUME</span>
                              <div className="tc-neg-metric-val text-white">
                                {neg.requestedVolume} <span className="text-xs font-normal text-slate-300">m³</span>
                              </div>
                              <span className="tc-neg-metric-sub truncate">{neg.deliveryPreference || 'Truck Pickup'}</span>
                            </div>

                            <div className="tc-neg-metric-box tc-neg-metric-box-highlight">
                              <span className="tc-neg-metric-label text-amber-300">TOTAL DEAL OFFER</span>
                              <div className="tc-neg-metric-val text-gold">
                                ₹ {Number(neg.totalOffered).toLocaleString('en-IN')}
                              </div>
                              <span className="tc-neg-metric-sub text-amber-300/80">Escrow Secured</span>
                            </div>
                          </div>

                          {/* Proposed Timber Survey Visit Card */}
                          {neg.surveyVisitDate ? (
                            <div className="tc-neg-survey-card">
                              <div className="tc-neg-survey-top">
                                <span className="tc-neg-survey-tag">
                                  <Calendar size={13} className="text-emerald-400" /> Proposed On-Site Timber Survey Visit
                                </span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Truck size={12} className="text-blue-400" /> {neg.deliveryPreference}
                                </span>
                              </div>

                              <div className="tc-neg-survey-detail flex items-center gap-2 flex-wrap">
                                <span className="text-slate-300">Survey Date:</span>
                                <strong className="text-white font-mono bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                                  {neg.surveyVisitDate}
                                </strong>
                                {neg.surveyTimeSlot && (
                                  <span className="text-emerald-300 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    {String(neg.surveyTimeSlot).replace(/^\(|\)$/g, '')}
                                  </span>
                                )}
                              </div>

                              {neg.notes && (
                                <div className="tc-neg-note-box flex items-start gap-2">
                                  <MessageSquare size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                  <span>"{neg.notes}"</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-300 space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/8">
                              <div><strong className="text-slate-400">Delivery Preference:</strong> {neg.deliveryPreference}</div>
                              {neg.paymentTerms && <div><strong className="text-slate-400">Payment Terms:</strong> {neg.paymentTerms}</div>}
                              {neg.notes && (
                                <div className="tc-neg-note-box flex items-start gap-2">
                                  <MessageSquare size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                  <span>"{neg.notes}"</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Counter offer details if any */}
                          {neg.counterOffer && (
                            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-1">
                              <span className="font-bold flex items-center gap-1.5 text-blue-300">
                                <RotateCcw size={14} /> Current Counter-Rate: ₹ {Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                              <p className="text-slate-300 italic">"{neg.counterOffer.message}"</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {(isPending || isCounter) && (
                            <div className="tc-neg-actions-row">
                              <button
                                onClick={() => handleRejectOffer(neg)}
                                className="tc-neg-btn-decline"
                              >
                                Decline Offer
                              </button>

                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => openCounterModal(neg)}
                                  className="tc-neg-btn-counter"
                                >
                                  <RotateCcw size={14} /> Make Counter-Offer
                                </button>
                                <button
                                  onClick={() => handleAcceptOffer(neg)}
                                  className="tc-neg-btn-accept"
                                >
                                  <Check size={15} /> Accept Offer & Confirm Visit
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COMPLETED SALES & ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="tmp-section-header-box">
                  <div>
                    <h2 className="tmp-section-title">Timber Purchase Contracts & Fulfillment</h2>
                    <p className="tmp-section-desc">
                      Contracts where buyers confirmed procurement. Track transit milestones, forest clearance passes, and settlement.
                    </p>
                  </div>
                </div>

                {myOrders.length === 0 ? (
                  <div className="tmp-empty-card">
                    <div className="tmp-empty-icon">
                      <Truck size={32} />
                    </div>
                    <h3 className="tmp-empty-title">No Completed Sales Recorded</h3>
                    <p className="tmp-empty-subtitle">
                      Once buyers confirm orders on your timber, shipping permits and payouts will track here.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper tmp-content-card p-0 overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order Ref</th>
                          <th>Timber Item</th>
                          <th>Buyer</th>
                          <th>Volume</th>
                          <th>Contract Payout</th>
                          <th>Status</th>
                          <th>Forest Pass</th>
                          <th>ETA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td className="font-mono font-bold text-white">{ord.id}</td>
                            <td className="text-main font-semibold">{ord.timberItem}</td>
                            <td className="text-slate-300 text-xs">
                              <div className="font-bold text-white">{ord.buyerName}</div>
                              <div className="text-muted">{ord.mill}</div>
                            </td>
                            <td className="text-emerald-400 font-mono font-bold">{ord.volume}</td>
                            <td className="text-amber-300 font-mono font-bold">{ord.total}</td>
                            <td>
                              <span className="status-chip status-chip-active text-xs">
                                {ord.status}
                              </span>
                            </td>
                            <td className="text-xs text-emerald-400 font-mono">{ord.passNo || 'Verified'}</td>
                            <td className="text-xs text-muted">{ord.ETA}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ALL MARKET TIMBER */}
            {activeTab === 'all_listings' && (
              <div className="space-y-6">
                <div className="tmp-section-header-box">
                  <div>
                    <h2 className="tmp-section-title">Live Kerala Timber Market Exchange</h2>
                    <p className="tmp-section-desc">
                      All published timber lots across Kerala from Landowners and Harvesting Contractors.
                    </p>
                  </div>
                  <span className="tmp-filter-count">
                    {listings.length} Lots in Market
                  </span>
                </div>

                <div className="tmp-listings-grid">
                  {listings.map((item) => (
                    <div key={item.id} className="tmp-listing-card">
                      <div className="tmp-card-body space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.sellerRole === 'contractor'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.sellerRole === 'contractor' ? '🚜 Contractor Lot' : '🌲 Landowner Lot'}
                          </span>
                          <span className="text-xs font-semibold text-emerald-400">{item.gradeQuality}</span>
                        </div>

                        <h3 className="tmp-card-title">{item.title || item.timberSpecies}</h3>
                        <p className="tmp-card-desc">{item.description}</p>

                        <div className="tmp-specs-box">
                          <div className="tmp-spec-item">
                            <span className="tmp-spec-label">Volume</span>
                            <span className="tmp-spec-value-emerald">{item.volume} m³</span>
                          </div>
                          <div className="tmp-spec-item">
                            <span className="tmp-spec-label">Rate</span>
                            <span className="tmp-spec-value-gold">
                              ₹ {Number(item.pricePerM3).toLocaleString('en-IN')} / m³
                            </span>
                          </div>
                        </div>

                        <div className="tmp-location-row">
                          <MapPin size={13} className="tmp-location-icon" />
                          <span className="truncate">{item.district} • Seller: {item.sellerName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COUNTER-OFFER MODAL */}
            {counterModalOpen && selectedNegotiation && (() => {
              const askingRate = Number(selectedNegotiation.originalPricePerM3 || selectedNegotiation.pricePerM3 || 42500);
              const buyerBidRate = Number(selectedNegotiation.offeredPricePerM3 || 0);
              const reqVolume = Number(selectedNegotiation.requestedVolume || 1);
              const splitRate = Math.round((askingRate + buyerBidRate) / 2);
              const plusFiveRate = Math.round(buyerBidRate * 1.05);
              const diffPercent = askingRate > 0 && buyerBidRate < askingRate 
                ? Math.round(((askingRate - buyerBidRate) / askingRate) * 100) 
                : 0;
              const numericCounter = Number(counterPrice) || 0;
              const counterTotal = numericCounter * reqVolume;
              const gainVsBid = numericCounter > buyerBidRate 
                ? (numericCounter - buyerBidRate) * reqVolume 
                : 0;

              return (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex items-center justify-center p-4 overflow-y-auto">
                  <div className="tc-counter-modal-card my-auto">
                    {/* Header */}
                    <div className="tc-counter-header">
                      <div className="tc-counter-title-group">
                        <div className="tc-counter-icon-wrap">
                          <RotateCcw size={20} />
                        </div>
                        <div>
                          <h3 className="tc-counter-title">
                            Propose Counter-Offer
                          </h3>
                          <div className="tc-counter-lot-badge">
                            Lot: <span className="text-emerald-300 font-semibold">{selectedNegotiation.timberTitle}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCounterModalOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        title="Close"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Rate Comparison Grid */}
                    <div className="tc-counter-compare-grid">
                      {/* Buyer Bid Card */}
                      <div className="tc-counter-compare-card bid">
                        <span className="tc-counter-pill amber">Buyer's Bid</span>
                        <div className="tc-counter-compare-rate">
                          ₹ {buyerBidRate.toLocaleString('en-IN')} <span className="text-xs font-normal text-amber-300/80">/ m³</span>
                        </div>
                        <div className="tc-counter-compare-sub">
                          {diffPercent > 0 ? `${diffPercent}% below asking` : 'Initial offer'} • Total ₹ {(buyerBidRate * reqVolume).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Direction Icon */}
                      <div className="tc-counter-compare-arrow">
                        <ArrowRight size={15} />
                      </div>

                      {/* Your Asking Rate Card */}
                      <div className="tc-counter-compare-card asking">
                        <span className="tc-counter-pill emerald">Your Listed Price</span>
                        <div className="tc-counter-compare-rate">
                          ₹ {askingRate.toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-300/80">/ m³</span>
                        </div>
                        <div className="tc-counter-compare-sub">
                          Target • Total ₹ {(askingRate * reqVolume).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Volume & Survey Inspection Strip */}
                    <div className="tc-counter-deal-info-strip">
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-emerald-400" />
                        <span>Volume: <strong className="text-white">{reqVolume} m³</strong></span>
                      </div>
                      {selectedNegotiation.surveyVisitDate && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar size={14} className="text-emerald-400" />
                          <span>Inspection: <strong className="text-emerald-300">{selectedNegotiation.surveyVisitDate}</strong> {selectedNegotiation.surveyTimeSlot ? `(${selectedNegotiation.surveyTimeSlot.split(' ')[0]})` : ''}</span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={submitCounterOffer} className="space-y-4">
                      {/* Counter Rate Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-200">
                            Your Counter-Rate (₹ per m³):
                          </label>
                          <span className="text-[11px] text-slate-400">
                            Requested: <strong className="text-white">{reqVolume} m³</strong>
                          </span>
                        </div>

                        <div className="tc-counter-input-box">
                          <span className="tc-counter-input-prefix">₹</span>
                          <input
                            type="number"
                            value={counterPrice}
                            onChange={(e) => setCounterPrice(e.target.value)}
                            placeholder={String(askingRate)}
                            className="tc-counter-input-field"
                            min="1000"
                            step="50"
                            required
                          />
                          <span className="tc-counter-input-suffix">/ m³</span>
                        </div>

                        {/* Quick Rate Preset Buttons */}
                        <div className="tc-counter-presets-row">
                          <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCounterPrice(askingRate);
                              setCounterMessage(`We can agree to sell at ₹${askingRate.toLocaleString('en-IN')}/m³ with prompt yard pickup.`);
                            }}
                            className="tc-counter-preset-btn"
                          >
                            Hold Listed Rate (₹ {askingRate.toLocaleString('en-IN')})
                          </button>
                          {splitRate !== askingRate && splitRate !== buyerBidRate && (
                            <button
                              type="button"
                              onClick={() => {
                                setCounterPrice(splitRate);
                                setCounterMessage(`Let's meet halfway at ₹${splitRate.toLocaleString('en-IN')}/m³ with immediate loading clearance.`);
                              }}
                              className="tc-counter-preset-btn"
                            >
                              Split Difference (₹ {splitRate.toLocaleString('en-IN')})
                            </button>
                          )}
                          {plusFiveRate > buyerBidRate && plusFiveRate < askingRate && (
                            <button
                              type="button"
                              onClick={() => {
                                setCounterPrice(plusFiveRate);
                                setCounterMessage(`We can offer a special rate of ₹${plusFiveRate.toLocaleString('en-IN')}/m³ upon on-site survey inspection.`);
                              }}
                              className="tc-counter-preset-btn"
                            >
                              +5% of Bid (₹ {plusFiveRate.toLocaleString('en-IN')})
                            </button>
                          )}
                        </div>

                        {/* Total Proposed Value Banner */}
                        {numericCounter > 0 && (
                          <div className="tc-counter-summary-banner">
                            <span className="text-slate-300">
                              Total Proposed Value: <strong className="text-emerald-300 font-mono text-sm ml-1">₹ {counterTotal.toLocaleString('en-IN')}</strong>
                            </span>
                            {gainVsBid > 0 && (
                              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                +₹ {gainVsBid.toLocaleString('en-IN')} vs buyer offer
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message / Terms for Buyer */}
                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1.5">
                          Message & Conditions for Buyer:
                        </label>
                        <textarea
                          rows="3"
                          value={counterMessage}
                          onChange={(e) => setCounterMessage(e.target.value)}
                          className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all resize-none"
                          placeholder="Specify yard loading, transport, inspection timeline or payment conditions..."
                        />
                        {/* Quick suggestion chips */}
                        <div className="tc-counter-quick-chips">
                          <button
                            type="button"
                            onClick={() => setCounterMessage(prev => prev ? `${prev} Yard pickup and log-loading included.` : 'Yard pickup and log-loading included.')}
                            className="tc-counter-quick-chip"
                          >
                            + Yard loading included
                          </button>
                          <button
                            type="button"
                            onClick={() => setCounterMessage(prev => prev ? `${prev} Payment due upon on-site survey inspection.` : 'Payment due upon on-site survey inspection.')}
                            className="tc-counter-quick-chip"
                          >
                            + Payment after survey
                          </button>
                          <button
                            type="button"
                            onClick={() => setCounterMessage(prev => prev ? `${prev} Log pickup required within 5 days of transit permit clearance.` : 'Log pickup required within 5 days of transit permit clearance.')}
                            className="tc-counter-quick-chip"
                          >
                            + Pickup within 5 days
                          </button>
                        </div>
                      </div>

                      {/* Modal Footer Actions */}
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
                        <button
                          type="button"
                          onClick={() => setCounterModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <RotateCcw size={14} /> Send Counter-Offer
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })()}

          </main>
        </div>
      </div>
    </div>
  );
};

export default TimberMarketplacePage;
