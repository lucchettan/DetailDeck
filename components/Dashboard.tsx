import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StorefrontIcon, TagIcon, CalendarDaysIcon, ChartPieIcon, CogIcon } from './Icons';
import DashboardHome from './dashboard/DashboardHome';
import Catalog from './dashboard/Catalog';
import ServiceEditor from './dashboard/ServiceEditor';
import Reservations from './dashboard/Reservations';
import Analytics from './dashboard/Analytics';
import Settings from './dashboard/Settings';
import { supabase } from '../lib/supabaseClient';
import ReservationEditor from './dashboard/ReservationEditor';
import { toCamelCase } from '../lib/utils';
import AlertModal from './AlertModal';
import AddOnEditor from './dashboard/AddOnEditor';
import BookingPreviewModal from './booking/BookingPreviewModal';

type ViewType = 'home' | 'settings' | 'catalog' | 'serviceEditor' | 'reservations' | 'analytics';

export interface AddOn {
  id: string;
  shopId: string;
  name: string;
  price: string;
  duration: string;
  serviceId?: string | null;
}

export interface Service {
  id: string;
  shopId?: string; // Mapped from shop_id
  name: string;
  description: string;
  status: 'active' | 'inactive';
  varies: boolean;
  pricing: {
    [key: string]: { price?: string; duration?: string; enabled?: boolean; };
  };
  singlePrice: { price?: string; duration?: string };
  imageUrl?: string;
}

export interface Shop {
    id: string;
    ownerId: string; // Mapped from owner_id
    name: string;
    phone?: string;
    email?: string;
    shopImageUrl?: string;
    businessType: 'local' | 'mobile';
    address?: string;
    serviceAreas?: any[]; 
    schedule: any; 
    minBookingNotice: string;
    maxBookingHorizon: string;
    acceptsOnSitePayment: boolean;
    bookingFee: string;
}

export interface Reservation {
    id: string;
    shopId: string;
    serviceId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    duration: number; // minutes
    price: number;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    paymentStatus: 'paid' | 'pending_deposit' | 'on_site';
    serviceDetails: {
        name: string;
        vehicleSize?: 'S' | 'M' | 'L' | 'XL';
        addOns: any[];
    };
    createdAt?: string;
}


