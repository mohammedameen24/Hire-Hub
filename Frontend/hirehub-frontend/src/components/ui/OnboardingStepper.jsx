/**
 * OnboardingStepper Component
 * Renders a clean progress bar header for step-by-step onboarding flows.
 */
export default function OnboardingStepper({ steps = [], currentStep = 1 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Background connecting bar */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success-500 text-white shadow-md shadow-success-500/20 ring-4 ring-white'
                    : isActive
                    ? 'bg-accent-600 text-white shadow-md shadow-accent-600/30 ring-4 ring-accent-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 ring-4 ring-white'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-2 text-xs font-semibold tracking-tight text-center ${
                  isActive
                    ? 'text-accent-700 font-bold'
                    : isCompleted
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
