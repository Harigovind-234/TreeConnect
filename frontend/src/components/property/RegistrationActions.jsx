import React from 'react';
import { Building2, X } from 'lucide-react';

const RegistrationActions = ({ onCancel, onSubmit, isValid, isSubmitting }) => {
  return (
    <div className="card p-5 border border-color rounded-[16px] bg-card flex flex-wrap items-center justify-between gap-4 shadow-sm pt-5">
      <div className="text-[14px] text-muted font-medium">
        All required fields marked with <span className="text-red-400 font-bold">*</span> must be completed before registering.
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button
          type="button"
          onClick={onCancel}
          style={{ height: '48px' }}
          className="btn btn-secondary text-[15px] px-6 rounded-[10px] flex items-center gap-2 font-semibold"
          disabled={isSubmitting}
        >
          <X size={16} /> Cancel
        </button>

        <button
          type="button"
          onClick={onSubmit}
          style={{ height: '48px' }}
          className={`btn text-[15px] font-bold px-8 rounded-[10px] shadow-glow transition-all flex items-center gap-2 ${
            isValid && !isSubmitting
              ? 'btn-primary bg-emerald text-dark hover:bg-emerald-hover cursor-pointer'
              : 'bg-emerald/30 text-dark/60 cursor-not-allowed border border-emerald/20 opacity-70'
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
