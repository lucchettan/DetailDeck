import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { STRIPE_PRICE_IDS } from '../constants';
import StepTransition from './StepTransition';
import { supabase } from '../lib/supabaseClient';
import { IS_MOCK_MODE, VITE_STRIPE_PUBLISHABLE_KEY } from '../lib/env';

// This is necessary when using the Stripe script via a CDN
declare const Stripe: any;

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  shopName: string;
  email: string;
  shopType: 'mobile' | 'fixed' | '';
  address: string;
  phone: string;
}

interface FormErrors {
  shopName?: string;
  email?: string;
  shopType?: string;
  address?: string;
  phone?: string;
}

const EarlyAccessModal: React.FC<EarlyAccessModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState('1');
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'business' | 'lifetime'>('business');
  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    email: '',
    shopType: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const resetState = () => {
    setStep('1');
    setSelectedPlan('business');
    setFormData({ shopName: '', email: '', shopType: '', address: '', phone: '' });
    setErrors({});
    setLoading(false);
    setApiError('');
  }

  const handleClose = () => {
    // Add a small delay to allow the modal to animate out before resetting state
    setTimeout(() => {
        resetState();
    }, 300);
    onClose();
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.shopName.trim()) newErrors.shopName = t.requiredField;
    if (!formData.email.trim()) {
      newErrors.email = t.requiredField;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t.emailValidationError;
    }
    if (!formData.shopType) newErrors.shopType = t.requiredField;
    if (!formData.address.trim()) newErrors.address = t.requiredField;
    if (!formData.phone.trim()) {
      newErrors.phone = t.requiredField;
    } else if (!/^\+?[0-9\s-()]{7,}$/.test(formData.phone)) { // Basic phone validation
      newErrors.phone = t.invalidPhone;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    if (IS_MOCK_MODE) {
      console.log("Mock Mode: Simulating form submission.", { formData, selectedPlan });
      // Simulate a short delay for a more realistic feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("This is a mock checkout flow. Your data has been logged to the console, and you would normally be redirected to Stripe to complete your payment.");
      setLoading(false);
      handleClose();
      return;
    }

    try {
      // Step 1: Save data to Supabase
      const { error: dbError } = await supabase.from('early_access_signups').insert({
        shop_name: formData.shopName,
        email: formData.email,
        shop_type: formData.shopType,
        address: formData.address,
        phone: formData.phone,
        selected_plan: selectedPlan,
      });

      if (dbError) {
        throw new Error(dbError.message);
      }
      
      // Step 2: Redirect to Stripe if DB insert is successful
      if (!VITE_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key is not set.');
      }

      const stripe = Stripe(VITE_STRIPE_PUBLISHABLE_KEY);
      
      let priceId;
      // All early access offers are treated as one-time payments for this initial transaction.
      const mode: 'payment' | 'subscription' = 'payment';

      // Fix: Correctly access the nested early access price IDs.
      if (selectedPlan === 'solo') {
        priceId = STRIPE_PRICE_IDS.earlyAccess.solo;
      } else if (selectedPlan === 'business') {
        priceId = STRIPE_PRICE_IDS.earlyAccess.business;
      } else {
        priceId = STRIPE_PRICE_IDS.earlyAccess.lifetime;
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: mode,
        customerEmail: formData.email,
        successUrl: `${window.location.origin}?payment_success=true`,
        cancelUrl: window.location.origin,
      });

      if (stripeError) {
        console.error("Stripe redirectToCheckout error:", stripeError);
        console.error("Attempted to use Price ID:", priceId, "for plan:", selectedPlan);
        throw new Error(stripeError.message);
      }

    } catch (e: any) {
      console.error('Early Access Submission Error:', e);
      let userMessage = e.message || 'An unexpected error occurred. Please try again.';
      // Provide a more user-friendly error for the most common Stripe issue.
      if (typeof e.message === 'string' && e.message.includes('No such price')) {
          userMessage = "It seems there's an issue with the selected payment plan. Please contact support.";
      }
      setApiError(userMessage);
      setLoading(false);
    }
  };

  const handlePlanSelectAndProceed = (plan: 'solo' | 'business' | 'lifetime') => {
    setSelectedPlan(plan);
    setStep('2');
  };

  const handlePrevStep = () => {
    setApiError('');
    setErrors({});
    setStep('1');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(errors[name as keyof FormErrors]) {
        setErrors(prev => ({...prev, [name]: undefined}));
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

  const planDetails = {
    solo: { 
      title: t.soloPlanTitle, 
      price: '€400', 
      period: t.perFirstYear 
    },
    business: { 
      title: t.businessPlanTitle, 
      price: '€750', 
      period: t.perFirstYear 
    },
    lifetime: { 
      title: t.earlyAccessLifetimeTitle, 
      price: '€1250', 
      period: ` / ${t.lifetime}` 
    },
  };
  const selectedPlanDetails = planDetails[selectedPlan];


  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
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
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">
                {t.earlyAccessTitle}
            </h2>
            <p className="text-brand-gray mb-6 text-sm sm:text-base">
                {step === '1' ? t.earlyAccessStep1 : t.earlyAccessStep2}
            </p>
        </div>

        <StepTransition currentStep={step}>
            <div key="1" data-step="1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 md:min-h-[280px]">
                    {/* Solo Plan */}
                    <button type="button" onClick={() => handlePlanSelectAndProceed('solo')} className={`border rounded-lg p-4 bg-brand-light transition-all duration-300 focus:outline-none h-full ${selectedPlan === 'solo' ? 'border-brand-blue ring-2 ring-brand-blue' : 'border-gray-200 hover:border-gray-400'}`}>
                        <div>
                          <h3 className="text-lg font-bold text-brand-dark">{t.soloPlanTitle}</h3>
                          <p className="text-brand-gray text-sm mt-1">{t.soloPlanDescription}</p>
                          <div className="my-3">
                              <span className="text-3xl font-extrabold text-brand-dark">€400</span>
                              <span className="text-brand-gray text-sm"> {t.perFirstYear}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500"><span className="line-through">€550</span> {t.standardPrice}</p>
                    </button>

                    {/* Business Plan */}
                    <button type="button" onClick={() => handlePlanSelectAndProceed('business')} className={`border rounded-lg p-4 bg-blue-50 relative transition-all duration-300 focus:outline-none h-full ${selectedPlan === 'business' ? 'border-brand-blue ring-2 ring-brand-blue' : 'border-gray-200 hover:border-gray-400'}`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">{t.bestValue}</div>
                        <div>
                          <h3 className="text-lg font-bold text-brand-dark">{t.businessPlanTitle}</h3>
                          <p className="text-brand-gray text-sm mt-1">{t.businessPlanDescription}</p>
                          <div className="my-3">
                              <span className="text-3xl font-extrabold text-brand-dark">€750</span>
                              <span className="text-brand-gray text-sm"> {t.perFirstYear}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500"><span className="line-through">€1500</span> {t.standardPrice}</p>
                    </button>

                    {/* Lifetime Plan */}
                     <button type="button" onClick={() => handlePlanSelectAndProceed('lifetime')} className={`border rounded-lg p-4 bg-yellow-50 relative transition-all duration-300 focus:outline-none h-full ${selectedPlan === 'lifetime' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-200 hover:border-gray-400'}`}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">{t.bestDeal}</div>
                        <div>
                          <h3 className="text-lg font-bold text-brand-dark">{t.earlyAccessLifetimeTitle}</h3>
                          <p className="text-brand-gray text-sm mt-1">{t.earlyAccessLifetimeDescription}</p>
                          <div className="my-3">
                              <span className="text-3xl font-extrabold text-brand-dark">€1250</span>
                              <span className="text-brand-gray text-sm"> / {t.lifetime}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500"><span className="line-through">€3000</span> {t.standardPrice}</p>
                    </button>
                </div>
            </div>

            <form key="2" data-step="2" onSubmit={handleSubmit} noValidate>
                <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
                    <p className="text-brand-gray">{t.youSelected} <span className="font-bold text-brand-dark">{selectedPlanDetails.title} ({selectedPlanDetails.price}{selectedPlanDetails.period})</span></p>
                </div>

                <div className="space-y-4 mb-6">
                    {/* Shop Name & Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="shopName" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.shopName}</label>
                            <input type="text" name="shopName" id="shopName" value={formData.shopName} onChange={handleInputChange} placeholder={t.shopNamePlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.shopName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                            {errors.shopName && <p className="text-red-500 text-xs text-left mt-1">{errors.shopName}</p>}
                        </div>
                        <div>
                            <label htmlFor="shopType" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.shopType}</label>
                            <select name="shopType" id="shopType" value={formData.shopType} onChange={handleInputChange} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.shopType ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required>
                                <option value="" disabled>{t.shopTypeSelect}</option>
                                <option value="mobile">{t.mobileShop}</option>
                                <option value="fixed">{t.fixedLocationShop}</option>
                            </select>
                            {errors.shopType && <p className="text-red-500 text-xs text-left mt-1">{errors.shopType}</p>}
                        </div>
                    </div>
                    {/* Address */}
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.address}</label>
                        <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} placeholder={t.addressPlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.address ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                        {errors.address && <p className="text-red-500 text-xs text-left mt-1">{errors.address}</p>}
                    </div>
                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.emailAddress}</label>
                            <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} placeholder={t.emailPlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.email ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                            {errors.email && <p className="text-red-500 text-xs text-left mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.phoneNumber}</label>
                            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} placeholder={t.phoneNumberPlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.phone ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                            {errors.phone && <p className="text-red-500 text-xs text-left mt-1">{errors.phone}</p>}
                        </div>
                    </div>
                </div>

                {apiError && <p className="text-red-500 text-sm text-center mb-4">{apiError}</p>}

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                    <button type="button" onClick={handlePrevStep} className="w-full sm:w-auto bg-gray-200 text-brand-dark font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-300 transition-all duration-300">
                        {t.previousStep}
                    </button>
                    <button type="submit" disabled={loading} className="flex-grow bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30 disabled:opacity-75 disabled:cursor-not-allowed">
                        {loading ? t.redirecting : t.claimDiscountAndPay}
                    </button>
                </div>
            </form>
        </StepTransition>
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

export default EarlyAccessModal;