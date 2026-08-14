import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Compass,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  TrendingUp,
  ShieldCheck,
  Plus,
  DollarSign,
  Calculator,
  Activity,
  CloudSun,
  Wind,
  Droplets,
  Bell,
  Calendar,
  Layers,
  ChevronRight,
  X,
  AlertTriangle,
  Award
} from 'lucide-react';

const ContractorDashboard = () => {
  const { user } = useAuth();
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidAmountInput, setBidAmountInput] = useState('');
  const [bidRateInput, setBidRateInput] = useState('');
  const [bidNotesInput, setBidNotesInput] = useState('');

  const [jobs, setJobs] = useState([
    {
      id: 'job_1',
      owner: 'Robert Pine / Green Valley Estate',
      parcel: 'Wayanad Teak & Hardwood Plantation (35 Acres)',
      location: 'Wayanad, Kerala',
      species: 'Teakwood & Rosewood',
      volume: '850 m³',
      deadline: 'Aug 28, 2026',
      estBudget: '₹ 14,50,000',
      myBid: null
    },
    {
      id: 'job_2',
      owner: 'Pacific Lumber & Timber Co.',
      parcel: 'Palakkad Rubberwood Stand #9',
      location: 'Palakkad, Kerala',
      species: 'Rubberwood & Mahogany',
      volume: '1,400 m³',
      deadline: 'Sep 15, 2026',
      estBudget: '₹ 18,20,000',
      myBid: '₹ 17,80,000'
    },
    {
      id: 'job_3',
      owner: 'Malabar Agro Forestry Ltd.',
      parcel: 'Kozhikode Coastal Timber Lot #2',
      location: 'Kozhikode, Kerala',
      species: 'Jackwood & Softwood',
      volume: '620 m³',
      deadline: 'Sep 05, 2026',
      estBudget: '₹ 8,90,000',
      myBid: null
    }
  ]);

  const [fleetEquipment, setFleetEquipment] = useState([
    { id: 1, name: 'Caterpillar 545D Skidder', category: 'Skidder', status: 'In Operation', location: 'Wayanad Stand #1', operator: 'Dave Miller', lastService: '2026-07-20' },
    { id: 2, name: 'Tigercat 870D Feller Buncher', category: 'Feller Buncher', status: 'In Operation', location: 'Wayanad Stand #1', operator: 'Sarah Jenkins', lastService: '2026-07-15' },
    { id: 3, name: 'Komatsu XT445L-5 Harvester', category: 'Harvester', status: 'Maintenance', location: 'Central Workshop', operator: 'Unassigned', lastService: '2026-08-01' },
    { id: 4, name: 'Volvo FMX Log Hauler Truck', category: 'Log Truck', status: 'In Operation', location: 'Palakkad Route #4', operator: 'Rajesh Kumar', lastService: '2026-07-28' }
  ]);

  const contractorName = user?.name || 'Apex Harvesting Co.';

  const handleOpenBidModal = (job) => {
    setSelectedJob(job);
    setBidAmountInput('');
    setBidRateInput('');
    setBidNotesInput('');
    setShowBidModal(true);
  };

  const handleSubmitBid = (e) => {
    e.preventDefault();
    if (!bidAmountInput || !selectedJob) return;

    setJobs(jobs.map(j => j.id === selectedJob.id ? { ...j, myBid: `₹ ${Number(bidAmountInput).toLocaleString('en-IN')}` } : j));
    setShowBidModal(false);
  };

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
                    <Award size={14} /> Verified Kerala Harvesting Contractor
                  </span>
                  <h1 className="hero-title-text">Welcome Back, {contractorName}</h1>
                  <p className="hero-subtitle-text">
                    Monitor available timber harvest listings, submit competitive bids, and manage heavy logging machinery.
                  </p>

                  {/* Summary Metric Pills */}
                  <div className="today-summary-pills">
                    <div className="summary-pill">
                      <span className="pill-dot bg-amber"></span>
                      <span className="pill-val">4</span> Heavy Machines
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-emerald"></span>
                      <span className="pill-val">3</span> Available Jobs
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-blue"></span>
                      <span className="pill-val">₹ 17.8L</span> Active Bids
                    </div>
                    <div className="summary-pill">
                      <span className="pill-dot bg-muted"></span>
                      <span className="pill-val">1</span> Ongoing Project
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons Beside Hero */}
                <div className="hero-quick-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleOpenBidModal(jobs[0])}>
                    <Send size={16} /> Submit Harvest Bid
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <Truck size={16} /> Add Machinery
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <FileText size={16} /> Transport Permits
                  </button>
                </div>
              </div>
            </section>

            {/* UNIFORM KPI CARDS */}
            <section className="kpi-grid">
              {/* Card 1 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-amber">
                    <Truck size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> 3 Active
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">4 Machines</div>
                  <div className="kpi-label">Heavy Logging Fleet</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 16 Q 20 10, 40 14 T 80 6 T 100 2" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-forest">
                    <Compass size={20} />
                  </span>
                  <span className="kpi-trend trend-positive">
                    <TrendingUp size={12} /> 3 New
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">3 Listings</div>
                  <div className="kpi-label">Available Timber Jobs</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 20 Q 25 14, 50 8 T 75 12 T 100 4" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="kpi-card">
                <div className="kpi-card-header">
                  <span className="kpi-icon-box icon-emerald">
                    <FileText size={20} />
                  </span>
                  <span className="kpi-trend trend-neutral">
                    In Progress
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">1 Contract</div>
                  <div className="kpi-label">Active Harvesting Project</div>
                  <div className="kpi-sparkline">
                    <svg viewBox="0 0 100 24" className="sparkline-svg">
                      <path d="M0 12 Q 25 15, 50 8 T 75 12 T 100 7" fill="none" stroke="#34d399" strokeWidth="2.5" />
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
                    <TrendingUp size={12} /> ₹ 17.8L
                  </span>
                </div>
                <div className="kpi-card-body">
                  <div className="kpi-value">₹ 17,80,000</div>
                  <div className="kpi-label">Active Bid Volume</div>
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
                  <span className="live-indicator"><span className="pulse-dot"></span> HARVEST OPERATION IN PROGRESS</span>
                  <h2 className="section-heading">Current Field Operation Spotlight</h2>
                </div>
                <span className="status-chip status-chip-active">
                  Field Active
                </span>
              </div>

              <div className="active-harvest-grid">
                <div className="harvest-details-col">
                  <div className="harvest-primary-info">
                    <h3 className="harvest-property-title">Wayanad Teak & Hardwood Stand #1</h3>
                    <p className="harvest-meta"><MapPin size={14} /> Wayanad, Kerala • Mature Teakwood & Rosewood</p>
                  </div>

                  <div className="harvest-stats-row">
                    <div className="h-stat">
                      <span className="h-stat-label">Land Owner</span>
                      <span className="h-stat-value font-semibold">Robert Pine</span>
                    </div>
                    <div className="h-stat">
                      <span className="h-stat-label">Target Volume</span>
                      <span className="h-stat-value text-emerald font-bold">850 m³</span>
                    </div>
                    <div className="h-stat">
                      <span className="h-stat-label">Est. Completion</span>
                      <span className="h-stat-value">Sep 12, 2026</span>
                    </div>
                    <div className="h-stat">
                      <span className="h-stat-label">Equipment Onsite</span>
                      <span className="h-stat-value text-emerald">2 Machinery Units</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="harvest-progress-wrapper">
                    <div className="progress-label-bar">
                      <span>Harvesting & Log Skidding Progress</span>
                      <span className="progress-pct font-bold">42%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '42%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Milestone Timeline */}
                <div className="harvest-timeline-col">
                  <span className="timeline-title">Contractor Field Milestones</span>
                  <div className="timeline-steps">
                    <div className="timeline-step step-complete">
                      <span className="step-icon"><CheckCircle2 size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Forest Permit & Transport Clearance</span>
                        <span className="step-date">Approved Aug 02</span>
                      </div>
                    </div>
                    <div className="timeline-step step-active">
                      <span className="step-icon"><Activity size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Tree Felling & Stem Bucking</span>
                        <span className="step-date">In Progress (42%)</span>
                      </div>
                    </div>
                    <div className="timeline-step step-upcoming">
                      <span className="step-icon"><Clock size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Skidding & Yard Stacking</span>
                        <span className="step-date">Est. Aug 22</span>
                      </div>
                    </div>
                    <div className="timeline-step step-upcoming">
                      <span className="step-icon"><Clock size={14} /></span>
                      <div className="step-info">
                        <span className="step-name">Timber Mill Transit Hauling</span>
                        <span className="step-date">Est. Sep 05</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* AVAILABLE HARVESTING JOB LISTINGS */}
            <section className="dashboard-section card">
              <div className="card-header">
                <div>
                  <h2 className="section-heading">Available Timber Harvesting Job Board</h2>
                  <p className="section-subtext">Verified timber land listings open for contractor bids in Kerala</p>
                </div>
                <span className="dash-user-count font-semibold text-emerald">{jobs.length} Active Listings</span>
              </div>

              <div className="contractor-jobs-list">
                {jobs.map((j) => (
                  <div key={j.id} className="contractor-job-card">
                    <div className="contractor-job-header">
                      <div>
                        <h4 className="contractor-job-title">{j.parcel}</h4>
                        <p className="contractor-job-owner">
                          <span>{j.owner}</span>
                          <span className="contractor-job-loc"><MapPin size={13} /> {j.location}</span>
                        </p>
                      </div>
                      <span className="contractor-volume-badge">{j.volume}</span>
                    </div>

                    <div className="contractor-job-details">
                      <div className="contractor-job-detail-item">
                        <span className="contractor-detail-label">Target Species</span>
                        <span className="contractor-detail-value">{j.species}</span>
                      </div>
                      <div className="contractor-job-detail-item">
                        <span className="contractor-detail-label">Bid Deadline</span>
                        <span className="contractor-detail-value">{j.deadline}</span>
                      </div>
                    </div>

                    <div className="contractor-job-footer">
                      <div className="text-xs text-slate-400">
                        Est. Project Budget: <strong className="text-slate-200">{j.estBudget}</strong>
                      </div>
                      {j.myBid ? (
                        <span className="badge badge-emerald contractor-bid-badge">
                          <CheckCircle2 size={14} /> Bid Submitted: {j.myBid}
                        </span>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary cursor-pointer"
                          onClick={() => handleOpenBidModal(j)}
                        >
                          <Send size={14} /> Submit Harvest Bid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* MACHINERY FLEET & EQUIPMENT STATUS */}
            <section className="dashboard-section card">
              <div className="card-header">
                <div>
                  <h2 className="section-heading"><Truck size={18} /> Logging Machinery Fleet Status</h2>
                  <p className="section-subtext">Monitor equipment deployment, assigned operators, and maintenance schedule</p>
                </div>
                <span className="dash-user-count font-semibold">{fleetEquipment.length} Fleet Units</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Machinery Model</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Deployed Location</th>
                      <th>Assigned Operator</th>
                      <th>Last Serviced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fleetEquipment.map((eq) => (
                      <tr key={eq.id}>
                        <td className="font-semibold text-white">{eq.name}</td>
                        <td><span className="dash-tag">{eq.category}</span></td>
                        <td>
                          <span className={`status-pill ${eq.status === 'In Operation' ? 'status-green' : 'status-yellow'}`}>
                            {eq.status === 'In Operation' ? <CheckCircle2 size={13} /> : <Wrench size={13} />}
                            {eq.status}
                          </span>
                        </td>
                        <td className="text-slate-300">{eq.location}</td>
                        <td className="text-white font-medium">{eq.operator}</td>
                        <td className="text-slate-400 text-xs">{eq.lastService}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </main>

          {/* RIGHT INSIGHTS PANEL */}
          <aside className="right-insights-panel">

            {/* Widget 1: Contractor Verification Card */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><ShieldCheck size={16} /> Verification Status</span>
                <span className="widget-badge badge-green font-semibold">Active</span>
              </div>
              <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 mt-2">
                <p className="text-xs text-emerald-300 font-bold mb-1">Licensed Kerala Contractor</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Verified by TreeConnect Administrator. Authorized for commercial timber felling and log transport.
                </p>
              </div>
            </div>

            {/* Widget 2: Timber Operations Weather */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><CloudSun size={16} /> Harvesting Weather</span>
                <span className="widget-badge badge-green font-semibold">Good</span>
              </div>
              <div className="weather-content">
                <div className="weather-main">
                  <div className="weather-temp">28°C</div>
                  <div className="weather-desc">
                    <span className="font-semibold">Partly Sunny</span>
                    <span className="text-muted text-xs">Wayanad & Palakkad</span>
                  </div>
                </div>
                <div className="weather-stats">
                  <div className="w-stat"><Wind size={12} /> Wind: 12 km/h</div>
                  <div className="w-stat"><Droplets size={12} /> Rain: Low Risk</div>
                </div>
              </div>
            </div>

            {/* Widget 3: Today's Tasks */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><CheckCircle2 size={16} /> Field Operations</span>
                <span className="widget-count">3 Pending</span>
              </div>
              <ul className="task-list">
                <li className="task-item">
                  <input type="checkbox" id="ct1" className="task-check" />
                  <label htmlFor="ct1" className="task-label">Inspect Wayanad Teak Felling Site</label>
                </li>
                <li className="task-item">
                  <input type="checkbox" id="ct2" className="task-check" />
                  <label htmlFor="ct2" className="task-label">Submit Quotation for Palakkad Lot</label>
                </li>
                <li className="task-item">
                  <input type="checkbox" id="ct3" className="task-check" />
                  <label htmlFor="ct3" className="task-label">Schedule Skidder Maintenance</label>
                </li>
              </ul>
            </div>

            {/* Widget 4: Timber Market Index (INR / m³) */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><DollarSign size={16} /> Kerala Timber Index</span>
                <span className="text-xs text-muted">₹ / m³</span>
              </div>
              <div className="market-prices">
                <div className="price-row">
                  <span className="species-name">Teakwood (A-Grade)</span>
                  <span className="price-val font-bold">₹ 42,500</span>
                  <span className="price-change text-emerald">+2.4%</span>
                </div>
                <div className="price-row">
                  <span className="species-name">Rosewood</span>
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

            {/* Widget 5: Upcoming Schedule */}
            <div className="insight-widget card glass-widget">
              <div className="widget-header">
                <span className="widget-title"><Calendar size={16} /> Transit Schedule</span>
              </div>
              <div className="schedule-list">
                <div className="sched-item">
                  <div className="sched-date">
                    <span className="sched-day">12</span>
                    <span className="sched-month">AUG</span>
                  </div>
                  <div className="sched-details">
                    <span className="sched-title font-semibold">Log Transit Inspection</span>
                    <span className="sched-location text-muted">Wayanad Forest Checkpost</span>
                  </div>
                </div>
                <div className="sched-item">
                  <div className="sched-date">
                    <span className="sched-day">18</span>
                    <span className="sched-month">AUG</span>
                  </div>
                  <div className="sched-details">
                    <span className="sched-title font-semibold">Machinery Dispatch</span>
                    <span className="sched-location text-muted">Palakkad Rubber Stand</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>

        </div>
      </div>

      {/* Submit Harvest Bid Modal */}
      {showBidModal && selectedJob && (
        <div className="modal-overlay">
          <div className="modal-content card max-w-lg w-full">
            <div className="modal-header flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send size={18} className="text-emerald-400" />
                <span>Submit Harvesting Bid</span>
              </h3>
              <button className="btn-icon cursor-pointer text-slate-400 hover:text-white" onClick={() => setShowBidModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitBid} className="modal-body space-y-4 pt-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-white text-sm">{selectedJob.parcel}</p>
                <p className="text-slate-300">Owner: {selectedJob.owner} • Location: {selectedJob.location}</p>
                <p className="text-emerald-400 font-semibold">Target Volume: {selectedJob.volume} • Species: {selectedJob.species}</p>
              </div>

              <div className="form-group">
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  Total Bid Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1450000"
                  value={bidAmountInput}
                  onChange={(e) => setBidAmountInput(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-white font-bold"
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Rate Per Volume (₹ / m³)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹ 1,700 / m³"
                  value={bidRateInput}
                  onChange={(e) => setBidRateInput(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-slate-200"
                />
              </div>

              <div className="form-group">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Machinery & Operation Plan Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention equipment deployment, timeline, transport details..."
                  value={bidNotesInput}
                  onChange={(e) => setBidNotesInput(e.target.value)}
                  className="w-full form-input bg-slate-950 border-slate-700 text-slate-200 text-xs"
                />
              </div>

              <div className="modal-actions flex justify-end gap-3 pt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBidModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Send size={15} /> Confirm & Submit Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractorDashboard;
