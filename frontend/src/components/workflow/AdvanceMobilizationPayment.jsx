import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Loader2,
  AlertCircle,
  QrCode,
  Building2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import { useRazorpayCheckout, PAYMENT_STATES } from '../../hooks/useRazorpayCheckout';
import PaymentStatus from './PaymentStatus';

export const AdvanceMobilizationPayment = ({
  request,
  user,
  mode,
  isFinal: isFinalProp,
  defaultAmount,
  onPaymentSuccess,
  onPaymentError,
  renderManualFallback
}) => {
  const [showManualTransfer, setShowManualTransfer] = useState(false);
  const {
    paymentState,
    errorMessage,
    activePayment,
    isLoading,
    isVerifying,
    isSuccess,
    startCheckout,
    resetPaymentState
  } = useRazorpayCheckout();

  const reqId = request?.id || request?._id;
  const advReq = request?.advance_payment_request || request?.assessment?.advance_payment_request || {};
  
  // Dynamic payment calculations from accepted quotation
  const acceptedQuotation = Number(
    advReq?.accepted_quotation ||
    request?.total_quotation_amount ||
    request?.total_quote ||
    request?.assessment?.total_quote ||
    104500
  );
  
  const advancePercentage = Number(
    advReq?.advance_percentage ||
    request?.advance_percentage ||
    27
  );

  const advanceAmount = Number(
    advReq?.advance_amount ||
    request?.advance_amount ||
    roundAmount(acceptedQuotation * (advancePercentage / 100))
  );

  function roundAmount(val) {
    return Math.round(val);
  }

  const isAdvanceVerified = Boolean(
    request?.is_advance_verified ||
    request?.advance_payment_status === 'VERIFIED'
  );

  const remainingBalance = Number(
    request?.remaining_balance !== undefined && request?.remaining_balance !== null
      ? request.remaining_balance
      : defaultAmount !== undefined && defaultAmount !== null
        ? defaultAmount
        : Math.max(0, acceptedQuotation - (request?.total_verified_paid || advanceAmount))
  );

  const isTimberPurchase = Boolean(
    mode === 'timber_purchase' ||
    request?.commercial_proposal_type === 'Timber Purchase Offer' ||
    request?.assessment?.commercial_proposal_type === 'Timber Purchase Offer' ||
    Boolean(request?.contractor_purchase_offer) ||
    Boolean(request?.assessment?.contractor_purchase_offer) ||
    request?.site_inspection?.landowner_preferred_arrangement === 'INTERESTED_IN_TIMBER_SALE'
  );

  const purchaseOffer = Number(
    request?.contractor_purchase_offer ||
    request?.assessment?.contractor_purchase_offer ||
    defaultAmount ||
    220000
  );

  const isFinal = Boolean(
    isFinalProp ||
    mode === 'final' ||
    (isAdvanceVerified && remainingBalance > 0)
  );

  const payableAmount = isTimberPurchase
    ? Number(defaultAmount || purchaseOffer || 220000)
    : isFinal
      ? Number(defaultAmount || remainingBalance || 44900)
      : Number(defaultAmount || advanceAmount);

  const isVerified = isFinal
    ? Boolean(request?.is_fully_paid || request?.final_payment_status === 'VERIFIED' || (remainingBalance <= 0 && !defaultAmount) || isSuccess)
    : Boolean(isAdvanceVerified || isSuccess);

  const handlePayClick = () => {
    if (isLoading || isVerified) return;

    startCheckout({
      requestId: reqId,
      harvestRequest: request,
      user,
      payableAmount,
      isFinal,
      isTimberPurchase,
      paymentPurpose: isTimberPurchase ? 'TIMBER_PURCHASE_PAYOUT' : (isFinal ? 'FINAL_PAYMENT' : 'ADVANCE_MOBILIZATION'),
      onSuccess: (result) => {
        if (onPaymentSuccess) onPaymentSuccess(result);
      },
      onFailure: (err) => {
        if (onPaymentError) onPaymentError(err);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Primary Payment Summary Card */}
      <div className="rapm-summary-card">
        {/* Header Row */}
        <div className="rapm-ref-row">
          <div>
            <span className="rapm-ref-label">
              Harvest Request Reference
            </span>
            <strong className="rapm-ref-val">
              {request?.propertyName || `TC-HR-${String(reqId || '').slice(-6).toUpperCase() || 'PLOT-01'}`}
            </strong>
          </div>

          <div className="text-right">
            <span className="rapm-ref-label">
              Payment Purpose
            </span>
            <span className="rapm-purpose-pill">
              <Sparkles size={12} />
              {isTimberPurchase ? 'Timber Purchase Settlement' : (isFinal ? 'Final Contract Settlement' : `Mobilization Advance (${advancePercentage}%)`)}
            </span>
          </div>
        </div>

        {/* Quotation & Amount Grid */}
        <div className="rapm-amounts-grid">
          <div className="rapm-amount-box">
            <span className="rapm-amount-title">
              {isTimberPurchase ? 'Agreed Standing Timber Value' : 'Accepted Total Contract Value'}
            </span>
            <strong className="rapm-amount-figure">
              {formatINR(isTimberPurchase ? payableAmount : acceptedQuotation)}
            </strong>
            <span className="rapm-amount-desc">
              {isTimberPurchase
                ? 'Full commercial purchase price for timber'
                : isFinal
                  ? `Advance credited: ${formatINR(request?.total_verified_paid || advanceAmount)}`
                  : 'Agreed harvesting contract value'}
            </span>
          </div>

          <div className="rapm-amount-box rapm-amount-box-highlight">
            <div className="flex items-center justify-between">
              <span className="rapm-amount-title text-emerald-400">
                {isTimberPurchase ? 'Timber Purchase Payout to Landowner' : (isFinal ? 'Remaining Balance Payable' : 'Advance Amount Payable')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                INR
              </span>
            </div>
            <strong className="rapm-amount-figure">
              {formatINR(payableAmount)}
            </strong>
            <span className="rapm-amount-desc">
              {isTimberPurchase
                ? '100% full timber payout • Released via escrow'
                : (isFinal ? 'Due post-harvest completion' : `${advancePercentage}% mobilization deposit`)}
            </span>
          </div>
        </div>

        {/* Payment Status Component */}
        {paymentState !== PAYMENT_STATES.IDLE && (
          <PaymentStatus
            status={paymentState}
            amount={payableAmount}
            referenceId={activePayment?.razorpay_payment_id || activePayment?.order_id}
            errorMessage={errorMessage}
            onRetry={resetPaymentState}
          />
        )}

        {/* 2. Prominent Razorpay CTA Button */}
        {!isVerified && paymentState !== PAYMENT_STATES.VERIFIED && (
          <div className="pt-1 space-y-2.5">
            <button
              type="button"
              onClick={handlePayClick}
              disabled={isLoading}
              className="rapm-primary-btn disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-slate-950" />
                  <span>
                    {isVerifying ? 'Verifying Escrow Gateway...' : 'Connecting to Gateway...'}
                  </span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>
                    {isTimberPurchase
                      ? `Disburse Escrow Payout (${formatINR(payableAmount)})`
                      : `Pay ${formatINR(payableAmount)} with Razorpay`}
                  </span>
                  <Lock size={15} className="text-slate-800 ml-1 opacity-70" />
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div className="rapm-trust-bar">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck size={13} /> {isTimberPurchase ? '100% Escrow Protected' : 'Secured by Razorpay'}
              </span>
              <span>•</span>
              <span>{isTimberPurchase ? 'Instant UPI / Bank Credit' : 'UPI (GPay / PhonePe / Paytm)'}</span>
              <span>•</span>
              <span>{isTimberPurchase ? 'Zero Platform Fee' : 'Cards & NetBanking'}</span>
            </div>
          </div>
        )}

        {/* Already Verified Banner */}
        {isVerified && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>
              <strong>{isTimberPurchase ? 'Timber Purchase Settlement Completed' : (isFinal ? 'Final Contract Settlement Completed' : 'Advance Mobilization Completed')}</strong> — Funds verified and credited to this harvest operation.
            </span>
          </div>
        )}
      </div>

      {/* 3. Fallback Manual Transfer Option (Separately Labeled) */}
      {renderManualFallback && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowManualTransfer(!showManualTransfer)}
            className="w-full p-4 flex items-center justify-between text-left text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Building2 size={16} className="text-slate-500" />
              <div>
                <span className="text-xs font-bold text-slate-300 block">
                  Manual Bank Transfer / UPI Receipt (Fallback Method)
                </span>
                <span className="text-[11px] text-slate-500">
                  Use only if online gateway is unavailable; requires manual contractor verification
                </span>
              </div>
            </div>
            {showManualTransfer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showManualTransfer && (
            <div className="p-4 pt-1 border-t border-slate-800/80">
              {renderManualFallback()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvanceMobilizationPayment;
