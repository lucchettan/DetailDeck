import React from 'react';

// Icône générique pour remplacer toutes les icônes manquantes
const GenericIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

// Icône de fermeture spécifique (X)
const CloseIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Icône de boutique
const ShopIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

// Icône d'horloge
const ClockIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Icône de catégorie
const CategoryIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

// Icône de voiture pour les tailles de véhicules
const CarIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h4a2 2 0 002-2V7M8 7a2 2 0 012-2h4a2 2 0 012 2M8 7H6a2 2 0 00-2 2v6a2 2 0 002 2h2m8-8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2m-8 0h8" />
        <circle cx="9" cy="17" r="1" />
        <circle cx="15" cy="17" r="1" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6" />
    </svg>
);

// Icône de service
const ServiceIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// Icône de checkmark dans un cercle
const CheckCircleIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
);

// Toutes les icônes utilisées dans l'app
export const ChevronLeftIcon = GenericIcon;
export const ChevronRightIcon = GenericIcon;
export const EyeIcon = GenericIcon;
export const EyeSlashIcon = GenericIcon;
export const CloseIcon = CloseIconSvg;
export const CustomServicesIcon = GenericIcon;
export const AutomatedBookingIcon = GenericIcon;
export const ManagedCalendarIcon = GenericIcon;
export const SuccessIcon = GenericIcon;
export const ImageIcon = GenericIcon;
export const StorefrontIcon = GenericIcon;
export const CheckCircleIcon = CheckCircleIconSvg;
export const PhoneIcon = GenericIcon;
export const SparklesIcon = GenericIcon;
export const ChevronUpIcon = GenericIcon;
export const XCircleIcon = GenericIcon;
export const HourglassIcon = GenericIcon;
export const CheckIcon = GenericIcon;
export const MoneyIcon = GenericIcon;
export const UserCircleIcon = GenericIcon;
export const EnvelopeIcon = GenericIcon;
export const ChevronDownIcon = GenericIcon;
export const HomeIcon = GenericIcon;
export const BookOpenIcon = GenericIcon;
export const CalendarDaysIcon = GenericIcon;
export const CogIcon = GenericIcon;
export const PhoneArrowUpRightIcon = GenericIcon;
export const PlusIcon = GenericIcon;
// Icône de voiture pour les tailles de véhicules
const CarIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {/* Corps de la voiture */}
        <rect x="3" y="8" width="18" height="8" rx="2" strokeWidth={2} />
        {/* Pare-brise */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" />
        {/* Roues */}
        <circle cx="7" cy="18" r="2" strokeWidth={2} />
        <circle cx="17" cy="18" r="2" strokeWidth={2} />
        {/* Ligne de séparation */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6" />
    </svg>
);

export const CarIcon = CarIconSvg;
export const TagIcon = GenericIcon;
export const ClockIcon = ClockIconSvg;
export const ListBulletIcon = GenericIcon;
export const LinkIcon = GenericIcon;
export const ShareIcon = GenericIcon;
export const SaveIcon = GenericIcon;
export const TrashIcon = GenericIcon;
export const PencilIcon = GenericIcon;
export const CalendarPlusIcon = GenericIcon;
export const Bars3Icon = GenericIcon;
export const ShieldCheckIcon = GenericIcon;
export const KeyIcon = GenericIcon;
export const BuildingOffice2Icon = GenericIcon;
export const TruckIcon = GenericIcon;
export const MapPinIcon = GenericIcon;
export const CarWashIcon = GenericIcon;
export const CalendarIcon = GenericIcon;
export const CatalogIcon = GenericIcon;
export const UpsellIcon = GenericIcon;
export const CompanyIcon = GenericIcon;
export const WebpageIcon = GenericIcon;
export const ShopIcon = ShopIconSvg;
export const CategoryIcon = CategoryIconSvg;
export const ServiceIcon = ServiceIconSvg;

export default {
    ChevronLeftIcon,
    ChevronRightIcon,
    EyeIcon,
    EyeSlashIcon,
    CloseIcon: CloseIconSvg,
    CustomServicesIcon,
    AutomatedBookingIcon,
    ManagedCalendarIcon,
    SuccessIcon,
    ImageIcon,
    StorefrontIcon,
    CheckCircleIcon,
    PhoneIcon,
    SparklesIcon,
    ChevronUpIcon,
    XCircleIcon,
    HourglassIcon,
    CheckIcon,
    MoneyIcon,
    UserCircleIcon,
    EnvelopeIcon,
    ChevronDownIcon,
    HomeIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    CogIcon,
    PhoneArrowUpRightIcon,
    PlusIcon,
    CarIcon,
    TagIcon,
    ClockIcon,
    ListBulletIcon,
    LinkIcon,
    ShareIcon,
    SaveIcon,
    TrashIcon,
    PencilIcon,
    CalendarPlusIcon,
    Bars3Icon,
    ShieldCheckIcon,
    KeyIcon,
    BuildingOffice2Icon,
    TruckIcon,
    MapPinIcon,
    CarWashIcon,
    CalendarIcon,
    CatalogIcon,
    UpsellIcon,
    CompanyIcon,
    WebpageIcon,
    ShopIcon,
    CategoryIcon,
    ServiceIcon
};
