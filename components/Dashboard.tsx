import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { HomeIcon, BookOpenIcon, CalendarDaysIcon, CogIcon as SettingsIcon, PhoneArrowUpRightIcon, CloseIcon as LogoutIcon } from './Icons';
import DashboardHome from './dashboard/DashboardHome';
import Catalog from './dashboard/Catalog';
import ServiceEditor from './dashboard/ServiceEditor';
import Reservations from './dashboard/Reservations';
import Settings from './dashboard/Settings';
import VehicleSizeManager from './dashboard/VehicleSizeManager';
import ServiceCategoryManager from './dashboard/ServiceCategoryManager';
import VehicleSizeUpdatePrompt from './dashboard/VehicleSizeUpdatePrompt';
import CatalogSettings from './dashboard/CatalogSettings';
import { supabase } from '../lib/supabaseClient';
import ReservationEditor from './dashboard/ReservationEditor';
import { toCamelCase, toSnakeCase } from '../lib/utils';
import AlertModal from './AlertModal';
import BookingPreviewModal from './booking/BookingPreviewModal';
import Leads from './dashboard/Leads';
import { IS_MOCK_MODE } from '../lib/env';
import { mockShop, mockServices, mockLeads, mockReservations, mockVehicleSizes, mockServiceCategories } from '../lib/mockData';
import NewOnboarding from './NewOnboarding';

type ViewType = {
  page: 'home' | 'settings' | 'catalog' | 'reservations' | 'leads';
  id?: string | 'new';
};

// Import types from the new centralized location
// Types removed for deployment compatibility

import {
  Shop,
  Service,
  Formula,
  VehicleSizeSupplement,
  AddOn,
  Reservation,
  Lead,
  ShopVehicleSize,
  ShopServiceCategory,
  FullShopData
} from '../types';

