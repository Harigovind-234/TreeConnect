import React, { useState } from 'react';
import {
  CalendarClock,
  Calendar,
  Clock,
  X,
  UserCheck,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Send,
  RotateCcw,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Tag,
  History
} from 'lucide-react';
import './RescheduleInspectionModal.css';

const TIME_SLOT_OPTIONS = [
  {
    id: 'Morning (09:00 AM - 12:00 PM)',
    name: 'Morning Slot',
    time: '09:00 AM – 12:00 PM',
    sub: 'Optimal daylight for tree canopy & DBH inspection',
    icon: '☀️'
  },
  {
    id: 'Afternoon (01:00 PM - 04:00 PM)',
    name: 'Afternoon Slot',
    time: '01:00 PM – 04:00 PM',
    sub: 'Post-noon estate walk & haul route audit',
    icon: '🌤️'
  },
  {
    id: 'Late Afternoon (04:00 PM - 06:30 PM)',
    name: 'Late Afternoon',
    time: '04:00 PM – 06:30 PM',
    sub: 'Pre-dusk boundary & obstacle verification',
    icon: '⛅'
  },
  {
    id: 'Flexible (Any Daylight Time)',
    name: 'Flexible Schedule',
    time: 'Any Daytime Hours',
    sub: 'At contractor crew convenience during daylight',
    icon: '🕒'
  }
];

const COMMON_REASONS = [
  'Personal / Family Commitment',
  'Out of Station / Traveling',
  'Work / Office Schedule Conflict',
  'Estate Caretaker / Key Holder Unavailable',
  'Heavy Rain / Muddy Road Access',
  'Prefer Weekend Field Visit'
];

const formatDateDMY = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

const getMinDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1); // Earliest suggested is tomorrow
  return d.toISOString().split('T')[0];
};

const getQuickDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

const getNextWeekend = () => {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().split('T')[0];
};

