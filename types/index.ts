// Types permissifs pour éviter les erreurs au déploiement
// Enums pour les délais de réservation
export enum MinBookingNotice {
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  SIX_HOURS = '6h',
  TWELVE_HOURS = '12h',
  ONE_DAY = '1d',
  TWO_DAYS = '2d'
}

export enum MaxBookingHorizon {
  ONE_WEEK = '1w',
  TWO_WEEKS = '2w',
  THREE_WEEKS = '3w',
  FOUR_WEEKS = '4w',
  FIVE_WEEKS = '5w',
  SIX_WEEKS = '6w',
  SEVEN_WEEKS = '7w',
  EIGHT_WEEKS = '8w'
}

// Utilitaires pour convertir les enums en valeurs numériques
export const getMinBookingNoticeInHours = (notice: MinBookingNotice): number => {
  const value = parseInt(notice.replace(/[hd]/g, ''));
  return notice.includes('d') ? value * 24 : value;
};

export const getMaxBookingHorizonInDays = (horizon: MaxBookingHorizon): number => {
  const value = parseInt(horizon.replace('w', ''));
  return value * 7; // Toutes les valeurs sont en semaines maintenant
};

export const getMaxBookingHorizonInWeeks = (horizon: MaxBookingHorizon): number => {
  return parseInt(horizon.replace('w', ''));
};

export interface BookingRules {
  min_booking_notice: MinBookingNotice;
  max_booking_horizon: MaxBookingHorizon;
  min_notice_hours: number; // Valeur calculée en heures
}

export interface Shop {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  description?: string;
  businessType: 'local' | 'mobile' | 'both';
  hasLocalService: boolean;
  hasMobileService: boolean;
  schedule: any; // TODO: typer correctement
  minBookingNotice: MinBookingNotice;
  maxBookingHorizon: MaxBookingHorizon;
  minBookingDelay?: number; // en heures (colonne DB)
  maxBookingHorizonWeeks?: number; // en semaines (colonne DB)
  // ... autres propriétés
}

export type Service = any;
export type Formula = any;
export type VehicleSizeSupplement = any;
export type AddOn = any;
export type Reservation = any;
export type Lead = any;
export type ShopVehicleSize = any;
export type ShopServiceCategory = any;
export type FullShopData = any;
export type ServiceCategoryFormData = any;
export type VehicleSizeFormData = any;
export type CategoryIconName = any;

export const AVAILABLE_CATEGORY_ICONS = ['car', 'wash', 'tools', 'star'] as const;

// Options pour les selects de délais
export const MIN_BOOKING_NOTICE_OPTIONS = [
  { value: MinBookingNotice.ONE_HOUR, label: '1 heure' },
  { value: MinBookingNotice.TWO_HOURS, label: '2 heures' },
  { value: MinBookingNotice.FOUR_HOURS, label: '4 heures' },
  { value: MinBookingNotice.SIX_HOURS, label: '6 heures' },
  { value: MinBookingNotice.TWELVE_HOURS, label: '12 heures' },
  { value: MinBookingNotice.ONE_DAY, label: '1 jour' },
  { value: MinBookingNotice.TWO_DAYS, label: '2 jours' }
];

export const MAX_BOOKING_HORIZON_OPTIONS = [
  { value: MaxBookingHorizon.ONE_WEEK, label: 'Jusqu\'à 1 semaine à l\'avance' },
  { value: MaxBookingHorizon.TWO_WEEKS, label: 'Jusqu\'à 2 semaines à l\'avance' },
  { value: MaxBookingHorizon.THREE_WEEKS, label: 'Jusqu\'à 3 semaines à l\'avance' },
  { value: MaxBookingHorizon.FOUR_WEEKS, label: 'Jusqu\'à 4 semaines à l\'avance' },
  { value: MaxBookingHorizon.FIVE_WEEKS, label: 'Jusqu\'à 5 semaines à l\'avance' },
  { value: MaxBookingHorizon.SIX_WEEKS, label: 'Jusqu\'à 6 semaines à l\'avance' },
  { value: MaxBookingHorizon.SEVEN_WEEKS, label: 'Jusqu\'à 7 semaines à l\'avance' },
  { value: MaxBookingHorizon.EIGHT_WEEKS, label: 'Jusqu\'à 8 semaines à l\'avance' }
];
