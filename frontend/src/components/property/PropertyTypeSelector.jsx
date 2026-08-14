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
    <div className="card p-7 border border-color rounded-[16px] bg-card space-y-6 shadow-sm">
      <div>
        <h2 className="text-[22px] font-bold text-main tracking-tight">
          1. Select Property Type <span className="text-red-400">*</span>
        </h2>
        <p className="text-[15px] text-muted mt-1">
          Choose the category that best describes where your trees are located.
        </p>
      </div>

      {/* 3 EQUAL DESKTOP COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {propertyTypes.map((type) => {
          const isSelected = value === type.id;

          return (
            <div
              key={type.id}
              onClick={() => onChange(type.id)}
              className={`relative min-h-[185px] p-6 rounded-[16px] border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ${
                isSelected
                  ? 'bg-emerald/10 border-emerald shadow-glow ring-1 ring-emerald/30 -translate-y-0.5'
                  : 'bg-surface/80 border-color hover:border-emerald/40 hover:bg-card-hover'
              }`}
            >
              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald text-dark flex items-center justify-center shadow">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}

              <div className="space-y-3">
                {/* Title with Emoji */}
                <div className="flex items-center gap-3 pr-6">
                  <span className="text-2xl">{type.emoji}</span>
                  <h3 className={`text-[19px] font-bold tracking-tight transition-colors ${
                    isSelected ? 'text-emerald' : 'text-main'
                  }`}>
                    {type.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[14px] text-muted leading-relaxed">
                  {type.description}
                </p>
              </div>

              {/* Simple Readable Examples Line (Dot Separated) */}
              <div className="pt-4 mt-3 border-t border-color/40 text-[13px]">
                <span className="font-semibold text-muted">
                  Examples:{' '}
                </span>
                <span className="text-main font-medium">
                  {type.examples.join(' · ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="text-[14px] text-red-400 font-medium mt-1">{error}</p>}
    </div>
  );
};

export default PropertyTypeSelector;
