import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLandowner } from '../../context/LandownerContext';
import {
  Trees,
  Scale,
  Plus,
  Calculator,
  MapPin,
  Check,
  X,
  ArrowUpRight,
  TrendingUp,
  CloudSun,
  Calendar,
  Bell,
  Clock,
  DollarSign,
  AlertCircle,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Wind,
  Droplets,
  ExternalLink,
  ShieldCheck,
  Activity,
  ArrowRight,
  Package,
  Axe,
  ShoppingBag
} from 'lucide-react';

const LandownerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { properties, inventories, harvestRequests, timberListings, completedHarvests } = useLandowner();

  const [bids, setBids] = useState([]);

  // Calculate dynamic metrics from user properties and inventories
  const totalManagedArea = properties.reduce((acc, p) => acc + (parseFloat(p.totalArea) || 0), 0);
  const totalTimberVolume = inventories.reduce((acc, inv) => {
    const invVol = (inv.speciesList || []).reduce((sAcc, sp) => {
      const vol = parseFloat(sp.estimatedVolume) || (parseFloat(sp.numberOfTrees || sp.count || 0) * 0.7);
      return sAcc + vol;
    }, 0);
    return acc + invVol;
  }, 0);
  const estRevenue = Math.round(totalTimberVolume * 115);

  // Latest Active Operation or Request
  const activeSpotlight = harvestRequests.length > 0
    ? harvestRequests[0]
    : (completedHarvests.length > 0 ? completedHarvests[0] : null);

  // Quick Calculator state
  const [treesCount, setTreesCount] = useState(250);
  const [avgDbh, setAvgDbh] = useState(18); // Diameter at Breast Height in inches

  // Volume estimation formula
  const calculatedVolume = Math.round(treesCount * Math.pow(avgDbh * 2.54 / 200, 2) * 3.14159 * 18 * 0.5 * 10) / 10;
  const estimatedValue = Math.round(calculatedVolume * 115);

  const handleBidStatus = (id, newStatus) => {
    setBids(bids.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const userName = user?.name || 'Landowner';

  // 4 QUICK ACTIONS DEFINITION
  const quickActions = [
    {
      id: 'register-property',
      emoji: '🌳',
      title: 'Register Property',
      description: 'Add a forest estate or plantation.',
      path: '/landowner/register-property',
      accentColor: 'border-emerald/40 hover:border-emerald hover:bg-emerald/5'
    },
    {
      id: 'add-inventory',
      emoji: '🌲',
      title: 'Add Tree Inventory',
      description: 'Record trees belonging to a registered property.',
      path: '/landowner/add-inventory',
      accentColor: 'border-emerald/40 hover:border-emerald hover:bg-emerald/5'
    },
    {
      id: 'request-harvest',
      emoji: '🪓',
      title: 'Request Harvesting',
      description: 'Request professional harvesting services.',
      path: '/landowner/request-harvest',
      accentColor: 'border-amber-500/40 hover:border-amber-500 hover:bg-amber-500/5'
    },
    {
      id: 'list-timber',
      emoji: '🪵',
      title: 'List Timber',
      description: 'List harvested timber on the marketplace.',
      path: '/landowner/create-timber-listing',
      accentColor: 'border-emerald/40 hover:border-emerald hover:bg-emerald/5'
    }
  ];

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        {/* Main Workspace Container */}
        <div className="dashboard-workspace">

          {/* Center Main Dashboard Content */}
          <main className="dashboard-content">

            {/* HERO WELCOME SECTION */}
            <section className="hero-welcome-card card">
              <div className="hero-welcome-body">
                <div className="hero-welcome-text">
                  <span className="hero-greeting-badge">
                    <ShieldCheck size={14} /> Enterprise Commercial Forestry
                  </span>
                  <h1 className="hero-title-text">Good Morning, {userName}</h1>
                  <p className="hero-subtitle-text">
                    Manage your forest estates, tree inventory, harvesting operations, and timber sales.
                  </p>

                  {/* Summary Metric Pills */}
                  <div className="today-summary-pills">
                    <div className="summary-pill">
                      <span className="pill-dot bg-emerald"></span>
                      <span className="pill-val">{properties.length}</span> Registered Properties
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-gold"></span>
                      <span className="pill-val">{harvestRequests.length}</span> Harvest Requests
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-blue"></span>
                      <span className="pill-val">${estRevenue.toLocaleString()}</span> Est. Revenue
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-muted"></span>
                      <span className="pill-val">{timberListings.length}</span> Active Listings
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* QUICK ACTIONS SECTION (EXACTLY 4 VISUALLY SIMPLE CARDS)   */}
            {/* ========================================================= */}
            <section className="dashboard-section mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-main flex items-center gap-2">
                    Quick Actions
                  </h2>
                  <p className="text-xs text-muted">Initiate landowner actions for your forest estates and timber operations.</p>
                </div>
              </div>

              {/* 4 CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <div
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className={`card p-5 border rounded-xl bg-card cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-card group flex flex-col justify-between ${action.accentColor}`}
                  >
                    <div>
                      {/* Emoji Icon Header */}
                      <div className="text-3xl mb-3 p-2.5 w-12 h-12 rounded-xl bg-surface border border-color flex items-center justify-center group-hover:scale-110 transition-transform">
                        {action.emoji}
                      </div>

                      {/* Action Title */}
                      <h3 className="text-base font-bold text-main group-hover:text-emerald transition-colors mb-1">
                        {action.title}
                      </h3>

                      {/* One-Line Description */}
                      <p className="text-xs text-muted leading-relaxed">
                        {action.description}
                      </p>
                    </div>

                    {/* Arrow / Chevron Footer */}
                    <div className="mt-4 pt-3 border-t border-color/40 flex items-center justify-between text-xs font-semibold text-emerald">
                      <span>Start Action</span>
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* UNIFORM KPI CARDS */}
            <section className="kpi-grid">
              {/* Card 1 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-emerald">
                    <Trees size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> Live Total
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">{totalManagedArea > 0 ? `${totalManagedArea} Acres` : '0 Acres'}</div>
                  <div className="kpi-label">Total Managed Area</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 18 Q 20 12, 40 15 T 80 8 T 100 4" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-forest">
                    <Calculator size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> Standing Volume
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">{totalTimberVolume > 0 ? `${totalTimberVolume.toLocaleString()} m³` : '0 m³'}</div>
                  <div className="kpi-label">Est. Timber Volume</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 20 Q 25 18, 50 10 T 75 14 T 100 5" fill="none" stroke="#34d399" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-amber">
                    <Scale size={20} />
                  </span>
                  <span className="kpi-trend trend-neutral">
                    {bids.length} Active
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">{bids.length} Bids</div>
                  <div className="kpi-label">Contractor Bids</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 12 Q 25 15, 50 8 T 75 12 T 100 7" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-blue">
                    <DollarSign size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> Market Value
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">${estRevenue.toLocaleString()}</div>
                  <div className="kpi-label">Est. Timber Revenue</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 19 Q 20 14, 40 16 T 70 6 T 100 2" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* ACTIVE HARVEST HIGHLIGHT SECTION */}
            <section className="active-harvest-section card highlight-card">
              <div className="card-header">
                <div className="section-header-title">
                  <span className="live-indicator"><span className="pulse-dot"></span> LIVE OPERATION</span>
                  <h2 className="section-heading">Active Harvest Spotlight</h2>
                </div>
                <span className={`status-chip ${activeSpotlight ? 'status-chip-active' : 'bg-slate-800 text-slate-400'}`}>
                  {activeSpotlight ? (activeSpotlight.status || 'In Progress') : 'No Active Harvest'}
                </span>
              </div>

              {activeSpotlight ? (
                <div className="active-harvest-grid">
                  <div className="harvest-details-col">
                    <div className="harvest-primary-info">
                      <h3 className="harvest-property-title">{activeSpotlight.propertyName}</h3>
                      <p className="harvest-meta"><MapPin size={14} /> {activeSpotlight.location || 'Estate Plot'} • {activeSpotlight.harvestScopeDetail || activeSpotlight.reasonForHarvesting || 'Timber Operation'}</p>
                    </div>

                    <div className="harvest-stats-row">
                      <div className="h-stat">
                        <span className="h-stat-label">Contractor</span>
                        <span className="h-stat-value font-semibold">{activeSpotlight.contractor || 'Awaiting Responses'}</span>
                      </div>
                      <div className="h-stat">
                        <span className="h-stat-label">Est. Volume</span>
                        <span className="h-stat-value text-emerald font-bold">{activeSpotlight.estimatedVolume || 'N/A'}</span>
                      </div>
                      <div className="h-stat">
                        <span className="h-stat-label">Start Date</span>
                        <span className="h-stat-value">{activeSpotlight.preferredStartDate || activeSpotlight.submittedAt || 'Pending'}</span>
                      </div>
                      <div className="h-stat">
                        <span className="h-stat-label">Status</span>
                        <span className="h-stat-value text-emerald">{activeSpotlight.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-surface rounded-xl border border-color space-y-3">
                  <Axe size={36} className="mx-auto text-emerald/40" />
                  <p className="text-sm font-semibold text-main">No active harvest operations right now.</p>
                  <p className="text-xs text-muted max-w-sm mx-auto">Register your property, log your tree inventory, and submit a harvest request to get contractor bids.</p>
                  <button
                    onClick={() => navigate('/landowner/request-harvest')}
                    className="btn btn-primary btn-sm inline-flex items-center gap-1.5 font-bold shadow-glow"
                  >
                    <Plus size={15} /> Request Harvesting
                  </button>
                </div>
              )}
            </section>

            {/* REGISTERED PROPERTIES SECTION */}
            <section className="dashboard-section card">
              <div className="card-header">
                <div>
                  <h2 className="section-heading">My Timber Estates &amp; Parcels</h2>
                  <p className="section-subtext">Commercial forest stands registered under your portfolio</p>
                </div>
                <button
                  onClick={() => navigate('/landowner/properties')}
                  className="btn btn-outline btn-sm"
                >
                  View All Estates <ChevronRight size={14} />
                </button>
              </div>

              {properties.length > 0 ? (
                <div className="properties-grid">
                  {properties.slice(0, 3).map((p) => {
                    const pId = p.id || p._id;
                    const coverPhoto = p.photos && p.photos.length > 0 ? p.photos[0] : (p.image || 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80');
                    return (
                      <div key={pId} className="property-card">
                        <div className="property-image-wrapper">
                          <img src={coverPhoto} alt={p.propertyName} className="property-image" />
                          <span className="property-status-badge badge-status-active">
                            {p.status || 'Active Estate'}
                          </span>
                        </div>

                        <div className="property-content">
                          <h4 className="property-name">{p.propertyName}</h4>
                          <p className="property-location"><MapPin size={13} /> {p.district}, {p.state}</p>

                          <div className="property-specs">
                            <div className="spec-item">
                              <span className="spec-label">Area</span>
                              <span className="spec-val">{p.totalArea ? `${p.totalArea} ${p.areaUnit || 'Acres'}` : 'Plot'}</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Species</span>
                              <span className="spec-val">{p.mainSpecies || 'Trees Logged'}</span>
                            </div>
                            <div className="spec-item">
                              <span className="spec-label">Trees</span>
                              <span className="spec-val text-emerald font-bold">{p.approxTreesCount || 0}</span>
                            </div>
                          </div>

                          <div className="property-actions">
                            <button
                              onClick={() => navigate(`/landowner/add-inventory?propertyId=${pId}`)}
                              className="btn btn-secondary btn-xs"
                            >
                              Inventory
                            </button>
                            <button
                              onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)}
                              className="btn btn-outline btn-xs"
                            >
                              Harvest
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-surface rounded-xl border border-color space-y-3">
                  <Trees size={40} className="mx-auto text-emerald/40" />
                  <h4 className="text-base font-bold text-main">No Properties Registered Yet</h4>
                  <p className="text-xs text-muted max-w-md mx-auto">
                    Register your property to log tree species, track standing timber inventory, and request harvesting services.
                  </p>
                  <button
                    onClick={() => navigate('/landowner/register-property')}
                    className="btn btn-primary shadow-glow inline-flex items-center gap-1.5"
                  >
                    <Plus size={16} /> Register Property
                  </button>
                </div>
              )}
            </section>

            {/* BIDS RECEIVED TABLE & QUICK CALCULATOR */}
            <div className="two-col-grid">
              {/* Bids Table */}
              <section className="dashboard-section card flex-1">
                <div className="card-header">
                  <h2 className="section-heading"><Scale size={18} /> Contractor Bids Received</h2>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Contractor</th>
                        <th>Target Parcel</th>
                        <th>Bid Total</th>
                        <th>Rate</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((b) => (
                        <tr key={b.id}>
                          <td className="font-semibold">{b.contractor}</td>
                          <td className="text-muted">{b.plot}</td>
                          <td className="text-emerald font-bold">{b.bidAmount}</td>
                          <td>{b.ratePerM3}</td>
                          <td>
                            <span className={`status-pill ${b.status === 'Accepted' ? 'status-green' :
                                b.status === 'Rejected' ? 'status-red' : 'status-yellow'
                              }`}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            {b.status === 'Pending Review' ? (
                              <div className="action-btn-group">
                                <button
                                  className="btn-icon btn-icon-success"
                                  title="Accept Bid"
                                  onClick={() => handleBidStatus(b.id, 'Accepted')}
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  className="btn-icon btn-icon-danger"
                                  title="Reject Bid"
                                  onClick={() => handleBidStatus(b.id, 'Rejected')}
                                >
                                  <X size={15} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted text-xs">Complete</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Timber Estimator */}
              <section className="dashboard-section card flex-1">
                <div className="card-header">
                  <h2 className="section-heading"><Calculator size={18} /> Quick Timber Estimator</h2>
                </div>
                <div className="calculator-widget">
                  <div className="calc-inputs">
                    <div className="form-group">
                      <div className="slider-header">
                        <label>Tree Count</label>
                        <span className="slider-value font-bold">{treesCount} trees</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="2000"
                        step="25"
                        value={treesCount}
                        onChange={(e) => setTreesCount(Number(e.target.value))}
                        className="slider"
                      />
                    </div>

                    <div className="form-group">
                      <div className="slider-header">
                        <label>Avg Trunk DBH</label>
                        <span className="slider-value font-bold">{avgDbh} in</span>
                      </div>
                      <input
                        type="range"
                        min="8"
                        max="36"
                        step="1"
                        value={avgDbh}
                        onChange={(e) => setAvgDbh(Number(e.target.value))}
                        className="slider"
                      />
                    </div>
                  </div>

                  <div className="calc-results-pill">
                    <div className="calc-res-item">
                      <span className="calc-res-label">Est Yield</span>
                      <span className="calc-res-val text-emerald">{calculatedVolume} m³</span>
                    </div>
                    <div className="calc-res-divider"></div>
                    <div className="calc-res-item">
                      <span className="calc-res-label">Market Value</span>
                      <span className="calc-res-val text-gold">${estimatedValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

          </main>

          {/* RIGHT INSIGHTS PANEL */}
          <aside className="right-insights-panel">

            {/* Widget 1: Weather */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><CloudSun size={16} /> Timber Weather</span>
                <span className="widget-badge badge-green font-semibold">Optimal</span>
              </div>
              <div className="weather-content">
                <div className="weather-main">
                  <div className="weather-temp">64°F</div>
                  <div className="weather-desc">
                    <span className="font-semibold">Partly Cloudy</span>
                    <span className="text-muted text-xs">Willamette Valley / Kottayam</span>
                  </div>
                </div>
                <div className="weather-stats">
                  <div className="w-stat"><Wind size={12} /> Wind: 7 mph SW</div>
                  <div className="w-stat"><Droplets size={12} /> Humidity: 48%</div>
                </div>
              </div>
            </div>

            {/* Widget 2: Today's Tasks */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><CheckCircle2 size={16} /> Today's Operations</span>
                <span className="widget-count">3 Pending</span>
              </div>
              <ul className="task-list">
                <li className="task-item">
                  <input type="checkbox" id="t1" className="task-check" />
                  <label htmlFor="t1" className="task-label">Approve Apex Harvesting Bid</label>
                </li>
                <li className="task-item">
                  <input type="checkbox" id="t2" className="task-check" />
                  <label htmlFor="t2" className="task-label">Review Timber Audit Report</label>
                </li>
                <li className="task-item">
                  <input type="checkbox" id="t3" className="task-check" />
                  <label htmlFor="t3" className="task-label">Inspect Access Road Entrance</label>
                </li>
              </ul>
            </div>

            {/* Widget 3: Market Prices */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><DollarSign size={16} /> Log Market Index</span>
                <span className="text-xs text-muted">Regional</span>
              </div>
              <div className="market-prices">
                <div className="price-row">
                  <span className="species-name">Rubber Timber</span>
                  <span className="price-val font-bold">$115/m³</span>
                  <span className="price-change text-emerald">+2.4%</span>
                </div>
                <div className="price-row">
                  <span className="species-name">W. Red Cedar</span>
                  <span className="price-val font-bold">$140/m³</span>
                  <span className="price-change text-emerald">+1.8%</span>
                </div>
                <div className="price-row">
                  <span className="species-name">Teak Grade A</span>
                  <span className="price-val font-bold">$220/m³</span>
                  <span className="price-change text-emerald">+3.1%</span>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
};

export default LandownerDashboard;
