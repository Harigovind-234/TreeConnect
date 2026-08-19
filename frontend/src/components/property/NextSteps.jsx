import React from 'react';

const NextSteps = () => {
  const steps = [
    {
      num: '1',
      title: 'Add Tree Inventory',
      description: 'Record the trees located on your property.'
    },
    {
      num: '2',
      title: 'Find a Contractor',
      description: 'Browse available contractors and discuss your requirements.'
    },
    {
      num: '3',
      title: 'Agree on Terms',
      description: 'Choose a contractor after discussing the work and price.'
    },
    {
      num: '4',
      title: 'Site Survey',
      description: 'After a contractor is confirmed, arrange a site visit.'
    }
  ];

  return (
    <div className="ld-card p-6 sm:p-8 space-y-5 shadow-2xl bg-[#0b1710] border border-emerald-500/20 rounded-xl">
      <div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          What Happens After Registration?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
          Here is an overview of the simple steps following property registration.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className="ld-subcard p-4 flex items-start gap-3 text-xs bg-[#050e08] border border-emerald-600/20 rounded-lg"
          >
            <div className="w-7 h-7 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-white text-sm block">
                {step.title}
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextSteps;
