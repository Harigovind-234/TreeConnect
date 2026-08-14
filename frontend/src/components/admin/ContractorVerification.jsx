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

  const fetchContractors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data && Array.isArray(res.data.users)) {
        // Filter DB contractors that are unverified or pending verification
        const dbPending = res.data.users.filter(
          (u) => u.role === 'contractor' && (!u.isVerified || u.verification?.includes('Pending') || u.status === 'Pending' || u.status === 'pending')
        );
        setContractors(dbPending);
      } else {
        setContractors([]);
      }
    } catch (err) {
      console.error('API contractor fetch error:', err);
      setContractors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleApprove = async (id) => {
    const contractorToApprove = contractors.find((c) => c.id === id) || selectedContractor;
    try {
      await api.put(`/admin/users/${id}/status`, { status: 'Active', isVerified: true });
    } catch (e) {
      console.error('API approve contractor error:', e);
    }

    if (contractorToApprove?.email) {
      authService.updateUserStatus(contractorToApprove.email, 'Active', true);
    }

    setActionSuccessMessage(`Contractor ${contractorToApprove?.contractorName || contractorToApprove?.name || ''} Verified Successfully!`);
    setContractors((prev) => prev.filter((c) => c.id !== id));
    setShowReviewModal(false);
    setSelectedContractor(null);
    setTimeout(() => setActionSuccessMessage(''), 3000);
  };

  const handleReject = async (id) => {
    const contractorToReject = contractors.find((c) => c.id === id) || selectedContractor;
    try {
      await api.put(`/admin/users/${id}/status`, { status: 'Rejected', isVerified: false });
    } catch (e) {
      console.error('API reject contractor error:', e);
    }

    if (contractorToReject?.email) {
      authService.updateUserStatus(contractorToReject.email, 'Rejected', false);
    }

    setActionSuccessMessage(`Contractor Registration Rejected.`);
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
    <section className="dashboard-section card">
      <div className="card-header pb-2 flex justify-between items-center">
        <div>
          <h2 className="section-heading flex items-center gap-2">
            <ShieldCheck size={18} className="text-amber-400" /> Contractor Verification
          </h2>
          <p className="section-subtext">
            Review identity proofs and professional harvesting credentials for pending contractors
          </p>
        </div>
        <span className="badge badge-amber font-bold flex items-center gap-1.5">
          {loading ? <Loader2 size={12} className="animate-spin" /> : `${contractors.length} Pending Review`}
        </span>
      </div>

      {actionSuccessMessage && (
        <div className="p-3 my-2 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-400 font-bold text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle size={16} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-emerald-400" />
          <span>Fetching pending contractors from database...</span>
        </div>
      ) : contractors.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800">
          <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2" />
          <p className="font-bold text-white text-sm">All Contractor Verifications Complete</p>
          <p className="text-xs text-slate-400 mt-1">There are no pending contractor approval requests in the queue.</p>
        </div>
      ) : (
        <div className="table-wrapper pt-2">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contractor Name</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{c.contractorName || c.name}</span>
                      <span className="text-xs text-slate-400">{c.email}</span>
                    </div>
                  </td>
                  <td className="text-slate-300">{c.location}</td>
                  <td className="text-emerald-400 font-semibold">{c.experience || '3+ Years'}</td>
                  <td className="text-slate-400 text-xs">{c.submittedDate || c.date}</td>
                  <td>
                    <span className="status-pill status-yellow font-bold text-[10px]">
                      <Clock size={12} /> {c.status || 'Pending'}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                      <button
                        className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer px-3 py-1 rounded-lg transition-all"
                        onClick={() => {
                          setSelectedContractor(c);
                          setShowReviewModal(true);
                        }}
                      >
                        Review Details
                      </button>
                      <button
                        className="btn btn-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black cursor-pointer px-3 py-1 rounded-lg transition-all flex items-center gap-1"
                        onClick={() => handleApprove(c.id)}
                      >
                        <UserCheck size={12} /> Approve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Contractor Review Modal */}
      {showReviewModal && selectedContractor && (
        <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="modal-content card max-w-xl w-full p-6 border border-slate-700/80 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 space-y-4 shadow-2xl animate-fade-in text-xs">
            <div className="modal-header flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" />
                <span>Contractor Verification Review</span>
              </h3>
              <button
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body space-y-4 pt-2 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-white text-base">{selectedContractor.contractorName || selectedContractor.name}</p>
                <p className="text-slate-300">Contact: {selectedContractor.contactPerson || selectedContractor.name} ({selectedContractor.phone || 'N/A'})</p>
                <p className="text-slate-300">Email: {selectedContractor.email}</p>
                <p className="text-slate-300">Location: {selectedContractor.location}</p>
                <p className="text-emerald-400 font-semibold">Experience: {selectedContractor.experience || '3+ Years'}</p>
                <p className="text-slate-300">Machinery / Fleet: {selectedContractor.equipment || 'Logging Equipment'}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Submitted Documents / Verification Evidence:</p>
                <div className="flex items-center gap-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                  <FileText size={16} className="text-emerald-400" />
                  <span className="font-medium">{selectedContractor.docType || 'Government ID & Business License'}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                <strong className="block text-amber-400 mb-0.5">Verification Designation:</strong>
                Approving this contractor grants authorization status: <strong>"Verified by TreeConnect Admin"</strong>.
              </div>

              {infoRequestedMessage && (
                <div className="p-2.5 bg-blue-950/80 border border-blue-800 rounded-lg text-blue-300 font-semibold animate-pulse">
                  Request for additional evidence sent to contractor.
                </div>
              )}

              {/* Admin Notes Textarea */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Admin Internal Notes:</label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record internal compliance notes..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <div className="modal-actions flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer px-3 py-1.5 rounded-lg transition-all w-full sm:w-auto"
                  onClick={handleRequestMoreInfo}
                >
                  Request More Info
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    className="btn btn-xs bg-red-950/80 text-red-400 hover:bg-red-900 border border-red-800/80 font-bold cursor-pointer px-3 py-1.5 rounded-lg transition-all"
                    onClick={() => handleReject(selectedContractor.id)}
                  >
                    Reject Registration
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black cursor-pointer px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    onClick={() => handleApprove(selectedContractor.id)}
                  >
                    <UserCheck size={14} /> Approve Contractor
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
