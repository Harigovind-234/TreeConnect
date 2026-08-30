import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
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
  Loader2
} from 'lucide-react';

const ContractorDashboard = () => {
  const { user } = useAuth();
  const contractorName = user?.fullName || user?.name || user?.companyName || 'Apex Harvesting Co.';

  // Assigned harvest requests from backend DB
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Contractor Assessment Modal state
  const [selectedRequestForAssessment, setSelectedRequestForAssessment] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    estimated_harvestable_volume: 180,
    estimated_timber_value: 2160000,
    harvesting_cost: 45000,
    extraction_cost: 30000,
    transportation_cost: 25000,
    other_cost: 10000,
    total_quote: 110000,
    estimated_duration: '10 working days',
    proposed_start_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: 'Site inspection completed. Access road cleared for heavy haulers.'
  });

  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [assessmentMessage, setAssessmentMessage] = useState('');

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
        // Filter requests assigned to this contractor or general active requests
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
          // Fallback sample assigned harvest request if DB is empty
          setAssignedRequests([
            {
              id: 'hr_demo_99',
              _id: 'hr_demo_99',
              propertyName: 'Green Valley Teak Plantation',
              propertyLocation: 'Kottayam, Kerala',
              owner_email: 'landowner@treeconnect.in',
              reason: 'Mature timber harvest',
              preferred_start_date: '2026-09-01',
              preferred_end_date: '2026-09-25',
              required_services: ['Tree felling', 'Cutting', 'Timber extraction', 'Transportation', 'Site clearing'],
              site_conditions: {
                access_availability: 'Heavy vehicle access',
                road_condition: 'Paved panchayat road',
                distance_from_road: '40 meters',
                terrain: 'Gently sloped',
                additional_notes: 'Easy access from main road. Preserve surrounding saplings.'
              },
              hazards: ['Power lines nearby'],
              status: 'CONTRACTOR_ASSIGNED',
              createdAt: '2026-08-30'
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

  // Auto calculate total quote in assessment form
  const handleAssessmentFormChange = (e) => {
    const { name, value } = e.target;
    setAssessmentForm(prev => {
      const updated = { ...prev, [name]: value };
      
      if (['harvesting_cost', 'extraction_cost', 'transportation_cost', 'other_cost'].includes(name)) {
        const sum = (Number(updated.harvesting_cost) || 0) +
                    (Number(updated.extraction_cost) || 0) +
                    (Number(updated.transportation_cost) || 0) +
                    (Number(updated.other_cost) || 0);
        updated.total_quote = sum;
      }
      return updated;
    });
  };

  // Submit Assessment Handler
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    if (!selectedRequestForAssessment) return;

    setIsSubmittingAssessment(true);
    setAssessmentMessage('');

    try {
      const reqId = selectedRequestForAssessment.id || selectedRequestForAssessment._id;
      await harvestService.submitAssessment(reqId, assessmentForm);

      setIsSubmittingAssessment(false);
      setAssessmentMessage("Contractor assessment & formal quotation submitted to Landowner successfully!");

      setTimeout(() => {
        setSelectedRequestForAssessment(null);
        setAssessmentMessage('');
        fetchAssignedRequests();
      }, 1800);
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setIsSubmittingAssessment(false);
      setAssessmentMessage("Failed to submit assessment. Please try again.");
    }
  };

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
              <div className="card-header">
                <div>
                  <span className="live-indicator"><span className="pulse-dot"></span> ASSIGNED HARVEST JOBS</span>
                  <h2 className="section-heading">Assigned Harvest Requests & Assessment Quotations</h2>
                  <p className="section-subtext">Inspect landowner site conditions & tree inventory to submit harvestable volume & price quotations</p>
                </div>
                <span className="dash-user-count font-semibold text-emerald">{assignedRequests.length} Assigned</span>
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
                <div className="space-y-4 pt-2">
                  {assignedRequests.map((req) => {
                    const reqId = req.id || req._id;
                    const isSubmitted = req.status === 'ASSESSMENT_SUBMITTED';
                    const isAccepted = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';

                    return (
                      <div key={reqId} className="bg-[#050f09] border border-emerald-500/25 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-3">
                          <div>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                              Job #{reqId.substring(0, 8)}
                            </span>
                            <h3 className="text-base font-extrabold text-white mt-1">{req.propertyName || 'Forest Estate'}</h3>
                            <p className="text-xs text-slate-300 flex items-center gap-1">
                              <MapPin size={12} className="text-emerald-400" /> {req.propertyLocation || req.location || 'Kerala'}
                            </p>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            isAccepted
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : isSubmitted
                              ? 'bg-amber-950 border-amber-500 text-amber-300'
                              : 'bg-blue-950 border-blue-500 text-blue-300'
                          }`}>
                            {isAccepted ? 'Operation Authorized' : isSubmitted ? 'Assessment Submitted' : 'Pending Contractor Assessment'}
                          </span>
                        </div>

                        {/* SPECIFICATIONS */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#091b11] p-3.5 rounded-xl border border-emerald-500/10">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Reason:</span>
                            <strong className="text-white">{req.reason || 'Mature timber harvest'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Preferred Period:</span>
                            <strong className="text-white">{req.preferred_start_date || '2026-09-01'} to {req.preferred_end_date || '2026-09-25'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Services:</span>
                            <strong className="text-emerald-300">{Array.isArray(req.required_services) ? req.required_services.join(', ') : 'Tree Felling'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[11px] block">Site Access:</span>
                            <strong className="text-white">{req.site_conditions?.access_availability || 'Heavy vehicle'}</strong>
                          </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-slate-400">
                            Landowner Email: <strong className="text-slate-200">{req.owner_email || 'landowner@treeconnect.in'}</strong>
                          </span>

                          <button
                            onClick={() => {
                              setSelectedRequestForAssessment(req);
                              setAssessmentMessage('');
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                          >
                            <Calculator size={14} />
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

      {/* CONTRACTOR ASSESSMENT FORM MODAL */}
      {selectedRequestForAssessment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#07130c] border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 max-h-[92vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Calculator size={20} className="text-emerald-400" />
                  Submit Contractor Assessment & Quotation
                </h3>
                <p className="text-xs text-slate-300">
                  Provide evaluated harvestable volume, timber valuation, and itemized service quotation for <strong className="text-white">{selectedRequestForAssessment.propertyName}</strong>.
                </p>
              </div>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-lg"
                onClick={() => setSelectedRequestForAssessment(null)}
              >
                <X size={20} />
              </button>
            </div>

            {assessmentMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{assessmentMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAssessment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Assessed Harvestable Volume (m³) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    name="estimated_harvestable_volume"
                    value={assessmentForm.estimated_harvestable_volume}
                    onChange={handleAssessmentFormChange}
                    className="w-full bg-[#030a06] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Estimated Commercial Timber Value (₹) *</label>
                  <input
                    type="number"
                    required
                    name="estimated_timber_value"
                    value={assessmentForm.estimated_timber_value}
                    onChange={handleAssessmentFormChange}
                    className="w-full bg-[#030a06] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* COST BREAKDOWN */}
              <div className="p-4 rounded-2xl bg-[#040d07] border border-emerald-500/20 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Itemized Service Cost Breakdown (₹)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Tree Felling Cost</label>
                    <input
                      type="number"
                      name="harvesting_cost"
                      value={assessmentForm.harvesting_cost}
                      onChange={handleAssessmentFormChange}
                      className="w-full bg-[#08170e] border border-emerald-500/30 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Extraction Cost</label>
                    <input
                      type="number"
                      name="extraction_cost"
                      value={assessmentForm.extraction_cost}
                      onChange={handleAssessmentFormChange}
                      className="w-full bg-[#08170e] border border-emerald-500/30 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Transport Cost</label>
                    <input
                      type="number"
                      name="transportation_cost"
                      value={assessmentForm.transportation_cost}
                      onChange={handleAssessmentFormChange}
                      className="w-full bg-[#08170e] border border-emerald-500/30 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Other / Clearing</label>
                    <input
                      type="number"
                      name="other_cost"
                      value={assessmentForm.other_cost}
                      onChange={handleAssessmentFormChange}
                      className="w-full bg-[#08170e] border border-emerald-500/30 rounded-lg p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Total Contractor Quotation:</span>
                  <span className="text-emerald-400 font-black text-sm font-mono">
                    ₹ {Number(assessmentForm.total_quote || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Estimated Job Duration *</label>
                  <input
                    type="text"
                    required
                    name="estimated_duration"
                    value={assessmentForm.estimated_duration}
                    onChange={handleAssessmentFormChange}
                    placeholder="e.g. 10 working days"
                    className="w-full bg-[#030a06] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Proposed Start Date *</label>
                  <input
                    type="date"
                    required
                    name="proposed_start_date"
                    value={assessmentForm.proposed_start_date}
                    onChange={handleAssessmentFormChange}
                    className="w-full bg-[#030a06] border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">Site Inspection Notes & Assessment Remarks</label>
                <textarea
                  rows={3}
                  name="notes"
                  value={assessmentForm.notes}
                  onChange={handleAssessmentFormChange}
                  placeholder="Notes on log haulers, crane positioning, timber quality assessment..."
                  className="w-full bg-[#030a06] border border-emerald-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setSelectedRequestForAssessment(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAssessment}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5"
                >
                  {isSubmittingAssessment ? 'Submitting Assessment...' : 'Submit Assessment & Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
