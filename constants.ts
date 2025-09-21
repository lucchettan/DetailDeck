
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
    { 
      question: 'How will my clients be able to book?', 
      answer: 'It\'s super simple! Once you set up your page, you get a unique link (e.g., resaone.com/your-name). Share this link on your social media, website, or directly with your clients. They just have to click, choose a service and an available time slot, and confirm. That\'s it! They can book 24/7, even when you\'re busy.' 
    },
    { 
      question: 'Can my clients book my entire catalog at any time?', 
      answer: 'Absolutely not! You remain in complete control. In your settings, you define your working hours, days off, and even the minimum notice for a booking. Your clients will only see and be able to book the slots where you are actually available.' 
    },
    { 
      question: 'How long does it take to set up?', 
      answer: 'It\'s very fast! In less than 15 minutes, you can set up your basic information, add your first services, and define your availability. Your booking page is then ready to be shared to receive your first bookings.' 
    },
    { 
      question: 'What happens after I sign up?', 
      answer: 'Once your account is created, you get direct access to your dashboard. A simple getting started guide helps you configure the 3 key steps: your shop info, your availability, and your first services. That\'s all it takes to start accepting online bookings.' 
    },
  ],
  fr: [
    { 
      question: "Comment mes clients vont-ils pouvoir réserver ?", 
      answer: "C'est très simple ! Une fois votre page configurée, vous recevez un lien unique (ex: resaone.com/votre-nom). Partagez ce lien sur vos réseaux sociaux, votre site web ou directement avec vos clients. Ils n'auront qu'à cliquer, choisir une prestation et un créneau disponible, puis valider. C'est tout ! Ils peuvent réserver 24/7, même quand vous êtes occupé."
    },
    { 
      question: "Mes clients pourront réserver tout mon catalogue n'importe quand?", 
      answer: "Absolument pas ! Vous gardez le contrôle total. Dans vos paramètres, vous définissez vos horaires de travail, vos jours de repos, et même le délai minimum pour une réservation. Vos clients ne verront et ne pourront réserver que les créneaux où vous êtes réellement disponible." 
    },
    { 
      question: "En combien de temps c'est mis en place ?", 
      answer: "C'est très rapide ! En moins de 15 minutes, vous pouvez configurer vos informations de base, ajouter vos premiers services et définir vos disponibilités. Votre page de réservation est alors prête à être partagée pour recevoir vos premières réservations." 
    },
    { 
      question: "Que se passe-t-il une fois que je me suis inscrit ?", 
      answer: "Une fois votre compte créé, vous accédez directement à votre tableau de bord. Un guide de démarrage simple vous aide à configurer les 3 étapes clés : infos de votre boutique, vos disponibilités et vos premiers services. C'est tout ce qu'il faut pour commencer à accepter des réservations en ligne." 
    },
  ],
  es: [
    { 
      question: '¿Cómo podrán reservar mis clientes?', 
      answer: '¡Es muy fácil! Una vez que configuras tu página, obtienes un enlace único (ej: resaone.com/tu-nombre). Comparte este enlace en tus redes sociales, sitio web o directamente con tus clientes. Solo tienen que hacer clic, elegir un servicio y un horario disponible, y confirmar. ¡Eso es todo! Pueden reservar 24/7, incluso cuando estás ocupado.'
    },
    { 
      question: '¿Mis clientes podrán reservar todo mi catálogo en cualquier momento?', 
      answer: '¡Absolutamente no! Mantienes el control total. En tu configuración, defines tus horarios de trabajo, días libres e incluso el aviso mínimo para una reserva. Tus clientes solo verán y podrán reservar los horarios en los que realmente estás disponible.' 
    },
    { 
      question: '¿Cuánto tiempo se tarda en configurarlo?', 
      answer: '¡Es muy rápido! En menos de 15 minutos, puedes configurar tu información básica, añadir tus primeros servicios y definir tu disponibilidad. Tu página de reservas estará lista para ser compartida y recibir tus primeras reservas.' 
    },
    { 
      question: '¿Qué sucede después de registrarme?', 
      answer: 'Una vez creada tu cuenta, accedes directamente a tu panel de control. Una sencilla guía de inicio te ayuda a configurar los 3 pasos clave: la información de tu tienda, tu disponibilidad y tus primeros servicios. Eso es todo lo que necesitas para empezar a aceptar reservas online.' 
    },
  ]
};

export const ASSET_URLS = {
  vehicle: {
    S: 'https://jtusofarsnwcfxnrvgus.supabase.co/storage/v1/object/public/public-assets/auto%20(1).png',
    M: 'https://jtusofarsnwcfxnrvgus.supabase.co/storage/v1/object/public/public-assets/wagon.png',
    L: 'https://jtusofarsnwcfxnrvgus.supabase.co/storage/v1/object/public/public-assets/minivan.png',
    XL: 'https://jtusofarsnwcfxnrvgus.supabase.co/storage/v1/object/public/public-assets/monovolumen.png',
  },
  category: {
    interior: 'https://jtusofarsnwcfxnrvgus.supabase.co/storage/v1/object/public/public-assets/asiento-de-coche.png',
    exterior: 'https://jtusofarsnwcfxnrvgus.supabase.co/storage/v1/object/public/public-assets/lavado-de-autos%20(1).png',
  }
};
