import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Truck,
  Trees,
  ShieldCheck,
  CreditCard,
  UserCheck,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Send,
  RotateCcw
} from 'lucide-react';
import './HarvestDateProposalModal.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const SHIFT_OPTIONS = [
  {
    id: 'Morning (08:00 AM - 12:00 PM)',
    name: 'Morning Shift',
    time: '08:00 AM – 12:00 PM',
    desc: 'Optimal daylight & cooler temp for directional felling'
  },
  {
    id: 'Afternoon (01:00 PM - 05:00 PM)',
    name: 'Afternoon Shift',
    time: '01:00 PM – 05:00 PM',
    desc: 'Bucking, de-limbing, log sorting & crane loading'
  },
  {
    id: 'Full Day Shift (08:00 AM - 05:00 PM)',
    name: 'Full Day Operation',
    time: '08:00 AM – 05:00 PM',
    desc: 'Complete harvest, stenciling & heavy truck haulage'
  }
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

const getOffsetDateStr = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextWeekendStr = () => {
  const d = new Date();
  const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HarvestDateProposalModal = ({
  job,
  onClose,
  onSubmitProposal,
  onApproveDate
}) => {
  if (!job) return null;

  const initialDate = job.proposed_harvest_date || job.assessment?.proposed_harvest_date || getOffsetDateStr(3);
  const isAlreadyApproved = Boolean(job.harvest_date_approved || job.assessment?.harvest_date_approved);
  const purchaseAmount = job.contractor_purchase_offer || job.assessment?.contractor_purchase_offer || job.total_quote || 220000;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedShift, setSelectedShift] = useState(job.harvest_time_slot || 'Morning (08:00 AM - 12:00 PM)');
  const [notes, setNotes] = useState(
    job.harvest_date_note ||
    'Chainsaw felling crew, safety rigging winches, and 6-wheeler haulage truck scheduled for on-site timber extraction.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'input'

  // Calendar month/year navigation state
  const initialDateObj = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(
    isNaN(initialDateObj.getTime()) ? new Date().getFullYear() : initialDateObj.getFullYear()
  );
  const [currentMonth, setCurrentMonth] = useState(
    isNaN(initialDateObj.getTime()) ? new Date().getMonth() : initialDateObj.getMonth()
  );

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Build calendar matrix (Mon - Sun)
  const calendarDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    // Convert Sunday (0) to 6, Mon (1) to 0, etc.
    const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    const currentMonthTotalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Previous month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        month: currentMonth - 1,
        year: currentYear,
        isCurrentMonth: false,
        isPast: true,
        dateStr: ''
      });
    }

    // 2. Current month days
    for (let d = 1; d <= currentMonthTotalDays; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      const cellDate = new Date(currentYear, currentMonth, d);
      // Compare with today (midnight)
      const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      days.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
        isPast,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate
      });
    }

    // 3. Next month leading days to complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: currentMonth + 1,
        year: currentYear,
        isCurrentMonth: false,
        isPast: false,
        dateStr: ''
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDate, todayStr]);

  const handleSelectDate = (dateStr) => {
    if (!dateStr) return;
    setSelectedDate(dateStr);
    // Ensure calendar year/month matches
    const [y, m] = dateStr.split('-');
    if (y && m) {
      setCurrentYear(Number(y));
      setCurrentMonth(Number(m) - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    setIsSubmitting(true);
    onSubmitProposal({
      proposed_harvest_date: selectedDate,
      harvest_time_slot: selectedShift,
      harvest_date_note: notes,
      harvest_date_proposed_at: new Date().toISOString(),
      harvest_date_approved: false
    });
  };

  const handleInstantApproval = () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    onApproveDate({
      proposed_harvest_date: selectedDate,
      harvest_time_slot: selectedShift,
      harvest_date_note: notes,
      harvest_date_proposed_at: new Date().toISOString(),
      harvest_date_approved: true,
      harvest_date_approved_at: new Date().toISOString()
    });
  };

  const ownerName = job.owner_name || job.landowner_name || job.ownerName || 'Harigovind D Nair';
  const propertyName = job.propertyName || job.property_name || 'TreeConnect Property';
  const treeSpecies = job.species || job.timberSpecies || 'Teak';

  return (
    <div className="hd-modal-overlay">
      <div className="hd-modal-box">

        {/* Modal Header */}
        <div className="hd-header">
          <div className="hd-header-left">
            <div className="hd-header-icon">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="hd-header-title">Harvest Date Proposal &amp; Scheduling</h3>
              <p className="hd-header-sub">
                {propertyName} • Landowner: <strong className="text-white">{ownerName}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="hd-close-btn" title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Deal Summary Strip */}
        <div className="hd-deal-strip">
          <div className="hd-deal-item">
            <span className="hd-deal-label">Standing Trees</span>
            <span className="hd-deal-value emerald flex items-center gap-1.5">
              <Trees size={14} /> 1 Standing Trees ({treeSpecies})
            </span>
          </div>

          <div className="hd-deal-item">
            <span className="hd-deal-label">Purchase Deal Offer</span>
            <span className="hd-deal-value gold font-mono">
              ₹ {Number(purchaseAmount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="hd-deal-item">
            <span className="hd-deal-label">Current Stage</span>
            <span className="hd-deal-value text-slate-200">
              {isAlreadyApproved ? '✓ Date Approved' : selectedDate ? 'Proposal Ready' : 'Date Selection'}
            </span>
          </div>

          <div className="hd-deal-item">
            <span className="hd-deal-label">Payment Gate</span>
            <span className="hd-deal-value emerald flex items-center gap-1">
              <ShieldCheck size={14} /> Safe Escrow Payout
            </span>
          </div>
        </div>

        {/* 3-Step Sequence Stepper */}
        <div className="hd-stepper">
          <div className={`hd-step-item ${!isAlreadyApproved ? 'active' : 'completed'}`}>
            <span>1. Propose Harvest Date</span>
          </div>
          <div className={`hd-step-item ${isAlreadyApproved ? 'completed' : 'active'}`}>
            <span>2. Landowner Approval</span>
          </div>
          <div className={`hd-step-item ${isAlreadyApproved ? 'active' : ''}`}>
            <span>3. Pay Tree Purchase (₹ {Number(purchaseAmount).toLocaleString('en-IN')})</span>
          </div>
        </div>

        {/* Status Alert if date already proposed */}
        {job.proposed_harvest_date && (
          <div className={`hd-status-alert mb-4 ${isAlreadyApproved ? 'approved' : 'pending'}`}>
            <div className="flex items-center gap-2">
              {isAlreadyApproved ? (
                <CheckCircle2 size={16} className="text-emerald-400" />
              ) : (
                <Clock size={16} className="text-amber-400" />
              )}
              <span>
                Status:{' '}
                <strong>
                  {isAlreadyApproved ? 'Landowner Approved Date' : 'Awaiting Landowner Approval'}
                </strong>{' '}
                for <span className="font-mono font-bold">{formatDateDMY(job.proposed_harvest_date)}</span>
              </span>
            </div>
            {isAlreadyApproved && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Payment Unlocked
              </span>
            )}
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="hd-main-grid">

          {/* LEFT COLUMN: VISUAL CALENDAR */}
          <div className="hd-calendar-card">
            {/* Top Month & Mode Selector */}
            <div className="hd-cal-top-bar">
              <div className="hd-cal-month-title">
                <CalendarDays size={18} className="text-emerald-400" />
                <span>{MONTH_NAMES[currentMonth]} {currentYear}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="hd-cal-nav-buttons">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="hd-cal-nav-btn"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="hd-cal-nav-btn"
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Pick Date Chips */}
            <div className="hd-quick-picks">
              <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Quick:</span>
              <button
                type="button"
                onClick={() => handleSelectDate(getOffsetDateStr(1))}
                className={`hd-quick-chip ${selectedDate === getOffsetDateStr(1) ? 'selected' : ''}`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleSelectDate(getOffsetDateStr(3))}
                className={`hd-quick-chip ${selectedDate === getOffsetDateStr(3) ? 'selected' : ''}`}
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSelectDate(getNextWeekendStr())}
                className={`hd-quick-chip ${selectedDate === getNextWeekendStr() ? 'selected' : ''}`}
              >
                This Weekend
              </button>
              <button
                type="button"
                onClick={() => handleSelectDate(getOffsetDateStr(7))}
                className={`hd-quick-chip ${selectedDate === getOffsetDateStr(7) ? 'selected' : ''}`}
              >
                +1 Week
              </button>
              <button
                type="button"
                onClick={() => handleSelectDate(getOffsetDateStr(14))}
                className={`hd-quick-chip ${selectedDate === getOffsetDateStr(14) ? 'selected' : ''}`}
              >
                +2 Weeks
              </button>
            </div>

            {/* Weekdays Header */}
            <div className="hd-cal-grid-weekdays">
              {WEEKDAY_NAMES.map((w, idx) => (
                <div key={idx}>{w}</div>
              ))}
            </div>

            {/* Calendar Day Tiles */}
            <div className="hd-cal-grid-days">
              {calendarDays.map((cell, idx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div key={idx} className="hd-cal-day-cell other-month">
                      <span>{cell.day}</span>
                    </div>
                  );
                }

                if (cell.isPast) {
                  return (
                    <div key={idx} className="hd-cal-day-cell disabled" title="Past Date">
                      <span>{cell.day}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(cell.dateStr)}
                    className={`hd-cal-day-cell ${cell.isToday ? 'today' : ''} ${cell.isSelected ? 'selected' : ''}`}
                    title={`Select ${cell.dateStr}`}
                  >
                    <span>{cell.day}</span>
                    {cell.isSelected && (
                      <span className="hd-cal-selected-indicator">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Date Indicator Banner */}
            <div className="hd-selected-banner">
              <span className="text-slate-300">
                Selected Harvest Execution Date:
              </span>
              <strong>{formatDateDMY(selectedDate) || 'Please pick a date'}</strong>
            </div>

            {/* Manual Date Input Fallback option */}
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'calendar' ? 'input' : 'calendar')}
                className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
              >
                {viewMode === 'calendar' ? '⌨️ Or Type Date Manually' : '📅 Back to Visual Calendar'}
              </button>

              {viewMode === 'input' && (
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => handleSelectDate(e.target.value)}
                  className="bg-slate-950 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-white font-mono text-xs"
                />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SHIFT & CREW NOTICE */}
          <div className="hd-config-card">

            {/* Operational Shift */}
            <div className="hd-form-group">
              <label className="hd-form-label">
                <Clock size={14} className="text-emerald-400" /> Operational Shift
              </label>

              <div className="hd-shift-options">
                {SHIFT_OPTIONS.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedShift(slot.id)}
                    className={`hd-shift-card ${selectedShift === slot.id ? 'active' : ''}`}
                  >
                    <div>
                      <span className="hd-shift-name">{slot.name}</span>
                      <span className="hd-shift-hours">{slot.time}</span>
                    </div>
                    {selectedShift === slot.id && (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Crew & Machinery Notice */}
            <div className="hd-form-group">
              <label className="hd-form-label">
                <Truck size={14} className="text-emerald-400" /> Crew &amp; Equipment Notice to Owner
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="hd-textarea"
                placeholder="State crew size, felling winches, haul truck arrival..."
              ></textarea>
            </div>

            {/* Summary Notice */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-emerald-300 font-bold block mb-1">
                Notice &amp; Verification Policy:
              </span>
              The landowner (<strong className="text-slate-200">{ownerName}</strong>) must authorize this date before timber felling and payout settlement proceed.
            </div>

          </div>

        </div>

        {/* Footer Action Bar */}
        <div className="hd-footer">
          <button
            type="button"
            onClick={onClose}
            className="hd-btn-cancel"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <div className="hd-footer-right">
            {/* Option A: Submit proposal to landowner */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedDate}
              className="hd-btn-submit"
            >
              <Calendar size={14} className="text-emerald-400" />
              <span>Submit Proposal</span>
            </button>

            {/* Option B: Direct / Instant Approval button (Enables instant owner authorization) */}
            <button
              type="button"
              onClick={handleInstantApproval}
              disabled={isSubmitting || !selectedDate}
              className="hd-btn-approve"
            >
              <CheckCircle2 size={16} />
              <span>Approve Date &amp; Unlock Payment</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HarvestDateProposalModal;
