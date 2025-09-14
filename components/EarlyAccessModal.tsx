
import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon, CheckIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { STRIPE_PRICE_IDS } from '../constants';
import StepTransition from './StepTransition';
import { supabase } from '../lib/supabaseClient';
import { IS_MOCK_MODE, VITE_STRIPE_PUBLISHABLE_KEY } from '../lib/env';
import { SelectedPlan, SelectedPlanId } from '../App';

// This is necessary when using the Stripe script via a CDN
declare const Stripe: any;

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const EarlyAccessModal: React.FC<EarlyAccessModalProps> = ({ isOpen, onClose, onLoginClick }) => {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState('1');
  const [selectedPlanId, setSelectedPlanId] = useState<SelectedPlanId>('solo');
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

  const planInfo: Record<SelectedPlanId, SelectedPlan> = {
    solo: { id: 'solo', name: t.soloPlanTitle, billingCycle: 'yearly', price: '400' },
    lifetime: { id: 'lifetime', name: t.lifetimePlanTitle, billingCycle: 'onetime', price: '1000' }
  };

  const resetState = () => {
    setStep('1');
    setSelectedPlanId('solo');
    setFormData({ shopName: '', email: '', firstName: '', lastName: '', address: '', phone: '' });
    setErrors({});
    setLoading(false);
    setApiError('');
    setUserExists(false);
  }

  const handleClose = () => {
    setTimeout(resetState, 300);
    onClose();
  };

  const validateStep2 = (): boolean => {
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

    if (!validateStep2()) return;
    setLoading(true);

    if (IS_MOCK_MODE) {
      console.log("Mock Mode: Simulating form submission.", { formData, selectedPlanId });
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("This is a mock checkout flow. Your data has been logged to the console.");
      setLoading(false);
      handleClose();
      return;
    }

    try {
      const { data: userExistsData, error: rpcError } = await supabase.rpc('check_user_exists', { email_to_check: formData.email });
      if (rpcError) {
          console.error("RPC Error:", rpcError);
          throw new Error("Could not verify your email. Please try again.");
      }
      if (userExistsData) {
        setApiError(t.emailExistsError);
        setUserExists(true);
        setLoading(false);
        return;
      }

      const { error: dbError } = await supabase.from('early_access_signups').insert({
        shop_name: formData.shopName,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        address: formData.address,
        phone: formData.phone,
        selected_plan: selectedPlanId,
      });
      if (dbError) throw new Error(dbError.message);
      
      if (!VITE_STRIPE_PUBLISHABLE_KEY) throw new Error('Stripe publishable key is not set.');

      const planToSave = planInfo[selectedPlanId];
      localStorage.setItem('pendingSignup', JSON.stringify({ formData, plan: planToSave }));

      const stripe = Stripe(VITE_STRIPE_PUBLISHABLE_KEY);
      const priceId = STRIPE_PRICE_IDS.earlyAccess[selectedPlanId];

      const { error: stripeError } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        customerEmail: formData.email,
        successUrl: `${window.location.origin}?payment_success=true`,
        cancelUrl: window.location.origin,
      });

      if (stripeError) {
        localStorage.removeItem('pendingSignup');
        throw new Error(stripeError.message);
      }

    } catch (e: any) {
      console.error('Early Access Submission Error:', e);
      let userMessage = e.message || 'An unexpected error occurred. Please try again.';
      if (typeof e.message === 'string' && e.message.includes('No such price')) {
          userMessage = "It seems there's an issue with the selected payment plan. Please contact support.";
      }
      setApiError(userMessage);
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: SelectedPlanId) => {
    setSelectedPlanId(plan);
    setStep('2'); // Automatically go to the next step
  };
  
  const handlePrevStep = () => {
    setApiError('');
    setErrors({});
    setUserExists(false);
    setStep('1');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (event.key === 'Escape') handleClose();
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) handleClose();
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
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const selectedPlanDetails = planInfo[selectedPlanId];

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto transition-opacity duration-300"
      role="dialog" aria-modal="true"
    >
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg md:max-w-4xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale my-8"
        style={{ animationFillMode: 'forwards' }}
      >
        <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
            aria-label={t.closeModal}
        >
            <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="p-6 sm:p-8 relative overflow-hidden">
          <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-2">{t.earlyAccessTitle}</h2>
              <p className="text-brand-gray text-sm sm:text-base">{t.earlyAccessSubtitle}</p>
              <p className="text-brand-gray text-xs sm:text-sm mt-2 font-semibold">{step === '1' ? t.earlyAccessStep1 : t.earlyAccessStep2}</p>
          </div>

          <StepTransition currentStep={step}>
              <div key="1" data-step="1">
                  <div className="flex flex-col md:flex-row gap-4">
                      {/* Solo Plan */}
                      <PlanCard 
                        title={t.soloPlanTitle} 
                        description={t.soloPlanCardTitle}
                        features={[t.soloPlanFeature1, t.soloPlanFeature2, t.soloPlanFeature3]}
                        priceInfo={t.soloPlanPrice}
                        tag={t.bestValue} 
                        isSelected={selectedPlanId === 'solo'}
                        onClick={() => handlePlanSelect('solo')}
                      />
                      {/* Lifetime Plan */}
                      <PlanCard 
                        title={t.lifetimePlanTitle} 
                        description={t.lifetimePlanCardTitle}
                        features={[t.lifetimePlanFeature1, t.lifetimePlanFeature2, t.lifetimePlanFeature3]}
                        priceInfo={t.lifetimePlanPrice}
                        tag={t.bestDeal} 
                        isFeatured={true}
                        isSelected={selectedPlanId === 'lifetime'}
                        onClick={() => handlePlanSelect('lifetime')}
                      />
                  </div>
              </div>

              <form key="2" data-step="2" onSubmit={handleSubmit} noValidate>
                  <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-sm">
                      <p className="text-brand-gray">{t.youSelected} <span className="font-bold text-brand-dark">{selectedPlanDetails.name}</span></p>
                  </div>

                  <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label={t.firstName} name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder={t.firstNamePlaceholder} error={errors.firstName} />
                        <InputField label={t.lastName} name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder={t.lastNamePlaceholder} error={errors.lastName} />
                      </div>
                      <InputField label={t.shopName} name="shopName" value={formData.shopName} onChange={handleInputChange} placeholder={t.shopNamePlaceholder} error={errors.shopName} />
                      <InputField label={t.address} name="address" value={formData.address} onChange={handleInputChange} placeholder={t.addressPlaceholder} error={errors.address} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InputField label={t.emailAddress} name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder={t.emailPlaceholder} error={errors.email} />
                          <InputField label={t.phoneNumber} name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder={t.phoneNumberPlaceholder} error={errors.phone} />
                      </div>
                  </div>

                  {apiError && (
                      <div className="text-center bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                          <p className="text-red-700 text-sm">{apiError}</p>
                          {userExists && (
                              <button type="button" onClick={onLoginClick} className="mt-2 bg-brand-blue text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 text-sm">{t.login}</button>
                          )}
                      </div>
                  )}

                  <div className="flex flex-col-reverse sm:flex-row gap-3">
                      <button type="button" onClick={handlePrevStep} className="w-full sm:w-auto bg-gray-200 text-brand-dark font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-300 transition-all">{t.previousStep}</button>
                      <button type="submit" disabled={loading} className="flex-grow bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:from-green-600 hover:to-teal-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-75 disabled:cursor-not-allowed">
                          {loading ? t.redirecting : t.claimDiscountAndPay}
                      </button>
                  </div>
              </form>
          </StepTransition>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards; }
      `}</style>
    </div>
  );
};

const PlanCard: React.FC<{
    title: string, 
    description: string, 
    features: string[], 
    priceInfo: { new: string, period: string, old: string }, 
    tag: string, 
    isSelected: boolean, 
    onClick: ()=>void, 
    isFeatured?: boolean
}> = ({title, description, features, priceInfo, tag, isSelected, onClick, isFeatured}) => {
    const { t } = useLanguage();
    return (
        <button type="button" onClick={onClick} className={`border rounded-lg p-4 text-left w-full h-full relative transition-all duration-300 focus:outline-none flex flex-col ${isSelected ? 'border-brand-blue ring-2 ring-brand-blue' : 'border-gray-200 hover:border-gray-400'} ${isFeatured ? 'bg-yellow-50' : 'bg-white'}`}>
            <div className={`absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full ${isFeatured ? 'bg-yellow-400 text-yellow-900' : 'bg-brand-blue text-white'}`}>{tag}</div>
            <div className="mb-3">
                <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
                <p className="text-brand-gray text-sm mt-1">{description}</p>
            </div>
            <ul className="space-y-2 mb-4 text-sm flex-grow">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-brand-gray">{feature}</span>
                    </li>
                ))}
            </ul>
             <div className="mt-auto text-center pt-4">
                <p className="text-4xl font-extrabold text-brand-dark tracking-tight">{priceInfo.new}</p>
                <p className="text-brand-gray text-sm -mt-1">{priceInfo.period}</p>
                <p className="text-xs text-brand-gray mt-2">
                    <span className="line-through">{priceInfo.old}</span>
                    <span className="font-semibold"> {t.standardPrice}</span>
                </p>
            </div>
        </button>
    );
};

const InputField: React.FC<{label: string, name: string, type?: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, error?: string}> = 
({label, name, type = 'text', value, onChange, placeholder, error}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-brand-dark text-left mb-1">{label}</label>
        <input type={type} name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className={`w-full px-4 py-2 bg-white rounded-lg border focus:ring-2 focus:outline-none transition ${error ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-brand-blue'}`} required />
        {error && <p className="text-red-500 text-xs text-left mt-1">{error}</p>}
    </div>
);


export default EarlyAccessModal;
