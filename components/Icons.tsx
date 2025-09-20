

import React from 'react';

// FIX: Extend React.SVGProps to allow standard SVG attributes like 'style' to be passed.
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
}

// FIX: Pass through ...rest props to the underlying SVG element.
export const CarWashIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.25a.25.25 0 01-.25-.25v-2.75a.25.25 0 01.5 0v2.75a.25.25 0 01-.25.25zM12 2a10 10 0 00-7.37 16.79l-1.07 1.07a.75.75 0 001.06 1.06l1.07-1.07A10 10 0 1012 2zM4.04 15.22a.75.75 0 00-1.28.78 8.5 8.5 0 0110.2-10.2.75.75 0 10-.78-1.28A10.002 10.002 0 004.04 15.22z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12.5a.5.5 0 01-.5-.5v-2a.5.5 0 011 0v2a.5.5 0 01-.5.5zM16 12.5a.5.5 0 01-.5-.5v-2a.5.5 0 011 0v2a.5.5 0 01-.5.5z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CalendarIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CatalogIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4M3 7h18M5 12h.01M7 12h.01M9 12h.01" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const UpsellIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CompanyIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h6m-6 4h6m-6 4h6" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const WebpageIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m0 18a9 9 0 009-9" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CheckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CheckBadgeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className={className} {...rest}>
      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);


// FIX: Pass through ...rest props to the underlying SVG element.
export const ChevronDownIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ChevronLeftIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);


// FIX: Pass through ...rest props to the underlying SVG element.
export const CloseIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const SuccessIcon: React.FC<IconProps> = ({ className = 'w-16 h-16', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Dashboard Icons
// FIX: Pass through ...rest props to the underlying SVG element.
export const StorefrontIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V11M9 21V11M15 21V11M4 7h16M4 7l-1 4h18l-1-4M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M8 11h8" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ClockIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const TagIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l-5 5 5 5 5-5-5-5z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CalendarDaysIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ListBulletIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ChartPieIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1012 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const PlusIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const MoneyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const HourglassIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ImageIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const SaveIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const TrashIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const LinkIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
  </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ShareIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.195.025.39.042.586.042h4.414c.196 0 .391-.017.586-.042M7.217 10.907a2.25 2.25 0 012.248-2.03l4.414.002a2.25 2.25 0 012.248 2.03m-8.91.414a2.25 2.25 0 00-2.248 2.03l4.414.002a2.25 2.25 0 002.248-2.03m-8.91-.414v.216C4.954 12.354 4.5 13.518 4.5 14.75c0 1.232.454 2.396 1.217 3.283m0 0c.195.025.39.042.586.042h4.414c.196 0 .391-.017.586-.042m-4.59 3.283a2.25 2.25 0 012.248-2.03l4.414.002a2.25 2.25 0 012.248 2.03" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const UserCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CalendarPlusIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const HomeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M3 9v11.25a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 20.25V9M3 9h18" />
    </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
);

// New icons for Benefits section
// FIX: Pass through ...rest props to the underlying SVG element.
export const CustomServicesIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104l-1.12 2.242-2.242 1.12 2.242 1.12 1.12 2.242 1.12-2.242 2.242-1.12-2.242-1.12L9.75 3.104zM16.5 15.75l-1.12 2.242-2.242 1.12 2.242 1.12 1.12 2.242 1.12-2.242 2.242-1.12-2.242-1.12L16.5 15.75zM4.5 9.75l-1.12 2.242-2.242 1.12 2.242 1.12 1.12 2.242 1.12-2.242 2.242-1.12-2.242-1.12L4.5 9.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.104l1.12 2.242 2.242 1.12-2.242 1.12-1.12 2.242-1.12-2.242-2.242-1.12 2.242 1.12 1.12-2.242z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const AutomatedBookingIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 16l2 2 4-4" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const ManagedCalendarIcon: React.FC<IconProps> = ({ className = 'w-8 h-8', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CreditCardIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const CarIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...rest}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const PhoneIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);

// FIX: Pass through ...rest props to the underlying SVG element.
export const MapPinIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

export const PencilIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const CogIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l-1.41-.513M5.957 5.957l1.41.513m14.095 5.13l-1.41.513M12.001 19.5v-2.25m0-13.5v2.25m0 0a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639l4.43-4.43a1.012 1.012 0 011.433 0l4.43 4.43a1.012 1.012 0 010 .639l-4.43 4.43a1.012 1.012 0 01-1.433 0l-4.43-4.43z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const EnvelopeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
);

export const KeyIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.967-.531 1.563-.432 2.596.426 5.217 2.24 7.029 5.912z" />
    </svg>
);

export const BuildingOffice2Icon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-3-1m-3 1l-3 1m3-1V7.5M6.75 21v-2.25m0 0v-2.25m0 2.25h3m-3-2.25h3" />
    </svg>
);

export const TruckIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5a3.375 3.375 0 013.375-3.375H16.5a3.375 3.375 0 013.375 3.375v1.875m-17.25 4.5a3.375 3.375 0 003.375 3.375h1.5a1.125 1.125 0 001.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H5.25" />
  </svg>
);

export const GavelIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
        <g strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.25 3.813l5.938 5.937a2.25 2.25 0 010 3.182l-3.182 3.182a2.25 2.25 0 01-3.182 0l-5.938-5.937a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 0l1.061 1.06 3.182-3.182a.75.75 0 00-1.06-1.06l-1.06 1.06-2.122-2.121a.75.75 0 011.06 0l2.122 2.121 1.06-1.06a.75.75 0 011.06 0zM5.25 21a.75.75 0 001.5 0v-4.504a2.25 2.25 0 011.168-1.956l1.24-.62a2.25 2.25 0 00-1.168-4.302l-.62-.31a2.25 2.25 0 01-1.168-1.956V3a.75.75 0 00-1.5 0v3.246a2.25 2.25 0 01-1.168 1.956l-1.24.62a2.25 2.25 0 001.168 4.302l.62.31a2.25 2.25 0 011.168 1.956V21z" />
        </g>
    </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" />
    </svg>
);

export const Bars3Icon: React.FC<IconProps> = ({ className = 'w-6 h-6', ...rest }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} {...rest}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-1.5 5.25h16.5" />
  </svg>
);