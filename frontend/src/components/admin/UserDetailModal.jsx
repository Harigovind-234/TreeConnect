import React, { useState } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserX,
  UserCheck,
  Trees,
  Truck,
  ShoppingBag,
  Plus,
  MoreVertical,
  Key,
  Globe,
  FileText,
  Star,
  Activity,
  Layers,
  CheckCircle2,
  Eye,
  Download,
  ExternalLink
} from 'lucide-react';

const UserDetailModal = ({
  user,
  onClose,
  onVerify,
  onToggleSuspend
}) => {
  if (!user) return null;

  const [viewingDoc, setViewingDoc] = useState(null);

  // Local State for Admin Notes history
  const [notes, setNotes] = useState(
    user.adminNotesList || [
      { date: 'Aug 12, 2026', text: 'Account verification completed by admin.' },
      { date: 'Aug 10, 2026', text: 'Email and phone verification completed.' }
    ]
  );
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Confirmation Modals
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Extract District and Location
  const getDistrict = (locationStr) => {
    if (!locationStr) return 'Kottayam';
    const parts = locationStr.split(',');
    return parts[0].trim();
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    const newNote = {
      date: todayStr,
      text: newNoteText.trim()
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setShowAddNote(false);
  };

  const handleConfirmSuspend = () => {
    onToggleSuspend(user.id);
    setShowSuspendConfirm(false);
  };

  const isVerified = (user.status === 'Active' || user.status === 'Verified') && Boolean(user.isVerified);
  const isSuspended = user.status === 'Suspended';

  return (
    <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* Modal Container - 740px Width for Maximum Space */}
      <div className="modal-content card max-w-3xl w-full p-6 sm:p-8 border border-slate-800 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 space-y-6 shadow-2xl animate-fade-in text-xs max-h-[92vh] overflow-y-auto relative">
        
        {/* 1. CLEAN PROFILE HEADER */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-4">
            {/* Avatar Circle */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user.name}
                </h2>
                
                {/* Role Badge */}
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-emerald-950/90 text-emerald-400 border border-emerald-800/80">
                  {user.role}
                </span>

                {/* Account Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${isSuspended ? 'bg-red-950/80 text-red-400 border-red-800/80' : 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'}`}>
                  {user.status || 'Active'}
                </span>
              </div>

              {/* User Email */}
              <a
                href={`mailto:${user.email}`}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-medium"
              >
                <Mail size={13} className="text-slate-500" />
                <span>{user.email}</span>
              </a>
            </div>
          </div>

          {/* Close & Options Header */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800/60 transition-all flex items-center gap-1 cursor-pointer"
                onClick={() => setShowMoreActions(!showMoreActions)}
                title="More Actions"
              >
                <MoreVertical size={16} />
              </button>

              {showMoreActions && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-20 animate-fade-in text-xs">
                  <button
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center gap-2 font-medium"
                    onClick={() => setShowMoreActions(false)}
                  >
                    <Activity size={14} /> View Activity Log
                  </button>
                  <button
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors flex items-center gap-2 font-medium"
                    onClick={() => setShowMoreActions(false)}
                  >
                    <Layers size={14} /> View Role Records
                  </button>
                  <div className="my-1 border-t border-slate-800" />
                  <button
                    className={`w-full px-3.5 py-2 text-left transition-colors flex items-center gap-2 font-semibold ${isSuspended ? 'text-emerald-400 hover:bg-slate-800' : 'text-red-400 hover:bg-slate-800'}`}
                    onClick={() => {
                      setShowMoreActions(false);
                      if (isSuspended) onToggleSuspend(user.id);
                      else setShowSuspendConfirm(true);
                    }}
                  >
                    {isSuspended ? <UserCheck size={14} /> : <UserX size={14} />}
                    <span>{isSuspended ? 'Reactivate Account' : 'Suspend Account'}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl border border-slate-800/60 transition-all cursor-pointer"
              onClick={onClose}
              aria-label="Close user modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. ACCOUNT INFORMATION (Spacious 2-Column Key-Value Layout) */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>ACCOUNT INFORMATION</span>
          </h3>

          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Phone size={13} className="text-slate-500" /> Phone Number
              </span>
              <span className="font-bold text-white text-xs">{user.phone || '+91 97467 94654'}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-500" /> Location
              </span>
              <span className="font-bold text-white text-xs">{user.location || 'Kerala'}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Globe size={13} className="text-slate-500" /> District
              </span>
              <span className="font-bold text-white text-xs">{getDistrict(user.location)}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-500" /> Registration Date
              </span>
              <span className="font-bold text-white text-xs">{user.date || 'Aug 04, 2026'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Clock size={13} className="text-slate-500" /> Last Login
              </span>
              <span className="font-bold text-white text-xs">{user.lastLogin || 'Aug 12, 2026'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <Key size={13} className="text-slate-500" /> Login Method
              </span>
              <span className="font-bold text-white text-xs">{user.loginMethod || 'Email & Password'}</span>
            </div>
          </div>
        </section>

        {/* 3. VERIFICATION STATUS (Spacious 2-Column Grid) */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>VERIFICATION STATUS</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email Verification */}
            <div className="px-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-semibold">Email Verification</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                ✓ Verified
              </span>
            </div>

            {/* Phone Verification */}
            <div className="px-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-semibold">Phone Verification</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 flex items-center gap-1">
                ✓ Verified
              </span>
            </div>

            {/* Account Verification */}
            <div className="px-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-semibold">Account Verification</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${isVerified ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' : 'bg-amber-950/80 text-amber-400 border-amber-800/80'}`}>
                {isVerified ? '✓ Verified' : '⏳ Pending'}
              </span>
            </div>

            {/* Admin Review */}
            <div className="px-4 py-3 bg-slate-900/40 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-300 font-semibold">Admin Review</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1 ${isVerified ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' : 'bg-blue-950/80 text-blue-400 border-blue-800/80'}`}>
                {isVerified ? '✓ Completed' : '🔍 Under Review'}
              </span>
            </div>
          </div>

          {/* Government-Issued Identity / Business Identification Verification Badge */}
          {(user.idProofDocument || user.idProofType || user.role?.toLowerCase() === 'landowner' || user.role?.toLowerCase() === 'contractor' || user.role?.toLowerCase() === 'buyer') && (
            <div className={`mt-3 p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 ${isVerified ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-amber-950/40 border-amber-500/30'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border shrink-0 ${isVerified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-white block">Government-Issued Identity / Business Identification</span>
                  <span className="text-[11px] text-slate-300 font-mono block mt-0.5">
                    {user.idProofDocument || (user.idProofType ? `${user.idProofType} Document` : 'govt_identity_proof.pdf')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDoc({
                    title: 'Government-Issued Identity / Business Identification',
                    fileName: user.idProofDocument || (user.idProofType ? `${user.idProofType} Document` : 'govt_identity_proof.pdf'),
                    type: user.idProofType || 'Government Identity Proof',
                    fileUrl: user.idProofUrl || (user.idProofDocument && (user.idProofDocument.startsWith('http') || user.idProofDocument.startsWith('data:')) ? user.idProofDocument : '')
                  })}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Eye size={13} /> View Document
                </button>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {isVerified ? '✓ Identity Verified' : '⏳ Pending Admin Verification'}
                </span>
              </div>
            </div>
          )}

          {/* Landowner Land Tax Invoice Verification Badge */}
          {(user.role?.toLowerCase() === 'landowner' || user.landTaxInvoiceDoc) && (
            <div className={`mt-3 p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 ${isVerified ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-amber-950/40 border-amber-500/30'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border shrink-0 ${isVerified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                  <Trees size={16} />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-white block">Property Ownership &amp; Land Tax Invoice Details</span>
                  <span className="text-[11px] text-slate-300 font-mono block mt-0.5">
                    {user.landTaxInvoiceDoc || 'land_tax_payment_receipt.pdf'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDoc({
                    title: 'Property Ownership & Land Tax Invoice Details',
                    fileName: user.landTaxInvoiceDoc || 'land_tax_payment_receipt.pdf',
                    type: 'Land Tax Invoice / Property Tax Document',
                    fileUrl: user.landTaxInvoiceUrl || (user.landTaxInvoiceDoc && (user.landTaxInvoiceDoc.startsWith('http') || user.landTaxInvoiceDoc.startsWith('data:')) ? user.landTaxInvoiceDoc : '')
                  })}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Eye size={13} /> View Document
                </button>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${isVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                  {isVerified ? '✓ Land Tax Receipt Verified' : '⏳ Pending Admin Verification'}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 4. ACTIVITY SUMMARY (Spacious 3-Column Metric Cards) */}
        <section className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Activity size={15} className="text-emerald-400" />
            <span>ACTIVITY SUMMARY ({user.role?.toUpperCase()})</span>
          </h3>

          {/* LANDOWNER ACTIVITY */}
          {user.role?.toLowerCase() === 'landowner' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Properties</span>
                  <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{user.propertiesCount || 3}</span>
                </div>
                <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <Trees size={18} />
                </span>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Tree Inventories</span>
                  <span className="text-2xl font-black text-white mt-0.5 block">{user.treeInventoriesCount || 12}</span>
                </div>
                <span className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                  <Activity size={18} />
                </span>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Harvest Requests</span>
                  <span className="text-2xl font-black text-amber-400 mt-0.5 block">{user.harvestRequestsCount || 4}</span>
                </div>
                <span className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
                  <Truck size={18} />
                </span>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Timber Listings</span>
                  <span className="text-2xl font-black text-blue-400 mt-0.5 block">{user.timberListingsCount || 2}</span>
                </div>
                <span className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60">
                  <ShoppingBag size={18} />
                </span>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Completed Harvests</span>
                  <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{user.completedHarvestsCount || 1}</span>
                </div>
                <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <CheckCircle2 size={18} />
                </span>
              </div>

              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Contractors</span>
                  <span className="text-2xl font-black text-purple-400 mt-0.5 block">{user.assignedContractorsCount || 2}</span>
                </div>
                <span className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
                  <Truck size={18} />
                </span>
              </div>
            </div>
          )}

          {/* CONTRACTOR ACTIVITY */}
          {user.role?.toLowerCase() === 'contractor' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Experience</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">{user.experience || '8 Years'}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Bids Submitted</span>
                <span className="text-2xl font-black text-blue-400 mt-0.5 block">{user.bidsSubmitted || 5}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Accepted Bids</span>
                <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{user.acceptedBids || 3}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Active Projects</span>
                <span className="text-2xl font-black text-amber-400 mt-0.5 block">{user.activeProjects || 2}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Completed Projects</span>
                <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{user.completedProjects || 14}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Rating</span>
                <span className="text-xl font-black text-amber-400 mt-0.5 block flex items-center gap-1">
                  4.9 <Star size={14} className="fill-amber-400 text-amber-400" />
                </span>
              </div>
            </div>
          )}

          {/* BUYER ACTIVITY */}
          {user.role?.toLowerCase() === 'buyer' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Timber Inquiries</span>
                <span className="text-2xl font-black text-blue-400 mt-0.5 block">{user.inquiriesCount || 8}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Active Purchases</span>
                <span className="text-2xl font-black text-amber-400 mt-0.5 block">{user.activePurchases || 3}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Completed Purchases</span>
                <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{user.completedPurchases || 15}</span>
              </div>
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wider">Orders Placed</span>
                <span className="text-2xl font-black text-purple-400 mt-0.5 block">{user.ordersPlaced || 4}</span>
              </div>
            </div>
          )}
        </section>

        {/* 5. INTERNAL ADMIN NOTES */}
        <section className="space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText size={15} className="text-emerald-400" />
                <span>INTERNAL ADMIN NOTES</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Private notes visible only to TreeConnect administrators.
              </p>
            </div>

            <button
              type="button"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 cursor-pointer bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-all"
              onClick={() => setShowAddNote(!showAddNote)}
            >
              <Plus size={13} />
              <span>Add Note</span>
            </button>
          </div>

          {/* Add Note Input Area */}
          {showAddNote && (
            <form onSubmit={handleAddNote} className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 animate-fade-in">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Record administrative observations, support records, or account notes..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-xs bg-slate-800 text-slate-300 hover:bg-slate-700 px-3 py-1.5 rounded-lg"
                  onClick={() => setShowAddNote(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3 py-1.5 rounded-lg"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {/* Chronological Notes History */}
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {notes.map((n, idx) => (
              <div key={idx} className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 flex items-center gap-4">
                <div className="text-[11px] font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                  {n.date}
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {n.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. BOTTOM ADMIN ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              className={`btn btn-xs cursor-pointer flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold transition-all text-xs w-full sm:w-auto ${
                isSuspended
                  ? 'bg-emerald-950/90 text-emerald-400 hover:bg-emerald-900 border border-emerald-800'
                  : 'bg-red-950/80 text-red-400 hover:bg-red-900 border border-red-800/80'
              }`}
              onClick={() => {
                if (isSuspended) onToggleSuspend(user.id);
                else setShowSuspendConfirm(true);
              }}
            >
              {isSuspended ? (
                <>
                  <UserCheck size={15} /> Reactivate User
                </>
              ) : (
                <>
                  <UserX size={15} /> Suspend User
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer px-6 py-2.5 rounded-xl transition-all w-full sm:w-auto text-center text-xs"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* SUSPEND CONFIRMATION DIALOG MODAL */}
        {showSuspendConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="card max-w-md w-full p-6 border border-red-900/80 rounded-2xl bg-slate-950 space-y-4 shadow-2xl text-xs">
              <div className="flex items-center gap-3 text-red-400 border-b border-slate-800 pb-3">
                <AlertTriangle size={22} className="shrink-0 text-red-400" />
                <h4 className="text-base font-extrabold text-white">Suspend this user?</h4>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                The user <strong>{user.name}</strong> will no longer be able to access their TreeConnect account until the account is reactivated by an administrator.
              </p>

              <div className="flex justify-end items-center gap-2.5 pt-2">
                <button
                  type="button"
                  className="btn btn-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2 rounded-xl cursor-pointer"
                  onClick={() => setShowSuspendConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-xs bg-red-600 hover:bg-red-500 text-white font-black px-4 py-2 rounded-xl cursor-pointer shadow-lg"
                  onClick={handleConfirmSuspend}
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT PREVIEW MODAL */}
        {viewingDoc && (
          <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="relative max-w-3xl w-full bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base sm:text-lg">
                      {viewingDoc.title}
                    </h4>
                    <span className="text-xs font-mono text-emerald-400 block mt-0.5">
                      {viewingDoc.fileName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Document Preview Canvas */}
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[320px] text-center space-y-4 relative overflow-hidden">
                {viewingDoc.fileUrl || (viewingDoc.fileName && (viewingDoc.fileName.endsWith('.png') || viewingDoc.fileName.endsWith('.jpg') || viewingDoc.fileName.endsWith('.jpeg'))) ? (
                  <img
                    src={viewingDoc.fileUrl || `https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=60`}
                    alt={viewingDoc.title}
                    className="max-h-[350px] w-auto max-w-full object-contain rounded-lg border border-slate-800 shadow-lg"
                  />
                ) : (
                  <div className="space-y-4 py-8 max-w-lg mx-auto">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                      <ShieldCheck size={42} />
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-white block">{viewingDoc.fileName}</span>
                      <span className="text-xs text-emerald-400 font-semibold mt-1 block">Official Verification Attachment ({viewingDoc.type || 'Document Attachment'})</span>
                    </div>
                    <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 leading-relaxed font-mono">
                      ✓ Authenticated Document Attachment uploaded for Administrator Review under Kerala Revenue &amp; Forest Department guidelines.
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-400" /> Authenticated Document Attachment
                </span>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = viewingDoc.fileUrl || '#';
                      link.download = viewingDoc.fileName;
                      link.click();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Download size={15} /> Download Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingDoc(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
