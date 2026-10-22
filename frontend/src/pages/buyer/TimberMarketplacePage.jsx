import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import marketplaceService from '../../services/marketplaceService';
import './BuyerCards.css';
import {
  ShoppingBag,
  Handshake,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  Trees,
  Award,
  ArrowRight,
  ShieldCheck,
  X,
  Truck,
  Building,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Layers,
  Eye,
  Clock,
  FileText,
  FileCheck,
  RotateCcw
} from 'lucide-react';

const TimberMarketplacePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const buyerName = user?.contactPerson || user?.name || user?.full_name || 'Arun K';
  const buyerCompany = user?.companyName || user?.company_name || 'timberbuyers';
  const buyerEmail = (user?.email || 'arunbuyer@gmail.com').toLowerCase().trim();

  const [listings, setListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [selectedSellerRole, setSelectedSellerRole] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [selectedLotDetails, setSelectedLotDetails] = useState(null);

  // Negotiation Modal State
  const [negotiateModalOpen, setNegotiateModalOpen] = useState(false);
  const [targetListing, setTargetListing] = useState(null);
  const [buyerNegotiations, setBuyerNegotiations] = useState([]);

  // Default survey date (+2 days)
  const getInitialSurveyDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const [negotiateForm, setNegotiateForm] = useState({
    offeredPricePerM3: '',
    requestedVolume: '',
    deliveryPreference: 'Seller Contractor Hauling to Mill',
    destinationMill: 'Ernakulam Timber Mill Yard #2',
    surveyVisitDate: getInitialSurveyDate(),
    surveyTimeSlot: 'Morning (09:00 AM - 12:00 PM)',
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState('');

  const loadData = () => {
    const all = marketplaceService.getListings();
    setListings(all);

    const allNegs = marketplaceService.getNegotiations();
    const myNegs = allNegs.filter(n => {
      if (!n || n.id === 'neg_1792525172176_219' || n.id === 'neg_1792558834750_747') return false;
      const bEmail = (n.buyerEmail || '').toLowerCase().trim();
      const bName = (n.buyerName || '').toLowerCase().trim();
      return (buyerEmail && bEmail === buyerEmail) || (bName && bName === buyerName.toLowerCase().trim());
    });
    setBuyerNegotiations(myNegs);
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
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Open inspection visit request modal for a listing
  const handleOpenNegotiate = (listing) => {
    setTargetListing(listing);
    const existingNeg = buyerNegotiations.find(n => n.listingId === listing.id);
    const initialDate = getInitialSurveyDate();

    if (existingNeg) {
      setNegotiateForm({
        offeredPricePerM3: existingNeg.offeredPricePerM3 || 0,
        requestedVolume: existingNeg.requestedVolume || listing.volume || 1.7,
        deliveryPreference: existingNeg.deliveryPreference || (listing.transportAvailable ? 'Seller Contractor Hauling to Mill' : 'Buyer Logistics / Mill Truck Dispatch'),
        destinationMill: existingNeg.destinationMill || 'Ernakulam Timber Mill Yard #2',
        surveyVisitDate: existingNeg.surveyVisitDate || initialDate,
        surveyTimeSlot: existingNeg.surveyTimeSlot || 'Morning (09:00 AM - 12:00 PM)',
        notes: existingNeg.notes || `Requesting to inspect this lot of ${listing.timberSpecies} on site to verify log dimensions, heartwood density, debarking, and transit clearance before submitting price offer.`
      });
    } else {
      setNegotiateForm({
        offeredPricePerM3: 0,
        requestedVolume: listing.volume || 1.7,
        deliveryPreference: listing.transportAvailable ? 'Seller Contractor Hauling to Mill' : 'Buyer Logistics / Mill Truck Dispatch',
        destinationMill: 'Ernakulam Timber Mill Yard #2',
        surveyVisitDate: initialDate,
        surveyTimeSlot: 'Morning (09:00 AM - 12:00 PM)',
        notes: `Requesting to inspect this lot of ${listing.timberSpecies} on site to verify log dimensions, heartwood density, debarking, and transit clearance before submitting price offer.`
      });
    }
    setNegotiateModalOpen(true);
  };

  // Submit site inspection request
  const handleSubmitNegotiation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!targetListing) return;

    try {
      await marketplaceService.requestInspection({
        listingId: targetListing.id,
        timberTitle: targetListing.title || `${targetListing.timberSpecies} Sawlogs`,
        timberSpecies: targetListing.timberSpecies,
        sellerRole: targetListing.sellerRole,
        sellerName: targetListing.sellerName,
        sellerEmail: targetListing.sellerEmail,
        sellerPhone: targetListing.sellerPhone,
        buyerName,
        buyerEmail,
        buyerCompany: buyerCompany || 'timberbuyers',
        localBody: targetListing.localBody || targetListing.panchayat || 'Meenadom Panchayat',
        requestedVolume: Number(negotiateForm.requestedVolume) || targetListing.volume || 1.7,
        deliveryPreference: negotiateForm.deliveryPreference,
        destinationMill: negotiateForm.destinationMill,
        surveyVisitDate: negotiateForm.surveyVisitDate,
        surveyTimeSlot: negotiateForm.surveyTimeSlot,
        notes: negotiateForm.notes
      }, user);

      setNegotiateModalOpen(false);
      showToast(`Site inspection visit requested for ${negotiateForm.surveyVisitDate}! Redirecting to Negotiations...`);
      setTimeout(() => {
        navigate('/buyer/negotiations');
      }, 900);
    } catch (err) {
      console.error('Error submitting inspection request:', err);
      alert('Failed to submit inspection request');
    }
  };

  // Filter listings
  const filteredListings = listings.filter((item) => {
    if (item.status === 'Sold') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSpecies = (item.timberSpecies || '').toLowerCase().includes(q);
      const matchSeller = (item.sellerName || '').toLowerCase().includes(q);
      const matchLoc = (item.district || '').toLowerCase().includes(q) || (item.storageLocation || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSpecies && !matchSeller && !matchLoc) return false;
    }

    // Species
    if (selectedSpecies !== 'All') {
      const sp = selectedSpecies.toLowerCase();
      const itemSp = (item.timberSpecies || '').toLowerCase();
      const matchSp = itemSp.includes(sp) || sp.includes(itemSp) || (sp.startsWith('teak') && itemSp.startsWith('teak'));
      if (!matchSp) return false;
    }

    // Seller Role
    if (selectedSellerRole !== 'All' && item.sellerRole !== selectedSellerRole) {
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
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                    <ShoppingBag size={13} /> Timber Marketplace
                  </span>
                  <span className="text-xs text-muted font-medium">Kerala Certified Hardwoods</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-main tracking-tight">
                  Procure Certified Timber Lots
                </h1>
                <p className="text-sm text-muted mt-1 max-w-2xl">
                  Browse verified sawlog and veneer lots published directly by <strong className="text-emerald">Estate Landowners</strong> and <strong className="text-blue-400">Harvesting Contractors</strong> across Kerala.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-color text-xs">
                <span className="font-bold text-emerald font-mono">{filteredListings.length}</span>
                <span className="text-muted">Lots Available for Bidding</span>
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="card p-5 rounded-2xl border border-color bg-card shadow-md space-y-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                
                {/* Search */}
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

                {/* Species Filter */}
                <div className="w-full md:w-44">
                  <select
                    value={selectedSpecies}
                    onChange={(e) => setSelectedSpecies(e.target.value)}
                    className="form-input text-xs font-semibold w-full bg-surface"
                  >
                    <option value="All">All Species</option>
                    <option value="Teak">Teakwood</option>
                    <option value="Rosewood">Rosewood</option>
                    <option value="Rubberwood">Rubberwood</option>
                    <option value="Mahogany">Mahogany</option>
                    <option value="Eucalyptus">Eucalyptus</option>
                  </select>
                </div>

                {/* Seller Type Filter */}
                <div className="w-full md:w-44">
                  <select
                    value={selectedSellerRole}
                    onChange={(e) => setSelectedSellerRole(e.target.value)}
                    className="form-input text-xs font-semibold w-full bg-surface"
                  >
                    <option value="All">All Sellers</option>
                    <option value="landowner">Estate Landowners</option>
                    <option value="contractor">Harvesting Contractors</option>
                  </select>
                </div>

                {/* District Filter */}
                <div className="w-full md:w-40">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="form-input text-xs font-semibold w-full bg-surface"
                  >
                    <option value="All">All Districts</option>
                    <option value="Wayanad">Wayanad</option>
                    <option value="Palakkad">Palakkad</option>
                    <option value="Kottayam">Kottayam</option>
                    <option value="Idukki">Idukki</option>
                    <option value="Ernakulam">Ernakulam</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="w-full md:w-36">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="form-input text-xs font-semibold w-full bg-surface"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="volume_desc">Volume: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TIMBER LOTS CARDS (IMAGE 1 DESIGN SYSTEM) */}
            {/* ========================================================= */}
            {filteredListings.length === 0 ? (
              <div className="tc-buyer-card text-center py-12">
                <Trees size={44} className="mx-auto text-muted mb-3" />
                <h3 className="text-base font-bold text-main mb-1">No Timber Lots Match Your Filter</h3>
                <p className="text-xs text-muted max-w-sm mx-auto mb-4">
                  Try clearing your search query or changing species and district filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSpecies('All');
                    setSelectedSellerRole('All');
                    setSelectedDistrict('All');
                  }}
                  className="tc-buyer-pill-btn mx-auto"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredListings.map((item) => {
                  const isLandowner = item.sellerRole === 'landowner';
                  const totalLotValue = item.askingPrice || ((item.volume || 0) * (item.pricePerM3 || 0));

                  return (
                    <div key={item.id} className="tc-buyer-card">
                      {/* Top Header Row */}
                      <div className="tc-buyer-header">
                        <div className="tc-buyer-user-info">
                          {item.images?.[0] ? (
                            <div
                              className="tc-buyer-thumb-box"
                              onClick={() => setSelectedLotDetails(item)}
                              title="Click to view entire details & inspection photos"
                            >
                              <img src={item.images[0]} alt={item.title} className="tc-buyer-thumb-img" />
                              {item.images.length > 1 && (
                                <span className="tc-buyer-thumb-badge">+{item.images.length - 1}</span>
                              )}
                            </div>
                          ) : (
                            <div className={`tc-buyer-avatar-badge ${!isLandowner ? 'text-blue-400 bg-blue-500/15 border-blue-500/30' : ''}`}>
                              <Trees size={22} />
                            </div>
                          )}
                          <div className="tc-buyer-title-group">
                            <div className="tc-buyer-title-row">
                              <span className="tc-buyer-title">{item.title || `${item.timberSpecies} Sawlogs`}</span>
                              <span className={isLandowner ? 'tc-buyer-verified-badge' : 'tc-buyer-verified-badge tc-buyer-verified-badge-blue'}>
                                {isLandowner ? 'Verified Landowner' : 'Verified Contractor'}
                              </span>
                              <span className="tc-buyer-verified-badge tc-buyer-verified-badge-amber">
                                {item.negotiable === 'Yes' ? 'Price Negotiable' : 'Fixed Price'}
                              </span>
                              {buyerNegotiations.some(n => n.listingId === item.id) && (
                                <span className="tc-buyer-verified-badge border-emerald-500/50 bg-emerald-950/70 text-emerald-300 font-bold">
                                  <CheckCircle2 size={11} className="text-emerald-400" /> Offer Submitted
                                </span>
                              )}
                            </div>
                            <p className="tc-buyer-subtitle">
                              Seller: <strong className="text-white">{item.sellerName}</strong> • Origin: <strong className="text-slate-300">{item.storageLocation || item.propertyName || item.district}</strong>, {item.district}, Kerala.
                            </p>
                          </div>
                        </div>

                        <div className="tc-buyer-header-actions">
                          {item.sellerPhone && (
                            <a href={`tel:${item.sellerPhone}`} className="tc-buyer-pill-btn">
                              <Phone size={13} /> {item.sellerPhone}
                            </a>
                          )}
                          <button
                            onClick={() => setSelectedLotDetails(item)}
                            className="tc-buyer-details-btn"
                            title="View log inspection photos, dimensions, transit clearance and full lot details"
                          >
                            <Eye size={14} /> View Entire Details
                          </button>
                          {(() => {
                            const existingNeg = buyerNegotiations.find(n => n.listingId === item.id);
                            if (!existingNeg) {
                              return (
                                <button
                                  onClick={() => handleOpenNegotiate(item)}
                                  className="tc-buyer-action-btn"
                                >
                                  <Calendar size={14} /> Schedule Site Inspection
                                </button>
                              );
                            }
                            if (existingNeg.status === 'Inspection Requested') {
                              return (
                                <button
                                  onClick={() => navigate('/buyer/negotiations')}
                                  className="tc-buyer-action-btn bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                                  title="Inspection requested. Waiting for landowner date approval."
                                >
                                  <Clock size={14} className="text-amber-400 animate-pulse" /> Inspection Requested ({existingNeg.surveyVisitDate})
                                </button>
                              );
                            }
                            if (existingNeg.status === 'Date Rescheduled by Landowner') {
                              return (
                                <button
                                  onClick={() => navigate('/buyer/negotiations')}
                                  className="tc-buyer-action-btn bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30"
                                  title="Landowner proposed alternate date. Click to review."
                                >
                                  <RotateCcw size={14} className="text-blue-400" /> Date Rescheduled — Review →
                                </button>
                              );
                            }
                            if (existingNeg.status === 'Inspection Scheduled') {
                              return (
                                <button
                                  onClick={() => navigate('/buyer/negotiations')}
                                  className="tc-buyer-action-btn bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40"
                                  title="Inspection visit approved! Click to record survey and offer."
                                >
                                  <FileCheck size={14} className="text-emerald-400" /> Inspection Approved — Record Offer →
                                </button>
                              );
                            }
                            if (existingNeg.status === 'Accepted' || existingNeg.status === 'Payment Completed') {
                              return (
                                <button
                                  onClick={() => navigate('/buyer/negotiations')}
                                  className="tc-buyer-action-btn bg-emerald-500 text-black font-extrabold hover:bg-emerald-400"
                                >
                                  <CheckCircle2 size={14} /> Deal Agreed — Pay / View →
                                </button>
                              );
                            }
                            return (
                              <button
                                onClick={() => navigate('/buyer/negotiations')}
                                className="tc-buyer-action-btn bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30"
                              >
                                <CheckCircle2 size={14} className="text-emerald-400" /> View Negotiation Status →
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Streamlined Metrics Strip */}
                      <div className="tc-buyer-compact-metrics">
                        <div className="tc-buyer-compact-chip">
                          <span className="tc-buyer-compact-label">AVAILABLE VOLUME</span>
                          <span className="tc-buyer-compact-val text-white">{item.volume} m³</span>
                          <span className="tc-buyer-compact-sub">{item.quantity ? `${item.quantity} Debarked Logs` : 'High Density Stand'}</span>
                        </div>

                        <div className="tc-buyer-compact-chip">
                          <span className="tc-buyer-compact-label">SPECIES & GRADE</span>
                          <span className="tc-buyer-compact-val text-emerald">{item.timberSpecies}</span>
                          <span className="tc-buyer-compact-sub">{item.gradeQuality || 'Grade A Prime'} • {item.district}, KL</span>
                        </div>

                        <div className="tc-buyer-compact-chip">
                          <span className="tc-buyer-compact-label">ASKING RATE PER M³</span>
                          <span className="tc-buyer-compact-val text-emerald">₹ {Number(item.pricePerM3).toLocaleString('en-IN')}</span>
                          <span className="tc-buyer-compact-sub">per cubic meter asking</span>
                        </div>

                        <div className="tc-buyer-compact-chip">
                          <span className="tc-buyer-compact-label">ESTIMATED LOT VALUE</span>
                          <span className="tc-buyer-compact-val text-gold">₹ {Number(totalLotValue).toLocaleString('en-IN')}</span>
                          <span className="tc-buyer-compact-sub">{item.negotiable === 'Yes' ? '⚡ Bids Accepted' : 'Fixed Valuation'}</span>
                        </div>
                      </div>

                      {/* Quick Summary Sub-bar */}
                      <div className="flex items-center justify-between text-xs pt-1 px-1 text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-slate-300">
                            <ShieldCheck size={13} className="text-emerald" />
                            {item.fscCert || 'Forest Dept Transit Cleared'}
                          </span>
                          <span className="hidden sm:inline text-slate-600">•</span>
                          <span className="hidden sm:inline text-slate-400">
                            {item.transportAvailable ? '✓ Contractor Hauling Available' : 'Buyer Truck Dispatch'}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedLotDetails(item)}
                          className="text-emerald hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye size={12} /> Inspection Photos & Full Specs ({item.images?.length || 0}) →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ========================================================= */}
            {/* VIEW ENTIRE DETAILS DOSSIER MODAL */}
            {/* ========================================================= */}
            {/* ========================================================= */}
            {/* VIEW ENTIRE DETAILS DOSSIER MODAL */}
            {/* ========================================================= */}
            {selectedLotDetails && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] overflow-y-auto p-4 sm:p-6 flex justify-center items-start sm:items-center">
                <div className="tc-details-modal-box my-auto animate-scale-up">
                  {/* Modal Header (Sticky) */}
                  <div className="tc-details-header flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="text-lg font-bold text-white">
                          {selectedLotDetails.title || `${selectedLotDetails.timberSpecies} Sawlogs`}
                        </h2>
                        <span className={selectedLotDetails.sellerRole === 'landowner' ? 'tc-buyer-verified-badge' : 'tc-buyer-verified-badge tc-buyer-verified-badge-blue'}>
                          {selectedLotDetails.sellerRole === 'landowner' ? 'Verified Landowner' : 'Verified Contractor'}
                        </span>
                        <span className="tc-buyer-verified-badge tc-buyer-verified-badge-amber">
                          {selectedLotDetails.negotiable === 'Yes' ? 'Price Negotiable' : 'Fixed Price'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Seller: <strong className="text-white">{selectedLotDetails.sellerName}</strong> • Origin: <strong className="text-slate-300">{selectedLotDetails.storageLocation || selectedLotDetails.propertyName || selectedLotDetails.district}</strong>, {selectedLotDetails.district}, Kerala
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedLotDetails(null)}
                      className="tc-modal-close"
                      title="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="tc-details-body">
                    {/* Timber Yard & Inspection Photos Gallery */}
                    {selectedLotDetails.images && selectedLotDetails.images.length > 0 && (
                      <div className="tc-buyer-gallery">
                        <div className="tc-buyer-gallery-header">
                          <span className="tc-buyer-gallery-title">
                            <Eye size={14} className="text-emerald" /> Timber Yard & Log Inspection Photos ({selectedLotDetails.images.length})
                          </span>
                          <span className="text-[11px] text-slate-400">Click any photo to zoom full size</span>
                        </div>
                        <div className="tc-buyer-gallery-grid">
                          {selectedLotDetails.images.map((imgSrc, idx) => (
                            <div
                              key={idx}
                              className="tc-buyer-gallery-item"
                              onClick={() => setSelectedPreviewImage(imgSrc)}
                              title={`Click to zoom photo ${idx + 1}`}
                            >
                              <img src={imgSrc} alt={`Log photo ${idx + 1}`} className="tc-buyer-gallery-img" />
                              <div className="tc-buyer-gallery-overlay">
                                <span>Photo {idx + 1} (Zoom)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4-Cell Comprehensive Metrics Grid */}
                    <div className="tc-buyer-metrics-grid">
                      <div className="tc-buyer-metric-cell">
                        <span className="tc-buyer-metric-label">TIMBER SPECIES</span>
                        <div className="tc-buyer-metric-val">
                          <Trees size={16} className="text-emerald" />
                          <span>{selectedLotDetails.timberSpecies}</span>
                        </div>
                        <span className="tc-buyer-metric-hint">{selectedLotDetails.timberType || 'Sawlogs'}</span>
                      </div>

                      <div className="tc-buyer-metric-cell">
                        <span className="tc-buyer-metric-label">AVAILABLE VOLUME</span>
                        <div className="tc-buyer-metric-val">
                          <span>{selectedLotDetails.volume} m³</span>
                        </div>
                        <span className="tc-buyer-metric-hint">{selectedLotDetails.quantity ? `${selectedLotDetails.quantity} Debarked Logs` : 'High Density Stand'}</span>
                      </div>

                      <div className="tc-buyer-metric-cell">
                        <span className="tc-buyer-metric-label">QUALITY GRADE & GIRTH</span>
                        <div className="tc-buyer-metric-val truncate">
                          <span>{selectedLotDetails.gradeQuality || 'Grade A Sawlog'}</span>
                        </div>
                        <span className="tc-buyer-metric-hint">{selectedLotDetails.logDimensions || 'Standard Dimensions'}</span>
                      </div>

                      <div className="tc-buyer-metric-cell">
                        <span className="tc-buyer-metric-label">STORAGE / PICKUP YARD</span>
                        <div className="tc-buyer-metric-val truncate">
                          <MapPin size={16} className="text-emerald" />
                          <span>{selectedLotDetails.district}, KL</span>
                        </div>
                        <span className="tc-buyer-metric-hint truncate">{selectedLotDetails.storageLocation || selectedLotDetails.pickupLocation || 'Direct Gate Access'}</span>
                      </div>
                    </div>

                    {/* Description / Inspector Notes */}
                    {selectedLotDetails.description && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lot Description & Specifications</span>
                        <p className="text-xs text-slate-200 leading-relaxed bg-black/50 p-3.5 rounded-xl border border-emerald-500/20">
                          {selectedLotDetails.description}
                        </p>
                      </div>
                    )}

                    {/* Bottom Financial & Action Grid */}
                    <div className="tc-buyer-bottom-grid">
                      <div className="tc-buyer-highlight-cell">
                        <span className="tc-buyer-metric-label">ASKING RATE PER M³</span>
                        <div className="text-xl font-extrabold text-emerald font-mono">
                          ₹ {Number(selectedLotDetails.pricePerM3).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-muted">Per cubic meter asking</span>
                      </div>

                      <div className="tc-buyer-amber-cell">
                        <span className="tc-buyer-metric-label text-amber-300">CUSTOM VOLUME BIDDING</span>
                        <div className="text-base font-extrabold text-amber-400 font-mono">
                          {selectedLotDetails.negotiable === 'Yes' ? 'Open for Price Bids' : 'Fixed Seller Rate'}
                        </div>
                        <button
                          onClick={() => {
                            const item = selectedLotDetails;
                            setSelectedLotDetails(null);
                            handleOpenNegotiate(item);
                          }}
                          className="tc-buyer-action-amber-btn"
                        >
                          <Handshake size={14} /> Bid Custom Rate →
                        </button>
                      </div>

                      <div className="tc-buyer-highlight-cell">
                        <span className="tc-buyer-metric-label">ESTIMATED TOTAL LOT VALUE</span>
                        <div className="text-lg font-extrabold text-gold font-mono">
                          ₹ {Number(selectedLotDetails.askingPrice || ((selectedLotDetails.volume || 0) * (selectedLotDetails.pricePerM3 || 0))).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[11px] text-muted">For entire {selectedLotDetails.volume} m³ parcel</span>
                      </div>

                      <div className="tc-buyer-highlight-cell">
                        <span className="tc-buyer-metric-label">TRANSIT & LOGISTICS</span>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <ShieldCheck size={14} className="text-emerald" />
                          <span>{selectedLotDetails.fscCert || 'Forest Dept Transit Cleared'}</span>
                        </div>
                        <span className="text-[11px] text-emerald font-medium">
                          {selectedLotDetails.transportAvailable ? '✓ Contractor Hauling Available' : 'Buyer Truck Dispatch'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions (Sticky) */}
                  <div className="tc-details-footer flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedLotDetails.sellerPhone && (
                        <a
                          href={`tel:${selectedLotDetails.sellerPhone}`}
                          className="tc-buyer-pill-btn"
                        >
                          <Phone size={13} /> Call {selectedLotDetails.sellerPhone}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedLotDetails(null)}
                        className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                      >
                        Close Details
                      </button>
                      <button
                        onClick={() => {
                          const item = selectedLotDetails;
                          setSelectedLotDetails(null);
                          handleOpenNegotiate(item);
                        }}
                        className="tc-buyer-action-btn"
                      >
                        {buyerNegotiations.some(n => n.listingId === selectedLotDetails.id) ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-400" /> View Submitted Offer
                          </>
                        ) : (
                          <>
                            <Handshake size={14} /> Negotiate Price / Place Offer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* NEGOTIATION & TIMBER SURVEY VISIT MODAL */}
            {/* ========================================================= */}
            {negotiateModalOpen && targetListing && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000] overflow-y-auto p-4 sm:p-6 flex justify-center items-center">
                <div className="tc-negotiate-modal-box my-auto animate-scale-up">
                  {/* Modal Header */}
                  <div className="tc-modal-header">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <h3 className="tc-modal-title text-base font-bold text-white leading-tight">
                          Schedule Timber Site Inspection Visit
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Phase 1 of 3: Propose inspection date before submitting commercial price offer
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNegotiateModalOpen(false)}
                      className="tc-modal-close"
                      title="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitNegotiation} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Modal Body */}
                    <div className="tc-modal-body text-xs">
                      {/* Workflow Information Banner */}
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3 shadow-sm">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                          <Clock size={15} />
                        </div>
                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-emerald-300 block text-[11.5px] uppercase tracking-wider">
                            Pre-Purchase Physical Verification
                          </span>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            Select a date to inspect debarked logs in person at the estate yard. Once the landowner approves this visit, you will verify log girth, timber grade, and Forest Dept transit pass on site, then formulate your commercial offer.
                          </p>
                        </div>
                      </div>

                      {/* Active Offer / Inspection Already Submitted Banner */}
                      {buyerNegotiations.some(n => n.listingId === targetListing.id) && (() => {
                        const existing = buyerNegotiations.find(n => n.listingId === targetListing.id);
                        return (
                          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-start gap-3 shadow-lg animate-fade-in">
                            <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1 text-xs flex-1">
                              <div className="font-bold text-white flex items-center justify-between gap-2 flex-wrap">
                                <span className="flex items-center gap-1.5 text-emerald-300">
                                  Current Status with {targetListing.sellerName}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  {existing.status || 'Inspection Requested'}
                                </span>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                Inspection Date: <strong className="text-white font-mono">{existing.surveyVisitDate || 'Scheduled'} ({existing.surveyTimeSlot})</strong>.
                                {existing.offeredPricePerM3 ? ` Recorded Offer: ₹${Number(existing.offeredPricePerM3).toLocaleString('en-IN')}/m³ for ${existing.requestedVolume} m³.` : ' Price offer to be formulated after physical verification.'}
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Lot Snapshot Card */}
                      <div className="p-3.5 rounded-xl bg-black/60 border border-emerald-500/25 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-extrabold text-white text-xs sm:text-sm">
                            {targetListing.title || targetListing.timberSpecies}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {targetListing.volume} m³ Available
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/15 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Seller</span>
                            <strong className="text-slate-200">{targetListing.sellerName}</strong> <span className="text-slate-400 text-[10px]">({targetListing.sellerRole})</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Asking Benchmark</span>
                            <strong className="text-emerald font-mono font-bold">₹ {Number(targetListing.pricePerM3).toLocaleString('en-IN')}/m³</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Buyer Enterprise</span>
                            <strong className="text-amber-300">{buyerCompany || user?.company_name || 'timberbuyers'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Local Jurisdiction</span>
                            <div className="flex items-center gap-1 text-slate-200 truncate">
                              <MapPin size={11} className="text-emerald flex-shrink-0" />
                              <span className="truncate">{targetListing.localBody || targetListing.panchayat || 'Meenadom Panchayat'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 1. Proposed Inspection Schedule */}
                      <div className="tc-modal-card-section">
                        <div className="tc-modal-card-title pb-1 border-b border-emerald-500/15">
                          <span className="flex items-center gap-2">
                            <Calendar size={13} className="text-emerald" /> 1. Proposed Inspection Schedule
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">At Seller Log Yard</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="tc-modal-form-group">
                            <label className="tc-modal-label">
                              <Calendar size={12} className="text-emerald" /> Date to Survey Timber *
                            </label>
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={negotiateForm.surveyVisitDate}
                              onChange={(e) => setNegotiateForm({ ...negotiateForm, surveyVisitDate: e.target.value })}
                              className="tc-modal-input text-white font-medium"
                              required
                            />
                          </div>

                          <div className="tc-modal-form-group">
                            <label className="tc-modal-label">
                              <Clock size={12} className="text-emerald" /> Preferred Time Slot *
                            </label>
                            <select
                              value={negotiateForm.surveyTimeSlot}
                              onChange={(e) => setNegotiateForm({ ...negotiateForm, surveyTimeSlot: e.target.value })}
                              className="tc-modal-input"
                              required
                            >
                              <option value="Morning (09:00 AM - 12:00 PM)">Morning (09:00 AM - 12:00 PM)</option>
                              <option value="Afternoon (01:00 PM - 04:00 PM)">Afternoon (01:00 PM - 04:00 PM)</option>
                              <option value="Late Afternoon (04:00 PM - 06:30 PM)">Late Afternoon (04:00 PM - 06:30 PM)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 2. Volume of Interest & Logistics */}
                      <div className="tc-modal-card-section">
                        <div className="tc-modal-card-title pb-1 border-b border-emerald-500/15">
                          <span className="flex items-center gap-2">
                            <Trees size={13} className="text-emerald" /> 2. Desired Volume & Logistics Preference
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Preliminary Estimates</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="tc-modal-form-group">
                            <label className="tc-modal-label">
                              Estimated Volume of Interest (m³) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max={targetListing.volume}
                              value={negotiateForm.requestedVolume}
                              onChange={(e) => setNegotiateForm({ ...negotiateForm, requestedVolume: e.target.value })}
                              className="tc-modal-input font-bold font-mono text-white"
                              required
                            />
                            <span className="text-[10.5px] text-slate-400">
                              Available in lot: <strong className="text-emerald">{targetListing.volume} m³</strong>. Confirmed upon site survey.
                            </span>
                          </div>

                          <div className="tc-modal-form-group">
                            <label className="tc-modal-label">
                              Haulage & Logistics Preference
                            </label>
                            <select
                              value={negotiateForm.deliveryPreference}
                              onChange={(e) => setNegotiateForm({ ...negotiateForm, deliveryPreference: e.target.value })}
                              className="tc-modal-input"
                            >
                              <option value="Seller Contractor Hauling to Mill">Seller Arranged Transport to Buyer Mill</option>
                              <option value="Buyer Arranged Truck Pickup from Yard">Buyer Self-Pickup (We Dispatch Trucks)</option>
                              <option value="Shared Freight 50/50">Shared Freight Costs</option>
                            </select>
                            <span className="text-[10.5px] text-slate-400">
                              Hauling terms finalized post-inspection
                            </span>
                          </div>
                        </div>

                        {/* Buyer Enterprise & Local Body / Jurisdiction */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-emerald-500/15">
                          <div className="tc-modal-form-group">
                            <label className="tc-modal-label">
                              <Building size={12} className="text-emerald" /> Buyer Enterprise / Firm
                            </label>
                            <div className="tc-modal-input font-bold text-white bg-black/60 flex items-center justify-between border border-emerald-500/30">
                              <span>{buyerCompany || user?.company_name || 'timberbuyers'}</span>
                              <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40">
                                Verified Buyer
                              </span>
                            </div>
                            <span className="text-[10.5px] text-slate-400">
                              Procurement enterprise account
                            </span>
                          </div>

                          <div className="tc-modal-form-group">
                            <label className="tc-modal-label">
                              <MapPin size={12} className="text-emerald" /> Local Body / Jurisdiction
                            </label>
                            <div className="tc-modal-input font-bold text-white bg-black/60 flex items-center justify-between border border-emerald-500/30">
                              <span>{targetListing?.localBody || targetListing?.panchayat || 'Meenadom Panchayat'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">LSGD Kottayam</span>
                            </div>
                            <span className="text-[10.5px] text-slate-400">
                              Timber lot site local body jurisdiction
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Inspection Focus & Notes */}
                      <div className="tc-modal-card-section">
                        <div className="tc-modal-card-title pb-1 border-b border-emerald-500/15">
                          <span className="flex items-center gap-2">
                            <FileText size={13} className="text-emerald" /> 3. Inspection Focus & Notes to Landowner
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                        </div>

                        <div className="tc-modal-form-group">
                          <textarea
                            rows="2"
                            value={negotiateForm.notes}
                            onChange={(e) => setNegotiateForm({ ...negotiateForm, notes: e.target.value })}
                            className="tc-modal-input text-xs leading-relaxed"
                            placeholder="e.g., Requesting to inspect log girth with forest caliper, verify end-seals, and check Forest Dept transit pass stamping before formulating price offer..."
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="tc-modal-actions">
                      <button
                        type="button"
                        onClick={() => setNegotiateModalOpen(false)}
                        className="tc-buyer-pill-btn px-4 py-2"
                      >
                        Cancel
                      </button>

                      {buyerNegotiations.some(n => n.listingId === targetListing.id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNegotiateModalOpen(false);
                            navigate('/buyer/negotiations');
                          }}
                          className="tc-buyer-action-btn bg-emerald-600/90 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-lg cursor-pointer px-5 py-2.5"
                        >
                          <CheckCircle2 size={15} className="text-white" /> View in Negotiations Tracker →
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="tc-buyer-action-btn flex items-center gap-2 px-6 py-2.5 shadow-xl font-bold"
                        >
                          <Calendar size={15} /> Submit Inspection Visit Request
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* PHOTO LIGHTBOX MODAL */}
            {selectedPreviewImage && (
              <div
                className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setSelectedPreviewImage(null)}
              >
                <div
                  className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-emerald-500/30 rounded-2xl p-2 shadow-2xl overflow-hidden animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-3 border-b border-white/10">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Eye size={14} /> Certified Timber Inspection Photo
                    </span>
                    <button
                      onClick={() => setSelectedPreviewImage(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden">
                    <img
                      src={selectedPreviewImage}
                      alt="Timber high resolution inspection view"
                      className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-lg"
                    />
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

export default TimberMarketplacePage;
