import React, { useEffect, useRef } from 'react';
import { CloseIcon } from '../Icons';
import BookingFlow from './BookingFlow';
import { useLanguage } from '../../contexts/LanguageContext';

interface BookingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
}

const BookingPreviewModal: React.FC<BookingPreviewModalProps> = ({ isOpen, onClose, shopId }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale flex flex-col"
        style={{ animationFillMode: 'forwards' }}
      >
        <header className="flex justify-between items-center p-4 border-b bg-white rounded-t-xl flex-shrink-0">
            <h2 className="text-lg font-bold text-brand-dark">{t.previewPage}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
        </header>
        <div className="overflow-y-auto flex-grow">
            <BookingFlow shopId={shopId} />
        </div>
      </div>
       <style>{`
        @keyframes fade-in-scale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
      `}</style>
    </div>
  );
};

export default BookingPreviewModal;