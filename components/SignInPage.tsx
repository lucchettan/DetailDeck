
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CloseIcon } from '../Icons';

const SignInPage: React.FC = () => {
  const { t } = useLanguage();
  const { signUp, logIn, resendSignUpConfirmation, resetPasswordForEmail } = useAuth();

  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showResend, setShowResend] = useState(false);

  const cleanState = (clearEmail = false) => {
    if (clearEmail) setEmail('');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
    setError('');
    setMessage('');
    setShowResend(false);
  };

  const handleOnboardingSuccess = () => {
    // In a real app, this could trigger a welcome tour or other actions.
    // For now, the router will handle redirecting to the dashboard.
    console.log("Sign up and onboarding successful");
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await resendSignUpConfirmation(email);
    if (error) {
      setError(error.message);
    } else {
      setMessage(t.confirmationSent);
      setShowResend(false);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setShowResend(false);

    if (view === 'signup') {
      if (password.length < 6) {
        setError(t.passwordTooShort);
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError(t.passwordMismatch);
        setLoading(false);
        return;
      }
      const { data, error: signUpError } = await signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message.includes('User already registered') ? t.emailExistsError : signUpError.message);
      } else if (data.user) {
        // App's router will detect the user object and redirect to dashboard
        handleOnboardingSuccess();
      }
    } else if (view === 'login') {
      const { error: loginError } = await logIn({ email, password });
      if (loginError) {
        if (loginError.message === 'Email not confirmed') {
          setError(t.unconfirmedEmailError);
          setShowResend(true);
        } else {
          setError(loginError.message);
        }
      }
      // On success, the AuthContext updates, and the App router will redirect.
    } else { // forgotPassword view
      const { error: resetError } = await resetPasswordForEmail(email);
      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage(t.resetLinkSent);
      }
    }
    setLoading(false);
  };

  const title = view === 'login' ? t.loginTitle : view === 'signup' ? t.signUpTitle : t.resetPassword;
  const subtitle = view === 'login' ? t.loginSubtitle : view === 'signup' ? t.signUpSubtitle : t.resetPasswordSubtitle;
  const buttonText = view === 'login' ? t.login : view === 'signup' ? t.signUp : t.sendResetLink;

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4">
      <a href="/" className="flex items-center mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">
          <span>Resa</span><span className="text-brand-blue">One</span>
        </h1>
      </a>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <a
          href="/"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close and return to homepage"
        >
          <CloseIcon className="w-6 h-6" />
        </a>
        <div className="text-center">
          <h2 id="modal-title" className="text-2xl font-bold text-brand-dark mb-2">
            {title}
          </h2>
          <p className="text-brand-gray mb-6">
            {subtitle}
          </p>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition"
                aria-label={t.emailAddress}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {(view === 'login' || view === 'signup') && (
                <input
                  type="password"
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition"
                  aria-label={t.password}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              {view === 'signup' && (
                <input
                  type="password"
                  placeholder={t.confirmPassword}
                  className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 shadow-sm focus:border-brand-blue focus:ring-1 focus:ring-brand-blue focus:outline-none transition"
                  aria-label={t.confirmPassword}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {showResend && (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm text-brand-blue hover:underline disabled:opacity-70 disabled:cursor-wait"
                >
                  {t.resendConfirmation}
                </button>
              )}
              {message && <p className="text-green-600 text-sm text-center">{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? '...' : buttonText}
              </button>
            </div>
          </form>
          <div className="mt-6 text-sm">
            {view === 'login' && (
              <>
                <button onClick={() => { setView('forgotPassword'); cleanState(); }} className="text-brand-blue hover:underline">
                  {t.forgotPassword}
                </button>
                <p className="mt-2 text-brand-gray">{t.dontHaveAccount} <button onClick={() => { setView('signup'); cleanState(); }} className="font-semibold text-brand-blue hover:underline">{t.signUp}</button></p>
              </>
            )}
            {view === 'signup' && (
              <p className="text-brand-gray">{t.alreadyHaveAccount} <button onClick={() => { setView('login'); cleanState(); }} className="font-semibold text-brand-blue hover:underline">{t.login}</button></p>
            )}
            {view === 'forgotPassword' && (
              <button onClick={() => { setView('login'); cleanState(); }} className="text-brand-blue hover:underline">
                {t.backToLogin}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
