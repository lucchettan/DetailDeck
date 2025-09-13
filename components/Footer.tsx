import React from 'react';
import { CarWashIcon } from './Icons';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-brand-light border-t border-gray-200">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <CarWashIcon className="w-8 h-8 text-brand-blue" />
              <span className="text-2xl font-bold text-brand-dark">DetailDeck</span>
            </div>
            <p className="text-brand-gray max-w-sm">{t.footerDescription}</p>
          </div>
          <div>
            <h4 className="text-brand-dark font-semibold mb-4">{t.product}</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-brand-gray hover:text-brand-blue transition-colors">{t.features}</a></li>
              <li><a href="#pricing" className="text-brand-gray hover:text-brand-blue transition-colors">{t.pricing}</a></li>
              <li><a href="#how-it-works" className="text-brand-gray hover:text-brand-blue transition-colors">{t.howItWorks}</a></li>
              <li><a href="#faq" className="text-brand-gray hover:text-brand-blue transition-colors">{t.faq}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-brand-dark font-semibold mb-4">{t.company}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-brand-gray hover:text-brand-blue transition-colors">{t.aboutUs}</a></li>
              <li><a href="#" className="text-brand-gray hover:text-brand-blue transition-colors">{t.contact}</a></li>
              <li><a href="#" className="text-brand-gray hover:text-brand-blue transition-colors">{t.privacyPolicy}</a></li>
              <li><a href="#" className="text-brand-gray hover:text-brand-blue transition-colors">{t.termsOfService}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} DetailDeck. {t.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;