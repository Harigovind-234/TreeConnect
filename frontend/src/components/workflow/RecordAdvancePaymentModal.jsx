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
  ShieldCheck,
  Zap
} from 'lucide-react';
import { formatINR } from '../../utils/timberCalculations';
import { useAuth } from '../../context/AuthContext';
import AdvanceMobilizationPayment from './AdvanceMobilizationPayment';
import './RecordAdvancePaymentModal.css';
import './DigitalAgreementModal.css';

const RecordAdvancePaymentModal = ({ request, onClose, onSubmit, onPaymentSuccess, mode, defaultAmount, initialTab = 'razorpay' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'razorpay' | 'manual'
  const [copiedField, setCopiedField] = useState(null);

  const advReq = request?.advance_payment_request || request?.assessment?.advance_payment_request || {};
  const acceptedQuotation = Number(
    advReq?.accepted_quotation ||
    request?.total_quotation_amount ||
    request?.total_quote ||
    request?.assessment?.total_quote ||
    104500
  );

  const advanceAmount = Number(
    advReq?.advance_amount ||
    request?.advance_amount ||
    Math.round((acceptedQuotation * (advReq?.advance_percentage || 30)) / 100)
  );

  const isAdvanceVerified = Boolean(
    request?.is_advance_verified ||
    request?.advance_payment_status === 'VERIFIED'
  );

  const verifiedPaid = Number(
    request?.total_verified_paid ||
    (isAdvanceVerified ? advanceAmount : 0)
  );

  const remainingBalance = Number(
    request?.remaining_balance !== undefined && request?.remaining_balance !== null
      ? request.remaining_balance
      : Math.max(0, acceptedQuotation - verifiedPaid)
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
    mode === 'final' ||
    (isAdvanceVerified && remainingBalance > 0)
  );

  const requestedAmount = isTimberPurchase
    ? Number(defaultAmount || purchaseOffer || 220000)
    : isFinal
      ? Number(defaultAmount || remainingBalance || 44900)
      : Number(defaultAmount || advanceAmount || 28215);

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

  // Manual Form States
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

  const handleManualSubmit = async (e) => {
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
      if (onSubmit) {
        await onSubmit({
          payment_method: paymentMethod,
          transaction_reference: transactionRef.trim(),
          payment_date: paymentDate,
          amount: Number(amountPaid),
          receipt_url: receiptUrl || '',
          notes: notes.trim(),
          payment_purpose: isFinal ? 'FINAL_PAYMENT' : 'ADVANCE_PAYMENT'
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit payment details.');
      setSubmitting(false);
    }
  };

  const handleOnlineSuccess = (result) => {
    if (onPaymentSuccess) {
      onPaymentSuccess(result);
    }
    // Also notify submit handler if present
    if (onSubmit) {
      onSubmit({
        payment_method: result.payment_method || 'Razorpay',
        transaction_reference: result.razorpay_payment_id || result.payment_id,
        payment_date: new Date().toISOString().split('T')[0],
        amount: result.amount || requestedAmount,
        receipt_url: '',
        notes: isFinal ? 'Final settlement verified via Razorpay Gateway' : 'Verified via Razorpay Payment Gateway',
        payment_purpose: isFinal ? 'FINAL_PAYMENT' : 'ADVANCE_PAYMENT'
      }).catch(() => {});
    }
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="rapm-overlay" onClick={onClose}>
      <div className="rapm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="rapm-header">
          <div className="rapm-header-left">
            <div className="rapm-icon-badge">
              <CreditCard size={22} />
            </div>
            <div>
              <h3 className="rapm-title">
                {isTimberPurchase
                  ? 'Timber Purchase Settlement & Payout'
                  : (isFinal ? 'Final Contract Settlement Payment' : 'Mobilization Advance Payment')}
              </h3>
              <p className="rapm-subtitle">
                {isTimberPurchase ? (
                  <>
                    Payee (Landowner): <strong className="text-white font-semibold">{request?.userName || request?.ownerName || request?.landowner_name || request?.landownerName || 'Registered Landowner'}</strong>
                    <span className="text-emerald-400 font-bold ml-2">• Agreed Purchase Price: {formatINR(requestedAmount)}</span>
                  </>
                ) : (
                  <>
                    Contractor: <strong className="text-white font-semibold">{request?.assigned_contractor_name || 'Assigned Contractor'}</strong>
                    {isFinal && <span className="text-emerald-400 font-bold ml-2">• Balance Due: {formatINR(remainingBalance)}</span>}
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rapm-close-btn"
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="rapm-tabs-bar">
          <button
            type="button"
            onClick={() => setActiveTab('razorpay')}
            className={`rapm-tab-btn ${activeTab === 'razorpay' ? 'rapm-tab-btn-active' : 'rapm-tab-btn-inactive'}`}
          >
            <Zap size={14} />
            <span>{isTimberPurchase ? 'Razorpay Escrow & Digital Payout' : 'Pay with Razorpay (Instant)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`rapm-tab-btn ${activeTab === 'manual' ? 'rapm-tab-btn-active' : 'rapm-tab-btn-inactive'}`}
          >
            <Building2 size={14} />
            <span>{isTimberPurchase ? 'Direct Bank Transfer / Record Receipt' : 'Manual Transfer (Fallback)'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="rapm-body">
          {activeTab === 'razorpay' ? (
            /* ================= RAZORPAY ONLINE CHECKOUT FLOW ================= */
            <AdvanceMobilizationPayment
              request={request}
              user={user}
              mode={isTimberPurchase ? 'timber_purchase' : (isFinal ? 'final' : 'advance')}
              isFinal={isFinal}
              defaultAmount={requestedAmount}
              onPaymentSuccess={handleOnlineSuccess}
              onPaymentError={(err) => setErrorMsg(err.message || 'Payment failed')}
            />
          ) : (
            /* ================= MANUAL TRANSFER / DIRECT WIRE FLOW ================= */
            <form onSubmit={handleManualSubmit} className="rapm-form">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Payment Request Context Card */}
              <div className="rapm-summary-card">
                <div className="rapm-ref-row">
                  <div>
                    <span className="rapm-ref-label">
                      {isTimberPurchase ? 'Agreed Timber Valuation' : 'Accepted Job Quotation'}
                    </span>
                    <strong className="rapm-ref-val">
                      {formatINR(isTimberPurchase ? requestedAmount : acceptedQuotation)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="rapm-ref-label">
                      {isTimberPurchase ? 'Purchase Payout Due to Landowner' : (isFinal ? 'Remaining Balance Due' : `Agreed Advance (${advReq?.advance_percentage || 27}%)`)}
                    </span>
                    <strong className="rapm-ref-val text-emerald-400">
                      {formatINR(requestedAmount)}
                    </strong>
                  </div>
                </div>

                {/* Account Details with Copy Buttons */}
                <div className="space-y-2 pt-1">
                  <span className="rapm-label text-emerald-400 flex items-center gap-1.5">
                    <Building2 size={13} /> {isTimberPurchase ? 'Escrow Deposit / Landowner Beneficiary Transfer Details:' : 'Contractor Beneficiary Account Details:'}
                  </span>
                  <div className="rapm-accounts-grid">
                    {/* UPI Box */}
                    <div className="rapm-account-box">
                      <div className="rapm-account-top">
                        <span className="font-bold text-emerald-300 flex items-center gap-1">
                          <QrCode size={11} /> UPI ID
                        </span>
                        <span>App Transfer</span>
                      </div>
                      <div className="rapm-account-value-row">
                        <span className="font-mono text-xs font-bold text-emerald-200 select-all truncate">
                          {upiId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(upiId, 'upi')}
                          className="rapm-copy-btn"
                        >
                          {copiedField === 'upi' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedField === 'upi' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Bank Account Box */}
                    <div className="rapm-account-box">
                      <div className="rapm-account-top">
                        <span className="font-bold text-emerald-300 flex items-center gap-1">
                          <Building2 size={11} /> Bank A/C
                        </span>
                        <span className="truncate">{bankName}</span>
                      </div>
                      <div className="rapm-account-value-row">
                        <span className="font-mono text-white text-xs font-bold truncate">
                          A/C: {acNo} • {ifscCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(acNo, 'ac')}
                          className="rapm-copy-btn"
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
              <div className="rapm-form-section">
                <div className="rapm-form-grid">
                  <div className="rapm-field">
                    <label className="rapm-label">
                      Payment / Disbursement Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="rapm-select"
                    >
                      <option value="UPI">UPI Transfer (GPay / PhonePe / Paytm / BHIM)</option>
                      <option value="Bank Transfer (NEFT/RTGS/IMPS)">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="Cheque">Bank Cheque / DD</option>
                      <option value="Cash">Cash Settlement Handover</option>
                    </select>
                  </div>

                  <div className="rapm-field">
                    <label className="rapm-label">
                      {isTimberPurchase ? 'Settlement Amount (₹)' : 'Amount Paid (₹)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                      required
                      className="rapm-input rapm-input-mono text-emerald-300 font-bold"
                    />
                  </div>
                </div>

                <div className="rapm-form-grid">
                  <div className="rapm-field">
                    <label className="rapm-label">
                      Transaction / UTR Reference ID *
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      placeholder="e.g. UTR102948290 or UPI/602938472910"
                      required
                      className="rapm-input rapm-input-mono"
                    />
                  </div>

                  <div className="rapm-field">
                    <label className="rapm-label">
                      <Calendar size={13} className="text-emerald-400" />
                      Date of Settlement
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="rapm-input"
                    />
                  </div>
                </div>

                {/* Optional Receipt Upload */}
                <div className="rapm-field">
                  <label className="rapm-label">
                    <Upload size={13} className="text-emerald-400" />
                    Attach Bank / UPI Receipt Screenshot (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="rapm-file-upload-btn">
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

                <div className="rapm-field">
                  <label className="rapm-label">
                    Verification Notes &amp; Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isTimberPurchase ? "e.g. Payout received via NEFT from contractor's HDFC commercial account." : "e.g. Transferred via Google Pay from HDFC account."}
                    className="rapm-input"
                  />
                </div>
              </div>

              {/* Notice Box */}
              {isTimberPurchase ? (
                <div className="rapm-notice-box-emerald">
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="block font-bold text-emerald-300 mb-0.5">
                      Direct Settlement Ledger Record
                    </strong>
                    Direct bank wire or UPI transfers are logged directly into the TreeConnect timber transaction ledger. Once confirmed with the bank UTR reference, harvesting clearance is officially recorded.
                  </div>
                </div>
              ) : (
                <div className="rapm-notice-box">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="block font-bold text-amber-300 mb-0.5">
                      Manual Verification Required
                    </strong>
                    Manual transfer records are verified by the contractor before harvesting work can commence. For instant automated authorization, switch to <strong>Pay with Razorpay</strong>.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="rapm-actions">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rapm-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rapm-submit-btn"
                >
                  <FileCheck size={15} />
                  <span>
                    {submitting
                      ? 'Recording Settlement...'
                      : (isTimberPurchase ? 'Record Timber Sale Settlement' : 'Submit Manual Transfer Details')}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordAdvancePaymentModal;
