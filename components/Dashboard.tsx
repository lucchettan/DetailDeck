import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HomeIcon, BookOpenIcon, CalendarDaysIcon, CogIcon as SettingsIcon, PhoneArrowUpRightIcon } from './Icons';
import DashboardHome from './dashboard/DashboardHome';
import Catalog from './dashboard/Catalog';
import ServiceEditor from './dashboard/ServiceEditor';
import Reservations from './dashboard/Reservations';
import Settings from './dashboard/Settings';
import { supabase } from '../lib/supabaseClient';
import ReservationEditor from './dashboard/ReservationEditor';
import { toCamelCase } from '../lib/utils';
import AlertModal from './AlertModal';
import BookingPreviewModal from './booking/BookingPreviewModal';
import Leads from './dashboard/Leads';
import { IS_MOCK_MODE } from '../lib/env';
import { mockShop, mockServices, mockLeads, mockReservations } from '../lib/mockData';

type ViewType = {
  page: 'home' | 'settings' | 'catalog' | 'reservations' | 'leads';
  id?: string | 'new';
};

// Type definitions remain here as they are shared across multiple dashboard components
export interface Formula {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  additionalPrice: number;
  additionalDuration: number;
  createdAt?: string;
}

export interface VehicleSizeSupplement {
    id: string;
    serviceId: string;
    size: string;
    additionalPrice: number;
    additionalDuration: number;
    createdAt?: string;
}

export interface AddOn {
  id: string;
  shopId: string;
  name: string;
  price: number;
  duration: number;
  serviceId?: string; // Can be null for global add-ons
  createdAt?: string;
}

export interface Service {
  id: string;
  shopId: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  category: 'interior' | 'exterior' | 'complementary';
  basePrice: number;
  baseDuration: number; // in minutes
  imageUrl?: string;
  createdAt?: string;
}

export interface Shop {
    id: string;
    ownerId: string; 
    name: string;
    phone?: string;
    email?: string;
    shopImageUrl?: string;
    businessType: 'local' | 'mobile';
    addressLine1?: string;
    addressCity?: string;
    addressPostalCode?: string;
    addressCountry?: string;
    serviceAreas?: any[]; 
    schedule: any; 
    minBookingNotice: string;
    maxBookingHorizon: string;
    supportedVehicleSizes: string[];
}

export interface Reservation {
    id: string;
    shopId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    duration: number; // minutes
    price: number;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    paymentStatus: 'paid' | 'pending_deposit' | 'on_site';
    serviceDetails: {
        vehicleSize?: string;
        clientVehicle?: string;
        specialInstructions?: string;
        services: {
            serviceId: string;
            serviceName: string;
            formulaId: string;
            formulaName: string;
            addOns: { id: string; name: string; }[];
        }[];
    };
    createdAt?: string;
}

export interface Lead {
  id: string;
  shopId: string;
  createdAt: string;
  clientPhone: string;
  selectedServices: {
      vehicleSize: string;
      services: {
          serviceName: string;
          formulaName: string;
      }[];
  };
  status: 'to_call' | 'contacted' | 'converted' | 'lost';
  notes?: string;
}

const parsePath = (path: string): ViewType => {
  const pathParts = path.split('/dashboard')[1]?.split('/').filter(Boolean) || [];
  const [page, action, id] = pathParts;

  if (page === 'catalog') {
    if (action === 'edit' && id) {
      return { page: 'catalog', id };
    }
    if (action === 'new') {
      return { page: 'catalog', id: 'new' };
    }
    return { page: 'catalog' };
  }

  if (['home', 'settings', 'reservations', 'leads'].includes(page)) {
    return { page: page as ViewType['page'] };
  }

  return { page: 'home' };
};


