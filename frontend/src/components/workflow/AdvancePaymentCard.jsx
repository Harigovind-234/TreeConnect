import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Info,
  Camera,
  Truck,
  Sparkles,
  Award,
  CalendarCheck,
  CalendarClock,
  TreePine,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatINR } from '../../utils/timberCalculations';
import RecordAdvancePaymentModal from './RecordAdvancePaymentModal';
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
  onCompleteHarvest,
  onOpenStages,
  onProposeHarvestDate
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState(null);
  const [internalPaymentModal, setInternalPaymentModal] = useState(null);
  const [showHarvestDateModal, setShowHarvestDateModal] = useState(false);
  const [harvestDateInput, setHarvestDateInput] = useState('');
  const [harvestDateNote, setHarvestDateNote] = useState('');

  const handleTriggerPayment = (opts = {}) => {
    if (onRecordPayment) {
      onRecordPayment(opts);
    } else {
      setInternalPaymentModal({ req: request, ...opts });
    }
  };

  const reqId = request?.id || request?._id;
  const ass = request?.assessment || {};
  const advReq = request?.advance_payment_request || request?.assessment?.advance_payment_request;
  const paymentStatus = request?.advance_payment_status || request?.assessment?.advance_payment_status || (advReq ? 'ADVANCE_REQUESTED' : 'NOT_REQUESTED');
  const isVerified = Boolean(request?.is_advance_verified || paymentStatus === 'VERIFIED');

  const stagesData = request?.harvest_stages || {};
  const verifiedCount = Object.values(stagesData).filter(s => {
    const st = String(s?.status || '').toUpperCase();
    return st === 'VERIFIED' || st === 'COMPLETED';
  }).length;
  const isCompleted = request?.status === 'COMPLETED' || verifiedCount === 4;
  const isInProgress = !isCompleted && (request?.status === 'IN_PROGRESS' || verifiedCount > 0);
  const isOperationReady = !isCompleted && !isInProgress && (request?.status === 'OPERATION_READY' || request?.status === 'ACCEPTED' || Boolean(request?.digital_agreement));

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
        : Math.max(0, acceptedQuotation - verifiedPaid)
  );

  const latestPayment = request?.latest_payment || request?.assessment?.latest_payment || (Array.isArray(request?.payments) && request.payments.length > 0 ? (request.payments[0] || request.payments[request.payments.length - 1]) : null);
  const paymentsList = Array.isArray(request?.payments) ? request.payments : [];

  const isTimberPurchase = Boolean(
    request?.commercial_proposal_type === 'Timber Purchase Offer' ||
    ass?.commercial_proposal_type === 'Timber Purchase Offer' ||
    Boolean(request?.contractor_purchase_offer) ||
    Boolean(ass?.contractor_purchase_offer) ||
    request?.site_inspection?.landowner_preferred_arrangement === 'INTERESTED_IN_TIMBER_SALE'
  );
  const timberPurchaseAmount = Number(
    request?.contractor_purchase_offer ||
    ass?.contractor_purchase_offer ||
    acceptedQuotation ||
    220000
  );
  const isTimberPaid = Boolean(
    request?.contractor_paid ||
    request?.timber_payout_settled ||
    request?.is_advance_verified ||
    paymentStatus === 'VERIFIED' ||
    paymentStatus === 'PAID'
  );

  const isFullyPaid = Boolean(
    request?.is_fully_paid ||
    (remainingBalance <= 0 && isVerified) ||
    request?.final_payment_status === 'VERIFIED'
  );

  const finalPaymentStatus = request?.final_payment_status ||
    (paymentsList.find(p => p.payment_purpose === 'FINAL_PAYMENT')?.status) ||
    null;

  const pendingFinalPayment = paymentsList.find(
    p => p.status === 'VERIFICATION_PENDING' && (p.payment_purpose === 'FINAL_PAYMENT' || isCompleted)
  ) || (finalPaymentStatus === 'VERIFICATION_PENDING' ? latestPayment : null);

  const isFinalPending = Boolean(
    pendingFinalPayment ||
    finalPaymentStatus === 'VERIFICATION_PENDING'
  );

  const isFinalRejected = Boolean(finalPaymentStatus === 'REJECTED');

  let badgeInfo;
  if (isFullyPaid) {
    badgeInfo = {
      label: '✓ 100% Fully Settled',
      pillClass: 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-emerald-500/20',
      cardModifier: 'apc-card-settled',
      icon: Sparkles
    };
  } else if (isFinalPending) {
    badgeInfo = {
      label: 'Final Settlement Pending Verification',
      pillClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      cardModifier: 'apc-card-pending',
      icon: Clock
    };
  } else if (isFinalRejected) {
    badgeInfo = {
      label: 'Final Settlement Rejected',
      pillClass: 'bg-red-500/20 text-red-300 border border-red-500/40',
      cardModifier: 'apc-card-rejected',
      icon: XCircle
    };
  } else if (isCompleted && remainingBalance > 0) {
    badgeInfo = {
      label: `Final Settlement Due (${formatINR(remainingBalance)})`,
      pillClass: 'bg-amber-500/25 text-amber-300 border border-amber-400/50',
      cardModifier: 'apc-card-pending',
      icon: CreditCard
    };
  } else {
    badgeInfo = getPaymentStatusBadge(paymentStatus);
  }
  const StatusIcon = badgeInfo.icon;

  const isContractor = role === 'contractor' || (role !== 'landowner' && user?.role === 'contractor') || role === 'admin';
  const isLandowner = role === 'landowner' || (!isContractor && (user?.role === 'landowner' || user?.email === (request?.owner_email || request?.ownerEmail || 'harigovind@keralatree.in')));

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

  // Harvest date proposal state from request
  const proposedHarvestDate = request?.proposed_harvest_date || request?.assessment?.proposed_harvest_date;
  const harvestDateApproved = Boolean(request?.harvest_date_approved || request?.assessment?.harvest_date_approved);
  const harvestDateApprovedDate = request?.harvest_date_approved_at || request?.assessment?.harvest_date_approved_at;
  const harvestDateProposedAt = request?.harvest_date_proposed_at || request?.assessment?.harvest_date_proposed_at;

  // For timber purchase: payment is gated behind harvest date approval
  const needsHarvestDateApproval = isTimberPurchase && !harvestDateApproved;
  const canProceedToPayment = !isTimberPurchase || harvestDateApproved;

  const handleProposeDateSubmit = (e) => {
    e.preventDefault();
    if (!harvestDateInput) return;
    const dateData = {
      proposed_harvest_date: harvestDateInput,
      harvest_date_note: harvestDateNote,
      harvest_date_proposed_at: new Date().toISOString()
    };
    if (onProposeHarvestDate) {
      onProposeHarvestDate(dateData);
    } else {
      // Local update fallback
      const stored = localStorage.getItem('treeconnect_harvest_requests');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const reqId = request?.id || request?._id;
          const updated = parsed.map(r => {
            if ((r.id || r._id) === reqId) return { ...r, ...dateData };
            return r;
          });
          localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
        } catch (e) {}
      }
    }
    setShowHarvestDateModal(false);
  };

  return (
    <div className={`apc-card ${badgeInfo.cardModifier}`}>
      {/* SECTION HEADER */}
      <div className="apc-header">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="apc-icon-badge">
            {isTimberPurchase ? <TreePine size={20} /> : <CreditCard size={20} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="apc-title">
                {isTimberPurchase
                  ? 'Tree Purchase & Timber Payment'
                  : 'Advance Payment & Financial Mobilization'}
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm ${badgeInfo.pillClass}`}>
                <StatusIcon size={12} className={paymentStatus === 'ADVANCE_REQUESTED' || isFinalPending ? 'animate-pulse' : ''} />
                <span>{badgeInfo.label}</span>
              </span>
            </div>
            <p className="apc-subtitle">
              {isTimberPurchase
                ? 'Contractor purchases standing timber from the landowner — full payment must be deposited before felling begins.'
                : 'Pre-operation mobilization fund required before tree felling and logistics commence.'}
            </p>
          </div>
        </div>

        {/* Action Button on Header */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          {/* CONTRACTOR: SET OR UPDATE ADVANCE AMOUNT (Only before agreement is finalized and before payment is made) */}
          {isContractor && !isVerified && !isInProgress && !isCompleted && !request?.digital_agreement && paymentStatus !== 'VERIFICATION_PENDING' && paymentStatus !== 'VERIFIED' && (
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
              onClick={() => onRecordPayment && onRecordPayment({ mode: 'advance', defaultAmount: advanceAmount })}
              className="cd-btn-inspect-primary cursor-pointer shadow-md"
            >
              <CreditCard size={14} />
              <span>{paymentStatus === 'REJECTED' ? 'Resubmit Payment Details' : 'Record Advance Payment'}</span>
            </button>
          )}

          {/* LANDOWNER: PAY FINAL BALANCE (WHEN HARVEST COMPLETED AND BALANCE REMAINS) */}
          {isLandowner && isCompleted && remainingBalance > 0 && !isFullyPaid && !isFinalPending && !isFinalRejected && (
            <button
              type="button"
              onClick={() => onRecordPayment && onRecordPayment({ mode: 'final', defaultAmount: remainingBalance })}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
            >
              <CreditCard size={14} />
              <span>Pay Final Balance ({formatINR(remainingBalance)})</span>
            </button>
          )}

          {/* LANDOWNER: RESUBMIT FINAL PAYMENT */}
          {isLandowner && isCompleted && isFinalRejected && (
            <button
              type="button"
              onClick={() => onRecordPayment && onRecordPayment({ mode: 'final', defaultAmount: remainingBalance })}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
            >
              <RotateCcw size={14} />
              <span>Resubmit Final Settlement</span>
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

        {isTimberPurchase ? (
          <>
            <div className="apc-metric-cell">
              <span className="apc-metric-label">
                Standing Timber Value
              </span>
              <span className="apc-metric-val text-white">
                {formatINR(timberPurchaseAmount)}
              </span>
              <span className="apc-metric-hint">
                Commercial Assessment
              </span>
            </div>

            <div className="apc-metric-cell">
              <span className="apc-metric-label">
                Disbursement Ratio
              </span>
              <span className="apc-metric-val text-emerald-400">
                100%
              </span>
              <span className="apc-metric-hint">
                Escrow Direct Payout
              </span>
            </div>

            <div className="apc-metric-cell">
              <span className="apc-metric-label">
                Payout to Landowner
              </span>
              <span className="apc-metric-val text-emerald-300">
                {formatINR(timberPurchaseAmount)}
              </span>
              <span className="apc-metric-hint">
                Guaranteed by Escrow
              </span>
            </div>

            <div className="apc-metric-cell">
              <span className="apc-metric-label">
                Settlement Status
              </span>
              <span className={`apc-metric-val ${isTimberPaid ? 'text-teal-300' : 'text-amber-300'}`}>
                {isTimberPaid ? '✓ Disbursed' : '⏳ Awaiting Deposit'}
              </span>
              <span className="apc-metric-hint">
                {isTimberPaid ? 'Secured in Escrow' : 'Contractor Action'}
              </span>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
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

          {/* PROMINENT ACTION FOR LANDOWNER TO PAY ADVANCE (ONLY FOR HARVEST SERVICE) */}
          {!isTimberPurchase && isLandowner && (paymentStatus === 'ADVANCE_REQUESTED' || paymentStatus === 'PAYMENT_PENDING' || paymentStatus === 'REJECTED') && !isCompleted && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-xs text-slate-200 leading-relaxed block">
                  Mobilization Advance Payable: <strong className="text-emerald-300 font-mono text-base font-black">{formatINR(advanceAmount)}</strong> ({advReq?.advance_percentage || 27}%)
                </span>
                <span className="text-[11px] text-slate-400">
                  Instant authorization via Razorpay Gateway (UPI, Cards &amp; NetBanking) or manual transfer
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTriggerPayment({ mode: 'advance', defaultAmount: advanceAmount, initialTab: 'razorpay' })}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <CreditCard size={14} />
                  <span>Pay {formatINR(advanceAmount)} with Razorpay</span>
                </button>
              </div>
            </div>
          )}

          {/* HARVEST DATE PROPOSAL GATE (TIMBER PURCHASE ONLY) */}
          {isTimberPurchase && !isCompleted && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 shadow-lg ${
              harvestDateApproved
                ? 'bg-emerald-950/50 border-emerald-500/50'
                : proposedHarvestDate
                  ? 'bg-amber-950/40 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-600/50'
            }`}>
              <div className="flex items-center gap-3 flex-wrap justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    harvestDateApproved ? 'bg-emerald-500/20 border border-emerald-500/40' : proposedHarvestDate ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-slate-700/50 border border-slate-600/40'
                  }`}>
                    {harvestDateApproved
                      ? <CalendarCheck size={16} className="text-emerald-400" />
                      : proposedHarvestDate
                        ? <CalendarClock size={16} className="text-amber-400 animate-pulse" />
                        : <Calendar size={16} className="text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-white">
                        Step 1: Agree Harvest Date
                      </span>
                      {harvestDateApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Landowner Approved
                        </span>
                      )}
                      {proposedHarvestDate && !harvestDateApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                          <Clock size={10} /> Awaiting Landowner Approval
                        </span>
                      )}
                      {!proposedHarvestDate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-700/50 text-slate-400 border border-slate-600/40">
                          Required Before Payment
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {harvestDateApproved
                        ? `Confirmed harvest date: ${formatDateDMY(proposedHarvestDate)}${harvestDateApprovedDate ? ` — Approved by landowner` : ''}`
                        : proposedHarvestDate
                          ? `Proposed: ${formatDateDMY(proposedHarvestDate)} — Payment unlocks once landowner approves this date`
                          : 'Contractor must propose a harvest date for landowner approval before payment can proceed.'}
                    </p>
                  </div>
                </div>

                {/* Contractor: propose or update date */}
                {isContractor && !isTimberPaid && (
                  <button
                    type="button"
                    onClick={() => {
                      setHarvestDateInput(proposedHarvestDate || '');
                      setHarvestDateNote('');
                      setShowHarvestDateModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    <Calendar size={13} />
                    <span>{proposedHarvestDate ? 'Change Proposed Date' : 'Propose Harvest Date'}</span>
                  </button>
                )}

                {/* Landowner: approve or decline proposed date */}
                {isLandowner && proposedHarvestDate && !harvestDateApproved && !isTimberPaid && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <span className="text-xs text-amber-200 font-semibold">
                      Proposed: <strong className="text-white font-mono">{formatDateDMY(proposedHarvestDate)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        // Approve harvest date
                        const approvalData = {
                          harvest_date_approved: true,
                          harvest_date_approved_at: new Date().toISOString()
                        };
                        const stored = localStorage.getItem('treeconnect_harvest_requests');
                        if (stored) {
                          try {
                            const parsed = JSON.parse(stored);
                            const reqId = request?.id || request?._id;
                            const updated = parsed.map(r => {
                              if ((r.id || r._id) === reqId) return { ...r, ...approvalData };
                              return r;
                            });
                            localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
                            window.location.reload();
                          } catch (e) {}
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve Date</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const stored = localStorage.getItem('treeconnect_harvest_requests');
                        if (stored) {
                          try {
                            const parsed = JSON.parse(stored);
                            const reqId = request?.id || request?._id;
                            const updated = parsed.map(r => {
                              if ((r.id || r._id) === reqId) return { ...r, proposed_harvest_date: null, harvest_date_proposed_at: null };
                              return r;
                            });
                            localStorage.setItem('treeconnect_harvest_requests', JSON.stringify(updated));
                            window.location.reload();
                          } catch (e) {}
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <XCircle size={13} />
                      <span>Suggest Another</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Lock message if date not approved */}
              {!harvestDateApproved && !isTimberPaid && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-slate-700/50 text-xs text-slate-400">
                  <AlertCircle size={13} className="text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-amber-300">Payment locked</strong> — The timber purchase payment can only proceed after the landowner approves the proposed harvest date above.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TIMBER PURCHASE: CONTRACTOR OBLIGATION TO PAY LANDOWNER */}
          {isTimberPurchase && !isCompleted && (
            <div className={`p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-emerald-950/60 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all ${
              canProceedToPayment ? 'border-emerald-500/40' : 'border-slate-700/40 opacity-60 pointer-events-none'
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-white">Step 2: Pay Purchase Amount</span>
                  {!canProceedToPayment && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-400 border border-slate-600/40 flex items-center gap-1">
                      🔒 Locked
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-200 leading-relaxed block">
                  Full Tree Purchase Amount: <strong className="text-emerald-300 font-mono text-base font-black">{formatINR(timberPurchaseAmount)}</strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  {isLandowner
                    ? (isTimberPaid
                      ? '✓ Payout secured in TreeConnect Escrow. Authorized for felling operations.'
                      : `Awaiting contractor ${request?.assigned_contractor_name || 'buyer'} to deposit full purchase amount before timber extraction.`)
                    : (isTimberPaid
                      ? '✓ Full timber purchase amount deposited and secured in Escrow.'
                      : `You must pay ${formatINR(timberPurchaseAmount)} to landowner's escrow before starting harvest. This is the agreed tree purchase price, not an advance.`)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {isContractor && !isTimberPaid && (
                  <button
                    type="button"
                    disabled={!canProceedToPayment}
                    onClick={() => canProceedToPayment && handleTriggerPayment({ mode: 'timber_purchase', defaultAmount: timberPurchaseAmount, initialTab: 'razorpay' })}
                    title={!canProceedToPayment ? 'Harvest date must be approved by landowner first' : `Pay ${formatINR(timberPurchaseAmount)} to landowner escrow`}
                    className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition-all ${
                      canProceedToPayment
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 cursor-pointer'
                        : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <CreditCard size={14} />
                    <span>Pay Tree Purchase ({formatINR(timberPurchaseAmount)})</span>
                  </button>
                )}
                {isTimberPaid && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Purchase Payment Secured in Escrow</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* HARVEST DATE PROPOSAL MODAL */}
          {showHarvestDateModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-[#0a1a0f] border border-emerald-500/40 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Propose Harvest Date</h3>
                    <p className="text-xs text-slate-400">Landowner will approve or suggest another date before payment unlocks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHarvestDateModal(false)}
                    className="ml-auto p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                <form onSubmit={handleProposeDateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Proposed Harvest Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={harvestDateInput}
                      onChange={e => setHarvestDateInput(e.target.value)}
                      min={new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Select the date you plan to begin harvesting operations on the landowner's property</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Note to Landowner <span className="text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      value={harvestDateNote}
                      onChange={e => setHarvestDateNote(e.target.value)}
                      rows={2}
                      placeholder="e.g. Crew will arrive by 8 AM. Please ensure property gate is accessible."
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                    <AlertCircle size={14} className="text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-200 leading-relaxed">
                      After you submit this date, the landowner must approve it before the tree purchase payment is unlocked.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-emerald-500/15">
                    <button
                      type="button"
                      onClick={() => setShowHarvestDateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!harvestDateInput}
                      className={`px-5 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg ${
                        harvestDateInput
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 cursor-pointer'
                          : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Send size={13} />
                      <span>Send to Landowner for Approval</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PROMINENT ACTION FOR LANDOWNER TO PAY POST-HARVEST FINAL SETTLEMENT */}
          {isLandowner && (isCompleted || verifiedCount === 4) && remainingBalance > 0 && !isFinalPending && !isFullyPaid && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#031d0d] via-[#063319] to-[#031d0d] border border-emerald-400/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-sm">
                    <Sparkles size={11} /> Post-Harvest Settlement Due
                  </span>
                  <span className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-400" /> Operations Complete • All 4 Milestones Certified
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">
                  Pending Balance Payable to Contractor: <span className="text-amber-300 font-mono font-black">{formatINR(remainingBalance)}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Harvesting operations have concluded successfully. Mobilization advance of {formatINR(verifiedPaid)} was credited. Please settle the remaining balance of {formatINR(remainingBalance)} to complete and close the contract.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTriggerPayment({ mode: 'final', defaultAmount: remainingBalance, initialTab: 'razorpay' })}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <CreditCard size={15} />
                  <span>Pay {formatINR(remainingBalance)} with Razorpay</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerPayment({ mode: 'final', defaultAmount: remainingBalance, initialTab: 'manual' })}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Building2 size={14} className="text-slate-400" />
                  <span>Manual Transfer</span>
                </button>
              </div>
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
                Transaction verified by <strong>{request?.assigned_contractor_name || request?.contractor_name || 'Contractor'}</strong>. Mobilization advance from <strong>{request?.ownerName || request?.owner_name || request?.landownerName || 'Landowner'}</strong> credited to this harvesting service job.
                {latestPayment?.transaction_reference && (
                  <span className="block mt-1.5 text-[11px] text-emerald-200 bg-emerald-950/30 p-1.5 rounded border border-emerald-500/20 w-fit">
                    Ref ID / UTR: <strong className="font-mono">{latestPayment.transaction_reference}</strong>
                    {latestPayment.payment_method ? ` via ${latestPayment.payment_method}` : ''}
                  </span>
                )}
                <span className="block mt-1.5">Remaining balance of <strong className="text-white font-mono">{formatINR(remainingBalance)}</strong> will be settled as agreed upon operation progress/completion.</span>
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
                  {!request?.digital_agreement && paymentStatus !== 'VERIFICATION_PENDING' && paymentStatus !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={onRequestAdvance}
                      className="cd-btn-inspect-primary cursor-pointer shadow-md"
                    >
                      <CreditCard size={13} />
                      <span>{advReq && paymentStatus !== 'NOT_REQUESTED' ? 'Update Advance Terms' : 'Set Advance Amount'}</span>
                    </button>
                  )}
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
        <div className="apc-alert-box apc-alert-progress flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-blue-200 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
            <div>
              <span className="block">Harvesting Operations In Progress</span>
              <span className="text-[11px] text-blue-300 font-normal">
                {request?.current_harvest_stage ? `Current: Stage ${request.current_harvest_stage.replace('stage_', '')} of 4` : 'Milestone visual verification active'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenStages && (
              <button
                type="button"
                onClick={onOpenStages}
                className="cd-btn-inspect-primary bg-emerald-600/90 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-400/30"
              >
                <Camera size={14} />
                <span>{isContractor ? 'Stage Photo / Video Tracker' : 'View Stage Evidence Feed'}</span>
              </button>
            )}
            {isContractor && (
              <button
                type="button"
                onClick={() => navigate('/contractor/harvest-operations')}
                className="cd-btn-inspect-primary bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-md text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-400/30"
              >
                <Truck size={14} />
                <span>Harvest Operations</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* HARVEST OPERATION COMPLETED STATUS */}
      {isCompleted && (
        <div className="apc-alert-box apc-alert-verified bg-emerald-950/70 border border-emerald-400/70 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-emerald-200 font-bold">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div>
              <span className="block text-white font-extrabold text-sm flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                Harvesting Operation Successfully Completed!
              </span>
              <span className="text-[11px] text-emerald-300 font-medium">
                All 4 milestones verified &amp; certified by landowner. Tree felling, delimbing, bucking &amp; transit scaling finalized.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onOpenStages && (
              <button
                type="button"
                onClick={onOpenStages}
                className="cd-btn-inspect-primary bg-emerald-700/80 hover:bg-emerald-600 text-white shrink-0 cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-400/30"
              >
                <Camera size={14} />
                <span>View Certified Milestones</span>
              </button>
            )}
            {isContractor && (
              <button
                type="button"
                onClick={() => navigate('/contractor/harvest-operations')}
                className="cd-btn-inspect-primary bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 cursor-pointer shadow-md text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-emerald-400/30"
              >
                <Truck size={14} />
                <span>Harvest Operations</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* POST-HARVEST FINAL CONTRACT SETTLEMENT */}
      {isCompleted && (
        <div className="space-y-3">
          {isFullyPaid ? (
            <div className="apc-alert-box apc-alert-verified bg-gradient-to-r from-[#03200f] via-[#063318] to-[#03200f] border border-emerald-400 shadow-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-lg shadow-emerald-500/20">
                  <Sparkles size={24} className="text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-sm">
                      <CheckCircle2 size={12} /> 100% Contract Cleared
                    </span>
                    <span className="text-xs text-emerald-300 font-bold">
                      Zero Balance Outstanding (₹ 0)
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white mt-1">
                    Contract 100% Fully Settled &amp; Closed
                  </h4>
                  <p className="text-xs text-emerald-200/90 mt-0.5 leading-relaxed">
                    All 4 harvesting milestones and the complete contract value of <strong className="text-white font-mono">{formatINR(acceptedQuotation)}</strong> have been certified and settled with contractor <strong className="text-white">{request?.assigned_contractor_name || 'Rohith Kumar'}</strong>.
                  </p>
                </div>
              </div>

              <div className="shrink-0 hidden sm:block">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
                  ✓ Closed &amp; Archived
                </span>
              </div>
            </div>
          ) : remainingBalance > 0 && (
            <div>
              {/* PENDING VERIFICATION STATE */}
              {isFinalPending && (
                <div className="apc-alert-box apc-alert-pending border border-amber-500/50 bg-[#140e02] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Clock size={22} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div className="min-w-0">
                      <strong className="text-xs sm:text-sm font-black text-amber-300 block">
                        Final Settlement Payment Submitted — Verification Pending
                      </strong>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        Amount: <strong className="text-white font-mono">{formatINR(pendingFinalPayment?.amount || remainingBalance)}</strong> {pendingFinalPayment?.payment_method ? `via ${pendingFinalPayment.payment_method}` : ''} • Ref ID / UTR: <strong className="text-amber-200 font-mono">{pendingFinalPayment?.transaction_reference || 'Recorded by Landowner'}</strong>.
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">
                        {isContractor
                          ? 'Please reconcile this transaction with your bank statement to close the contract.'
                          : 'Awaiting contractor verification. Once approved, your harvesting contract will be closed as 100% fully settled.'}
                      </p>
                    </div>
                  </div>

                  {isContractor && (
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => onRejectPayment(pendingFinalPayment || {})}
                        className="cd-btn-inspect-secondary text-red-300 border-red-500/35 hover:border-red-500/60 hover:bg-red-950/60 cursor-pointer text-xs"
                      >
                        <XCircle size={13} />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onVerifyPayment(pendingFinalPayment || {})}
                        className="cd-btn-inspect-primary cursor-pointer shadow-md text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                      >
                        <CheckCircle2 size={13} />
                        <span>Verify &amp; Close Contract</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* REJECTED STATE */}
              {isFinalRejected && (
                <div className="apc-alert-box apc-alert-rejected flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <strong className="text-xs sm:text-sm font-black text-red-300 block">
                        Final Settlement Payment Verification Rejected by Contractor
                      </strong>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                        Reason: <em className="text-red-200 font-semibold">"{request?.rejection_reason || pendingFinalPayment?.rejection_reason || 'Transaction could not be reconciled with bank statement.'}"</em>
                      </p>
                    </div>
                  </div>

                  {isLandowner && (
                    <button
                      type="button"
                      onClick={() => onRecordPayment && onRecordPayment({ mode: 'final', defaultAmount: remainingBalance })}
                      className="cd-btn-inspect-primary shrink-0 cursor-pointer text-xs"
                    >
                      <RotateCcw size={13} />
                      <span>Resubmit Final Settlement</span>
                    </button>
                  )}
                </div>
              )}

              {/* AWAITING SETTLEMENT (LANDOWNER NEEDS TO PAY REMAINING BALANCE) */}
              {!isFinalPending && !isFinalRejected && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#031d0d] via-[#052914] to-[#031d0d] border border-emerald-500/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                        Post-Harvest Settlement Due
                      </span>
                      <span className="text-xs text-emerald-300 font-semibold">
                        Operations Complete • Final Clearance
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white">
                      Pending Balance Payable to Contractor: <span className="text-amber-300 font-mono font-black">{formatINR(remainingBalance)}</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                      {isLandowner
                        ? `Harvesting operations have concluded successfully. Mobilization advance of ${formatINR(verifiedPaid)} was credited. Please settle the remaining balance of ${formatINR(remainingBalance)} to complete and close the contract.`
                        : `All 4 milestones certified. Remaining balance of ${formatINR(remainingBalance)} is payable post-harvest by landowner ${request?.ownerName || request?.landownerName || 'Landowner'}.`}
                    </p>
                  </div>

                  {!isTimberPurchase && isLandowner && (
                    <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleTriggerPayment({ mode: 'final', defaultAmount: remainingBalance, initialTab: 'razorpay' })}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                      >
                        <CreditCard size={16} />
                        <span>Pay {formatINR(remainingBalance)} with Razorpay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerPayment({ mode: 'final', defaultAmount: remainingBalance, initialTab: 'manual' })}
                        className="px-4 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Building2 size={15} className="text-slate-400" />
                        <span>Manual Transfer</span>
                      </button>
                    </div>
                  )}

                  {!isLandowner && (
                    <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                      <Clock size={15} className="text-amber-400 shrink-0" />
                      <span>Awaiting Landowner Harigovind D Nair to settle {formatINR(remainingBalance)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
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

      {/* INTERNAL RECORD PAYMENT MODAL (FALLBACK WHEN ONRECORDPAYMENT NOT PASSED EXTERNALLY) */}
      {internalPaymentModal && (
        <RecordAdvancePaymentModal
          request={internalPaymentModal.req || request}
          mode={internalPaymentModal.mode}
          defaultAmount={internalPaymentModal.defaultAmount}
          initialTab={internalPaymentModal.initialTab || 'razorpay'}
          onClose={() => setInternalPaymentModal(null)}
          onSubmit={async (data) => {
            setInternalPaymentModal(null);
            window.location.reload();
          }}
          onPaymentSuccess={() => {
            setInternalPaymentModal(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default AdvancePaymentCard;
