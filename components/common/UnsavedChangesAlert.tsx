import React, { useEffect } from 'react';

interface UnsavedChangesAlertProps {
  hasUnsavedChanges: boolean;
  message?: string;
}

export const UnsavedChangesAlert: React.FC<UnsavedChangesAlertProps> = ({
  hasUnsavedChanges,
  message = "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?"
}) => {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        // User is switching tabs or minimizing
        console.log('⚠️ User left tab with unsaved changes');
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges, message]);

  // Show a visual indicator if there are unsaved changes
  if (hasUnsavedChanges) {
    return (
      <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg shadow-lg z-50">
        <div className="flex items-center">
          <span className="text-sm font-medium">⚠️ Modifications non sauvegardées</span>
        </div>
      </div>
    );
  }

  return null;
};



