import React, { useState } from 'react';
import {
  X,
  Camera,
  Video,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  FileText,
  Play,
  Layers,
  Sparkles,
  Trash2,
  Check,
  RotateCcw,
  MessageSquare,
  Truck
} from 'lucide-react';
import harvestService from '../../services/harvestService';
import './HarvestStageTrackerModal.css';

// Canonical Four Stages Definitions
const HARVEST_STAGES_CONFIG = [
  {
    id: 'stage_1',
    number: 1,
    title: 'Mobilization & Safety',
    subtitle: 'Site Preparation & Perimeter Safety',
    purpose: 'Verify that the site is prepared and safety arrangements are in place.',
    requiredEvidenceSummary: 'Boundary-marked trees & site photos, Machinery positioning & site-access photos'
  },
  {
    id: 'stage_2',
    number: 2,
    title: 'Felling Operations',
    subtitle: 'Tree Felling & Property Check',
    purpose: 'Verify that the agreed trees have been felled and check for property damage.',
    requiredEvidenceSummary: 'Felled trees and stump cuts photos'
  },
  {
    id: 'stage_3',
    number: 3,
    title: 'De-branching & Bucking',
    subtitle: 'Delimbing, Bucking & Site Clearing',
    purpose: 'Verify that the timber has been processed and the site is organized for collection.',
    requiredEvidenceSummary: 'Processed and sectioned logs photos'
  },
  {
    id: 'stage_4',
    number: 4,
    title: 'Scaling & Transit Prep',
    subtitle: 'Log Measurement & Transit Readiness',
    purpose: 'Verify log measurement and readiness for the next agreed activity.',
    requiredEvidenceSummary: 'Log diameter / tape measurement photos (and truck-loading if purchased)'
  }
];

// Normalize status values to canonical set:
// 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'
const normalizeStageStatus = (rawStatus, stageIndex = 0) => {
  if (!rawStatus) {
    return stageIndex === 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
  }
  const s = String(rawStatus).toUpperCase().trim();
  if (s === 'COMPLETED' || s === 'VERIFIED') return 'VERIFIED';
  if (s === 'SUBMITTED' || s === 'SUBMITTED_FOR_VERIFICATION') return 'SUBMITTED';
  if (s === 'CHANGES_REQUIRED' || s === 'REJECTED') return 'REJECTED';
  if (s === 'IN_PROGRESS' || s === 'ACTIVE') return 'IN_PROGRESS';
  if (s === 'NOT_STARTED' || s === 'PENDING') return stageIndex === 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
  return 'NOT_STARTED';
};

const getStatusBadgeMeta = (normalizedStatus) => {
  switch (normalizedStatus) {
    case 'VERIFIED':
      return {
        label: 'Verified',
        className: 'hst-badge-verified',
        icon: CheckCircle2
      };
    case 'SUBMITTED':
      return {
        label: 'Submitted for Verification',
        className: 'hst-badge-submitted',
        icon: Clock
      };
    case 'REJECTED':
      return {
        label: 'Changes Required',
        className: 'hst-badge-rejected',
        icon: AlertTriangle
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        className: 'hst-badge-in_progress',
        icon: Clock
      };
    case 'NOT_STARTED':
    default:
      return {
        label: 'Not Started',
        className: 'hst-badge-not_started',
        icon: Clock
      };
  }
};

