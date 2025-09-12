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
      icon: commonIcons.upsell,
      title: 'Automated Upsells',
      description: 'Increase revenue per customer by setting up intelligent service add-ons during the booking process.',
    },
    {
      icon: commonIcons.company,
      title: 'Company Profile Setup',
      description: 'Optimize your business details, including opening hours and location, to maximize your availability and reach.',
    },
    {
      icon: commonIcons.webpage,
      title: 'Free Client Booking Page',
      description: 'We generate a sleek, professional, and mobile-friendly webpage for your clients to book your services 24/7.',
    },
    {
      icon: commonIcons.carwash,
      title: 'Online Lead Generation',
      description: 'Capture new leads directly from your booking page and convert them into loyal customers with ease.',
    },
  ],
  fr: [
    {
      icon: commonIcons.calendar,
      title: 'Gestion de calendrier intelligente',
      description: 'Gérez sans effort vos rendez-vous, évitez les doubles réservations et visualisez votre emploi du temps en un coup d\'œil.',
    },
    {
      icon: commonIcons.catalog,
      title: 'Catalogue de services dynamique',
      description: 'Créez, personnalisez et fixez le prix de vos services de detailing. Du simple lavage à la protection céramique complète.',
    },
    {
      icon: commonIcons.upsell,
      title: 'Ventes additionnelles automatisées',
      description: 'Augmentez le revenu par client en configurant des modules complémentaires de service intelligents lors de la réservation.',
    },
    {
      icon: commonIcons.company,
      title: 'Configuration du profil de l\'entreprise',
      description: 'Optimisez les détails de votre entreprise, y compris les heures d\'ouverture et l\'emplacement, pour maximiser votre disponibilité.',
    },
    {
      icon: commonIcons.webpage,
      title: 'Page de réservation client gratuite',
      description: 'Nous générons une page web élégante, professionnelle et mobile pour que vos clients puissent réserver vos services 24/7.',
    },
    {
      icon: commonIcons.carwash,
      title: 'Génération de prospects en ligne',
      description: 'Capturez de nouveaux prospects directement depuis votre page de réservation et convertissez-les en clients fidèles.',
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
      icon: commonIcons.upsell,
      title: 'Ventas adicionales automatizadas',
      description: 'Aumenta los ingresos por cliente configurando complementos de servicio inteligentes durante el proceso de reserva.',
    },
    {
      icon: commonIcons.company,
      title: 'Configuración del perfil de la empresa',
      description: 'Optimiza los detalles de tu negocio, incluidas las horas de apertura y la ubicación, para maximizar tu disponibilidad.',
    },
    {
      icon: commonIcons.webpage,
      title: 'Página de reserva de cliente gratuita',
      description: 'Generamos una página web elegante, profesional y compatible con móviles para que tus clientes reserven tus servicios 24/7.',
    },
    {
      icon: commonIcons.carwash,
      title: 'Generación de leads en línea',
      description: 'Captura nuevos leads directamente desde tu página de reservas y conviértelos en clientes leales con facilidad.',
    },
  ]
};

export const HOW_IT_WORKS_STEPS = {
  en: [
    { step: 1, title: 'Sign Up & Setup', description: 'Create your account in minutes. Add your company details, services, and pricing.' },
    { step: 2, title: 'Share Your Page', description: 'We instantly generate your custom booking page. Share the link on social media or your website.' },
    { step: 3, title: 'Accept Bookings', description: 'Clients book and pay online. You get notified, and your calendar is automatically updated.' },
  ],
  fr: [
    { step: 1, title: 'Inscrivez-vous et configurez', description: 'Créez votre compte en quelques minutes. Ajoutez les détails de votre entreprise, vos services et vos tarifs.' },
    { step: 2, title: 'Partagez votre page', description: 'Nous générons instantanément votre page de réservation personnalisée. Partagez le lien sur les réseaux sociaux ou votre site web.' },
    { step: 3, title: 'Acceptez les réservations', description: 'Les clients réservent et paient en ligne. Vous êtes averti et votre calendrier est mis à jour automatiquement.' },
  ],
  es: [
    { step: 1, title: 'Regístrate y configura', description: 'Crea tu cuenta en minutos. Añade los detalles de tu empresa, servicios y precios.' },
    { step: 2, title: 'Comparte tu página', description: 'Generamos instantáneamente tu página de reserva personalizada. Comparte el enlace en redes sociales o en tu sitio web.' },
    { step: 3, title: 'Acepta reservas', description: 'Los clientes reservan y pagan en línea. Recibes una notificación y tu calendario se actualiza automáticamente.' },
  ]
};

