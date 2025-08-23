// Defines the structure for amenities that will be stored in the database.
export interface RentalAmenities extends Record<string, any> {}

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
  owner_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  property_type: string;
  bathrooms: number;
  size_sqft: number;
  monthly_rent: number;
  deposit_amount: number;
  is_available?: boolean;
  images?: Record<string, any>; // jsonb
  amenities?: RentalAmenities; // Using the existing amenities interface
  created_at: string; // Stored as an ISO string in the database
  updated_at: string | null; // Stored as an ISO string or null
  bedrooms?: Record<string, any>; // jsonb
}

export interface Profile {
  id: string; // uuid in SQL, foreign key to auth.users (id)
  full_name: string | null; // text in SQL
  avatar_url: string | null; // text in SQL
  user_type: 'property_owner' | 'tenant' | 'admin' | null; // text in SQL, enum type
  created_at: string | null; // timestamp with time zone, represented as ISO string
  updated_at: string | null; // timestamp with time zone, represented as ISO string or null
}
