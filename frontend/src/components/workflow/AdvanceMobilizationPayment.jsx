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

  const isVerified = Boolean(
    request?.is_advance_verified ||
    request?.advance_payment_status === 'VERIFIED' ||
    isSuccess
  );

  const handlePayClick = () => {
    if (isLoading || isVerified) return;

    startCheckout({
      requestId: reqId,
      harvestRequest: request,
      user,
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
      <div className="p-5 rounded-2xl bg-[#030e06] border border-emerald-500/35 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-emerald-500/20">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Harvest Request Reference
              </span>
              <strong className="text-sm font-mono text-white font-bold">
                {request?.propertyName || `TC-HR-${String(reqId || '').slice(-6).toUpperCase() || 'PLOT-01'}`}
              </strong>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                Payment Purpose
              </span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1 justify-end">
                <Sparkles size={12} className="text-emerald-400" /> Mobilization Advance ({advancePercentage}%)
              </span>
            </div>
          </div>

          {/* Quotation & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/20">
              <span className="text-[11px] font-medium text-slate-400 block mb-0.5">
                Accepted Contractor Quotation
              </span>
              <strong className="text-base font-bold text-slate-200 font-mono">
                {formatINR(acceptedQuotation)}
              </strong>
              <span className="text-[10.5px] text-slate-400 block mt-0.5">
                Agreed total harvesting contract
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/60 to-[#041a0c] border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Advance Amount Payable
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  INR
                </span>
              </div>
              <strong className="text-2xl font-black text-emerald-300 font-mono block my-0.5">
                {formatINR(advanceAmount)}
              </strong>
              <span className="text-[10.5px] text-emerald-400/80 font-medium">
                {advancePercentage}% mobilization deposit
              </span>
            </div>
          </div>

          {/* Payment Status Component */}
          {paymentState !== PAYMENT_STATES.IDLE && (
            <PaymentStatus
              status={paymentState}
              amount={advanceAmount}
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
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={19} className="animate-spin text-slate-950" />
                    <span>
                      {isVerifying ? 'Verifying with Razorpay...' : 'Connecting to Gateway...'}
                    </span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                    <span>Pay {formatINR(advanceAmount)} with Razorpay</span>
                    <Lock size={16} className="text-slate-800 ml-1 opacity-70" />
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-3 flex-wrap text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck size={13} /> Secured by Razorpay
                </span>
                <span>•</span>
                <span>UPI (GPay / PhonePe / Paytm)</span>
                <span>•</span>
                <span>Cards &amp; NetBanking</span>
              </div>
            </div>
          )}

          {/* Already Verified Banner */}
          {isVerified && (
            <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>
                <strong>Advance Mobilization Completed</strong> — Funds verified and credited to this harvest operation.
              </span>
            </div>
          )}
        </div>
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