const RescheduleInspectionModal = ({
  request,
  onClose,
  onSubmit,
  onWithdraw
}) => {
  const inspection = request?.site_inspection || {};
  const currentScheduledDate = inspection.scheduled_date || request?.inspection_scheduled_date || '';
  const currentSlot = inspection.time_slot || 'Afternoon (01:00 PM - 04:00 PM)';
  const inspectorName = inspection.inspector_name || request?.assigned_contractor_name || 'Assigned Field Assessor';
  const inspectorPhone = inspection.inspector_phone || request?.assigned_contractor_phone;
  const propertyName = request?.propertyName || request?.name || 'Timber Property';
  const location = request?.district || request?.location || request?.address || 'Kerala';

  // Reschedule date tracking
  const originalScheduledDate = inspection.original_scheduled_date || (Array.isArray(inspection.reschedule_history) && inspection.reschedule_history.length > 0 ? inspection.reschedule_history[0].original_scheduled_date : null);
  const isRescheduled = inspection.reschedule_status === 'ACCEPTED' || (Boolean(originalScheduledDate) && originalScheduledDate !== currentScheduledDate);
  const isAlreadyPending = Boolean(inspection.reschedule_requested);
  const pendingSuggestedDate = inspection.suggested_date;
  const pendingSuggestedSlot = inspection.suggested_time_slot || 'Morning (09:00 AM - 12:00 PM)';
  const pendingReason = inspection.reschedule_reason;
  const pendingNotes = inspection.reschedule_notes;
  const rescheduleHistory = Array.isArray(inspection.reschedule_history) ? inspection.reschedule_history : [];

  const [suggestedDate, setSuggestedDate] = useState(
    inspection.suggested_date || getQuickDate(2)
  );
  const [selectedSlot, setSelectedSlot] = useState(
    inspection.suggested_time_slot || 'Morning (09:00 AM - 12:00 PM)'
  );
  const [selectedReasonChip, setSelectedReasonChip] = useState(
    inspection.reschedule_reason || ''
  );
  const [notes, setNotes] = useState(inspection.reschedule_notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChipClick = (reason) => {
    setErrorMsg('');
    if (selectedReasonChip === reason) {
      setSelectedReasonChip('');
    } else {
      setSelectedReasonChip(reason);
      if (!notes) {
        setNotes(`I am unavailable on the scheduled date due to: ${reason}. Please visit on the suggested date.`);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!suggestedDate) {
      setErrorMsg('Please choose a preferred inspection date.');
      return;
    }

    const effectiveReason = selectedReasonChip || notes.trim() || 'Landowner has schedule conflict';

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        suggested_date: suggestedDate,
        suggested_time_slot: selectedSlot,
        reschedule_reason: effectiveReason,
        reschedule_notes: notes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit reschedule:', err);
      setErrorMsg(err?.message || 'Failed to submit reschedule request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    setSubmitting(true);
    try {
      await onWithdraw();
      onClose();
    } catch (err) {
      console.error('Failed to withdraw reschedule:', err);
      setErrorMsg('Failed to withdraw request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="reschedule-modal-overlay" onClick={onClose}>
      <div
        className="reschedule-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-modal-title"
      >
        {/* HEADER */}
        <div className="reschedule-modal-header">
          <div className="flex items-center gap-3.5">
            <div className="reschedule-header-icon">
              <CalendarClock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 id="reschedule-modal-title" className="reschedule-modal-title">
                  {isAlreadyPending ? 'Update Suggested Inspection Date' : isRescheduled ? 'Reschedule Confirmed Visit' : 'Suggest Alternate Inspection Date'}
                </h2>
                {isAlreadyPending ? (
                  <span className="reschedule-badge-role pending">
                    Pending Contractor Review
                  </span>
                ) : isRescheduled ? (
                  <span className="reschedule-badge-role rescheduled">
                    Rescheduled Visit
                  </span>
                ) : (
                  <span className="reschedule-badge-role">
                    Landowner Option
                  </span>
                )}
              </div>
              <p className="reschedule-modal-subtitle">
                {isAlreadyPending
                  ? 'Your requested alternate date is currently awaiting contractor review. You can modify your proposal below.'
                  : 'Unavailable on the confirmed visit day? Propose a suitable date and time for the contractor crew.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="reschedule-close-btn"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="reschedule-modal-body">
          {errorMsg && (
            <div className="reschedule-alert-box reschedule-alert-error">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-200 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* SECTION 1: CURRENT APPOINTMENT & RESCHEDULE STATUS */}
          <div className="reschedule-section">
            <div className="reschedule-current-summary">
              <div className="reschedule-summary-top">
                <div className="reschedule-summary-label">
                  <Calendar size={13} className="text-emerald-400" />
                  <span>Current Scheduled Appointment</span>
                </div>
                {isRescheduled ? (
                  <span className="reschedule-summary-badge rescheduled">
                    ✓ Rescheduled Confirmed
                  </span>
                ) : isAlreadyPending ? (
                  <span className="reschedule-summary-badge pending">
                    ⏳ Alternate Date Pending
                  </span>
                ) : (
                  <span className="reschedule-summary-badge">
                    Booked by Contractor
                  </span>
                )}
              </div>

              <div className="reschedule-summary-grid">
                <div className="reschedule-summary-item">
                  <div className="reschedule-summary-item-icon">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="reschedule-summary-sublabel">
                      {isRescheduled ? 'Confirmed Rescheduled Date & Slot' : 'Confirmed Date & Slot'}
                    </span>
                    <span className="reschedule-summary-val-date">
                      {formatDateDMY(currentScheduledDate)}
                    </span>
                    <span className="reschedule-summary-val-slot">
                      {currentSlot}
                    </span>
                    {isRescheduled && originalScheduledDate && (
                      <div className="reschedule-orig-date-pill">
                        <span>Original Booking:</span>
                        <span className="line-through">{formatDateDMY(originalScheduledDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="reschedule-summary-item">
                  <div className="reschedule-summary-item-icon">
                    <UserCheck size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="reschedule-summary-sublabel">Lead Field Assessor</span>
                    <span className="reschedule-summary-val-name truncate">
                      {inspectorName}
                    </span>
                    {inspectorPhone && (
                      <span className="reschedule-summary-val-phone">
                        +91 {inspectorPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* TIMELINE COMPARISON IF PREVIOUSLY RESCHEDULED */}
              {isRescheduled && originalScheduledDate && (
                <div className="reschedule-timeline-strip">
                  <div className="reschedule-timeline-step old">
                    <span className="reschedule-timeline-badge">Initial Booking</span>
                    <span className="reschedule-timeline-date">{formatDateDMY(originalScheduledDate)}</span>
                  </div>
                  <div className="reschedule-timeline-connector">
                    <span className="reschedule-timeline-arrow">➔</span>
                    <span className="reschedule-timeline-text">Rescheduled To</span>
                  </div>
                  <div className="reschedule-timeline-step current">
                    <span className="reschedule-timeline-badge current">Confirmed Visit Date</span>
                    <span className="reschedule-timeline-date">{formatDateDMY(currentScheduledDate)}</span>
                    <span className="reschedule-timeline-slot">{currentSlot}</span>
                  </div>
                </div>
              )}

              <div className="reschedule-summary-footer">
                <MapPin size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate">{propertyName} • {location}</span>
              </div>
            </div>

            {/* PENDING SUGGESTED ALTERNATE DATE ALERT (IF RESCHEDULE IS PENDING) */}
            {isAlreadyPending && pendingSuggestedDate && (
              <div className="reschedule-pending-banner">
                <div className="reschedule-pending-banner-header">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={16} className="text-amber-400 shrink-0" />
                    <span className="font-extrabold text-amber-300 text-xs sm:text-sm">
                      Your Suggested Alternate Date
                    </span>
                  </div>
                  <span className="reschedule-pending-badge">
                    Under Contractor Review
                  </span>
                </div>
                <div className="reschedule-pending-body">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="reschedule-date-chip-highlight">
                      <Calendar size={13} className="text-amber-400" />
                      <span>Proposed Date: <strong>{formatDateDMY(pendingSuggestedDate)}</strong></span>
                    </div>
                    <div className="reschedule-time-chip-highlight">
                      <Clock size={13} className="text-amber-400" />
                      <span>{pendingSuggestedSlot}</span>
                    </div>
                  </div>
                  {pendingReason && (
                    <div className="reschedule-pending-reason">
                      <span className="text-slate-400 font-medium">Stated Reason:</span>{' '}
                      <span className="text-amber-200 font-semibold italic">"{pendingReason}"</span>
                    </div>
                  )}
                  {pendingNotes && (
                    <p className="text-[11px] text-slate-300 mt-1 italic leading-relaxed">
                      Note: "{pendingNotes}"
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    You can select another date below to revise this suggestion, or withdraw to keep the original schedule.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION: RESCHEDULE HISTORY & PAST SUGGESTIONS (IF ANY) */}
          {rescheduleHistory.length > 0 && (
            <div className="reschedule-section">
              <div className="reschedule-section-header">
                <div className="reschedule-section-title">
                  <History size={15} className="text-emerald-400" />
                  <span>Reschedule History &amp; Alternate Date Proposals ({rescheduleHistory.length})</span>
                </div>
                <span className="reschedule-section-hint">Past change requests log</span>
              </div>

              <div className="reschedule-history-list">
                {rescheduleHistory.map((item, idx) => (
                  <div key={idx} className="reschedule-history-item">
                    <div className="reschedule-history-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="reschedule-history-badge">Proposal #{idx + 1}</span>
                        <span className="reschedule-history-suggested">
                          Suggested Date: {formatDateDMY(item.suggested_date)}
                        </span>
                        <span className="reschedule-history-slot">
                          {item.suggested_time_slot || 'Morning Slot'}
                        </span>
                      </div>
                      {item.requested_at && (
                        <span className="reschedule-history-date">
                          Requested on {formatDateDMY(item.requested_at)}
                        </span>
                      )}
                    </div>
                    {item.original_scheduled_date && (
                      <div className="reschedule-history-dates-row">
                        <span className="text-slate-400">Scheduled Date:</span>
                        <span className="reschedule-history-date-old">{formatDateDMY(item.original_scheduled_date)}</span>
                        <span className="text-emerald-400">➔</span>
                        <span className="reschedule-history-date-new">{formatDateDMY(item.suggested_date)}</span>
                      </div>
                    )}
                    {item.reschedule_reason && (
                      <div className="reschedule-history-reason">
                        <span className="text-slate-400">Reason:</span> <span className="text-amber-200/90 font-medium">"{item.reschedule_reason}"</span>
                      </div>
                    )}
                    {item.reschedule_notes && (
                      <div className="reschedule-history-note">
                        "{item.reschedule_notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <form id="reschedule-form" onSubmit={handleFormSubmit} className="reschedule-form">
            {/* SECTION 2: SUGGESTED DATE PICKER WITH SHORTCUTS */}
            <div className="reschedule-section">
              <div className="reschedule-section-header">
                <div className="reschedule-section-title">
                  <Calendar size={15} className="text-emerald-400" />
                  <span>Preferred New Date</span>
                  <span className="text-emerald-400 font-black">*</span>
                </div>
                <span className="reschedule-section-hint">Select a day you will be available on-site</span>
              </div>

              <div className="relative">
                <input
                  type="date"
                  min={getMinDateStr()}
                  value={suggestedDate}
                  onChange={(e) => {
                    setErrorMsg('');
                    setSuggestedDate(e.target.value);
                  }}
                  required
                  className="reschedule-input-date"
                />
              </div>

              {/* QUICK DATE SHORTCUTS */}
              <div className="reschedule-quick-pick-row">
                <span className="reschedule-quick-pick-label">Quick Pick:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSuggestedDate(getQuickDate(1))}
                    className={`reschedule-btn-chip ${suggestedDate === getQuickDate(1) ? 'active' : ''}`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestedDate(getQuickDate(2))}
                    className={`reschedule-btn-chip ${suggestedDate === getQuickDate(2) ? 'active' : ''}`}
                  >
                    +2 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestedDate(getNextWeekend())}
                    className={`reschedule-btn-chip ${suggestedDate === getNextWeekend() ? 'active' : ''}`}
                  >
                    Next Weekend
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestedDate(getQuickDate(7))}
                    className={`reschedule-btn-chip ${suggestedDate === getQuickDate(7) ? 'active' : ''}`}
                  >
                    +1 Week
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: PREFERRED TIME WINDOW */}
            <div className="reschedule-section">
              <div className="reschedule-section-header">
                <div className="reschedule-section-title">
                  <Clock size={15} className="text-emerald-400" />
                  <span>Preferred Time Window</span>
                </div>
                <span className="reschedule-section-hint">Choose suitable daytime assessment hours</span>
              </div>

              <div className="reschedule-slots-grid">
                {TIME_SLOT_OPTIONS.map((slot) => {
                  const isSelected = selectedSlot === slot.id;
                  return (
                    <div
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`reschedule-slot-card ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="reschedule-slot-emoji">{slot.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 justify-between">
                          <span className="reschedule-slot-name">
                            {slot.name}
                          </span>
                          <span className={`reschedule-slot-time ${isSelected ? 'text-emerald-300' : 'text-slate-300'}`}>
                            {slot.time}
                          </span>
                        </div>
                        <span className="reschedule-slot-desc">
                          {slot.sub}
                        </span>
                      </div>
                      <span className={`reschedule-slot-radio ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <span className="reschedule-slot-radio-dot" />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: REASON CHIPS (WHY YOU ARE UNAVAILABLE) */}
            <div className="reschedule-section">
              <div className="reschedule-section-header">
                <div className="reschedule-section-title">
                  <Tag size={15} className="text-emerald-400" />
                  <span>Reason for Rescheduling</span>
                </div>
                <span className="reschedule-section-hint">Click a reason to explain schedule conflict</span>
              </div>

              <div className="reschedule-reasons-wrap">
                {COMMON_REASONS.map((reason) => {
                  const isSelected = selectedReasonChip === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => handleChipClick(reason)}
                      className={`reschedule-reason-pill ${isSelected ? 'selected' : ''}`}
                    >
                      <span>{reason}</span>
                      {isSelected && <CheckCircle2 size={13} className="text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 5: DETAILED NOTE / INSTRUCTIONS */}
            <div className="reschedule-section">
              <div className="reschedule-section-header">
                <div className="reschedule-section-title">
                  <MessageSquare size={15} className="text-emerald-400" />
                  <span>Note for Contractor / Assessor</span>
                  <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </div>
                <span className="reschedule-section-hint">Add boundary or estate access notes</span>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. I have doctor appointment on the 10th afternoon. Please visit on the 12th morning instead so I can accompany you around the boundary trees and unlock the main estate gate."
                className="reschedule-textarea"
              />
            </div>

            {/* SECTION 6: ADVISORY BANNER */}
            <div className="reschedule-info-banner">
              <Sparkles size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-emerald-300">How Contractor Dispatch Works:</strong> Your suggested date will be immediately flagged in the contractor's dispatch queue. The contractor can confirm your proposed slot with one click or coordinate if there is a scheduling conflict.
              </div>
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="reschedule-modal-footer">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="reschedule-btn-secondary"
            >
              Cancel
            </button>
            {isAlreadyPending && onWithdraw && (
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={submitting}
                className="reschedule-btn-withdraw"
                title="Cancel reschedule and keep original visit date"
              >
                <RotateCcw size={13} />
                <span>Withdraw Request</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            form="reschedule-form"
            disabled={submitting}
            className="reschedule-btn-primary"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>{isAlreadyPending ? 'Update Date Suggestion' : 'Suggest Date to Contractor'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleInspectionModal;
