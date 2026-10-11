import React, { useState } from 'react';
import {
  X,
  Camera,
  Video,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Play,
  Layers,
  Sparkles,
  Trash2,
  Maximize2
} from 'lucide-react';
import harvestService from '../../services/harvestService';
import './HarvestStageTrackerModal.css';

const DEFAULT_STAGES = [
  {
    id: 'stage_1',
    number: 1,
    title: 'Mobilization & Safety',
    subtitle: 'Machinery Landing & Boundary Check',
    description: 'Establish safety perimeters, position chainsaws/skidders/cranes, and photograph boundary-marked trees.',
    recommendedMedia: '2-4 Photos of machinery placement and tree boundary markings.'
  },
  {
    id: 'stage_2',
    number: 2,
    title: 'Felling Operations',
    subtitle: 'Directional Notching & Tree Drops',
    description: 'Document directional felling cuts, stump heights, and perimeter clearance to verify zero structural damage.',
    recommendedMedia: '3-5 Photos or short video of directional felling and clean stump cuts.'
  },
  {
    id: 'stage_3',
    number: 3,
    title: 'De-branching & Bucking',
    subtitle: 'Delimbing & Sectioning Logs',
    description: 'De-branch timber, clean crowns/slash, cross-cut logs into merchantable lengths, and stack at haulage landing.',
    recommendedMedia: '3-5 Photos of neatly stacked, de-limbed logs at haul loading point.'
  },
  {
    id: 'stage_4',
    number: 4,
    title: 'Scaling & Transit Prep',
    subtitle: 'Log Diameter Measurement & Hauling',
    description: 'Log end scaling with tape measures showing girth/diameter, log grade tagging, and truck loading.',
    recommendedMedia: '4-8 Photos showing tape measure across log ends and truck loaded for transit.'
  }
];

