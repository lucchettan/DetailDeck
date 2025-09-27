import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { LinkIcon, ShareIcon } from '../Icons';
import { Shop } from '../Dashboard';

interface DashboardHomeProps {
  onNavigate: (nav: { view: string; step?: number }) => void;
  shopData: Shop;
  hasServices: boolean;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, shopData, hasServices }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);

  // Use the real shop ID if available, otherwise fallback for safety.
  const bookingUrl = `${window.location.origin}/reservation/${shopData.id || 'no-shop-found'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Composant de la page de réservation
  const BookingPageSection = () => (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-lg mb-8 border border-blue-100">
      <h3 className="text-xl font-bold text-brand-dark mb-1">
        🎉 Votre page de réservation est prête !
      </h3>
      <p className="text-brand-gray mb-6">
        Partagez ce lien avec vos clients pour qu'ils puissent réserver vos services.
      </p>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <p className="text-sm text-gray-600 mb-2">Lien de réservation :</p>
        <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">{bookingUrl}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={copyToClipboard} className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          <LinkIcon className="w-5 h-5" />
          <span>{linkCopied ? t.linkCopied : t.copyLink}</span>
        </button>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          {t.openLink}
        </a>
        <button className="flex-1 min-w-[120px] btn btn-secondary flex items-center justify-center gap-2">
          <ShareIcon className="w-5 h-5" />
          <span>{t.share}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold text-brand-dark mb-4">
        {t.dashboardGreeting} {user?.user_metadata.first_name || ''}
      </h2>

      {/* Afficher la page de réservation */}
      <BookingPageSection />

      {/* Section d'actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div
          onClick={() => onNavigate({ view: 'catalog' })}
          className="bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Catalogue</h3>
          <p className="text-gray-600 text-sm">Gérez vos services et catégories</p>
        </div>

        <div
          onClick={() => onNavigate({ view: 'reservations' })}
          className="bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-green-300 hover:bg-green-50"
        >
          <div className="text-3xl mb-3">📅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Réservations</h3>
          <p className="text-gray-600 text-sm">Consultez vos rendez-vous</p>
        </div>

        <div
          onClick={() => onNavigate({ view: 'leads' })}
          className="bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-yellow-300 hover:bg-yellow-50"
        >
          <div className="text-3xl mb-3">📞</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Prospects</h3>
          <p className="text-gray-600 text-sm">Gérez vos leads et contacts</p>
        </div>

        <div
          onClick={() => onNavigate({ view: 'settings' })}
          className="bg-white p-6 rounded-xl border border-gray-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-purple-300 hover:bg-purple-50"
        >
          <div className="text-3xl mb-3">⚙️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Paramètres</h3>
          <p className="text-gray-600 text-sm">Configurez votre boutique</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
