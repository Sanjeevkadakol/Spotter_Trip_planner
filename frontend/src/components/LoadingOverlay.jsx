export default function LoadingOverlay({ steps, currentStep, currentText }) {
  return (
    <div className="fixed inset-0 bg-[#17191c]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[24px] shadow-artifact border border-[#ececec] p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 border-2 border-[#ececec] border-t-[#17191c] rounded-full animate-spin" />
        </div>
        <h3 className="text-center font-serif text-2xl font-normal text-[#17191c] mb-1">Planning Your Route</h3>
        <p className="text-center text-xs text-[#777b86] font-medium mb-6">{currentText}</p>
        
        <div className="space-y-2.5">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all text-[9px]
                ${ idx < currentStep ? 'bg-[#17191c] text-white' : idx === currentStep ? 'bg-[#fbe1d1] text-[#5d2a1a] font-bold animate-pulse' : 'bg-[#f2f2f3] text-[#a3a6af]' }`}>
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              <span className={`text-xs ${ idx <= currentStep ? 'text-[#17191c] font-medium' : 'text-[#a3a6af]' }`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

