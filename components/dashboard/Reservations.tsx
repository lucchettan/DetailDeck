

import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Reservation } from '../Dashboard';
import { CalendarPlusIcon } from '../Icons';

interface ReservationsProps {
  reservations: Reservation[];
  onAdd: () => void;
  onEdit: (reservation: Reservation) => void;
}

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

const ReservationCard: React.FC<{ reservation: Reservation; onEdit: (res: Reservation) => void; }> = ({ reservation, onEdit }) => {
  const { t } = useLanguage();
  const { startTime, duration, clientName, serviceDetails, status, paymentStatus } = reservation;
  
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

  const endTime = calculateEndTime(startTime, duration);
  
  const serviceDisplayName = useMemo(() => {
    if (!serviceDetails?.services || serviceDetails.services.length === 0) {
        return 'Service non spécifié';
    }
    const mainService = serviceDetails.services[0];
    let displayName = `${mainService.serviceName} (${mainService.formulaName})`;
    if (serviceDetails.services.length > 1) {
        displayName += ` + ${serviceDetails.services.length - 1} autre(s)`;
    }
    return displayName;
  }, [serviceDetails]);


  return (
    <button onClick={() => onEdit(reservation)} className="w-full text-left bg-white p-4 rounded-lg shadow-md border hover:border-brand-blue transition-all">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <div className="mt-2 sm:mt-0">
          <p className="font-semibold text-brand-dark flex items-baseline gap-2">
            <span className="text-lg">{startTime}</span>
            {endTime && <span className="text-sm text-brand-gray">&ndash; {endTime}</span>}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="font-bold text-brand-dark">{clientName}</p>
          <p className="text-sm text-brand-gray">{serviceDisplayName}</p>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-brand-gray">{t.payment}:</span>
        <span className={`px-2 py-1 rounded-full font-semibold ${getStatusBadgeStyle(status)}`}>
          {t[`status_${status}`]}
        </span>
        <span className={`px-2 py-1 rounded-full font-semibold ${getPaymentStatusBadgeStyle(paymentStatus)}`}>
          {t[`payment_${paymentStatus}`]}
        </span>
      </div>
    </button>
  );
};


const Reservations: React.FC<ReservationsProps> = ({ reservations, onAdd, onEdit }) => {
  const { t } = useLanguage();

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
  
  const upcomingGrouped = groupReservationsByDate(upcoming.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
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
  }

  return (
    <div>
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
        {upcoming.length > 0 ? renderGroup(upcomingGrouped) : <p className="text-brand-gray mt-4">{t.noUpcomingReservations}</p>}
      </div>

      <div className="mt-12">
        <h3 className="text-xl font-bold text-brand-dark border-b pb-2">{t.past} ({past.length})</h3>
        {past.length > 0 ? renderGroup(pastGrouped) : <p className="text-brand-gray mt-4">{t.noPastReservations}</p>}
      </div>
    </div>
  );
};

export default Reservations;
