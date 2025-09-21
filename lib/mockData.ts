import { Shop, Service, Formula, Reservation, Lead, VehicleSizeSupplement, AddOn } from '../components/Dashboard';

export const mockShop: Shop = {
  id: 'mock-shop-id-123',
  ownerId: 'mock-user-id-123',
  name: 'Prestige Detailing (Démo)',
  phone: '01 23 45 67 89',
  email: 'demo@resaone.com',
  shopImageUrl: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?q=80&w=2070&auto=format&fit=crop',
  businessType: 'local',
  addressLine1: '15 Rue des Artisans',
  addressCity: 'Versailles',
  supportedVehicleSizes: ['S', 'M', 'L', 'XL'],
  schedule: {
      "monday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
      "tuesday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
      "wednesday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
      "thursday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
      "friday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "18:00"}]},
      "saturday": {"isOpen": true, "timeframes": [{"from": "09:00", "to": "13:00"}]},
      "sunday": {"isOpen": false, "timeframes": []}
  },
  minBookingNotice: '4h',
  maxBookingHorizon: '12w',
};

export const mockServices: (Service & { formulas: Formula[], supplements: VehicleSizeSupplement[], specificAddOns: AddOn[] })[] = [
    { 
        id: 'mock-service-1', shopId: mockShop.id, name: 'Nettoyage Intérieur Essentiel', description: 'Aspiration complète, dépoussiérage des plastiques, nettoyage des vitres. Idéal pour un entretien régulier.', category: 'interior', basePrice: 80, baseDuration: 120, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1551431804-83e78328639e?q=80&w=2070&auto=format&fit=crop',
        formulas: [
            { id: 'f1', serviceId: 'mock-service-1', name: 'Basique', description: 'Aspiration complète\nDépoussiérage', additionalPrice: 0, additionalDuration: 0 },
            { id: 'f2', serviceId: 'mock-service-1', name: 'Pressing des Sièges', description: 'Tout le Basique\nNettoyage des sièges', additionalPrice: 70, additionalDuration: 90 },
        ],
        supplements: [
            { id: 's1', serviceId: 'mock-service-1', size: 'M', additionalPrice: 15, additionalDuration: 30 },
            { id: 's2', serviceId: 'mock-service-1', size: 'L', additionalPrice: 30, additionalDuration: 45 },
        ],
        specificAddOns: [
            { id: 'a1', serviceId: 'mock-service-1', shopId: mockShop.id, name: 'Extra: Poils de chien', price: 20, duration: 30 }
        ]
    },
    { 
        id: 'mock-service-2', shopId: mockShop.id, name: 'Lavage Extérieur Premium', description: 'Prélavage, lavage manuel, cire de protection et nettoyage des jantes.', category: 'exterior', basePrice: 90, baseDuration: 150, status: 'active', imageUrl: 'https://images.unsplash.com/photo-1605152273339-a8a1c83c273a?q=80&w=1974&auto=format&fit=crop',
        formulas: [
            { id: 'f3', serviceId: 'mock-service-2', name: 'Basique', description: 'Lavage manuel\nNettoyage jantes', additionalPrice: 0, additionalDuration: 0 },
        ],
        supplements: [],
        specificAddOns: []
    },
];

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 7);
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 3);

export const mockReservations: Reservation[] = [
    {
        id: 'mock-res-1', shopId: mockShop.id, date: pastDate.toISOString().split('T')[0], startTime: '10:00', duration: 150, price: 95, clientName: 'Marie Curie', status: 'completed', paymentStatus: 'paid',
        serviceDetails: { vehicleSize: "M", services: [{ serviceId: 'mock-service-1', serviceName: "Nettoyage Intérieur Essentiel", formulaId: 'f1', formulaName: "Basique", addOns: [] }] }
    },
    {
        id: 'mock-res-2', shopId: mockShop.id, date: futureDate.toISOString().split('T')[0], startTime: '14:00', duration: 150, price: 90, clientName: 'Louis Pasteur', status: 'upcoming', paymentStatus: 'on_site',
        serviceDetails: { vehicleSize: "L", services: [{ serviceId: 'mock-service-2', serviceName: "Lavage Extérieur Premium", formulaId: 'f3', formulaName: "Basique", addOns: [] }] }
    }
];

export const mockLeads: Lead[] = [
    {
        id: 'mock-lead-1', shopId: mockShop.id, createdAt: new Date().toISOString(), clientPhone: '0612345678', status: 'to_call',
        selectedServices: { vehicleSize: 'M', services: [{ serviceName: 'Nettoyage Intérieur Essentiel', formulaName: 'Basique' }] }
    }
];
