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
    <div className="space-y-4 pt-1">
      <div>
        <h3 className="text-[20px] font-bold text-main tracking-tight">
          What Happens After Registration?
        </h3>
        <p className="text-[14px] text-muted mt-1">
          Here is an overview of the simple steps following property registration.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-4 rounded-[12px] bg-surface/70 border border-color/80 flex items-start gap-3 text-xs"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald/15 border border-emerald/30 text-emerald flex items-center justify-center font-bold text-[13px] flex-shrink-0 mt-0.5">
              {step.num}
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-main text-[14px] block">
                {step.title}
              </span>
              <p className="text-muted text-[13px] leading-relaxed">
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
