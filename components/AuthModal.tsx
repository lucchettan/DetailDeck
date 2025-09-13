import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { IS_MOCK_MODE } from '../lib/env';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUpSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignUpSuccess }) => {
  const { t } = useLanguage();
  const { signUp, logIn } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [isLoginView, setIsLoginView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const resetState = () => {
    setIsLoginView(false);
    setEmail('');
    setPassword('');
    setLoading(false);
    setError('');
    setMessage('');
  };

  const handleClose = () => {
    // Add a small delay for the animation
    setTimeout(() => {
        resetState();
    }, 300);
    onClose();
  }

  useEffect(() => {
    if (isOpen) {
        resetState();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (IS_MOCK_MODE) {
        console.log("Mock Mode: Simulating auth.", { email, isLoginView });
        setTimeout(() => {
            if (isLoginView) {
                handleClose();
            } else {
                if (onSignUpSuccess) {
                    onSignUpSuccess();
                } else {
                    handleClose();
                }
            }
            setLoading(false);
        }, 1000);
        return;
    }

    if (isLoginView) {
      const { error } = await logIn({ email, password });
      if (error) {
        setError(error.message);
      } else {
        handleClose();
      }
    } else {
      const { data, error } = await signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        if (data.user) {
          if (onSignUpSuccess) {
            onSignUpSuccess();
          } else {
            handleClose();
          }
        } else {
          // Fallback for cases where user confirmation is required
          setMessage('Check your email for the confirmation link!');
          setTimeout(handleClose, 3000);
        }
      }
    }
    setLoading(false);
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
        
        <div className="text-center">
          <h2 id="modal-title" className="text-2xl font-bold text-brand-dark mb-2">
            {isLoginView ? t.loginTitle : t.getStartedTitle}
          </h2>
          <p className="text-brand-gray mb-6">
            {isLoginView ? t.loginSubtitle : t.getStartedSubtitle}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:outline-none transition"
                aria-label={t.emailAddress}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
               <input
                type="password"
                placeholder={t.passwordPlaceholder}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:outline-none transition"
                aria-label={t.password}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {message && <p className="text-green-600 text-sm text-center">{message}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? '...' : (isLoginView ? t.login : t.signup)}
              </button>
            </div>
          </form>

           <div className="mt-6 text-sm">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-brand-blue hover:underline">
              {isLoginView ? t.dontHaveAccount : t.alreadyHaveAccount} {isLoginView ? t.signup : t.login}
            </button>
          </div>
        </div>
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

export default AuthModal;