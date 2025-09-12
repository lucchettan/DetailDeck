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
    { name: 'Solo', price: '60', description: 'For the individual detailer getting started.', features: ['1 User', 'Unlimited Bookings', 'Free Booking Page', 'Basic Analytics'] },
    { name: 'Business', price: '150', description: 'For established shops with multiple locations.', features: ['Unlimited Users', 'Multi-location Support', 'API Access', 'Dedicated Account Manager', 'Priority Support'] },
  ],
  fr: [
    { name: 'Solo', price: '60', description: 'Pour l\'artisan indépendant qui se lance.', features: ['1 Utilisateur', 'Réservations illimitées', 'Page de réservation gratuite', 'Analyses de base'] },
    { name: 'Business', price: '150', description: 'Pour les entreprises établies avec plusieurs sites.', features: ['Utilisateurs illimités', 'Support multi-sites', 'Accès API', 'Gestionnaire de compte dédié', 'Support prioritaire'] },
  ],
  es: [
    { name: 'Solo', price: '60', description: 'Para el detallista individual que está empezando.', features: ['1 Usuario', 'Reservas ilimitadas', 'Página de reserva gratuita', 'Análisis básicos'] },
    { name: 'Business', price: '150', description: 'Para talleres establecidos con múltiples ubicaciones.', features: ['Usuarios ilimitados', 'Soporte multi-ubicación', 'Acceso API', 'Gestor de cuenta dedicado', 'Soporte prioritario'] },
  ]
};

export const FAQ_ITEMS = {
  en: [
    { question: 'Can I use my own domain name for the booking page?', answer: 'DetailDeck generates a unique and professional booking page for your business (e.g., `detaildeck.com/your-name`). You can share this link directly with your clients on your website, social media, or business cards. We do not support custom domains at this time.' },
    { question: 'What payment gateways do you support?', answer: 'We support Stripe and PayPal for seamless online payments. We also offer an \'in-store payment\' option. To secure appointments made with this option, we require a €20 deposit. A fee is applied for any cancellation made less than 24 hours before the appointment.' },
    { question: 'Can I customize the design of my booking page?', answer: 'Your booking page is designed to be clean, professional, and optimized for conversions. While extensive design customization is not currently available, you can upload your business logo and showcase your services to provide a branded experience for your clients.' },
    { question: 'Is DetailDeck suitable for mobile detailing businesses?', answer: 'Yes, it\'s perfect for mobile detailers. You can set service areas, manage your travel schedule, and allow clients to book you at their location, all from our platform.' },
  ],
  fr: [
    { question: 'Puis-je utiliser mon propre nom de domaine pour la page de réservation ?', answer: 'DetailDeck génère une page de réservation unique et professionnelle pour votre entreprise (ex: `detaildeck.com/votre-nom`). Vous pouvez partager ce lien directement avec vos clients sur votre site web, les réseaux sociaux ou vos cartes de visite. Nous ne prenons pas en charge les domaines personnalisés pour le moment.' },
    { question: 'Quelles passerelles de paiement supportez-vous ?', answer: 'Nous prenons en charge Stripe et PayPal pour des paiements en ligne fluides. Nous offrons également une option de "paiement sur place". Pour garantir les rendez-vous pris avec cette option, nous exigeons un acompte de 20 €. Des frais d\'annulation seront appliqués pour toute annulation faite moins de 24 heures avant le rendez-vous.' },
    { question: 'Puis-je personnaliser le design de ma page de réservation ?', answer: 'Votre page de réservation est conçue pour être épurée, professionnelle et optimisée pour les conversions. Bien que la personnalisation avancée du design ne soit pas actuellement disponible, vous pouvez télécharger le logo de votre entreprise et présenter vos services pour offrir une expérience de marque à vos clients.' },
    { question: 'DetailDeck est-il adapté aux entreprises de detailing mobile ?', answer: 'Oui, c\'est parfait pour les detailers mobiles. Vous pouvez définir des zones de service, gérer votre planning de déplacement et permettre aux clients de vous réserver à leur emplacement.' },
  ],
  es: [
    { question: '¿Puedo usar mi propio nombre de dominio para la página de reservas?', answer: 'DetailDeck genera una página de reserva única y profesional para tu negocio (p. ej., `detaildeck.com/tu-nombre`). Puedes compartir este enlace directamente con tus clientes en tu sitio web, redes sociales o tarjetas de visita. Actualmente no admitimos dominios personalizados.' },
    { question: '¿Qué pasarelas de pago admiten?', answer: 'Admitimos Stripe y PayPal para pagos en línea sin problemas. También ofrecemos una opción de "pago en el local". Para asegurar las citas realizadas con esta opción, requerimos un depósito de 20 €. Se aplicará una tarifa de cancelación por cualquier anulación realizada con menos de 24 horas de antelación a la cita.' },
    { question: '¿Puedo personalizar el diseño de mi página de reservas?', answer: 'Tu página de reservas está diseñada para ser limpia, profesional y optimizada para las conversiones. Aunque la personalización avanzada del diseño no está disponible actualmente, puedes subir el logotipo de tu negocio y mostrar tus servicios para ofrecer una experiencia de marca a tus clientes.' },
    { question: '¿Es DetailDeck adecuado para negocios de detailing móvil?', answer: 'Sí, es perfecto para detallistas móviles. Puedes establecer áreas de servicio, gestionar tu horario de viaje y permitir que los clientes te reserven en su ubicación.' },
  ]
};