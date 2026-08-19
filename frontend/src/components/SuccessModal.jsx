import React from 'react';
import { CheckCircle2, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuccessModal = ({ isOpen, onClose, role = 'landowner' }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToLogin = () => {
    if (onClose) onClose();
    navigate('/login');
  };

  const isContractor = role === 'contractor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-950 p-8 text-center overflow-hidden transform transition-all animate-scale-up">
        {/* Top Decorative Emerald/Amber Glow */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 ${isContractor ? 'bg-amber-400/20' : 'bg-emerald-400/20'} rounded-full blur-2xl pointer-events-none`}></div>
        <div className={`absolute -top-12 -right-12 w-32 h-32 ${isContractor ? 'bg-orange-400/20' : 'bg-teal-400/20'} rounded-full blur-2xl pointer-events-none`}></div>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 ring-8 ring-amber-50/50 dark:ring-amber-950/30 rounded-full mb-6 shadow-inner">
          <Clock size={44} className="stroke-[2.2]" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Registration Submitted
        </h3>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider mb-4">
          <ShieldCheck size={14} />
          <span>Pending Admin Approval</span>
        </div>

        {/* Message */}
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8">
          Your account registration has been submitted successfully.<br />
          <span className="text-slate-400 text-xs block mt-2 leading-relaxed">
            Your details and uploaded documents are now under review by the TreeConnect administrator. You will be able to log in once your account is reviewed and approved by an admin.
          </span>
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleGoToLogin}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-lg shadow-emerald-700/25 hover:shadow-emerald-800/35 transition-all duration-200 cursor-pointer text-base"
        >
          <span>Go to Login</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
