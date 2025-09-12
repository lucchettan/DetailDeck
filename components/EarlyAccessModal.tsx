
import React, { useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';
import { STRIPE_PRICE_IDS } from '../constants';

// This is necessary when using the Stripe script via a CDN
declare const Stripe: any;

interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EarlyAccessModal: React.FC<EarlyAccessModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<'solo' | 'business' | 'lifetime'>('business');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    // In a Vite project, client-side environment variables must be prefixed with VITE_
    // Fix: Use type assertion for import.meta.env as Vite client types are not available.
    const stripePublishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!stripePublishableKey) {
      console.error('Stripe publishable key is not set. Make sure VITE_STRIPE_PUBLISHABLE_KEY is set in your environment.');
      setError('Payment processing is not available at the moment.');
      setLoading(false);
      return;
    }

    try {
      const stripe = Stripe(stripePublishableKey);
      
      let priceId;
      const mode: 'payment' | 'subscription' = selectedPlan === 'lifetime' ? 'payment' : 'subscription';

      if (selectedPlan === 'solo') {
        priceId = STRIPE_PRICE_IDS.soloEarlyAccess;
      } else if (selectedPlan === 'business') {
        priceId = STRIPE_PRICE_IDS.businessEarlyAccess;
      } else {
        priceId = STRIPE_PRICE_IDS.lifetimeEarlyAccess;
      }


      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: mode,
        customerEmail: email,
        successUrl: `${window.location.origin}?payment_success=true`,
        cancelUrl: window.location.origin,
      });

      if (error) {
        console.error('Stripe Checkout error:', error);
        setError(error.message);
        setLoading(false);
      }
    } catch (e) {
      console.error('Stripe initialization error:', e);
      setError('Could not connect to payment processor.');
      setLoading(false);
    }
  };


  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
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
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl p-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        style={{ animationFillMode: 'forwards' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 id="modal-title" className="text-3xl font-bold text-brand-dark mb-2">
            {t.earlyAccessTitle}
          </h2>
          <p className="text-brand-gray mb-8 max-w-lg mx-auto">
            {t.earlyAccessSubtitle}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
            {/* Solo Plan Offer */}
            <button
              type="button"
              onClick={() => setSelectedPlan('solo')}
              className={`border rounded-lg p-6 bg-brand-light text-left transition-all duration-300 focus:outline-none h-full ${
                selectedPlan === 'solo' ? 'border-brand-blue ring-2 ring-brand-blue' : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <h3 className="text-xl font-bold text-brand-dark">Solo Plan</h3>
              <p className="text-brand-gray mt-1">For individual detailers</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-brand-dark">€400</span>
                <span className="text-brand-gray"> / first year</span>
              </div>
              <p className="text-sm text-gray-500">
                <span className="line-through">€550</span> standard price
              </p>
            </button>

            {/* Business Plan Offer */}
            <button
              type="button"
              onClick={() => setSelectedPlan('business')}
              className={`border rounded-lg p-6 bg-blue-50 relative text-left transition-all duration-300 focus:outline-none h-full ${
                selectedPlan === 'business' ? 'border-brand-blue ring-2 ring-brand-blue' : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">{t.bestValue}</div>
              <h3 className="text-xl font-bold text-brand-dark">Business Plan</h3>
              <p className="text-brand-gray mt-1">For established shops</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-brand-dark">€750</span>
                <span className="text-brand-gray"> / first year</span>
              </div>
              <p className="text-sm text-gray-500">
                <span className="line-through">€1500</span> standard price
              </p>
            </button>

            {/* Lifetime Plan Offer */}
            <button
              type="button"
              onClick={() => setSelectedPlan('lifetime')}
              className={`border rounded-lg p-6 bg-yellow-50 relative text-left transition-all duration-300 focus:outline-none h-full ${
                selectedPlan === 'lifetime' ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-200 hover:border-gray-400'
                }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">{t.bestDeal}</div>
              <h3 className="text-xl font-bold text-brand-dark">{t.earlyAccessLifetimeTitle}</h3>
              <p className="text-brand-gray mt-1">{t.earlyAccessLifetimeDescription}</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-brand-dark">€1250</span>
                <span className="text-brand-gray"> / {t.lifetime}</span>
              </div>
              <p className="text-sm text-gray-500">
                <span className="line-through">€3000</span> standard price
              </p>
            </button>
          </div>


          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="space-y-4">
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:outline-none transition"
                aria-label="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
               {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-8 rounded-lg text-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/30 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? 'Redirecting...' : t.claimOffer}
              </button>
            </div>
          </form>
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

export default EarlyAccessModal;