import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard: React.FC = () => {
  const { user, logOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-brand-light">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-dark">
            <span>Resa</span><span className="text-brand-blue">One</span>
          </h1>
          <button
            onClick={logOut}
            className="bg-brand-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-600 transition-all duration-300"
          >
            {t.logout}
          </button>
        </div>
      </header>
      <main className="container mx-auto px-6 py-12">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-3xl font-bold text-brand-dark mb-4">{t.dashboardGreeting}</h2>
          <p className="text-brand-gray">
            You are logged in as <span className="font-semibold text-brand-dark">{user?.email}</span>.
          </p>
          <p className="text-brand-gray mt-4">
            This is your main dashboard. All your shop management tools will be available here soon!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;