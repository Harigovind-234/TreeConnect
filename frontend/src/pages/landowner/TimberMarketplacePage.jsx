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
  Phone,
  Sparkles,
  Info,
  FileCheck
} from 'lucide-react';
import { calculateCounterTarget, MARKET_BENCHMARK_RANGES } from '../../utils/counterTargetCalculator';

const formatInspectionDate = (dateStr) => {
  if (!dateStr) return 'Date Pending';
  try {
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

const formatInspectionTimeSlot = (slotStr) => {
  if (!slotStr) return 'Flexible Timing';
  let cleaned = String(slotStr).trim();
  cleaned = cleaned.replace(/^\((.*)\)$/, '$1').trim();
  cleaned = cleaned.replace(/\s*\((.*?)\)/, ' • $1');
  return cleaned;
};

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
  const [counterAdjustmentReason, setCounterAdjustmentReason] = useState('Verified high-density heartwood girth and debarked prime export standard.');
  const [customReasonText, setCustomReasonText] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  // Reschedule date modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedRescheduleNeg, setSelectedRescheduleNeg] = useState(null);
  const [newProposedDate, setNewProposedDate] = useState('');
  const [newProposedTimeSlot, setNewProposedTimeSlot] = useState('Morning (09:00 AM - 12:00 PM)');
  const [rescheduleReason, setRescheduleReason] = useState('Landowner requested alternate timing for on-site availability.');

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

  // Collect valid listing IDs for this landowner
  const myListingsIdSet = new Set();
  myListings.forEach(l => {
    if (l.id) myListingsIdSet.add(String(l.id).trim());
    if (l._id) myListingsIdSet.add(String(l._id).trim());
    if (l.harvestOperationId) myListingsIdSet.add(String(l.harvestOperationId).trim());
    if (l.treeInventoryId) myListingsIdSet.add(String(l.treeInventoryId).trim());
  });

  // Filter negotiations on listings owned by this landowner (must match an active listing)
  const myNegotiations = negotiations.filter(n => {
    if (!n) return false;
    const nListingId = String(n.listingId || '').trim();
    if (!nListingId || !myListingsIdSet.has(nListingId)) return false;
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
  const pendingNegotiations = myNegotiations.filter(n =>
    n.status === 'Pending Review' ||
    n.status === 'Counter-Offer' ||
    n.status === 'Inspection Requested'
  );

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

      // Optimistically remove from state immediately for instant feedback
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

  const handleApproveInspection = async (neg) => {
    try {
      await marketplaceService.approveInspectionDate(neg.id, user);
      showToast(`Site inspection visit on ${neg.surveyVisitDate || 'the requested date'} approved! Buyer notified.`);
      loadData();
    } catch (err) {
      console.error('Error approving inspection:', err);
      alert('Failed to approve inspection date');
    }
  };

  const handleOpenRescheduleModal = (neg) => {
    setSelectedRescheduleNeg(neg);
    setNewProposedDate(neg.surveyVisitDate || new Date().toISOString().split('T')[0]);
    setNewProposedTimeSlot(neg.surveyTimeSlot || 'Morning (09:00 AM - 12:00 PM)');
    setRescheduleReason('Landowner requested alternate timing for on-site availability.');
    setRescheduleModalOpen(true);
  };

  const handleSubmitReschedule = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedRescheduleNeg) return;
    try {
      await marketplaceService.suggestAlternativeDate(selectedRescheduleNeg.id, {
        newDate: newProposedDate,
        newTimeSlot: newProposedTimeSlot,
        reason: rescheduleReason
      }, user);
      setRescheduleModalOpen(false);
      showToast(`Alternative date (${newProposedDate}) suggested to ${selectedRescheduleNeg.buyerName}!`);
      loadData();
    } catch (err) {
      console.error('Error suggesting alternative date:', err);
      alert('Failed to submit reschedule proposal');
    }
  };

  const handleAcceptOffer = async (neg) => {
    try {
      await marketplaceService.acceptOfferAndCreateOrder(neg.id, user);
      showToast(`Accepted offer from ${neg.buyerName}! Official purchase contract generated.`);
      loadData();
    } catch (err) {
      console.error('Error accepting offer:', err);
      showToast(`Accepted offer from ${neg.buyerName}!`);
      loadData();
    }
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
    const reqVol = Number(neg.requestedVolume) || 1.70;
    const resolvedAskingRate = Number(neg.originalPricePerM3) || (neg.askingPrice ? Math.round(Number(neg.askingPrice) / reqVol) : 147647);
    const resolvedBuyerRate = Number(neg.offeredPricePerM3) || (neg.buyerOfferPrice ? Math.round(Number(neg.buyerOfferPrice) / reqVol) : Math.round(resolvedAskingRate * 0.94));

    const targetCalc = calculateCounterTarget({
      verifiedVolume: reqVol,
      species: neg.timberSpecies || 'Teakwood',
      gradeQuality: neg.gradeQuality || 'Grade A Prime Export',
      askingPricePerM3: resolvedAskingRate,
      buyerOfferPerM3: resolvedBuyerRate,
      deliveryPreference: neg.deliveryPreference || 'Seller Contractor Hauling to Mill',
      harvestContractSettled: true,
      harvestContractAmount: 110000
    });

    const initialCounter = targetCalc.suggestedCounterRate;
    setCounterPrice(initialCounter);
    setCounterAdjustmentReason('Verified high-density heartwood girth and debarked prime export standard.');
    setCustomReasonText('');
    setCounterMessage(`We propose a data-informed counter target of ₹${initialCounter.toLocaleString('en-IN')}/m³ based on verified scaling measurements (${targetCalc.verifiedVolume} m³) and certified timber grade. Transit pass and yard loading ready.`);
    setCounterModalOpen(true);
  };

  const submitCounterOffer = (e) => {
    e.preventDefault();
    if (!selectedNegotiation || !counterPrice) return;

    const rateNum = Number(counterPrice);
    if (isNaN(rateNum) || rateNum <= 0) {
      alert('Please enter a valid positive counter-target rate per cubic metre.');
      return;
    }

    const effectiveReason = counterAdjustmentReason === 'Custom justification...'
      ? (customReasonText.trim() || 'Seller customized commercial terms.')
      : counterAdjustmentReason;

    const selVol = Number(selectedNegotiation.requestedVolume) || 1.70;
    const selAskingRate = Number(selectedNegotiation.originalPricePerM3) || (selectedNegotiation.askingPrice ? Math.round(Number(selectedNegotiation.askingPrice) / selVol) : 147647);
    const selBuyerRate = Number(selectedNegotiation.offeredPricePerM3) || (selectedNegotiation.buyerOfferPrice ? Math.round(Number(selectedNegotiation.buyerOfferPrice) / selVol) : Math.round(selAskingRate * 0.94));

    const targetCalc = calculateCounterTarget({
      verifiedVolume: selVol,
      species: selectedNegotiation.timberSpecies || 'Teakwood',
      gradeQuality: selectedNegotiation.gradeQuality || 'Grade A Prime Export',
      askingPricePerM3: selAskingRate,
      buyerOfferPerM3: selBuyerRate,
      deliveryPreference: selectedNegotiation.deliveryPreference || 'Seller Contractor Hauling to Mill',
      harvestContractSettled: true,
      harvestContractAmount: 110000,
      customCounterPrice: rateNum
    });

    marketplaceService.respondToNegotiation(selectedNegotiation.id, 'counter', {
      sender: 'Landowner',
      senderName: user?.name || selectedNegotiation.sellerName,
      pricePerM3: rateNum,
      counterTarget: rateNum,
      suggestedTarget: targetCalc.suggestedCounterRate,
      adjustmentReason: effectiveReason,
      message: counterMessage
    });

    setCounterModalOpen(false);
    showToast(`Counter-target of ₹${rateNum.toLocaleString('en-IN')}/m³ submitted to ${selectedNegotiation.buyerName}!`);
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
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteListing(listing.id || listing._id);
                              }}
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
                      const isInspectionRequested = neg.status === 'Inspection Requested';
                      const isInspectionScheduled = neg.status === 'Inspection Scheduled';
                      const isDateRescheduled = neg.status === 'Date Rescheduled by Landowner';
                      const isPending = neg.status === 'Pending Review' || neg.status === 'Survey Completed & Offer Submitted';
                      const isCounter = neg.status === 'Counter-Offer';
                      const isAccepted = neg.status === 'Accepted';
                      const isPaid = neg.status === 'Payment Completed' || neg.paymentStatus === 'PAID';
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
                                  isPaid
                                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                                    : isAccepted
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                                    : isRejected
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                    : isCounter
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                                    : isDateRescheduled
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                    : isInspectionScheduled
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                                }`}
                              >
                                {(isPending || isInspectionRequested) && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
                                {isInspectionRequested ? 'Site Inspection Requested' : isInspectionScheduled ? 'Inspection Scheduled' : isDateRescheduled ? 'Rescheduled Date Sent' : isPaid ? 'Payment Confirmed' : isCounter ? 'Counter-Offer Active' : neg.status}
                              </span>
                            </div>
                          </div>

                          {/* Phase Alert & Notice Banner */}
                          {isInspectionRequested && (
                            <div className="tc-irb-card amber">
                              <div className="tc-irb-header">
                                <div className="tc-irb-icon-box">
                                  <Calendar size={18} />
                                </div>
                                <div className="tc-irb-heading-group">
                                  <div className="tc-irb-title-row">
                                    <h4 className="tc-irb-title">Action Required: On-Site Timber Inspection Requested</h4>
                                    <span className="tc-irb-badge">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                      Awaiting Approval
                                    </span>
                                  </div>
                                  <p className="tc-irb-desc">
                                    The buyer requested an on-site visit to inspect log girth, heartwood quality, and Forest Dept transit clearance before submitting their commercial offer.
                                  </p>
                                </div>
                              </div>

                              {/* Prominently Highlighted Timing Showcase */}
                              <div className="tc-irb-timing-card">
                                <div className="tc-irb-timing-items">
                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <Calendar size={13} /> Requested Visit Date
                                    </span>
                                    <span className="tc-irb-timing-date-val">
                                      {formatInspectionDate(neg.surveyVisitDate)}
                                    </span>
                                  </div>

                                  <div className="tc-irb-timing-divider"></div>

                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <Clock size={13} /> Time Window
                                    </span>
                                    <span className="tc-irb-timing-slot-val">
                                      {formatInspectionTimeSlot(neg.surveyTimeSlot)}
                                    </span>
                                  </div>

                                  <div className="tc-irb-timing-divider"></div>

                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <MapPin size={13} /> Inspection Venue
                                    </span>
                                    <span className="text-white font-medium text-xs">
                                      Seller Log Yard / Estate
                                    </span>
                                  </div>
                                </div>

                                <div className="tc-irb-timing-meta">
                                  <span className="text-amber-400/90 font-medium">Please approve or reschedule below</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {isDateRescheduled && (
                            <div className="tc-irb-card purple">
                              <div className="tc-irb-header">
                                <div className="tc-irb-icon-box">
                                  <Clock size={18} />
                                </div>
                                <div className="tc-irb-heading-group">
                                  <div className="tc-irb-title-row">
                                    <h4 className="tc-irb-title">Alternative Inspection Date Proposed to Buyer</h4>
                                    <span className="tc-irb-badge">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                                      Awaiting Confirmation
                                    </span>
                                  </div>
                                  <p className="tc-irb-desc">
                                    You proposed an alternative inspection schedule. Reason: <em className="text-purple-200">"{neg.rescheduleReason || 'Yard availability'}"</em>. Waiting for buyer confirmation.
                                  </p>
                                </div>
                              </div>

                              {/* Prominently Highlighted Timing Showcase */}
                              <div className="tc-irb-timing-card">
                                <div className="tc-irb-timing-items">
                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <Calendar size={13} /> Your Proposed Date
                                    </span>
                                    <span className="tc-irb-timing-date-val">
                                      {formatInspectionDate(neg.suggestedDate)}
                                    </span>
                                  </div>

                                  <div className="tc-irb-timing-divider"></div>

                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <Clock size={13} /> Proposed Slot
                                    </span>
                                    <span className="tc-irb-timing-slot-val">
                                      {formatInspectionTimeSlot(neg.suggestedTimeSlot)}
                                    </span>
                                  </div>

                                  <div className="tc-irb-timing-divider"></div>

                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <MapPin size={13} /> Venue
                                    </span>
                                    <span className="text-white font-medium text-xs">
                                      Seller Log Yard
                                    </span>
                                  </div>
                                </div>

                                <div className="tc-irb-timing-meta">
                                  <span className="text-purple-300 font-medium">Sent to Buyer</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {isInspectionScheduled && (
                            <div className="tc-irb-card emerald">
                              <div className="tc-irb-header">
                                <div className="tc-irb-icon-box">
                                  <CheckCircle2 size={18} />
                                </div>
                                <div className="tc-irb-heading-group">
                                  <div className="tc-irb-title-row">
                                    <h4 className="tc-irb-title">Site Inspection Confirmed</h4>
                                    <span className="tc-irb-badge">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                      Confirmed Visit
                                    </span>
                                  </div>
                                  <p className="tc-irb-desc">
                                    Log yard prepared for buyer inspection. Once the buyer completes their physical inspection, they will record official survey measurements & submit their price offer.
                                  </p>
                                </div>
                              </div>

                              {/* Prominently Highlighted Timing Showcase */}
                              <div className="tc-irb-timing-card">
                                <div className="tc-irb-timing-items">
                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <Calendar size={13} /> Confirmed Visit Date
                                    </span>
                                    <span className="tc-irb-timing-date-val">
                                      {formatInspectionDate(neg.surveyVisitDate)}
                                    </span>
                                  </div>

                                  <div className="tc-irb-timing-divider"></div>

                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <Clock size={13} /> Inspection Slot
                                    </span>
                                    <span className="tc-irb-timing-slot-val">
                                      {formatInspectionTimeSlot(neg.surveyTimeSlot)}
                                    </span>
                                  </div>

                                  <div className="tc-irb-timing-divider"></div>

                                  <div className="tc-irb-timing-cell">
                                    <span className="tc-irb-timing-kicker">
                                      <MapPin size={13} /> Venue
                                    </span>
                                    <span className="text-white font-medium text-xs">
                                      Seller Log Yard
                                    </span>
                                  </div>
                                </div>

                                <div className="tc-irb-timing-meta">
                                  <span className="text-emerald-400 font-medium">✓ Yard Ready</span>
                                </div>
                              </div>
                            </div>
                          )}

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
                              <span className="tc-neg-metric-label text-emerald-400">
                                {isInspectionRequested || isInspectionScheduled ? 'INSPECTION TIMING' : "BUYER'S OFFERED RATE"}
                              </span>
                              <div className="tc-neg-metric-val text-emerald-400">
                                {isInspectionRequested || isInspectionScheduled ? (
                                  <span className="text-sm font-semibold tracking-wide" style={{ color: '#ffffff' }}>
                                    {formatInspectionDate(neg.surveyVisitDate)}
                                  </span>
                                ) : (
                                  <>₹ {Number(neg.offeredPricePerM3).toLocaleString('en-IN')} <span className="text-xs font-normal text-emerald-300">/ m³</span></>
                                )}
                              </div>
                              <span className="tc-neg-metric-sub text-emerald-300 font-medium truncate">
                                {isInspectionRequested || isInspectionScheduled ? formatInspectionTimeSlot(neg.surveyTimeSlot) : 'Proposed Bid'}
                              </span>
                            </div>

                            <div className="tc-neg-metric-box">
                              <span className="tc-neg-metric-label">PARCEL VOLUME</span>
                              <div className="tc-neg-metric-val text-white">
                                {neg.verifiedVolume || neg.requestedVolume} <span className="text-xs font-normal text-slate-300">m³</span>
                              </div>
                              <span className="tc-neg-metric-sub truncate">{neg.deliveryPreference || 'Truck Pickup'}</span>
                            </div>

                            <div className="tc-neg-metric-box tc-neg-metric-box-highlight">
                              <span className="tc-neg-metric-label text-amber-300">
                                {isInspectionRequested || isInspectionScheduled ? 'INSPECTION STATUS' : 'TOTAL DEAL OFFER'}
                              </span>
                              <div className="tc-neg-metric-val text-gold">
                                {isInspectionRequested || isInspectionScheduled ? (
                                  <span className="text-sm text-amber-300">{isInspectionScheduled ? 'Date Confirmed' : 'Date Pending'}</span>
                                ) : (
                                  `₹ ${Number(neg.totalOffered).toLocaleString('en-IN')}`
                                )}
                              </div>
                              <span className="tc-neg-metric-sub text-amber-300/80">
                                {isInspectionRequested || isInspectionScheduled ? 'Pending Site Visit' : 'Escrow Secured'}
                              </span>
                            </div>
                          </div>

                          {/* Recorded On-Site Timber Survey Findings (if completed) */}
                          {neg.surveyDetails && (
                            <div className="tc-neg-findings-card">
                              <div className="tc-neg-findings-header">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="tc-neg-findings-title">
                                    <FileCheck size={16} className="text-emerald-400" /> Verified On-Site Survey Findings
                                  </span>
                                  <span className="tc-neg-findings-badge">
                                    <CheckCircle2 size={11} className="text-emerald-400" /> Buyer Field Certified
                                  </span>
                                </div>
                                <div className="tc-neg-findings-date">
                                  <Calendar size={12} className="text-emerald-400" />
                                  <span>Surveyed on: <strong className="text-white font-semibold">{formatInspectionDate(neg.surveyDetails.surveyDate || neg.surveyVisitDate)}</strong></span>
                                </div>
                              </div>

                              <div className="tc-neg-findings-grid">
                                <div className="tc-neg-findings-cell">
                                  <span className="tc-neg-findings-cell-label">VERIFIED VOLUME</span>
                                  <div className="tc-neg-findings-cell-value font-mono">
                                    {neg.surveyDetails.verifiedVolume} m³
                                  </div>
                                  <span className="tc-neg-findings-cell-sub">Quarter-Girth Scale</span>
                                </div>

                                <div className="tc-neg-findings-cell">
                                  <span className="tc-neg-findings-cell-label">OBSERVED GRADE</span>
                                  <div className="tc-neg-findings-cell-value text-emerald-300 truncate" title={neg.surveyDetails.observedGrade}>
                                    {neg.surveyDetails.observedGrade ? neg.surveyDetails.observedGrade.split('(')[0].trim() : 'Grade A Prime Export'}
                                  </div>
                                  <span className="tc-neg-findings-cell-sub truncate">
                                    {neg.surveyDetails.observedGrade?.includes('(')
                                      ? neg.surveyDetails.observedGrade.match(/\((.*?)\)/)?.[1]
                                      : 'Clear Boles, Export Quality'}
                                  </span>
                                </div>

                                <div className="tc-neg-findings-cell">
                                  <span className="tc-neg-findings-cell-label">DEBARKED LOGS</span>
                                  <div className="tc-neg-findings-cell-value">
                                    {neg.surveyDetails.logCount} Individual Logs
                                  </div>
                                  <span className="tc-neg-findings-cell-sub">Measured & Stenciled</span>
                                </div>

                                <div className="tc-neg-findings-cell">
                                  <span className="tc-neg-findings-cell-label">TRANSIT PERMIT</span>
                                  <div className="tc-neg-findings-cell-value text-emerald-300 flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-emerald-400 flex-shrink-0" /> Hammer Verified
                                  </div>
                                  <span className="tc-neg-findings-cell-sub">Forest Dept Cleared</span>
                                </div>
                              </div>

                              {neg.surveyDetails.heartwoodQuality && (
                                <div className="tc-neg-findings-note">
                                  <Sparkles size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 leading-snug">
                                    <span className="text-emerald-300 font-bold uppercase tracking-wider text-[10px] mr-2">
                                      Heartwood Assessment:
                                    </span>
                                    <span className="text-slate-200 text-xs font-medium">
                                      {neg.surveyDetails.heartwoodQuality}
                                    </span>
                                  </div>
                                  {neg.surveyDetails.surveyorName && (
                                    <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                      Surveyor: {neg.surveyDetails.surveyorName}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Proposed Timber Survey Visit Card */}
                          {neg.surveyVisitDate && (
                            <div className="tc-neg-survey-card">
                              <div className="tc-neg-survey-top">
                                <span className="tc-neg-survey-tag">
                                  <Calendar size={13} className="text-emerald-400" /> On-Site Timber Survey & Inspection
                                </span>
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Truck size={12} className="text-blue-400" /> {neg.deliveryPreference}
                                </span>
                              </div>

                              <div className="tc-neg-survey-detail flex items-center gap-2 flex-wrap">
                                <span className="text-slate-300 text-xs font-medium">Inspection Timing:</span>
                                <span
                                  className="font-mono font-semibold px-2.5 py-1 rounded-md text-xs shadow-sm flex items-center gap-1.5"
                                  style={{ color: '#ffffff', backgroundColor: '#062d1d', border: '1px solid #10b981' }}
                                >
                                  <Calendar size={12} className="text-emerald-400" />
                                  {formatInspectionDate(neg.surveyVisitDate)}
                                </span>
                                {neg.surveyTimeSlot && (
                                  <span
                                    className="font-medium px-2.5 py-1 rounded-md text-xs shadow-sm flex items-center gap-1.5"
                                    style={{ color: '#6ee7b7', backgroundColor: 'rgba(6, 45, 29, 0.7)', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                                  >
                                    <Clock size={12} className="text-emerald-400" />
                                    {formatInspectionTimeSlot(neg.surveyTimeSlot)}
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
                          )}

                          {/* Counter offer proposal details */}
                          {neg.counterOffer && (
                            <div className="tc-neg-counter-proposal-card">
                              <div className="tc-neg-counter-proposal-header">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="tc-neg-counter-proposal-title">
                                    <RotateCcw size={16} className="text-emerald-400" /> Current Counter-Rate:
                                  </span>
                                  <span className="tc-neg-counter-proposal-badge">
                                    Negotiated Rate
                                  </span>
                                </div>
                                <div className="tc-neg-counter-proposal-rate">
                                  <span>₹ {Number(neg.counterOffer.pricePerM3).toLocaleString('en-IN')}</span>
                                  <span className="tc-neg-counter-proposal-rate-unit">/ m³</span>
                                </div>
                              </div>

                              {neg.counterOffer.adjustmentReason && (
                                <div className="tc-neg-counter-justification">
                                  <ShieldCheck size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-emerald-300 uppercase tracking-wider text-[10.5px] mr-1.5 font-bold">
                                      Commercial Justification:
                                    </strong>
                                    <span className="text-slate-200">{neg.counterOffer.adjustmentReason}</span>
                                  </div>
                                </div>
                              )}

                              {neg.counterOffer.message && (
                                <div className="tc-neg-counter-message">
                                  "{neg.counterOffer.message}"
                                </div>
                              )}

                              <div className="tc-neg-counter-footer">
                                <span className="tc-neg-counter-gross">
                                  Gross Proposed Deal Value:{' '}
                                  <strong className="text-gold font-mono font-bold text-sm">
                                    ₹ {(Number(neg.counterOffer.pricePerM3) * Number(neg.requestedVolume || neg.verifiedVolume || 1.7)).toLocaleString('en-IN')}
                                  </strong>{' '}
                                  <span className="text-slate-400 text-[11px]">for {neg.requestedVolume || neg.verifiedVolume || 1.7} m³</span>
                                </span>
                                <span className="tc-neg-counter-settlement">
                                  <CheckCircle2 size={13} className="text-emerald-400" /> Direct Timber Settlement
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons for Landowner */}
                          {isInspectionRequested && (
                            <div className="tc-neg-actions-row">
                              <button
                                onClick={() => handleRejectOffer(neg)}
                                className="tc-neg-btn-decline"
                              >
                                Decline Request
                              </button>

                              <div className="flex items-center gap-2.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRescheduleModal(neg)}
                                  className="tc-neg-btn-counter bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                                >
                                  <Calendar size={14} /> Suggest Another Date
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveInspection(neg)}
                                  className="tc-neg-btn-accept"
                                >
                                  <Check size={15} /> Approve Inspection Date
                                </button>
                              </div>
                            </div>
                          )}

                          {(isPending || isCounter) && (
                            <div className="tc-neg-actions-row">
                              <button
                                onClick={() => handleRejectOffer(neg)}
                                className="tc-neg-btn-decline"
                              >
                                Decline Offer
                              </button>

                              <div className="flex items-center gap-2.5 flex-wrap">
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
                                  <Check size={15} /> Accept Offer & Finalize Contract
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

            {/* ========================================================= */}
            {/* COUNTER-TARGET & PROPOSAL FORMULATION MODAL */}
            {/* ========================================================= */}
            {counterModalOpen && selectedNegotiation && (() => {
              const reqVolume = Number(selectedNegotiation.requestedVolume || 1.70);
              const askingRate = Number(selectedNegotiation.originalPricePerM3 || selectedNegotiation.pricePerM3 || (selectedNegotiation.askingPrice ? Math.round(Number(selectedNegotiation.askingPrice) / reqVolume) : 147647));
              const buyerBidRate = Number(selectedNegotiation.offeredPricePerM3 || (selectedNegotiation.buyerOfferPrice ? Math.round(Number(selectedNegotiation.buyerOfferPrice) / reqVolume) : Math.round(askingRate * 0.94)));
              const numericCounter = Number(counterPrice) || 0;

              const targetCalc = calculateCounterTarget({
                verifiedVolume: reqVolume,
                species: selectedNegotiation.timberSpecies || 'Teakwood',
                gradeQuality: selectedNegotiation.gradeQuality || 'Grade A Prime Export',
                askingPricePerM3: askingRate,
                buyerOfferPerM3: buyerBidRate,
                deliveryPreference: selectedNegotiation.deliveryPreference || 'Seller Contractor Hauling to Mill',
                harvestContractSettled: true,
                harvestContractAmount: 110000,
                customCounterPrice: numericCounter > 0 ? numericCounter : null
              });

              const suggestedRate = targetCalc.suggestedCounterRate;
              const grossDealValue = targetCalc.grossDealValue;
              const gainVsBid = numericCounter > buyerBidRate 
                ? (numericCounter - buyerBidRate) * reqVolume 
                : 0;

              return (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] flex items-center justify-center p-3 sm:p-5 animate-fade-in">
                  <div className="tc-counter-modal-card my-auto">
                    {/* Sticky Modal Header */}
                    <div className="tc-counter-header">
                      <div className="tc-counter-title-group">
                        <div className="tc-counter-icon-wrap">
                          <RotateCcw size={18} />
                        </div>
                        <div>
                          <h3 className="tc-counter-title flex items-center gap-2">
                            <span>Formulate Counter Target</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Data-Informed
                            </span>
                          </h3>
                          <div className="tc-counter-lot-badge">
                            Lot: <span className="text-emerald-300 font-semibold">{selectedNegotiation.timberTitle}</span> • Buyer: <strong className="text-white">{selectedNegotiation.buyerName}</strong>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCounterModalOpen(false)}
                        className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close modal"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Scrollable Form Body */}
                    {/* Scrollable Form Body */}
                    <form onSubmit={submitCounterOffer} className="flex-1 flex flex-col overflow-hidden">
                      <div className="tc-counter-body">
                        
                        {/* 1. TARGET FORMULATION MODEL CARD */}
                        <div className="tc-counter-target-engine-box">
                          <div className="tc-counter-target-header">
                            <span className="tc-counter-target-badge">
                              <Sparkles size={12} /> Target Formulation Model
                            </span>
                            <span className="text-[11px] text-slate-300">
                              Suggested Target: <strong className="text-emerald-300 font-mono text-xs">₹ {suggestedRate.toLocaleString('en-IN')}/m³</strong>
                            </span>
                          </div>

                          <div className="tc-counter-target-factors-grid">
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Verified Vol</span>
                              <span className="tc-counter-factor-val text-emerald-300">{reqVolume} m³</span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Timber Grade</span>
                              <span className="tc-counter-factor-val truncate">{targetCalc.gradeQuality}</span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Market Range</span>
                              <span className="tc-counter-factor-val font-mono">₹{Math.round(targetCalc.benchmarkRange.min / 1000)}k–{Math.round(targetCalc.benchmarkRange.max / 1000)}k</span>
                            </div>
                            <div className="tc-counter-factor-pill">
                              <span className="tc-counter-factor-label">Transport</span>
                              <span className="tc-counter-factor-val truncate">{selectedNegotiation.deliveryPreference ? 'Seller Hauling' : 'Yard Pickup'}</span>
                            </div>
                          </div>

                          <div className="tc-counter-settlement-notice">
                            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                            <span><strong>Contract Settled:</strong> ₹1,10,000 harvesting cost is 100% cleared. Zero deductions applied to this timber revenue.</span>
                          </div>
                        </div>

                        {/* 2. 3-WAY RATE COMPARISON CARDS */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                          {/* Buyer Bid Card */}
                          <div className="tc-counter-compare-card bid">
                            <span className="tc-counter-pill amber">Buyer Bid</span>
                            <div className="tc-counter-compare-rate text-amber-300">
                              ₹ {buyerBidRate.toLocaleString('en-IN')}
                            </div>
                            <div className="tc-counter-compare-sub">
                              Total ₹ {(buyerBidRate * reqVolume).toLocaleString('en-IN')}
                            </div>
                          </div>

                          {/* Suggested Counter Target */}
                          <div className="tc-counter-compare-card bg-emerald-950/40 border border-emerald-500/40">
                            <span className="tc-counter-pill emerald">Suggested Target</span>
                            <div className="tc-counter-compare-rate text-emerald-300">
                              ₹ {suggestedRate.toLocaleString('en-IN')}
                            </div>
                            <div className="tc-counter-compare-sub">
                              Total ₹ {(suggestedRate * reqVolume).toLocaleString('en-IN')}
                            </div>
                          </div>

                          {/* Catalogue Rate Card */}
                          <div className="tc-counter-compare-card asking">
                            <span className="tc-counter-pill emerald">Catalogue Rate</span>
                            <div className="tc-counter-compare-rate text-slate-200">
                              ₹ {askingRate.toLocaleString('en-IN')}
                            </div>
                            <div className="tc-counter-compare-sub">
                              Total ₹ {(askingRate * reqVolume).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* 3. COUNTER-TARGET RATE & QUICK BENCHMARKS */}
                        <div className="tc-counter-section-card">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-200">
                              Counter-Target Rate (₹ per m³):
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
                              placeholder={String(suggestedRate)}
                              className="tc-counter-input-field"
                              min="1000"
                              step="50"
                              required
                            />
                            <span className="tc-counter-input-suffix">/ m³</span>
                          </div>

                          {/* Quick Benchmarks Buttons */}
                          {(() => {
                            const isSuggestedActive = Number(counterPrice) === Number(suggestedRate);
                            const isAskingActive = Number(counterPrice) === Number(askingRate);

                            return (
                              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                                <span className="text-xs text-slate-400 font-semibold mr-1">
                                  Quick Benchmarks:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCounterPrice(suggestedRate);
                                    setCounterAdjustmentReason('Verified high-density heartwood girth and debarked prime export standard.');
                                    setCounterMessage(`We propose a data-informed counter target of ₹${suggestedRate.toLocaleString('en-IN')}/m³ based on verified scaling measurements (${reqVolume} m³) and certified timber grade. Transit pass and yard loading ready.`);
                                  }}
                                  className={`tc-counter-preset-btn suggested ${isSuggestedActive ? 'active' : ''}`}
                                >
                                  <Sparkles size={13} className={isSuggestedActive ? 'text-slate-950' : 'text-emerald-400'} />
                                  <span>Suggested Target (₹ {suggestedRate.toLocaleString('en-IN')})</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCounterPrice(askingRate);
                                    setCounterAdjustmentReason('Verified high-density heartwood girth and debarked prime export standard.');
                                    setCounterMessage(`We hold our catalogue rate of ₹${askingRate.toLocaleString('en-IN')}/m³ with immediate yard loading.`);
                                  }}
                                  className={`tc-counter-preset-btn asking ${isAskingActive ? 'active' : ''}`}
                                >
                                  <Tag size={13} className={isAskingActive ? 'text-white' : 'text-slate-300'} />
                                  <span>Hold Asking (₹ {askingRate.toLocaleString('en-IN')})</span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* 4. GUARDRAIL VALIDATION STATUS */}
                        <div className={`tc-counter-guardrail-banner ${targetCalc.validationStatus}`}>
                          {targetCalc.validationStatus === 'optimal' ? (
                            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                          ) : (
                            <AlertCircle size={16} className="shrink-0 text-amber-400" />
                          )}
                          <span>{targetCalc.validationMessage}</span>
                        </div>

                        {/* 5. GROSS TIMBER DEAL VALUE BANNER */}
                        <div className="tc-counter-summary-banner">
                          <span className="text-slate-300 text-xs sm:text-sm">
                            Gross Timber Deal Value: <strong className="text-emerald-300 font-mono text-sm sm:text-base ml-1">₹ {grossDealValue.toLocaleString('en-IN')}</strong>
                            <span className="text-[11px] text-slate-400 ml-1">({reqVolume} m³ × ₹{Number(counterPrice || suggestedRate).toLocaleString('en-IN')})</span>
                          </span>
                          {gainVsBid > 0 && (
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full shrink-0">
                              +₹ {gainVsBid.toLocaleString('en-IN')} vs buyer bid
                            </span>
                          )}
                        </div>

                        {/* 6. COMMERCIAL JUSTIFICATION & TARGET BASIS */}
                        <div className="tc-counter-section-card">
                          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-emerald-400" />
                              <span>Commercial Justification &amp; Target Basis:</span>
                            </span>
                          </label>
                          <select
                            value={counterAdjustmentReason}
                            onChange={(e) => {
                              setCounterAdjustmentReason(e.target.value);
                              if (e.target.value !== 'Custom justification...') {
                                setCounterMessage(`We propose a data-informed counter target of ₹${Number(counterPrice || suggestedRate).toLocaleString('en-IN')}/m³ based on: ${e.target.value}`);
                              }
                            }}
                            className="tc-counter-select"
                          >
                            <option value="Verified high-density heartwood girth and debarked prime export standard.">
                              Verified high-density heartwood girth & debarked export standard
                            </option>
                            <option value="Incorporates seller-arranged direct hauling and transit clearance to buyer mill.">
                              Seller-arranged direct hauling & transit clearance to buyer mill
                            </option>
                            <option value="Matched to recent Kerala timber auction transaction records for Grade A Teak.">
                              Matched to recent Kerala timber auction benchmark records
                            </option>
                            <option value="Fair compromise between catalogue asking price and buyer offer.">
                              Equitable compromise between catalogue asking price & buyer offer
                            </option>
                            <option value="Custom justification...">
                              Custom justification / commercial condition...
                            </option>
                          </select>

                          {counterAdjustmentReason === 'Custom justification...' && (
                            <input
                              type="text"
                              value={customReasonText}
                              onChange={(e) => setCustomReasonText(e.target.value)}
                              placeholder="Enter specific commercial justification..."
                              className="w-full p-2.5 rounded-xl bg-black/60 border border-emerald-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                              required
                            />
                          )}
                        </div>

                        {/* 7. MESSAGE & CONDITIONS FOR BUYER */}
                        <div className="tc-counter-section-card">
                          <label className="text-xs font-bold text-slate-200 block">
                            Message &amp; Conditions for Buyer:
                          </label>
                          <textarea
                            rows="3"
                            value={counterMessage}
                            onChange={(e) => setCounterMessage(e.target.value)}
                            className="tc-counter-textarea"
                            placeholder="Specify yard loading, transport, inspection timeline or payment conditions..."
                          />
                        </div>

                      </div>

                      {/* Sticky Modal Footer Actions */}
                      <div className="tc-counter-footer">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                          <span>Gross Valuation:</span>
                          <strong className="text-emerald-300 font-mono font-bold text-sm sm:text-base">
                            ₹ {Number((numericCounter || suggestedRate) * reqVolume).toLocaleString('en-IN')}
                          </strong>
                          <span className="text-[11px] text-slate-500">({reqVolume} m³)</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCounterModalOpen(false)}
                            className="tc-counter-btn-cancel"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="tc-counter-btn-submit"
                          >
                            <RotateCcw size={15} className="stroke-[2.5]" />
                            <span>Send Counter-Target (₹ {Number(counterPrice || suggestedRate).toLocaleString('en-IN')}/m³)</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })()}

            {/* SUGGEST ALTERNATIVE INSPECTION DATE MODAL */}
            {rescheduleModalOpen && selectedRescheduleNeg && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] overflow-y-auto p-4 sm:p-6 flex justify-center items-center">
                <div className="tc-negotiate-modal-box my-auto animate-scale-up max-w-lg w-full">
                  <div className="tc-modal-header flex items-center justify-between pb-3 border-b border-color">
                    <h3 className="tc-modal-title flex items-center gap-2 font-bold text-white">
                      <Calendar size={18} className="text-amber-400" /> Suggest Alternative Inspection Date
                    </h3>
                    <button
                      type="button"
                      onClick={() => setRescheduleModalOpen(false)}
                      className="tc-modal-close text-slate-400 hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReschedule} className="p-4 space-y-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1">
                      <span className="text-amber-300 font-bold block">
                        Reschedule for {selectedRescheduleNeg.buyerName} ({selectedRescheduleNeg.buyerCompany})
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Buyer originally requested: <strong className="text-white font-mono">{formatInspectionDate(selectedRescheduleNeg.surveyVisitDate)}</strong> • <span className="text-amber-200">{formatInspectionTimeSlot(selectedRescheduleNeg.surveyTimeSlot)}</span>. Select a date when your log yard and estate manager will be ready.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="tc-modal-form-group mb-0">
                        <label className="tc-modal-label flex items-center gap-1 font-semibold text-slate-200">
                          <Calendar size={12} className="text-emerald-400" /> New Suggested Date *
                        </label>
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={newProposedDate}
                          onChange={(e) => setNewProposedDate(e.target.value)}
                          className="tc-modal-input text-white font-medium w-full p-2.5 rounded-lg bg-surface border border-color"
                          required
                        />
                      </div>

                      <div className="tc-modal-form-group mb-0">
                        <label className="tc-modal-label flex items-center gap-1 font-semibold text-slate-200">
                          <Clock size={12} className="text-emerald-400" /> Preferred Time Slot *
                        </label>
                        <select
                          value={newProposedTimeSlot}
                          onChange={(e) => setNewProposedTimeSlot(e.target.value)}
                          className="tc-modal-input w-full p-2.5 rounded-lg bg-surface border border-color text-white"
                          required
                        >
                          <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                          <option value="Afternoon (01:00 PM - 04:00 PM)">Afternoon (01:00 PM - 04:00 PM)</option>
                          <option value="Late Afternoon (04:00 PM - 06:30 PM)">Late Afternoon (04:00 PM - 06:30 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div className="tc-modal-form-group">
                      <label className="tc-modal-label font-semibold text-slate-200 block mb-1">
                        Reason / Note for Buyer *
                      </label>
                      <textarea
                        rows="3"
                        value={rescheduleReason}
                        onChange={(e) => setRescheduleReason(e.target.value)}
                        className="tc-modal-input w-full p-2.5 rounded-lg bg-surface border border-color text-white"
                        placeholder="e.g., Estate manager available from 10 AM on Saturday; log yard gate access open..."
                        required
                      ></textarea>
                    </div>

                    <div className="tc-modal-actions pt-3 border-t border-color flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRescheduleModalOpen(false)}
                        className="tc-buyer-pill-btn px-4 py-2 rounded-xl text-slate-300 hover:text-white border border-color"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="tc-buyer-action-btn bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Calendar size={14} /> Send Rescheduled Date Proposal
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
