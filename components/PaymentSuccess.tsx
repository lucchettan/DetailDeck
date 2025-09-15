
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { SuccessIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface PaymentSuccessProps {
    onReturnToHome: () => void;
}

enum PageState {
    Initial,
    AccountSetup,
    FinalSuccess,
    Error,
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ onReturnToHome }) => {
  const { t } = useLanguage();
  const { signUp } = useAuth();

  const [pageState, setPageState] = useState<PageState>(PageState.Initial);
  const [pendingSignupData, setPendingSignupData] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawData = localStorage.getItem('pendingSignup');
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        setPendingSignupData(data);
        setPageState(PageState.AccountSetup);
      } catch (e) {
        console.error("Failed to parse pending signup data", e);
        setError("There was an issue retrieving your signup information.");
        setPageState(PageState.Error);
      }
    }
  }, []);

  const handleAccountSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }
    if (!pendingSignupData?.formData?.email || !pendingSignupData?.plan) {
      setError("Required information is missing. Cannot create account.");
      setPageState(PageState.Error);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the user. The `signUp` function in AuthContext now handles
      // setting the session if email confirmation is disabled.
      const { data: signUpData, error: authError } = await signUp({
        email: pendingSignupData.formData.email,
        password: password,
        options: {
            data: {
                shop_name: pendingSignupData.formData.shopName,
                user_first_name: pendingSignupData.formData.firstName,
                user_last_name: pendingSignupData.formData.lastName,
                address: pendingSignupData.formData.address,
                plan_id: pendingSignupData.plan.id,
                plan_name: pendingSignupData.plan.name,
                billing_cycle: pendingSignupData.plan.billingCycle,
                price: pendingSignupData.plan.price,
            }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
            setError(t.accountExistsError);
            setPageState(PageState.Error);
        } else {
            throw new Error(authError.message || 'Database error saving new user');
        }
      } else {
        // Step 2: Check if sign-up returned a session.
        // If it did not, it means email verification is required.
        // Show the success page instructing the user to check their email.
        // If a session *was* returned, the AuthContext is already updated,
        // and the main App component will handle the redirect to the dashboard.
        if (!signUpData.session) {
            setPageState(PageState.FinalSuccess);
        }
      }
      
      localStorage.removeItem('pendingSignup');

    } catch (e: any) {
      console.error('Account setup error:', e);
      let friendlyError = e.message || 'An unexpected error occurred.';
      if (typeof e.message === 'string' && e.message.includes('Database error saving new user')) {
          friendlyError = 'Database error saving new user'
      }
      setError(friendlyError);
      setPageState(PageState.Error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (pageState) {
      case PageState.AccountSetup:
        return (
          <>
            <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-2">{t.setupAccountTitle}</h1>
            <p className="text-brand-gray text-lg mb-6">
              {t.setupAccountSubtitle} <span className="font-semibold text-brand-dark">{pendingSignupData.formData.email}</span>.
            </p>
            <form onSubmit={handleAccountSetup} className="space-y-4">
              <input
                type="password"
                placeholder={t.setPassword}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder={t.confirmPassword}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-blue focus:outline-none transition"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-75"
              >
                {loading ? t.creatingYourAccount : t.completeAccountSetup}
              </button>
            </form>
          </>
        );
      
      case PageState.FinalSuccess:
        return (
            <>
                <SuccessIcon className="w-20 h-20 text-green-500 mx-auto mb-6" />
                <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-4">{t.accountCreatedTitle}</h1>
                <p className="text-brand-gray text-lg mb-8">{t.accountCreatedSubtitle}</p>
                <button
                    onClick={onReturnToHome}
                    className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                    {t.backToHomepage}
                </button>
            </>
        );
      
      case PageState.Error:
         return (
             <>
                <h1 className="text-3xl sm:text-4xl font-bold text-red-600 mb-4">An Error Occurred</h1>
                <p className="text-brand-gray text-lg mb-8">{error}</p>
                <button
                    onClick={onReturnToHome}
                    className="bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                    {t.backToHomepage}
                </button>
            </>
        );

      // Default/Initial state
      default:
        return (
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue mx-auto"></div>
        );
    }
  }


  return (
    <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center text-center p-4 antialiased">
      <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentSuccess;
