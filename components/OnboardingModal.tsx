
import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { IS_MOCK_MODE } from '../lib/env';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  shopName: string;
  address: string;
}

interface FormErrors {
  shopName?: string;
  address?: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    address: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const resetState = () => {
    setFormData({ shopName: '', address: '' });
    setErrors({});
    setLoading(false);
    setApiError('');
  }

  const handleClose = () => {
    setTimeout(() => {
      resetState();
    }, 300);
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    // FIX: Use 'fieldIsRequired' translation key.
    if (!formData.shopName.trim()) newErrors.shopName = t.fieldIsRequired;
    // FIX: Use 'fieldIsRequired' translation key.
    if (!formData.address.trim()) newErrors.address = t.fieldIsRequired;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) {
      return;
    }
    if (!IS_MOCK_MODE && !user) {
      return;
    }

    setLoading(true);

    if (IS_MOCK_MODE) {
      console.log("Mock Mode: Simulating shop creation.", { formData });
      setTimeout(() => {
        setLoading(false);
        handleClose();
      }, 1500);
      return;
    }

    try {
      const { error } = await supabase.from('shops').insert({
        email: user!.email,
        name: formData.shopName,
        address_line1: formData.address,
      });

      if (error) {
        throw new Error(error.message);
      }

      // On success, close the modal.
      handleClose();

    } catch (e: any) {
      console.error('Shop Creation Error:', e);
      setApiError(e.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
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
        className="card w-full max-w-lg transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        style={{ animationFillMode: 'forwards' }}
      >
        <button
          onClick={handleClose}
          className="btn btn-ghost absolute top-4 right-4 p-2"
          aria-label={t.closeModal}
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold text-neutral-dark mb-2">
            {t.onboardingTitle}
          </h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            {t.onboardingSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 mb-6">
            {/* Shop Name */}
            <div>
              <label htmlFor="shopNameOnboarding" className="form-label text-left">{t.shopName}</label>
              <input
                type="text"
                name="shopName"
                id="shopNameOnboarding"
                value={formData.shopName}
                onChange={handleInputChange}
                placeholder={t.shopNamePlaceholder}
                className={`form-input ${errors.shopName ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {errors.shopName && <p className="form-error text-left">{errors.shopName}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="addressOnboarding" className="form-label text-left">{t.address}</label>
              <input
                type="text"
                name="address"
                id="addressOnboarding"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={t.addressPlaceholder}
                className={`form-input ${errors.address ? 'border-red-500 focus:border-red-500' : ''}`}
                required
              />
              {errors.address && <p className="form-error text-left">{errors.address}</p>}
            </div>
          </div>

          {apiError && <p className="form-error text-center">{apiError}</p>}

          <button type="submit" disabled={loading} className="btn btn-primary w-full text-lg py-3 px-8">
            {loading ? t.creatingShop : t.createShop}
          </button>
        </form>
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

export default OnboardingModal;
