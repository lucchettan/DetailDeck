import React from 'react';

// Icône de voiture simple et claire
const CarIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
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

export default CarIcon;