const HarvestStageTrackerModal = ({ request, role = 'contractor', onClose, onStageUpdated }) => {
  const isContractor = role === 'contractor';
  const reqId = request?.id || request?._id;
  const stagesData = request?.harvest_stages || {};

  // Determine whether contractor purchased timber using existing site-inspection record
  // Checking existing fields without requiring new user inputs
  const siteInsp = request?.site_inspection || {};
  const isTimberPurchased = Boolean(
    siteInsp?.landowner_preferred_arrangement === 'INTERESTED_IN_TIMBER_SALE' ||
    siteInsp?.contractor_purchased_timber === true ||
    request?.is_timber_sale === true ||
    request?.commercial_proposal_type === 'Timber Purchase Offer' ||
    request?.commercial_proposal_type === 'Purchase + Harvesting'
  );

  const [activeStageId, setActiveStageId] = useState(request?.current_harvest_stage || 'stage_1');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [previewMedia, setPreviewMedia] = useState(null);

  // Reviewer action state for Landowner / Admin role
  const [reviewerNotesInput, setReviewerNotesInput] = useState('');
  const [showReviewerInput, setShowReviewerInput] = useState(false);

  const activeStageConfig = HARVEST_STAGES_CONFIG.find(s => s.id === activeStageId) || HARVEST_STAGES_CONFIG[0];
  const activeStageRecord = stagesData[activeStageId] || {};
  const activeStageIndex = HARVEST_STAGES_CONFIG.findIndex(s => s.id === activeStageId);
  const currentStatus = normalizeStageStatus(activeStageRecord.status, activeStageIndex);

  // Initial stage form state helper
  const getInitialStageForm = (stageId, record) => {
    const sData = record?.stage_data || {};
    return {
      // Stage 1 Fields
      safetyConfirmed: sData.safetyConfirmed ?? (record?.safety_confirmed !== undefined ? record.safety_confirmed : null), // boolean or null
      hasSiteHazards: sData.hasSiteHazards ?? (Boolean(sData.siteHazardsNotes || record?.notes)),
      siteHazardsNotes: sData.siteHazardsNotes ?? (record?.notes || ''),

      // Stage 2 Fields
      treesFelled: sData.treesFelled ?? (record?.trees_logged !== undefined ? String(record.trees_logged) : ''),
      propertyDamageObserved: sData.propertyDamageObserved ?? null, // boolean or null
      damageIncidentNotes: sData.damageIncidentNotes ?? '',

      // Stage 3 Fields
      logsProduced: sData.logsProduced ?? (record?.logs_produced !== undefined ? String(record.logs_produced) : ''),
      debrisCleared: sData.debrisCleared ?? null, // boolean or null
      logsStackedAtCollection: sData.logsStackedAtCollection ?? null, // boolean or null

      // Stage 4 Fields
      logsMeasured: sData.logsMeasured ?? (record?.logs_measured !== undefined ? String(record.logs_measured) : ''),
      estimatedVolume: sData.estimatedVolume ?? (record?.measured_volume !== undefined ? String(record.measured_volume) : ''),
      transitReadyConfirmed: sData.transitReadyConfirmed ?? null
    };
  };

  const [stageFormData, setStageFormData] = useState(() => getInitialStageForm(activeStageId, activeStageRecord));

  // Category-based media tracking for stage-specific verification
  // Categorized new files uploaded in this session:
  // stage_1: 'boundary' | 'machinery'
  // stage_2: 'stumps' | 'damage'
  // stage_3: 'logs'
  // stage_4: 'measurements' | 'truck_loading'
  const [newMediaByCategory, setNewMediaByCategory] = useState({
    general: [],
    boundary: [],
    machinery: [],
    stumps: [],
    damage: [],
    logs: [],
    measurements: [],
    truck_loading: []
  });

  const existingMedia = activeStageRecord.media || [];

  const handleStageSelect = (stageId) => {
    setActiveStageId(stageId);
    const rec = stagesData[stageId] || {};
    setStageFormData(getInitialStageForm(stageId, rec));
    setNewMediaByCategory({
      general: [],
      boundary: [],
      machinery: [],
      stumps: [],
      damage: [],
      logs: [],
      measurements: [],
      truck_loading: []
    });
    setErrorMsg('');
    setFieldErrors({});
    setShowReviewerInput(false);
    setReviewerNotesInput('');
  };

  const handleFileSelect = (category, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg('');
    files.forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('File exceeds 20MB limit. Please upload optimized photos or short clips.');
        return;
      }

      const isVid = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = (event) => {
        const item = {
          url: event.target.result,
          type: isVid ? 'video' : 'image',
          name: file.name,
          category,
          timestamp: new Date().toISOString()
        };
        setNewMediaByCategory(prev => ({
          ...prev,
          [category]: [...(prev[category] || []), item]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNewMedia = (category, idx) => {
    setNewMediaByCategory(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== idx)
    }));
  };

  const countCategoryFiles = (catKey) => {
    const existingCount = existingMedia.filter(m => m.category === catKey).length;
    const newCount = (newMediaByCategory[catKey] || []).length;
    return existingCount + newCount;
  };

  // Validation rules tailored for each stage
  const validateActiveStage = () => {
    const errors = {};

    if (activeStageId === 'stage_1') {
      const boundaryCount = countCategoryFiles('boundary') + countCategoryFiles('general');
      const machineryCount = countCategoryFiles('machinery') + countCategoryFiles('general');

      if (boundaryCount === 0) {
        errors.boundaryMedia = 'Boundary-marked trees and site photos are required.';
      }
      if (machineryCount === 0) {
        errors.machineryMedia = 'Machinery positioning and site-access photos are required.';
      }
      if (stageFormData.safetyConfirmed !== true) {
        errors.safetyConfirmed = 'Safety arrangements confirmed is required (Must select Yes).';
      }
      if (stageFormData.hasSiteHazards && !stageFormData.siteHazardsNotes.trim()) {
        errors.siteHazardsNotes = 'Please describe the observed site hazards or observations.';
      }
    }

    if (activeStageId === 'stage_2') {
      const felledStr = String(stageFormData.treesFelled).trim();
      const felledNum = parseInt(felledStr, 10);
      if (felledStr === '' || isNaN(felledNum) || felledNum < 0) {
        errors.treesFelled = 'Number of trees felled is required (non-negative whole number).';
      }
      const stumpsCount = countCategoryFiles('stumps') + countCategoryFiles('general');
      if (stumpsCount === 0) {
        errors.stumpsMedia = 'Photos of felled trees and stumps are required.';
      }
      if (stageFormData.propertyDamageObserved === null) {
        errors.propertyDamageObserved = 'Please confirm whether property damage was observed (Yes/No).';
      }
      if (stageFormData.propertyDamageObserved === true) {
        if (!stageFormData.damageIncidentNotes.trim()) {
          errors.damageIncidentNotes = 'Incident notes describing property damage are required.';
        }
        const damageCount = countCategoryFiles('damage');
        if (damageCount === 0) {
          errors.damageMedia = 'Damage photos are required when property damage is reported.';
        }
      }
    }

    if (activeStageId === 'stage_3') {
      const logsStr = String(stageFormData.logsProduced).trim();
      const logsNum = parseInt(logsStr, 10);
      if (logsStr === '' || isNaN(logsNum) || logsNum < 0) {
        errors.logsProduced = 'Number of logs produced is required (non-negative whole number).';
      }
      const logsCount = countCategoryFiles('logs') + countCategoryFiles('general');
      if (logsCount === 0) {
        errors.logsMedia = 'Photos of processed logs are required.';
      }
      if (stageFormData.debrisCleared === null) {
        errors.debrisCleared = 'Branches and debris cleared confirmation is required (Yes/No).';
      }
      if (stageFormData.logsStackedAtCollection === null) {
        errors.logsStackedAtCollection = 'Logs stacked at collection area confirmation is required (Yes/No).';
      }
    }

    if (activeStageId === 'stage_4') {
      const measuredStr = String(stageFormData.logsMeasured).trim();
      const measuredNum = parseInt(measuredStr, 10);
      if (measuredStr === '' || isNaN(measuredNum) || measuredNum < 0) {
        errors.logsMeasured = 'Number of logs measured is required (non-negative whole number).';
      }
      const measureCount = countCategoryFiles('measurements') + countCategoryFiles('general');
      if (measureCount === 0) {
        errors.measurementsMedia = 'Photos showing log diameter measurements are required.';
      }
      if (isTimberPurchased) {
        const truckCount = countCategoryFiles('truck_loading');
        if (truckCount === 0) {
          errors.truckLoadingMedia = 'Truck-loading or transport photos are required because timber was purchased by contractor.';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Stage Evidence
  const handleSubmitStage = async (newStatus) => {
    setErrorMsg('');

    // If contractor is submitting for verification, run validations
    if (newStatus === 'SUBMITTED' || newStatus === 'VERIFIED') {
      const isValid = validateActiveStage();
      if (!isValid) {
        setErrorMsg('Please complete all required fields and upload mandatory evidence before submitting.');
        return;
      }
    }

    setSubmitting(true);

    try {
      // Gather all new media items
      const allNewMedia = Object.values(newMediaByCategory).flat();

      const payload = {
        stage_id: activeStageId,
        status: newStatus,
        notes: (activeStageId === 'stage_1' && stageFormData.siteHazardsNotes)
          ? stageFormData.siteHazardsNotes.trim()
          : (activeStageId === 'stage_2' && stageFormData.damageIncidentNotes)
          ? stageFormData.damageIncidentNotes.trim()
          : (activeStageRecord.notes || ''),
        media: allNewMedia,
        stage_data: {
          ...stageFormData,
          last_updated_by: isContractor ? 'CONTRACTOR' : 'LANDOWNER',
          is_timber_purchased: isTimberPurchased
        },
        trees_logged: stageFormData.treesFelled ? parseInt(stageFormData.treesFelled, 10) : undefined,
        measured_volume: stageFormData.estimatedVolume ? parseFloat(stageFormData.estimatedVolume) : undefined,
        reviewer_comments: reviewerNotesInput ? reviewerNotesInput.trim() : undefined
      };

      const res = await harvestService.updateHarvestStage(reqId, payload);
      if (onStageUpdated) {
        onStageUpdated(res.harvest_request || res);
      }

      setNewMediaByCategory({
        general: [],
        boundary: [],
        machinery: [],
        stumps: [],
        damage: [],
        logs: [],
        measurements: [],
        truck_loading: []
      });

      // Cross-stage auto advance if moving forward
      if (newStatus === 'VERIFIED') {
        const currIdx = HARVEST_STAGES_CONFIG.findIndex(s => s.id === activeStageId);
        if (currIdx < HARVEST_STAGES_CONFIG.length - 1) {
          handleStageSelect(HARVEST_STAGES_CONFIG[currIdx + 1].id);
        } else {
          onClose();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update harvest stage. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = getStatusBadgeMeta(currentStatus);
  const StatusIcon = statusMeta.icon;

  return (
    <div className="hst-overlay" onClick={onClose}>
      <div className="hst-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="hst-header">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="hst-header-icon-box">
              <Camera size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="hst-header-title">Harvesting Milestone Evidence Tracker</h3>
                <span className="hst-header-pill">
                  {isContractor ? 'Contractor Field Evidence' : 'Landowner Verification Audit'}
                </span>
              </div>
              <p className="hst-header-sub">
                Job #{String(reqId).substring(0, 8)} • Stage Verification Workflow
                {isTimberPurchased && (
                  <span className="ml-2 text-emerald-400 font-semibold">• Timber Purchase Recorded</span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hst-close-btn"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="hst-body">
          {/* Stepper Tabs Bar */}
          <div className="hst-stepper-bar">
            {HARVEST_STAGES_CONFIG.map((stage, idx) => {
              const rec = stagesData[stage.id] || {};
              const stStatus = normalizeStageStatus(rec.status, idx);
              const isVerified = stStatus === 'VERIFIED';
              const isSubmitted = stStatus === 'SUBMITTED';
              const isRejected = stStatus === 'REJECTED';
              const isInProgress = stStatus === 'IN_PROGRESS';
              const mediaCount = (rec.media || []).length;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageSelect(stage.id)}
                  className={`hst-step-btn ${activeStageId === stage.id ? 'active' : ''} ${isVerified ? 'completed' : ''} ${isRejected ? 'rejected' : ''}`}
                >
                  <div className="hst-step-number">
                    {isVerified ? (
                      <CheckCircle2 size={16} />
                    ) : isRejected ? (
                      <AlertTriangle size={16} />
                    ) : (
                      stage.number
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="hst-step-label block truncate">{stage.title}</span>
                    <span className="hst-step-meta block">
                      {isVerified
                        ? 'Verified'
                        : isSubmitted
                        ? 'Submitted'
                        : isRejected
                        ? 'Changes Req.'
                        : isInProgress
                        ? 'In Progress'
                        : 'Not Started'}
                      {mediaCount > 0 && ` • ${mediaCount} files`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Details Card */}
          <div className="hst-card">
            <div className="hst-card-header">
              <div>
                <span className="hst-stage-tracker-eyebrow">
                  STAGE {activeStageConfig.number} OF 4
                </span>
                <h4 className="hst-stage-tracker-title">{activeStageConfig.title}</h4>
                <p className="hst-stage-tracker-subtitle">{activeStageConfig.subtitle}</p>
                <p className="hst-stage-tracker-desc">
                  <strong>Purpose:</strong> {activeStageConfig.purpose}
                </p>
              </div>

              <span className={`hst-badge ${statusMeta.className}`}>
                <StatusIcon size={13} />
                <span>{statusMeta.label}</span>
              </span>
            </div>

            {/* Reviewer Comments Alert (if rejected or reviewed) */}
            {activeStageRecord.reviewer_comments && (
              <div className="hst-reviewer-comments-box">
                <MessageSquare size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold text-xs uppercase tracking-wider">
                    Reviewer Feedback / Changes Required
                  </strong>
                  <p className="text-xs text-amber-100 mt-1">
                    "{activeStageRecord.reviewer_comments}"
                  </p>
                </div>
              </div>
            )}

            {/* Existing Uploaded Evidence Grid */}
            {existingMedia.length > 0 && (
              <div className="space-y-2">
                <div className="hst-media-section-header">
                  <span className="hst-media-section-title">
                    Uploaded Evidence Records ({existingMedia.length} files)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    ✓ On-site Evidence Logged
                  </span>
                </div>
                <div className="hst-media-grid">
                  {existingMedia.map((m, idx) => (
                    <div
                      key={`exist-${idx}`}
                      className="hst-media-item"
                      onClick={() => setPreviewMedia(m)}
                    >
                      {m.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/60 text-emerald-400">
                          <Play size={28} />
                          <span className="hst-media-video-badge"><Video size={10} /> Video</span>
                        </div>
                      ) : (
                        <img src={m.url} alt={`Evidence ${idx + 1}`} className="hst-media-thumb" />
                      )}
                      {m.category && (
                        <span className="hst-media-category-tag">{m.category.replace('_', ' ')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE-SPECIFIC ESSENTIAL FIELDS & EVIDENCE */}
            <div className="hst-stage-form-wrap">

              {/* ----------------- STAGE 1: MOBILIZATION & SAFETY ----------------- */}
              {activeStageId === 'stage_1' && (
                <div className="space-y-5">
                  {/* Evidence Upload 1: Boundary-marked trees */}
                  <div className="hst-evidence-block">
                    <label className="hst-label">
                      <span>1. Boundary-marked Trees &amp; Site Photos</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Photographs showing marked perimeter boundaries and tree identification tags before operations start.
                    </p>
                    <label className="hst-dropzone">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={!isContractor}
                        onChange={(e) => handleFileSelect('boundary', e)}
                        className="hidden"
                      />
                      <div className="hst-dropzone-icon"><Upload size={20} /></div>
                      <div>
                        <strong className="hst-dropzone-title">Upload Boundary &amp; Site Photos</strong>
                        <span className="hst-dropzone-sub">PNG, JPG, MP4 up to 20MB</span>
                      </div>
                    </label>
                    {fieldErrors.boundaryMedia && (
                      <p className="hst-error-text">{fieldErrors.boundaryMedia}</p>
                    )}
                    {newMediaByCategory.boundary?.length > 0 && (
                      <div className="hst-media-grid mt-2">
                        {newMediaByCategory.boundary.map((m, idx) => (
                          <div key={idx} className="hst-media-item hst-media-pending">
                            <img src={m.url} alt={m.name} className="hst-media-thumb" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('boundary', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Evidence Upload 2: Machinery positioning */}
                  <div className="hst-evidence-block">
                    <label className="hst-label">
                      <span>2. Machinery Positioning &amp; Site Access Photos</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Photos of machinery placement, clear access paths, and established landing zones.
                    </p>
                    <label className="hst-dropzone">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={!isContractor}
                        onChange={(e) => handleFileSelect('machinery', e)}
                        className="hidden"
                      />
                      <div className="hst-dropzone-icon"><Upload size={20} /></div>
                      <div>
                        <strong className="hst-dropzone-title">Upload Machinery Positioning Photos</strong>
                        <span className="hst-dropzone-sub">PNG, JPG, MP4 up to 20MB</span>
                      </div>
                    </label>
                    {fieldErrors.machineryMedia && (
                      <p className="hst-error-text">{fieldErrors.machineryMedia}</p>
                    )}
                    {newMediaByCategory.machinery?.length > 0 && (
                      <div className="hst-media-grid mt-2">
                        {newMediaByCategory.machinery.map((m, idx) => (
                          <div key={idx} className="hst-media-item hst-media-pending">
                            <img src={m.url} alt={m.name} className="hst-media-thumb" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('machinery', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Safety Arrangements Confirmed Yes/No */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Safety Arrangements Confirmed?</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Confirm that PPE, exclusion perimeter, first-aid kit, and safety protocols are ready.
                    </p>
                    <div className="hst-radio-pill-group">
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, safetyConfirmed: true }))}
                        className={`hst-radio-pill ${stageFormData.safetyConfirmed === true ? 'active-yes' : ''}`}
                      >
                        <Check size={14} /> Yes, Confirmed
                      </button>
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, safetyConfirmed: false }))}
                        className={`hst-radio-pill ${stageFormData.safetyConfirmed === false ? 'active-no' : ''}`}
                      >
                        <X size={14} /> No
                      </button>
                    </div>
                    {fieldErrors.safetyConfirmed && (
                      <p className="hst-error-text">{fieldErrors.safetyConfirmed}</p>
                    )}
                  </div>

                  {/* Site Hazards / Observations - Conditional */}
                  <div className="hst-input-group">
                    <div className="flex items-center justify-between">
                      <label className="hst-label">
                        <span>Site Hazards or Field Observations</span>
                        <span className="hst-label-hint">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setStageFormData(prev => ({ ...prev, hasSiteHazards: !prev.hasSiteHazards }))}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      >
                        {stageFormData.hasSiteHazards ? 'Hide Notes' : '+ Add Hazard Observation'}
                      </button>
                    </div>
                    {stageFormData.hasSiteHazards && (
                      <div className="mt-2 space-y-1 animate-fade-in">
                        <textarea
                          rows={2}
                          disabled={!isContractor}
                          value={stageFormData.siteHazardsNotes}
                          onChange={(e) => setStageFormData(prev => ({ ...prev, siteHazardsNotes: e.target.value }))}
                          placeholder="e.g. Overhead powerlines identified near East border. Safe felling notch angle adjusted."
                          className="hst-textarea"
                        />
                        {fieldErrors.siteHazardsNotes && (
                          <p className="hst-error-text">{fieldErrors.siteHazardsNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- STAGE 2: FELLING OPERATIONS ----------------- */}
              {activeStageId === 'stage_2' && (
                <div className="space-y-5">
                  {/* Number of trees felled */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Number of Trees Felled</span>
                      <span className="hst-required-pill">* Required non-negative number</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!isContractor}
                      value={stageFormData.treesFelled}
                      onChange={(e) => setStageFormData(prev => ({ ...prev, treesFelled: e.target.value }))}
                      placeholder="e.g. 6"
                      className="hst-input"
                    />
                    {fieldErrors.treesFelled && (
                      <p className="hst-error-text">{fieldErrors.treesFelled}</p>
                    )}
                  </div>

                  {/* Felled trees and stumps photos */}
                  <div className="hst-evidence-block">
                    <label className="hst-label">
                      <span>Photos of Felled Trees &amp; Stumps</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Clear photos showing the dropped trees, hinge cuts, and clean stump heights.
                    </p>
                    <label className="hst-dropzone">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={!isContractor}
                        onChange={(e) => handleFileSelect('stumps', e)}
                        className="hidden"
                      />
                      <div className="hst-dropzone-icon"><Upload size={20} /></div>
                      <div>
                        <strong className="hst-dropzone-title">Upload Felled Trees &amp; Stump Photos</strong>
                        <span className="hst-dropzone-sub">PNG, JPG, MP4 up to 20MB</span>
                      </div>
                    </label>
                    {fieldErrors.stumpsMedia && (
                      <p className="hst-error-text">{fieldErrors.stumpsMedia}</p>
                    )}
                    {newMediaByCategory.stumps?.length > 0 && (
                      <div className="hst-media-grid mt-2">
                        {newMediaByCategory.stumps.map((m, idx) => (
                          <div key={idx} className="hst-media-item hst-media-pending">
                            <img src={m.url} alt={m.name} className="hst-media-thumb" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('stumps', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Property damage observed? Yes/No */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Property Damage Observed?</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Confirm whether any boundary fence, crops, structure, or adjoining property sustained damage.
                    </p>
                    <div className="hst-radio-pill-group">
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, propertyDamageObserved: false }))}
                        className={`hst-radio-pill ${stageFormData.propertyDamageObserved === false ? 'active-yes' : ''}`}
                      >
                        <Check size={14} /> No Damage Observed
                      </button>
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, propertyDamageObserved: true }))}
                        className={`hst-radio-pill ${stageFormData.propertyDamageObserved === true ? 'active-no' : ''}`}
                      >
                        <AlertTriangle size={14} /> Yes, Damage Observed
                      </button>
                    </div>
                    {fieldErrors.propertyDamageObserved && (
                      <p className="hst-error-text">{fieldErrors.propertyDamageObserved}</p>
                    )}
                  </div>

                  {/* Conditional: Damage Photos & Incident Notes only when damage is observed */}
                  {stageFormData.propertyDamageObserved === true && (
                    <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-4 animate-fade-in">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
                        <AlertCircle size={15} /> Incident Evidence &amp; Damage Report
                      </div>

                      <div className="hst-input-group">
                        <label className="hst-label">
                          <span>Incident Notes &amp; Damage Description</span>
                          <span className="hst-required-pill">* Required when damage reported</span>
                        </label>
                        <textarea
                          rows={2}
                          disabled={!isContractor}
                          value={stageFormData.damageIncidentNotes}
                          onChange={(e) => setStageFormData(prev => ({ ...prev, damageIncidentNotes: e.target.value }))}
                          placeholder="Describe the nature of property damage, affected trees/fence, and immediate mitigation."
                          className="hst-textarea"
                        />
                        {fieldErrors.damageIncidentNotes && (
                          <p className="hst-error-text">{fieldErrors.damageIncidentNotes}</p>
                        )}
                      </div>

                      <div className="hst-evidence-block">
                        <label className="hst-label">
                          <span>Damage Photos</span>
                          <span className="hst-required-pill">* Required when damage reported</span>
                        </label>
                        <label className="hst-dropzone">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            disabled={!isContractor}
                            onChange={(e) => handleFileSelect('damage', e)}
                            className="hidden"
                          />
                          <div className="hst-dropzone-icon"><Upload size={20} /></div>
                          <div>
                            <strong className="hst-dropzone-title">Upload Photos of Damaged Area</strong>
                            <span className="hst-dropzone-sub">PNG, JPG up to 20MB</span>
                          </div>
                        </label>
                        {fieldErrors.damageMedia && (
                          <p className="hst-error-text">{fieldErrors.damageMedia}</p>
                        )}
                        {newMediaByCategory.damage?.length > 0 && (
                          <div className="hst-media-grid mt-2">
                            {newMediaByCategory.damage.map((m, idx) => (
                              <div key={idx} className="hst-media-item hst-media-pending">
                                <img src={m.url} alt={m.name} className="hst-media-thumb" />
                                <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('damage', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ----------------- STAGE 3: DE-BRANCHING & BUCKING ----------------- */}
              {activeStageId === 'stage_3' && (
                <div className="space-y-5">
                  {/* Number of logs produced */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Number of Logs Produced</span>
                      <span className="hst-required-pill">* Required non-negative number</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!isContractor}
                      value={stageFormData.logsProduced}
                      onChange={(e) => setStageFormData(prev => ({ ...prev, logsProduced: e.target.value }))}
                      placeholder="e.g. 18"
                      className="hst-input"
                    />
                    {fieldErrors.logsProduced && (
                      <p className="hst-error-text">{fieldErrors.logsProduced}</p>
                    )}
                  </div>

                  {/* Photos of processed logs */}
                  <div className="hst-evidence-block">
                    <label className="hst-label">
                      <span>Photos of Processed Logs</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Photographs showing sectioned log billets, clean delimbing, and billets at landing point.
                    </p>
                    <label className="hst-dropzone">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={!isContractor}
                        onChange={(e) => handleFileSelect('logs', e)}
                        className="hidden"
                      />
                      <div className="hst-dropzone-icon"><Upload size={20} /></div>
                      <div>
                        <strong className="hst-dropzone-title">Upload Processed Logs Photos</strong>
                        <span className="hst-dropzone-sub">PNG, JPG up to 20MB</span>
                      </div>
                    </label>
                    {fieldErrors.logsMedia && (
                      <p className="hst-error-text">{fieldErrors.logsMedia}</p>
                    )}
                    {newMediaByCategory.logs?.length > 0 && (
                      <div className="hst-media-grid mt-2">
                        {newMediaByCategory.logs.map((m, idx) => (
                          <div key={idx} className="hst-media-item hst-media-pending">
                            <img src={m.url} alt={m.name} className="hst-media-thumb" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('logs', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Branches and debris cleared? */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Branches &amp; Debris Cleared?</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Crowns, slash, and timber debris moved away from pathways and stacked appropriately.
                    </p>
                    <div className="hst-radio-pill-group">
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, debrisCleared: true }))}
                        className={`hst-radio-pill ${stageFormData.debrisCleared === true ? 'active-yes' : ''}`}
                      >
                        <Check size={14} /> Yes, Cleared
                      </button>
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, debrisCleared: false }))}
                        className={`hst-radio-pill ${stageFormData.debrisCleared === false ? 'active-no' : ''}`}
                      >
                        <X size={14} /> No, In Progress
                      </button>
                    </div>
                    {fieldErrors.debrisCleared && (
                      <p className="hst-error-text">{fieldErrors.debrisCleared}</p>
                    )}
                  </div>

                  {/* Logs stacked at collection area? */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Logs Stacked at Collection Area?</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Merchantable logs gathered and stacked at the agreed loading landing area.
                    </p>
                    <div className="hst-radio-pill-group">
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, logsStackedAtCollection: true }))}
                        className={`hst-radio-pill ${stageFormData.logsStackedAtCollection === true ? 'active-yes' : ''}`}
                      >
                        <Check size={14} /> Yes, Stacked
                      </button>
                      <button
                        type="button"
                        disabled={!isContractor}
                        onClick={() => setStageFormData(prev => ({ ...prev, logsStackedAtCollection: false }))}
                        className={`hst-radio-pill ${stageFormData.logsStackedAtCollection === false ? 'active-no' : ''}`}
                      >
                        <X size={14} /> No
                      </button>
                    </div>
                    {fieldErrors.logsStackedAtCollection && (
                      <p className="hst-error-text">{fieldErrors.logsStackedAtCollection}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- STAGE 4: SCALING & TRANSIT PREP ----------------- */}
              {activeStageId === 'stage_4' && (
                <div className="space-y-5">
                  {/* Number of logs measured */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="hst-input-group">
                      <label className="hst-label">
                        <span>Number of Logs Measured</span>
                        <span className="hst-required-pill">* Required non-negative number</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        disabled={!isContractor}
                        value={stageFormData.logsMeasured}
                        onChange={(e) => setStageFormData(prev => ({ ...prev, logsMeasured: e.target.value }))}
                        placeholder="e.g. 18"
                        className="hst-input"
                      />
                      {fieldErrors.logsMeasured && (
                        <p className="hst-error-text">{fieldErrors.logsMeasured}</p>
                      )}
                    </div>

                    {/* Estimated Timber Volume (optional) */}
                    <div className="hst-input-group">
                      <label className="hst-label">
                        <span>Estimated Timber Volume (m³)</span>
                        <span className="hst-label-hint">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isContractor}
                        value={stageFormData.estimatedVolume}
                        onChange={(e) => setStageFormData(prev => ({ ...prev, estimatedVolume: e.target.value }))}
                        placeholder="e.g. 1.70"
                        className="hst-input"
                      />
                    </div>
                  </div>

                  {/* Photos showing log diameter measurements */}
                  <div className="hst-evidence-block">
                    <label className="hst-label">
                      <span>Photos Showing Log Diameter Measurements</span>
                      <span className="hst-required-pill">* Required</span>
                    </label>
                    <p className="hst-field-sub">
                      Photos with measuring tape across log end-diameters / girth marking log grade numbers.
                    </p>
                    <label className="hst-dropzone">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        disabled={!isContractor}
                        onChange={(e) => handleFileSelect('measurements', e)}
                        className="hidden"
                      />
                      <div className="hst-dropzone-icon"><Upload size={20} /></div>
                      <div>
                        <strong className="hst-dropzone-title">Upload Log Measurement Photos</strong>
                        <span className="hst-dropzone-sub">PNG, JPG up to 20MB</span>
                      </div>
                    </label>
                    {fieldErrors.measurementsMedia && (
                      <p className="hst-error-text">{fieldErrors.measurementsMedia}</p>
                    )}
                    {newMediaByCategory.measurements?.length > 0 && (
                      <div className="hst-media-grid mt-2">
                        {newMediaByCategory.measurements.map((m, idx) => (
                          <div key={idx} className="hst-media-item hst-media-pending">
                            <img src={m.url} alt={m.name} className="hst-media-thumb" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('measurements', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Truck loading / transport photos - CONDITIONAL ON CONTRACTOR TIMBER PURCHASE */}
                  {isTimberPurchased ? (
                    <div className="hst-evidence-block p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                          Contractor Timber Purchase: Haulage Evidence
                        </span>
                      </div>
                      <p className="text-xs text-blue-300">
                        Based on the site inspection record, the contractor is purchasing the timber. Truck-loading and transit evidence is required before dispatch.
                      </p>
                      <label className="hst-dropzone !border-blue-500/40">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          disabled={!isContractor}
                          onChange={(e) => handleFileSelect('truck_loading', e)}
                          className="hidden"
                        />
                        <div className="hst-dropzone-icon !bg-blue-500/20 !text-blue-300"><Upload size={20} /></div>
                        <div>
                          <strong className="hst-dropzone-title">Upload Truck-Loading &amp; Transport Photos</strong>
                          <span className="hst-dropzone-sub">Truck loaded with secured logs &amp; registration</span>
                        </div>
                      </label>
                      {fieldErrors.truckLoadingMedia && (
                        <p className="hst-error-text">{fieldErrors.truckLoadingMedia}</p>
                      )}
                      {newMediaByCategory.truck_loading?.length > 0 && (
                        <div className="hst-media-grid mt-2">
                          {newMediaByCategory.truck_loading.map((m, idx) => (
                            <div key={idx} className="hst-media-item hst-media-pending">
                              <img src={m.url} alt={m.name} className="hst-media-thumb" />
                              <button
                              type="button"
                              onClick={() => handleRemoveNewMedia('truck_loading', idx)}
                              className="hst-media-remove-btn"
                            >
                              <Trash2 size={12} />
                            </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40 text-slate-400 text-xs flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-slate-500" />
                      <span>Truck-loading photos not required (Timber remains with landowner per site inspection).</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle size={17} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="hst-footer">
          <button
            type="button"
            onClick={onClose}
            className="hst-btn-close"
          >
            Close
          </button>

          {/* Contractor Controls */}
          {isContractor && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmitStage(currentStatus === 'NOT_STARTED' ? 'IN_PROGRESS' : currentStatus)}
                className="hst-btn-save"
                title="Save current inputs as In Progress"
              >
                Save Progress
              </button>

              {currentStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitStage('SUBMITTED')}
                  className="hst-btn-complete"
                >
                  <CheckCircle2 size={16} />
                  <span>Submit Stage {activeStageConfig.number} for Verification</span>
                </button>
              )}
            </div>
          )}

          {/* Landowner / Admin Reviewer Controls */}
          {!isContractor && (
            <div className="flex items-center gap-3">
              {showReviewerInput ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reviewerNotesInput}
                    onChange={(e) => setReviewerNotesInput(e.target.value)}
                    placeholder="Describe required changes..."
                    className="px-3 py-1.5 text-xs bg-black/60 border border-red-500/40 rounded-xl text-white w-64 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={submitting || !reviewerNotesInput.trim()}
                    onClick={() => handleSubmitStage('REJECTED')}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewerInput(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {currentStatus === 'SUBMITTED' && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowReviewerInput(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RotateCcw size={14} /> Request Changes
                    </button>
                  )}
                  {currentStatus !== 'VERIFIED' && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitStage('VERIFIED')}
                      className="hst-btn-complete"
                    >
                      <CheckCircle2 size={16} />
                      <span>Approve &amp; Verify Stage {activeStageConfig.number}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Media Preview Lightbox Modal */}
        {previewMedia && (
          <div
            className="fixed inset-0 z-[1500] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
            onClick={() => setPreviewMedia(null)}
          >
            <button
              type="button"
              onClick={() => setPreviewMedia(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-slate-800 text-white hover:text-emerald-400 flex items-center justify-center cursor-pointer transition-colors shadow-lg"
            >
              <X size={24} />
            </button>
            {previewMedia.type === 'video' ? (
              <video src={previewMedia.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl border border-emerald-500/30 shadow-2xl" />
            ) : (
              <img src={previewMedia.url} alt="Stage full evidence" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-emerald-500/30 shadow-2xl" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HarvestStageTrackerModal;
