import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';

export const PaymentStatus = ({
  status,
  amount,
  referenceId,
  verifiedAt,
  errorMessage,
  onRetry,
  className = ''
}) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <div className={`p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <strong className="text-sm font-bold text-white">
                  Payment Verified Successfully
                </strong>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  Instant Verification
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Advance mobilization payment of <strong className="text-white font-mono">{amount ? formatINR(amount) : '₹28,215'}</strong> has been verified via Razorpay gateway. Pre-harvest authorization is now complete.
              </p>
              {referenceId && (
                <span className="inline-block text-[11px] font-mono text-slate-400 mt-1">
                  Gateway Ref: {referenceId}
                </span>
              )}
            </div>
          </div>
        </div>
      );

    case 'VERIFYING':
      return (
        <div className={`p-4 rounded-2xl bg-teal-950/40 border border-teal-500/40 text-teal-200 ${className}`}>
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-teal-400 shrink-0" />
            <div>
              <strong className="text-sm font-bold text-white block">
                Verifying Payment with Razorpay...
              </strong>
              <p className="text-xs text-slate-300 mt-0.5">
                Cryptographically verifying checkout signature and payment capture with the gateway.
              </p>
            </div>
          </div>
        </div>
      );

    case 'PENDING_CONFIRMATION':
    case 'VERIFICATION_PENDING':
      return (
        <div className={`p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 ${className}`}>
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong className="text-sm font-bold text-amber-300 block">
                Payment Confirmation Pending
              </strong>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Payment processing is underway with the bank. Status will automatically update once verified.
              </p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Refresh Status</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );

    case 'FAILED':
      const isAuthError = errorMessage && (
        errorMessage.includes('Authentication') ||
        errorMessage.includes('RAZORPAY_KEY_SECRET') ||
        errorMessage.includes('your_test_key_secret')
      );

      return (
        <div className={`p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 ${className}`}>
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-sm font-bold text-red-300 block">
                {isAuthError ? 'Razorpay Gateway Setup Required' : 'Payment Failed or Rejected'}
              </strong>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {errorMessage || 'The transaction could not be completed by the payment gateway.'}
              </p>

              {isAuthError && (
                <div className="mt-3 p-3 rounded-xl bg-black/50 border border-amber-500/30 text-amber-200 text-[11.5px] space-y-1.5 leading-relaxed">
                  <strong className="text-amber-300 block font-bold">
                    How to fix this:
                  </strong>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>Log into your <strong>Razorpay Dashboard</strong> (in Test Mode).</li>
                    <li>Go to <strong>Account &amp; Settings &rarr; API Keys</strong>.</li>
                    <li>Generate or copy your <strong>Key Secret</strong> for Key ID <code className="text-emerald-300 bg-black/60 px-1 py-0.5 rounded font-mono text-[11px]">{import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Fur0pLo5d2MztK'}</code>.</li>
                    <li>Replace <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded font-mono text-[11px]">your_test_key_secret</code> in <code className="text-white font-mono text-[11px]">backend/.env</code> with your actual Secret.</li>
                  </ol>
                  <p className="text-[11px] text-slate-400 pt-1">
                    <em>Tip:</em> To test the rest of the harvesting workflow right now without a live Razorpay account, click the <strong>Manual Transfer (Fallback)</strong> tab above.
                  </p>
                </div>
              )}

              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );

    case 'CANCELLED':
      return (
        <div className={`p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-slate-300 ${className}`}>
          <div className="flex items-center gap-2.5 text-xs">
            <AlertCircle size={16} className="text-slate-400 shrink-0" />
            <span>
              Checkout window was dismissed. No payment was charged. You can click <strong>Pay with Razorpay</strong> whenever you are ready.
            </span>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default PaymentStatus;
