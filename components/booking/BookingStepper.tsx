
import React, { ReactNode } from 'react';
import { CheckIcon } from '../Icons';

interface Step {
  id: string;
  name: string;
  icon: ReactNode;
}

interface BookingStepperProps {
  steps: Step[];
  currentStepId: string;
}

const BookingStepper: React.FC<BookingStepperProps> = ({ steps, currentStepId }) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className="relative flex-1">
            {stepIdx < steps.length - 1 ? (
              <div className="absolute inset-0 top-4 -ml-px mt-0.5 h-0.5 w-full bg-gray-300" aria-hidden="true" />
            ) : null}
            <div className="relative flex items-center justify-center">
              {stepIdx <= currentStepIndex ? (
                // Completed or Current Step
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue">
                  {stepIdx < currentStepIndex ? (
                    <CheckIcon className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-white font-bold">{stepIdx + 1}</span>
                  )}
                </span>
              ) : (
                // Upcoming Step
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                   <span className="text-gray-500 font-bold">{stepIdx + 1}</span>
                </span>
              )}
               <span className="absolute top-10 text-center w-28 text-xs font-semibold text-brand-dark">{step.name}</span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default BookingStepper;
