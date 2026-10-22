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
  Filter,
  Wrench
} from 'lucide-react';

const ContractorTimberMarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentEmail = (user?.email || '').toLowerCase().trim();

  const [activeTab, setActiveTab] = useState('contractor_listings'); // 'contractor_listings' | 'negotiations' | 'orders' | 'all_listings'
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

  // Toast
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

  // Filter listings owned by contractor
  const myContractorListings = listings.filter(l => {
    if (!l) return false;
    const lEmail = (l.sellerEmail || '').toLowerCase().trim();
    if (currentEmail && lEmail === currentEmail) return true;
    return l.sellerRole === 'contractor';
  });

  // Collect valid listing IDs for contractor
  const myContractorListingsIdSet = new Set();
  myContractorListings.forEach(l => {
    if (l.id) myContractorListingsIdSet.add(String(l.id).trim());
    if (l._id) myContractorListingsIdSet.add(String(l._id).trim());
    if (l.harvestOperationId) myContractorListingsIdSet.add(String(l.harvestOperationId).trim());
    if (l.treeInventoryId) myContractorListingsIdSet.add(String(l.treeInventoryId).trim());
  });

  // Filter negotiations on contractor timber (must match an active listing)
  const myNegotiations = negotiations.filter(n => {
    if (!n) return false;
    const nListingId = String(n.listingId || '').trim();
    if (!nListingId || !myContractorListingsIdSet.has(nListingId)) return false;
    const sEmail = (n.sellerEmail || '').toLowerCase().trim();
    if (currentEmail && sEmail === currentEmail) return true;
    return n.sellerRole === 'contractor';
  });

  // Filter orders for contractor
  const myOrders = orders.filter(o => {
    if (!o) return false;
    const sEmail = (o.sellerEmail || '').toLowerCase().trim();
    if (currentEmail && sEmail === currentEmail) return true;
    return o.sellerRole === 'contractor';
  });

  const totalVolume = myContractorListings.reduce((sum, item) => sum + (Number(item.volume) || 0), 0);
  const totalValue = myContractorListings.reduce((sum, item) => sum + (Number(item.askingPrice) || 0), 0);
  const pendingNegotiations = myNegotiations.filter(n => n.status === 'Pending Review' || n.status === 'Counter-Offer');

  const handleStatusChange = (id, newStatus) => {
    marketplaceService.updateListingStatus(id, newStatus);
    showToast(`Listing status updated to ${newStatus}`);
    loadData();
  };

  const handleDeleteListing = async (id) => {
    if (!id) return;
    const confirmed = window.confirm('Are you sure you want to remove this timber listing?');
    if (!confirmed) return;

    try {
      const idStr = String(id).trim();
      const targetListing = listings.find(l => {
        const lId = String(l?.id || l?._id || '').trim();
        return lId === idStr || l?.id === id || l?._id === id;
      });
      const matchingIds = new Set([idStr, String(id)]);
      if (targetListing) {
        if (targetListing.id) matchingIds.add(String(targetListing.id).trim());
        if (targetListing._id) matchingIds.add(String(targetListing._id).trim());
        if (targetListing.harvestOperationId) matchingIds.add(String(targetListing.harvestOperationId).trim());
        if (targetListing.treeInventoryId) matchingIds.add(String(targetListing.treeInventoryId).trim());
      }

      setListings(prev => prev.filter(l => {
        const lId = String(l?.id || l?._id || '').trim();
        return !matchingIds.has(lId) && lId !== idStr && l?.id !== id && l?._id !== id;
      }));
      setNegotiations(prev => prev.filter(n => {
        const nListingId = String(n?.listingId || '').trim();
        return !matchingIds.has(nListingId) && nListingId !== idStr && n?.listingId !== id;
      }));
      showToast('Timber listing removed from marketplace');
      await marketplaceService.deleteListing(idStr);
      loadData();
    } catch (err) {
      console.error('Error deleting listing:', err);
      showToast('Failed to remove listing');
    }
  };

  const handleAcceptOffer = (neg) => {
    marketplaceService.respondToNegotiation(neg.id, 'accept', {
      sender: 'Contractor',
      senderName: user?.name || neg.sellerName,
      message: 'Contractor accepted offer. Log loading schedule and transit pass processing initiated.'
    });
    showToast(`Accepted offer from ${neg.buyerName}!`);
    loadData();
  };

  const handleRejectOffer = (neg) => {
    if (window.confirm('Are you sure you want to decline this buyer offer?')) {
      marketplaceService.respondToNegotiation(neg.id, 'reject', {
        sender: 'Contractor',
        senderName: user?.name || neg.sellerName,
        message: 'Offer rate is below contractor processing cost.'
      });
      showToast(`Declined offer from ${neg.buyerName}.`);
      loadData();
    }
  };

  const openCounterModal = (neg) => {
    setSelectedNegotiation(neg);
    setCounterPrice(neg.originalPricePerM3 || '');
    setCounterMessage(`We can supply at ₹${Number(neg.originalPricePerM3 || 0).toLocaleString('en-IN')}/m³ with contractor hauling included.`);
    setCounterModalOpen(true);
  };

  const submitCounterOffer = (e) => {
    e.preventDefault();
    if (!selectedNegotiation || !counterPrice) return;

    marketplaceService.respondToNegotiation(selectedNegotiation.id, 'counter', {
      sender: 'Contractor',
      senderName: user?.name || selectedNegotiation.sellerName,
      pricePerM3: Number(counterPrice),
      message: counterMessage
    });

    setCounterModalOpen(false);
    showToast('Counter-offer submitted to commercial buyer!');
    loadData();
  };

  const filteredListings = myContractorListings.filter(l => {
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
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Contractor Operations
                  </span>
                  <span className="text-xs text-muted">Log Yard & Harvesting Inventory</span>
                </div>
                <h1 className="text-2xl font-bold text-main flex items-center gap-2">
                  <ShoppingBag className="text-emerald" size={26} /> Contractor Timber Marketplace Hub
                </h1>
                <p className="text-sm text-muted">
                  Sell harvested timber logs, industrial pulpwood, and processed timber baulks with your fleet hauling support.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/contractor/create-timber-listing')}
                  className="btn btn-primary flex items-center gap-2 shadow-lg shadow-emerald/20 cursor-pointer"
                >
                  <Plus size={18} /> List Harvested Timber
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
                  <span className="text-xs font-semibold text-muted uppercase">Contractor Yard Lots</span>
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <ShoppingBag size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-main font-mono">{myContractorListings.length}</div>
                <div className="text-xs text-muted mt-1">Active contractor timber stocks</div>
              </div>

              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Available Log Volume</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald/15 text-emerald flex items-center justify-center">
                    <Trees size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-emerald font-mono">{totalVolume.toFixed(1)} m³</div>
                <div className="text-xs text-muted mt-1">Processed & ready for dispatch</div>
              </div>

              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Buyer Bids & Offers</span>
                  <span className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                    <MessageSquare size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingNegotiations.length}</div>
                <div className="text-xs text-amber-400/80 mt-1">
                  {pendingNegotiations.length > 0 ? 'Buyer negotiations awaiting response' : 'No pending offers'}
                </div>
              </div>

              <div className="card p-4 rounded-xl border border-color bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted uppercase">Total Yard Inventory</span>
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                    <DollarSign size={18} />
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-gold font-mono">
                  ₹ {(totalValue / 100000).toFixed(2)} Lakh
                </div>
                <div className="text-xs text-muted mt-1">Estimated gross value</div>
              </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-2 border-b border-color mb-6 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab('contractor_listings')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'contractor_listings'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Tag size={16} /> Contractor Timber Lots ({myContractorListings.length})
              </button>

              <button
                onClick={() => setActiveTab('negotiations')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 relative cursor-pointer ${
                  activeTab === 'negotiations'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <MessageSquare size={16} /> Buyer Negotiations
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
                <Truck size={16} /> Dispatch Orders ({myOrders.length})
              </button>

              <button
                onClick={() => setActiveTab('all_listings')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'all_listings'
                    ? 'bg-card text-emerald border-b-2 border-emerald font-bold'
                    : 'text-muted hover:text-main'
                }`}
              >
                <Layers size={16} /> Full Marketplace Exchange ({listings.length})
              </button>
            </div>

            {/* TAB 1: CONTRACTOR LISTINGS */}
            {activeTab === 'contractor_listings' && (
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
                      <option value="Rubberwood">Rubberwood</option>
                      <option value="Mahogany">Mahogany</option>
                      <option value="Teakwood">Teakwood</option>
                      <option value="Rosewood">Rosewood</option>
                      <option value="Eucalyptus">Eucalyptus</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="form-input text-xs py-1.5 px-3 w-auto"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Published">Active</option>
                      <option value="Under Negotiation">Under Negotiation</option>
                      <option value="Sold">Sold</option>
                    </select>
                  </div>

                  <span className="text-xs text-muted">
                    Showing <strong className="text-white">{filteredListings.length}</strong> contractor lots
                  </span>
                </div>

                {/* Grid */}
                {filteredListings.length === 0 ? (
                  <div className="card p-12 text-center rounded-xl border border-color bg-card">
                    <Trees size={48} className="mx-auto text-blue-400/40 mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Contractor Timber Lots Listed</h3>
                    <p className="text-xs text-muted max-w-md mx-auto mb-4">
                      List your harvested rubberwood, sawlogs, or cleared parcel timber for commercial mills and furniture manufacturers.
                    </p>
                    <button
                      onClick={() => navigate('/contractor/create-timber-listing')}
                      className="btn btn-primary inline-flex items-center gap-2"
                    >
                      <Plus size={16} /> List Timber Stock
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => {
                      const listingNegs = myNegotiations.filter(n => n.listingId === listing.id);

                      return (
                        <div
                          key={listing.id}
                          className="card border border-color rounded-xl overflow-hidden bg-card flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-md hover:shadow-xl"
                        >
                          <div>
                            <div className="h-44 bg-surface relative overflow-hidden">
                              {listing.images?.[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.timberSpecies}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#05111b] to-[#04080e] text-slate-500 p-4 text-center">
                                  <Truck size={36} className="text-blue-400/40 mb-2" />
                                  <span className="text-xs font-bold text-slate-200">{listing.timberSpecies}</span>
                                  <span className="text-[10px] text-blue-400">{listing.timberType}</span>
                                </div>
                              )}

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

                              {listing.transportAvailable && (
                                <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-600/50 backdrop-blur-sm flex items-center gap-1">
                                  <Truck size={11} /> Contractor Hauling Included
                                </span>
                              )}
                            </div>

                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-blue-400 font-semibold uppercase tracking-wider">
                                  {listing.timberType}
                                </span>
                                <span className="text-xs text-muted font-medium">{listing.gradeQuality}</span>
                              </div>

                              <h3 className="text-lg font-bold text-main line-clamp-1">
                                {listing.title || `${listing.gradeQuality} ${listing.timberSpecies}`}
                              </h3>

                              <p className="text-xs text-muted line-clamp-2">{listing.description}</p>

                              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface border border-color text-xs">
                                <div>
                                  <span className="text-muted block">Volume:</span>
                                  <span className="font-bold text-emerald font-mono text-sm">{listing.volume} m³</span>
                                </div>
                                <div>
                                  <span className="text-muted block">Asking Price:</span>
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
                                <MapPin size={12} className="text-blue-400" />
                                {listing.district} • {listing.storageLocation || 'Log Depot'}
                              </div>

                              {listingNegs.length > 0 && (
                                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5 font-semibold">
                                    <MessageSquare size={13} /> {listingNegs.length} Buyer Bid{listingNegs.length > 1 ? 's' : ''}
                                  </span>
                                  <button
                                    onClick={() => setActiveTab('negotiations')}
                                    className="text-[11px] underline font-bold hover:text-white"
                                  >
                                    Review Bids →
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-4 border-t border-color bg-surface/40 flex items-center justify-between text-xs">
                            <select
                              value={listing.status}
                              onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                              className="bg-slate-900 text-xs border border-slate-700 rounded px-2 py-1 text-slate-200"
                            >
                              <option value="Published">Active</option>
                              <option value="Under Negotiation">Under Offer</option>
                              <option value="Sold">Sold</option>
                            </select>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteListing(listing.id || listing._id);
                              }}
                              className="p-1.5 text-muted hover:text-red-400 transition-colors"
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

            {/* TAB 2: BUYER NEGOTIATIONS */}
            {activeTab === 'negotiations' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-color flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-main">Buyer Inquiries on Contractor Timber</h2>
                    <p className="text-xs text-muted">
                      Sawmills and commercial buyers offering rates on your log stocks.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface border border-color text-main">
                    {myNegotiations.length} Negotiations
                  </span>
                </div>

                {myNegotiations.length === 0 ? (
                  <div className="card p-12 text-center rounded-xl border border-color bg-card">
                    <MessageSquare size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Buyer Offers on Contractor Timber</h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Incoming price negotiations and volume inquiries from buyers will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myNegotiations.map((neg) => {
                      const isPending = neg.status === 'Pending Review';
                      const isCounter = neg.status === 'Counter-Offer';
                      const isAccepted = neg.status === 'Accepted';

                      return (
                        <div
                          key={neg.id}
                          className="card p-5 rounded-xl border border-color bg-card space-y-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-color">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-blue-400">{neg.timberSpecies}</span>
                                <span className="text-muted text-xs">•</span>
                                <span className="text-xs text-muted font-mono">{neg.id}</span>
                              </div>
                              <h3 className="text-base font-bold text-main">{neg.timberTitle}</h3>
                              <p className="text-xs text-muted mt-0.5">
                                Buyer: <strong className="text-white">{neg.buyerName}</strong> ({neg.buyerCompany})
                              </p>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              {neg.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-surface border border-color text-xs">
                            <div>
                              <span className="text-muted block">Asking Rate:</span>
                              <span className="font-semibold text-slate-300 font-mono">
                                ₹ {Number(neg.originalPricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block">Buyer's Offer:</span>
                              <span className="font-extrabold text-emerald font-mono text-sm">
                                ₹ {Number(neg.offeredPricePerM3).toLocaleString('en-IN')} / m³
                              </span>
                            </div>
                            <div>
                              <span className="text-muted block">Volume:</span>
                              <span className="font-bold text-white font-mono">{neg.requestedVolume} m³</span>
                            </div>
                            <div>
                              <span className="text-muted block">Total Value:</span>
                              <span className="font-extrabold text-gold font-mono text-sm">
                                ₹ {Number(neg.totalOffered).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-muted space-y-1.5">
                            <div><strong className="text-slate-300">Delivery Preference:</strong> {neg.deliveryPreference}</div>
                            <div><strong className="text-slate-300">Payment Terms:</strong> {neg.paymentTerms}</div>
                            {neg.notes && (
                              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-200 italic">
                                "{neg.notes}"
                              </div>
                            )}
                          </div>

                          {(isPending || isCounter) && (
                            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-color">
                              <button
                                onClick={() => handleRejectOffer(neg)}
                                className="btn btn-secondary btn-sm text-red-400 hover:text-red-300"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => openCounterModal(neg)}
                                className="btn btn-secondary btn-sm flex items-center gap-1.5"
                              >
                                <RotateCcw size={14} /> Counter-Offer
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

            {/* TAB 3: DISPATCH ORDERS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-color">
                  <h2 className="text-base font-bold text-main">Hauling Dispatch Orders & Fulfillment</h2>
                  <p className="text-xs text-muted">Confirmed timber shipments to buyer sawmill yards.</p>
                </div>

                {myOrders.length === 0 ? (
                  <div className="card p-12 text-center rounded-xl border border-color bg-card">
                    <Truck size={48} className="mx-auto text-muted mb-3" />
                    <h3 className="text-lg font-bold text-main mb-1">No Orders Yet</h3>
                    <p className="text-xs text-muted max-w-md mx-auto">
                      Confirmed contractor sales and log hauling orders will be tracked here.
                    </p>
                  </div>
                ) : (
                  <div className="table-wrapper card p-0 overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Timber Item</th>
                          <th>Buyer Mill</th>
                          <th>Volume</th>
                          <th>Value</th>
                          <th>Freight Transit</th>
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
                              <span className="status-chip status-chip-active text-xs">{ord.status}</span>
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

            {/* TAB 4: ALL MARKETPLACE LISTINGS */}
            {activeTab === 'all_listings' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-card border border-color flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-main">Statewide Timber Market Exchange</h2>
                    <p className="text-xs text-muted">All active listings from landowners and contractors across Kerala.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface border border-color text-main">
                    {listings.length} Lots
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
                      <RotateCcw size={18} className="text-emerald" /> Contractor Counter-Proposal
                    </h3>
                    <button onClick={() => setCounterModalOpen(false)} className="text-muted hover:text-white">
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={submitCounterOffer} className="space-y-4">
                    <div className="p-3 bg-surface rounded-lg border border-color text-xs space-y-1">
                      <div className="text-muted">Timber Lot: <strong className="text-white">{selectedNegotiation.timberTitle}</strong></div>
                      <div className="text-muted">Buyer Bid: <strong className="text-amber-400">₹ {Number(selectedNegotiation.offeredPricePerM3).toLocaleString('en-IN')}/m³</strong></div>
                      <div className="text-muted">Volume: <strong className="text-white">{selectedNegotiation.requestedVolume} m³</strong></div>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Your Counter Rate (₹ per m³):</label>
                      <input
                        type="number"
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        placeholder="e.g. 12500"
                        className="form-input text-base font-bold font-mono text-emerald"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label text-xs">Haulage & Logistics Terms for Buyer:</label>
                      <textarea
                        rows="3"
                        value={counterMessage}
                        onChange={(e) => setCounterMessage(e.target.value)}
                        className="form-input text-xs"
                        placeholder="State fleet delivery availability, weighbridge terms..."
                      ></textarea>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3">
                      <button type="button" onClick={() => setCounterModalOpen(false)} className="btn btn-secondary btn-sm">
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
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

export default ContractorTimberMarketplacePage;
