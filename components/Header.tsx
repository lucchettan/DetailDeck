
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    fr: { name: 'Français', flag: '🇫🇷' },
    es: { name: 'Español', flag: '🇪🇸' }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const startTimeout = () => {
    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      closeDropdown();
    }, 2000);
  };

  useEffect(() => {
    if (isOpen) {
      startTimeout();
    } else {
      resetTimeout();
    }

    return () => {
      resetTimeout();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);


  const handleLanguageChange = (lang: 'en' | 'fr' | 'es') => {
    setLanguage(lang);
    closeDropdown();
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={resetTimeout}
      onMouseLeave={() => { if (isOpen) startTimeout() }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-link flex items-center space-x-2"
      >
        <span>{languages[language].flag}</span>
        <span className="hidden sm:inline">{languages[language].name}</span>
        <svg className="w-4 h-4 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 card z-10">
          {Object.entries(languages).map(([langCode, langDetails]) => (
            <button
              key={langCode}
              onClick={() => handleLanguageChange(langCode as 'en' | 'fr' | 'es')}
              className="navbar-link flex items-center w-full text-left"
            >
              <span className="mr-3">{langDetails.flag}</span>
              <span>{langDetails.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


const Header: React.FC<{ onDemoClick: () => void; isDemoLoading: boolean; }> = ({ onDemoClick, isDemoLoading }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <header className="navbar sticky top-0 bg-white/80 backdrop-blur-sm z-50">
      <div className="container">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-neutral-dark">
              <span>Resa</span><span className="text-primary">One</span>
            </h1>
          </a>
          <nav className="flex items-center space-x-3 sm:space-x-6">
            <LanguageSwitcher />
            {user ? (
              <a href="/dashboard" className="btn btn-primary text-sm sm:text-base">
                {t.dashboard}
              </a>
            ) : (
              <>
                <a href="#pricing" className="navbar-link hidden md:block">{t.pricing}</a>
                <a href="#faq" className="navbar-link hidden md:block">{t.faq}</a>
                <button
                  onClick={onDemoClick}
                  disabled={isDemoLoading}
                  className="btn btn-secondary text-sm sm:text-base disabled:opacity-75 disabled:cursor-wait min-w-[150px]"
                >
                  {isDemoLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-neutral-dark"></div>
                      <span>{t.accessingDemo}</span>
                    </div>
                  ) : (
                    t.accessDemo
                  )}
                </button>
                <a
                  href="/signin"
                  className="btn btn-secondary text-sm sm:text-base"
                >
                  {t.login}
                </a>
                <a
                  href="/signin?view=signup"
                  className="btn btn-primary text-sm sm:text-base"
                >
                  {t.signUp}
                </a>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
