import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Trees, Building2, FileText, Check, Phone, MapPin, Calendar, Clock, Download, Printer } from 'lucide-react';

/**
 * Authentic UIDAI Government Aadhaar Card Visual Component
 */
export const AadhaarCardVisual = ({ data }) => {
  const name = data?.authorizedPerson || data?.displayName || 'Rohith kumar';
  const aadhaarNumber = data?.docNumber || 'XXXX XXXX 2243';
  const adminRef = data?.adminRef || 'TC-ADM-VER-2026-7311-ID';
  const dob = '14/05/1988';
  const gender = 'Male / പുരുഷൻ';
  const address = 'Near Rubber Board, Nagampadam, Kottayam, Kerala - 686006';

  return (
    <div className="w-full max-w-[620px] bg-gradient-to-b from-[#fdfbf7] to-[#f4eee1] text-[#1a1a1a] rounded-2xl border-2 border-[#d97706]/40 p-5 shadow-2xl relative overflow-hidden font-sans select-none text-left">
      
      {/* Background Watermark UIDAI */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <svg width="340" height="340" viewBox="0 0 100 100" fill="currentColor">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M50 5 L50 95 M5 50 L95 50 M18 18 L82 82 M18 82 L82 18" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      {/* Top Header Strip */}
      <div className="flex items-center justify-between border-b-2 border-[#ea580c] pb-2.5 mb-4">
        {/* National Emblem & Bharat Sarkar */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-11 flex flex-col items-center justify-center text-[#991b1b] shrink-0">
            <svg width="28" height="38" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2 L12 8 M6 8 L18 8 M7 8 L7 18 L17 18 L17 8 M9 18 L9 24 L15 24 L15 18 M6 24 L18 24 M4 28 L20 28" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#b91c1c] tracking-tight">भारत सरकार</span>
            <span className="text-sm font-black text-[#1e293b] tracking-wider uppercase">GOVERNMENT OF INDIA</span>
          </div>
        </div>

        {/* UIDAI Logo & Name */}
        <div className="flex items-center gap-2 text-right">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-[#ea580c]">ഭാരതീയ വിശിഷ്ട തിരിച്ചറിയൽ അതോറിറ്റി</span>
            <span className="text-[10px] font-extrabold text-[#0284c7]">Unique Identification Authority of India</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#ea580c]/10 border border-[#ea580c]/30 flex items-center justify-center text-[#ea580c] font-black text-xs shrink-0">
            आधार
          </div>
        </div>
      </div>

      {/* Middle Content Row: Photo, Personal Details & QR */}
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start mb-4">
        
        {/* Contractor Photo */}
        <div className="flex flex-col items-center shrink-0">
          <div className="w-24 h-28 rounded-lg bg-[#e2e8f0] border-2 border-[#94a3b8] overflow-hidden shadow-md relative">
            <img 
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&crop=face"
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] font-mono text-center py-0.5">
              UIDAI VERIFIED
            </div>
          </div>
        </div>

        {/* Demographic Details */}
        <div className="flex-1 flex flex-col gap-1 text-xs text-[#1e293b]">
          <div>
            <span className="text-[11px] text-[#64748b] block font-semibold">പേര് / Name</span>
            <span className="text-base font-black text-[#0f172a]">{name}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-[#64748b] font-semibold block">ജനന തീയതി / DOB</span>
              <span className="font-bold text-[#0f172a]">{dob}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#64748b] font-semibold block">ലിംഗം / Gender</span>
              <span className="font-bold text-[#0f172a]">{gender}</span>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[10px] text-[#64748b] font-semibold block">വിലാസം / Address</span>
            <span className="font-medium text-[#334155] text-[11px] leading-tight block">{address}</span>
          </div>
        </div>

        {/* QR Code Graphic Box */}
        <div className="flex flex-col items-center shrink-0 p-1.5 bg-white rounded-lg border border-[#cbd5e1] shadow-sm">
          <svg width="78" height="78" viewBox="0 0 100 100" fill="#0f172a">
            <rect width="100" height="100" fill="#ffffff" />
            <rect x="10" y="10" width="24" height="24" />
            <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="18" width="8" height="8" />
            <rect x="66" y="10" width="24" height="24" />
            <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="74" y="18" width="8" height="8" />
            <rect x="10" y="66" width="24" height="24" />
            <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="74" width="8" height="8" />
            <rect x="42" y="16" width="6" height="18" />
            <rect x="52" y="10" width="8" height="8" />
            <rect x="42" y="42" width="18" height="18" />
            <rect x="66" y="42" width="8" height="24" />
            <rect x="42" y="72" width="24" height="8" />
            <rect x="76" y="74" width="14" height="14" />
          </svg>
          <span className="text-[8px] font-mono font-bold text-[#64748b] mt-1">SECURE QR CODE</span>
        </div>
      </div>

      {/* Aadhaar 12-Digit Number Box */}
      <div className="border-t border-b border-[#cbd5e1] py-2.5 my-2 text-center bg-white/70 rounded-lg">
        <span className="text-xl sm:text-2xl font-black font-mono tracking-[0.2em] text-[#b91c1c]">
          {aadhaarNumber.includes('XXXX') ? '9842 5122 2243' : aadhaarNumber}
        </span>
      </div>

      {/* Admin Verified Stamp Overlay */}
      <div className="mt-3 flex items-center justify-between bg-[#ecfdf5] border border-[#059669]/40 rounded-xl p-2.5 text-xs text-[#065f46]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </div>
          <div>
            <span className="font-extrabold text-[#047857] block">TreeConnect Admin Approval Stamp</span>
            <span className="text-[10px] font-mono text-[#065f46]/90">
              Ref: <strong className="font-bold">{adminRef}</strong> • Status: <strong className="text-[#047857]">KYC Cleared</strong>
            </span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#047857] uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#059669]/30">
          Official Identity
        </span>
      </div>

      {/* Footer Slogan */}
      <div className="text-center text-[10px] text-[#64748b] font-medium pt-2 mt-1">
        മേര ആധാർ, മേരി പെഹചാൻ • ആധാർ സാധാരണക്കാരന്റെ അധികാരം
      </div>
    </div>
  );
};

/**
 * Authentic Kerala Timber Workers Association Certificate Visual Component
 */
export const UnionCardVisual = ({ data }) => {
  const name = data?.authorizedPerson || data?.displayName || 'Rohith kumar';
  const unionRef = data?.docNumber || 'KL-KTWA-EXP-2026/308';
  const adminRef = data?.adminRef || 'TC-ADM-VER-2026-7310-UN';
  const company = data?.authorizedEntity || 'Apex Timber Solutions & Forestry Services';

  return (
    <div className="w-full max-w-[640px] bg-gradient-to-b from-[#0a1a12] via-[#08170f] to-[#04100a] text-white rounded-2xl border-2 border-amber-500/50 p-6 sm:p-7 shadow-2xl relative overflow-hidden font-sans select-none text-left">
      
      {/* Background Guilloche Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
        <Award size={360} className="text-amber-400" />
      </div>

      {/* Decorative Gold Header Border */}
      <div className="flex items-center justify-between border-b-2 border-amber-500/40 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shrink-0">
            <Trees size={26} />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold block">
              STATE LABOUR &amp; FORESTRY OPERATORS GUILD
            </span>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug">
              KERALA TIMBER WORKERS ASSOCIATION
            </h3>
            <span className="text-[11px] text-emerald-400 font-medium block">
              കേരള ടിമ്പർ വർക്കേഴ്സ് അസോസിയേഷൻ (Regd. No. KL/KTWA/2012)
            </span>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-right">
          <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 uppercase">
            CERTIFIED FELLER
          </span>
          <span className="text-[10px] text-slate-400 mt-1">Valid: 2026 - 2029</span>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center py-2 mb-3 bg-gradient-to-r from-transparent via-amber-500/15 to-transparent border-y border-amber-500/20">
        <span className="text-xs uppercase tracking-[0.18em] font-extrabold text-amber-300">
          Certificate of Union Membership &amp; Harvesting Competence
        </span>
      </div>

      {/* Middle Specs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4 text-xs">
        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Certified Lead Contractor</span>
          <span className="text-base font-black text-white block mt-0.5">{name}</span>
          <span className="text-[11px] text-emerald-400">{company}</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Membership / Permit Number</span>
          <span className="text-base font-mono font-black text-amber-300 block mt-0.5">{unionRef}</span>
          <span className="text-[11px] text-slate-400">Class-A Commercial Felling License</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Certified Operations Scope</span>
          <span className="font-bold text-white block mt-0.5">Heavy Timber Felling, Rigging &amp; Transport</span>
          <span className="text-[11px] text-slate-400">Machinery: Chainsaws, Winches, Log Loaders</span>
        </div>

        <div className="p-3 rounded-xl bg-black/40 border border-amber-500/20">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Operational Jurisdiction</span>
          <span className="font-bold text-white block mt-0.5">Kottayam, Idukki &amp; Pathanamthitta</span>
          <span className="text-[11px] text-emerald-400">Verified Haul Road &amp; Forest Access</span>
        </div>
      </div>

      {/* Regulatory Certification Statement */}
      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-slate-300 leading-relaxed mb-4">
        This is to certify that <strong>{name}</strong> is a registered senior member in good standing under the <strong>Kerala Timber Workers Association</strong> and has completed all statutory forestry safety, mechanized chainsaw felling, and public boundary liability clearances under the Kerala Forest Produce Transit Rules.
      </div>

      {/* Signatures & Admin Verification Stamp */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-amber-500/20">
        
        {/* Association Signatory */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="font-serif italic text-amber-300 text-sm tracking-wide">K. V. Mohanan Nair</div>
          <span className="text-[10px] uppercase text-slate-400 font-bold">General Secretary, KTWA</span>
          <span className="text-[9px] text-slate-500">State Forestry Workers Welfare Board</span>
        </div>

        {/* Official Admin Seal */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/35">
          <ShieldCheck size={20} className="text-amber-400 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wide">
              TreeConnect Admin Approved
            </span>
            <span className="text-[9.5px] font-mono text-emerald-400 font-semibold">
              Ref: {adminRef}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
