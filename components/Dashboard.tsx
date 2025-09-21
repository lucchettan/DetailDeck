

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

type ViewType = {
  page: 'home' | 'settings' | 'catalog' | 'reservations' | 'leads';
  id?: string | 'new';
};

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
  const [newServiceCategory, setNewServiceCategory] = useState<'interior' | 'exterior' | 'complementary'>('interior');
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [supplements, setSupplements] = useState<VehicleSizeSupplement[]>([]);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  
  const [isReservationEditorOpen, setIsReservationEditorOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentView(parsePath(path));
  };
  
  useEffect(() => {
    const onPopState = () => {
      setCurrentView(parsePath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', user.id)
            .single();

        if (shopError && shopError.code !== 'PGRST116') throw shopError;
        if (!shop) {
          setLoading(false);
          return;
        };

        const camelCasedShop = toCamelCase(shop) as Shop;
        setShopData(camelCasedShop);
    
        const [
            servicesRes,
            addOnsRes,
            formulasRes,
            supplementsRes,
            reservationsRes,
            leadsRes
        ] = await Promise.all([
            supabase.from('services').select('*').eq('shop_id', shop.id),
            supabase.from('add_ons').select('*').eq('shop_id', shop.id),
            supabase.from('formulas').select('*, services(shop_id)').eq('services.shop_id', shop.id),
            supabase.from('service_vehicle_size_supplements').select('*, services(shop_id)').eq('services.shop_id', shop.id),
            supabase.from('reservations').select('*').eq('shop_id', shop.id).order('date', { ascending: false }).order('start_time', { ascending: true }),
            supabase.from('leads').select('*').eq('shop_id', shop.id).order('created_at', { ascending: false })
        ]);

        if (servicesRes.error) throw servicesRes.error;
        setServices(toCamelCase(servicesRes.data) as Service[]);
        
        if (addOnsRes.error) throw addOnsRes.error;
        setAddOns(toCamelCase(addOnsRes.data) as AddOn[]);

        if (formulasRes.error) throw formulasRes.error;
        setFormulas(toCamelCase(formulasRes.data) as Formula[]);

        if (supplementsRes.error) throw supplementsRes.error;
        setSupplements(toCamelCase(supplementsRes.data) as VehicleSizeSupplement[]);
        
        if (reservationsRes.error) throw reservationsRes.error;
        setReservations(toCamelCase(reservationsRes.data) as Reservation[]);
        
        if (leadsRes.error) throw leadsRes.error;
        setLeads(toCamelCase(leadsRes.data) as Lead[]);
        
    } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setAlertInfo({ 
            isOpen: true, 
            title: 'Data Fetch Error', 
            message: `Error fetching dashboard data: ${error.message}` 
        });
    } finally {
        setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, fetchData]);
  
  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    const { data, error } = await supabase
      .from('leads')
      .update(toCamelCase(updates))
      .eq('id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      setAlertInfo({ isOpen: true, title: 'Update Error', message: `Failed to update lead: ${error.message}` });
      return;
    }
    
    if (data) {
      setLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? toCamelCase(data) as Lead : lead));
    }
  };

  const setupStatus = {
    shopInfo: !!shopData?.name,
    availability: !!shopData?.schedule, 
    catalog: services.length > 0,
  };

  const handleSaveService = async () => {
    await fetchData();
    navigate('/dashboard/catalog');
    return true;
  };

  const handleDeleteService = async (serviceId: string) => {
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) {
      console.error("Error deleting service:", error);
      setAlertInfo({ isOpen: true, title: "Delete Error", message: `Error deleting service: ${error.message}` });
      return;
    }
    await fetchData(); // Refresh data
    navigate('/dashboard/catalog');
  };

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
  
  const handleSaveReservation = async (reservationToSave: any) => {
    await fetchData();
    setIsReservationEditorOpen(false);
    setEditingReservation(null);
  };
  
  const handleDeleteReservation = async (reservationId: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
    if (error) {
      console.error("Error deleting reservation:", error);
      setAlertInfo({isOpen: true, title: "Delete Error", message: `Error deleting reservation: ${error.message}`});
      return;
    }
    setReservations(prev => prev.filter(r => r.id !== reservationId));
    setIsReservationEditorOpen(false);
    setEditingReservation(null);
  }

  const navigateToServiceEditor = (serviceId: string) => {
    navigate(`/dashboard/catalog/edit/${serviceId}`);
  };

  const handleAddNewService = (category: 'interior' | 'exterior' | 'complementary') => {
    setNewServiceCategory(category);
    navigate('/dashboard/catalog/new');
  };

  const openReservationEditor = (reservation: Reservation | null) => {
    setEditingReservation(reservation);
    setIsReservationEditorOpen(true);
  };

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
  
  const renderContent = () => {
      if (currentView.page === 'catalog' && currentView.id) {
          return (
              <ServiceEditor 
                  serviceToEdit={currentView.id !== 'new' ? services.find(s => s.id === currentView.id) : null}
                  initialCategory={newServiceCategory}
                  formulasForService={currentView.id !== 'new' ? formulas.filter(f => f.serviceId === currentView.id) : []}
                  supplementsForService={currentView.id !== 'new' ? supplements.filter(s => s.serviceId === currentView.id) : []}
                  addOnsForService={currentView.id !== 'new' ? addOns.filter(a => a.serviceId === currentView.id) : []}
                  shopId={shopData?.id || ''}
                  supportedVehicleSizes={shopData?.supportedVehicleSizes || []}
                  onBack={() => navigate('/dashboard/catalog')} 
                  onSave={handleSaveService}
                  onDelete={handleDeleteService}
              />
          );
      }
      
      switch (currentView.page) {
          case 'home':
              return <DashboardHome onNavigate={handleGetStartedNavigation} setupStatus={setupStatus} shopId={shopData?.id} onPreview={handlePreviewClick} />;
          case 'leads':
              return <Leads leads={leads} onUpdateLead={handleUpdateLead} />;
          case 'catalog':
              return <Catalog services={services} onEditService={navigateToServiceEditor} onAddNewService={handleAddNewService} />;
          case 'reservations':
              return <Reservations reservations={reservations} onAdd={() => openReservationEditor(null)} onEdit={openReservationEditor} />;
          case 'settings':
              return <Settings shopData={shopData} onSave={handleSaveShop} initialStep={settingsTargetStep} />;
          default:
              return <DashboardHome onNavigate={handleGetStartedNavigation} setupStatus={setupStatus} shopId={shopData?.id} onPreview={handlePreviewClick} />;
      }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full flex-col">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
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
              {renderContent()}
            </main>
            
            {isReservationEditorOpen && shopData && (
            <ReservationEditor
                isOpen={isReservationEditorOpen}
                onClose={() => {
                setIsReservationEditorOpen(false);
                setEditingReservation(null);
                }}
                onSave={handleSaveReservation}
                onDelete={handleDeleteReservation}
                reservationToEdit={editingReservation}
                services={services}
                shopSchedule={shopData.schedule}
                shopId={shopData.id}
                minBookingNotice={shopData.minBookingNotice}
                maxBookingHorizon={shopData.maxBookingHorizon}
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