// Re-export for backwards compatibility
export type {
  Shop,
  Service,
  Formula,
  VehicleSizeSupplement,
  AddOn,
  Reservation,
  Lead,
  ShopVehicleSize,
  ShopServiceCategory,
  FullShopData
};

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
  const [catalogRefreshTrigger, setCatalogRefreshTrigger] = useState(0);
  const [reservationRefreshTrigger, setReservationRefreshTrigger] = useState(0);
  const [reservationValidationError, setReservationValidationError] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const [isReservationEditorOpen, setIsReservationEditorOpen] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<string | null>(null);
  const [hasServices, setHasServices] = useState(false);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // New state for customizable features
  const [vehicleSizes, setVehicleSizes] = useState<ShopVehicleSize[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ShopServiceCategory[]>([]);
  const [isVehicleSizeManagerOpen, setIsVehicleSizeManagerOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCatalogSettingsOpen, setIsCatalogSettingsOpen] = useState(false);

  // State for vehicle size update prompt
  const [showVehicleSizeUpdatePrompt, setShowVehicleSizeUpdatePrompt] = useState(false);
  const [newVehicleSize, setNewVehicleSize] = useState<ShopVehicleSize | null>(null);
  const [services, setServices] = useState<Service[]>([]);

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


  const fetchShopData = useCallback(async (forceRefresh = false) => {
    // Cache for 30 seconds to avoid unnecessary refetches
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < 30000 && shopData && shopData.id) {
      console.log('🚀 Using cached shop data, skipping fetch');
      return;
    }

    if (IS_MOCK_MODE) {
      setShopData(mockShop);
      setHasServices(mockServices.length > 0);
      setVehicleSizes(mockVehicleSizes);
      setServiceCategories(mockServiceCategories);
      setServices(mockServices); // Add this line to populate services in mock mode
      setLoadingShopData(false);
      setNeedsOnboarding(false); // Mock mode is always complete
      setCheckingOnboarding(false);
      setLastFetchTime(now);
      return;
    }
    if (!user) return;

    // Clear cache if shop data is invalid
    if (shopData && !shopData.id) {
      console.log('🧹 Clearing invalid shop data cache');
      setShopData(null);
    }

    setLoadingShopData(true);

    try {
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('email', user.email)
        .single();

      if (shopError) {
        if (shopError.code === 'PGRST116') {
          // No shop found - redirect to onboarding
          console.log('ℹ️ No shop found for user, redirecting to onboarding:', user.email);
          setShowOnboarding(true);
          setLoadingShopData(false);
          return;
        }
        throw shopError;
      }

      if (shop) {
        const camelCasedShop = toCamelCase(shop) as Shop;
        setShopData(camelCasedShop);

        // Fetch services count
        const { count, error: servicesError } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('shop_id', shop.id);
        if (servicesError) throw servicesError;
        setHasServices((count || 0) > 0);

        // Fetch vehicle sizes and service categories
        const [vehicleSizesRes, categoriesRes] = await Promise.all([
          supabase
            .from('shop_vehicle_sizes')
            .select('*')
            .eq('shop_id', shop.id)
            .order('created_at'),
          supabase
            .from('shop_service_categories')
            .select('*')
            .eq('shop_id', shop.id)
            .order('created_at')
        ]);

        if (vehicleSizesRes.error) {
          console.error('Error fetching vehicle sizes:', vehicleSizesRes.error);
        } else {
          setVehicleSizes(toCamelCase(vehicleSizesRes.data) as ShopVehicleSize[]);
        }

        if (categoriesRes.error) {
          console.error('Error fetching service categories:', categoriesRes.error);
        } else {
          // Categories loaded
          setServiceCategories(toCamelCase(categoriesRes.data) as ShopServiceCategory[]);
        }

        // Fetch services for the vehicle size update prompt
        const { data: servicesData, error: servicesDataError } = await supabase
          .from('services')
          .select('*')
          .eq('shop_id', shop.id);

        if (!servicesDataError && servicesData) {
          // Services loaded
          setServices(toCamelCase(servicesData) as Service[]);
        } else {
          // Services error or empty
        }
      }
      // Vérifier si l'onboarding est nécessaire
      const checkOnboardingStatus = async () => {
        if (!user?.id) return;

        try {
          const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, name, address_line1, opening_hours')
            .eq('email', user.email)
            .single();

          if (shopError && shopError.code === 'PGRST116') {
            // No shop found - user might have been deleted
            console.warn('🚨 No shop found during onboarding check for user:', user.email);
            await logOut();
            return;
          }

          const { data: categories } = await supabase
            .from('shop_service_categories')
            .select('*')
            .eq('shop_id', shop?.id);

          const { data: services } = await supabase
            .from('services')
            .select('*')
            .eq('shop_id', shop?.id);

          const { data: vehicleSizes } = await supabase
            .from('shop_vehicle_sizes')
            .select('id')
            .eq('shop_id', shop?.id);

          // Vérifier si toutes les étapes requises sont complètes
          const hasBasicInfo = !!(shop?.name && shop?.address_line1);
          const hasSchedule = !!(shop?.opening_hours);
          const hasCategories = (categories?.length || 0) >= 1;
          const hasVehicleSizes = (vehicleSizes?.length || 0) >= 1;
          const hasServices = (services?.length || 0) >= 1;

          console.log('🔍 Dashboard: Onboarding check results:', {
            userEmail: user.email,
            shop: shop?.id,
            hasBasicInfo,
            hasSchedule,
            hasCategories,
            hasVehicleSizes,
            hasServices,
            categoriesCount: categories?.length,
            vehicleSizesCount: vehicleSizes?.length,
            servicesCount: services?.length
          });

          const isComplete = hasBasicInfo && hasSchedule && hasCategories && hasVehicleSizes && hasServices;
          setNeedsOnboarding(!isComplete);

        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // En cas d'erreur, on assume que l'onboarding est nécessaire
          setNeedsOnboarding(true);
        } finally {
          setCheckingOnboarding(false);
        }
      };

      await checkOnboardingStatus();

    } catch (error: any) {
      console.error("Error fetching shop data:", error);
      setAlertInfo({
        isOpen: true,
        title: 'Data Fetch Error',
        message: `Error fetching shop data: ${error.message || error}`
      });
      // En cas d'erreur, on assume que l'onboarding est nécessaire
      setNeedsOnboarding(true);
      setCheckingOnboarding(false);

      // Créer un shop vide pour éviter l'écran blanc
      setShopData({
        id: 'temp',
        name: '',
        email: user?.email || '',
        phone: '',
        addressLine1: '',
        supportedVehicleSizes: ['S', 'M', 'L', 'XL']
      });
    } finally {
      setLoadingShopData(false);
      setLastFetchTime(Date.now());
    }
  }, [user]);

  // Handler for when a new vehicle size is added
  const handleNewVehicleSizeAdded = (newSize: ShopVehicleSize) => {
    setNewVehicleSize(newSize);
    setShowVehicleSizeUpdatePrompt(true);
    setIsVehicleSizeManagerOpen(false);
  };

  // Handler for when services are updated with new vehicle size
  const handleServicesUpdatedWithNewSize = () => {
    setShowVehicleSizeUpdatePrompt(false);
    setNewVehicleSize(null);
    // Optionally refresh services data
    fetchShopData(true);
  };


  useEffect(() => {
    if (!authLoading) {
      fetchShopData();
    }
  }, [user, authLoading, fetchShopData]);

  // Handle visibility change to avoid unnecessary refetches
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !authLoading) {
        // User returned to tab, but don't refetch if we have recent data
        const now = Date.now();
        if (now - lastFetchTime > 30000) { // Only refetch if data is older than 30 seconds
          console.log('🔄 Tab became visible, refetching data...');
          fetchShopData();
        } else {
          console.log('🚀 Tab became visible, using cached data');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, authLoading, lastFetchTime, fetchShopData]);

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
      const { data, error } = await supabase.from('shops').insert({ ...snakeCasePayload, email: user.email }).select().single();
      if (error) {
        console.error("Error creating shop info:", error);
        setAlertInfo({ isOpen: true, title: "Creation Error", message: `Error creating shop info: ${error.message}` });
        return;
      }
      if (data) setShopData(toCamelCase(data) as Shop);
    }
  };

  const openReservationEditor = (reservationId: string | null) => {
    // Vérifier que les données nécessaires sont chargées
    if (!shopData || vehicleSizes.length === 0 || serviceCategories.length === 0) {
      console.log('⚠️ Cannot open reservation editor: missing required data', {
        shopData: !!shopData,
        vehicleSizes: vehicleSizes.length,
        serviceCategories: serviceCategories.length
      });
      setAlertInfo({
        isOpen: true,
        title: "Données manquantes",
        message: "Les données nécessaires ne sont pas encore chargées. Veuillez réessayer dans quelques secondes."
      });
      return;
    }

    setEditingReservationId(reservationId);
    setIsReservationEditorOpen(true);
  };

  const handleSaveReservation = async (reservationData: Omit<Reservation, 'id'> & { id?: string }) => {
    // Clear previous validation errors
    setReservationValidationError(null);

    // Validate required fields
    if (!reservationData.startTime) {
      setReservationValidationError("Veuillez sélectionner une heure.");
      return;
    }

    if (!reservationData.customerName) {
      setReservationValidationError("Veuillez saisir le nom du client.");
      return;
    }

    // Calculate end_time from start_time + total_duration
    const calculateEndTime = (startTime: string, durationMinutes: number): string => {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + durationMinutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    };

    // Transform the data to match database schema
    const transformedData = toSnakeCase(reservationData);
    const { price, duration, ...restData } = transformedData;
    const totalDuration = reservationData.duration || 0;
    const endTime = calculateEndTime(reservationData.startTime, totalDuration);

    const dbData = {
      ...restData,
      shop_id: shopData.id,
      customer_email: transformedData.customer_email || 'no-email@example.com', // Default email if not provided
      vehicle_info: transformedData.vehicle_info || '', // Ajouter explicitement vehicle_info
      end_time: endTime,
      total_duration: totalDuration,
      total_price: reservationData.price || 0,
      // Nouvelles colonnes structurées
      service_id: reservationData.service_id,
      formula_id: reservationData.formula_id,
      vehicle_size_id: reservationData.vehicle_size_id,
      selected_addons: reservationData.selected_addons || [],
      // Garder aussi le JSONB pour compatibilité
      services: reservationData.services || []
    };

    console.log('Saving reservation with data:', dbData);

    const { error } = await supabase.from('reservations').upsert(dbData);
    if (error) {
      console.error("Error saving reservation", error);
      setAlertInfo({ isOpen: true, title: "Save Error", message: `Could not save reservation: ${error.message}` });
    } else {
      setIsReservationEditorOpen(false);
      setReservationRefreshTrigger(prev => prev + 1); // Trigger refresh
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
    if (error) {
      console.error("Error deleting reservation", error);
      setAlertInfo({ isOpen: true, title: "Delete Error", message: `Could not delete reservation: ${error.message}` });
    } else {
      setIsReservationEditorOpen(false);
      setReservationRefreshTrigger(prev => prev + 1); // Trigger refresh après suppression
    }
  }


  const handleGetStartedNavigation = (nav: { view: string; step?: number }) => {
    const page = nav.view === 'shop' ? 'settings' : nav.view;
    navigate(`/dashboard/${page}`);
    if (page === 'settings' && nav.step) {
      setSettingsTargetStep(nav.step);
    }
  };

  const navigationItems = [
    { id: 'home', label: t.dashboardHome, icon: <span className="text-2xl">🏠</span> },
    { id: 'leads', label: t.hotLeads, icon: <span className="text-2xl">📞</span> },
    { id: 'catalog', label: t.catalog, icon: <span className="text-2xl">📋</span> },
    { id: 'reservations', label: t.reservations, icon: <span className="text-2xl">📅</span> },
    { id: 'settings', label: t.settings, icon: <span className="text-2xl">⚙️</span> },
  ];


  // Debug logs supprimés pour réduire le spam

  if (authLoading || loadingShopData || checkingOnboarding) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen flex-col bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div>
        <p className="mt-4 text-gray-600">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  // Vérification de sécurité pour l'utilisateur
  if (!user) {
    console.error('Dashboard: No user found, redirecting to login');
    window.location.href = '/';
    return null;
  }

  // Afficher l'onboarding si nécessaire
  if (needsOnboarding) {
    return (
      <NewOnboarding
        onComplete={() => {
          setNeedsOnboarding(false);
          fetchShopData(true); // Force refresh after onboarding
        }}
      />
    );
  }

  if (!shopData) {
    // No shop data, showing Settings
    return <Settings shopData={null} onSave={handleSaveShop} initialStep={1} />;
  }

  return (
    <>
      <div className="min-h-screen bg-brand-light">
        {/* Header avec logo et déconnexion */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-brand-dark">
                  <span>Resa</span><span className="text-brand-blue">One</span>
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  <p className="text-xs text-gray-500">{t.shopOwner}</p>
                </div>
                <button
                  onClick={logOut}
                  className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
          <div className={currentView.page === 'home' ? '' : 'hidden'}>
            <DashboardHome onNavigate={handleGetStartedNavigation} shopData={shopData} hasServices={hasServices} />
          </div>
          <div className={currentView.page === 'leads' ? '' : 'hidden'}>
            <Leads shopId={shopData.id} initialLeads={IS_MOCK_MODE ? mockLeads : undefined} onNavigateHome={() => navigate('/dashboard')} />
          </div>
          <div className={currentView.page === 'catalog' && !currentView.id ? '' : 'hidden'}>
            <Catalog
              shopId={shopData.id}
              onEditService={(id) => navigate(`/dashboard/catalog/edit/${id}`)}
              onAddNewService={(categoryId) => navigate(`/dashboard/catalog/new${categoryId ? `?category=${categoryId}` : ''}`)}
              onOpenVehicleSizeManager={() => setIsVehicleSizeManagerOpen(true)}
              onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
              onOpenCatalogSettings={() => setIsCatalogSettingsOpen(true)}
              initialServices={IS_MOCK_MODE ? mockServices : services}
              serviceCategories={serviceCategories}
              onNavigateHome={() => navigate('/dashboard')}
            />
          </div>

          {currentView.page === 'catalog' && currentView.id && (
            <ServiceEditor
              serviceId={currentView.id}
              shopId={shopData.id}
              supportedVehicleSizes={vehicleSizes.map(vs => vs.id)}
              vehicleSizes={vehicleSizes}
              serviceCategories={serviceCategories}
              onBack={() => navigate('/dashboard/catalog')}
              onSave={(updatedService?: Service) => {
                console.log('🔍 [DEBUG] onSave called with:', updatedService);
                if (updatedService) {
                  console.log('🔍 [DEBUG] Updating service in list:', updatedService.id);
                  // Mettre à jour le service dans la liste existante
                  setServices(prev => {
                    const updated = prev.map(s => s.id === updatedService.id ? updatedService : s);
                    console.log('🔍 [DEBUG] Services before:', prev.length, 'after:', updated.length);
                    return updated;
                  });
                }
                setCurrentView({ page: 'catalog' });
              }}
              onDelete={() => navigate('/dashboard/catalog')}
            />
          )}

          <div className={currentView.page === 'reservations' ? '' : 'hidden'}>
            <Reservations shopId={shopData.id} onAdd={() => openReservationEditor(null)} onEdit={(id) => openReservationEditor(id)} initialReservations={IS_MOCK_MODE ? mockReservations : undefined} onNavigateHome={() => navigate('/dashboard')} onReservationCreated={reservationRefreshTrigger} />
          </div>
          <div className={currentView.page === 'settings' ? '' : 'hidden'}>
            <Settings shopData={shopData} onSave={handleSaveShop} initialStep={settingsTargetStep} onNavigateHome={() => navigate('/dashboard')} />
          </div>
        </main>

        {isReservationEditorOpen && shopData && vehicleSizes.length > 0 && serviceCategories.length > 0 && (
          <ReservationEditor
            isOpen={isReservationEditorOpen}
            onClose={() => {
              setIsReservationEditorOpen(false);
              setEditingReservationId(null);
              setReservationValidationError(null);
            }}
            reservationId={editingReservationId}
            shopData={shopData}
            vehicleSizes={vehicleSizes}
            serviceCategories={serviceCategories}
            onSave={handleSaveReservation}
            onDelete={handleDeleteReservation}
            validationError={reservationValidationError}
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

      <AlertModal
        isOpen={alertInfo.isOpen}
        onClose={() => setAlertInfo({ isOpen: false, title: '', message: '' })}
        title={alertInfo.title}
        message={alertInfo.message}
      />
      {
        isPreviewModalOpen && shopData?.id && (
          <BookingPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            shopId={shopData.id}
          />
        )
      }

      {/* Vehicle Size Manager Modal */}
      {
        shopData?.id && (
          <VehicleSizeManager
            isOpen={isVehicleSizeManagerOpen}
            onClose={() => setIsVehicleSizeManagerOpen(false)}
            shopId={shopData.id}
            vehicleSizes={vehicleSizes}
            onUpdate={setVehicleSizes}
            onNewVehicleSizeAdded={handleNewVehicleSizeAdded}
          />
        )
      }

      {/* Vehicle Size Update Prompt */}
      {
        newVehicleSize && (
          <VehicleSizeUpdatePrompt
            isOpen={showVehicleSizeUpdatePrompt}
            onClose={() => setShowVehicleSizeUpdatePrompt(false)}
            newVehicleSize={newVehicleSize}
            services={services}
            onServicesUpdated={handleServicesUpdatedWithNewSize}
          />
        )
      }

      {/* Service Category Manager Modal */}
      {
        shopData?.id && (
          <ServiceCategoryManager
            isOpen={isCategoryManagerOpen}
            onClose={() => setIsCategoryManagerOpen(false)}
            shopId={shopData.id}
            serviceCategories={serviceCategories}
            onUpdate={setServiceCategories}
          />
        )
      }

      {/* Catalog Settings Modal */}
      {
        shopData?.id && (
          <CatalogSettings
            isOpen={isCatalogSettingsOpen}
            onClose={() => setIsCatalogSettingsOpen(false)}
            shopId={shopData.id}
            vehicleSizes={vehicleSizes}
            serviceCategories={serviceCategories}
            onNewVehicleSizeAdded={handleNewVehicleSizeAdded}
            onDataUpdated={() => fetchShopData(true)}
          />
        )
      }
    </>
  );
};

export default Dashboard;
