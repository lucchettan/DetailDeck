
import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message }) => {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      aria-labelledby="alert-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        style={{ animationFillMode: 'forwards' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t.closeModal}
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="text-left">
          <h2 id="alert-modal-title" className="text-xl font-bold text-brand-dark mb-4">
            {title}
          </h2>
          <p className="text-brand-gray whitespace-pre-wrap">{typeof message === 'object' ? JSON.stringify(message, null, 2) : message}</p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-all"
            >
              OK
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AlertModal;