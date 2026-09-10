import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
import './ContractorDashboard.css';
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
  Award,
  TreePine,
  Loader2,
  Mail,
  ExternalLink
} from 'lucide-react';

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const contractorName = user?.fullName || user?.name || user?.companyName || 'Apex Harvesting Co.';

  // Assigned harvest requests from backend DB
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Legacy Bid Modal state
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
    }
  ]);

  const [fleetEquipment, setFleetEquipment] = useState([
    { id: 1, name: 'Caterpillar 545D Skidder', category: 'Skidder', status: 'In Operation', location: 'Wayanad Stand #1', operator: 'Dave Miller', lastService: '2026-07-20' },
    { id: 2, name: 'Tigercat 870D Feller Buncher', category: 'Feller Buncher', status: 'In Operation', location: 'Wayanad Stand #1', operator: 'Sarah Jenkins', lastService: '2026-07-15' },
    { id: 3, name: 'Komatsu XT445L-5 Harvester', category: 'Harvester', status: 'Maintenance', location: 'Central Workshop', operator: 'Unassigned', lastService: '2026-08-01' },
    { id: 4, name: 'Volvo FMX Log Hauler Truck', category: 'Log Truck', status: 'In Operation', location: 'Palakkad Route #4', operator: 'Rajesh Kumar', lastService: '2026-07-28' }
  ]);

  // Fetch assigned harvest requests
  const fetchAssignedRequests = async () => {
    setLoadingRequests(true);
    try {
      const data = await harvestService.getHarvestRequests({ all_records: true });
      if (data && Array.isArray(data.harvest_requests)) {
        const cId = user?.id || user?._id || user?.email;
        const assigned = data.harvest_requests.filter(r =>
          r.assigned_contractor_id === cId ||
          r.assigned_contractor_email === user?.email ||
          r.status === 'CONTRACTOR_ASSIGNED' ||
          r.status === 'ASSESSMENT_SUBMITTED' ||
          r.status === 'OPERATION_READY'
        );

        if (assigned.length > 0) {
          setAssignedRequests(assigned);
        } else {
          setAssignedRequests([
            {
              id: 'hr_demo_99',
              _id: 'hr_demo_99',
              propertyName: 'Green Valley Teak Plantation',
              propertyLocation: 'Kottayam, Kerala',
              owner_email: 'landowner@treeconnect.in',
              reason: 'Mature timber harvest',
              preferred_start_date: '2026-09-10',
              preferred_end_date: '2026-09-25',
              required_services: ['Tree felling', 'Cutting', 'Timber extraction', 'Transportation', 'Site clearing'],
              site_conditions: {
                access_availability: 'Heavy vehicle access',
                road_condition: 'Paved panchayat road',
                distance_from_road: '50 meters',
                terrain: 'Gently sloped',
                additional_notes: 'Easy access from main road. Preserve surrounding saplings.'
              },
              hazards: ['Power lines nearby'],
              status: 'CONTRACTOR_ASSIGNED',
              createdAt: '2026-09-10'
            }
          ]);
        }
      }
    } catch (err) {
      console.warn("Could not load contractor assigned harvest requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAssignedRequests();
  }, [user?.email]);

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

        <div className="dashboard-workspace">
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
                    Review assigned landowner harvest requests, inspect site specifications & tree inventories, and submit formal contractor assessments & quotations.
                  </p>
                </div>
              </div>
            </section>

            {/* ASSIGNED LANDOWNER HARVEST REQUESTS (ASSESSMENT WORKFLOW) */}
            <section className="dashboard-section card highlight-card border border-emerald-500/30">
              <div className="card-header flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="live-indicator"><span className="pulse-dot"></span> ASSIGNED HARVEST JOBS</span>
                  <h2 className="section-heading">Assigned Harvest Requests & Assessment Quotations</h2>
                  <p className="section-subtext">Inspect landowner site conditions & tree inventory to submit harvestable volume & price quotations</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="dash-user-count font-semibold text-emerald">{assignedRequests.length} Assigned</span>
                  <button
                    onClick={() => navigate('/contractor/assigned-jobs')}
                    className="px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    View All Dedicated <ExternalLink size={13} />
                  </button>
                </div>
              </div>

              {loadingRequests ? (
                <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                  <span>Loading assigned harvest jobs...</span>
                </div>
              ) : assignedRequests.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No landowner harvest requests currently assigned to your company.
                </div>
              ) : (
                <div className="flex flex-col gap-6 pt-2">
                  {assignedRequests.map((req) => {
                    const reqId = req.id || req._id || 'job_demo';
                    const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                    const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';

                    // Format schedule dates cleanly
                    const startDate = req.preferred_start_date || req.preferredStartDate;
                    const endDate = req.preferred_end_date || req.preferredCompletionDate;
                    let scheduleText = 'Flexible Schedule';
                    if (startDate && endDate) {
                      scheduleText = `${startDate} to ${endDate}`;
                    } else if (startDate) {
                      scheduleText = `From ${startDate}`;
                    } else if (endDate) {
                      scheduleText = `By ${endDate}`;
                    }

                    const servicesNeededText = Array.isArray(req.required_services) && req.required_services.length > 0
                      ? req.required_services.join(', ')
                      : (req.servicesNeeded || 'Tree Felling & Extraction');

                    return (
                      <div key={reqId} className="cd-assigned-card">
                        {/* TOP SUMMARY ROW */}
                        <div className="cd-assigned-header">
                          <div className="cd-assigned-header-main">
                            <div className="cd-assigned-meta-row">
                              <span className="cd-req-id-badge">
                                Job #{reqId.substring(0, 8)}
                              </span>
                              <span className="cd-req-date">
                                <Calendar size={13} className="text-slate-500" /> Assigned: {req.createdAt ? (typeof req.createdAt === 'string' ? req.createdAt.split('T')[0] : new Date(req.createdAt).toISOString().split('T')[0]) : 'Recent'}
                              </span>
                            </div>
                            <h3 className="cd-req-title">{req.propertyName || 'Forest Estate Parcel'}</h3>
                            <p className="cd-req-location">
                              <MapPin size={14} className="text-emerald-400 shrink-0" /> {req.propertyLocation || req.location || 'Kottayam, Kerala'}
                            </p>
                          </div>

                          <div className="shrink-0 self-start sm:self-center">
                            <span className={`cd-status-pill ${
                              isAccepted
                                ? 'cd-status-accepted'
                                : isSubmitted
                                  ? 'cd-status-submitted'
                                  : 'cd-status-pending'
                            }`}>
                              <Clock size={13} />
                              {isAccepted ? 'Operation Authorized' : isSubmitted ? 'Assessment Submitted' : 'Pending Contractor Assessment'}
                            </span>
                          </div>
                        </div>

                        {/* SPECIFICATIONS GRID */}
                        <div className="cd-specs-grid">
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Reason</span>
                            <strong className="cd-spec-value">{req.reason || 'Mature timber harvest'}</strong>
                          </div>
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Preferred Period</span>
                            <strong className="cd-spec-value">{scheduleText}</strong>
                          </div>
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Services</span>
                            <strong className="cd-spec-value-emerald">{servicesNeededText}</strong>
                          </div>
                          <div className="cd-spec-item">
                            <span className="cd-spec-label">Site Access</span>
                            <strong className="cd-spec-value truncate">{req.site_conditions?.access_availability || 'Heavy vehicle access'}</strong>
                          </div>
                        </div>

                        {/* ACTION BAR */}
                        <div className="cd-action-bar">
                          <span className="cd-landowner-info">
                            <Mail size={14} className="text-emerald-400 shrink-0" />
                            Landowner Email: <strong className="text-white font-semibold">{req.owner_email || req.landowner_email || 'landowner@treeconnect.in'}</strong>
                          </span>

                          <button
                            onClick={() => navigate(`/contractor/assessment/${reqId}`)}
                            className="cd-btn-assessment"
                          >
                            <Calculator size={15} />
                            {isSubmitted ? 'Edit / Resubmit Assessment' : 'Submit Inspection Assessment & Quote'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* AVAILABLE HARVESTING JOB BOARD */}
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
                      <div className="text-xs text-slate-300 font-medium">
                        Est. Project Budget: <strong className="text-emerald-400 font-extrabold">{j.estBudget}</strong>
                      </div>
                      {j.myBid ? (
                        <span className="contractor-bid-badge">
                          <CheckCircle2 size={14} className="text-emerald-400" /> Bid Submitted: {j.myBid}
                        </span>
                      ) : (
                        <button
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
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

            {/* MACHINERY FLEET */}
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

          {/* RIGHT PANEL */}
          <aside className="right-insights-panel">
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

