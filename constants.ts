
import React from 'react';
import { CarWashIcon, CalendarIcon, CatalogIcon, UpsellIcon, CompanyIcon, WebpageIcon } from './components/Icons';

const commonIcons = {
  calendar: React.createElement(CalendarIcon, { className: "w-8 h-8 text-brand-blue" }),
  catalog: React.createElement(CatalogIcon, { className: "w-8 h-8 text-brand-blue" }),
  upsell: React.createElement(UpsellIcon, { className: "w-8 h-8 text-brand-blue" }),
  company: React.createElement(CompanyIcon, { className: "w-8 h-8 text-brand-blue" }),
  webpage: React.createElement(WebpageIcon, { className: "w-8 h-8 text-brand-blue" }),
  carwash: React.createElement(CarWashIcon, { className: "w-8 h-8 text-brand-blue" }),
};

export const FEATURES = {
  en: [
    {
      icon: commonIcons.calendar,
      title: 'Smart Calendar Management',
      description: 'Effortlessly manage your appointments, avoid double bookings, and visualize your schedule at a glance.',
    },
    {
      icon: commonIcons.catalog,
      title: 'Dynamic Service Catalogue',
      description: 'Create, customize, and price your detailing services. From a simple wash to a full ceramic coat.',
    },
    {
      icon: commonIcons.webpage,
      title: '24/7 Booking Page',
      description: 'Get a professional, mobile-friendly page for your clients to book your services anytime.',
    },
    {
      icon: commonIcons.carwash,
      title: 'Automated Lead Generation',
      description: 'Turn your visitors into customers with a simple online booking system.',
    },
  ],
  fr: [
    {
      icon: commonIcons.calendar,
      title: 'Gestion de planning intelligente',
      description: 'Dites adieu aux rendez-vous oubliés ou doublés. Votre emploi du temps est clair, simple et toujours à jour.',
    },
    {
      icon: commonIcons.catalog,
      title: 'Catalogue de services flexible',
      description: 'Présentez vos services comme vous le souhaitez, fixez vos prix et laissez vos clients choisir en toute transparence.',
    },
    {
      icon: commonIcons.webpage,
      title: 'Page de réservation 24/7',
      description: 'Obtenez une page pro et mobile-friendly pour que vos clients réservent vos services à tout moment.',
    },
    {
      icon: commonIcons.carwash,
      title: 'Génération automatique de prospects',
      description: 'Transformez vos visiteurs en clients grâce à un système simple de réservation en ligne.',
    },
  ],
  es: [
     {
      icon: commonIcons.calendar,
      title: 'Gestión inteligente de calendario',
      description: 'Gestiona tus citas sin esfuerzo, evita dobles reservas y visualiza tu horario de un vistazo.',
    },
    {
      icon: commonIcons.catalog,
      title: 'Catálogo de servicios dinámico',
      description: 'Crea, personaliza y pon precio a tus servicios de detailing. Desde un simple lavado hasta una capa de cerámica completa.',
    },
    {
      icon: commonIcons.webpage,
      title: 'Página de reserva 24/7',
      description: 'Obtén una página profesional y compatible con móviles para que tus clientes reserven tus servicios en cualquier momento.',
    },
    {
      icon: commonIcons.carwash,
      title: 'Generación automática de prospectos',
      description: 'Convierte a tus visitantes en clientes con un sistema de reserva en línea sencillo.',
    },
  ]
};

export const HOW_IT_WORKS_STEPS = {
  en: [
    { step: 1, title: 'Define Your Schedule', description: 'Set your availability and service areas. Clients only see the slots where you are truly available.' },
    { step: 2, title: 'Define Your Catalog', description: 'Add your services, their durations, and their prices. Offer add-ons to increase the average ticket.' },
    { step: 3, title: 'Share & Get Paid', description: 'Share your booking page. Your clients book and pay online, 24/7.' },
  ],
  fr: [
    { step: 1, title: 'Définissez votre planning', description: 'Configurez vos horaires et zones d\'intervention. Vos clients ne voient que les créneaux où vous êtes réellement disponible.' },
    { step: 2, title: 'Définissez votre catalogue', description: 'Ajoutez vos prestations, leurs durées et leurs tarifs. Proposez des options pour augmenter le panier moyen.' },
    { step: 3, title: 'Partagez et encaissez', description: 'Partagez votre page de réservation. Vos clients réservent et paient en ligne, 24/7.' },
  ],
  es: [
    { step: 1, title: 'Define tu horario', description: 'Configura tu disponibilidad y áreas de servicio. Los clientes solo ven los horarios en los que estás realmente disponible.' },
    { step: 2, title: 'Define tu catálogo', description: 'Añade tus servicios, sus duraciones y sus precios. Ofrece extras para aumentar el ticket promedio.' },
    { step: 3, title: 'Comparte y recibe pagos', description: 'Comparte tu página de reservas. Tus clientes reservan y pagan en línea, 24/7.' },
  ]
};

export interface PricingPlan {
  id: 'monthly' | 'annual' | 'lifetime';
  name: string;
  price: string;
  originalPrice: string;
  period: string;
  description: string;
  features: string[];
  isFeatured?: boolean;
}

