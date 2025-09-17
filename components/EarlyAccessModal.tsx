
import React from 'react';

// This component is temporarily disabled as the payment flow has been paused.
// The main App component will no longer render it.
const EarlyAccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}> = () => {
  return null;
};

export default EarlyAccessModal;
