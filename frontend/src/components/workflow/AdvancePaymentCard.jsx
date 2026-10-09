import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  FileCheck,
  Copy,
  Check,
  QrCode,
  Calendar,
  Layers,
  Edit3,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import './AdvancePaymentCard.css';

const formatDateDMY = (dateStr) => {
  if (!dateStr) return 'N/A';
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

const getPaymentStatusBadge = (status) => {
  switch (status) {
    case 'VERIFIED':
      return {
        label: 'Advance Verified',
        pillClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
        cardModifier: '',
        icon: CheckCircle2
      };
    case 'VERIFICATION_PENDING':
    case 'PENDING_VERIFICATION':
      return {
        label: 'Verification Pending',
        pillClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        cardModifier: 'apc-card-pending',
        icon: Clock
      };
    case 'REJECTED':
      return {
        label: 'Payment Rejected',
        pillClass: 'bg-red-500/20 text-red-300 border border-red-500/40',
        cardModifier: 'apc-card-rejected',
        icon: XCircle
      };
    case 'ADVANCE_REQUESTED':
    case 'PAYMENT_PENDING':
      return {
        label: 'Payment Pending',
        pillClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        cardModifier: 'apc-card-pending',
        icon: Clock
      };
    default:
      return {
        label: 'Advance Not Set',
        pillClass: 'bg-slate-700/40 text-slate-300 border border-slate-600/40',
        cardModifier: 'apc-card-neutral',
        icon: AlertCircle
      };
  }
};

const AdvancePaymentCard = ({
  request,
  role = 'landowner', // 'landowner' | 'contractor' | 'admin'
  onRequestAdvance,
  onRecordPayment,
  onVerifyPayment,
  onRejectPayment,
  onStartHarvest,
  onCompleteHarvest
}) => {
  const [copiedField, setCopiedField] = useState(null);

  const reqId = request?.id || request?._id;
  const ass = request?.assessment || {};
  const advReq = request?.advance_payment_request || request?.assessment?.advance_payment_request;
  const paymentStatus = request?.advance_payment_status || request?.assessment?.advance_payment_status || (advReq ? 'ADVANCE_REQUESTED' : 'NOT_REQUESTED');
  const isVerified = Boolean(request?.is_advance_verified || paymentStatus === 'VERIFIED');

  const isOperationReady = request?.status === 'OPERATION_READY' || request?.status === 'ACCEPTED' || Boolean(request?.digital_agreement);
  const isInProgress = request?.status === 'IN_PROGRESS';
  const isCompleted = request?.status === 'COMPLETED';

  const acceptedQuotation = Number(
    advReq?.accepted_quotation ||
    request?.total_quotation_amount ||
    request?.total_quote ||
    ass?.total_quote ||
    ass?.timber_purchase_price ||
    110000
  );

  const advancePercentage = Number(
    advReq?.advance_percentage ||
    (advReq?.advance_amount && acceptedQuotation ? Math.round((advReq.advance_amount / acceptedQuotation) * 100) : 30)
  );

  const advanceAmount = Number(
    advReq?.advance_amount ||
    Math.round((acceptedQuotation * advancePercentage) / 100)
  );

  const verifiedPaid = Number(request?.total_verified_paid || (isVerified ? advanceAmount : 0));

  const remainingBalance = Number(
    advReq?.remaining_balance !== undefined && advReq?.remaining_balance !== null
      ? advReq.remaining_balance
      : request?.remaining_balance !== undefined && request?.remaining_balance !== null && request.remaining_balance !== acceptedQuotation
        ? request.remaining_balance
        : Math.max(0, acceptedQuotation - advanceAmount - verifiedPaid)
  );

  const latestPayment = request?.latest_payment || request?.assessment?.latest_payment || (Array.isArray(request?.payments) && request.payments.length > 0 ? (request.payments[0] || request.payments[request.payments.length - 1]) : null);
  const paymentsList = Array.isArray(request?.payments) ? request.payments : [];

  const badgeInfo = getPaymentStatusBadge(paymentStatus);
  const StatusIcon = badgeInfo.icon;

  const isContractor = role === 'contractor' || role === 'admin';
  const isLandowner = role === 'landowner';

  // Extract structured contractor payment details
  const upiId = advReq?.upi_id ||
    advReq?.payment_instructions?.match(/UPI\s*(?:ID)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    'treeconnect.contractor@okhdfcbank';

  const bankName = advReq?.bank_name ||
    advReq?.payment_instructions?.match(/Bank\s*(?:Name)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    'HDFC Bank Ltd, Kottayam Branch';

  const acNo = advReq?.bank_account_number ||
    advReq?.payment_instructions?.match(/A\/C\s*(?:No)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    '50200084920194';

  const ifscCode = advReq?.ifsc_code ||
    advReq?.payment_instructions?.match(/IFSC\s*(?:Code)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    'HDFC0001234';

  const acHolder = advReq?.account_holder_name ||
    advReq?.payment_instructions?.match(/A\/C\s*(?:Name|Holder)\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    request?.assigned_contractor_name ||
    'Rohith kumar';

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={`apc-card ${badgeInfo.cardModifier}`}>
      {/* SECTION HEADER */}
      <div className="apc-header">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="apc-icon-badge">
            <CreditCard size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="apc-title">
                Advance Payment &amp; Financial Mobilization
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm ${badgeInfo.pillClass}`}>
                <StatusIcon size={12} className={paymentStatus === 'ADVANCE_REQUESTED' ? 'animate-pulse' : ''} />
                <span>{badgeInfo.label}</span>
              </span>
            </div>
            <p className="apc-subtitle">
              Pre-operation mobilization fund required before tree felling and logistics commence.
            </p>
          </div>
        </div>

        {/* Action Button on Header */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* CONTRACTOR: SET OR UPDATE ADVANCE AMOUNT */}
          {isContractor && !isVerified && !isInProgress && !isCompleted && (
            <button
              type="button"
              onClick={onRequestAdvance}
              className="cd-btn-inspect-primary cursor-pointer shadow-md"
            >
              <CreditCard size={14} />
              <span>
                {advReq && paymentStatus !== 'NOT_REQUESTED'
                  ? 'Update Advance Amount'
                  : 'Set Advance Amount'}
              </span>
            </button>
          )}

          {/* LANDOWNER: RECORD ADVANCE PAYMENT */}
          {isLandowner && (paymentStatus === 'ADVANCE_REQUESTED' || paymentStatus === 'PAYMENT_PENDING' || paymentStatus === 'REJECTED') && (
            <button
              type="button"
              onClick={onRecordPayment}
              className="cd-btn-inspect-primary cursor-pointer shadow-md"
            >
              <CreditCard size={14} />
              <span>{paymentStatus === 'REJECTED' ? 'Resubmit Payment Details' : 'Record Advance Payment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS SUMMARY 5-COLUMN QUICK-GRID */}
      <div className="apc-metrics-grid">
        <div className="apc-metric-cell">
          <span className="apc-metric-label">
            {isOperationReady ? 'Accepted Quotation' : 'Target Quotation'}
          </span>
          <span className="apc-metric-val text-white">
            {formatINR(acceptedQuotation)}
          </span>
          <span className="apc-metric-hint">
            {isOperationReady ? 'Contract Value' : 'Base Calculation'}
          </span>
        </div>

        <div className="apc-metric-cell">
          <span className="apc-metric-label">
            Advance Ratio
          </span>
          <span className="apc-metric-val text-emerald-400">
            {advReq ? `${advancePercentage}%` : '30%'}
          </span>
          <span className="apc-metric-hint">
            Mobilization Share
          </span>
        </div>

        <div className="apc-metric-cell">
          <span className="apc-metric-label">
            Advance Amount
          </span>
          <span className="apc-metric-val text-emerald-300">
            {advReq ? formatINR(advanceAmount) : '—'}
          </span>
          <span className="apc-metric-hint">
            Upfront Payable
          </span>
        </div>

        <div className="apc-metric-cell">
          <span className="apc-metric-label">
            Verified Paid
          </span>
          <span className="apc-metric-val text-teal-300">
            {formatINR(verifiedPaid)}
          </span>
          <span className="apc-metric-hint">
            Credited Amount
          </span>
        </div>

        <div className="apc-metric-cell">
          <span className="apc-metric-label">
            Remaining Balance
          </span>
          <span className="apc-metric-val text-amber-300">
            {formatINR(remainingBalance)}
          </span>
          <span className="apc-metric-hint">
            Due Post-Harvest
          </span>
        </div>
      </div>

      {/* CONTRACTOR SETTLEMENT ACCOUNT & TRANSFER CHANNELS */}
      {advReq ? (
        <div className="apc-accounts-section">
          {/* Top Bar with Due Date & Edit */}
          <div className="apc-accounts-header">
            <div className="apc-accounts-title">
              <Building2 size={16} />
              <span>Contractor Payment Account &amp; Transfer Details</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <Calendar size={12} className="text-emerald-400" />
                <span>Due Date: <strong>{formatDateDMY(advReq.due_date)}</strong></span>
              </span>
              {isContractor && !isVerified && !isInProgress && !isCompleted && (
                <button
                  type="button"
                  onClick={onRequestAdvance}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Edit Terms</span>
                </button>
              )}
            </div>
          </div>

          {/* TWO STRUCTURED CHANNELS: UPI & BANK TRANSFER */}
          <div className="apc-channels-grid">
            {/* Channel 1: UPI Direct Remittance */}
            <div className="apc-channel-card">
              <div className="apc-channel-top">
                <span className="apc-channel-label">
                  <QrCode size={14} className="text-emerald-400" /> UPI Direct Transfer
                </span>
                <span className="apc-channel-badge">GPay • PhonePe • BHIM • Paytm</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Virtual Payment Address (VPA):
                </span>
                <div className="apc-vpa-box">
                  <span className="apc-vpa-text" title={upiId}>
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(upiId, 'upi')}
                    className={`apc-copy-btn ${copiedField === 'upi' ? 'copied' : ''}`}
                    title="Copy UPI ID"
                  >
                    {copiedField === 'upi' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedField === 'upi' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[10.5px] text-slate-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                <span>Supports instant verification across all Indian UPI banking apps.</span>
              </div>
            </div>

            {/* Channel 2: Bank Transfer (NEFT/RTGS/IMPS) */}
            <div className="apc-channel-card">
              <div className="apc-channel-top">
                <span className="apc-channel-label">
                  <Building2 size={14} className="text-teal-400" /> Bank Transfer (NEFT/IMPS)
                </span>
                <span className="apc-channel-badge text-teal-300 border-teal-500/20" title={bankName}>
                  {bankName}
                </span>
              </div>

              <div className="apc-bank-rows">
                <div className="apc-bank-row-item">
                  <span className="apc-bank-row-label">A/C Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="apc-bank-row-val">{acNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(acNo, 'ac')}
                      className={`apc-copy-btn py-1 px-2 text-[10px] ${copiedField === 'ac' ? 'copied' : ''}`}
                      title="Copy Account Number"
                    >
                      {copiedField === 'ac' ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedField === 'ac' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="apc-bank-row-item">
                  <span className="apc-bank-row-label">IFSC Code:</span>
                  <div className="flex items-center gap-2">
                    <span className="apc-bank-row-val text-emerald-300">{ifscCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ifscCode, 'ifsc')}
                      className={`apc-copy-btn py-1 px-2 text-[10px] ${copiedField === 'ifsc' ? 'copied' : ''}`}
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedField === 'ifsc' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="apc-beneficiary-strip">
                <span>Beneficiary Name:</span>
                <span className="apc-beneficiary-name">{acHolder}</span>
              </div>
            </div>
          </div>

          {/* Contractor Remarks Note */}
          {advReq.remarks && (
            <div className="apc-note-box">
              <div className="flex items-start gap-2">
                <Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Contractor Mobilization Note: </strong>
                  <span>"{advReq.remarks}"</span>
                </div>
              </div>
            </div>
          )}

          {/* PROMINENT ACTION FOR LANDOWNER TO RECORD PAYMENT */}
          {isLandowner && (paymentStatus === 'ADVANCE_REQUESTED' || paymentStatus === 'PAYMENT_PENDING' || paymentStatus === 'REJECTED') && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <span className="text-xs text-slate-200 leading-relaxed">
                Remit advance mobilization fee of <strong className="text-emerald-300 font-mono text-sm">{formatINR(advanceAmount)}</strong> via the account details above, then record transaction UTR.
              </span>
              <button
                type="button"
                onClick={onRecordPayment}
                className="cd-btn-inspect-primary shrink-0 cursor-pointer shadow-lg"
              >
                <CreditCard size={14} />
                <span>{paymentStatus === 'REJECTED' ? 'Resubmit Payment Proof' : 'Record Advance Payment'}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ADVANCE NOT SET YET */
        <div className="p-4 rounded-xl bg-black/35 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-300">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <span>
              {isContractor
                ? 'Advance payment has not been configured yet. Set mobilization amount before starting work.'
                : 'Awaiting contractor to set mobilization advance terms and payment details.'}
            </span>
          </div>
          {isContractor && !isInProgress && !isCompleted && (
            <button
              type="button"
              onClick={onRequestAdvance}
              className="cd-btn-inspect-primary shrink-0 cursor-pointer shadow-md"
            >
              <CreditCard size={13} />
              <span>Set Advance Amount</span>
            </button>
          )}
        </div>
      )}

      {/* VERIFICATION PENDING STATE ALERT */}
      {(paymentStatus === 'VERIFICATION_PENDING' || paymentStatus === 'PENDING_VERIFICATION') && (
        <div className="apc-alert-box apc-alert-pending">
          <div className="flex items-start gap-3 min-w-0">
            <Clock size={20} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="min-w-0">
              <strong className="text-xs sm:text-sm font-black text-amber-300 block">
                Payment Submitted — Verification Pending
              </strong>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Amount: <strong className="text-white font-mono">{formatINR(latestPayment?.amount || advanceAmount)}</strong> {latestPayment?.payment_method ? `via ${latestPayment.payment_method}` : ''} • Ref ID / UTR: <strong className="text-amber-200 font-mono">{latestPayment?.transaction_reference || 'Recorded by Landowner'}</strong> {latestPayment?.payment_date ? `on ${formatDateDMY(latestPayment.payment_date)}` : ''}.
              </p>
              {latestPayment?.notes && (
                <p className="text-xs text-slate-400 italic mt-0.5">
                  Landowner Note: "{latestPayment.notes}"
                </p>
              )}
            </div>
          </div>

          {/* Contractor actions for verification */}
          {isContractor && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onRejectPayment(latestPayment || {})}
                className="cd-btn-inspect-secondary text-red-300 border-red-500/35 hover:border-red-500/60 hover:bg-red-950/60 cursor-pointer"
              >
                <XCircle size={13} />
                <span>Reject</span>
              </button>
              <button
                type="button"
                onClick={() => onVerifyPayment(latestPayment || {})}
                className="cd-btn-inspect-primary cursor-pointer shadow-md"
              >
                <CheckCircle2 size={13} />
                <span>Verify &amp; Credit Payment</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* REJECTED PAYMENT ALERT */}
      {paymentStatus === 'REJECTED' && (
        <div className="apc-alert-box apc-alert-rejected">
          <div className="flex items-start gap-3 min-w-0">
            <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <strong className="text-xs sm:text-sm font-black text-red-300 block">
                Payment Verification Rejected
              </strong>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Contractor Reason: <em className="text-red-200 font-semibold">"{request?.rejection_reason || latestPayment?.rejection_reason || 'Transaction could not be verified in bank records.'}"</em>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Please check your bank transaction details and resubmit the correct reference ID or receipt.
              </p>
            </div>
          </div>

          {isLandowner && (
            <button
              type="button"
              onClick={onRecordPayment}
              className="cd-btn-inspect-primary shrink-0 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Resubmit Payment</span>
            </button>
          )}
        </div>
      )}

      {/* VERIFIED SUCCESS CONFIRMATION */}
      {isVerified && paymentStatus !== 'VERIFICATION_PENDING' && (
        <div className="apc-alert-box apc-alert-verified">
          <div className="flex items-center gap-3 min-w-0">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div className="min-w-0 text-xs leading-relaxed">
              <strong className="text-emerald-300 font-extrabold text-sm block">
                ✓ Advance Payment Verified ({formatINR(advanceAmount)})
              </strong>
              <span className="text-slate-300">
                Transaction verified by contractor. Mobilization advance credited to this harvesting service job. Remaining balance of <strong className="text-white font-mono">{formatINR(remainingBalance)}</strong> will be settled as agreed upon operation progress/completion.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* START WORK ELIGIBILITY BANNER (FOR OPERATION_READY JOBS) */}
      {isOperationReady && (
        <div>
          {!isVerified ? (
            <div className="apc-alert-box apc-alert-pending">
              <div className="flex items-center gap-2.5 text-xs text-amber-200 font-medium">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Advance Payment Pending</strong> — harvesting operations cannot start until the required mobilization advance is verified.
                </span>
              </div>
              {isContractor && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onRequestAdvance}
                    className="cd-btn-inspect-primary cursor-pointer shadow-md"
                  >
                    <CreditCard size={13} />
                    <span>{advReq && paymentStatus !== 'NOT_REQUESTED' ? 'Update Advance Terms' : 'Set Advance Amount'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={true}
                    className="px-3.5 py-2 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700/60 flex items-center gap-1.5 shrink-0"
                    title="Harvesting cannot begin until advance payment is verified"
                  >
                    <Play size={13} />
                    <span>Start Work (Locked)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="apc-alert-box apc-alert-verified">
              <div className="flex items-center gap-2.5 text-xs text-emerald-200 font-bold">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>
                  All Pre-Start Conditions Satisfied — Agreement Signed &amp; Mobilization Advance Verified.
                </span>
              </div>

              {isContractor && (
                <button
                  type="button"
                  onClick={onStartHarvest}
                  className="cd-btn-inspect-primary shrink-0 cursor-pointer shadow-lg"
                >
                  <Play size={14} />
                  <span>Start Harvesting Operations</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* IN PROGRESS STATUS */}
      {isInProgress && (
        <div className="apc-alert-box apc-alert-progress">
          <div className="flex items-center gap-2.5 text-xs text-blue-200 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
            <span>Harvesting Operations In Progress</span>
          </div>
          {isContractor && (
            <button
              type="button"
              onClick={onCompleteHarvest}
              className="cd-btn-inspect-primary bg-blue-600 hover:bg-blue-500 text-white shrink-0 cursor-pointer shadow-md"
            >
              <FileCheck size={14} />
              <span>Log Completion &amp; Actual Yield</span>
            </button>
          )}
        </div>
      )}

      {/* PAYMENT HISTORY ACCORDION/LOG */}
      {paymentsList.length > 0 && (
        <div className="pt-2 border-t border-emerald-500/15">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Payment History &amp; Transaction Ledger ({paymentsList.length})
          </span>
          <div className="space-y-1.5">
            {paymentsList.map((p, idx) => (
              <div
                key={p.payment_id || idx}
                className="cd-payment-ledger-row"
              >
                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.status === 'VERIFIED' ? 'bg-emerald-400' : p.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span className="font-mono font-bold text-white text-xs">{p.transaction_reference || 'REF-N/A'}</span>
                  <span className="text-slate-400 text-xs">• {p.payment_method}</span>
                  <span className="text-slate-500 text-xs">• {formatDateDMY(p.payment_date || p.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <strong className="font-mono text-emerald-400 text-xs">{formatINR(p.amount)}</strong>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    p.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    p.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancePaymentCard;
