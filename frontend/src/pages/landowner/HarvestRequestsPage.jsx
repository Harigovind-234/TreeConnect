import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { useLandowner } from '../../context/LandownerContext';
import ApprovedContractorSelector from '../../components/workflow/ApprovedContractorSelector';
import harvestService from '../../services/harvestService';
import './LandownerDashboard.css';
import {
  Axe,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FileText,
  DollarSign,
  Truck,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

const HarvestRequestsPage = () => {
  const navigate = useNavigate();
  const landownerCtx = useLandowner() || {};
  const harvestRequests = landownerCtx.harvestRequests || [];
  const refreshHarvestRequests = landownerCtx.refreshHarvestRequests || (() => { });
  const assignContractorToRequest = landownerCtx.assignContractorToRequest || (() => { });

  const [selectedRequestForContractor, setSelectedRequestForContractor] = useState(null);
  const [activeAssessmentMap, setActiveAssessmentMap] = useState({});
  const [loadingAssessments, setLoadingAssessments] = useState({});
  const [actionMessage, setActionMessage] = useState('');

  // Fetch assessments for requests that are ASSESSMENT_SUBMITTED or ACCEPTED/OPERATION_READY
  useEffect(() => {
    const fetchAssessments = async () => {
      for (const req of harvestRequests) {
        const reqId = req.id || req._id;
        if (reqId && (req.status === 'ASSESSMENT_SUBMITTED' || req.status === 'OPERATION_READY' || req.status === 'ACCEPTED' || req.status === 'REVISION_REQUESTED')) {
          setLoadingAssessments(prev => ({ ...prev, [reqId]: true }));
          try {
            const data = await harvestService.getAssessment(reqId);
            if (data && data.assessment) {
              setActiveAssessmentMap(prev => ({ ...prev, [reqId]: data.assessment }));
            }
          } catch (e) {
            console.warn(`No backend assessment found for request ${reqId}`, e);
          } finally {
            setLoadingAssessments(prev => ({ ...prev, [reqId]: false }));
          }
        }
      }
    };

    if (harvestRequests.length > 0) {
      fetchAssessments();
    }
  }, [harvestRequests]);

  // Handle Landowner Action on Assessment (Accept, Reject, Request Revision)
  const handleAssessmentAction = async (requestId, action, feedbackStr = '') => {
    try {
      await harvestService.actionAssessment(requestId, {
        status: action,
        feedback: feedbackStr
      });

      setActionMessage(`Assessment action '${action}' recorded successfully.`);
      setTimeout(() => setActionMessage(''), 3000);

      // Refresh requests list
      refreshHarvestRequests();
    } catch (err) {
      console.error("Error updating assessment status:", err);
      setActionMessage("Failed to update assessment status.");
    }
  };

  // Handle Contractor Selection
  const handleAssignContractor = async (contractor) => {
    if (!selectedRequestForContractor) return;
    const reqId = selectedRequestForContractor.id || selectedRequestForContractor._id;

    try {
      await assignContractorToRequest(reqId, {
        contractor_id: contractor.id || contractor._id,
        contractor_name: contractor.companyName || contractor.name,
        contractor_email: contractor.email
      });

      setSelectedRequestForContractor(null);
      setActionMessage(`Assigned contractor ${contractor.companyName || contractor.name} successfully!`);
      setTimeout(() => setActionMessage(''), 3000);
      refreshHarvestRequests();
    } catch (err) {
      console.error("Error assigning contractor:", err);
    }
  };

  return (
    <div className="landowner-dashboard-page">
      <Navbar />
      <div className="landowner-dashboard-container">
        <Sidebar />

        <div className="landowner-dashboard-workspace">
          <main className="w-full max-w-6xl mx-auto py-6 space-y-8">

            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-6 bg-gradient-to-r from-[#07170e] to-[#0a2014] border border-emerald-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
                  <Axe size={14} /> Registered Estate Harvesting Requests
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  Harvest Requests & Contractor Assessments
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  Track submitted harvest requests, assign platform-verified contractors, and review contractor assessments & quotations.
                </p>
              </div>

              <button
                onClick={() => navigate('/landowner/request-harvest')}
                className="ld-btn-action"
              >
                <Plus size={18} /> Submit New Harvest Request
              </button>
            </div>

            {/* ACTION ALERT MESSAGE */}
            {actionMessage && (
              <div className="p-5 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 font-bold shadow-md">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>{actionMessage}</span>
              </div>
            )}

            {/* REQUEST LIST */}
            {harvestRequests.length === 0 ? (
              <div className="ld-card text-center py-16 space-y-4">
                <Axe size={48} className="text-emerald-500/30 mx-auto" />
                <h3 className="font-bold text-white text-lg">No Active Harvest Requests Found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You haven't submitted any harvesting requests for your registered properties yet.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => navigate('/landowner/request-harvest')}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Submit Harvest Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {harvestRequests.map((req) => {
                  const reqId = req.id || req._id;
                  const assessment = activeAssessmentMap[reqId];
                  const isLoadingAssessment = loadingAssessments[reqId];

                  const isPendingContractor = !req.assigned_contractor_id || req.status === 'PENDING';
                  const isAssigned = req.assigned_contractor_id || req.status === 'CONTRACTOR_ASSIGNED';
                  const isAssessmentSubmitted = req.status === 'ASSESSMENT_SUBMITTED' || Boolean(assessment);
                  const isOperationReady = req.status === 'OPERATION_READY' || req.status === 'ACCEPTED';

                  return (
                    <div key={reqId} className="bg-[#091810] border border-emerald-500/20 rounded-3xl p-8 sm:p-10 space-y-8 shadow-2xl">

                      {/* TOP SUMMARY ROW */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/15 pb-5">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-700/50">
                              Request #{reqId.substring(0, 8)}
                            </span>
                            <span className="text-xs text-slate-400">Created: {req.createdAt ? req.createdAt.split('T')[0] : 'Recent'}</span>
                          </div>
                          <h2 className="text-xl font-black text-white mt-2">{req.propertyName || 'Registered Property'}</h2>
                          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1">
                            <MapPin size={14} className="text-emerald-400" /> {req.propertyLocation || req.location || 'Kerala'}
                          </p>
                        </div>

                        {/* STATUS PILL */}
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border ${isOperationReady
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : isAssessmentSubmitted
                              ? 'bg-amber-950 border-amber-500 text-amber-300'
                              : isAssigned
                                ? 'bg-blue-950 border-blue-500 text-blue-300'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                            }`}>
                            <Clock size={14} />
                            {isOperationReady
                              ? 'Harvest Operation Ready'
                              : isAssessmentSubmitted
                                ? 'Contractor Assessment Submitted'
                                : isAssigned
                                  ? 'Contractor Assigned'
                                  : 'Pending Contractor Assignment'}
                          </span>
                        </div>
                      </div>

                      {/* REQUEST SPECIFICATIONS GRID */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-[#050e08] p-6 rounded-2xl border border-emerald-500/10 text-xs sm:text-sm">
                        <div className="space-y-1">
                          <span className="text-slate-400 block text-xs">Reason for Harvest:</span>
                          <strong className="text-white block">{req.reason || req.reasonForHarvesting || 'Mature timber'}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block text-xs">Preferred Start - End:</span>
                          <strong className="text-white block">{req.preferred_start_date || req.preferredStartDate} to {req.preferred_end_date || req.preferredCompletionDate}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block text-xs">Services Needed:</span>
                          <span className="text-emerald-300 font-bold block">{Array.isArray(req.required_services) ? req.required_services.join(', ') : 'Felling, Extraction'}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 block text-xs">Assigned Contractor:</span>
                          <strong className="text-white block">{req.assigned_contractor_name || 'None Assigned'}</strong>
                        </div>
                      </div>

                      {/* SITE CONDITIONS SUMMARY */}
                      {req.site_conditions && (
                        <div className="text-xs text-slate-300 space-y-1 bg-[#050e08] p-3 rounded-xl border border-emerald-500/10">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Harvest Site Conditions:</span>
                          <div className="flex flex-wrap gap-4 text-slate-300 text-[11px]">
                            <span>Access: <strong className="text-white">{req.site_conditions.access_availability || 'Heavy vehicle access'}</strong></span>
                            <span>Road: <strong className="text-white">{req.site_conditions.road_condition || 'Paved'} ({req.site_conditions.distance_from_road || '50m'})</strong></span>
                            <span>Terrain: <strong className="text-white">{req.site_conditions.terrain || 'Gently sloped'}</strong></span>
                          </div>
                        </div>
                      )}

                      {/* CONTRACTOR ASSIGNMENT ACTION BAR (IF NO CONTRACTOR ASSIGNED) */}
                      {isPendingContractor && (
                        <div className="p-4 rounded-2xl bg-[#0c1f15] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                              <ShieldCheck size={16} className="text-emerald-400" /> Assign Admin-Approved Contractor
                            </h4>
                            <p className="text-[11px] text-slate-300">
                              Select from platform-verified active contractors to perform a site inspection and provide a harvest assessment quotation.
                            </p>
                          </div>

                          <button
                            onClick={() => setSelectedRequestForContractor(req)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md"
                          >
                            <UserCheck size={14} /> Select Approved Contractor
                          </button>
                        </div>
                      )}

                      {/* CONTRACTOR ASSESSMENT & QUOTATION CARD (IF ASSESSMENT SUBMITTED) */}
                      {isLoadingAssessment ? (
                        <div className="p-6 text-center text-slate-400 text-xs space-y-2">
                          <Loader2 size={24} className="animate-spin text-emerald-400 mx-auto" />
                          <p>Loading contractor assessment details...</p>
                        </div>
                      ) : assessment ? (
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0a2016] via-[#0d281c] to-[#0a2016] border border-emerald-400/40 space-y-4 shadow-xl">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                            <div>
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                                <FileText size={12} /> Formal Contractor Assessment & Quotation
                              </div>
                              <h4 className="font-black text-white text-base mt-1">
                                Contractor Quote: ₹ {Number(assessment.total_quote || 0).toLocaleString('en-IN')}
                              </h4>
                            </div>

                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${assessment.status === 'ACCEPTED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                              : assessment.status === 'REJECTED'
                                ? 'bg-red-950 text-red-300 border border-red-500'
                                : 'bg-amber-950 text-amber-300 border border-amber-500'
                              }`}>
                              Assessment Status: {assessment.status}
                            </span>
                          </div>

                          {/* ASSESSMENT DETAILS GRID */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-[#050e08] p-4 rounded-xl border border-emerald-500/10">
                            <div>
                              <span className="text-slate-400 block text-[11px]">Assessed Harvestable Volume:</span>
                              <strong className="text-emerald-400 text-sm font-mono block">{assessment.estimated_harvestable_volume} m³</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Assessed Timber Value:</span>
                              <strong className="text-emerald-400 text-sm font-mono block">₹ {Number(assessment.estimated_timber_value || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Estimated Duration:</span>
                              <strong className="text-white block">{assessment.estimated_duration}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[11px]">Proposed Start Date:</span>
                              <strong className="text-white block">{assessment.proposed_start_date}</strong>
                            </div>
                          </div>

                          {/* COST BREAKDOWN */}
                          <div className="text-xs text-slate-300 space-y-1">
                            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Itemized Cost Breakdown:</span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div>Felling: <strong className="text-white">₹ {Number(assessment.harvesting_cost || 0).toLocaleString('en-IN')}</strong></div>
                              <div>Extraction: <strong className="text-white">₹ {Number(assessment.extraction_cost || 0).toLocaleString('en-IN')}</strong></div>
                              <div>Transportation: <strong className="text-white">₹ {Number(assessment.transportation_cost || 0).toLocaleString('en-IN')}</strong></div>
                              <div>Other Services: <strong className="text-white">₹ {Number(assessment.other_cost || 0).toLocaleString('en-IN')}</strong></div>
                            </div>
                          </div>

                          {assessment.notes && (
                            <div className="text-xs text-slate-300 bg-[#040b07] p-3 rounded-xl border border-emerald-500/10">
                              <span className="text-[11px] text-slate-400 block font-bold">Contractor Inspection Notes:</span>
                              <p className="italic text-slate-200 mt-0.5">{assessment.notes}</p>
                            </div>
                          )}

                          {/* LANDOWNER ACTIONS ON QUOTATION */}
                          {assessment.status === 'SUBMITTED' && (
                            <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-emerald-500/20">
                              <button
                                type="button"
                                onClick={() => handleAssessmentAction(reqId, 'REJECTED')}
                                className="px-4 py-2 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-bold rounded-xl"
                              >
                                Reject Quotation
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAssessmentAction(reqId, 'REVISION_REQUESTED')}
                                className="px-4 py-2 bg-amber-950 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-xl"
                              >
                                Request Revision
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAssessmentAction(reqId, 'ACCEPTED')}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950"
                              >
                                Accept & Authorize Harvest Operation
                              </button>
                            </div>
                          )}
                        </div>
                      ) : null}

                    </div>
                  );
                })}
              </div>
            )}

            {/* MODAL FOR CONTRACTOR SELECTION */}
            {selectedRequestForContractor && (
              <ApprovedContractorSelector
                selectedContractorId={selectedRequestForContractor.assigned_contractor_id}
                onSelectContractor={handleAssignContractor}
                onCancel={() => setSelectedRequestForContractor(null)}
                isModal={true}
              />
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default HarvestRequestsPage;

