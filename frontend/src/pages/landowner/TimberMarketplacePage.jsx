import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
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
  Filter
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

    const handleUpdate = () => loadData();
    window.addEventListener('treeconnect_marketplace_updated', handleUpdate);
    return () => window.removeEventListener('treeconnect_marketplace_updated', handleUpdate);
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
          <main className="dashboard-content max-w-7xl mx-auto py-6">

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald/15 text-emerald border border-emerald/30">
                    Landowner Portal
                  </span>
                  <span className="text-xs text-muted">Kerala Timber Exchange</span>
                </div>
                <h1 className="text-2xl font-bold text-main flex items-center gap-2">
                  <ShoppingBag className="text-emerald" size={26} /> Timber Marketplace & Sales Hub
                </h1>
                <p className="text-sm text-muted">
                  List your estate timber, negotiate with verified commercial sawmill buyers, and track sales payouts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/landowner/create-timber-listing')}
                  className="btn btn-primary flex items-center gap-2 shadow-lg shadow-emerald/20 cursor-pointer"
                >
                  <Plus size={18} /> Add Timber to Sell
                </button>
              </div>
            </div>

            {/* TOAST ALERT */}
            {toastMessage && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center gap-3 shadow-xl animate-fade-in">
                <CheckCircle2 size={20} className="text-emerald-400" />
                <span className="font-semibold text-sm">{toastMessage}</span>
              </div>
            )}

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">My Active Listings</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald/15 text-emerald flex items-center justify-center">
                    <ShoppingBag size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-main font-mono">{myListings.length}</div>
                <div className="text-xs text-muted mt-1">Available for buyer purchase</div>
              </div>

              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Total Volume</span>
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Trees size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald font-mono">{totalVolume.toFixed(1)} m³</div>
                <div className="text-xs text-muted mt-1">Certified Kerala timber stock</div>
              </div>

              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Buyer Inquiries & Offers</span>
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingNegotiations.length}</div>
                <div className="text-xs text-amber-400/80 mt-1">
                  {pendingNegotiations.length > 0 ? 'Action required: Review offers' : 'No pending offers'}
                </div>
              </div>

              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Total Inventory Value</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-gold font-mono">
                  ₹ {(totalValue / 100000).toFixed(2)} Lakh
                </div>
                <div className="text-xs text-muted mt-1">Across all published lots</div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-color mb-6 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('my_listings')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'my_listings'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Tag size={16} /> My Timber Listings ({myListings.length})
              </button>

              <button
                onClick={() => setActiveTab('negotiations')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 relative cursor-pointer ${
                  activeTab === 'negotiations'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <MessageSquare size={16} /> Buyer Offers & Negotiations
                {pendingNegotiations.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500 text-black font-bold">
                    {pendingNegotiations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Truck size={16} /> Completed Sales & Orders ({myOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('all_listings')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'all_listings'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Layers size={16} /> All Marketplace Listings ({listings.length})
              </button>
            </div>

            {/* TAB 1: MY TIMBER LISTINGS */}
            {activeTab === 'my_listings' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-color">
                  <div className="flex flex-wrap items-center gap-3">
                    <Filter size={16} className="text-muted" />
                    <span className="text-xs font-semibold text-muted uppercase">Filter:</span>

                    <select
                      value={filterSpecies}
                      onChange={(e) => setFilterSpecies(e.target.value)}
                      className="form-input text-xs py-1.5 px-3 w-auto"
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
                      className="form-input text-xs py-1.5 px-3 w-auto"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Published">Published (Active)</option>
                      <option value="Under Negotiation">Under Negotiation</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <span className="text-xs text-muted">
                    Showing <strong className="text-white">{filteredMyListings.length}</strong> listings
                  </span>
                </div>

                {/* Listings Grid */}
                {filteredMyListings.length === 0 ? (
                  <div className="card p-12 text-center rounded-xl border border-color bg-card">
                    <Trees size={48} className="mx-auto text-emerald/40 mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Timber Listings Found</h3>
                    <p className="text-xs text-muted max-w-md mx-auto mb-4">
                      You haven't listed any timber yet, or no items match your filter. Add your first felled timber or standing parcel for commercial buyers!
                    </p>
                    <button
                      onClick={() => navigate('/landowner/create-timber-listing')}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <Plus size={16} /> List Timber Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredMyListings.map((listing) => {
                      const listingNegs = myNegotiations.filter(n => n.listingId === listing.id);

                      return (
                        <div
                          key={listing.id}
                          className="card border border-color rounded-xl overflow-hidden bg-card flex flex-col justify-between hover:border-emerald/40 transition-all shadow-md hover:shadow-xl"
                        >
                          <div>
                            {/* Card Media / Header */}
                            <div className="h-44 bg-surface relative overflow-hidden">
                              {listing.images?.[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.timberSpecies}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#07130a] to-[#040805] text-slate-500 p-4 text-center">
                                  <Trees size={36} className="text-emerald-500/40 mb-2" />
                                  <span className="text-xs font-bold text-slate-300">{listing.timberSpecies}</span>
                                  <span className="text-[10px] text-slate-500">{listing.timberType}</span>
                                </div>
                              )}

                              {/* Status Badge */}
                              <span
                                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-md ${
                                  listing.status === 'Sold'
                                    ? 'bg-rose-500 text-white'
                                    : listing.status === 'Under Negotiation'
                                    ? 'bg-amber-500 text-black'
                                    : 'bg-emerald text-dark'
                                }`}
                              >
                                {listing.status}
                              </span>

                              {/* FSC or Verification Badge */}
                              {listing.fscCert && (
                                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm flex items-center gap-1">
                                  <ShieldCheck size={11} /> {listing.fscCert}
                                </span>
                              )}
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-emerald font-semibold uppercase tracking-wider">
                                  {listing.timberType}
                                </span>
                                <span className="text-xs text-muted font-medium">{listing.gradeQuality}</span>
                              </div>

                              <h3 className="text-lg font-bold text-main line-clamp-1">
                                {listing.title || `${listing.gradeQuality} ${listing.timberSpecies}`}
                              </h3>

                              <p className="text-xs text-muted line-clamp-2">
                                {listing.description || 'Verified timber lot available for direct pickup.'}
                              </p>

                              {/* Specs Grid */}
                              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface border border-color text-xs">
                                <div>
                                  <span className="text-muted block">Volume:</span>
                                  <span className="font-bold text-emerald font-mono text-sm">{listing.volume} m³</span>
                                </div>
                                <div>
                                  <span className="text-muted block">Total Price:</span>
                                  <span className="font-bold text-gold font-mono text-sm">
                                    ₹ {Number(listing.askingPrice).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted block">Rate / m³:</span>
                                  <span className="font-semibold text-main">
                                    ₹ {Number(listing.pricePerM3).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted block">Negotiable:</span>
                                  <span className={`font-semibold ${listing.negotiable === 'Yes' ? 'text-emerald' : 'text-muted'}`}>
                                    {listing.negotiable}
                                  </span>
                                </div>
                              </div>

                              <div className="text-xs text-muted flex items-center gap-1">
                                <MapPin size={12} className="text-emerald" />
                                {listing.district} • {listing.storageLocation || 'Estate Yard'}
                              </div>

                              {/* Offers notification strip */}
                              {listingNegs.length > 0 && (
                                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 font-semibold">
                                    <MessageSquare size={13} /> {listingNegs.length} Buyer Offer{listingNegs.length > 1 ? 's' : ''}
                                  </span>
                                  <button
                                    onClick={() => setActiveTab('negotiations')}
                                    className="text-[11px] underline font-bold hover:text-white"
                                  >
                                    View Offers →
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="p-4 border-t border-color bg-surface/40 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <select
                                value={listing.status}
                                onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                                className="bg-slate-900 text-xs border border-slate-700 rounded px-2 py-1 text-slate-200"
                              >
                                <option value="Published">Active</option>
                                <option value="Under Negotiation">Under Offer</option>
                                <option value="Sold">Sold</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteListing(listing.id)}
                                className="p-1.5 text-muted hover:text-red-400 transition-colors"
                                title="Delete Listing"
                              >
                                <Trash2 size={15} />
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

            {/* TAB 2: BUYER OFFERS & NEGOTIATIONS */}
            {activeTab === 'negotiations' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-color flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-main">Commercial Buyer Bargaining Inbox</h2>
                    <p className="text-xs text-muted">
                      Review bids submitted by sawmills and timber procurement companies. You can accept, propose counter-rates, or decline.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface border border-color text-main">
                    {myNegotiations.length} Total Negotiations
                  </span>
                </div>

                {myNegotiations.length === 0 ? (
                  <div className="card p-12 text-center rounded-xl border border-color bg-card">
                    <MessageSquare size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Buyer Offers Yet</h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
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
                          className="card p-5 rounded-xl border border-color bg-card hover:border-slate-700 transition-all space-y-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-color">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-emerald">{neg.timberSpecies}</span>
                                <span className="text-muted text-xs">•</span>
                                <span className="text-xs text-muted font-mono">{neg.id}</span>
                              </div>
                              <h3 className="text-base font-bold text-main">{neg.timberTitle}</h3>
                              <p className="text-xs text-muted mt-0.5">
                                Buyer: <strong className="text-white">{neg.buyerName}</strong> ({neg.buyerCompany}) • {neg.buyerPhone}
                              </p>
                            </div>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isAccepted
                                  ? 'bg-emerald/20 text-emerald border border-emerald/40'
                                  : isRejected
                                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                  : isCounter
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {neg.status}
                            </span>
                          </div>

                          {/* Offer Comparison Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-surface border border-color text-xs">
                            <div>
                              <span className="text-muted block">Original Asking Rate:</span>
                              <span className="font-semibold text-slate-300 font-mono">
                                ₹ {Number(neg.originalPricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block">Buyer's Offered Rate:</span>
                              <span className="font-extrabold text-emerald font-mono text-sm">
                                ₹ {Number(neg.offeredPricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block">Requested Volume:</span>
                              <span className="font-bold text-white font-mono">{neg.requestedVolume} m³</span>
                            </div>
                            <div>
                              <span className="text-muted block">Total Deal Offer:</span>
                              <span className="font-extrabold text-gold font-mono text-sm">
                                ₹ {Number(neg.totalOffered).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Terms & Notes */}
                          <div className="text-xs text-muted space-y-1.5">
                            <div>
                              <strong className="text-slate-300">Delivery Preference:</strong> {neg.deliveryPreference}
                            </div>
                            <div>
                              <strong className="text-slate-300">Payment Terms:</strong> {neg.paymentTerms}
                            </div>
                            {neg.notes && (
                              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-200 italic">
                                "{neg.notes}"
                              </div>
                            )}
                          </div>

                          {/* Counter offer details if any */}
                          {neg.counterOffer && (
                            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
                              <span className="font-bold block mb-1">
                                Current Counter-Rate: ₹ {Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                              <span>{neg.counterOffer.message}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {(isPending || isCounter) && (
                            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-color">
                              <button
                                onClick={() => handleRejectOffer(neg)}
                                className="btn btn-secondary btn-sm text-red-400 hover:text-red-300"
                              >
                                Decline Offer
                              </button>
                              <button
                                onClick={() => openCounterModal(neg)}
                                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                              >
                                <RotateCcw size={14} /> Make Counter-Offer
                              </button>
                              <button
                                onClick={() => handleAcceptOffer(neg)}
                                className="btn btn-primary btn-sm flex items-center gap-1.5"
                              >
                                <Check size={14} /> Accept Offer
                              </button>
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
                <div className="p-4 rounded-xl bg-card border border-color">
                  <h2 className="text-base font-bold text-main">Timber Purchase Contracts & Fulfillment</h2>
                  <p className="text-xs text-muted">
                    Contracts where buyers confirmed procurement. Track transit milestones, forest clearance passes, and settlement.
                  </p>
                </div>

                {myOrders.length === 0 ? (
                  <div className="card p-12 text-center rounded-xl border border-color bg-card">
                    <Truck size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Completed Sales Recorded</h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Once buyers confirm orders on your timber, shipping permits and payouts will track here.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper card p-0 overflow-hidden">
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
                            <td className="text-emerald font-mono font-bold">{ord.volume}</td>
                            <td className="text-gold font-mono font-bold">{ord.total}</td>
                            <td>
                              <span className="status-chip status-chip-active text-xs">
                                {ord.status}
                              </span>
                            </td>
                            <td className="text-xs text-emerald font-mono">{ord.passNo || 'Verified'}</td>
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
                <div className="p-4 rounded-xl bg-card border border-color flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-main">Live Kerala Timber Market Exchange</h2>
                    <p className="text-xs text-muted">
                      All published timber lots across Kerala from Landowners and Harvesting Contractors.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface border border-color text-main">
                    {listings.length} Lots in Market
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {listings.map((item) => (
                    <div key={item.id} className="card border border-color rounded-xl overflow-hidden bg-card flex flex-col justify-between">
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.sellerRole === 'contractor'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {item.sellerRole === 'contractor' ? '🚜 Contractor Lot' : '🌲 Landowner Lot'}
                          </span>
                          <span className="text-xs font-semibold text-emerald">{item.gradeQuality}</span>
                        </div>

                        <h3 className="text-base font-bold text-main">{item.title || item.timberSpecies}</h3>
                        <p className="text-xs text-muted line-clamp-2">{item.description}</p>

                        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface border border-color text-xs">
                          <div>
                            <span className="text-muted block">Volume:</span>
                            <span className="font-bold text-emerald font-mono">{item.volume} m³</span>
                          </div>
                          <div>
                            <span className="text-muted block">Rate:</span>
                            <span className="font-bold text-gold font-mono">
                              ₹ {Number(item.pricePerM3).toLocaleString('en-IN')} / m³
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-muted flex items-center gap-1">
                          <MapPin size={12} className="text-emerald" /> {item.district} • Seller: {item.sellerName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COUNTER-OFFER MODAL */}
            {counterModalOpen && selectedNegotiation && (
              <div className="modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="modal-container bg-card border border-color rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-up">
                  <div className="flex items-center justify-between pb-3 border-b border-color mb-4">
                    <h3 className="text-lg font-bold text-main flex items-center gap-2">
                      <RotateCcw size={18} className="text-emerald" /> Propose Counter-Offer
                    </h3>
                    <button
                      onClick={() => setCounterModalOpen(false)}
                      className="text-muted hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={submitCounterOffer} className="space-y-4">
                    <div className="p-3 bg-surface rounded-lg border border-color text-xs space-y-1">
                      <div className="text-muted">Item: <strong className="text-white">{selectedNegotiation.timberTitle}</strong></div>
                      <div className="text-muted">Buyer Offer: <strong className="text-amber-400">₹ {Number(selectedNegotiation.offeredPricePerM3).toLocaleString('en-IN')}/m³</strong></div>
                      <div className="text-muted">Volume Requested: <strong className="text-white">{selectedNegotiation.requestedVolume} m³</strong></div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Your Counter Rate (₹ per m³):</label>
                      <input
                        type="number"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="e.g. 41000"
                        className="form-input text-base font-bold font-mono text-emerald"
                        required
                      />
                      {counterPrice && (
                        <span className="text-[11px] text-muted block mt-1">
                          Total proposed value: <strong className="text-gold">₹ {(Number(counterPrice) * selectedNegotiation.requestedVolume).toLocaleString('en-IN')}</strong>
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Message / Terms for Buyer:</label>
                      <textarea
                        rows="3"
                        value={counterMessage}
                        onChange={(e) => setCounterMessage(e.target.value)}
                        className="form-input text-xs"
                        placeholder="State your conditions, pickup timeline, or loading provisions..."
                      ></textarea>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button
                        type="button"
                        onClick={() => setCounterModalOpen(false)}
                        className="btn btn-secondary btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <RotateCcw size={14} /> Send Counter-Offer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default TimberMarketplacePage;
