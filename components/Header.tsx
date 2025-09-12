import React, { useState } from 'react';
import { CarWashIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const languages = {
        en: { name: 'English', flag: '🇬🇧' },
        fr: { name: 'Français', flag: '🇫🇷' },
        es: { name: 'Español', flag: '🇪🇸' }
    };

    const handleLanguageChange = (lang: 'en' | 'fr' | 'es') => {
        setLanguage(lang);
        setIsOpen(false);
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 text-brand-gray hover:text-brand-dark transition-colors duration-300"
            >
                <span>{languages[language].flag}</span>
                <span>{languages[language].name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    {Object.entries(languages).map(([langCode, langDetails]) => (
                         <button 
                            key={langCode}
                            onClick={() => handleLanguageChange(langCode as 'en' | 'fr' | 'es')} 
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-brand-dark hover:bg-brand-light"
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


const Header: React.FC<{ onGetStartedClick: () => void }> = ({ onGetStartedClick }) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-50 shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CarWashIcon className="w-8 h-8 text-brand-blue" />
            <span className="text-2xl font-bold text-brand-dark">DetailDeck</span>
          </div>
          <nav className="flex items-center space-x-6">
            <LanguageSwitcher />
            <a href="#pricing" className="text-brand-gray hover:text-brand-dark transition-colors duration-300 hidden md:block">{t.pricing}</a>
            <a href="#faq" className="text-brand-gray hover:text-brand-dark transition-colors duration-300 hidden md:block">{t.faq}</a>
            <button 
              onClick={onGetStartedClick}
              className="bg-brand-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              {t.getStarted}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;