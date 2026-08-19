import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, CheckCircle, X, FileText, Check, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { authService } from '../../services/authService';
import api from '../../services/api';

const ContractorVerification = () => {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [infoRequestedMessage, setInfoRequestedMessage] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data && Array.isArray(res.data.users)) {
        // Filter DB contractors or buyers that are unverified or pending verification
        const dbPending = res.data.users.filter(
          (u) => (!u.isVerified || u.verification?.includes('Pending') || u.status === 'Pending' || u.status === 'pending') &&
                 (u.role === 'contractor' || u.role === 'buyer' || u.forestLicenceDoc || u.tradeLicenceDoc)
        );
        setContractors(dbPending);
      } else {
        setContractors([]);
      }
    } catch (err) {
      console.error('API pending users fetch error:', err);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (id) => {
    const userToApprove = contractors.find((c) => c.id === id) || selectedContractor;
    try {
      await api.put(`/admin/users/${id}/status`, { status: 'Active', isVerified: true });
    } catch (e) {
      console.error('API approve user error:', e);
    }

    if (userToApprove?.email) {
      authService.updateUserStatus(userToApprove.email, 'Active', true);
    }

    setActionSuccessMessage(`Account for ${userToApprove?.name || userToApprove?.companyName || 'User'} Verified Successfully!`);
    setContractors((prev) => prev.filter((c) => c.id !== id));
    setShowReviewModal(false);
    setSelectedContractor(null);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleReject = async (id) => {
    const userToReject = contractors.find((c) => c.id === id) || selectedContractor;
    try {
      await api.put(`/admin/users/${id}/status`, { status: 'Rejected', isVerified: false });
    } catch (e) {
      console.error('API reject user error:', e);
    }

    if (userToReject?.email) {
      authService.updateUserStatus(userToReject.email, 'Rejected', false);
    }

    setActionSuccessMessage(`Registration Rejected.`);
    setContractors((prev) => prev.filter((c) => c.id !== id));
    setShowReviewModal(false);
    setSelectedContractor(null);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleRequestMoreInfo = () => {
    setInfoRequestedMessage(true);
    setTimeout(() => {
      setInfoRequestedMessage(false);
      setShowReviewModal(false);
    }, 1800);
  };

  return (
    <section className="admin-card space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-amber-400" /> Contractor & Business Verification Queue
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review identity proofs, Forest Department licences, trade licences, and business credentials
          </p>
        </div>
        <span className="admin-badge-amber text-xs font-bold flex items-center gap-1.5 shrink-0">
          {loading ? <Loader2 size={13} className="animate-spin" /> : `${contractors.length} Pending Review`}
        </span>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 my-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 font-bold text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center bg-[#0e1612] rounded-xl border border-emerald-500/15 text-slate-300 text-xs flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-emerald-400" />
          <span>Fetching pending verification requests from database...</span>
        </div>
      ) : contractors.length === 0 ? (
        <div className="p-8 text-center bg-[#0e1612] rounded-xl border border-emerald-500/15 space-y-2">
          <CheckCircle size={36} className="text-emerald-400 mx-auto" />
          <p className="font-bold text-white text-sm">All Verifications Complete</p>
          <p className="text-xs text-slate-300">There are no pending contractor or buyer verification requests in the queue.</p>
        </div>
      ) : (
        <div className="table-wrapper pt-2">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant Name / Entity</th>
                <th>Category / Role</th>
                <th>Location</th>
                <th>Documents Submitted</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{c.name || c.companyName}</span>
                      <span className="text-xs text-slate-400">{c.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/60">
                      {c.role === 'buyer' ? `Buyer: ${c.buyerType || c.businessType || 'Business'}` : 'Contractor'}
                    </span>
                  </td>
                  <td className="text-slate-300 text-xs">{c.location}</td>
                  <td className="text-slate-300 text-xs max-w-xs truncate">{c.docType || 'Govt ID & Licences'}</td>
                  <td>
                    <span className="admin-badge-amber text-xs font-bold flex items-center gap-1.5 w-max">
                      <Clock size={12} /> {c.status || 'Pending'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      <button
                        className="admin-btn-outline text-xs py-1.5 px-3"
                        onClick={() => {
                          setSelectedContractor(c);
                          setShowReviewModal(true);
                        }}
                      >
                        Review Details
                      </button>
                      <button
                        className="admin-btn-emerald text-xs py-1.5 px-3"
                        onClick={() => handleApprove(c.id)}
                      >
                        <UserCheck size={13} /> Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedContractor && (
        <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-[#0a0f0d]/90 backdrop-blur-md">
          <div className="modal-content admin-card max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in text-xs bg-[#121a16] border border-emerald-500/25">
            <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" />
                <span>Verification Review ({selectedContractor.role === 'buyer' ? `Buyer: ${selectedContractor.buyerType || 'Business'}` : 'Contractor'})</span>
              </h3>
              <button
                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#18241e] rounded-xl transition-all cursor-pointer"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-[#0e1612] p-4 rounded-xl border border-emerald-500/15 space-y-2">
                <p className="font-bold text-white text-base">{selectedContractor.name || selectedContractor.companyName}</p>
                <p className="text-slate-300">Role / Category: <strong className="text-emerald-400 capitalize">{selectedContractor.role} ({selectedContractor.buyerType || selectedContractor.businessType || 'General'})</strong></p>
                <p className="text-slate-300">Contact Person: {selectedContractor.contactPerson || selectedContractor.name} ({selectedContractor.phone || 'N/A'})</p>
                <p className="text-slate-300">Email: {selectedContractor.email}</p>
                <p className="text-slate-300">Location: {selectedContractor.location}</p>
              </div>

              <div className="bg-[#0a0f0d] p-4 rounded-xl border border-emerald-500/15 space-y-2.5">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Submitted Business Verification Documents:</p>
                
                {selectedContractor.forestLicenceDoc && (
                  <div className="flex items-center gap-2 p-2 bg-[#0e1612] rounded-lg border border-emerald-500/20 text-emerald-300">
                    <FileText size={15} className="text-emerald-400" />
                    <span><strong>Forest Dept Licence:</strong> {selectedContractor.forestLicenceDoc}</span>
                  </div>
                )}

                {selectedContractor.tradeLicenceDoc && (
                  <div className="flex items-center gap-2 p-2 bg-[#0e1612] rounded-lg border border-emerald-500/20 text-emerald-300">
                    <FileText size={15} className="text-emerald-400" />
                    <span><strong>Local Body Trade Licence:</strong> {selectedContractor.tradeLicenceDoc}</span>
                  </div>
                )}

                {selectedContractor.gstDoc && (
                  <div className="flex items-center gap-2 p-2 bg-[#0e1612] rounded-lg border border-emerald-500/20 text-emerald-300">
                    <FileText size={15} className="text-emerald-400" />
                    <span><strong>GST Registration:</strong> {selectedContractor.gstDoc}</span>
                  </div>
                )}

                {selectedContractor.businessCertDoc && (
                  <div className="flex items-center gap-2 p-2 bg-[#0e1612] rounded-lg border border-emerald-500/20 text-emerald-300">
                    <FileText size={15} className="text-emerald-400" />
                    <span><strong>MSME / Business Certificate:</strong> {selectedContractor.businessCertDoc}</span>
                  </div>
                )}

                {selectedContractor.landTaxInvoiceDoc && (
                  <div className="p-2.5 bg-emerald-950/60 rounded-xl border border-emerald-500/30 text-emerald-300 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <FileText size={15} className="text-emerald-400" />
                        Property Ownership & Land Tax Invoice Document
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                        Landowner Doc
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-mono pl-5">{selectedContractor.landTaxInvoiceDoc}</p>
                  </div>
                )}

                {selectedContractor.idProofDocument && (
                  <div className="flex items-center gap-2 p-2 bg-[#0e1612] rounded-lg border border-emerald-500/20 text-slate-200">
                    <FileText size={15} className="text-emerald-400" />
                    <span><strong>Govt ID Proof:</strong> {selectedContractor.idProofDocument}</span>
                  </div>
                )}

                {!selectedContractor.forestLicenceDoc && !selectedContractor.tradeLicenceDoc && !selectedContractor.idProofDocument && (
                  <div className="flex items-center gap-2 p-2 bg-[#0e1612] rounded-lg border border-emerald-500/15 text-slate-200">
                    <FileText size={15} className="text-emerald-400" />
                    <span>{selectedContractor.docType || 'Government ID & Business License'}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed">
                <strong className="block text-amber-400 mb-0.5">Verification Designation:</strong>
                Approving grants verified status: <strong>"Verified by TreeConnect Admin"</strong>.
              </div>

              {infoRequestedMessage && (
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-300 font-semibold animate-pulse">
                  Request for additional evidence sent.
                </div>
              )}

              {/* Admin Notes Textarea */}
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">Admin Internal Notes:</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record internal compliance notes..."
                  className="w-full p-2.5 bg-[#0a0f0d] border border-emerald-500/25 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-emerald-500/15">
                <button
                  type="button"
                  className="admin-btn-outline text-xs py-2 px-4 w-full sm:w-auto"
                  onClick={handleRequestMoreInfo}
                >
                  Request More Info
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-bold cursor-pointer text-xs transition-all"
                    onClick={() => handleReject(selectedContractor.id)}
                  >
                    Reject Registration
                  </button>
                  <button
                    type="button"
                    className="admin-btn-emerald text-xs py-2 px-4"
                    onClick={() => handleApprove(selectedContractor.id)}
                  >
                    <UserCheck size={14} /> Approve Verification
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ContractorVerification;
