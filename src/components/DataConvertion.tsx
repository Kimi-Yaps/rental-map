// src/utils/dataConversion.ts

// This file contains the logic to convert the client-side rental draft
// data into the format required by the Supabase database schema.

import { Property } from "../supabaseClient"; // Import shared types

// Property type conversion mappings
const PROPERTY_TYPE_MAPPING = {
  'Home': 'home',
  'Hotel': 'hotel',
  'Unique': 'unique'
} as const;

const HOME_TYPE_MAPPING = {
  'Homestay': 'homestay',
  'Entire House': 'entire_house',
  'Bungalow': 'bungalow'
} as const;

// Helper function to convert a display string to a database-friendly key
const convertPropertyTypeForDB = (displayType: string): string => {
  return PROPERTY_TYPE_MAPPING[displayType as keyof typeof PROPERTY_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};

// Helper function to convert a display string to a database-friendly key
const convertHomeTypeForDB = (displayType: string): string => {
  return HOME_TYPE_MAPPING[displayType as keyof typeof HOME_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};

/**
 * Prepares the RentalDraft object for insertion into the Supabase 'properties' table.
 * This function handles renaming, data type conversion, and setting default values.
 *
 * @param draft The RentalDraft object from localStorage.
 * @returns An object formatted for direct insertion into Supabase.
 */
export const prepareDraftForDB = (draft: Property) => {
  const converted: any = { ...draft };

  // --- Map client-side specific fields to database schema fields ---

  // Property Type
  converted.property_type = draft.property_type;

  // Home Type
  converted.HomeType = draft.HomeType;

  // Location (LatLng object to separate latitude and longitude columns)
  delete converted.location;

  // Building Name
  if (draft.property_name !== undefined) {
    converted.building_name = draft.property_name;
  } else if (converted.building_name === undefined) {
      converted.building_name = null;
  }
  delete converted.propertyName;

  // House Rules
  if (draft.house_rules !== undefined) {
    converted.house_rules = draft.house_rules;
  } else if (converted.house_rules === undefined) {
    converted.house_rules = null;
  }
  delete converted.houseRules;

  // Max Guests
  if (typeof draft.max_guests === 'string') {
    converted.max_guests = parseInt(draft.max_guests, 10);
    if (isNaN(converted.max_guests)) converted.max_guests = null;
  } else if (draft.max_guests !== undefined) {
    converted.max_guests = draft.max_guests;
  } else if (converted.max_guests === undefined) {
    converted.max_guests = null;
  }
  if (converted.max_guests === 0) converted.max_guests = null;
  delete converted.maxGuests;

  // Instant Booking
  if (draft.instant_booking !== undefined) {
    converted.instant_booking = draft.instant_booking;
  } else if (converted.instant_booking === undefined) {
    converted.instant_booking = false;
  }
  delete converted.instantBooking;

  // Set is_active to true by default for new properties
  converted.is_active = true;

  // If the ID is a client-generated draft ID, remove it so Supabase can generate a proper UUID
  if (converted.id && typeof converted.id === 'string' && converted.id.startsWith('draft_')) {
    delete converted.id;
  }

  // Remove other client-side only fields that don't map to DB columns
  delete converted.searchQuery;
  delete converted.lastUpdated;
  delete converted.homeTypeDB;
  delete converted.latitude;
  delete converted.longitude;
  delete converted.propertyTypeDB;

  // Final check for any remaining undefined values and set them to null
  for (const key in converted) {
    if (converted.hasOwnProperty(key) && converted[key] === undefined) {
      converted[key] = null;
    }
  }

  return converted;
};