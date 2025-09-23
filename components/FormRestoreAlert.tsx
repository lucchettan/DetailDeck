import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface FormRestoreAlertProps {
  isVisible: boolean;
  onRestore: () => void;
  onDismiss: () => void;
}

const FormRestoreAlert: React.FC<FormRestoreAlertProps> = ({
  isVisible,
  onRestore,
  onDismiss
}) => {
  const { t } = useLanguage();

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Formulaire sauvegardé trouvé
          </h3>
          <p className="mt-1 text-sm text-blue-600">
            Nous avons trouvé un formulaire que vous aviez commencé. Voulez-vous le restaurer ?
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onRestore}
              className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Restaurer
            </button>
            <button
              onClick={onDismiss}
              className="bg-gray-200 text-gray-800 px-3 py-1 text-sm rounded hover:bg-gray-300 transition-colors"
            >
              Ignorer
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-blue-400 hover:text-blue-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FormRestoreAlert;
