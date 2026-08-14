import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
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
  CloudSun,
  Wind,
  Droplets,
  Bell,
  Calendar,
  Layers,
  ChevronRight,
  X,
  FileText,
  Building,
  Award
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [selectedSpecies, setSelectedSpecies] = useState('All');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [orderVolume, setOrderVolume] = useState('100');
  const [deliveryMillLocation, setDeliveryMillLocation] = useState('Ernakulam Timber Mill Yard #2');
  const [paymentTerms, setPaymentTerms] = useState('Letter of Credit / Net 30');

  const [catalog, setCatalog] = useState([
    {
      id: 'log_1',
      species: 'Teakwood (Sawlogs Grade A1)',
      volume: '450 m³',
      rawVolumeNum: 450,
      grade: 'Export Sawlog Grade',
      location: 'Wayanad, Kerala',
      price: '₹ 42,500 / m³',
      unitPrice: 42500,
      origin: 'Wayanad Forest Parcel #3',
      fscCert: 'FSC-C012984 Verified'
    },
    {
      id: 'log_2',
      species: 'Rosewood (Peeler & Decorative Grade)',
      volume: '300 m³',
      rawVolumeNum: 300,
      grade: 'Premium Veneer Grade',
      location: 'Palakkad, Kerala',
      price: '₹ 58,000 / m³',
      unitPrice: 58000,
      origin: 'Palakkad Estate Stand #1',
      fscCert: 'FSC-C088210 Verified'
    },
    {
      id: 'log_3',
      species: 'Rubberwood (Seasoned Mill Quality)',
      volume: '600 m³',
      rawVolumeNum: 600,
      grade: 'Industrial Furniture Grade',
      location: 'Kottayam, Kerala',
      price: '₹ 12,800 / m³',
      unitPrice: 12800,
      origin: 'Kottayam Rubber Plantation',
      fscCert: 'PEFC Certified'
    },
    {
      id: 'log_4',
      species: 'Mahogany (Commercial Board Grade)',
      volume: '520 m³',
      rawVolumeNum: 520,
      grade: 'Joinery Grade #1',
      location: 'Idukki, Kerala',
      price: '₹ 24,000 / m³',
      unitPrice: 24000,
      origin: 'High Range Timber Reserve',
      fscCert: 'FSC-C099411 Verified'
    }
  ]);

  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-901',
      item: 'Teakwood Sawlogs (Grade A1)',
      volume: '200 m³',
      total: '₹ 85,000,00',
      status: 'In Transit',
      ETA: 'Aug 14, 2026',
      contractor: 'Apex Harvesting Co.',
      mill: 'Ernakulam Mill Yard #1'
    },
    {
      id: 'ORD-2026-882',
      item: 'Rosewood Veneer Logs',
      volume: '150 m³',
      total: '₹ 87,000,00',
      status: 'Delivered to Mill',
      ETA: 'Aug 02, 2026',
      contractor: 'Northwest Logging Ops',
      mill: 'Kochi Lumber Processing Port'
    }
  ]);

  const filteredCatalog = selectedSpecies === 'All'
    ? catalog
    : catalog.filter(item => item.species.toLowerCase().includes(selectedSpecies.toLowerCase()));

  const handleOpenOrderModal = (item) => {
    setSelectedLog(item);
    setOrderVolume('100');
    setShowOrderModal(true);
  };

  const handleConfirmOrder = (e) => {
    e.preventDefault();
    if (!selectedLog) return;

    const volNum = Number(orderVolume) || 100;
    const totalCost = volNum * selectedLog.unitPrice;

    const newOrder = {
      id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      item: `${selectedLog.species}`,
      volume: `${volNum} m³`,
      total: `₹ ${totalCost.toLocaleString('en-IN')}`,
      status: 'Processing Dispatch',
      ETA: 'Aug 22, 2026',
      contractor: 'Malabar Agro Transport',
      mill: deliveryMillLocation
    };

    setOrders([newOrder, ...orders]);
    setShowOrderModal(false);
  };

  const buyerName = user?.name || 'Pacific Lumber Mills';

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        {/* Main Workspace Container */}
        <div className="dashboard-workspace">

          {/* Center Main Dashboard Content */}
          <main className="dashboard-content">

            {/* HERO WELCOME CARD */}
            <section className="hero-welcome-card card">
              <div className="hero-welcome-body">
                <div className="hero-welcome-text">
                  <span className="hero-greeting-badge">
                    <Award size={14} /> FSC Certified Commercial Timber Procurement
                  </span>
                  <h1 className="hero-title-text">Welcome Back, {buyerName}</h1>
                  <p className="hero-subtitle-text">
                    Source verified timber log inventories from certified Kerala forest estates, submit purchase orders, and track mill deliveries.
                  </p>

                  {/* Summary Metric Pills */}
                  <div className="today-summary-pills">
                    <div className="summary-pill">
                      <span className="pill-dot bg-emerald"></span>
                      <span className="pill-val">1,870 m³</span> Available Volume
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-amber"></span>
                      <span className="pill-val">2</span> Active Shipments
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-blue"></span>
                      <span className="pill-val">₹ 1.72 Cr</span> Procurement Spend
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-muted"></span>
                      <span className="pill-val">4</span> Verified Estates
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons Beside Hero */}
                <div className="hero-quick-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleOpenOrderModal(catalog[0])}>
                    <ShoppingBag size={16} /> Procure Log Volume
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Truck size={16} /> Track Mill Shipments
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <FileText size={16} /> Download Invoices
                  </button>
                </div>
              </div>
            </section>

            {/* UNIFORM KPI CARDS */}
            <section className="kpi-grid">
              {/* Card 1 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-blue">
                    <ShoppingBag size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> +8.4%
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">1,870 m³</div>
                  <div className="kpi-label">Available Timber Inventory</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 18 Q 20 12, 40 15 T 80 8 T 100 4" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-amber">
                    <Truck size={20} />
                  </span>
                  <span className="kpi-trend trend-neutral">
                    In Transit
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">2 Shipments</div>
                  <div className="kpi-label">En-Route to Mill Yard</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 12 Q 25 15, 50 8 T 75 12 T 100 7" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-emerald">
                    <DollarSign size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> +14.2%
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">₹ 1.72 Cr</div>
                  <div className="kpi-label">Monthly Procurement Spend</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 20 Q 25 18, 50 10 T 75 14 T 100 5" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-forest">
                    <ShieldCheck size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    100% FSC Traceable
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">4 Estates</div>
                  <div className="kpi-label">Verified Timber Suppliers</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 19 Q 20 14, 40 16 T 70 6 T 100 2" fill="none" stroke="#34d399" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            {/* LIVE MILL TRANSIT OPERATIONS SPOTLIGHT */}
            <section className="active-harvest-section card highlight-card">
              <div className="card-header">
                <div className="section-header-title">
                  <span className="live-indicator"><span className="pulse-dot"></span> LIVE SHIPMENT IN TRANSIT</span>
                  <h2 className="section-heading">Timber Freight & Delivery Spotlight</h2>
                </div>
                <span className="status-chip status-chip-active">
                  On Schedule
                </span>
              </div>

              <div className="active-harvest-grid">
                <div className="harvest-details-col">
                  <div className="harvest-primary-info">
                    <h3 className="harvest-property-title">Order ORD-2026-901: Wayanad Teakwood Sawlogs</h3>
                    <p className="harvest-meta"><MapPin size={14} /> Wayanad Forest Yard → Ernakulam Mill Yard #1</p>
                  </div>

                  <div className="harvest-stats-row">
                    <div className="h-stat">
                      <span className="h-stat-label">Volume Transmitted</span>
                      <span className="h-stat-value text-emerald font-bold">200 m³ (4 Log Trucks)</span>
                    </div>
                    <div className="h-stat">
                      <span className="h-stat-label">Hauling Contractor</span>
                      <span className="h-stat-value font-semibold">Apex Harvesting Co.</span>
                    </div>
                    <div className="h-stat">
                      <span className="h-stat-label">Estimated Delivery</span>
                      <span className="h-stat-value">Aug 14, 2026 (14:00 hrs)</span>
                    </div>
                    <div className="h-stat">
                      <span className="h-stat-label">Forest Clearance</span>
                      <span className="h-stat-value text-emerald">Pass No. KL-8821 OK</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="harvest-progress-wrapper">
                    <div className="progress-label-bar">
                      <span>Highway Transit Progress (Wayanad to Ernakulam)</span>
                      <span className="progress-pct font-bold">75%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div className="harvest-timeline-col">
                  <span className="timeline-title">Logistics & Transit Milestones</span>
                  <div className="timeline-steps">
                    <div className="timeline-step step-complete">
                      <span className="step-icon"><CheckCircle2 size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Forest Yard Loading & Stenciling</span>
                        <span className="step-date">Completed Aug 08</span>
                      </div>
                    </div>
                    <div className="timeline-step step-complete">
                      <span className="step-icon"><CheckCircle2 size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Waybill & Transit Permit Verification</span>
                        <span className="step-date">Passed Checkpost</span>
                      </div>
                    </div>
                    <div className="timeline-step step-active">
                      <span className="step-icon"><Activity size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">NH-66 Highway Truck Transit</span>
                        <span className="step-date">Active (75% completed)</span>
                      </div>
                    </div>
                    <div className="timeline-step step-upcoming">
                      <span className="step-icon"><Clock size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Mill Gate Unloading & Moisture Inspection</span>
                        <span className="step-date">Est. Aug 14</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* VERIFIED TIMBER INVENTORY CATALOG */}
            <section className="dashboard-section card">
              <div className="card-header flex-between">
                <div>
                  <h2 className="section-heading"><Package size={18} /> Verified Kerala Timber Inventory Catalog</h2>
                  <p className="section-subtext">Direct procurement from certified forest landowners with timber origin tracking</p>
                </div>

                <div className="filter-group flex items-center gap-2">
                  <Filter size={16} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">Filter Species:</span>
                  <select
                    value={selectedSpecies}
                    onChange={(e) => setSelectedSpecies(e.target.value)}
                    className="select-input bg-slate-950 text-white font-medium border-slate-700 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    <option value="All">All Species</option>
                    <option value="Teakwood">Teakwood</option>
                    <option value="Rosewood">Rosewood</option>
                    <option value="Rubberwood">Rubberwood</option>
                    <option value="Mahogany">Mahogany</option>
                  </select>
                </div>
              </div>

              <div className="properties-grid">
                {filteredCatalog.map((item) => (
                  <div key={item.id} className="property-card">
                    <div className="property-content">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 flex items-center gap-1">
                          <ShieldCheck size={12} /> {item.fscCert}
                        </span>
                        <span className="text-xs text-slate-400 font-medium"><MapPin size={12} className="inline" /> {item.location}</span>
                      </div>

                      <h4 className="property-name text-base">{item.species}</h4>
                      <p className="text-xs text-slate-400 mb-3">Origin: <strong className="text-slate-200">{item.origin}</strong></p>

                      <div className="property-specs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                        <div className="spec-item">
                          <span className="spec-label">Available Volume</span>
                          <span className="spec-val text-emerald-400 font-bold">{item.volume}</span>
                        </div>
                        <div className="spec-item">
                          <span className="spec-label">Quality Grade</span>
                          <span className="spec-val text-slate-200">{item.grade}</span>
                        </div>
                      </div>

                      <div className="property-actions flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-base font-bold text-emerald-400">{item.price}</span>
                        <button
                          className="btn btn-sm btn-primary cursor-pointer flex items-center gap-1"
                          onClick={() => handleOpenOrderModal(item)}
                        >
                          Procure Log Volume <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PURCHASE ORDERS & MILL DELIVERY LOG TABLE */}
            <section className="dashboard-section card">
              <div className="card-header">
                <div>
                  <h2 className="section-heading"><Truck size={18} /> Purchase Orders & Delivery Log</h2>
                  <p className="section-subtext">Track procurement contracts, freight status, and delivery schedules</p>
                </div>
                <span className="dash-user-count font-semibold text-emerald">{orders.length} Active Orders</span>
              </div>

              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Timber Item</th>
                      <th>Volume</th>
                      <th>Contract Total</th>
                      <th>Hauling Partner</th>
                      <th>Destination Mill</th>
                      <th>Status</th>
                      <th>ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => (
                      <tr key={ord.id}>
                        <td className="font-semibold text-white">{ord.id}</td>
                        <td className="text-slate-200 font-medium">{ord.item}</td>
                        <td className="text-emerald-400 font-bold">{ord.volume}</td>
                        <td className="text-slate-100 font-bold">{ord.total}</td>
                        <td className="text-slate-300">{ord.contractor}</td>
                        <td className="text-slate-400 text-xs">{ord.mill}</td>
                        <td>
                          <span className={`status-pill ${ord.status.includes('Delivered') ? 'status-green' : 'status-yellow'}`}>
                            {ord.status.includes('Delivered') ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                            {ord.status}
                          </span>
                        </td>
                        <td className="text-slate-400 text-xs">{ord.ETA}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </main>

          {/* RIGHT INSIGHTS PANEL */}
          <aside className="right-insights-panel">

            {/* Widget 1: FSC Certification Status Card */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><ShieldCheck size={16} /> Certified Buyer Profile</span>
                <span className="widget-badge badge-green font-semibold">Verified</span>
              </div>
              <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/60 mt-2">
                <p className="text-xs text-blue-300 font-bold mb-1">Pacific Lumber Mills Inc.</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Authorized Timber Procurement Buyer. Verified FSC Chain of Custody (CoC) License #FSC-C99120.
                </p>
              </div>
            </div>

            {/* Widget 2: Timber Moisture & Logging Weather */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><CloudSun size={16} /> Yard Weather Index</span>
                <span className="widget-badge badge-green font-semibold">Optimal</span>
              </div>
              <div className="weather-content">
                <div className="weather-main">
                  <div className="weather-temp">29°C</div>
                  <div className="weather-desc">
                    <span className="font-semibold">Dry & Sunny</span>
                    <span className="text-muted text-xs">Kochi & Ernakulam Mills</span>
                  </div>
                </div>
                <div className="weather-stats">
                  <div className="w-stat"><Wind size={12} /> Wind: 9 km/h</div>
                  <div className="w-stat"><Droplets size={12} /> Log Moisture: 16%</div>
                </div>
              </div>
            </div>

            {/* Widget 3: Today's Procurement Tasks */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><CheckCircle2 size={16} /> Procurement Tasks</span>
                <span className="widget-count">3 Pending</span>
              </div>
              <ul className="task-list">
                <li className="task-item">
                  <input type="checkbox" id="bt1" className="task-check" />
                  <label htmlFor="bt1" className="task-label">Approve Wayanad Teak Weight Receipt</label>
                </li>
                <li className="task-item">
                  <input type="checkbox" id="bt2" className="task-check" />
                  <label htmlFor="bt2" className="task-label">Issue Payment for Rosewood Order #882</label>
                </li>
                <li className="task-item">
                  <input type="checkbox" id="bt3" className="task-check" />
                  <label htmlFor="bt3" className="task-label">Inspect Rubberwood Seasoning Quality</label>
                </li>
              </ul>
            </div>

            {/* Widget 4: Kerala Log Market Index (INR / m³) */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><DollarSign size={16} /> Log Market Index</span>
                <span className="text-xs text-muted">₹ / m³</span>
              </div>
              <div className="market-prices">
                <div className="price-row">
                  <span className="species-name">Teakwood (Sawlog)</span>
                  <span className="price-val font-bold">₹ 42,500</span>
                  <span className="price-change text-emerald">+2.4%</span>
                </div>
                <div className="price-row">
                  <span className="species-name">Rosewood (Veneer)</span>
                  <span className="price-val font-bold">₹ 58,000</span>
                  <span className="price-change text-emerald">+1.8%</span>
                </div>
                <div className="price-row">
                  <span className="species-name">Rubberwood</span>
                  <span className="price-val font-bold">₹ 12,800</span>
                  <span className="price-change text-emerald">+0.5%</span>
                </div>
                <div className="price-row">
                  <span className="species-name">Mahogany</span>
                  <span className="price-val font-bold">₹ 24,000</span>
                  <span className="price-change text-red">-0.8%</span>
                </div>
              </div>
            </div>

            {/* Widget 5: Freight & Mill Schedule */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><Calendar size={16} /> Mill Unloading Schedule</span>
              </div>
              <div className="schedule-list">
                <div className="sched-item">
                  <div className="sched-date">
                    <span className="sched-day">14</span>
                    <span className="sched-month">AUG</span>
                  </div>
                  <div className="sched-details">
                    <span className="sched-title font-semibold">Teakwood Unloading</span>
                    <span className="sched-location text-muted">Ernakulam Mill Yard #1</span>
                  </div>
                </div>
                <div className="sched-item">
                  <div className="sched-date">
                    <span className="sched-day">22</span>
                    <span className="sched-month">AUG</span>
                  </div>
                  <div className="sched-details">
                    <span className="sched-title font-semibold">Rubberwood Delivery</span>
                    <span className="sched-location text-muted">Kochi Processing Mill</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>

      {/* Procure Log Volume Modal */}
      {showOrderModal && selectedLog && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-lg w-full">
            <div className="modal-header flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald-400" />
                <span>Initiate Log Procurement Order</span>
              </h3>
              <button className="btn-icon cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowOrderModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmOrder} className="modal-body space-y-4 pt-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-white text-sm">{selectedLog.species}</p>
                <p className="text-slate-300">Grade: {selectedLog.grade} • Origin: {selectedLog.origin}</p>
                <p className="text-emerald-400 font-semibold">Unit Price: {selectedLog.price} • Available: {selectedLog.volume}</p>
              </div>

              <div className="form-group">
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Procurement Volume Quantity (m³) *
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max={selectedLog.rawVolumeNum}
                  value={orderVolume}
                  onChange={(e) => setOrderVolume(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-white font-bold"
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Mill / Delivery Destination (Kerala) *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryMillLocation}
                  onChange={(e) => setDeliveryMillLocation(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-slate-200 text-xs"
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment & Credit Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-slate-200 text-xs cursor-pointer"
                >
                  <option value="Letter of Credit / Net 30">Letter of Credit (Net 30 Days)</option>
                  <option value="Direct Bank Wire Transfer">Direct Bank Wire Transfer (FOB)</option>
                  <option value="Escrow Milestone Payment">TreeConnect Escrow Protected</option>
                </select>
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Estimated Total Cost:</span>
                <span className="text-emerald-400 font-bold text-base">
                  ₹ {((Number(orderVolume) || 100) * selectedLog.unitPrice).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="modal-actions flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={15} /> Confirm & Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
