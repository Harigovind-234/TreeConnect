import React from 'react';
import { AlertTriangle, UserCheck, Trees, AlertCircle, ShoppingBag, DollarSign, ArrowRight, Eye } from 'lucide-react';
import { attentionRequiredItems } from '../../data/adminMockData';

const iconMap = {
  'Contractor Verification': UserCheck,
  'Property / Survey Issues': Trees,
  'Reported Accounts': AlertCircle,
  'Marketplace Issues': ShoppingBag,
  'Payment Issues': DollarSign
};

const badgeColorMap = {
  amber: 'bg-amber-950/90 text-amber-400 border-amber-800/80',
  blue: 'bg-blue-950/90 text-blue-400 border-blue-800/80',
  red: 'bg-red-950/90 text-red-400 border-red-800/80',
  purple: 'bg-purple-950/90 text-purple-400 border-purple-800/80'
};

const AttentionRequired = ({ onActionClick }) => {
  return (
    <section className="dashboard-section card border border-slate-800/90 bg-slate-950/90 backdrop-blur-md rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-72 h-32 bg-gradient-to-l from-amber-500/10 via-transparent to-transparent pointer-events-none rounded-tr-2xl" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-3.5 relative z-10">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-950/90 text-amber-400 border border-amber-800/80 flex items-center justify-center">
              <AlertTriangle size={17} />
            </span>
            <span>Attention Required</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Issues and platform operations requiring immediate administrator review
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-950/90 border border-amber-700/80 text-amber-400 tracking-wide flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          5 Actions Pending
        </span>
      </div>

      {/* List Items */}
      <div className="space-y-2.5 relative z-10">
        {attentionRequiredItems.map((item) => {
          const IconComp = iconMap[item.category] || AlertTriangle;
          const colorClass = badgeColorMap[item.badgeColor] || badgeColorMap.amber;
          const isReview = item.actionLabel.toLowerCase() === 'review';

          return (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90 transition-all gap-3 group"
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl border flex items-center justify-center ${colorClass}`}>
                  <IconComp size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px] font-black">
                      {item.count}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>

              <button
                className={`btn btn-xs cursor-pointer px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 self-end sm:self-center whitespace-nowrap ${
                  isReview
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black shadow-md hover:shadow-emerald-900/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 shadow-xs'
                }`}
                onClick={() => onActionClick && onActionClick(item.target)}
              >
                {isReview ? <Eye size={13} /> : null}
                <span>{item.actionLabel}</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AttentionRequired;
