import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  ShoppingBag,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Trees,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Handshake,
  Tag,
  ArrowRight,
  ArrowLeft,
  Filter,
  X
} from 'lucide-react';

const AdminMarketplacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'negotiations' | 'orders'
  const [data, setData] = useState({ listings: [], negotiations: [], orders: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMarketplace = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/admin/marketplace');
      if (res.data) {
        setData({
          listings: res.data.listings || [],
          negotiations: res.data.negotiations || [],
          orders: res.data.orders || []
        });
      }
    } catch (e) {
      console.error('Error fetching admin marketplace data:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace(false);

    // Live refresh every 4 seconds
    const interval = setInterval(() => fetchMarketplace(true), 4000);
    const handleSync = () => fetchMarketplace(true);
    window.addEventListener('treeconnect_marketplace_updated', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('treeconnect_marketplace_updated', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, []);

  const { listings, negotiations, orders } = data;

  const filteredListings = listings.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      l.title?.toLowerCase().includes(q) ||
      l.timberSpecies?.toLowerCase().includes(q) ||
      l.sellerName?.toLowerCase().includes(q) ||
      l.sellerEmail?.toLowerCase().includes(q) ||
      l.propertyName?.toLowerCase().includes(q) ||
      l.district?.toLowerCase().includes(q)
    );
  });

  const filteredNegotiations = negotiations.filter((n) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      n.listingTitle?.toLowerCase().includes(q) ||
      n.buyerName?.toLowerCase().includes(q) ||
      n.buyerEmail?.toLowerCase().includes(q) ||
      n.sellerName?.toLowerCase().includes(q) ||
      n.sellerEmail?.toLowerCase().includes(q) ||
      n.status?.toLowerCase().includes(q)
    );
  });

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      o.id?.toLowerCase().includes(q) ||
      o.buyerName?.toLowerCase().includes(q) ||
      o.buyerEmail?.toLowerCase().includes(q) ||
      o.listingTitle?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="admin-gov-header">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <ShoppingBag size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">Timber Marketplace Governance</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Live commercial catalog of harvested timber lots, buyer purchase offers, and escrow contract negotiations
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/dashboard')}
            className="admin-gov-back-btn"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Marketplace KPIs */}
        <div className="admin-gov-kpi-grid">
          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Active Timber Lots</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShoppingBag size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-white">{listings.length}</div>
            <div className="text-[11px] text-slate-400">Available commercial lots</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Buyer Negotiations</span>
              <span className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Handshake size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-blue-400">{negotiations.length}</div>
            <div className="text-[11px] text-slate-400">Active buyer bids & offers</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Purchase Orders</span>
              <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <FileText size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-amber-400">{orders.length}</div>
            <div className="text-[11px] text-slate-400">Closed transaction orders</div>
          </div>

          <div className="admin-gov-kpi-card">
            <div className="admin-gov-kpi-header">
              <span className="admin-gov-kpi-title">Market Catalog Value</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <DollarSign size={15} />
              </span>
            </div>
            <div className="admin-gov-kpi-value text-emerald-400">
              ₹{listings.reduce((sum, l) => sum + (Number(l.askingPrice) || 0), 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400/80 font-medium">Total active listing value</div>
          </div>
        </div>

        {/* Tab & Search Navigation Toolbar */}
        <div className="admin-gov-toolbar">
          <div className="admin-gov-tabs">
            <button
              onClick={() => setActiveTab('listings')}
              className={`admin-gov-tab ${activeTab === 'listings' ? 'active' : ''}`}
            >
              <ShoppingBag size={15} />
              <span>Timber Listings</span>
              <span className="admin-gov-tab-badge">{listings.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('negotiations')}
              className={`admin-gov-tab ${activeTab === 'negotiations' ? 'active' : ''}`}
            >
              <Handshake size={15} />
              <span>Buyer Requests &amp; Offers</span>
              <span className="admin-gov-tab-badge">{negotiations.length}</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`admin-gov-tab ${activeTab === 'orders' ? 'active' : ''}`}
            >
              <FileText size={15} />
              <span>Purchase Orders</span>
              <span className="admin-gov-tab-badge">{orders.length}</span>
            </button>
          </div>

          <div className="admin-gov-search-wrap">
            <Search size={16} className="admin-gov-search-icon" />
            <input
              type="text"
              placeholder={
                activeTab === 'listings'
                  ? 'Search by title, species, property, seller...'
                  : activeTab === 'negotiations'
                  ? 'Search offers by buyer, listing, status...'
                  : 'Search purchase orders by ID, buyer...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-gov-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="admin-gov-search-clear"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Timber Listings */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {loading ? (
              <div className="admin-gov-item text-center py-12 text-slate-400 text-sm">
                Loading timber listings...
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="admin-gov-item text-center py-12 text-slate-400">
                No timber listings found matching the search query.
              </div>
            ) : (
              filteredListings.map((l) => (
                <div
                  key={l.id || l._id}
                  className="admin-gov-item"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-black text-white">{l.title}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {l.status || 'Published'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-emerald-400" />
                        <span>{l.storageLocation || l.pickupLocation || `${l.district || 'Kottayam'}, Kerala`}</span>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-emerald-400">
                        ₹{Number(l.askingPrice || 251000).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        ₹{Number(l.pricePerM3 || 147647).toLocaleString('en-IN')} / m³
                      </span>
                    </div>
                  </div>

                  {/* Lot Specifications */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Timber Species</span>
                      <strong className="text-white block mt-0.5 text-sm">{l.timberSpecies || 'Teakwood'}</strong>
                      <span className="text-slate-400 text-xs">{l.gradeQuality || 'Grade A Prime Export'}</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Verified Volume</span>
                      <strong className="text-emerald-400 block mt-0.5 text-sm font-bold">{l.volume || 1.70} m³</strong>
                      <span className="text-slate-400 text-xs">{l.quantity || 2} Sawlogs</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Log Dimensions</span>
                      <strong className="text-white block mt-0.5 text-sm">{l.logDimensions || 'Avg girth: 60 - 80cm'}</strong>
                      <span className="text-slate-400 text-xs">Debarked &amp; End-Sealed</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Approved Seller</span>
                      <strong className="text-white block mt-0.5 text-sm">{l.sellerName || 'Harigovind D Nair'}</strong>
                      <span className="text-slate-400 text-xs">{l.sellerEmail || 'h4hari2003@gmail.com'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                    {l.description || 'Verified timber logs produced from approved sustainable harvesting operation.'}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Buyer Negotiations & Offers */}
        {activeTab === 'negotiations' && (
          <div className="space-y-4">
            {filteredNegotiations.length === 0 ? (
              <div className="admin-gov-item text-center py-12 text-slate-400">
                No active buyer negotiation offers recorded.
              </div>
            ) : (
              filteredNegotiations.map((neg) => (
                <div
                  key={neg.id || neg._id}
                  className="admin-gov-item"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-black text-white">{neg.listingTitle || 'Teakwood Sawlogs'}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {neg.status || 'Pending Review'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Negotiation ID: <strong className="font-mono text-slate-300">{neg.id}</strong>
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">
                        Buyer Offer: <strong className="text-emerald-400 text-base">₹{Number(neg.buyerOfferPrice || 68000).toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Counter Target: <strong className="text-blue-400">₹{Number(neg.counterPrice || 71400).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Stakeholder Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Verified Buyer</span>
                      <strong className="text-white block mt-0.5 text-sm">{neg.buyerName || 'Arun K'}</strong>
                      <span className="text-slate-400 text-xs">{neg.buyerEmail || 'arunbuyer@gmail.com'}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">{neg.buyerLocation || 'Meenadom, Kerala'}</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Approved Seller</span>
                      <strong className="text-white block mt-0.5 text-sm">{neg.sellerName || 'Harigovind D Nair'}</strong>
                      <span className="text-slate-400 text-xs">{neg.sellerEmail || 'h4hari2003@gmail.com'}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5">Role: Landowner</span>
                    </div>

                    <div className="bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <span className="text-slate-500 uppercase font-bold text-[10px] block">Volume Requested</span>
                      <strong className="text-emerald-400 block mt-0.5 text-sm font-bold">{neg.requestedVolume || 1.70} m³</strong>
                      <span className="text-slate-400 text-xs">Asking Price: ₹{Number(neg.askingPrice || 251000).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {neg.message && (
                    <div className="text-xs text-slate-300 bg-[#08100c] p-3.5 rounded-xl border border-white/5">
                      <strong className="text-slate-400 block text-[10px] uppercase mb-0.5">Buyer Negotiation Message</strong>
                      {neg.message}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Purchase Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="admin-gov-item text-center py-12 text-slate-400">
                No closed timber purchase orders yet. Active offers are currently under negotiation.
              </div>
            ) : (
              filteredOrders.map((o) => (
                <div
                  key={o.id || o._id}
                  className="admin-gov-item"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-base font-black text-white">{o.orderNumber || o.id}</h3>
                      <p className="text-xs text-slate-400">{o.listingTitle || 'Timber Order'}</p>
                    </div>
                    <div className="text-right font-black text-emerald-400 text-lg">
                      ₹{Number(o.totalAmount || o.agreedPrice || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMarketplacePage;
