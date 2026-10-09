import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Upload,
  FileCheck,
  Check,
  Copy,
  QrCode,
  HelpCircle,
  FileText,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import './DigitalAgreementModal.css';

const RecordAdvancePaymentModal = ({ request, onClose, onSubmit }) => {
  const [copiedField, setCopiedField] = useState(null);

  const advReq = request?.advance_payment_request || {};
  const requestedAmount = Number(advReq?.advance_amount || 29700);
  const acceptedQuotation = Number(advReq?.accepted_quotation || request?.total_quotation_amount || 99000);

  const upiId = advReq?.upi_id ||
    advReq?.payment_instructions?.match(/UPI\s*(?:ID)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    'treeconnect.contractor@okhdfcbank';

  const bankName = advReq?.bank_name ||
    advReq?.payment_instructions?.match(/Bank\s*(?:Name)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    'HDFC Bank Ltd, Kottayam';

  const acNo = advReq?.bank_account_number ||
    advReq?.payment_instructions?.match(/A\/C\s*(?:No)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    '50200084920194';

  const ifscCode = advReq?.ifsc_code ||
    advReq?.payment_instructions?.match(/IFSC\s*(?:Code)?\s*:\s*([^\n\r,;/]+)/i)?.[1]?.trim() ||
    'HDFC0001234';

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountPaid, setAmountPaid] = useState(requestedAmount);
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Receipt file size must be less than 5MB.');
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setErrorMsg('Transaction reference ID or UTR number is mandatory for payment verification.');
      return;
    }
    if (!amountPaid || Number(amountPaid) <= 0) {
      setErrorMsg('Amount paid must be greater than zero.');
      return;
    }
    if (!paymentDate) {
      setErrorMsg('Please enter the date the payment was completed.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmit({
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim(),
        payment_date: paymentDate,
        amount: Number(amountPaid),
        receipt_url: receiptUrl || '',
        notes: notes.trim()
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit payment details.');
      setSubmitting(false);
    }
  };

  return (
    <div className="digital-agr-overlay">
      <div className="digital-agr-modal max-w-2xl">
        {/* Header */}
        <div className="digital-agr-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                Record Advance Mobilization Payment
              </h3>
              <p className="text-xs text-slate-300">
                Contractor: <strong className="text-white font-semibold">{request?.assigned_contractor_name || 'Assigned Contractor'}</strong>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Request Context Card */}
          <div className="p-4 rounded-2xl bg-[#030e06] border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Accepted Job Quotation
                </span>
                <strong className="text-sm font-bold text-slate-200 font-mono">
                  {formatINR(acceptedQuotation)}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Agreed Advance ({advReq?.advance_percentage || 30}%)
                </span>
                <strong className="text-lg font-black text-emerald-400 font-mono">
                  {formatINR(requestedAmount)}
                </strong>
              </div>
            </div>

            {/* Contractor Payment Transfer Details with Copy Buttons */}
            <div className="space-y-2 pt-1">
              <span className="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 size={13} /> Contractor Payment Account &amp; Transfer Details:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* UPI Box */}
                <div className="p-2.5 rounded-xl bg-[#07190d] border border-emerald-500/25 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <QrCode size={11} /> UPI ID
                    </span>
                    <span>App Transfer</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 p-1.5 rounded bg-black/40 border border-emerald-500/20">
                    <span className="font-mono text-xs font-bold text-emerald-200 select-all truncate">
                      {upiId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiId, 'upi')}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                    >
                      {copiedField === 'upi' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Bank Account Box */}
                <div className="p-2.5 rounded-xl bg-[#07190d] border border-emerald-500/25 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <Building2 size={11} /> Bank A/C
                    </span>
                    <span className="truncate">{bankName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 p-1.5 rounded bg-black/40 border border-emerald-500/20 text-[11px]">
                    <span className="font-mono text-white font-bold truncate">
                      A/C: {acNo} • {ifscCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(acNo, 'ac')}
                      className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                    >
                      {copiedField === 'ac' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      <span>{copiedField === 'ac' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07190d] border border-emerald-500/30 text-white text-xs font-bold focus:outline-none focus:border-emerald-400"
                >
                  <option value="UPI">UPI Transfer (GPay / PhonePe / Paytm / BHIM)</option>
                  <option value="Bank Transfer (NEFT/RTGS/IMPS)">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Cheque">Bank Cheque / DD</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07190d] border border-emerald-500/30 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Transaction / UTR Reference ID *
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI/602938472910 or UTR102948290"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07190d] border border-emerald-500/30 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-emerald-400" />
                  Date of Payment
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#07190d] border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Optional Receipt Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Upload size={13} className="text-emerald-400" />
                Attach Bank / UPI Receipt Screenshot (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-2.5 rounded-xl bg-[#07190d] hover:bg-[#0a2313] border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow">
                  <Upload size={14} />
                  <span>Choose Receipt File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {receiptFileName && (
                  <span className="text-xs text-slate-300 truncate max-w-xs flex items-center gap-1.5 font-medium">
                    <Check size={14} className="text-emerald-400" /> {receiptFileName}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Notes for Contractor (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Transferred via Google Pay from HDFC account."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07190d] border border-emerald-500/30 text-white text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* CRITICAL NOTICE: Explains manual verification */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <AlertCircle size={17} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block font-bold text-amber-300 mb-0.5">
                Manual Verification Required
              </strong>
              Submitting payment details records the transaction for contractor verification. It does not automatically confirm receipt of funds. The contractor will verify this transaction against their bank statement before harvesting work can commence.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <FileCheck size={15} />
              <span>{submitting ? 'Recording Payment...' : 'Submit Payment Details for Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordAdvancePaymentModal;