export interface PricingPlans {
  en: PricingPlan[];
  fr: PricingPlan[];
  es: PricingPlan[];
}


export const PRICING_PLANS: PricingPlans = {
  en: [
    { 
      id: 'monthly',
      name: 'Monthly', 
      price: '100',
      originalPrice: '150',
      period: '/month',
      description: 'Perfect for getting started and experiencing all features.',
      features: ['All Pro Features', 'Unlimited Bookings', 'Free Booking Page', 'Email Support'] 
    },
    {
      id: 'annual',
      name: 'Annual',
      price: '900',
      originalPrice: '1500',
      period: '/year',
      description: 'Save big with an annual commitment.',
      isFeatured: true,
      features: ['Everything in Monthly', 'Priority Support', 'Early access to new features']
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: '1500',
      originalPrice: '3000',
      period: 'one time',
      description: 'Pay once, own it forever. The ultimate deal.',
      features: ['Everything in Annual', 'Lifetime Updates', 'VIP Support Channel']
    }
  ],
  fr: [
    { 
      id: 'monthly',
      name: 'Mensuel', 
      price: '100',
      originalPrice: '150',
      period: '/mois',
      description: 'Idéal pour commencer et découvrir toutes les fonctionnalités.',
      features: ['Toutes les fonctionnalités Pro', 'Réservations illimitées', 'Page de réservation gratuite', 'Support par email'] 
    },
    {
      id: 'annual',
      name: 'Annuel',
      price: '900',
      originalPrice: '1500',
      period: '/an',
      description: 'Économisez en vous engageant sur une année.',
      isFeatured: true,
      features: ['Tout du plan Mensuel', 'Support prioritaire', 'Accès anticipé aux nouveautés']
    },
    {
      id: 'lifetime',
      name: 'À Vie',
      price: '1500',
      originalPrice: '3000',
      period: 'une fois',
      description: 'Payez une seule fois, profitez-en à vie. La meilleure offre.',
      features: ['Tout du plan Annuel', 'Mises à jour à vie', 'Support VIP dédié']
    }
  ],
  es: [
     { 
      id: 'monthly',
      name: 'Mensual', 
      price: '100',
      originalPrice: '150',
      period: '/mes',
      description: 'Perfecto para empezar y probar todas las características.',
      features: ['Todas las funciones Pro', 'Reservas ilimitadas', 'Página de reserva gratuita', 'Soporte por correo electrónico'] 
    },
    {
      id: 'annual',
      name: 'Anual',
      price: '900',
      originalPrice: '1500',
      period: '/año',
      description: 'Ahorra a lo grande con un compromiso anual.',
      isFeatured: true,
      features: ['Todo del plan Mensual', 'Soporte prioritario', 'Acceso anticipado a nuevas funciones']
    },
    {
      id: 'lifetime',
      name: 'De por vida',
      price: '1500',
      originalPrice: '3000',
      period: 'una vez',
      description: 'Paga una vez, úsalo para siempre. La oferta definitiva.',
      features: ['Todo del plan Anual', 'Actualizaciones de por vida', 'Canal de soporte VIP']
    }
  ]
};

export const FAQ_ITEMS = {
  en: [
    { question: 'What payment gateways do you support?', answer: 'We support Stripe and PayPal for seamless online payments. We also offer an \'in-store payment\' option. To secure appointments made with this option, we require a €20 deposit. A fee is applied for any cancellation made less than 24 hours before the appointment.' },
    { question: 'Is ResaOne suitable for mobile detailing businesses?', answer: 'Yes, it\'s perfect for mobile detailers. You can set service areas, manage your travel schedule, and allow clients to book you at their location, all from our platform.' },
  ],
  fr: [
    { question: 'Quelles passerelles de paiement supportez-vous ?', answer: 'Nous prenons en charge Stripe et PayPal pour des paiements en ligne fluides. Nous offrons également une option de "paiement sur place". Pour garantir les rendez-vous pris avec cette option, nous exigeons un acompte de 20 €. Des frais d\'annulation seront appliqués pour toute annulation faite moins de 24 heures avant le rendez-vous.' },
    { question: 'ResaOne est-il adapté aux entreprises de detailing mobile ?', answer: 'Oui, c\'est parfait pour les detailers mobiles. Vous pouvez définir des zones de service, gérer votre planning de déplacement et permettre aux clients de vous réserver à leur emplacement.' },
  ],
  es: [
    { question: '¿Qué pasarelas de pago admiten?', answer: 'Admitimos Stripe y PayPal para pagos en línea sin problemas. También ofrecemos una opción de "pago en el local". Para asegurar las citas realizadas con esta opción, requerimos un depósito de 20 €. Se aplicará una tarifa de cancelación por cualquier anulación realizada con menos de 24 horas de antelación a la cita.' },
    { question: '¿Es ResaOne adecuado para negocios de detailing móvil?', answer: 'Sí, es perfecto para detallistas móviles. Puedes establecer áreas de servicio, gestionar tu horario de viaje y permitir que los clientes te reserven en su ubicación.' },
  ]
};
