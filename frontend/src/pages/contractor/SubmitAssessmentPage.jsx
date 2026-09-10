import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import harvestService from '../../services/harvestService';
import './ContractorDashboard.css';
import {
  Calculator,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Mail,
  Truck,
  FileText,
  AlertTriangle,
  TreePine,
  Clock,
  Loader2,
  ShieldCheck,
  DollarSign,
  Info
} from 'lucide-react';

const SubmitAssessmentPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [requestDetails, setRequestDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

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
    notes: 'Site inspection completed. Access road clear for heavy haulers.'
  });

  // Fetch target harvest request details & existing assessment if any
  useEffect(() => {
    const fetchRequestData = async () => {
      setLoading(true);
      try {
        if (requestId && requestId !== 'demo') {
          // Attempt API fetch
          const res = await harvestService.getHarvestRequestById(requestId);
          const reqData = res.harvest_request || res.data || res;
          if (reqData) {
            setRequestDetails(reqData);
          } else {
            setFallbackDetails();
          }

          // Try fetching existing assessment
          try {
            const existingAssessment = await harvestService.getAssessment(requestId);
            if (existingAssessment && (existingAssessment.assessment || existingAssessment.id)) {
              const assData = existingAssessment.assessment || existingAssessment;
              setAssessmentForm(prev => ({
                ...prev,
                estimated_harvestable_volume: assData.estimated_harvestable_volume ?? prev.estimated_harvestable_volume,
                estimated_timber_value: assData.estimated_timber_value ?? prev.estimated_timber_value,
                harvesting_cost: assData.harvesting_cost ?? prev.harvesting_cost,
                extraction_cost: assData.extraction_cost ?? prev.extraction_cost,
                transportation_cost: assData.transportation_cost ?? prev.transportation_cost,
                other_cost: assData.other_cost ?? prev.other_cost,
                total_quote: assData.total_quote ?? prev.total_quote,
                estimated_duration: assData.estimated_duration || prev.estimated_duration,
                proposed_start_date: assData.proposed_start_date || prev.proposed_start_date,
                notes: assData.notes || prev.notes
              }));
            }
          } catch (e) {
            console.log('No prior assessment recorded yet for this job.');
          }
        } else {
          setFallbackDetails();
        }
      } catch (err) {
        console.warn('Could not fetch harvest request from API, using fallback context:', err);
        setFallbackDetails();
      } finally {
        setLoading(false);
      }
    };

    fetchRequestData();
  }, [requestId]);

  const setFallbackDetails = () => {
    setRequestDetails({
      id: requestId || 'hr_demo_99',
      _id: requestId || 'hr_demo_99',
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
        additional_notes: 'Easy access from main road. Clear haul path for timber trailers.'
      },
      hazards: ['Power lines nearby', 'Boundary fence on South edge'],
      status: 'CONTRACTOR_ASSIGNED',
      createdAt: '2026-09-10'
    });
  };

  // Handle Form Change with Live Auto-Sum of Itemized Costs
  const handleInputChange = (e) => {
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

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage({ type: '', text: '' });

    try {
      const targetId = requestId || requestDetails?.id || requestDetails?._id || 'hr_demo_99';
      await harvestService.submitAssessment(targetId, assessmentForm);

      setFeedbackMessage({
        type: 'success',
        text: 'Contractor site assessment & itemized quotation submitted to Landowner successfully!'
      });

      setTimeout(() => {
        navigate('/contractor/assigned-jobs');
      }, 1800);
    } catch (err) {
      console.error('Failed to submit contractor assessment:', err);
      setFeedbackMessage({
        type: 'error',
        text: err?.message || 'Failed to submit contractor assessment. Please check form values and try again.'
      });
      setIsSubmitting(false);
    }
  };

  const reqIdDisplay = (requestId || requestDetails?.id || requestDetails?._id || 'hr_demo_99').substring(0, 8);
  const servicesList = Array.isArray(requestDetails?.required_services) && requestDetails.required_services.length > 0
    ? requestDetails.required_services
    : ['Tree felling', 'Timber extraction', 'Transportation'];

  return (
    <div className="contractor-dashboard-page">
      <Navbar />
      <div className="contractor-dashboard-container">
        <Sidebar />

        <div className="contractor-dashboard-workspace">
          
          {/* HEADER BACK LINK & TITLE */}
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 w-fit transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} /> Back to Assigned Jobs
            </button>

            <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#07170e] via-[#0c2417] to-[#07170e] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold mb-3">
                  <Calculator size={14} /> DEDICATED CONTRACTOR ASSESSMENT PAGE
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                  Submit Contractor Assessment & Quotation
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Evaluate standing timber inventory, inspect site logistics, itemize harvesting costs, and provide an official quotation for client authorization.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#04120a] border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                  Job #{reqIdDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* MAIN FORM & DETAILS GRID */}
          {loading ? (
            <div className="cd-card text-center py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-emerald-400 animate-spin" />
              <p className="text-white font-semibold text-sm">Loading harvest job details...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: LANDOWNER HARVEST JOB CONTEXT (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Property & Owner Summary Card */}
                <div className="cd-card">
                  <div className="border-b border-emerald-500/20 pb-4 mb-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block mb-1">
                      Assigned Site Context
                    </span>
                    <h3 className="text-xl font-black text-white">{requestDetails?.propertyName || 'Forest Estate Parcel'}</h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                      <MapPin size={14} className="text-emerald-400 shrink-0" /> {requestDetails?.propertyLocation || 'Kottayam, Kerala'}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="bg-[#040d07] p-3.5 rounded-xl border border-emerald-500/15 flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Landowner Email:</span>
                      <strong className="text-white font-semibold flex items-center gap-1">
                        <Mail size={13} className="text-emerald-400" /> {requestDetails?.owner_email || 'landowner@treeconnect.in'}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#040d07] p-3 rounded-xl border border-emerald-500/15">
                        <span className="text-slate-400 text-[11px] block uppercase font-medium">Harvest Reason</span>
                        <strong className="text-white font-semibold block mt-0.5">{requestDetails?.reason || 'Mature timber harvest'}</strong>
                      </div>
                      <div className="bg-[#040d07] p-3 rounded-xl border border-emerald-500/15">
                        <span className="text-slate-400 text-[11px] block uppercase font-medium">Target Schedule</span>
                        <strong className="text-emerald-300 font-semibold block mt-0.5">
                          {requestDetails?.preferred_start_date ? `From ${requestDetails.preferred_start_date}` : 'Flexible'}
                        </strong>
                      </div>
                    </div>

                    {/* Services Required */}
                    <div>
                      <span className="text-slate-400 text-[11px] uppercase font-bold tracking-wider block mb-2">
                        Required Contractor Services
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {servicesList.map((srv, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Site Access & Terrain Callout */}
                    {requestDetails?.site_conditions && (
                      <div className="p-4 rounded-xl bg-[#030c06] border border-emerald-500/20 space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                          <Truck size={14} /> Site Inspection Specifications
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div>Access: <strong className="text-white">{requestDetails.site_conditions.access_availability || 'Heavy vehicle access'}</strong></div>
                          <div>Road: <strong className="text-white">{requestDetails.site_conditions.road_condition || 'Paved road'}</strong></div>
                          <div>Distance: <strong className="text-white">{requestDetails.site_conditions.distance_from_road || '50m'}</strong></div>
                          <div>Terrain: <strong className="text-white">{requestDetails.site_conditions.terrain || 'Gently sloped'}</strong></div>
                        </div>
                        {requestDetails.site_conditions.additional_notes && (
                          <p className="text-[11px] text-slate-400 pt-1 border-t border-emerald-500/10 italic">
                            "{requestDetails.site_conditions.additional_notes}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Hazards Warning */}
                    {Array.isArray(requestDetails?.hazards) && requestDetails.hazards.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-bold">Identified Site Hazards:</strong>
                          <span>{requestDetails.hazards.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: ASSESSMENT & QUOTATION FORM (7 cols) */}
              <div className="lg:col-span-7">
                <div className="cd-card border-emerald-500/40">
                  <div className="border-b border-emerald-500/20 pb-4 mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                        <FileText size={20} className="text-emerald-400" /> Formal Contractor Assessment Form
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Fill in evaluated volumes and itemized quotation costs for the landowner.
                      </p>
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {feedbackMessage.text && (
                    <div className={`p-4 rounded-xl mb-6 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md ${
                      feedbackMessage.type === 'success'
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-200'
                        : 'bg-red-950 border border-red-500 text-red-200'
                    }`}>
                      {feedbackMessage.type === 'success' ? (
                        <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={20} className="text-red-400 shrink-0" />
                      )}
                      <span>{feedbackMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="cd-form">
                    
                    {/* Volume & Value Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Assessed Harvestable Volume (m³) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          name="estimated_harvestable_volume"
                          value={assessmentForm.estimated_harvestable_volume}
                          onChange={handleInputChange}
                          className="cd-input"
                          placeholder="e.g. 180"
                        />
                      </div>

                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Estimated Commercial Timber Value (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          name="estimated_timber_value"
                          value={assessmentForm.estimated_timber_value}
                          onChange={handleInputChange}
                          className="cd-input text-emerald-400 font-bold"
                          placeholder="e.g. 2160000"
                        />
                      </div>
                    </div>

                    {/* Cost Breakdown Section */}
                    <div className="cd-cost-breakdown-box">
                      <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign size={15} /> Itemized Service Cost Breakdown (₹)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Tree Felling Cost (₹)</label>
                          <input
                            type="number"
                            name="harvesting_cost"
                            value={assessmentForm.harvesting_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>

                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Timber Extraction Cost (₹)</label>
                          <input
                            type="number"
                            name="extraction_cost"
                            value={assessmentForm.extraction_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>

                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Transportation / Haulage (₹)</label>
                          <input
                            type="number"
                            name="transportation_cost"
                            value={assessmentForm.transportation_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>

                        <div className="cd-form-group">
                          <label className="text-[11px] font-semibold text-slate-300">Other / Site Clearing Cost (₹)</label>
                          <input
                            type="number"
                            name="other_cost"
                            value={assessmentForm.other_cost}
                            onChange={handleInputChange}
                            className="cd-input font-mono text-xs"
                          />
                        </div>
                      </div>

                      {/* Total Quotation Summary */}
                      <div className="cd-total-quote-box">
                        <span className="text-slate-200 font-bold text-xs sm:text-sm">Total Calculated Quotation:</span>
                        <span className="cd-total-quote-amount">
                          ₹ {Number(assessmentForm.total_quote || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Estimated Job Duration *
                        </label>
                        <input
                          type="text"
                          required
                          name="estimated_duration"
                          value={assessmentForm.estimated_duration}
                          onChange={handleInputChange}
                          className="cd-input"
                          placeholder="e.g. 10 working days"
                        />
                      </div>

                      <div className="cd-form-group">
                        <label className="cd-form-label">
                          Proposed Operation Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          name="proposed_start_date"
                          value={assessmentForm.proposed_start_date}
                          onChange={handleInputChange}
                          className="cd-input"
                        />
                      </div>
                    </div>

                    {/* Site Notes */}
                    <div className="cd-form-group">
                      <label className="cd-form-label">
                        Site Inspection Notes & Assessment Remarks
                      </label>
                      <textarea
                        rows={4}
                        name="notes"
                        value={assessmentForm.notes}
                        onChange={handleInputChange}
                        className="cd-textarea"
                        placeholder="Provide comments regarding site accessibility, crane deployment requirements, timber health..."
                      />
                    </div>

                    {/* Actions Bar */}
                    <div className="cd-modal-actions">
                      <button
                        type="button"
                        onClick={() => navigate('/contractor/assigned-jobs')}
                        className="cd-btn-cancel"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="cd-btn-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Submitting Assessment...
                          </>
                        ) : (
                          <>
                            <Calculator size={16} /> Submit Assessment & Quotation
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SubmitAssessmentPage;
