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
  Edit3
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';

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
        label: 'Verified',
        pillClass: 'cd-payment-pill-verified',
        cardModifier: '',
        icon: CheckCircle2
      };
    case 'VERIFICATION_PENDING':
      return {
        label: 'Verification Pending',
        pillClass: 'cd-payment-pill-pending',
        cardModifier: 'cd-payment-card-pending',
        icon: Clock
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        pillClass: 'cd-payment-pill-rejected',
        cardModifier: 'cd-payment-card-rejected',
        icon: XCircle
      };
    case 'ADVANCE_REQUESTED':
    case 'PAYMENT_PENDING':
      return {
        label: 'Payment Pending',
        pillClass: 'cd-payment-pill-pending',
        cardModifier: 'cd-payment-card-pending',
        icon: Clock
      };
    default:
      return {
        label: 'Advance Not Set',
        pillClass: 'cd-payment-pill-neutral',
        cardModifier: 'cd-payment-card-not-requested',
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

  const acceptedQuotation = Number(
    request?.total_quotation_amount ||
    request?.total_quote ||
    advReq?.accepted_quotation ||
    ass?.total_quote ||
    99000
  );

  const advancePercentage = Number(advReq?.advance_percentage || 30);
  const advanceAmount = Number(advReq?.advance_amount || Math.round((acceptedQuotation * advancePercentage) / 100));
  const verifiedPaid = Number(request?.total_verified_paid || (isVerified ? advanceAmount : 0));
  const remainingBalance = Number(
    request?.remaining_balance !== undefined && request?.remaining_balance !== null
      ? request?.remaining_balance
      : Math.max(0, acceptedQuotation - verifiedPaid)
  );

  const latestPayment = request?.latest_payment || request?.assessment?.latest_payment || (Array.isArray(request?.payments) && request.payments.length > 0 ? (request.payments[0] || request.payments[request.payments.length - 1]) : null);
  const paymentsList = Array.isArray(request?.payments) ? request.payments : [];


  const badgeInfo = getPaymentStatusBadge(paymentStatus);
  const StatusIcon = badgeInfo.icon;

  const isContractor = role === 'contractor' || role === 'admin';
  const isLandowner = role === 'landowner';

  const isOperationReady = request?.status === 'OPERATION_READY' || request?.status === 'ACCEPTED' || Boolean(request?.digital_agreement);
  const isInProgress = request?.status === 'IN_PROGRESS';
  const isCompleted = request?.status === 'COMPLETED';

  // Extract structured contractor payment details (or fallback gracefully to text parsing)
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
    'Forestry Contractor';

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className={`cd-payment-card ${badgeInfo.cardModifier}`}>
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-emerald-500/15">
        <div className="flex items-center gap-3 min-w-0">
          <div className="cd-inspection-icon-box cd-inspection-icon-completed shrink-0">
            <CreditCard size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                Advance Payment &amp; Financial Mobilization
              </h4>
              <span className={`cd-payment-status-pill ${badgeInfo.pillClass}`}>
                <StatusIcon size={12} />
                <span>{badgeInfo.label}</span>
              </span>
            </div>
            <p className="cd-inspection-desc">
              Required advance mobilization before felling operations commence.
            </p>
          </div>
        </div>

        {/* Action Button on Header */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* CONTRACTOR: SET OR UPDATE ADVANCE AMOUNT BEFORE WORK STARTS */}
          {isContractor && !isVerified && !isInProgress && !isCompleted && (
            <button
              type="button"
              onClick={onRequestAdvance}
              className="cd-btn-inspect-primary cursor-pointer"
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
              className="cd-btn-inspect-primary cursor-pointer"
            >
              <CreditCard size={14} />
              <span>{paymentStatus === 'REJECTED' ? 'Resubmit Payment Details' : 'Record Advance Payment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS SUMMARY QUICK-GRID */}
      <div className="cd-inspection-quick-grid">
        <div className="cd-inspection-quick-cell">
          <span className="cd-inspection-quick-label">
            Accepted Quotation
          </span>
          <span className="cd-inspection-quick-val font-mono text-white">
            {formatINR(acceptedQuotation)}
          </span>
        </div>

        <div className="cd-inspection-quick-cell">
          <span className="cd-inspection-quick-label">
            Advance Percentage
          </span>
          <span className="cd-inspection-quick-val font-mono text-emerald-300">
            {advReq ? `${advancePercentage}%` : 'Not Set'}
          </span>
        </div>

        <div className="cd-inspection-quick-cell">
          <span className="cd-inspection-quick-label">
            Advance Amount
          </span>
          <span className="cd-inspection-quick-val font-mono text-emerald-400">
            {advReq ? formatINR(advanceAmount) : '—'}
          </span>
        </div>

        <div className="cd-inspection-quick-cell">
          <span className="cd-inspection-quick-label">
            Verified Amount Paid
          </span>
          <span className="cd-inspection-quick-val font-mono text-emerald-400">
            {formatINR(verifiedPaid)}
          </span>
        </div>

        <div className="cd-inspection-quick-cell col-span-2 sm:col-span-1">
          <span className="cd-inspection-quick-label">
            Remaining Balance
          </span>
          <span className="cd-inspection-quick-val font-mono text-amber-300">
            {formatINR(remainingBalance)}
          </span>
        </div>
      </div>

      {/* CONTRACTOR PAYMENT DETAILS AT LANDOWNER & CONTRACTOR PAGE */}
      {advReq ? (
        <div className="p-3.5 sm:p-4 rounded-xl bg-black/40 border border-emerald-500/25 space-y-3 text-xs shadow-inner">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-emerald-500/20">
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Building2 size={14} /> Contractor Payment Account &amp; Transfer Details
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Calendar size={12} /> Due: <strong>{formatDateDMY(advReq.due_date)}</strong>
              </span>
              {isContractor && !isVerified && !isInProgress && !isCompleted && (
                <button
                  type="button"
                  onClick={onRequestAdvance}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={11} /> Edit Terms
                </button>
              )}
            </div>
          </div>

          {/* STRUCTURED PAYMENT CHANNELS: UPI & BANK TRANSFER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* UPI Account Details */}
            <div className="p-3 rounded-lg bg-[#05170b] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <QrCode size={12} /> UPI Direct Transfer
                </span>
                <span className="text-[10px] text-slate-400">GPay • PhonePe • Paytm</span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-black/50 border border-emerald-500/20">
                <span className="font-mono text-xs font-bold text-emerald-200 select-all truncate">
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(upiId, 'upi')}
                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copiedField === 'upi' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="p-3 rounded-lg bg-[#05170b] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Building2 size={12} /> Bank Transfer (NEFT/IMPS)
                </span>
                <span className="text-[10px] text-slate-400">{bankName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-1.5 rounded bg-black/50 border border-emerald-500/20">
                  <span className="text-[9.5px] text-slate-400 block">A/C Number:</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-white text-[11px] truncate">{acNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(acNo, 'ac')}
                      className="text-emerald-400 hover:text-white cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedField === 'ac' ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
                <div className="p-1.5 rounded bg-black/50 border border-emerald-500/20">
                  <span className="text-[9.5px] text-slate-400 block">IFSC Code:</span>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-white text-[11px] truncate">{ifscCode}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ifscCode, 'ifsc')}
                      className="text-emerald-400 hover:text-white cursor-pointer"
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                Beneficiary: <strong className="text-slate-200">{acHolder}</strong>
              </div>
            </div>
          </div>

          {/* Contractor Remarks Note */}
          {advReq.remarks && (
            <p className="text-[11px] text-slate-400 italic pt-1 border-t border-emerald-500/15">
              Contractor Note: "{advReq.remarks}"
            </p>
          )}

          {/* PROMINENT ACTION FOR LANDOWNER TO RECORD PAYMENT */}
          {isLandowner && (paymentStatus === 'ADVANCE_REQUESTED' || paymentStatus === 'PAYMENT_PENDING' || paymentStatus === 'REJECTED') && (
            <div className="pt-2 border-t border-emerald-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-950/30 p-2.5 rounded-lg">
              <span className="text-xs text-slate-300">
                Transfer <strong className="text-emerald-300 font-mono">{formatINR(advanceAmount)}</strong> using above UPI or Bank details, then record the transaction reference ID.
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
        <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle size={15} className="text-slate-400 shrink-0" />
            <span>
              {isContractor
                ? 'Advance payment has not been configured yet. Set the mobilization amount before starting work.'
                : 'Awaiting contractor to set mobilization advance terms and payment details.'}
            </span>
          </div>
          {isContractor && !isInProgress && !isCompleted && (
            <button
              type="button"
              onClick={onRequestAdvance}
              className="cd-btn-inspect-primary shrink-0 cursor-pointer"
            >
              <CreditCard size={13} />
              <span>Set Advance Amount</span>
            </button>
          )}
        </div>
      )}

      {/* VERIFICATION PENDING STATE ALERT */}
      {(paymentStatus === 'VERIFICATION_PENDING' || paymentStatus === 'PENDING_VERIFICATION') && (
        <div className="cd-payment-alert-box cd-payment-alert-pending">
          <div className="flex items-start gap-2.5 min-w-0">
            <Clock size={18} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="min-w-0">
              <strong className="text-xs sm:text-sm font-extrabold text-amber-300 block">
                Payment Submitted — Verification Pending
              </strong>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
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
                className="cd-btn-inspect-primary cursor-pointer"
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
        <div className="cd-payment-alert-box cd-payment-alert-rejected">
          <div className="flex items-start gap-2.5 min-w-0">
            <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <strong className="text-xs sm:text-sm font-extrabold text-red-300 block">
                Payment Verification Rejected
              </strong>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
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
        <div className="cd-payment-alert-box cd-payment-alert-verified">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div className="min-w-0 text-xs leading-relaxed">
              <strong className="text-emerald-300 font-extrabold block">
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
            <div className="cd-payment-alert-box cd-payment-alert-pending">
              <div className="flex items-center gap-2.5 text-xs text-amber-200 font-medium">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Advance Payment Pending</strong> — harvesting work cannot start until the required advance payment has been verified.
                </span>
              </div>
              {isContractor && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onRequestAdvance}
                    className="cd-btn-inspect-primary cursor-pointer"
                  >
                    <CreditCard size={13} />
                    <span>{advReq && paymentStatus !== 'NOT_REQUESTED' ? 'Update Advance Terms' : 'Set Advance Amount'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={true}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 font-bold text-xs cursor-not-allowed border border-slate-700 flex items-center gap-1.5 shrink-0"
                    title="Harvesting cannot begin until advance payment is verified"
                  >
                    <Play size={13} />
                    <span>Start Work (Locked)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="cd-payment-alert-box cd-payment-alert-verified">
              <div className="flex items-center gap-2.5 text-xs text-emerald-200 font-bold">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  All Pre-Start Conditions Satisfied — Agreement Signed &amp; Advance Payment Verified.
                </span>
              </div>

              {isContractor && (
                <button
                  type="button"
                  onClick={onStartHarvest}
                  className="cd-btn-inspect-primary shrink-0 cursor-pointer"
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
        <div className="cd-payment-alert-box cd-payment-alert-progress">
          <div className="flex items-center gap-2 text-xs text-blue-200 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
            <span>Harvesting Work In Progress</span>
          </div>
          {isContractor && (
            <button
              type="button"
              onClick={onCompleteHarvest}
              className="cd-btn-inspect-primary bg-blue-600 hover:bg-blue-500 text-white shrink-0 cursor-pointer"
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Payment History &amp; Transaction Ledger ({paymentsList.length})
          </span>
          <div className="space-y-1.5">
            {paymentsList.map((p, idx) => (
              <div
                key={p.payment_id || idx}
                className="cd-payment-ledger-row"
              >
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${p.status === 'VERIFIED' ? 'bg-emerald-400' : p.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <span className="font-mono font-bold text-white">{p.transaction_reference || 'REF-N/A'}</span>
                  <span className="text-slate-400">• {p.payment_method}</span>
                  <span className="text-slate-500">• {formatDateDMY(p.payment_date || p.created_at)}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <strong className="font-mono text-emerald-400 text-xs">{formatINR(p.amount)}</strong>
                  <span className={`cd-payment-status-pill ${
                    p.status === 'VERIFIED' ? 'cd-payment-pill-verified' :
                    p.status === 'REJECTED' ? 'cd-payment-pill-rejected' :
                    'cd-payment-pill-pending'
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
