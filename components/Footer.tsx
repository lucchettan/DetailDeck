
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <a href="#" className="flex items-center mb-4">
              <h2 className="text-2xl font-bold text-neutral-dark">
                <span>Resa</span><span className="text-primary">One</span>
              </h2>
            </a>
            <p className="text-gray-600 max-w-sm">{t.footerDescription}</p>
          </div>
          <div>
            <h4 className="text-neutral-dark font-semibold mb-4">{t.product}</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="footer-link">{t.features}</a></li>
              <li><a href="#pricing" className="footer-link">{t.pricing}</a></li>
              <li><a href="#how-it-works" className="footer-link">{t.howItWorks}</a></li>
              <li><a href="#faq" className="footer-link">{t.faq}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-neutral-dark font-semibold mb-4">{t.company}</h4>
            <ul className="space-y-2">
              <li><a href="#" className="footer-link">{t.aboutUs}</a></li>
              <li><a href="#" className="footer-link">{t.contact}</a></li>
              <li><a href="#" className="footer-link">{t.privacyPolicy}</a></li>
              <li><a href="#" className="footer-link">{t.termsOfService}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 text-center text-gray-500">
          <p>&copy; 2024 Resaone. {t.allRightsReserved || 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
