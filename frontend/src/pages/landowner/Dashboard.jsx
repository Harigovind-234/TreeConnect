import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLandowner } from '../../context/LandownerContext';
import './LandownerDashboard.css';
import {
  Trees,
  Scale,
  Plus,
  Calculator,
  MapPin,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  CloudSun,
  CheckCircle2,
  DollarSign,
  Wind,
  Droplets,
  ChevronRight,
  Sprout,
  Leaf,
  TrendingUp
} from 'lucide-react';

const LandownerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Safely extract landowner context state with array fallbacks
  const landownerCtx = useLandowner() || {};
  const properties = landownerCtx.properties || [];
  const inventories = landownerCtx.inventories || [];
  const harvestRequests = landownerCtx.harvestRequests || [];
  const timberListings = landownerCtx.timberListings || [];
  const completedHarvests = landownerCtx.completedHarvests || [];
  const refreshProperties = landownerCtx.refreshProperties;

  useEffect(() => {
    if (refreshProperties) {
      refreshProperties();
    }
  }, []);

  // Stateful Demo Contractor Bids
  const [bids, setBids] = useState([
    {
      id: 'bid-101',
      contractor: 'Apex Timber Harvesting Ltd.',
      plot: 'Green Valley Teak Plantation',
      bidAmount: '$48,500',
      ratePerM3: '$120/m³',
      status: 'Pending Review',
      submittedAt: 'Today, 09:30 AM'
    },
    {
      id: 'bid-102',
      contractor: 'Highland Forestry Services',
      plot: 'Pine Forest Parcel B',
      bidAmount: '$32,400',
      ratePerM3: '$112/m³',
      status: 'Accepted',
      submittedAt: 'Yesterday'
    },
    {
      id: 'bid-103',
      contractor: 'Cascade Loggers Co.',
      plot: 'Cedar Estate Block 4',
      bidAmount: '$27,800',
      ratePerM3: '$110/m³',
      status: 'Pending Review',
      submittedAt: '2 days ago'
    }
  ]);

  // Calculate dynamic metrics strictly from user properties and inventories
  const totalManagedArea = (properties || []).reduce((acc, p) => acc + (parseFloat(p.totalArea) || 0), 0);
  const totalTimberVolume = (inventories || []).reduce((acc, inv) => {
    const invVol = ((inv && inv.speciesList) || []).reduce((sAcc, sp) => {
      const vol = parseFloat(sp.estimatedVolume) || (parseFloat(sp.numberOfTrees || sp.count || 0) * 0.7);
      return sAcc + vol;
    }, 0);
    return acc + invVol;
  }, 0);

  const estRevenue = Math.round(totalTimberVolume * 115);

  // Latest Active Operation or Request (strictly user records with safe fallback)
  const activeSpotlight = (harvestRequests && harvestRequests.length > 0)
    ? harvestRequests[0]
    : ((completedHarvests && completedHarvests.length > 0) 
        ? completedHarvests[0] 
        : {
            status: 'Operational Ready',
            propertyName: properties[0]?.propertyName || 'Green Valley Plantation Estate',
            location: properties[0]?.district || properties[0]?.address || 'Kottayam Sector 4',
            harvestScopeDetail: 'Teak & Hardwood Selection',
            preferredStartDate: 'Oct 01, 2026',
            contractor: 'Apex Timber Harvesting Ltd',
            estimatedVolume: '240 m³'
          });

  // Quick Calculator state
  const [treesCount, setTreesCount] = useState(250);
  const [avgDbh, setAvgDbh] = useState(18); // Diameter at Breast Height in inches

  // Volume estimation formula
  const calculatedVolume = Math.round(treesCount * Math.pow(avgDbh * 2.54 / 200, 2) * 3.14159 * 18 * 0.5 * 10) / 10;
  const estimatedValue = Math.round(calculatedVolume * 115);

  const handleBidStatus = (id, newStatus) => {
    setBids(bids.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const userName = user?.name || 'Harigovind D Nair';

  // 4 QUICK ACTIONS DEFINITION
  const quickActions = [
    {
      id: 'register-property',
      emoji: '🌳',
      title: 'Register Property',
      description: 'Add a forest estate or plantation parcel.',
      path: '/landowner/register-property'
    },
    {
      id: 'add-inventory',
      emoji: '🌲',
      title: 'Add Tree Inventory',
      description: 'Record standing trees and timber species.',
      path: '/landowner/add-inventory'
    },
    {
      id: 'request-harvest',
      emoji: '🪓',
      title: 'Request Harvesting',
      description: 'Submit plots to logging contractors for bids.',
      path: '/landowner/request-harvest'
    },
    {
      id: 'list-timber',
      emoji: '🪵',
      title: 'List Timber Logs',
      description: 'Sell harvested timber on the marketplace.',
      path: '/landowner/create-timber-listing'
    }
  ];

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        {/* Main Workspace Centered Layout */}
        <div className="landowner-dashboard-workspace">

          {/* 1. HERO COMMERCIAL FORESTRY PORTFOLIO CARD */}
          <section className="ld-card ld-hero-card">
            <div className="ld-hero-tag">
              <ShieldCheck size={14} /> COMMERCIAL FORESTRY PORTFOLIO
            </div>
            
            <h1 className="ld-hero-heading">Good Morning, {userName}</h1>
            
            <p className="ld-hero-subtext">
              Manage your timber estates, track standing volume estimates, accept contractor bidding requests, and monitor market revenue.
            </p>

            {/* Summary Pills Row */}
            <div className="ld-pills-row">
              <div className="ld-pill">
                <span className="ld-dot ld-dot-green"></span>
                <span><strong>{properties.length}</strong> Estates Registered</span>
              </div>
              <div className="ld-pill">
                <span className="ld-dot ld-dot-amber"></span>
                <span><strong>{harvestRequests.length}</strong> Harvest Requests Active</span>
              </div>
              <div className="ld-pill">
                <span className="ld-dot ld-dot-blue"></span>
                <span><strong>${estRevenue || 0}</strong> Est. Revenue Valuation</span>
              </div>
              <div className="ld-pill">
                <span className="ld-dot ld-dot-teal"></span>
                <span><strong>{bids.length}</strong> Offers Received</span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="ld-hero-buttons">
              <button onClick={() => navigate('/landowner/register-property')} className="ld-btn-green">
                <Plus size={18} /> Register New Estate
              </button>
              <button onClick={() => navigate('/landowner/add-inventory')} className="ld-btn-outline">
                <Sprout size={18} /> Log Tree Standing
              </button>
            </div>
          </section>

          {/* 2. 3-COLUMN WIDGETS ROW */}
          <div className="ld-widgets-grid">
            
            {/* Widget 1: Regional Weather */}
            <div className="ld-widget-card">
              <div className="ld-widget-header">
                <span className="ld-widget-title">
                  <CloudSun size={18} className="text-emerald-400" /> Regional Weather
                </span>
                <span className="ld-badge-green">Harvest Optimal</span>
              </div>
              <div className="ld-weather-body">
                <div>
                  <div className="ld-weather-temp">64°F</div>
                  <div className="ld-weather-location">Partly Cloudy • Willamette / Kottayam</div>
                </div>
                <div className="ld-weather-stats">
                  <div className="flex items-center gap-1 justify-end"><Wind size={13} /> 7 mph SW</div>
                  <div className="flex items-center gap-1 justify-end"><Droplets size={13} /> 48% Hum</div>
                </div>
              </div>
            </div>

            {/* Widget 2: Today's Tasks */}
            <div className="ld-widget-card">
              <div className="ld-widget-header">
                <span className="ld-widget-title">
                  <CheckCircle2 size={18} className="text-emerald-400" /> Today's Tasks
                </span>
                <span className="ld-badge-amber">3 Action Items</span>
              </div>
              <div className="ld-task-list">
                <label className="ld-task-row">
                  <input type="checkbox" id="t-chk-1" />
                  <span>Approve Apex Harvesting Bid</span>
                </label>
                <label className="ld-task-row">
                  <input type="checkbox" id="t-chk-2" />
                  <span>Review Q3 Timber Volume Audit Report</span>
                </label>
                <label className="ld-task-row">
                  <input type="checkbox" id="t-chk-3" />
                  <span>Verify Sector 4 Access Road Entrance</span>
                </label>
              </div>
            </div>

            {/* Widget 3: Spot Rate Index */}
            <div className="ld-widget-card">
              <div className="ld-widget-header">
                <span className="ld-widget-title">
                  <DollarSign size={18} className="text-emerald-400" /> Spot Rate Index
                </span>
                <span className="ld-badge-live">LIVE RATES</span>
              </div>
              <div className="ld-spot-list">
                <div className="ld-spot-item">
                  <span className="ld-spot-name">Rubber Wood Logs</span>
                  <div>
                    <span className="ld-spot-price">$115/m³</span>
                    <span className="ld-spot-up">+2.4%</span>
                  </div>
                </div>
                <div className="ld-spot-item">
                  <span className="ld-spot-name">Western Red Cedar</span>
                  <div>
                    <span className="ld-spot-price">$140/m³</span>
                    <span className="ld-spot-up">+1.8%</span>
                  </div>
                </div>
                <div className="ld-spot-item">
                  <span className="ld-spot-name">Teak Grade A</span>
                  <div>
                    <span className="ld-spot-price">$220/m³</span>
                    <span className="ld-spot-up">+3.1%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 3. QUICK ACTIONS GRID */}
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-white tracking-tight">Landowner Shortcuts</h2>
            <div className="ld-quick-grid">
              {quickActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => navigate(action.path)}
                  className="ld-quick-card group"
                >
                  <div>
                    <div className="ld-quick-emoji">{action.emoji}</div>
                    <h3 className="ld-quick-title group-hover:text-emerald-400 transition-colors">{action.title}</h3>
                    <p className="ld-quick-sub">{action.description}</p>
                  </div>
                  <div className="ld-quick-link">
                    <span>Initiate</span>
                    <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. UNIFORM KPI CARDS */}
          <section className="ld-kpi-grid">
            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon"><Trees size={20} /></div>
                <span className="ld-badge-green flex items-center gap-1"><TrendingUp size={12} /> +12.5% YoY</span>
              </div>
              <div>
                <div className="ld-kpi-number">{totalManagedArea} Acres</div>
                <div className="ld-kpi-label">Total Managed Land</div>
              </div>
            </div>

            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon"><Calculator size={20} /></div>
                <span className="ld-badge-green flex items-center gap-1"><TrendingUp size={12} /> High Yield</span>
              </div>
              <div>
                <div className="ld-kpi-number">{totalTimberVolume.toLocaleString()} m³</div>
                <div className="ld-kpi-label">Est. Standing Volume</div>
              </div>
            </div>

            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon text-amber-400 bg-amber-500/10 border-amber-500/20"><Scale size={20} /></div>
                <span className="ld-badge-amber">{bids.length} Active</span>
              </div>
              <div>
                <div className="ld-kpi-number">{bids.length} Offers</div>
                <div className="ld-kpi-label">Contractor Bids Received</div>
              </div>
            </div>

            <div className="ld-kpi-box">
              <div className="ld-kpi-header">
                <div className="ld-kpi-icon text-blue-400 bg-blue-500/10 border-blue-500/20"><DollarSign size={20} /></div>
                <span className="ld-badge-live flex items-center gap-1"><TrendingUp size={12} /> Live Rate</span>
              </div>
              <div>
                <div className="ld-kpi-number">${estRevenue.toLocaleString()}</div>
                <div className="ld-kpi-label">Est. Timber Revenue</div>
              </div>
            </div>
          </section>

          {/* 5. ACTIVE HARVEST SPOTLIGHT */}
          <section className="ld-spotlight-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="ld-dot ld-dot-green animate-pulse"></span>
                <h2 className="text-lg font-extrabold text-white">Active Harvest Operation Spotlight</h2>
              </div>
              <span className="ld-badge-green">{activeSpotlight?.status || 'In Progress'}</span>
            </div>

            <div className="ld-spotlight-inner">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">{activeSpotlight?.propertyName || 'Estate Harvest Operation'}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <MapPin size={14} className="text-emerald-400" />
                    <span>{activeSpotlight?.location || 'Estate Plot'} • {activeSpotlight?.harvestScopeDetail || 'Timber Operation'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-semibold">Completion Target</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">{activeSpotlight?.preferredStartDate || 'Sep 15, 2026'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Harvest Logging Progress</span>
                  <span className="text-emerald-400">45% Completed (144 / 320 m³)</span>
                </div>
                <div className="ld-progress-bg">
                  <div className="ld-progress-fill" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Contractor</span>
                  <span className="font-bold text-white mt-0.5 block">{activeSpotlight?.contractor || 'Apex Timber Harvesting'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Est. Volume</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">{activeSpotlight?.estimatedVolume || '320 m³'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Log Destination</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">Kottayam Sawmill</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Audit Code</span>
                  <span className="font-mono text-emerald-400 mt-0.5 block">#TH-2026-88B</span>
                </div>
              </div>
            </div>
          </section>

          {/* 6. REGISTERED PROPERTIES PORTFOLIO */}
          <section className="ld-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-extrabold text-white">Registered Timber Estates</h2>
                <p className="text-xs text-slate-400">Commercial forest stands registered under your portfolio</p>
              </div>
              <button onClick={() => navigate('/landowner/properties')} className="ld-btn-outline py-1.5 px-3 text-xs">
                View All ({properties.length}) <ChevronRight size={14} />
              </button>
            </div>

            {properties.length === 0 ? (
              <div className="text-center py-10 space-y-3 bg-[#0a0f0d]/50 rounded-2xl border border-slate-800/80">
                <Trees size={40} className="text-emerald-500/40 mx-auto" />
                <h3 className="font-bold text-white text-sm">No Registered Timber Estates</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  You have not registered any timber estates yet. Click below to add your property.
                </p>
                <button onClick={() => navigate('/landowner/register-property')} className="ld-btn-green text-xs py-2 px-4 mx-auto inline-flex items-center gap-1.5" style={{ width: 'auto' }}>
                  <Plus size={14} /> Register Property
                </button>
              </div>
            ) : (
              <div className="ld-estates-grid">
                {properties.slice(0, 3).map((p) => {
                  const pId = p.id || p._id;
                  const coverPhoto = p.photos && p.photos.length > 0 ? p.photos[0] : (p.image || 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=600&q=80');
                  return (
                    <div key={pId} className="ld-estate-item group">
                      <div>
                        <div className="ld-estate-cover">
                          <img src={coverPhoto} alt={p.propertyName} className="ld-estate-img" />
                          <span className="absolute top-3 right-3 ld-badge-green shadow">
                            {p.status || 'Active Estate'}
                          </span>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">{p.propertyName}</h4>
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={13} className="text-emerald-400 shrink-0" /> {p.district || p.address || 'Kerala'}, {p.state || 'Kerala'}</p>
                          </div>

                          <div className="bg-[#14171d] border border-slate-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Area</span>
                              <span className="font-bold text-white mt-0.5 block">{p.totalArea ? `${p.totalArea} ${p.areaUnit || 'Acres'}` : 'Plot'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                              <span className="font-bold text-white mt-0.5 block truncate">{p.propertyType || p.mainSpecies || 'Estate'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Trees</span>
                              <span className="font-extrabold text-emerald-400 mt-0.5 block">{p.approxTreesCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex items-center gap-2">
                        <button onClick={() => navigate(`/landowner/add-inventory?propertyId=${pId}`)} className="ld-btn-outline flex-1 text-xs py-2 px-2 justify-center">
                          + Inventory
                        </button>
                        <button onClick={() => navigate(`/landowner/request-harvest?propertyId=${pId}`)} className="ld-btn-outline flex-1 text-xs py-2 px-2 justify-center text-amber-400 border-amber-500/30">
                          Harvest
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 7. BIDS TABLE & QUICK ESTIMATOR */}
          <div className="ld-split-grid">
            {/* Contractor Bids Table */}
            <section className="ld-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Scale size={18} className="text-emerald-400" /> Contractor Bids Received
                </h2>
                <span className="text-xs text-slate-400">{bids.length} Active Bids</span>
              </div>
              <div className="overflow-x-auto">
                <table className="ld-table">
                  <thead>
                    <tr>
                      <th>Contractor</th>
                      <th>Target Parcel</th>
                      <th>Bid Total</th>
                      <th>Rate</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((b) => (
                      <tr key={b.id}>
                        <td className="font-bold text-white">{b.contractor}</td>
                        <td className="text-slate-300">{b.plot}</td>
                        <td className="text-emerald-400 font-extrabold">{b.bidAmount}</td>
                        <td>{b.ratePerM3}</td>
                        <td>
                          <span className={b.status === 'Accepted' ? 'ld-badge-green' : b.status === 'Rejected' ? 'ld-badge-live' : 'ld-badge-amber'}>
                            {b.status}
                          </span>
                        </td>
                        <td className="text-right">
                          {b.status === 'Pending Review' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-pointer transition-colors"
                                title="Accept Bid"
                                onClick={() => handleBidStatus(b.id, 'Accepted')}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 cursor-pointer transition-colors"
                                title="Reject Bid"
                                onClick={() => handleBidStatus(b.id, 'Rejected')}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs font-semibold">Complete</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Quick Timber Volume Estimator */}
            <section className="ld-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Calculator size={18} className="text-emerald-400" /> Quick Timber Estimator
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Tree Count</span>
                    <span className="text-white text-sm font-black">{treesCount} trees</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="25"
                    value={treesCount}
                    onChange={(e) => setTreesCount(Number(e.target.value))}
                    className="ld-slider-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Avg Trunk DBH (Inches)</span>
                    <span className="text-white text-sm font-black">{avgDbh} in</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="36"
                    step="1"
                    value={avgDbh}
                    onChange={(e) => setAvgDbh(Number(e.target.value))}
                    className="ld-slider-input"
                  />
                </div>

                <div className="bg-[#0f1115] border border-slate-800 rounded-xl p-4 flex items-center justify-around text-center mt-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Est Volume</span>
                    <span className="text-xl font-extrabold text-emerald-400 block mt-0.5">{calculatedVolume} m³</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800"></div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Market Revenue</span>
                    <span className="text-xl font-extrabold text-amber-400 block mt-0.5">${estimatedValue.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 8. ENVIRONMENTAL & CARBON OFFSET IMPACT */}
          <section className="ld-card flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                <Leaf size={14} /> Environmental &amp; Carbon Offset Rating
              </div>
              <h3 className="text-base font-bold text-white">Sustainable Commercial Forestry Rating</h3>
              <p className="text-xs text-slate-400">Your managed forest parcels absorb CO₂ emissions and support regional biodiversity.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CO₂ Sequestration</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">~420 Tons/Yr</span>
              </div>
              <div className="w-px h-8 bg-slate-800"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Forest Health</span>
                <span className="text-xl font-black text-white mt-0.5 block">94% Optimal</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default LandownerDashboard;
