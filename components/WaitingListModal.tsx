import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon, CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { IS_MOCK_MODE } from '../lib/env';

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitingListModal: React.FC<WaitingListModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const calendlyLink = "https://calendly.com/lucchettan/30min";

  const resetState = () => {
    setEmail('');
    setLoading(false);
    setSuccess(false);
    setError('');
  };

  const handleClose = () => {
    // Add a small delay to allow the modal to animate out before resetting state
    setTimeout(() => {
        resetState();
    }, 300);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(t.emailValidationError);
      return;
    }
    setLoading(true);

    if (IS_MOCK_MODE) {
        console.log("Mock Mode: Simulating adding email to waiting list.", { email });
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
        }, 1000);
        return;
    }

    const { error } = await supabase.from('waiting_list').insert({ email: email });

    setLoading(false);
    if (error) {
      // Basic error handling for unique constraint violation
      if (error.code === '23505') {
        setError('This email is already on the waiting list.');
      } else {
        setError(error.message);
      }
    } else {
      setSuccess(true);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
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

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        style={{ animationFillMode: 'forwards' }}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t.closeModal}
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        
        {success ? (
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
                <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 id="modal-title" className="text-2xl font-bold text-brand-dark mb-2">
                {t.waitingListSuccess}
            </h2>
            <p className="text-brand-gray mb-6">
                {t.waitingListSuccessSubtitle}
            </p>
             <button 
                onClick={handleClose}
                className="w-full bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300"
              >
                {t.close}
              </button>
          </div>
        ) : (
          <div className="text-center">
            <h2 id="modal-title" className="text-2xl font-bold text-brand-dark mb-2">
              {t.waitingListTitle}
            </h2>
            <p className="text-brand-gray mb-6">
              {t.waitingListSubtitle}
            </p>

            <form onSubmit={handleSubmit} className="mb-6">
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder={t.emailAddress}
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition disabled:bg-gray-100 disabled:text-gray-500"
                  aria-label={t.emailAddress}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                {error && <p className="text-red-500 text-sm text-left">{error}</p>}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {loading ? t.joining : t.notifyMe}
                </button>
              </div>
            </form>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-brand-gray text-sm">{t.waitingListOr}</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <a
                href={calendlyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-4 block text-center bg-white text-brand-blue font-bold py-3 px-8 rounded-lg text-lg border-2 border-brand-blue hover:bg-blue-50 transition-all duration-300"
            >
                {t.waitingListDemoAction}
            </a>

          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in-scale {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in-scale {
          animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default WaitingListModal;