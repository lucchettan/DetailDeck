import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Reservation } from '../Dashboard';
import { CalendarPlusIcon } from '../Icons';
import { supabase } from '../../lib/supabaseClient';
import { toCamelCase } from '../../lib/utils';

interface ReservationsProps {
  shopId: string;
  onAdd: () => void;
  onEdit: (reservationId: string) => void;
  initialReservations?: Reservation[];
  onNavigateHome?: () => void;
  onReservationCreated?: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const getStatusBadgeStyle = (status: Reservation['status']) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-blue-100 text-blue-800'; // upcoming
  }
}

const getPaymentStatusBadgeStyle = (status: Reservation['paymentStatus']) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-800';
    case 'pending_deposit': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800'; // on_site
  }
}

const ReservationCard: React.FC<{ reservation: Reservation; onEdit: (id: string) => void; }> = ({ reservation, onEdit }) => {
  const { t } = useLanguage();
  const { id, startTime, total_duration, customer_name, vehicle_info, services, vehicle_size, status, paymentStatus } = reservation;


  // Formater l'heure pour enlever les secondes
  const formatTime = (timeStr: string): string => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // Prendre seulement HH:MM
  };

  // Formater la durée en XXhXXmn
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${remainingMinutes}min`;
  };

  const calculateEndTime = (startTimeStr: string, durationMins: number): string => {
    if (!startTimeStr || !startTimeStr.includes(':') || durationMins === undefined) {
      return '';
    }
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const totalStartMinutes = hours * 60 + minutes;
    const totalEndMinutes = totalStartMinutes + durationMins;

    const endHours = Math.floor(totalEndMinutes / 60) % 24;
    const endMinutes = totalEndMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const endTime = calculateEndTime(startTime, total_duration);

  const serviceDisplayName = useMemo(() => {
    if (!services || !Array.isArray(services) || services.length === 0) {
      return 'Service non spécifié';
    }

    // Prendre le premier service (pour l'instant on gère un seul service par réservation)
    const firstService = services[0];
    if (!firstService) {
      return 'Service non spécifié';
    }

    let displayName = firstService.serviceName || 'Service';

    // Ajouter la formule si ce n'est pas "default"
    if (firstService.formulaId && firstService.formulaId !== 'default') {
      displayName += ` (${firstService.formulaName || firstService.formulaId})`;
    }

    // Ajouter la taille de véhicule
    if (firstService.vehicleSizeName) {
      displayName += ` - ${firstService.vehicleSizeName}`;
    }

    // Ajouter les add-ons
    if (firstService.addOns && firstService.addOns.length > 0) {
      displayName += ` + ${firstService.addOns.length} add-on(s)`;
    }

    return displayName;
  }, [services]);


  return (
    <button onClick={() => onEdit(id)} className="w-full text-left bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {formatTime(startTime)}
                <span className="text-blue-800">
                  &nbsp;&ndash;&nbsp;{formatTime(calculateEndTime(startTime, total_duration || 60))}
                </span>
              </div>
              {vehicle_info && (
                <span className="text-sm text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded">
                  {vehicle_info}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-600 font-medium">{customer_name}</span>
          </div>
          <div className="border-t border-gray-200 mb-3"></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-base">{serviceDisplayName}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{t.paymentStatus}:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  paymentStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                {paymentStatus || 'À venir'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};


const Reservations: React.FC<ReservationsProps> = ({ shopId, onAdd, onEdit, initialReservations, onNavigateHome, onReservationCreated }) => {
  const { t } = useLanguage();
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations || []);
  const [loading, setLoading] = useState(!initialReservations);
  const [lastFetched, setLastFetched] = useState<number | null>(initialReservations ? Date.now() : null);
  const lastRefreshTrigger = useRef<number>(0);

  const fetchReservations = useCallback(async (force = false) => {
    if (initialReservations) return;
    if (!shopId) return;

    const now = Date.now();
    if (!force && lastFetched && (now - lastFetched < CACHE_DURATION)) {
      return; // Use cached data, do not trigger loading state.
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        vehicle_size:shop_vehicle_sizes(name)
      `)
      .eq('shop_id', shopId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching reservations:", error);
    } else if (data) {
      setReservations(toCamelCase(data) as Reservation[]);
      setLastFetched(Date.now());
    }
    setLoading(false);
  }, [shopId, initialReservations, lastFetched]);

  useEffect(() => {
    fetchReservations();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchReservations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchReservations]);

  // Refresh reservations when a new one is created
  useEffect(() => {
    if (onReservationCreated && onReservationCreated > lastRefreshTrigger.current) {
      lastRefreshTrigger.current = onReservationCreated;
      fetchReservations(true); // Force refresh
    }
  }, [onReservationCreated, fetchReservations]);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return reservations.reduce<{ upcoming: Reservation[], past: Reservation[] }>((acc, res) => {
      const resDate = new Date(res.date + 'T00:00:00');
      if (resDate >= today) {
        acc.upcoming.push(res);
      } else {
        acc.past.push(res);
      }
      return acc;
    }, { upcoming: [], past: [] });
  }, [reservations]);

  const groupReservationsByDate = (resList: Reservation[]) => {
    return resList.reduce<Record<string, Reservation[]>>((groups, res) => {
      const date = res.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(res);
      return groups;
    }, {});
  };

  const upcomingGrouped = groupReservationsByDate(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  const pastGrouped = groupReservationsByDate(past);

  const renderGroup = (groupedData: Record<string, Reservation[]>) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return Object.entries(groupedData).map(([date, resList]) => {
      let dateLabel = new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      if (date === today) dateLabel = t.today;
      if (date === tomorrow) dateLabel = t.tomorrow;

      return (
        <div key={date}>
          <h3 className="font-bold text-brand-dark mt-6 mb-2">{dateLabel} ({resList.length})</h3>
          <div className="space-y-3">
            {resList.map(res => <ReservationCard key={res.id} reservation={res} onEdit={onEdit} />)}
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Bouton retour à l'accueil */}
      <div className="mb-4">
        <button
          onClick={onNavigateHome || (() => window.history.back())}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l'accueil
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">{t.reservations}</h2>
          <p className="text-brand-gray mt-1">{t.manageReservationsSubtitle}</p>
        </div>
        <button onClick={onAdd} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
          <CalendarPlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{t.addReservation}</span>
        </button>
      </div>

      <div>
        <h3 className="text-xl font-bold text-brand-dark border-b pb-2">{t.upcoming} ({upcoming.length})</h3>
        {upcoming.length > 0 ? <>{renderGroup(upcomingGrouped)}</> : <p className="text-brand-gray mt-4">{t.noUpcomingReservations}</p>}
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold text-brand-dark border-b pb-2">{t.past} ({past.length})</h3>
        {past.length > 0 ? <>{renderGroup(pastGrouped)}</> : <p className="text-brand-gray mt-4">{t.noPastReservations}</p>}
      </div>
    </div>
  );
};

export default Reservations;
