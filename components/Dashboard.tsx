
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { StorefrontIcon, TagIcon, CalendarDaysIcon, ChartPieIcon, CompanyIcon, UserCircleIcon } from './Icons';
import DashboardHome from './dashboard/DashboardHome';
import ShopInformation from './dashboard/ShopInformation';
import Catalog from './dashboard/Catalog';
import ServiceEditor from './dashboard/ServiceEditor';
import Reservations from './dashboard/Reservations';
import Analytics from './dashboard/Analytics';
import Account from './dashboard/Account';
import { supabase } from '../lib/supabaseClient';
import ReservationEditor from './dashboard/ReservationEditor';

type ViewType = 'home' | 'shop' | 'catalog' | 'serviceEditor' | 'reservations' | 'analytics' | 'account';

export interface Service {
  id: string;
  shop_id?: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  varies: boolean;
  pricing: {
    [key: string]: { price?: string; duration?: string; enabled?: boolean; };
  };
  singlePrice: { price?: string; duration?: string };
  addOns: { id: number; name: string; price: string; duration: string }[];
  imageUrl?: string;
}

export interface Shop {
    id: string;
    owner_id: string;
    name: string;
    phone?: string;
    email?: string;
    shopImageUrl?: string;
    businessType: 'local' | 'mobile';
    address?: string;
    serviceAreas?: any[]; // Define more strictly if needed
    schedule: any; // Define more strictly if needed
    minBookingNotice: string;
    maxBookingHorizon: string;
    acceptsOnSitePayment: boolean;
    bookingFee: string;
    stripe_account_id?: string;
    stripe_account_enabled?: boolean;
}

export interface Reservation {
    id: string;
    shop_id: string;
    service_id: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
    duration: number; // minutes
    price: number;
    client_name: string;
    client_email: string;
    client_phone: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    payment_status: 'paid' | 'pending_deposit' | 'on_site';
    service_details: {
        name: string;
        vehicleSize?: 'S' | 'M' | 'L' | 'XL';
        addOns: any[];
    };
    created_at?: string;
}


