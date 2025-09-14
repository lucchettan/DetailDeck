import React from 'react';

interface StepTransitionProps {
  currentStep: string;
  children: React.ReactNode;
}

const StepTransition: React.FC<StepTransitionProps> = ({ currentStep, children }) => {
  return (
    <div className="grid items-start">
      {React.Children.map(children, (child) => {
        // Fix: Add a type guard to ensure the child is a valid React element before accessing its props.
        if (!React.isValidElement(child)) {
          return child;
        }

        // Fix: Use `data-step` to read the step identifier, which is a valid custom attribute.
        // This resolves the TypeScript error about 'step' not existing on props.
        const isVisible = child.props['data-step'] === currentStep;
        return (
          <div
            key={child.key}
            className="transition-all duration-300 ease-in-out col-start-1 row-start-1"
            style={{
              opacity: isVisible ? 1 : 0,
              filter: `blur(${isVisible ? '0px' : '8px'})`,
              transform: `scale(${isVisible ? 1 : 0.98})`,
              pointerEvents: isVisible ? 'auto' : 'none',
              visibility: isVisible ? 'visible' : 'hidden',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
};

export default StepTransition;