// Defines the structure for amenities that will be stored in the database.
export interface RentalAmenities {
  wifi_included?: boolean;
  air_conditioning?: boolean;
  in_unit_laundry?: boolean;
  dishwasher?: boolean;
  balcony_patio?: boolean;
  pet_friendly?: {
    pets_allowed?: boolean;
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

export interface pricing {
  id: string; // uuid in SQL, represented as string in TypeScript
  property_id: string; // uuid in SQL, foreign key to properties (id)
  price_type: string; // text in SQL (e.g., 'daily', 'monthly')
  amount: number; // real in SQL
  currency: string; // text in SQL, default 'MYR'
  created_at: string; // timestamp with time zone, represented as ISO string
  updated_at: string | null; // timestamp with time zone, represented as ISO string or null
}

export interface RoomDetails {
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'other';
  bed_types?: string[]; // e.g., ['King', 'Queen', 'Twin']
  number_of_beds?: number;
  number_of_bathrooms?: number; // For bathroom type rooms
  has_ensuite?: boolean; // For bedrooms with attached bathrooms
  description?: string;
  // Allows for additional, less structured properties per room
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
  rooms: RoomDetails[]; // Represents the 'jsonb' column for flexible room data
  created_at: string; // Stored as an ISO string in the database
  updated_at: string | null; // Stored as an ISO string or null
  HomeType: string | null;
  photos?: string[]; // Add photos field
  // Optional: If you intend to fetch pricing details along with the property,
  // you can include an array of Pricing objects.
  pricing?: pricing[];
}