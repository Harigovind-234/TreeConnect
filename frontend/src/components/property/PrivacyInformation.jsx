import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PrivacyInformation = () => {
  return (
    <div className="ld-subcard flex items-start gap-4 shadow-xl border border-emerald-500/20 bg-[#0b1710] p-5 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-inner">
        <ShieldCheck size={22} />
      </div>
      <div className="space-y-1">
        <h3 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider">
          Why we ask for this information
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          These details help TreeConnect maintain your property record and coordinate future tree management, contractor services and site surveys.
        </p>
      </div>
    </div>
  );
};

export default PrivacyInformation;
