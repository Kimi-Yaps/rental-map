// Define specific amenity types
export interface AmenityValue {
  available: boolean;
  details?: string;
  quantity?: number;
  // Pet friendly specific fields
  pets_allowed?: boolean;
  dogs_allowed?: boolean;
  cats_allowed?: boolean;
  pet_deposit?: number;
  // Parking specific fields
  type?: 'garage' | 'carport' | 'off_street' | 'street';
  spots?: number;
  // Common fields
  description?: string;
}

// Defines the structure for amenities that will be stored in the database.
export type RentalAmenities = Record<string, AmenityValue>;

// UserType JSONB structure for profiles
export interface UserType {
  type: 'admin' | 'landlord' | 'tenant';
  permissions?: string[];
  customFields?: Record<string, string | number | boolean>;
}

export interface AdminUserType extends UserType {
  type: 'admin';
  permissions: string[];
}

export interface LandlordUserType extends UserType {
  type: 'landlord';
  business_name?: string;
}

export interface TenantUserType extends UserType {
  type: 'tenant';
  occupation?: string;
}


export interface RoomDetails {
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'other';
  bed_counts?: { [key: string]: number }; // e.g., { 'King': 1, 'Single': 2 }
  number_of_bathrooms?: number; // For bathroom type rooms
  has_ensuite?: boolean; // For bedrooms with attached bathrooms
  description?: string;
  amenities?: string[];
  size_sqft?: number;
  furniture?: string[];
  [key: string]: string[] | number | boolean | string | { [key: string]: number } | undefined;
}
// Defines the complete structure of the property draft object
// that is stored in localStorage as the user progresses through the form.
// It includes both client-side fields and the final database fields.
export type PropertyType = 'apartment' | 'house' | 'condo' | 'townhouse' | 'studio';

// Interface for price type and details
export interface PriceType {
  monthly_rent?: number;
  security_deposit?: number;
  utilities_deposit?: number;
  other_fees?: {
    name: string;
    amount: number;
  }[];
  currency: string;
  last_updated?: string;
}

export interface Property {
  id: string;
  owner_id: string;
  description?: string;
  address: string;
  property_type: PropertyType;
  bathrooms: number; // Required int4 field
  bedrooms: Record<string, RoomDetails>;
  pricetype: PriceType;
  photos?: string[];
  videos?: string[];
  created_at?: string;
  updated_at?: string;
  
  // Required fields (based on database constraints)
  city: string;
  state: string;
  postal_code: string;

  // Optional fields
  amenities?: RentalAmenities;
  size_sqft?: number;
  is_available?: boolean;
  
  // Client-side fields (not stored in database)
  location?: { lat: number; lng: number };
  searchQuery?: string;
  full_address?: string;
  formatted_address?: string;
  HomeType?: string;
}

export interface Profile {
  id: string; // uuid in SQL, foreign key to auth.users (id)
  full_name: string | null; // text in SQL
  avatar_url: string | null; // text in SQL
  nickname?: string | null;
  userType?: UserType | null; // jsonb
  created_at: string | null; // timestamp with time zone, represented as ISO string
  updated_at: string | null; // timestamp with time zone, represented as ISO string or null
}

// --- Profile update helpers ---
import { supabase } from '../supabaseClient';

// Update userType (jsonb) for a profile
export async function updateProfileUserType(userId: string, userType: UserType) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ userType, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select();
  return { data, error };
}

// Update avatar_url for a profile (upload and set URL)
export async function updateProfileAvatar(userId: string, file: File) {
  // Upload to Supabase Storage (bucket: 'avatars')
  const filePath = `${userId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });
  if (uploadError) return { data: null, error: uploadError };

  // Get public URL
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const avatar_url = urlData?.publicUrl || null;
  if (!avatar_url) return { data: null, error: { message: 'Failed to get avatar URL' } };

  // Update profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select();
  return { data, error };
}
