import React from 'react';
import { ShieldCheck } from 'lucide-react';

const PrivacyInformation = () => {
  return (
    <div className="card p-5 border border-emerald/30 rounded-[14px] bg-surface/80 flex items-start gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-emerald/15 border border-emerald/30 flex items-center justify-center text-emerald flex-shrink-0 mt-0.5">
        <ShieldCheck size={22} />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-[14px] text-emerald uppercase tracking-wider">
          Why we ask for this information
        </h3>
        <p className="text-[14px] text-muted leading-relaxed">
          These details help TreeConnect maintain your property record and coordinate future tree management, contractor services and site surveys.
        </p>
      </div>
    </div>
  );
};

export default PrivacyInformation;
