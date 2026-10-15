import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { compressImage } from '../../utils/imageCompressor';
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
  const navigate = useNavigate();
  const isContractor = role === 'contractor';

  // Safe robust ID extraction that persists across renders
  const getSafeId = (obj) => {
    if (!obj) return null;
    const val = obj.id || obj._id || obj.harvest_request_id || obj.req?.id || obj.req?._id;
    if (!val || val === 'undefined' || val === 'null') return null;
    return String(val);
  };

  const initialReqId = getSafeId(request);
  const reqIdRef = useRef(initialReqId);
  if (initialReqId && reqIdRef.current !== initialReqId) {
    reqIdRef.current = initialReqId;
  }
  const reqId = initialReqId || reqIdRef.current;
  const [stagesData, setStagesData] = useState(() => request?.harvest_stages || {});

  useEffect(() => {
    if (request?.harvest_stages) {
      setStagesData(request.harvest_stages);
    }
  }, [request?.harvest_stages]);

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
  const [successAlert, setSuccessAlert] = useState(null);
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

  const handleStageSelect = (stageId, currentStagesMap = stagesData) => {
    setActiveStageId(stageId);
    const rec = currentStagesMap[stageId] || {};
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

  // Helper to downscale and compress images so uploads are fast (<150KB) and never time out
  const compressImageFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      if (file.size > 8 * 1024 * 1024) {
        setErrorMsg('Video file must be under 8MB to prevent upload errors.');
        return null;
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
    try {
      const compressed = await compressImage(file, 960, 0.70);
      return compressed;
    } catch (err) {
      console.warn('Fallback to raw image reader:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFileSelect = async (category, e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMsg('');
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File exceeds 25MB limit. Please upload optimized photos or short clips.');
        continue;
      }

      const isVid = file.type.startsWith('video');
      const dataUrl = await compressImageFile(file);
      if (dataUrl) {
        const item = {
          url: dataUrl,
          type: isVid ? 'video' : 'image',
          name: file.name,
          category,
          timestamp: new Date().toISOString()
        };
        setNewMediaByCategory(prev => ({
          ...prev,
          [category]: [...(prev[category] || []), item]
        }));
      }
    }
  };

  const handleRemoveNewMedia = (category, idx) => {
    setNewMediaByCategory(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveMedia = async (category, mediaItem) => {
    if (mediaItem.isNew) {
      setNewMediaByCategory(prev => ({
        ...prev,
        [category]: (prev[category] || []).filter(item => item !== mediaItem && item.url !== mediaItem.url)
      }));
    } else {
      // Guard against missing or undefined reqId
      if (!reqId) {
        console.warn('Cannot persist media removal: reqId is undefined');
        return;
      }

      // Remove from existing media in active stage record
      const updatedMedia = (activeStageRecord.media || []).filter(
        item => item !== mediaItem && item.url !== mediaItem.url
      );
      const updatedStageRecord = {
        ...activeStageRecord,
        media: updatedMedia
      };
      const updatedStagesMap = {
        ...stagesData,
        [activeStageId]: updatedStageRecord
      };
      setStagesData(updatedStagesMap);

      // Persist directly to MongoDB database
      try {
        await harvestService.updateHarvestStage(reqId, {
          stage_id: activeStageId,
          status: currentStatus,
          replace_media: true,
          media: updatedMedia,
          stage_data: activeStageRecord.stage_data
        });
      } catch (err) {
        console.warn('Could not persist media removal to backend:', err);
      }

      // Sync localStorage cache
      try {
        const storedStr = localStorage.getItem('treeconnect_harvest_requests');
        if (storedStr) {
          const list = JSON.parse(storedStr);
          if (Array.isArray(list)) {
            const updatedList = list.map(item => {
              const itemId = item.id || item._id;
              if (String(itemId).toLowerCase() === String(reqId).toLowerCase()) {
                return {
                  ...item,
                  harvest_stages: {
                    ...(item.harvest_stages || {}),
                    [activeStageId]: updatedStageRecord
                  }
                };
              }
              return item;
            });
            localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updatedList));
          }
        }
      } catch (e) {}

      // Fire real-time event for Operations page and NotificationBell
      window.dispatchEvent(new CustomEvent('treeconnect_harvest_updated', {
        detail: { requestId: reqId, stageId: activeStageId }
      }));
    }
  };

  const getCategoryMedia = (catKey, defaultIdx = 0) => {
    const matchesCategory = (m) => m && (m.category === catKey);
    const explicitExisting = existingMedia.filter(matchesCategory);
    const explicitNew = (newMediaByCategory[catKey] || []).map(m => ({ ...m, isNew: true }));

    if (explicitExisting.length > 0 || explicitNew.length > 0) {
      return [...explicitExisting, ...explicitNew];
    }

    if (existingMedia.length > 0 && existingMedia[defaultIdx]) {
      return [existingMedia[defaultIdx]];
    }

    return [];
  };

  const countCategoryFiles = (catKey, defaultIdx = 0) => {
    return getCategoryMedia(catKey, defaultIdx).length;
  };

  const renderEvidenceSection = (label, subtitle, catKey, defaultIdx = 0) => {
    const mediaList = getCategoryMedia(catKey, defaultIdx);
    const hasMedia = mediaList.length > 0;

    return (
      <div className="hst-evidence-block">
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="hst-label !mb-0">
            <span>{label}</span>
            {isContractor ? (
              <span className="hst-required-pill">* Required</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {hasMedia ? '✓ Evidence Submitted' : 'Pending Upload'}
              </span>
            )}
          </label>
          {hasMedia && (
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={12} /> {mediaList.length} File{mediaList.length > 1 ? 's' : ''} Uploaded
            </span>
          )}
        </div>

        {subtitle && (
          <p className="hst-field-sub mb-2">
            {subtitle}
          </p>
        )}

        {/* Instead of empty upload box, show the uploaded images right here! */}
        {hasMedia ? (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mediaList.map((m, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-xl overflow-hidden border border-emerald-500/35 bg-[#040d07] cursor-pointer shadow-md transition-all hover:border-emerald-400/60"
                  onClick={() => setPreviewMedia(m)}
                  title="Click to view full photo in lightbox"
                >
                  {m.type === 'video' ? (
                    <div className="w-full h-44 flex items-center justify-center bg-black/70 text-emerald-400 relative">
                      <Play size={32} />
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/80 px-2 py-0.5 rounded text-white flex items-center gap-1">
                        <Video size={10} /> Video Evidence
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-full h-44">
                      <img
                        src={m.url}
                        alt={m.name || `${label} Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                          <Camera size={13} /> View Full Photo
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                        ✓ On-Site Verified Evidence
                      </div>
                    </div>
                  )}
                  {isContractor && currentStatus !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(catKey, m);
                      }}
                      className="hst-media-remove-btn"
                      title="Remove photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Contractor option to add additional photo */}
            {isContractor && (
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold cursor-pointer transition-colors mt-1">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleFileSelect(catKey, e)}
                  className="hidden"
                />
                <Upload size={13} />
                <span>+ Upload Additional Photos</span>
              </label>
            )}
          </div>
        ) : isContractor ? (
          /* Only show upload dropzone if Contractor and NO photo has been uploaded yet */
          <div className="mt-2">
            <label className="hst-dropzone">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => handleFileSelect(catKey, e)}
                className="hidden"
              />
              <div className="hst-dropzone-icon"><Upload size={20} /></div>
              <div className="hst-dropzone-text-wrap">
                <span className="hst-dropzone-title">Upload {label}</span>
                <span className="hst-dropzone-sub">PNG, JPG, MP4 up to 20MB</span>
              </div>
            </label>
            {fieldErrors[`${catKey}Media`] && (
              <p className="hst-error-text">{fieldErrors[`${catKey}Media`]}</p>
            )}
          </div>
        ) : (
          /* Landowner audit when no photo has been uploaded yet */
          <div className="p-3.5 rounded-xl bg-[#07130a] border border-amber-500/25 text-amber-300/80 text-xs flex items-center gap-2 mt-2">
            <AlertCircle size={15} className="text-amber-400 shrink-0" />
            <span>No evidence photos uploaded by contractor for this item yet.</span>
          </div>
        )}
      </div>
    );
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
  const handleSubmitStage = async (newStatus, isSaveProgress = false) => {
    setErrorMsg('');

    if (!reqId) {
      setErrorMsg('Harvest request ID is missing. Please close and re-open the stage tracker.');
      return;
    }

    // If contractor is submitting for verification, run validations
    if (!isSaveProgress && (newStatus === 'SUBMITTED' || newStatus === 'VERIFIED')) {
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

      let updatedReq = null;
      let apiTimeoutOrError = false;

      try {
        const res = await harvestService.updateHarvestStage(reqId, payload);
        updatedReq = res?.harvest_request || res;
      } catch (apiErr) {
        console.warn('Backend updateHarvestStage failed/timed out, persisting locally:', apiErr);
        apiTimeoutOrError = true;
      }

      const currIdx = HARVEST_STAGES_CONFIG.findIndex(s => s.id === activeStageId);
      const isSubmittingForward = !isSaveProgress && (newStatus === 'SUBMITTED' || newStatus === 'VERIFIED');
      const hasNextStage = currIdx >= 0 && currIdx < HARVEST_STAGES_CONFIG.length - 1;
      const nextStageId = (isSubmittingForward && hasNextStage)
        ? HARVEST_STAGES_CONFIG[currIdx + 1].id
        : activeStageId;

      const updatedStageRecord = {
        ...(stagesData[activeStageId] || {}),
        status: newStatus,
        notes: payload.notes || stagesData[activeStageId]?.notes || '',
        media: [...(stagesData[activeStageId]?.media || []), ...(payload.media || [])],
        stage_data: payload.stage_data,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'VERIFIED' ? { verified_at: new Date().toISOString() } : {}),
        ...(newStatus === 'SUBMITTED' ? { submitted_at: new Date().toISOString() } : {})
      };

      const newStagesMap = {
        ...stagesData,
        [activeStageId]: updatedStageRecord
      };
      setStagesData(newStagesMap);

      // Synchronize in local storage treeconnect_harvest_requests for real-time reflection across tabs/roles
      try {
        const storedStr = localStorage.getItem('treeconnect_harvest_requests');
        if (storedStr) {
          const list = JSON.parse(storedStr);
          if (Array.isArray(list)) {
            const updatedList = list.map(item => {
              const itemId = item.id || item._id;
              const isMatch = itemId && reqId && (
                String(itemId).toLowerCase() === String(reqId).toLowerCase() ||
                String(itemId).toLowerCase().startsWith(String(reqId).toLowerCase()) ||
                String(reqId).toLowerCase().startsWith(String(itemId).toLowerCase())
              );
              if (isMatch) {
                const currentStages = item.harvest_stages || {};
                return {
                  ...item,
                  current_harvest_stage: nextStageId,
                  status: newStatus === 'VERIFIED' && activeStageId === 'stage_4' ? 'COMPLETED' : (item.status === 'OPERATION_READY' ? 'IN_PROGRESS' : item.status),
                  harvest_stages: {
                    ...currentStages,
                    [activeStageId]: updatedStageRecord
                  },
                  updatedAt: new Date().toISOString()
                };
              }
              return item;
            });
            localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updatedList));
          }
        }
      } catch (storageErr) {
        console.warn('Could not update localStorage harvest_requests:', storageErr);
      }

      // Dispatch real-time global event for NotificationBell and all active pages
      window.dispatchEvent(new CustomEvent('treeconnect_harvest_updated', {
        detail: {
          requestId: reqId,
          stageId: activeStageId,
          status: newStatus,
          nextStageId: nextStageId,
          timestamp: new Date().toISOString()
        }
      }));

      const safeId = reqId || getSafeId(request) || getSafeId(updatedReq);
      const mergedReq = {
        ...(request || {}),
        ...(updatedReq || {}),
        ...(safeId ? { id: safeId, _id: safeId } : {}),
        current_harvest_stage: nextStageId,
        harvest_stages: newStagesMap
      };

      if (onStageUpdated) {
        onStageUpdated(mergedReq);
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

      const timeoutNotice = apiTimeoutOrError ? ' (Saved locally; network timed out)' : '';

      // Success feedback handling
      if (isSaveProgress) {
        // Save Progress completed -> close modal & go to harvest operations
        setSuccessAlert({
          type: 'SAVED',
          message: `✓ Progress saved for Stage ${activeStageConfig.number}!${timeoutNotice} Redirecting to Harvest Operations...`
        });
        setTimeout(() => {
          if (onClose) onClose();
          const targetUrl = isContractor
            ? `/contractor/harvest-operations?requestId=${reqId}`
            : `/landowner/harvest-operations?requestId=${reqId}`;
          navigate(targetUrl);
        }, 700);
      } else if (newStatus === 'VERIFIED') {
        setSuccessAlert({
          type: 'APPROVED',
          message: hasNextStage
            ? `✓ Stage ${activeStageConfig.number} (${activeStageConfig.title}) has been successfully approved!${timeoutNotice} Advancing to Stage ${activeStageConfig.number + 1}...`
            : `🎉 All 4 Harvest Stages Approved! The harvesting operation has been verified and marked as COMPLETED.${timeoutNotice}`
        });
        setTimeout(() => {
          if (hasNextStage) {
            const nextStage = HARVEST_STAGES_CONFIG[currIdx + 1];
            handleStageSelect(nextStage.id, newStagesMap);
          } else {
            if (onClose) onClose();
          }
        }, 1800);
      } else if (newStatus === 'SUBMITTED') {
        setSuccessAlert({
          type: 'SUBMITTED',
          message: `✓ Stage ${activeStageConfig.number} submitted for Landowner audit verification!${timeoutNotice}`
        });
        setTimeout(() => {
          if (hasNextStage) {
            const nextStage = HARVEST_STAGES_CONFIG[currIdx + 1];
            handleStageSelect(nextStage.id, newStagesMap);
          } else {
            if (onClose) onClose();
          }
        }, 1200);
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

            {/* Approval / Save Success Alert Message */}
            {successAlert && (
              <div className="p-3.5 mb-4 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span className="font-bold">{successAlert.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessAlert(null)}
                  className="text-xs font-semibold text-emerald-400 hover:text-white shrink-0 px-1.5 py-0.5 rounded"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Current Stage Verified Banner */}
            {currentStatus === 'VERIFIED' && !successAlert && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-950/40 border border-emerald-500/35 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span className="font-bold">✓ This harvest stage has been verified &amp; approved by the landowner.</span>
              </div>
            )}

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

            {/* STAGE-SPECIFIC ESSENTIAL FIELDS & EVIDENCE */}
            <div className="hst-stage-form-wrap">

              {/* ----------------- STAGE 1: MOBILIZATION & SAFETY ----------------- */}
              {activeStageId === 'stage_1' && (
                <div className="space-y-5">
                  {/* Evidence 1: Boundary-marked trees */}
                  {renderEvidenceSection(
                    '1. Boundary-marked Trees & Site Photos',
                    'Photographs showing marked perimeter boundaries and tree identification tags before operations start.',
                    'boundary',
                    0
                  )}

                  {/* Evidence 2: Machinery positioning */}
                  {renderEvidenceSection(
                    '2. Machinery Positioning & Site Access Photos',
                    'Photos of machinery placement, clear access paths, and established landing zones.',
                    'machinery',
                    1
                  )}

                  {/* Safety Arrangements Confirmed Yes/No */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Safety Arrangements Confirmed?</span>
                      {isContractor && <span className="hst-required-pill">* Required</span>}
                    </label>
                    <p className="hst-field-sub">
                      Confirm that PPE, exclusion perimeter, first-aid kit, and safety protocols are ready.
                    </p>
                    {isContractor ? (
                      <div className="hst-radio-pill-group">
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, safetyConfirmed: true }))}
                          className={`hst-radio-pill ${stageFormData.safetyConfirmed === true ? 'active-yes' : ''}`}
                        >
                          <Check size={14} /> Yes, Confirmed
                        </button>
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, safetyConfirmed: false }))}
                          className={`hst-radio-pill ${stageFormData.safetyConfirmed === false ? 'active-no' : ''}`}
                        >
                          <X size={14} /> No
                        </button>
                      </div>
                    ) : (
                      <div>
                        {stageFormData.safetyConfirmed === true ? (
                          <div className="hst-audit-status-pill success">
                            <Check size={15} /> Yes, Confirmed by Contractor
                          </div>
                        ) : stageFormData.safetyConfirmed === false ? (
                          <div className="hst-audit-status-pill danger">
                            <X size={15} /> No, Safety Protocols Incomplete
                          </div>
                        ) : (
                          <div className="hst-audit-status-pill pending">
                            <Clock size={15} /> Pending Contractor Confirmation
                          </div>
                        )}
                      </div>
                    )}
                    {fieldErrors.safetyConfirmed && (
                      <p className="hst-error-text">{fieldErrors.safetyConfirmed}</p>
                    )}
                  </div>

                  {/* Site Hazards / Observations */}
                  <div className="hst-input-group">
                    <div className="flex items-center justify-between">
                      <label className="hst-label w-full">
                        <span>Site Hazards or Field Observations</span>
                        <div className="flex items-center gap-2">
                          <span className="hst-optional-pill">{isContractor ? 'Optional' : 'Contractor Notes'}</span>
                          {isContractor && (
                            <button
                              type="button"
                              onClick={() => setStageFormData(prev => ({ ...prev, hasSiteHazards: !prev.hasSiteHazards }))}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold normal-case tracking-normal ml-2"
                            >
                              {stageFormData.hasSiteHazards ? 'Hide Notes' : '+ Add Hazard Observation'}
                            </button>
                          )}
                        </div>
                      </label>
                    </div>
                    {isContractor ? (
                      stageFormData.hasSiteHazards && (
                        <div className="mt-2 space-y-1 animate-fade-in">
                          <textarea
                            rows={2}
                            value={stageFormData.siteHazardsNotes}
                            onChange={(e) => setStageFormData(prev => ({ ...prev, siteHazardsNotes: e.target.value }))}
                            placeholder="e.g. Overhead powerlines identified near East border. Safe felling notch angle adjusted."
                            className="hst-textarea"
                          />
                          {fieldErrors.siteHazardsNotes && (
                            <p className="hst-error-text">{fieldErrors.siteHazardsNotes}</p>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="mt-1">
                        <div className="hst-audit-notes-card">
                          {stageFormData.siteHazardsNotes ? (
                            <span className="text-emerald-100 font-medium">{stageFormData.siteHazardsNotes}</span>
                          ) : (
                            <span className="text-slate-400 italic">No specific site hazards or remarks reported by contractor.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- STAGE 2: FELLING OPERATIONS ----------------- */}
              {activeStageId === 'stage_2' && (
                <div className="space-y-5">
                  {/* Number of trees felled */}
                  <div className="hst-input-group mb-6">
                    <label className="hst-label">
                      <span>Number of Trees Felled</span>
                      {isContractor && <span className="hst-required-pill">* Required</span>}
                    </label>
                    {isContractor ? (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={stageFormData.treesFelled}
                            onChange={(e) => setStageFormData(prev => ({ ...prev, treesFelled: e.target.value }))}
                            placeholder="e.g. 6"
                            className="hst-input pr-16"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
                            trees
                          </span>
                        </div>
                        {fieldErrors.treesFelled && (
                          <p className="hst-error-text">{fieldErrors.treesFelled}</p>
                        )}
                      </>
                    ) : (
                      <div className="hst-audit-value-card">
                        <span className="text-2xl font-black text-emerald-400">{stageFormData.treesFelled || '0'}</span>
                        <span className="text-xs text-slate-300 font-semibold">Trees Logged / Felled</span>
                      </div>
                    )}
                  </div>

                  {/* Felled trees and stumps photos */}
                  <div className="pt-2">
                    {renderEvidenceSection(
                      'Photos of Felled Trees & Stumps',
                      'Clear photos showing the dropped trees, hinge cuts, and clean stump heights.',
                      'stumps',
                      0
                    )}
                  </div>

                  {/* Property damage observed? Yes/No */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Property Damage Observed?</span>
                      {isContractor && <span className="hst-required-pill">* Required</span>}
                    </label>
                    <p className="hst-field-sub">
                      Confirm whether any boundary fence, crops, structure, or adjoining property sustained damage.
                    </p>
                    {isContractor ? (
                      <div className="hst-radio-pill-group">
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, propertyDamageObserved: false }))}
                          className={`hst-radio-pill ${stageFormData.propertyDamageObserved === false ? 'active-yes' : ''}`}
                        >
                          <Check size={14} /> No Damage Observed
                        </button>
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, propertyDamageObserved: true }))}
                          className={`hst-radio-pill ${stageFormData.propertyDamageObserved === true ? 'active-no' : ''}`}
                        >
                          <AlertTriangle size={14} /> Yes, Damage Observed
                        </button>
                      </div>
                    ) : (
                      <div>
                        {stageFormData.propertyDamageObserved === false ? (
                          <div className="hst-audit-status-pill success">
                            <Check size={15} /> No Damage Observed
                          </div>
                        ) : stageFormData.propertyDamageObserved === true ? (
                          <div className="hst-audit-status-pill danger">
                            <AlertTriangle size={15} /> Yes, Damage Observed
                          </div>
                        ) : (
                          <div className="hst-audit-status-pill pending">
                            <Clock size={15} /> Pending Contractor Inspection
                          </div>
                        )}
                      </div>
                    )}
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
                          {isContractor && <span className="hst-required-pill">* Required</span>}
                        </label>
                        {isContractor ? (
                          <>
                            <textarea
                              rows={2}
                              value={stageFormData.damageIncidentNotes}
                              onChange={(e) => setStageFormData(prev => ({ ...prev, damageIncidentNotes: e.target.value }))}
                              placeholder="Describe the nature of property damage, affected trees/fence, and immediate mitigation."
                              className="hst-textarea"
                            />
                            {fieldErrors.damageIncidentNotes && (
                              <p className="hst-error-text">{fieldErrors.damageIncidentNotes}</p>
                            )}
                          </>
                        ) : (
                          <div className="hst-audit-notes-card border-amber-500/30 bg-amber-950/25 text-amber-100">
                            {stageFormData.damageIncidentNotes || 'No additional incident remarks reported.'}
                          </div>
                        )}
                      </div>

                      {renderEvidenceSection(
                        'Damage Photos',
                        'Photos showing the affected area or damage sustained.',
                        'damage',
                        1
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ----------------- STAGE 3: DE-BRANCHING & BUCKING ----------------- */}
              {activeStageId === 'stage_3' && (
                <div className="space-y-5">
                  {/* Number of logs produced */}
                  <div className="hst-input-group mb-6">
                    <label className="hst-label">
                      <span>Number of Logs Produced</span>
                      {isContractor && <span className="hst-required-pill">* Required</span>}
                    </label>
                    {isContractor ? (
                      <>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={stageFormData.logsProduced}
                            onChange={(e) => setStageFormData(prev => ({ ...prev, logsProduced: e.target.value }))}
                            placeholder="e.g. 18"
                            className="hst-input pr-16"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
                            logs
                          </span>
                        </div>
                        {fieldErrors.logsProduced && (
                          <p className="hst-error-text">{fieldErrors.logsProduced}</p>
                        )}
                      </>
                    ) : (
                      <div className="hst-audit-value-card">
                        <span className="text-2xl font-black text-emerald-400">{stageFormData.logsProduced || '0'}</span>
                        <span className="text-xs text-slate-300 font-semibold">Logs Produced</span>
                      </div>
                    )}
                  </div>

                  {/* Photos of processed logs */}
                  <div className="pt-2">
                    {renderEvidenceSection(
                      'Photos of Processed Logs',
                      'Photographs showing sectioned log billets, clean delimbing, and billets at landing point.',
                      'logs',
                      0
                    )}
                  </div>

                  {/* Branches and debris cleared? */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Branches &amp; Debris Cleared?</span>
                      {isContractor && <span className="hst-required-pill">* Required</span>}
                    </label>
                    <p className="hst-field-sub">
                      Crowns, slash, and timber debris moved away from pathways and stacked appropriately.
                    </p>
                    {isContractor ? (
                      <div className="hst-radio-pill-group">
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, debrisCleared: true }))}
                          className={`hst-radio-pill ${stageFormData.debrisCleared === true ? 'active-yes' : ''}`}
                        >
                          <Check size={14} /> Yes, Cleared
                        </button>
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, debrisCleared: false }))}
                          className={`hst-radio-pill ${stageFormData.debrisCleared === false ? 'active-no' : ''}`}
                        >
                          <X size={14} /> No, In Progress
                        </button>
                      </div>
                    ) : (
                      <div>
                        {stageFormData.debrisCleared === true ? (
                          <div className="hst-audit-status-pill success">
                            <Check size={15} /> Yes, Cleared &amp; Stacked
                          </div>
                        ) : stageFormData.debrisCleared === false ? (
                          <div className="hst-audit-status-pill warning">
                            <X size={15} /> In Progress / Not Cleared
                          </div>
                        ) : (
                          <div className="hst-audit-status-pill pending">
                            <Clock size={15} /> Pending Contractor Confirmation
                          </div>
                        )}
                      </div>
                    )}
                    {fieldErrors.debrisCleared && (
                      <p className="hst-error-text">{fieldErrors.debrisCleared}</p>
                    )}
                  </div>

                  {/* Logs stacked at collection area? */}
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Logs Stacked at Collection Area?</span>
                      {isContractor && <span className="hst-required-pill">* Required</span>}
                    </label>
                    <p className="hst-field-sub">
                      Merchantable logs gathered and stacked at the agreed loading landing area.
                    </p>
                    {isContractor ? (
                      <div className="hst-radio-pill-group">
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, logsStackedAtCollection: true }))}
                          className={`hst-radio-pill ${stageFormData.logsStackedAtCollection === true ? 'active-yes' : ''}`}
                        >
                          <Check size={14} /> Yes, Stacked
                        </button>
                        <button
                          type="button"
                          onClick={() => setStageFormData(prev => ({ ...prev, logsStackedAtCollection: false }))}
                          className={`hst-radio-pill ${stageFormData.logsStackedAtCollection === false ? 'active-no' : ''}`}
                        >
                          <X size={14} /> No
                        </button>
                      </div>
                    ) : (
                      <div>
                        {stageFormData.logsStackedAtCollection === true ? (
                          <div className="hst-audit-status-pill success">
                            <Check size={15} /> Yes, Stacked at Landing Point
                          </div>
                        ) : stageFormData.logsStackedAtCollection === false ? (
                          <div className="hst-audit-status-pill warning">
                            <X size={15} /> Not Stacked
                          </div>
                        ) : (
                          <div className="hst-audit-status-pill pending">
                            <Clock size={15} /> Pending Contractor Confirmation
                          </div>
                        )}
                      </div>
                    )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start mb-6">
                    <div className="hst-input-group">
                      <label className="hst-label">
                        <span>Number of Logs Measured</span>
                        {isContractor && <span className="hst-required-pill">* Required</span>}
                      </label>
                      {isContractor ? (
                        <>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={stageFormData.logsMeasured}
                              onChange={(e) => setStageFormData(prev => ({ ...prev, logsMeasured: e.target.value }))}
                              placeholder="e.g. 18"
                              className="hst-input pr-16"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
                              logs
                            </span>
                          </div>
                          {fieldErrors.logsMeasured && (
                            <p className="hst-error-text">{fieldErrors.logsMeasured}</p>
                          )}
                        </>
                      ) : (
                        <div className="hst-audit-value-card">
                          <span className="text-2xl font-black text-emerald-400">{stageFormData.logsMeasured || '0'}</span>
                          <span className="text-xs text-slate-300 font-semibold">Logs Scaled</span>
                        </div>
                      )}
                    </div>

                    {/* Estimated Timber Volume (optional) */}
                    <div className="hst-input-group">
                      <label className="hst-label">
                        <span>Estimated Timber Volume</span>
                        <span className="hst-optional-pill">{isContractor ? 'Optional' : 'Contractor Scale'}</span>
                      </label>
                      {isContractor ? (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={stageFormData.estimatedVolume}
                            onChange={(e) => setStageFormData(prev => ({ ...prev, estimatedVolume: e.target.value }))}
                            placeholder="e.g. 1.70"
                            className="hst-input pr-14"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400/80 pointer-events-none font-mono">
                            m³
                          </span>
                        </div>
                      ) : (
                        <div className="hst-audit-value-card">
                          <span className="text-2xl font-black text-emerald-400">
                            {stageFormData.estimatedVolume ? `${stageFormData.estimatedVolume} m³` : 'Not Specified'}
                          </span>
                          <span className="text-xs text-slate-300 font-semibold">Volume Calculation</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Photos showing log diameter measurements */}
                  <div className="pt-2">
                    {renderEvidenceSection(
                      'Photos Showing Log Diameter Measurements',
                      'Photos with measuring tape across log end-diameters / girth marking log grade numbers.',
                      'measurements',
                      0
                    )}
                  </div>

                  {/* Truck loading / transport photos - CONDITIONAL ON CONTRACTOR TIMBER PURCHASE */}
                  {isTimberPurchased ? (
                    <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-blue-400" />
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-wide">
                          Contractor Timber Purchase: Haulage Evidence
                        </span>
                      </div>
                      <p className="text-xs text-blue-300">
                        Based on the site inspection record, the contractor is purchasing the timber. Truck-loading and transit evidence is required before dispatch.
                      </p>
                      {renderEvidenceSection(
                        'Truck-Loading & Transport Photos',
                        'Truck loaded with secured logs & registration for dispatch.',
                        'truck_loading',
                        1
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
                onClick={() => handleSubmitStage(currentStatus === 'NOT_STARTED' ? 'IN_PROGRESS' : currentStatus, true)}
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
