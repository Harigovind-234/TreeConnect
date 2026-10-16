import React, { useState, useRef } from 'react';
import {
  RefreshCw,
  X,
  DollarSign,
  Calendar,
  Users,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import './RevisionRequestModal.css';

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

const REVISION_CATEGORIES = [
  {
    id: 'pricing',
    label: 'Pricing is too high / Rate adjustment',
    desc: 'Harvesting, extraction, or transport quotation is higher than expected.',
    icon: DollarSign
  },
  {
    id: 'start_date',
    label: "Proposed start date doesn't fit",
    desc: 'The contractor proposed start date conflicts with estate schedule.',
    icon: Calendar
  },
  {
    id: 'crew_size',
    label: 'Crew size needs adjustment',
    desc: 'Worker count allocated is too small or needs modification.',
    icon: Users
  },
  {
    id: 'timeline',
    label: 'Project timeline / duration changes',
    desc: 'Job duration estimated is too long or requires expedited completion.',
    icon: Clock
  },
  {
    id: 'terms_scope',
    label: 'Scope of work / service terms',
    desc: 'Additional clearing, debris management, or terms need revision.',
    icon: FileText
  }
];

const RevisionRequestModal = ({
  request,
  assessment,
  contractorName = 'Contractor',
  onClose,
  onSubmit
}) => {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [notes, setNotes] = useState('');
  const [counterOfferAmount, setCounterOfferAmount] = useState('');
  const [counterOfferStartDate, setCounterOfferStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const dateInputRef = useRef(null);

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      } catch (err) {
        dateInputRef.current.focus();
      }
    }
  };

  const getOffsetDateStr = (daysAhead, baseDateStr = null) => {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    if (isNaN(base.getTime())) return '';
    const target = new Date(base);
    target.setDate(target.getDate() + daysAhead);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const toggleReason = (label) => {
    setErrorMsg('');
    setSelectedReasons(prev =>
      prev.includes(label)
        ? prev.filter(r => r !== label)
        : [...prev, label]
    );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isPurchase) {
      if (!counterOfferAmount && !notes.trim()) {
        setErrorMsg('Please propose your desired purchase price or enter instructions for the contractor.');
        return;
      }
    } else {
      if (selectedReasons.length === 0 && !notes.trim() && !counterOfferAmount) {
        setErrorMsg('Please select at least one area needing adjustment, propose a counter-offer, or provide specific instructions.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const reasonsToSend = isPurchase
        ? (counterOfferAmount ? [`Purchase price counter-offer: ${formatINR(Number(counterOfferAmount))}`] : ['Timber purchase price adjustment requested'])
        : selectedReasons;
      await onSubmit(reasonsToSend, notes.trim(), counterOfferAmount, isPurchase ? null : counterOfferStartDate);
    } finally {
      setSubmitting(false);
    }
  };

  const pType = assessment?.commercial_proposal_type || request?.commercial_proposal_type || 'Harvesting Service Quotation';
  const isPurchase = pType === 'Timber Purchase Offer';
  const isHybrid = pType === 'Purchase + Harvesting';
  const totalQuote = isPurchase
    ? (assessment?.contractor_purchase_offer ?? request?.contractor_purchase_offer ?? assessment?.total_quote ?? request?.total_quote)
    : isHybrid
      ? (assessment?.timber_purchase_price ?? request?.timber_purchase_price ?? assessment?.total_quote ?? request?.total_quote)
      : (assessment?.total_quote ?? request?.total_quote);
  const assessedVol = assessment?.estimated_harvestable_volume || request?.estimated_harvestable_volume || 1.80;
  const timberVal = assessment?.estimated_timber_value || request?.estimated_timber_value || 251082;
  const startDate = assessment?.proposed_start_date || request?.proposed_start_date;
  const workers = assessment?.assigned_workers_count ?? request?.assigned_workers_count;
  const duration = assessment?.estimated_duration || request?.estimated_duration;

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div 
        className="revision-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="revision-modal-heading"
      >
        
        {/* HEADER */}
        <div className="revision-modal-header">
          <div className="revision-header-left">
            <div className="revision-header-icon-box">
              <RefreshCw size={24} />
            </div>
            <div className="revision-header-text">
              <span className="revision-tag-badge">
                {isPurchase ? 'Landowner Counter-Offer' : 'Landowner Feedback'}
              </span>
              <h2 id="revision-modal-heading" className="revision-modal-title">
                {isPurchase ? 'Negotiate Timber Purchase Offer' : 'Request Quotation Revision'}
              </h2>
              <p className="revision-modal-subtitle">
                {isPurchase
                  ? <>Propose your desired timber purchase price for <strong>{contractorName}</strong> to reconsider before authorizing the sale.</>
                  : <>Specify what <strong>{contractorName}</strong> needs to adjust before you authorize harvesting operations.</>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="revision-close-btn"
            aria-label="Close dialog"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTRACTOR'S CURRENT QUOTE / OFFER REFERENCE */}
        <div className="revision-current-quote-strip">
          <span className="revision-strip-title">
            Current Contractor Submission For Review
          </span>
          <div className="revision-strip-grid">
            {isPurchase ? (
              <>
                {totalQuote !== undefined && totalQuote !== null && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Purchase Offer</span>
                    <span className="revision-stat-value highlight-amber">{formatINR(totalQuote)}</span>
                  </div>
                )}
                {assessedVol && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Harvestable Volume</span>
                    <span className="revision-stat-value">{Number(assessedVol).toFixed(2)} m³</span>
                  </div>
                )}
                {timberVal && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Reference Timber Valuation</span>
                    <span className="revision-stat-value text-emerald-400 font-bold">{formatINR(timberVal)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {totalQuote !== undefined && totalQuote !== null && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Total Quote</span>
                    <span className="revision-stat-value highlight-amber">{formatINR(totalQuote)}</span>
                  </div>
                )}
                {startDate && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Start Date</span>
                    <span className="revision-stat-value">{String(startDate).substring(0, 10)}</span>
                  </div>
                )}
                {workers && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Crew Size</span>
                    <span className="revision-stat-value">{workers} Workers</span>
                  </div>
                )}
                {duration && (
                  <div className="revision-stat-pill">
                    <span className="revision-stat-label">Duration</span>
                    <span className="revision-stat-value">{duration}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="revision-form">
          {/* REASONS SELECTION — ONLY FOR HARVESTING SERVICES */}
          {!isPurchase && (
            <div className="revision-field-group">
              <label className="revision-field-label">
                <span>What requires revision? <span className="required-star">*</span></span>
                <span className="revision-field-hint">Select all that apply</span>
              </label>
              <div className="revision-reasons-grid">
                {REVISION_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  const isSelected = selectedReasons.includes(cat.label);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleReason(cat.label)}
                      className={`revision-reason-card ${isSelected ? 'is-selected' : ''}`}
                    >
                      <div className="revision-reason-icon">
                        <IconComponent size={18} />
                      </div>
                      <div className="revision-reason-content">
                        <div className="revision-reason-header">
                          <span className="revision-reason-title">
                            {cat.label}
                          </span>
                          {isSelected && <CheckCircle2 size={16} className="revision-reason-check" />}
                        </div>
                        <p className="revision-reason-desc">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAIR DEAL NEGOTIATION / COUNTER-OFFER */}
          {isPurchase ? (
            <div className="revision-counter-offer-section">
              <div className="revision-counter-header">
                <span className="revision-counter-title">
                  <DollarSign size={16} /> Propose Counter-Offer Purchase Price
                </span>
                <span className="text-xs text-slate-400">
                  Contractor Offer: <strong className="text-amber-300 font-bold">{totalQuote ? formatINR(totalQuote) : '₹ 0'}</strong>
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                    <label className="text-xs font-semibold text-slate-300">
                      Your Desired Purchase Price / Counter-Offer (₹) <span className="text-amber-400 font-bold">*</span>
                    </label>
                    {counterOfferAmount && totalQuote && Number(counterOfferAmount) !== Number(totalQuote) && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${Number(counterOfferAmount) > Number(totalQuote) ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30' : 'text-amber-300 bg-amber-500/15 border border-amber-500/30'}`}>
                        {Number(counterOfferAmount) > Number(totalQuote)
                          ? `+${formatINR(Number(counterOfferAmount) - Number(totalQuote))} (+${Math.round(((Number(counterOfferAmount) - Number(totalQuote)) / Number(totalQuote)) * 100)}%) over contractor offer`
                          : `${formatINR(Number(counterOfferAmount) - Number(totalQuote))}`}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={counterOfferAmount}
                    onChange={(e) => {
                      setErrorMsg('');
                      setCounterOfferAmount(e.target.value);
                    }}
                    placeholder={totalQuote ? `e.g. ${Math.round(totalQuote * 1.1 || 240000)}` : 'e.g. 240000'}
                    className="revision-input text-base font-bold text-amber-300"
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 flex-wrap gap-2 pt-1.5 border-t border-white/5">
                    <span className="text-slate-400">Quick counter-offer presets:</span>
                    {totalQuote ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCounterOfferAmount(String(Math.round(totalQuote * 1.05)))}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-semibold transition-all hover:bg-emerald-500/20"
                        >
                          +5% ({formatINR(Math.round(totalQuote * 1.05))})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCounterOfferAmount(String(Math.round(totalQuote * 1.1)))}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-semibold transition-all hover:bg-emerald-500/20"
                        >
                          +10% ({formatINR(Math.round(totalQuote * 1.1))})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCounterOfferAmount(String(Math.round(totalQuote * 1.15)))}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 font-semibold transition-all hover:bg-emerald-500/20"
                        >
                          +15% ({formatINR(Math.round(totalQuote * 1.15))})
                        </button>
                        {timberVal && Number(timberVal) > Number(totalQuote) && (
                          <button
                            type="button"
                            onClick={() => setCounterOfferAmount(String(Math.round(timberVal)))}
                            className="text-[11px] text-teal-300 hover:text-teal-200 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/25 font-semibold transition-all hover:bg-teal-500/20"
                          >
                            Valuation ({formatINR(timberVal)})
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="revision-counter-offer-section">
              <div className="revision-counter-header">
                <span className="revision-counter-title">
                  <DollarSign size={16} /> Fair Deal Counter-Proposal (Optional)
                </span>
                <span className="text-xs text-slate-400">
                  Current Quote: <strong className="text-amber-300 font-bold">{totalQuote ? formatINR(totalQuote) : '₹ 0'}</strong>
                </span>
              </div>

              <div className="revision-counter-grid">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                    <label className="text-xs font-semibold text-slate-300">
                      Your Target Budget / Counter-Offer (₹)
                    </label>
                    {totalQuote ? (
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        Contractor Quote: {formatINR(totalQuote)}
                      </span>
                    ) : null}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={counterOfferAmount}
                    onChange={(e) => setCounterOfferAmount(e.target.value)}
                    placeholder={totalQuote ? `Current quote: ₹ ${totalQuote} (e.g. ${Math.round(totalQuote * 0.9)})` : 'e.g. 120000'}
                    className="revision-input"
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 flex-wrap gap-1">
                    <span>Suggest a fair price for the contractor to reconsider.</span>
                    {totalQuote ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-medium">Quick options:</span>
                        <button
                          type="button"
                          onClick={() => setCounterOfferAmount(String(Math.round(totalQuote * 0.9)))}
                          className="text-[10.5px] text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
                          title="Propose 10% lower than contractor quote"
                        >
                          -10% ({formatINR(Math.round(totalQuote * 0.9))})
                        </button>
                        <span className="text-slate-600">•</span>
                        <button
                          type="button"
                          onClick={() => setCounterOfferAmount(String(Math.round(totalQuote * 0.85)))}
                          className="text-[10.5px] text-amber-400 hover:text-amber-300 underline font-semibold transition-colors"
                          title="Propose 15% lower than contractor quote"
                        >
                          -15% ({formatINR(Math.round(totalQuote * 0.85))})
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                    <label className="text-xs font-semibold text-slate-300">
                      Preferred Alternative Start Date
                    </label>
                    {startDate && (
                      <span className="text-[11px] font-medium text-slate-400">
                        Contractor: <strong className="text-emerald-400 font-semibold">{formatDateDMY(startDate)}</strong>
                      </span>
                    )}
                  </div>
                  <div className="revision-date-wrapper">
                    <input
                      ref={dateInputRef}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={counterOfferStartDate}
                      onChange={(e) => setCounterOfferStartDate(e.target.value)}
                      onClick={handleOpenCalendar}
                      className="revision-input revision-date-input"
                    />
                    <button
                      type="button"
                      onClick={handleOpenCalendar}
                      className="revision-date-picker-btn"
                      title="Click to open calendar"
                      aria-label="Open calendar picker"
                    >
                      <Calendar size={16} />
                    </button>
                  </div>

                  {/* Quick Date Shortcuts */}
                  <div className="revision-quick-dates-row">
                    <span className="text-[10px] text-slate-500 font-medium">Quick pick:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {startDate && (
                        <button
                          type="button"
                          onClick={() => setCounterOfferStartDate(typeof startDate === 'string' ? startDate.split('T')[0] : new Date(startDate).toISOString().split('T')[0])}
                          className={`revision-date-chip ${counterOfferStartDate === (typeof startDate === 'string' ? startDate.split('T')[0] : '') ? 'active' : ''}`}
                          title="Match contractor proposed start date"
                        >
                          Contractor Date
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCounterOfferStartDate(getOffsetDateStr(3, startDate))}
                        className={`revision-date-chip ${counterOfferStartDate === getOffsetDateStr(3, startDate) ? 'active' : ''}`}
                        title="3 days after proposed date"
                      >
                        +3 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setCounterOfferStartDate(getOffsetDateStr(7, startDate))}
                        className={`revision-date-chip ${counterOfferStartDate === getOffsetDateStr(7, startDate) ? 'active' : ''}`}
                        title="1 week after proposed date"
                      >
                        +1 Week
                      </button>
                      <button
                        type="button"
                        onClick={() => setCounterOfferStartDate(getOffsetDateStr(14, startDate))}
                        className={`revision-date-chip ${counterOfferStartDate === getOffsetDateStr(14, startDate) ? 'active' : ''}`}
                        title="2 weeks after proposed date"
                      >
                        +2 Weeks
                      </button>
                      {counterOfferStartDate && (
                        <button
                          type="button"
                          onClick={() => setCounterOfferStartDate('')}
                          className="text-[10px] text-slate-500 hover:text-slate-300 ml-1 underline transition-colors"
                          title="Clear date"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Click the field or calendar icon to select a convenient start date.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DETAILED INSTRUCTIONS */}
          <div className="revision-field-group">
            <div className="revision-field-label">
              <label htmlFor="revision-notes-textarea">
                {isPurchase ? 'Remarks or Commercial Notes for Contractor (Optional)' : 'Specific Instructions for the Contractor'}
              </label>
              <span className="revision-field-hint">
                {notes.length} characters
              </span>
            </div>
            <textarea
              id="revision-notes-textarea"
              rows={isPurchase ? 3 : 4}
              value={notes}
              onChange={(e) => {
                setErrorMsg('');
                setNotes(e.target.value);
              }}
              placeholder={isPurchase
                ? 'e.g., Expecting ₹ 2,40,000 for this high-grade standing timber lot. Terms: direct disbursement to my bank account upon contract execution.'
                : 'e.g., We would prefer starting operations on 15-Oct instead, and would like at least 3 workers to expedite completion within 5 days. Please review if the extraction & transport costs can be adjusted.'}
              className="revision-textarea"
            />
          </div>

          {errorMsg && (
            <div className="revision-error-banner">
              <AlertCircle size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="revision-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="revision-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="revision-btn-submit"
            >
              <RefreshCw size={16} className={submitting ? 'animate-spin' : ''} />
              <span>
                {submitting
                  ? (isPurchase ? 'Sending Counter-Offer...' : 'Sending Request...')
                  : (isPurchase ? 'Send Counter-Offer to Contractor' : 'Send Revision to Contractor')}
              </span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default RevisionRequestModal;

