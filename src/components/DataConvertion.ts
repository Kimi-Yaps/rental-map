// src/utils/dataConversion.ts

// This file contains the logic to convert the client-side rental draft
// data into the format required by the Supabase database schema.

import { Property } from "../supabaseClient"; // Import shared types

// Define the structure of the Supabase 'properties' table
interface SupabaseProperty {
  id?: string;
  property_type: string;
  HomeType: string;
  building_name: string | null;
  house_rules: string | null;
  max_guests: number | null;
  instant_booking: boolean;
  is_active: boolean;
  // Add other fields that exist in your Supabase table
}

/**
 * Prepares the RentalDraft object for insertion into the Supabase 'properties' table.
 * This function handles renaming, data type conversion, and setting default values.
 *
 * @param draft The RentalDraft object from localStorage.
 * @returns An object formatted for direct insertion into Supabase.
 */
export const prepareDraftForDB = (draft: Property): Partial<SupabaseProperty> => {
  const converted: Partial<SupabaseProperty> = {};

  // --- Map client-side specific fields to database schema fields ---

  // Property Type
  converted.property_type = draft.property_type;

  // Home Type
  converted.HomeType = draft.HomeType;

  // Building Name
  converted.building_name = draft.property_name || null;

  // House Rules
  converted.house_rules = draft.house_rules || null;

  // Max Guests
  if (typeof draft.max_guests === 'string') {
    converted.max_guests = parseInt(draft.max_guests, 10) || null;
  } else {
    converted.max_guests = draft.max_guests || null;
  }

  // Instant Booking
  converted.instant_booking = draft.instant_booking || false;

  // Set is_active to true by default for new properties
  converted.is_active = true;

  // If the ID is a client-generated draft ID, remove it so Supabase can generate a proper UUID
  if (draft.id && typeof draft.id === 'string' && draft.id.startsWith('draft_')) {
    delete converted.id;
  }

  return converted;
};