const Dashboard: React.FC = () => {
  const { user, logOut } = useAuth();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [shopData, setShopData] = useState<Shop | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isReservationEditorOpen, setIsReservationEditorOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const { data: shop, error: shopError } = await supabase
                .from('shops')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            // This is not an error for a new user, just means they need to create a shop.
            if (shopError && shopError.code !== 'PGRST116') { // PGRST116 = 0 rows
                throw shopError;
            }
            if (shop) {
                 setShopData(shop as Shop);
            }
           
            if (shop) {
                const { data: shopServices, error: servicesError } = await supabase
                    .from('services')
                    .select('*')
                    .eq('shop_id', shop.id);
                
                if (servicesError) throw servicesError;
                setServices(shopServices as Service[]);
                
                const { data: shopReservations, error: reservationsError } = await supabase
                    .from('reservations')
                    .select('*')
                    .eq('shop_id', shop.id)
                    .order('date', { ascending: false })
                    .order('start_time', { ascending: true });

                if (reservationsError) throw reservationsError;
                setReservations(shopReservations as Reservation[]);
            }
        } catch (error: any) {
            console.error("Error fetching dashboard data:", error);
            alert(`Error fetching dashboard data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [user]);


  const setupStatus = {
    shopInfo: !!shopData?.name,
    availability: !!shopData?.schedule, 
    catalog: services.length > 0,
    stripe: !!shopData?.stripe_account_id && !!shopData?.stripe_account_enabled,
  };

  const handleSaveService = async (serviceToSave: Omit<Service, 'id'> & { id?: string }): Promise<boolean> => {
    if (!shopData) {
        alert("Cannot save service: shop data is not loaded.");
        return false;
    };
    
    const servicePayload = {
      ...serviceToSave,
      shop_id: shopData.id,
    };
    
    const { data, error } = await supabase
      .from('services')
      .upsert(servicePayload)
      .select()
      .single();

    if (error) {
      console.error("Error saving service:", error);
      alert(`Error saving service: ${error.message}`);
      return false;
    }

    if (data) {
      setServices(prev => {
        const exists = prev.some(s => s.id === data.id);
        if (exists) {
          return prev.map(s => s.id === data.id ? data as Service : s);
        }
        return [...prev, data as Service];
      });
    }
    
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
      alert(`Error deleting service: ${error.message}`);
      return;
    }

    setServices(services.filter(s => s.id !== serviceId));
    setActiveView('catalog');
  };

  const handleSaveShop = async (updatedShopData: Partial<Shop>) => {
     if (!user) return;
     
     if (shopData) {
        // --- UPDATE existing shop ---
        const { data, error } = await supabase
            .from('shops')
            .update(updatedShopData)
            .eq('id', shopData.id)
            .select()
            .single();
        
        if (error) {
            console.error("Error updating shop info:", error);
            alert(`Error updating shop info: ${error.message}`);
            return;
        }
        if (data) {
            setShopData(data as Shop);
        }
     } else {
        // --- CREATE new shop ---
        const { data, error } = await supabase
            .from('shops')
            .insert({ ...updatedShopData, owner_id: user.id })
            .select()
            .single();
        
        if (error) {
            console.error("Error creating shop info:", error);
            alert(`Error creating shop info: ${error.message}`);
            return;
        }
        if (data) {
            setShopData(data as Shop);
        }
     }
  };
  
  const handleSaveReservation = async (reservationToSave: Omit<Reservation, 'id'> & { id?: string }) => {
    if (!shopData) {
        alert("Cannot save reservation: shop data not loaded.");
        return;
    }
    
    const payload = {
      ...reservationToSave,
      shop_id: shopData.id,
    };
    
    const { data, error } = await supabase
      .from('reservations')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error saving reservation:", error);
      alert(`Error saving reservation: ${error.message}`);
      return;
    }

    if (data) {
      setReservations(prev => {
        const exists = prev.some(r => r.id === data.id);
        if (exists) {
          return prev.map(r => r.id === data.id ? data as Reservation : r);
        }
        return [...prev, data as Reservation].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    }
    
    setIsReservationEditorOpen(false);
    setEditingReservation(null);
  };
  
  const handleDeleteReservation = async (reservationId: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
    if (error) {
      console.error("Error deleting reservation:", error);
      alert(`Error deleting reservation: ${error.message}`);
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

  const navigationItems = [
    { id: 'home', label: t.dashboardHome, icon: <StorefrontIcon className="w-6 h-6" /> },
    { id: 'shop', label: t.shopInformation, icon: <CompanyIcon className="w-6 h-6" /> },
    { id: 'catalog', label: t.catalog, icon: <TagIcon className="w-6 h-6" /> },
    { id: 'reservations', label: t.reservations, icon: <CalendarDaysIcon className="w-6 h-6" /> },
    { id: 'analytics', label: t.analytics, icon: <ChartPieIcon className="w-6 h-6" /> },
    { id: 'account', label: t.account, icon: <UserCircleIcon className="w-6 h-6" /> },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      );
    }

    switch (activeView) {
      case 'home':
        return <DashboardHome onNavigate={(view) => setActiveView(view as ViewType)} setupStatus={setupStatus} shopId={shopData?.id} />;
      case 'shop':
        return <ShopInformation shopData={shopData} onSave={handleSaveShop} />;
      case 'catalog':
        return <Catalog services={services} onEditService={navigateToServiceEditor} />;
      case 'serviceEditor':
        const service = editingServiceId ? services.find(s => s.id === editingServiceId) : null;
        return <ServiceEditor 
                 service={service} 
                 onBack={() => setActiveView('catalog')} 
                 onSave={handleSaveService}
                 onDelete={handleDeleteService}
               />;
      case 'reservations':
        return <Reservations reservations={reservations} onAdd={() => openReservationEditor(null)} onEdit={openReservationEditor} />;
      case 'analytics':
        return <Analytics />;
      case 'account':
        return <Account shopData={shopData} />;
      default:
        return <DashboardHome onNavigate={(view) => setActiveView(view as ViewType)} setupStatus={setupStatus} shopId={shopData?.id}/>;
    }
  };

  return (
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
            shopSchedule={shopData.schedule}
            shopId={shopData.id}
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
  );
};

export default Dashboard;
