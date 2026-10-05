import React, { useState } from 'react';
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
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    if (selectedReasons.length === 0 && !notes.trim()) {
      setErrorMsg('Please select at least one area needing adjustment or provide specific instructions.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(selectedReasons, notes.trim());
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuote = assessment?.total_quote ?? request?.total_quote;
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
                Landowner Feedback
              </span>
              <h2 id="revision-modal-heading" className="revision-modal-title">
                Request Quotation Revision
              </h2>
              <p className="revision-modal-subtitle">
                Specify what <strong>{contractorName}</strong> needs to adjust before you authorize harvesting operations.
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

        {/* CONTRACTOR'S CURRENT QUOTE REFERENCE */}
        <div className="revision-current-quote-strip">
          <span className="revision-strip-title">
            Current Contractor Submission For Review
          </span>
          <div className="revision-strip-grid">
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
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="revision-form">
          {/* REASONS SELECTION */}
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

          {/* DETAILED INSTRUCTIONS */}
          <div className="revision-field-group">
            <div className="revision-field-label">
              <label htmlFor="revision-notes-textarea">
                Specific Instructions for the Contractor
              </label>
              <span className="revision-field-hint">
                {notes.length} characters
              </span>
            </div>
            <textarea
              id="revision-notes-textarea"
              rows={4}
              value={notes}
              onChange={(e) => {
                setErrorMsg('');
                setNotes(e.target.value);
              }}
              placeholder="e.g., We would prefer starting operations on 15-Oct instead, and would like at least 3 workers to expedite completion within 5 days. Please review if the extraction & transport costs can be adjusted."
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
              <span>{submitting ? 'Sending Request...' : 'Send Revision to Contractor'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default RevisionRequestModal;

