
import React from 'react';

interface StepperProps {
  currentStep: number;
  steps: string[];
  onStepClick?: (stepIndex: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps, onStepClick }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const isCompleted = currentStep > stepIndex;
        const isActive = currentStep === stepIndex;
        const isClickable = onStepClick !== undefined;

        return (
          <React.Fragment key={step}>
            <div 
              className={`flex items-center ${isClickable ? 'cursor-pointer group' : ''}`}
              onClick={() => isClickable && onStepClick(stepIndex)}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' 
                    : isCompleted 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                } ${isClickable && !isActive ? 'group-hover:bg-primary/20 group-hover:text-primary' : ''}`}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="font-bold">{stepIndex}</span>
                )}
              </div>
              <p className={`ml-3 font-bold text-sm uppercase tracking-tight transition-colors ${
                isActive ? 'text-primary' : isCompleted ? 'text-emerald-600' : 'text-text-muted'
              } ${isClickable && !isActive ? 'group-hover:text-primary' : ''}`}>
                {step}
              </p>
            </div>
            {stepIndex < steps.length && (
              <div className={`flex-auto border-t-2 transition-colors duration-300 mx-6 ${isCompleted ? 'border-emerald-500' : 'border-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
