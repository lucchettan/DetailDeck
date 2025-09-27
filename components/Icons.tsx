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

// Icône de service
const ServiceIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// Icône de cercle avec checkmark
const CheckCircleIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Icône d'image
const ImageIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// Icône de sauvegarde
const SaveIconSvg: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
);

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

// Exports des icônes spécifiques
export const CloseIcon = CloseIconSvg;
export const ShopIcon = ShopIconSvg;
export const ClockIcon = ClockIconSvg;
export const CategoryIcon = CategoryIconSvg;
export const ServiceIcon = ServiceIconSvg;
export const CheckCircleIcon = CheckCircleIconSvg;
export const ImageIcon = ImageIconSvg;
export const SaveIcon = SaveIconSvg;
export const CarIcon = CarIconSvg;

// Toutes les autres icônes utilisent l'icône générique
export const ArrowRightIcon = GenericIcon;
export const ArrowLeftIcon = GenericIcon;
export const ChevronRightIcon = GenericIcon;
export const ChevronLeftIcon = GenericIcon;
export const ChevronDownIcon = GenericIcon;
export const ChevronUpIcon = GenericIcon;
export const MenuIcon = GenericIcon;
export const XMarkIcon = GenericIcon;
export const UserIcon = GenericIcon;
export const BellIcon = GenericIcon;
export const MagnifyingGlassIcon = GenericIcon;
export const HeartIcon = GenericIcon;
export const StarIcon = GenericIcon;
export const EyeIcon = GenericIcon;
export const EyeSlashIcon = GenericIcon;
export const LockClosedIcon = GenericIcon;
export const EnvelopeIcon = GenericIcon;
export const KeyIcon = GenericIcon;
export const HomeIcon = GenericIcon;
export const CalendarIcon = GenericIcon;
export const DocumentTextIcon = GenericIcon;
export const ChartBarIcon = GenericIcon;
export const CogIcon = GenericIcon;
export const UserGroupIcon = GenericIcon;
export const CurrencyDollarIcon = GenericIcon;
export const TruckIcon = GenericIcon;
export const MapPinIcon = GenericIcon;
export const PhoneIcon = GenericIcon;
export const GlobeAltIcon = GenericIcon;
export const InformationCircleIcon = GenericIcon;
export const ExclamationTriangleIcon = GenericIcon;
export const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
export const XCircleIcon = GenericIcon;
export const CancelIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
export const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);
export const MinusIcon = GenericIcon;
export const PencilIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

export const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
export const DocumentIcon = GenericIcon;
export const FolderIcon = GenericIcon;
export const PaperClipIcon = GenericIcon;
export const CloudArrowUpIcon = GenericIcon;
export const CloudArrowDownIcon = GenericIcon;
export const ArrowPathIcon = GenericIcon;
export const PlayIcon = GenericIcon;
export const PauseIcon = GenericIcon;
export const StopIcon = GenericIcon;
export const SpeakerWaveIcon = GenericIcon;
export const SpeakerXMarkIcon = GenericIcon;
export const VideoCameraIcon = GenericIcon;
export const PhotoIcon = GenericIcon;
export const FilmIcon = GenericIcon;
export const MusicalNoteIcon = GenericIcon;
export const MicrophoneIcon = GenericIcon;
export const CameraIcon = GenericIcon;
export const PaintBrushIcon = GenericIcon;
export const WrenchScrewdriverIcon = GenericIcon;
export const BuildingOfficeIcon = GenericIcon;
export const BuildingStorefrontIcon = GenericIcon;
export const MapIcon = GenericIcon;
export const GlobeIcon = GenericIcon;
export const WifiIcon = GenericIcon;
export const SignalIcon = GenericIcon;
export const BatteryIcon = GenericIcon;
export const LightBulbIcon = GenericIcon;
export const FireIcon = GenericIcon;
export const BoltIcon = GenericIcon;
export const SunIcon = GenericIcon;
export const MoonIcon = GenericIcon;
export const CloudIcon = GenericIcon;
export const CloudRainIcon = GenericIcon;
export const CloudSnowIcon = GenericIcon;
export const CloudSunIcon = GenericIcon;
export const CloudMoonIcon = GenericIcon;
export const CloudLightningIcon = GenericIcon;
export const CloudFogIcon = GenericIcon;
export const CloudHailIcon = GenericIcon;
export const CloudDrizzleIcon = GenericIcon;
export const CloudSleetIcon = GenericIcon;
export const CloudThunderstormIcon = GenericIcon;
export const CloudTornadoIcon = GenericIcon;
export const CloudWindIcon = GenericIcon;
export const CloudXMarkIcon = GenericIcon;
export const CloudCheckIcon = GenericIcon;
export const CloudExclamationIcon = GenericIcon;
export const CloudQuestionIcon = GenericIcon;
export const CloudMinusIcon = GenericIcon;
export const CloudPlusIcon = GenericIcon;
export const CloudArrowRightIcon = GenericIcon;
export const CloudArrowLeftIcon = GenericIcon;
export const CloudArrowPathIcon = GenericIcon;
export const CloudArrowClockwiseIcon = GenericIcon;
export const CloudArrowCounterClockwiseIcon = GenericIcon;
export const CloudArrowRotateIcon = GenericIcon;
export const CloudArrowRotateClockwiseIcon = GenericIcon;
export const CloudArrowRotateCounterClockwiseIcon = GenericIcon;
export const CloudArrowRotateLeftIcon = GenericIcon;
export const CloudArrowRotateRightIcon = GenericIcon;
export const CloudArrowRotateUpIcon = GenericIcon;
export const CloudArrowRotateDownIcon = GenericIcon;
export const CloudArrowRotateXIcon = GenericIcon;
export const CloudArrowRotateYIcon = GenericIcon;
export const CloudArrowRotateZIcon = GenericIcon;
export const BookOpenIcon = GenericIcon;
export const CalendarDaysIcon = GenericIcon;
export const PhoneArrowUpRightIcon = GenericIcon;
export const TagIcon = GenericIcon;
export const ListBulletIcon = GenericIcon;
export const LinkIcon = GenericIcon;
export const ShareIcon = GenericIcon;

// Missing icons that are imported elsewhere
export const CustomServicesIcon = GenericIcon;
export const AutomatedBookingIcon = GenericIcon;
export const ManagedCalendarIcon = GenericIcon;
export const SuccessIcon = GenericIcon;
export const StorefrontIcon = GenericIcon;
export const SparklesIcon = GenericIcon;
export const HourglassIcon = GenericIcon;
export const UserCircleIcon = GenericIcon;
export const MoneyIcon = GenericIcon;
export const CalendarPlusIcon = GenericIcon;
export const Bars3Icon = GenericIcon;
export const ShieldCheckIcon = GenericIcon;
export const BuildingOffice2Icon = GenericIcon;
export const CarWashIcon = GenericIcon;
export const CatalogIcon = GenericIcon;
export const UpsellIcon = GenericIcon;
export const CompanyIcon = GenericIcon;
export const WebpageIcon = GenericIcon;
