import React from 'react';
import { Check } from 'lucide-react';

const PropertyTypeSelector = ({ value, onChange, error }) => {
  const propertyTypes = [
    {
      id: 'Residential Property',
      title: 'Residential Property',
      emoji: '🏠',
      description: 'Trees located around your house, home compound, or residential plot.',
      examples: ['House', 'Home Compound', 'Residential Plot', 'Villa']
    },
    {
      id: 'Plantation',
      title: 'Plantation',
      emoji: '🌱',
      description: 'Land primarily used for growing trees or plantation crops.',
      examples: ['Rubber', 'Coconut', 'Teak', 'Arecanut']
    },
    {
      id: 'Private Land / Estate',
      title: 'Private Land / Estate',
      emoji: '🌳',
      description: 'Privately owned land or a larger private property containing trees.',
      examples: ['Private Land', 'Timber Stand', 'Acreage', 'Family Estate']
    }
  ];

  return (
    <div className="ld-card p-6 sm:p-8 space-y-6 shadow-2xl bg-[#0b1710] border border-emerald-500/20 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-emerald-500/20">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            1. Select Property Type <span className="text-rose-400">*</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Choose the category that best describes where your trees are located.
          </p>
        </div>
      </div>

      {/* 3 EQUAL DESKTOP COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {propertyTypes.map((type) => {
          const isSelected = value === type.id;

          return (
            <div
              key={type.id}
              onClick={() => onChange(type.id)}
              style={{ borderRadius: '10px' }}
              className={`relative p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 select-none shadow-md ${
                isSelected
                  ? 'bg-emerald-500/15 border-2 border-emerald-400 shadow-emerald-500/10 ring-1 ring-emerald-500/30 transform -translate-y-0.5'
                  : 'bg-[#050e08] border-2 border-emerald-600/20 hover:border-emerald-500/50 hover:bg-[#0c1810]'
              }`}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-md bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg font-bold">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}

              <div className="space-y-3">
                {/* Title with Emoji */}
                <div className="flex items-center gap-3 pr-6">
                  <span className="text-2xl sm:text-3xl">{type.emoji}</span>
                  <h3 className={`text-base font-bold tracking-tight transition-colors ${
                    isSelected ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {type.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {type.description}
                </p>
              </div>

              {/* Simple Readable Examples Line (Dot Separated) */}
              <div className="pt-3 border-t border-emerald-500/15 text-xs">
                <span className="font-semibold text-slate-400">
                  Examples:{' '}
                </span>
                <span className="text-slate-200 font-semibold leading-relaxed">
                  {type.examples.join(' · ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-xs sm:text-sm text-rose-400 font-medium mt-1">{error}</p>}
    </div>
  );
};

export default PropertyTypeSelector;
