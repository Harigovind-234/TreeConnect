import React from 'react';

const PasswordStrengthMeter = ({ password = '' }) => {
  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };

    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
    if (score === 3 || score === 4) return { score: 3, label: 'Good', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-600', textColor: 'text-green-600' };
  };

  const { score, label, textColor } = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-gray-500">Password Strength</span>
        <span className={textColor}>{label}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 1 ? (score === 1 ? 'bg-red-500' : score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-gray-200'}`}></div>
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 2 ? (score === 2 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-gray-200'}`}></div>
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
        <div className={`h-full rounded-full transition-all duration-300 ${score >= 4 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
