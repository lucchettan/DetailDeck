// Updated TypeScript interfaces for the new flexible architecture

export interface ShopVehicleSize {
  id: string;
  shopId: string;
  name: string; // "Small", "Medium", "Large", "X-Large", "Motorcycle", etc.
  subtitle?: string; // "Coupe, Sedan", "Small SUV, Crossover", etc.
  iconUrl?: string; // Optional custom icon
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ShopServiceCategory {
  id: string;
  shopId: string;
  name: string; // "Interior Services", "Exterior Services", "Engine Bay", etc.
  iconName?: string; // Icon identifier for UI (e.g., 'interior', 'exterior')
  iconUrl?: string; // Optional custom icon URL
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

// Updated existing interfaces
export interface Service {
  id: string;
  shopId: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  categoryId: string; // Now references ShopServiceCategory
  basePrice: number;
  baseDuration: number; // in minutes
  imageUrl?: string;
  createdAt: string;

  // Populated from joins
  category?: ShopServiceCategory;
}

export interface VehicleSizeSupplement {
  id: string;
  serviceId: string;
  vehicleSizeId: string; // Now references ShopVehicleSize
  additionalPrice: number;
  additionalDuration: number;
  createdAt: string;

  // Populated from joins
  vehicleSize?: ShopVehicleSize;

  // Backward compatibility - deprecated
  size?: string;
}

// Enhanced shop interface
export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  phone?: string;
  email?: string;
  shopImageUrl?: string;
  businessType: 'local' | 'mobile';
  addressLine1?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  serviceAreas?: any[];
  schedule: any;
  minBookingNotice: string;
  maxBookingHorizon?: string;
  supportedVehicleSizes: string[]; // Deprecated - will be removed
  createdAt: string;

  // New relationships
  vehicleSizes?: ShopVehicleSize[];
  serviceCategories?: ShopServiceCategory[];
}

// Full shop data for complex operations
export type FullShopData = Shop & {
  services: (Service & {
    formulas: Formula[],
    supplements: VehicleSizeSupplement[],
    specificAddOns: AddOn[]
  })[],
  addOns: AddOn[],
  formulas: Formula[],
  supplements: VehicleSizeSupplement[],
  vehicleSizes: ShopVehicleSize[],
  serviceCategories: ShopServiceCategory[],
};

// Keep existing interfaces unchanged for now
export interface Formula {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  additionalPrice: number;
  additionalDuration: number;
  createdAt?: string;
}

export interface AddOn {
  id: string;
  shopId: string;
  serviceId?: string; // Can be null for global add-ons
  name: string;
  price: number;
  duration: number;
  createdAt?: string;
}

export interface Reservation {
  id: string;
  shopId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // minutes
  price: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pending_deposit' | 'on_site';
  serviceDetails: {
    vehicleSize?: string;
    clientVehicle?: string;
    specialInstructions?: string;
    services: {
      serviceId: string;
      serviceName: string;
      formulaId: string;
      formulaName: string;
      addOns: { id: string; name: string; }[];
    }[];
  };
  createdAt?: string;
}

export interface Lead {
  id: string;
  shopId: string;
  createdAt: string;
  clientPhone: string;
  selectedServices: {
    vehicleSize: string;
    services: {
      serviceName: string;
      formulaName: string;
    }[];
  };
  status: 'to_call' | 'contacted' | 'converted' | 'lost';
  notes?: string;
}

// Utility types for forms and UI
export interface VehicleSizeFormData {
  name: string;
  subtitle?: string;
  iconUrl?: string;
  isActive: boolean;
  displayOrder?: number;
}

export interface ServiceCategoryFormData {
  name: string;
  iconName?: string;
  iconUrl?: string;
  isActive: boolean;
  displayOrder?: number;
}

// Default data for seeding
export const DEFAULT_VEHICLE_SIZES: Omit<ShopVehicleSize, 'id' | 'shopId' | 'createdAt'>[] = [
  { name: 'Small', subtitle: 'Coupe, Sedan', isActive: true, displayOrder: 1 },
  { name: 'Medium', subtitle: 'Small SUV, Crossover', isActive: true, displayOrder: 2 },
  { name: 'Large', subtitle: 'Large SUV, Minivan', isActive: true, displayOrder: 3 },
  { name: 'X-Large', subtitle: 'Truck, Van', isActive: true, displayOrder: 4 },
];

export const DEFAULT_SERVICE_CATEGORIES: Omit<ShopServiceCategory, 'id' | 'shopId' | 'createdAt'>[] = [
  { name: 'Interior Services', iconName: 'interior', isActive: true, displayOrder: 1 },
  { name: 'Exterior Services', iconName: 'exterior', isActive: true, displayOrder: 2 },
];

export const AVAILABLE_CATEGORY_ICONS = [
  'interior', 'exterior', 'engine', 'wheels', 'detailing', 'protection', 'maintenance'
] as const;

export type CategoryIconName = typeof AVAILABLE_CATEGORY_ICONS[number];
