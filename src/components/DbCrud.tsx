// Define specific amenity types
export interface AmenityValue {
  available: boolean;
  details?: string;
  quantity?: number;
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
  amenities?: string[];
  size_sqft?: number;
  furniture?: string[];
  [key: string]: string[] | number | boolean | string | undefined;
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
  images?: Record<string, {
    url: string;
    caption?: string;
    order?: number;
    type?: 'primary' | 'additional';
  }>; // jsonb
  amenities?: RentalAmenities; // Using the existing amenities interface
  created_at: string; // Stored as an ISO string in the database
  updated_at: string | null; // Stored as an ISO string or null
  bedrooms?: Record<string, RoomDetails>; // jsonb
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
