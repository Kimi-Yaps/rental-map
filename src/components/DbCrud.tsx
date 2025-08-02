// Defines the structure for amenities that will be stored in the database.
export interface RentalAmenities {
  wifi_included?: boolean;
  air_conditioning?: boolean;
  in_unit_laundry?: boolean;
  dishwasher?: boolean;
  balcony_patio?: boolean;
  pet_friendly?: {
    dogs_allowed?: boolean;
    cats_allowed?: boolean;
    breed_restrictions?: string[];
  };
  parking?: {
    type?: 'garage' | 'carport' | 'off_street' | 'street';
    spots?: number;
  };
  community_pool?: boolean;
  fitness_center?: boolean;
  // This allows for additional, less structured properties if needed,
  // without TypeScript throwing an error.
  [key: string]: any;
}

// Defines the complete structure of the property draft object
// that is stored in localStorage as the user progresses through the form.
// It includes both client-side fields and the final database fields.
export interface Property {
  id: string;
  building_name: string | null;
  address: string;
  property_type: string | null;
  house_rules: string | null;
  max_guests: number | null;
  instant_booking: boolean | null;
  is_active: boolean | null;
  amenities: RentalAmenities | null; // Using the existing amenities interface
  created_at: string; // Stored as an ISO string in the database
  updated_at: string | null; // Stored as an ISO string or null
  HomeType: string | null;
}
