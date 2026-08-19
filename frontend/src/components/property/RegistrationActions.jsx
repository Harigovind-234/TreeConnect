import React from 'react';
import { Building2, X } from 'lucide-react';

const RegistrationActions = ({ onCancel, onSubmit, isValid, isSubmitting }) => {
  return (
    <div className="ld-card p-5 border border-emerald-500/20 rounded-xl bg-[#0b1710] flex flex-wrap items-center justify-between gap-4 shadow-2xl">
      <div className="text-xs sm:text-sm text-slate-300 font-medium">
        All required fields marked with <span className="text-rose-400 font-bold">*</span> must be completed before registering.
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          type="button"
          onClick={onCancel}
          style={{ height: '46px' }}
          className="bg-[#050e08] hover:bg-[#0c1810] border border-emerald-600/30 text-slate-300 text-sm px-6 rounded-lg flex items-center gap-2 font-bold cursor-pointer transition-all"
          disabled={isSubmitting}
        >
          <X size={16} /> Cancel
        </button>

        <button
          type="button"
          onClick={onSubmit}
          style={{ height: '46px' }}
          className={`text-sm font-extrabold px-8 rounded-lg transition-all flex items-center gap-2 ${
            isValid && !isSubmitting
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-950/80 border border-emerald-400/30 cursor-pointer transform hover:-translate-y-0.5'
              : 'bg-emerald-950/50 text-emerald-600 border border-emerald-900/40 cursor-not-allowed opacity-60'
          }`}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <span>Registering Property...</span>
          ) : (
            <span className="flex items-center gap-2">
              <Building2 size={18} /> Register Property
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default RegistrationActions;
