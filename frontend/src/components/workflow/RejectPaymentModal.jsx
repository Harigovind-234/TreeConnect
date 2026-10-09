import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  XCircle,
  Ban
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import './DigitalAgreementModal.css';

const RejectPaymentModal = ({ payment, onClose, onConfirm }) => {
  const [reason, setReason] = useState('Transaction reference not found in bank statement.');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const REASONS = [
    'Transaction reference not found in bank statement.',
    'Incorrect or partial amount received.',
    'Transaction reference / UTR is invalid.',
    'Payment transferred to incorrect account number.',
    'Funds pending clearance or failed at bank.'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please specify a rejection reason for the landowner.');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reject payment.');
      setSubmitting(false);
    }
  };

  return (
    <div className="digital-agr-overlay">
      <div className="digital-agr-modal max-w-lg">
        <div className="digital-agr-header border-b border-red-500/25">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <Ban size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Reject Payment Submission
              </h3>
              <p className="text-xs text-slate-300">
                Payment Ref: {payment?.transaction_reference || 'N/A'} • {formatINR(payment?.amount || 0)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
              {errorMsg}
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed">
            Specify why this payment cannot be verified. The landowner will be notified with this reason and prompted to correct their submission.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Common Reasons
            </label>
            <div className="flex flex-col gap-1.5">
              {REASONS.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`text-left text-xs px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                    reason === r
                      ? 'bg-red-950/60 border-red-500/50 text-white font-bold'
                      : 'bg-[#06140b] border-emerald-500/20 text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Detailed Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Explain why the payment could not be verified..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07190d] border border-red-500/30 text-white text-xs focus:outline-none focus:border-red-400"
            />
          </div>

          <div className="pt-3 border-t border-red-500/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <XCircle size={15} />
              <span>{submitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectPaymentModal;