const Dashboard: React.FC = () => {
  const { user, logOut, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  
  const [currentView, setCurrentView] = useState<ViewType>(parsePath(window.location.pathname));
  
  const [settingsTargetStep, setSettingsTargetStep] = useState(1);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [loadingShopData, setLoadingShopData] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  
  const [isReservationEditorOpen, setIsReservationEditorOpen] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [hasServices, setHasServices] = useState(false);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const navigate = (path: string) => {
    const isPreviewEnvironment = window.location.origin.includes('scf.usercontent.goog');
    if (!isPreviewEnvironment) {
        window.history.pushState({}, '', path);
    }
    setCurrentView(parsePath(path));
  };
  
  useEffect(() => {
    const onPopState = () => {
      setCurrentView(parsePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);


  const fetchShopData = useCallback(async () => {
    if (IS_MOCK_MODE) {
        setShopData(mockShop);
        setHasServices(mockServices.length > 0);
        setLoadingShopData(false);
        return;
    }
    if (!user) return;
    setLoadingShopData(true);

    try {
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', user.id)
            .single();

        if (shopError && shopError.code !== 'PGRST116') throw shopError;
        
        if (shop) {
            const camelCasedShop = toCamelCase(shop) as Shop;
            setShopData(camelCasedShop);

            const { count, error: servicesError } = await supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('shop_id', shop.id);
            if (servicesError) throw servicesError;
            setHasServices((count || 0) > 0);
        }
    } catch (error: any) {
        console.error("Error fetching shop data:", error);
        setAlertInfo({ 
            isOpen: true, 
            title: 'Data Fetch Error', 
            message: `Error fetching shop data: ${error.message || error}` 
        });
    } finally {
        setLoadingShopData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchShopData();
    }
  }, [user, authLoading, fetchShopData]);

  const handleSaveShop = async (updatedShopData: Partial<Shop>) => {
     if (!user) return;
     const payload: any = { ...updatedShopData };
     const snakeCasePayload: any = {};
     for (const key in payload) {
        snakeCasePayload[key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)] = payload[key];
     }
     delete snakeCasePayload.id;

     if (shopData) {
        const { data, error } = await supabase.from('shops').update(snakeCasePayload).eq('id', shopData.id).select().single();
        if (error) {
            console.error("Error updating shop info:", error);
            setAlertInfo({ isOpen: true, title: "Update Error", message: `Error updating shop info: ${error.message}` });
            return;
        }
        if (data) setShopData(toCamelCase(data) as Shop);
     } else {
        const { data, error } = await supabase.from('shops').insert({ ...snakeCasePayload, owner_id: user.id }).select().single();
        if (error) {
            console.error("Error creating shop info:", error);
            setAlertInfo({ isOpen: true, title: "Creation Error", message: `Error creating shop info: ${error.message}` });
            return;
        }
        if (data) setShopData(toCamelCase(data) as Shop);
     }
  };

  const openReservationEditor = (reservationId: string | null) => {
    setEditingReservationId(reservationId);
    setIsReservationEditorOpen(true);
  };
  
  const handleSaveReservation = async (reservationData: Omit<Reservation, 'id'> & { id?: string }) => {
    const { error } = await supabase.from('reservations').upsert(toCamelCase(reservationData));
    if (error) {
        console.error("Error saving reservation", error);
        setAlertInfo({ isOpen: true, title: "Save Error", message: `Could not save reservation: ${error.message}` });
    } else {
        setIsReservationEditorOpen(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
     if (error) {
        console.error("Error deleting reservation", error);
        setAlertInfo({ isOpen: true, title: "Delete Error", message: `Could not delete reservation: ${error.message}` });
    } else {
        setIsReservationEditorOpen(false);
    }
  }

  const handlePreviewClick = () => {
    if (shopData?.id) {
        setIsPreviewModalOpen(true);
    } else {
        setAlertInfo({ isOpen: true, title: "Preview Unavailable", message: "Please complete your shop setup before previewing." });
    }
  };

  const handleGetStartedNavigation = (nav: { view: string; step?: number }) => {
    const page = nav.view === 'shop' ? 'settings' : nav.view;
    navigate(`/dashboard/${page}`);
    if (page === 'settings' && nav.step) {
      setSettingsTargetStep(nav.step);
    }
  };

  const navigationItems = [
    { id: 'home', label: t.dashboardHome, icon: <HomeIcon className="w-6 h-6" /> },
    { id: 'leads', label: t.hotLeads, icon: <PhoneArrowUpRightIcon className="w-6 h-6" /> },
    { id: 'catalog', label: t.catalog, icon: <BookOpenIcon className="w-6 h-6" /> },
    { id: 'reservations', label: t.reservations, icon: <CalendarDaysIcon className="w-6 h-6" /> },
    { id: 'settings', label: t.settings, icon: <SettingsIcon className="w-6 h-6" /> },
  ];
  

  if (authLoading || loadingShopData) {
    return (
      <div className="flex-1 flex items-center justify-center h-full flex-col">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!shopData) {
    return <Settings shopData={null} onSave={handleSaveShop} initialStep={1} />;
  }
  
  return (
    <>
        <div className="min-h-screen bg-brand-light md:flex">
        <aside className="hidden md:block w-64 bg-white shadow-md flex-shrink-0">
            <div className="p-6">
            <h1 className="text-2xl font-bold text-brand-dark">
                <span>Resa</span><span className="text-brand-blue">One</span>
            </h1>
            </div>
            <nav className="mt-6">
            {navigationItems.map(item => (
                <button
                key={item.id}
                onClick={() => navigate(item.id === 'home' ? '/dashboard' : `/dashboard/${item.id}`)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${currentView.page === item.id ? 'bg-blue-50 text-brand-blue border-r-4 border-brand-blue' : 'text-brand-gray hover:bg-gray-100'}`}
                >
                {item.icon}
                <span className="ml-4 font-semibold">{item.label}</span>
                </button>
            ))}
            </nav>
        </aside>

        <div className="flex-1 flex flex-col pb-20 md:pb-0">
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
              <div className={currentView.page === 'home' ? '' : 'hidden'}>
                <DashboardHome onNavigate={handleGetStartedNavigation} shopData={shopData} hasServices={hasServices} onPreview={handlePreviewClick} />
              </div>
              <div className={currentView.page === 'leads' ? '' : 'hidden'}>
                <Leads shopId={shopData.id} initialLeads={IS_MOCK_MODE ? mockLeads : undefined} />
              </div>
              <div className={currentView.page === 'catalog' && !currentView.id ? '' : 'hidden'}>
                  <Catalog shopId={shopData.id} onEditService={(id) => navigate(`/dashboard/catalog/edit/${id}`)} onAddNewService={() => navigate('/dashboard/catalog/new')} initialServices={IS_MOCK_MODE ? mockServices : undefined} />
              </div>
              
              {currentView.page === 'catalog' && currentView.id && (
                  <ServiceEditor 
                      serviceId={currentView.id}
                      shopId={shopData.id}
                      supportedVehicleSizes={shopData.supportedVehicleSizes || []}
                      onBack={() => navigate('/dashboard/catalog')} 
                      onSave={() => navigate('/dashboard/catalog')}
                      onDelete={() => navigate('/dashboard/catalog')}
                      initialData={IS_MOCK_MODE ? (mockServices.find(s => s.id === currentView.id) || null) : undefined}
                  />
              )}

              <div className={currentView.page === 'reservations' ? '' : 'hidden'}>
                <Reservations shopId={shopData.id} onAdd={() => openReservationEditor(null)} onEdit={(id) => openReservationEditor(id)} initialReservations={IS_MOCK_MODE ? mockReservations : undefined} />
              </div>
              <div className={currentView.page === 'settings' ? '' : 'hidden'}>
                <Settings shopData={shopData} onSave={handleSaveShop} initialStep={settingsTargetStep} />
              </div>
            </main>
            
            {isReservationEditorOpen && shopData && (
              <ReservationEditor
                  isOpen={isReservationEditorOpen}
                  onClose={() => {
                      setIsReservationEditorOpen(false);
                      setEditingReservationId(null);
                  }}
                  reservationId={editingReservationId}
                  shopData={shopData}
                  onSave={handleSaveReservation}
                  onDelete={handleDeleteReservation}
              />
            )}
            
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-20">
                <div className="flex justify-around items-center">
                    {navigationItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.id === 'home' ? '/dashboard' : `/dashboard/${item.id}`)}
                            className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 flex-grow ${currentView.page === item.id ? 'text-brand-blue' : 'text-brand-gray hover:text-brand-dark'}`}
                            style={{ flexBasis: '0' }}
                        >
                            {item.icon}
                            <span className="text-xs font-medium text-center mt-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
        </div>
        <AlertModal
            isOpen={alertInfo.isOpen}
            onClose={() => setAlertInfo({ isOpen: false, title: '', message: '' })}
            title={alertInfo.title}
            message={alertInfo.message}
        />
        {isPreviewModalOpen && shopData?.id && (
            <BookingPreviewModal
                isOpen={isPreviewModalOpen}
                onClose={() => setIsPreviewModalOpen(false)}
                shopId={shopData.id}
            />
        )}
    </>
  );
};

export default Dashboard;