import React from 'react';

// Icône générique pour remplacer toutes les icônes manquantes
const GenericIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

// Toutes les icônes utilisées dans l'app
export const ChevronLeftIcon = GenericIcon;
export const ChevronRightIcon = GenericIcon;
export const EyeIcon = GenericIcon;
export const EyeSlashIcon = GenericIcon;
export const CloseIcon = GenericIcon;
export const CustomServicesIcon = GenericIcon;
export const AutomatedBookingIcon = GenericIcon;
export const ManagedCalendarIcon = GenericIcon;
export const SuccessIcon = GenericIcon;
export const ImageIcon = GenericIcon;
export const StorefrontIcon = GenericIcon;
export const CheckCircleIcon = GenericIcon;
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
export const CarIcon = GenericIcon;
export const TagIcon = GenericIcon;
export const ClockIcon = GenericIcon;
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

export default {
    ChevronLeftIcon,
    ChevronRightIcon,
    EyeIcon,
    EyeSlashIcon,
    CloseIcon,
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
    WebpageIcon
};
