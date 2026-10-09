import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Calculator,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Send,
  Building2,
  Layers,
  HelpCircle,
  IndianRupee,
  Sparkles,
  QrCode
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import './RequestAdvancePaymentModal.css';

const RequestAdvancePaymentModal = ({ request, onClose, onSubmit }) => {
  const ass = request?.assessment || {};
  const acceptedQuotation = Number(
    request?.total_quotation_amount ||
    request?.total_quote ||
    ass?.total_quote ||
    ass?.timber_purchase_price ||
    99000
  );

  const existingReq = request?.advance_payment_request || {};
  const hasExistingReq = Boolean(existingReq?.advance_amount || existingReq?.advance_percentage);

  // Initial advance amount and percentage
  const initialAmount = existingReq?.advance_amount
    ? Number(existingReq.advance_amount)
    : Math.round((acceptedQuotation * (existingReq?.advance_percentage ? Number(existingReq.advance_percentage) : 30)) / 100);

  const [advanceAmount, setAdvanceAmount] = useState(initialAmount);
  const [percentage, setPercentage] = useState(
    existingReq?.advance_percentage
      ? Number(existingReq.advance_percentage)
      : Math.min(100, Math.max(1, Math.round((initialAmount / (acceptedQuotation || 1)) * 100)))
  );

  // Synchronized input handlers
  const handlePercentageChange = (newPct) => {
    const pct = Math.max(1, Math.min(100, Number(newPct) || 0));
    setPercentage(pct);
    setAdvanceAmount(Math.round((acceptedQuotation * pct) / 100));
  };

  const handleAmountChange = (newAmt) => {
    const amt = Math.max(0, Number(newAmt) || 0);
    setAdvanceAmount(amt);
    if (acceptedQuotation > 0) {
      const pct = Math.min(100, Math.max(1, Math.round((amt / acceptedQuotation) * 100)));
      setPercentage(pct);
    }
  };

  const applyPreset = (presetPct) => {
    handlePercentageChange(presetPct);
  };

  // Suggested due date: default 2 days out or before start date
  const defaultDueDate = () => {
    if (existingReq?.due_date) return existingReq.due_date;
    const startStr = ass?.proposed_start_date || request?.proposed_start_date;
    if (startStr) {
      try {
        const d = new Date(startStr);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
      } catch (e) { }
    }
    const target = new Date();
    target.setDate(target.getDate() + 2);
    return target.toISOString().split('T')[0];
  };

  const [dueDate, setDueDate] = useState(defaultDueDate());

  // Structured Payment Details
  const [upiId, setUpiId] = useState(existingReq?.upi_id || 'treeconnect.contractor@okhdfcbank');
  const [bankName, setBankName] = useState(existingReq?.bank_name || 'HDFC Bank Ltd, Kottayam Branch');
  const [accountNumber, setAccountNumber] = useState(existingReq?.bank_account_number || '50200084920194');
  const [ifscCode, setIfscCode] = useState(existingReq?.ifsc_code || 'HDFC0001234');
  const [accountHolder, setAccountHolder] = useState(
    existingReq?.account_holder_name || request?.assigned_contractor_name || 'Rohith Kumar (Forestry Contractor)'
  );
  const [remarks, setRemarks] = useState(
    existingReq?.remarks ||
    'Advance mobilization fee covers crew staging, chainsaw equipment inspection, and haulage logistics.'
  );

  const [customInstructions, setCustomInstructions] = useState(
    existingReq?.payment_instructions || ''
  );
  const [showAdvancedInstructions, setShowAdvancedInstructions] = useState(Boolean(existingReq?.payment_instructions && !existingReq?.upi_id));

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const remainingBalance = Math.max(0, acceptedQuotation - advanceAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!advanceAmount || advanceAmount <= 0) {
      setErrorMsg('Please specify a valid advance payment amount greater than zero.');
      return;
    }
    if (advanceAmount > acceptedQuotation) {
      setErrorMsg(`Advance amount cannot exceed total quotation (${formatINR(acceptedQuotation)}).`);
      return;
    }
    if (!dueDate) {
      setErrorMsg('Please select a payment due date.');
      return;
    }
    if (!upiId.trim() && !accountNumber.trim()) {
      setErrorMsg('Please provide either a UPI ID or Bank Account Number for landowner payment.');
      return;
    }

    // Auto-generate clean formatted payment instructions for landowner view & receipts
    const compiledInstructions = customInstructions.trim() || [
      `UPI ID: ${upiId.trim()}`,
      `Bank Name: ${bankName.trim()}`,
      `A/C Holder: ${accountHolder.trim()}`,
      `A/C No: ${accountNumber.trim()}`,
      `IFSC Code: ${ifscCode.trim()}`
    ].filter(Boolean).join('\n');

    setSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmit({
        accepted_quotation: acceptedQuotation,
        advance_percentage: Number(percentage),
        advance_amount: Number(advanceAmount),
        due_date: dueDate,
        upi_id: upiId.trim(),
        bank_name: bankName.trim(),
        bank_account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        account_holder_name: accountHolder.trim(),
        payment_instructions: compiledInstructions,
        supported_methods: ['UPI', 'Bank Transfer (NEFT/RTGS/IMPS)', 'Cash / Cheque'],
        remarks: remarks.trim()
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit advance payment request.');
      setSubmitting(false);
    }
  };

  return (
    <div className="cd-advance-overlay">
      <div className="cd-advance-modal">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 h-full">
          {/* 1. FIXED MODAL HEADER */}
          <div className="cd-advance-header">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {hasExistingReq ? 'Update Advance Amount & Payment Details' : 'Set Advance Amount & Payment Terms'}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {request?.propertyName || 'TreeConnect Property'} • Pre-Operation Mobilization &amp; Logistics
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. SCROLLABLE MODAL BODY */}
          <div className="cd-advance-body">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quotation Header Card (matches Contractor Portal) */}
            <div className="cd-advance-quote-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles size={17} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
                    Accepted Commercial Quotation
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    Total agreed contract value authorized by landowner
                  </span>
                </div>
              </div>
              <div className="text-right ml-auto">
                <strong className="text-xl sm:text-2xl font-black text-white font-mono block tracking-tight">
                  {formatINR(acceptedQuotation)}
                </strong>
                <span className="text-[10.5px] font-bold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 inline-block mt-0.5">
                  ✓ Fixed Contract Base
                </span>
              </div>
            </div>

            {/* Interactive Advance Configuration & Milestone Split */}
            <div className="cd-advance-panels-grid">
              {/* Left Panel: Advance Setup Controls */}
              <div className="cd-advance-panel">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <span className="cd-advance-panel-title">
                    <Calculator size={14} /> Advance Terms Setup
                  </span>
                  <div className="flex items-center gap-1 bg-[#060e0a] px-2 py-0.5 rounded-lg border border-emerald-500/30">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={percentage}
                      onChange={(e) => handlePercentageChange(e.target.value)}
                      className="w-9 text-right bg-transparent text-emerald-300 font-mono font-black text-xs focus:outline-none"
                    />
                    <span className="text-emerald-400 font-bold text-xs">%</span>
                  </div>
                </div>

                {/* Primary Currency Input */}
                <div>
                  <label className="cd-inspection-label mb-1.5">
                    Mobilization Amount Required
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#060e0a] border border-emerald-500/35 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <span className="text-emerald-400 font-black font-mono text-lg">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={acceptedQuotation}
                      step="any"
                      value={advanceAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      required
                      className="w-full bg-transparent text-white font-mono font-black text-xl focus:outline-none placeholder:text-slate-600"
                      placeholder="e.g. 30000"
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-400 block mt-1">
                    Direct advance required from landowner prior to tree felling
                  </span>
                </div>

                {/* Range Slider & Quick Preset Chips */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Quick percentage share:</span>
                    <span className="text-emerald-300 font-bold font-mono">{percentage}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={percentage}
                    onChange={(e) => handlePercentageChange(e.target.value)}
                    className="cd-advance-range-slider"
                  />
                  <div className="cd-advance-chips-row pt-1">
                    {[10, 20, 25, 30, 40, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyPreset(pct)}
                        className={`cd-advance-chip ${percentage === pct ? 'active' : ''}`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel: Payment Milestones & Balance */}
              <div className="cd-advance-panel">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <span className="cd-advance-panel-title text-slate-200">
                    <Layers size={14} className="text-emerald-400" /> Milestone Breakdown
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    2-Stage Disbursement
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold">
                    <span className="text-emerald-400">Advance: {percentage}%</span>
                    <span className="text-amber-300">Final Balance: {100 - percentage}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#060e0a] overflow-hidden flex border border-emerald-500/25">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-amber-500/70 to-amber-400/80 transition-all duration-300"
                      style={{ width: `${100 - percentage}%` }}
                    />
                  </div>
                </div>

                {/* Stage 1: Mobilization Advance */}
                <div className="p-3 rounded-xl bg-[#082212] border border-emerald-500/35">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-emerald-400 uppercase tracking-wider">
                      Stage 1 • Upfront Mobilization
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      {percentage}% Due Now
                    </span>
                  </div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {formatINR(advanceAmount)}
                  </div>
                  <span className="text-[10.5px] text-slate-400 block mt-0.5">
                    To stage equipment, chainsaws, and forestry crew
                  </span>
                </div>

                {/* Stage 2: Post-Harvest Balance */}
                <div className="p-3 rounded-xl bg-[#081a10] border border-amber-500/25">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-amber-400 uppercase tracking-wider">
                      Stage 2 • Final Job Settlement
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                      {100 - percentage}% on Handover
                    </span>
                  </div>
                  <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                    {formatINR(remainingBalance)}
                  </div>
                  <span className="text-[10.5px] text-slate-400 block mt-0.5">
                    Payable upon timber scaling and completion handover
                  </span>
                </div>
              </div>
            </div>

            {/* CONTRACTOR PAYMENT DETAILS & BANK ACCOUNT */}
            <div className="cd-advance-account-panel">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Building2 size={14} />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Contractor Receiving Account Details
                  </span>
                </div>
                <span className="text-[10.5px] text-slate-400 font-medium">
                  Securely displayed to landowner on payment checkout
                </span>
              </div>

              {/* Row 1: Due Date & UPI ID */}
              <div className="cd-advance-form-row">
                <div>
                  <label className="cd-inspection-label mb-1">
                    <Calendar size={13} className="text-emerald-400" /> Payment Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="cd-advance-input"
                  />
                </div>

                <div>
                  <label className="cd-inspection-label mb-1">
                    <QrCode size={13} className="text-emerald-400" /> Contractor UPI ID *
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. treeconnect.contractor@okhdfcbank"
                    required
                    className="cd-advance-input monospace text-emerald-300 font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Account Holder Name & Bank Name */}
              <div className="cd-advance-form-row">
                <div>
                  <label className="cd-inspection-label mb-1">
                    Beneficiary / Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Contractor or enterprise account name"
                    className="cd-advance-input"
                  />
                </div>

                <div>
                  <label className="cd-inspection-label mb-1">
                    Bank Name &amp; Branch
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. HDFC Bank Ltd, Kottayam Branch"
                    className="cd-advance-input"
                  />
                </div>
              </div>

              {/* Row 3: Account Number & IFSC Code */}
              <div className="cd-advance-form-row">
                <div>
                  <label className="cd-inspection-label mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 50200084920194"
                    className="cd-advance-input monospace text-emerald-200 font-bold"
                  />
                </div>

                <div>
                  <label className="cd-inspection-label mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="cd-advance-input monospace text-emerald-200 uppercase font-bold tracking-wider"
                  />
                </div>
              </div>

              {/* Row 4: Mobilization Purpose / Note */}
              <div>
                <label className="cd-inspection-label mb-1">
                  Mobilization Purpose &amp; Scope (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Advance covers crew staging, chainsaw equipment inspection, and haulage logistics."
                  className="cd-advance-input"
                />
              </div>

              {/* Row 5: Custom Instructions Text Toggle */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedInstructions(!showAdvancedInstructions)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>{showAdvancedInstructions ? '▾ Hide Custom Instructions Text' : '▸ + Add Custom Instructions Text (Receipts & Offline)'}</span>
                </button>

                {showAdvancedInstructions && (
                  <textarea
                    rows={3}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Custom directions: UPI ID: ... / Bank Account: ... / Cheque favor of: ..."
                    className="cd-advance-input monospace text-xs mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 3. FIXED MODAL FOOTER */}
          <div className="cd-advance-footer">
            <span className="text-[11.5px] text-slate-400 hidden sm:inline-block font-medium">
              Terms will be linked to the digital harvest agreement
            </span>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="cd-advance-btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="cd-advance-btn-submit"
              >
                <Send size={15} />
                <span>
                  {submitting
                    ? 'Saving Payment Terms...'
                    : hasExistingReq
                      ? 'Update Advance Amount & Payment Details'
                      : 'Set Advance Amount & Send to Landowner'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestAdvancePaymentModal;
