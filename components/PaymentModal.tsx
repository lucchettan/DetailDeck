

import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { STRIPE_PRICE_IDS } from '../constants';
import { supabase } from '../lib/supabaseClient';
import { IS_MOCK_MODE, VITE_STRIPE_PUBLISHABLE_KEY } from '../lib/env';
import { SelectedPlan } from '../App';

declare const Stripe: any;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SelectedPlan;
  onLoginClick: () => void;
}

interface FormData {
  shopName: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
}

interface FormErrors {
  shopName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phone?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, plan, onLoginClick }) => {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<FormData>({
    shopName: '',
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [userExists, setUserExists] = useState(false);

  const resetState = () => {
    setFormData({ shopName: '', email: '', firstName: '', lastName: '', address: '', phone: '' });
    setErrors({});
    setLoading(false);
    setApiError('');
    setUserExists(false);
  }

  const handleClose = () => {
    setTimeout(() => {
        resetState();
    }, 300);
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.shopName.trim()) newErrors.shopName = t.requiredField;
    if (!formData.firstName.trim()) newErrors.firstName = t.requiredField;
    if (!formData.lastName.trim()) newErrors.lastName = t.requiredField;
    if (!formData.email.trim()) {
      newErrors.email = t.requiredField;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = t.emailValidationError;
    }
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
    setUserExists(false);

    if (!validate()) {
      return;
    }

    setLoading(true);

    if (IS_MOCK_MODE) {
      console.log("Mock Mode: Simulating form submission.", { formData, plan });
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("This is a mock checkout flow. Your data has been logged to the console, and you would normally be redirected to Stripe to complete your payment.");
      setLoading(false);
      handleClose();
      return;
    }

    try {
      // Step 1: Check if user already exists BEFORE payment
      const { data: userExists, error: rpcError } = await supabase.rpc('check_user_exists', { email_to_check: formData.email });

      if (rpcError) {
          console.error("RPC Error (check_user_exists):", rpcError);
          throw new Error("Could not verify your email. Please try again.");
      }

      if (userExists) {
          setApiError(t.emailExistsError);
          setUserExists(true);
          setLoading(false);
          return;
      }

      // Step 2: Save data to Supabase (as a sales lead)
      const { error: dbError } = await supabase.from('sales_leads').insert({
        shop_name: formData.shopName,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        address: formData.address,
        phone: formData.phone,
        selected_plan: `${plan.name} (${plan.billingCycle})`,
      });

      if (dbError) {
        throw new Error(dbError.message);
      }
      
      // Step 3: Redirect to Stripe
      if (!VITE_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key is not set.');
      }

      // Save user info to local storage to be picked up on the success page
      localStorage.setItem('pendingSignup', JSON.stringify({ formData, plan }));

      const stripe = Stripe(VITE_STRIPE_PUBLISHABLE_KEY);
      
      const { id, billingCycle } = plan;
      let priceId;
      const regularPrices = STRIPE_PRICE_IDS.regular[id];

      if (billingCycle === 'monthly' || billingCycle === 'yearly') {
        priceId = (regularPrices as any)[billingCycle];
      } else {
        priceId = (regularPrices as any).onetime;
      }
      
      const mode = billingCycle === 'onetime' ? 'payment' : 'subscription';

      if (!priceId || priceId.includes('REPLACE_WITH')) {
        throw new Error(`Stripe Price ID for ${plan.name} ${billingCycle} is not configured.`);
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
        localStorage.removeItem('pendingSignup'); // Clean up on failure
        throw new Error(stripeError.message);
      }

    } catch (e: any) {
      console.error('Payment Submission Error:', e);
      let userMessage = e.message || 'An unexpected error occurred. Please try again.';
      if (typeof e.message === 'string' && e.message.includes('No such price')) {
          userMessage = "It seems there's an issue with the selected payment plan. Please contact support.";
      }
      setApiError(userMessage);
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(errors[name as keyof FormErrors]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
    if (userExists) {
        setUserExists(false);
        setApiError('');
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
  
  const billingCycleText = plan.billingCycle === 'onetime' ? t.lifetime : (plan.billingCycle === 'monthly' ? `/ ${t.month}` : `/ ${t.year}`);

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
                Checkout
            </h2>
            <p className="text-brand-gray mb-6 text-sm sm:text-base">
                Complete your information to proceed with the payment.
            </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
            <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
                <p className="text-brand-gray">{t.youSelected} <span className="font-bold text-brand-dark">{plan.name} (€{plan.price} {billingCycleText})</span></p>
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <label htmlFor="shopName" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.shopName}</label>
                    <input type="text" name="shopName" id="shopName" value={formData.shopName} onChange={handleInputChange} placeholder={t.shopNamePlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.shopName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                    {errors.shopName && <p className="text-red-500 text-xs text-left mt-1">{errors.shopName}</p>}
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.firstName}</label>
                        <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleInputChange} placeholder={t.firstNamePlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.firstName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                        {errors.firstName && <p className="text-red-500 text-xs text-left mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.lastName}</label>
                         <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleInputChange} placeholder={t.lastNamePlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.lastName ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                        {errors.lastName && <p className="text-red-500 text-xs text-left mt-1">{errors.lastName}</p>}
                    </div>
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-brand-dark text-left mb-1">{t.address}</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleInputChange} placeholder={t.addressPlaceholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${errors.address ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
                    {errors.address && <p className="text-red-500 text-xs text-left mt-1">{errors.address}</p>}
                </div>
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

            {apiError && (
              <div className="text-center bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{apiError}</p>
                  {userExists && (
                      <button
                          type="button"
                          onClick={onLoginClick}
                          className="mt-2 bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition-all text-sm"
                      >
                          {t.login}
                      </button>
                  )}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-75 disabled:cursor-not-allowed">
                {loading ? t.redirecting : 'Proceed to Payment'}
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

export default PaymentModal;
