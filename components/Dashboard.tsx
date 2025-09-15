
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StorefrontIcon, ClockIcon, TagIcon, CalendarDaysIcon, ListBulletIcon, ChartPieIcon } from './Icons';
import DashboardHome from './dashboard/DashboardHome';
import ShopInformation from './dashboard/ShopInformation';
import Availability from './dashboard/Availability';
import Catalog from './dashboard/Catalog';
import ServiceEditor from './dashboard/ServiceEditor';
import Reservations from './dashboard/Reservations';
import Analytics from './dashboard/Analytics';

type ViewType = 'home' | 'shop' | 'availability' | 'catalog' | 'serviceEditor' | 'reservations' | 'analytics';

const Dashboard: React.FC = () => {
  const { user, logOut } = useAuth();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const navigateToServiceEditor = (serviceId: string | null) => {
    setEditingServiceId(serviceId);
    setActiveView('serviceEditor');
  };

  const navigationItems = [
    { id: 'home', label: t.dashboardHome, icon: <StorefrontIcon className="w-6 h-6" /> },
    { id: 'shop', label: t.shopInformation, icon: <StorefrontIcon className="w-6 h-6" /> },
    { id: 'availability', label: t.availability, icon: <ClockIcon className="w-6 h-6" /> },
    { id: 'catalog', label: t.catalog, icon: <TagIcon className="w-6 h-6" /> },
    { id: 'reservations', label: t.reservations, icon: <CalendarDaysIcon className="w-6 h-6" /> },
    { id: 'analytics', label: t.analytics, icon: <ChartPieIcon className="w-6 h-6" /> },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <DashboardHome onNavigate={(view) => setActiveView(view as ViewType)} />;
      case 'shop':
        return <ShopInformation />;
      case 'availability':
        return <Availability />;
      case 'catalog':
        return <Catalog onEditService={navigateToServiceEditor} />;
      case 'serviceEditor':
        return <ServiceEditor serviceId={editingServiceId} onBack={() => setActiveView('catalog')} />;
      case 'reservations':
        return <Reservations />;
      case 'analytics':
        return <Analytics />;
      default:
        return <DashboardHome onNavigate={(view) => setActiveView(view as ViewType)} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-dark">
            <span>Resa</span><span className="text-brand-blue">One</span>
          </h1>
        </div>
        <nav className="mt-6">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${activeView === item.id ? 'bg-blue-50 text-brand-blue border-r-4 border-brand-blue' : 'text-brand-gray hover:bg-gray-100'}`}
            >
              {item.icon}
              <span className="ml-4 font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-6 py-4 flex justify-end items-center">
            <div className="text-right mr-4">
              <p className="font-semibold text-brand-dark">{user?.email}</p>
              <p className="text-sm text-brand-gray">{t.shopOwner}</p>
            </div>
            <button
              onClick={logOut}
              className="bg-brand-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-600 transition-all duration-300"
            >
              {t.logout}
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
