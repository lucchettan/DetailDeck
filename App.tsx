
import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { trackEvent } from './lib/analytics';

import LandingPage from './components/LandingPage';
import SignInPage from './components/SignInPage';
import Dashboard from './components/Dashboard';
import BookingPage from './components/BookingPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    trackEvent('page_view');

    const onLocationChange = () => {
      setPath(window.location.pathname);
    };

    // Listen to popstate for browser back/forward navigation
    window.addEventListener('popstate', onLocationChange);

    // Custom event for programmatic navigation
    const handlePushState = () => {
      onLocationChange();
    };
    window.addEventListener('pushstate', handlePushState);

    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener('pushstate', handlePushState);
    };
  }, []);

  // Custom navigation function to update state and history
  const navigate = (newPath: string) => {
    // This check is a workaround for the preview environment's security restrictions.
    // In a sandboxed iframe, pushState can fail if the path is interpreted as cross-origin.
    const isPreviewEnvironment = window.location.origin.includes('scf.usercontent.goog');

    if (isPreviewEnvironment) {
      // In preview, directly update the state to change the view without altering browser history.
      // This avoids the cross-origin error but sacrifices back/forward button functionality in the preview.
      setPath(newPath);
    } else {
      // In a standard environment, update the browser history as usual.
      window.history.pushState({}, '', newPath);
      window.dispatchEvent(new Event('pushstate'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  // --- ROUTING LOGIC ---

  const reservationMatch = path.match(/^\/reservation\/([0-9a-fA-F\-]+)/);
  if (reservationMatch) {
    const shopId = reservationMatch[1];
    return <BookingPage shopId={shopId} />;
  }

  if (path.startsWith('/dashboard')) {
    if (user) {
      return <Dashboard />;
    } else {
      // Redirect to signin, preserving the intended destination
      const returnTo = path;
      navigate(`/signin?returnTo=${encodeURIComponent(returnTo)}`);
      return <SignInPage />;
    }
  }

  if (path === '/signin') {
    if (user) {
      navigate('/dashboard');
      return <Dashboard />;
    }
    return <SignInPage />;
  }

  // Default to Landing Page
  return <LandingPage navigate={navigate} />;
}


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