const Dashboard: React.FC = () => {
  const { user, logOut, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [settingsTargetStep, setSettingsTargetStep] = useState(1);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState<{ isOpen: boolean; title: string; message: string; }>({ isOpen: false, title: '', message: '' });
  
  const [isReservationEditorOpen, setIsReservationEditorOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const [isAddOnEditorOpen, setIsAddOnEditorOpen] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState<AddOn | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('*')
            .eq('owner_id', user.id)
            .single();

        if (shopError && shopError.code !== 'PGRST116') {
            throw shopError;
        }
        if (shop) {
             const camelCasedShop = toCamelCase(shop) as Shop;
             setShopData(camelCasedShop);
        
            const { data: shopServices, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('shop_id', shop.id);
            
            if (servicesError) throw servicesError;
            setServices(toCamelCase(shopServices) as Service[]);


            const { data: shopAddOns, error: addOnsError } = await supabase
                .from('add_ons')
                .select('*')
                .eq('shop_id', shop.id);

            if (addOnsError) throw addOnsError;
            setAddOns(toCamelCase(shopAddOns) as AddOn[]);
            
            const { data: shopReservations, error: reservationsError } = await supabase
                .from('reservations')
                .select('*')
                .eq('shop_id', shop.id)
                .order('date', { ascending: false })
                .order('start_time', { ascending: true });

            if (reservationsError) throw reservationsError;
            setReservations(toCamelCase(shopReservations) as Reservation[]);
        }
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

  const setupStatus = {
    shopInfo: !!shopData?.name,
    availability: !!shopData?.schedule, 
    catalog: services.length > 0,
  };

  const handleSaveService = async (
    serviceToSave: Omit<Service, 'id'> & { id?: string },
    specificAddOns: (Omit<AddOn, 'shopId'> & { id?: string })[],
    deletedAddOnIds: string[]
  ): Promise<boolean | void> => {
    if (!shopData) {
        setAlertInfo({ isOpen: true, title: "Error", message: "Cannot save service: shop data is not loaded."});
        return false;
    };
    
    const servicePayload = {
      id: serviceToSave.id,
      shop_id: shopData.id,
      name: serviceToSave.name,
      description: serviceToSave.description,
      status: serviceToSave.status,
      varies: serviceToSave.varies,
      pricing: serviceToSave.pricing,
      single_price: serviceToSave.singlePrice,
      image_url: serviceToSave.imageUrl,
    };
    
    if (!servicePayload.id) {
        delete (servicePayload as any).id;
    }

    const { data: savedService, error: serviceError } = await supabase
      .from('services')
      .upsert(servicePayload)
      .select()
      .single();

    if (serviceError) {
      console.error("Error saving service:", serviceError);
      setAlertInfo({isOpen: true, title: "Save Error", message: `Error saving service: ${serviceError.message}`});
      return false;
    }

    if (savedService) {
      const addOnPromises = specificAddOns.map(addOn => {
        const addOnPayload = {
          shop_id: shopData.id,
          service_id: savedService.id,
          name: addOn.name,
          price: addOn.price,
          duration: addOn.duration,
          id: addOn.id?.startsWith('temp-') ? undefined : addOn.id,
        };
        if (!addOnPayload.id) {
          delete (addOnPayload as any).id;
        }
        return supabase.from('add_ons').upsert(addOnPayload);
      });

      const deletePromises = deletedAddOnIds.map(id => supabase.from('add_ons').delete().eq('id', id));

      const results = await Promise.all([...addOnPromises, ...deletePromises]);

      const anyError = results.find(res => res.error);
      if (anyError) {
          console.error("Error saving/deleting add-ons:", anyError.error);
          setAlertInfo({isOpen: true, title: "Save Error", message: `Error saving add-ons: ${anyError.error.message}`});
          return false;
      }
    }
    
    await fetchData(); // Refresh all data to ensure consistency
    setActiveView('catalog');
    return true;
  };

  const handleDeleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      console.error("Error deleting service:", error);
      setAlertInfo({ isOpen: true, title: "Delete Error", message: `Error deleting service: ${error.message}` });
      return;
    }

    setServices(services.filter(s => s.id !== serviceId));
    setActiveView('catalog');
  };

  const handleSaveAddOn = async (addOnToSave: Omit<AddOn, 'id' | 'shopId'> & { id?: string }) => {
    if (!shopData) return;
    const payload = {
      id: addOnToSave.id,
      shop_id: shopData.id,
      name: addOnToSave.name,
      price: addOnToSave.price,
      duration: addOnToSave.duration,
      service_id: addOnToSave.serviceId || null,
    };

    if (!payload.id) {
        delete (payload as any).id;
    }
    
    const { data, error } = await supabase.from('add_ons').upsert(payload).select().single();
    
    if (error) {
        console.error("Error saving add-on:", error);
        setAlertInfo({isOpen: true, title: "Save Error", message: `Error saving add-on: ${error.message}`});
        return;
    }
    
    if(data) {
      const savedAddOn = toCamelCase(data) as AddOn;
      setAddOns(prev => {
        const exists = prev.some(a => a.id === savedAddOn.id);
        return exists ? prev.map(a => a.id === savedAddOn.id ? savedAddOn : a) : [...prev, savedAddOn];
      });
    }
    setIsAddOnEditorOpen(false);
  };

  const handleDeleteAddOn = async (addOnId: string) => {
    const { error } = await supabase.from('add_ons').delete().eq('id', addOnId);
    if (error) {
        console.error("Error deleting add-on:", error);
        setAlertInfo({isOpen: true, title: "Delete Error", message: `Error deleting add-on: ${error.message}`});
        return;
    }
    setAddOns(prev => prev.filter(a => a.id !== addOnId));
    setIsAddOnEditorOpen(false);
  };

  const handleSaveShop = async (updatedShopData: Partial<Shop>) => {
     if (!user) return;
     
    const payload = {
      name: updatedShopData.name,
      phone: updatedShopData.phone,
      email: updatedShopData.email,
      shop_image_url: updatedShopData.shopImageUrl,
      business_type: updatedShopData.businessType,
      address: updatedShopData.address,
      service_areas: updatedShopData.serviceAreas,
      schedule: updatedShopData.schedule,
      min_booking_notice: updatedShopData.minBookingNotice,
      max_booking_horizon: updatedShopData.maxBookingHorizon,
      accepts_on_site_payment: updatedShopData.acceptsOnSitePayment,
      booking_fee: updatedShopData.bookingFee,
    };

    Object.keys(payload).forEach(key => {
        if ((payload as any)[key] === undefined) {
            delete (payload as any)[key];
        }
    });

     if (shopData) {
        const { data, error } = await supabase
            .from('shops')
            .update(payload)
            .eq('id', shopData.id)
            .select()
            .single();
        
        if (error) {
            console.error("Error updating shop info:", error);
            setAlertInfo({ isOpen: true, title: "Update Error", message: `Error updating shop info: ${error.message}` });
            return;
        }
        if (data) {
            setShopData(toCamelCase(data) as Shop);
        }
     } else {
        const { data, error } = await supabase
            .from('shops')
            .insert({ ...payload, owner_id: user.id })
            .select()
            .single();
        
        if (error) {
            console.error("Error creating shop info:", error);
            setAlertInfo({ isOpen: true, title: "Creation Error", message: `Error creating shop info: ${error.message}` });
            return;
        }
        if (data) {
            setShopData(toCamelCase(data) as Shop);
        }
     }
  };
  
  const handleSaveReservation = async (reservationToSave: Omit<Reservation, 'id'> & { id?: string }) => {
    if (!shopData) {
        setAlertInfo({isOpen: true, title: "Error", message: "Cannot save reservation: shop data not loaded."});
        return;
    }
    
    const payload = {
      id: reservationToSave.id,
      shop_id: shopData.id,
      service_id: reservationToSave.serviceId,
      date: reservationToSave.date,
      start_time: reservationToSave.startTime,
      duration: reservationToSave.duration,
      price: reservationToSave.price,
      client_name: reservationToSave.clientName,
      client_email: reservationToSave.clientEmail,
      client_phone: reservationToSave.clientPhone,
      status: reservationToSave.status,
      payment_status: reservationToSave.paymentStatus,
      service_details: reservationToSave.serviceDetails,
    };

    if (!payload.id) {
        delete (payload as any).id;
    }

    const { data, error } = await supabase
      .from('reservations')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error saving reservation:", error);
      setAlertInfo({isOpen: true, title: "Save Error", message: `Error saving reservation: ${error.message}`});
      return;
    }

    if (data) {
      const savedReservation = toCamelCase(data) as Reservation;
      setReservations(prev => {
        const exists = prev.some(r => r.id === savedReservation.id);
        if (exists) {
          return prev.map(r => r.id === savedReservation.id ? savedReservation : r);
        }
        return [...prev, savedReservation].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    }
    
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

  const navigateToServiceEditor = (serviceId: string | null) => {
    setEditingServiceId(serviceId);
    setActiveView('serviceEditor');
  };

  const openReservationEditor = (reservation: Reservation | null) => {
    setEditingReservation(reservation);
    setIsReservationEditorOpen(true);
  };

  const openAddOnEditor = (addOn: AddOn | null) => {
    setEditingAddOn(addOn);
    setIsAddOnEditorOpen(true);
  };

  const handlePreviewClick = () => {
    if (shopData?.id) {
        setIsPreviewModalOpen(true);
    } else {
        setAlertInfo({ isOpen: true, title: "Preview Unavailable", message: "Please complete your shop setup before previewing." });
    }
  };

  const handleNavigation = (nav: { view: string; step?: number }) => {
    const newView = nav.view === 'shop' ? 'settings' : nav.view;
    setActiveView(newView as ViewType);
    if (newView === 'settings' && nav.step) {
      setSettingsTargetStep(nav.step);
    }
  };

  const navigationItems = [
    { id: 'home', label: t.dashboardHome, icon: <StorefrontIcon className="w-6 h-6" /> },
    { id: 'catalog', label: t.catalog, icon: <TagIcon className="w-6 h-6" /> },
    { id: 'reservations', label: t.reservations, icon: <CalendarDaysIcon className="w-6 h-6" /> },
    { id: 'analytics', label: t.analytics, icon: <ChartPieIcon className="w-6 h-6" /> },
    { id: 'settings', label: t.settings, icon: <CogIcon className="w-6 h-6" /> },
  ];

  const renderContent = () => {
    if (authLoading || loading) {
      return (
        <div className="flex items-center justify-center h-full flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return <DashboardHome onNavigate={handleNavigation} setupStatus={setupStatus} shopId={shopData?.id} onPreview={handlePreviewClick} />;
      case 'settings':
        return <Settings shopData={shopData} onSave={handleSaveShop} initialStep={settingsTargetStep} />;
      case 'catalog':
        return <Catalog 
                  services={services} 
                  addOns={addOns} 
                  onEditService={navigateToServiceEditor}
                  onEditAddOn={(id) => openAddOnEditor(id ? addOns.find(a => a.id === id) || null : null)} 
                />;
      case 'serviceEditor':
        const service = editingServiceId ? services.find(s => s.id === editingServiceId) : null;
        return <ServiceEditor 
                 service={service} 
                 shopAddOns={addOns}
                 onBack={() => setActiveView('catalog')} 
                 onSave={handleSaveService}
                 onDelete={handleDeleteService}
               />;
      case 'reservations':
        return <Reservations reservations={reservations} onAdd={() => openReservationEditor(null)} onEdit={openReservationEditor} />;
      case 'analytics':
        return <Analytics />;
      default:
        return <DashboardHome onNavigate={handleNavigation} setupStatus={setupStatus} shopId={shopData?.id} onPreview={handlePreviewClick}/>;
    }
  };

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
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${activeView === item.id ? 'bg-blue-50 text-brand-blue border-r-4 border-brand-blue' : 'text-brand-gray hover:bg-gray-100'}`}
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
                addOns={addOns}
                shopSchedule={shopData.schedule}
                shopId={shopData.id}
                minBookingNotice={shopData.minBookingNotice}
                maxBookingHorizon={shopData.maxBookingHorizon}
            />
            )}

            {isAddOnEditorOpen && (
              <AddOnEditor
                isOpen={isAddOnEditorOpen}
                onClose={() => {
                  setIsAddOnEditorOpen(false);
                  setEditingAddOn(null);
                }}
                onSave={handleSaveAddOn}
                onDelete={handleDeleteAddOn}
                addOnToEdit={editingAddOn}
              />
            )}
            
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-20">
                <div className="flex justify-around items-center">
                    {navigationItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as ViewType)}
                            className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 flex-grow ${activeView === item.id ? 'text-brand-blue' : 'text-brand-gray hover:text-brand-dark'}`}
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