export const PRICING_PLANS = {
  en: [
    { 
      name: 'Solo', 
      description: 'For the individual detailer getting started.', 
      pricing: { monthly: '60', yearly: '550' },
      features: ['1 User', 'Unlimited Bookings', 'Free Booking Page', 'Basic Analytics'] 
    },
    { 
      name: 'Business', 
      description: 'For established shops with multiple locations.', 
      pricing: { monthly: '150', yearly: '1500' },
      features: ['Unlimited Users', 'Multi-location Support', 'API Access', 'Dedicated Account Manager', 'Priority Support'] 
    },
    {
      name: 'Lifetime',
      description: 'One payment for lifetime access. Never worry about subscriptions again.',
      pricing: { onetime: '3000' },
      features: ['Everything in Business', 'Lifetime Updates', 'VIP Support', 'Early Access to New Features']
    }
  ],
  fr: [
    { 
      name: 'Solo', 
      description: 'Pour l\'artisan indépendant qui se lance.', 
      pricing: { monthly: '60', yearly: '550' },
      features: ['1 Utilisateur', 'Réservations illimitées', 'Page de réservation gratuite', 'Analyses de base'] 
    },
    { 
      name: 'Business', 
      description: 'Pour les entreprises établies avec plusieurs sites.', 
      pricing: { monthly: '150', yearly: '1500' },
      features: ['Utilisateurs illimités', 'Support multi-sites', 'Accès API', 'Gestionnaire de compte dédié', 'Support prioritaire'] 
    },
    {
      name: 'À Vie',
      description: 'Un paiement unique pour un accès à vie. Ne vous souciez plus jamais des abonnements.',
      pricing: { onetime: '3000' },
      features: ['Tout de Business', 'Mises à jour à vie', 'Support VIP', 'Accès anticipé aux nouveautés']
    }
  ],
  es: [
    { 
      name: 'Solo', 
      description: 'Para el detallista individual que está empezando.', 
      pricing: { monthly: '60', yearly: '550' },
      features: ['1 Usuario', 'Reservas ilimitadas', 'Página de reserva gratuita', 'Análisis básicos'] 
    },
    { 
      name: 'Business', 
      description: 'Para talleres establecidos con múltiples ubicaciones.', 
      pricing: { monthly: '150', yearly: '1500' },
      features: ['Usuarios ilimitados', 'Soporte multi-ubicación', 'Acceso API', 'Gestor de cuenta dedicado', 'Soporte prioritario'] 
    },
    {
      name: 'De por vida',
      description: 'Un pago único para acceso de por vida. No te preocupes más por las suscripciones.',
      pricing: { onetime: '3000' },
      features: ['Todo en Business', 'Actualizaciones de por vida', 'Soporte VIP', 'Acceso anticipado a nuevas funciones']
    }
  ]
};

export const FAQ_ITEMS = {
  en: [
    { question: 'What payment gateways do you support?', answer: 'We support Stripe and PayPal for seamless online payments. We also offer an \'in-store payment\' option. To secure appointments made with this option, we require a €20 deposit. A fee is applied for any cancellation made less than 24 hours before the appointment.' },
    { question: 'Is DetailDeck suitable for mobile detailing businesses?', answer: 'Yes, it\'s perfect for mobile detailers. You can set service areas, manage your travel schedule, and allow clients to book you at their location, all from our platform.' },
  ],
  fr: [
    { question: 'Quelles passerelles de paiement supportez-vous ?', answer: 'Nous prenons en charge Stripe et PayPal pour des paiements en ligne fluides. Nous offrons également une option de "paiement sur place". Pour garantir les rendez-vous pris avec cette option, nous exigeons un acompte de 20 €. Des frais d\'annulation seront appliqués pour toute annulation faite moins de 24 heures avant le rendez-vous.' },
    { question: 'DetailDeck est-il adapté aux entreprises de detailing mobile ?', answer: 'Oui, c\'est parfait pour les detailers mobiles. Vous pouvez définir des zones de service, gérer votre planning de déplacement et permettre aux clients de vous réserver à leur emplacement.' },
  ],
  es: [
    { question: '¿Qué pasarelas de pago admiten?', answer: 'Admitimos Stripe y PayPal para pagos en línea sin problemas. También ofrecemos una opción de "pago en el local". Para asegurar las citas realizadas con esta opción, requerimos un depósito de 20 €. Se aplicará una tarifa de cancelación por cualquier anulación realizada con menos de 24 horas de antelación a la cita.' },
    { question: '¿Es DetailDeck adecuado para negocios de detailing móvil?', answer: 'Sí, es perfecto para detallistas móviles. Puedes establecer áreas de servicio, gestionar tu horario de viaje y permitir que los clientes te reserven en su ubicación.' },
  ]
};

export const SHOWCASE_ITEMS = {
  en: [
    { image: 'https://i.imgur.com/8aK3N3y.png', title: 'showcaseItem1Title' },
    { image: 'https://i.imgur.com/g08e6vC.png', title: 'showcaseItem2Title' },
    { image: 'https://i.imgur.com/3hVzL2A.png', title: 'showcaseItem3Title' },
    { image: 'https://i.imgur.com/s64hN5G.png', title: 'showcaseItem4Title' },
    { image: 'https://i.imgur.com/5q0Yk9p.png', title: 'showcaseItem5Title' },
  ],
  fr: [
    { image: 'https://i.imgur.com/8aK3N3y.png', title: 'showcaseItem1Title' },
    { image: 'https://i.imgur.com/g08e6vC.png', title: 'showcaseItem2Title' },
    { image: 'https://i.imgur.com/3hVzL2A.png', title: 'showcaseItem3Title' },
    { image: 'https://i.imgur.com/s64hN5G.png', title: 'showcaseItem4Title' },
    { image: 'https://i.imgur.com/5q0Yk9p.png', title: 'showcaseItem5Title' },
  ],
  es: [
    { image: 'https://i.imgur.com/8aK3N3y.png', title: 'showcaseItem1Title' },
    { image: 'https://i.imgur.com/g08e6vC.png', title: 'showcaseItem2Title' },
    { image: 'https://i.imgur.com/3hVzL2A.png', title: 'showcaseItem3Title' },
    { image: 'https://i.imgur.com/s64hN5G.png', title: 'showcaseItem4Title' },
    { image: 'https://i.imgur.com/5q0Yk9p.png', title: 'showcaseItem5Title' },
  ]
};

export const STRIPE_PRICE_IDS = {
  soloEarlyAccess: 'price_1PexampleSoloEarlyAccess0001', // Replace with your actual Stripe Price ID
  businessEarlyAccess: 'price_1PexampleBusinessEarlyAccess0002', // Replace with your actual Stripe Price ID
  lifetimeEarlyAccess: 'price_1PexampleLifetimeEarlyAccess0003', // Replace with your actual Stripe Price ID
};