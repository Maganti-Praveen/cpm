// Displays setup tasks to guide administrators through configuration steps.
// Monitors setup progress.


import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useGlobalSettings } from '../../hooks/useGlobalSettings';

function OnboardingChecklist({ steps = [] }) {
  const { siteTitle } = useGlobalSettings();
  const [visible, setVisible] = useState(true);
  // Evaluates setup steps to calculate onboarding progress ratio
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  if (!visible) return null;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 relative shadow-sm">
      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        className="absolute top-4 right-4 p-1 rounded-md text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
        aria-label="Dismiss onboarding"
      >
        <X size={18} />
      </button>

      {/* Title */}
      <h2 className="text-lg font-semibold text-[#0F172A] font-display pr-8">
        Welcome to {siteTitle}! Let&apos;s get you set up.
      </h2>
      <p className="text-sm text-[#64748B] mt-1">
        Complete these quick steps to maximize your workspace efficiency.
      </p>

      {/* Progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-[#334155] uppercase">
            Progress
          </span>
          <span className="text-[0.6875rem] font-semibold text-[#334155]">
            {progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[#4F46E5]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {// Iterates onboarding configuration cards with status checkbox indicators
        steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              step.completed ? 'bg-[#F8FAFC]' : ''
            }`}
          >
            {/* Checkbox */}
            <div
              className={`flex items-center justify-center w-5 h-5 rounded mt-0.5 shrink-0 transition-colors ${
                step.completed ? 'bg-[#4F46E5]' : 'border-2 border-[#CBD5E1]'
              }`}
            >
              {step.completed && <Check size={14} className="text-white" strokeWidth={3} />}
            </div>

            {/* Text */}
            <div>
              <p
                className={`text-sm font-semibold ${
                  step.completed ? 'text-[#94A3B8] line-through' : 'text-[#0F172A]'
                }`}
              >
                {step.title}
              </p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OnboardingChecklist;