const HarvestStageTrackerModal = ({ request, role = 'contractor', onClose, onStageUpdated }) => {
  const isContractor = role === 'contractor';
  const reqId = request?.id || request?._id;
  const stagesData = request?.harvest_stages || {};

  const [activeStageId, setActiveStageId] = useState(request?.current_harvest_stage || 'stage_1');
  const [stageNotes, setStageNotes] = useState(stagesData[activeStageId]?.notes || '');
  const [treesLogged, setTreesLogged] = useState(stagesData[activeStageId]?.trees_logged || '');
  const [measuredVol, setMeasuredVol] = useState(stagesData[activeStageId]?.measured_volume || '');
  const [newMediaList, setNewMediaList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null);

  const activeStageConfig = DEFAULT_STAGES.find(s => s.id === activeStageId) || DEFAULT_STAGES[0];
  const activeStageRecord = stagesData[activeStageId] || {};
  const currentStatus = activeStageRecord.status || (activeStageId === 'stage_1' ? 'IN_PROGRESS' : 'PENDING');
  const existingMedia = activeStageRecord.media || [];

  const handleStageSelect = (stageId) => {
    setActiveStageId(stageId);
    setStageNotes(stagesData[stageId]?.notes || '');
    setTreesLogged(stagesData[stageId]?.trees_logged || '');
    setMeasuredVol(stagesData[stageId]?.measured_volume || '');
    setNewMediaList([]);
    setErrorMsg('');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('File exceeds 20MB limit. Please upload optimized photos or short clips.');
        return;
      }

      const isVid = file.type.startsWith('video');
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewMediaList(prev => [
          ...prev,
          {
            url: event.target.result,
            type: isVid ? 'video' : 'image',
            name: file.name,
            timestamp: new Date().toISOString()
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveNewMedia = (idx) => {
    setNewMediaList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitStage = async (newStatus) => {
    const totalMediaCount = existingMedia.length + newMediaList.length;
    if (newStatus === 'COMPLETED' && totalMediaCount === 0) {
      setErrorMsg('Mandatory Verification: Please upload at least 1 photo or video evidence before marking this stage complete.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        stage_id: activeStageId,
        status: newStatus,
        notes: stageNotes.trim(),
        media: newMediaList,
        trees_logged: treesLogged ? parseInt(treesLogged, 10) : undefined,
        measured_volume: measuredVol ? parseFloat(measuredVol) : undefined
      };

      const res = await harvestService.updateHarvestStage(reqId, payload);
      if (onStageUpdated) {
        onStageUpdated(res.harvest_request || res);
      }
      setNewMediaList([]);
      
      // Auto-switch to next stage if completing
      if (newStatus === 'COMPLETED') {
        const currIdx = DEFAULT_STAGES.findIndex(s => s.id === activeStageId);
        if (currIdx < DEFAULT_STAGES.length - 1) {
          handleStageSelect(DEFAULT_STAGES[currIdx + 1].id);
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
                  {isContractor ? 'Contractor Field Audit' : 'Landowner Transparency Feed'}
                </span>
              </div>
              <p className="hst-header-sub">
                Job #{String(reqId).substring(0, 8)} • Stage Photo &amp; Video Verification
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
            {DEFAULT_STAGES.map((stage) => {
              const stageStatus = stagesData[stage.id]?.status || (stage.id === 'stage_1' ? 'IN_PROGRESS' : 'PENDING');
              const isCompleted = stageStatus === 'COMPLETED';
              const isInProgress = stageStatus === 'IN_PROGRESS';
              const mediaCount = (stagesData[stage.id]?.media || []).length;

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageSelect(stage.id)}
                  className={`hst-step-btn ${activeStageId === stage.id ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="hst-step-number">
                    {isCompleted ? <CheckCircle2 size={16} /> : stage.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="hst-step-label block truncate">{stage.title}</span>
                    <span className="hst-step-meta block">
                      {isCompleted ? `${mediaCount} files • Done` : isInProgress ? 'In Progress' : 'Pending'}
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
                  {activeStageConfig.description}
                </p>
              </div>

              <span className={`hst-badge hst-badge-${currentStatus.toLowerCase()}`}>
                {currentStatus === 'COMPLETED' ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>Completed</span>
                  </>
                ) : currentStatus === 'IN_PROGRESS' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                    <span>In Progress</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} />
                    <span>Upcoming</span>
                  </>
                )}
              </span>
            </div>

            {/* Media Requirement Prompt */}
            <div className="hst-protocol-box">
              <Sparkles size={18} className="hst-protocol-icon" />
              <span><strong>Verification Protocol:</strong> {activeStageConfig.recommendedMedia}</span>
            </div>

            {/* Existing Uploaded Media for this stage */}
            <div>
              <div className="hst-media-section-header">
                <span className="hst-media-section-title">
                  Verified Stage Media ({existingMedia.length + newMediaList.length} files)
                </span>
                {existingMedia.length > 0 && (
                  <span className="text-[11px] text-emerald-400 font-bold">
                    ✓ {existingMedia.length} on-site files verified
                  </span>
                )}
              </div>

              {existingMedia.length === 0 && newMediaList.length === 0 ? (
                <div className="hst-empty-media">
                  <Camera size={24} className="opacity-40" />
                  <span>No visual proof uploaded yet for this stage.</span>
                </div>
              ) : (
                <div className="hst-media-grid">
                  {/* Server Media */}
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
                        <img src={m.url} alt={`Stage ${activeStageConfig.number} Evidence ${idx + 1}`} className="hst-media-thumb" />
                      )}
                    </div>
                  ))}

                  {/* Newly Selected Media (pending submit) */}
                  {newMediaList.map((m, idx) => (
                    <div key={`new-${idx}`} className="hst-media-item border-emerald-400/80 ring-2 ring-emerald-500/40">
                      {m.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-black/60 text-emerald-400">
                          <Play size={28} />
                          <span className="hst-media-video-badge"><Video size={10} /> New</span>
                        </div>
                      ) : (
                        <img src={m.url} alt={`New upload ${idx + 1}`} className="hst-media-thumb" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveNewMedia(idx); }}
                        className="hst-media-remove-btn"
                        title="Remove file"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contractor Upload Zone & Notes Input */}
            {isContractor && (
              <div className="space-y-4 pt-3 border-t border-emerald-500/20">
                {/* File Dropzone */}
                <label className="hst-dropzone">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="hst-dropzone-icon">
                    <Upload size={22} />
                  </div>
                  <div>
                    <strong className="hst-dropzone-title block">Click or drag photos/videos for Stage {activeStageConfig.number}</strong>
                    <span className="hst-dropzone-sub block mt-0.5">PNG, JPG, MP4, MOV up to 20MB per file</span>
                  </div>
                </label>

                {/* Additional Milestone Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Trees Processed</span>
                      <span className="hst-label-hint">(Optional count)</span>
                    </label>
                    <input
                      type="number"
                      value={treesLogged}
                      onChange={e => setTreesLogged(e.target.value)}
                      placeholder="e.g. 5"
                      className="hst-input"
                    />
                  </div>
                  <div className="hst-input-group">
                    <label className="hst-label">
                      <span>Estimated Volume Processed</span>
                      <span className="hst-label-hint">(m³, Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={measuredVol}
                      onChange={e => setMeasuredVol(e.target.value)}
                      placeholder="e.g. 1.70"
                      className="hst-input"
                    />
                  </div>
                </div>

                {/* Supervisor Notes */}
                <div className="hst-input-group">
                  <label className="hst-label">
                    <span>Field Notes &amp; Observations</span>
                  </label>
                  <textarea
                    rows={3}
                    value={stageNotes}
                    onChange={e => setStageNotes(e.target.value)}
                    placeholder="e.g. All 6 trees felled without damage to perimeter wall. Clean stump cuts recorded, stacked at loading point."
                    className="hst-textarea"
                  />
                </div>
              </div>
            )}

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

          {isContractor && (
            <div className="flex items-center gap-3">
              {newMediaList.length > 0 && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitStage(currentStatus === 'PENDING' ? 'IN_PROGRESS' : currentStatus)}
                  className="hst-btn-save"
                >
                  Save Media ({newMediaList.length})
                </button>
              )}

              {currentStatus !== 'COMPLETED' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitStage('COMPLETED')}
                  className="hst-btn-complete"
                >
                  <CheckCircle2 size={16} />
                  <span>Mark Stage {activeStageConfig.number} Verified &amp; Complete</span>
                </button>
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
