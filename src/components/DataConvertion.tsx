// src/utils/dataConversion.ts

// This file contains the logic to convert the client-side rental draft
// data into the format required by the Supabase database schema.

import { Property } from "./DbCrud"; // Import shared types

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
 * Prepares the Property object for insertion into the Supabase 'properties' table.
 * This function handles renaming, data type conversion, and setting default values.
 *
 * @param draft The Property object from localStorage.
 * @returns An object formatted for direct insertion into Supabase.
 */
export const prepareDraftForDB = (draft: Property) => {
  const converted: any = { ...draft };

  // --- Map client-side specific fields to database schema fields ---

  // Property Type
  if (draft.propertyTypeCategory) {
    converted.property_type = convertPropertyTypeForDB(draft.propertyTypeCategory);
  } else {
    converted.property_type = null;
  }
  delete converted.propertyTypeCategory;

  // Home Type
  if (draft.HomeTypesCategory) {
    converted.HomeType = convertHomeTypeForDB(draft.HomeTypesCategory);
  } else {
    converted.HomeType = null;
  }
  delete converted.HomeTypesCategory;

  // Location (LatLng object to separate latitude and longitude columns)
  delete converted.location;

  // Building Name
  if (draft.propertyName !== undefined) {
    converted.building_name = draft.propertyName;
  } else if (converted.building_name === undefined) {
      converted.building_name = null;
  }
  delete converted.propertyName;

  // House Rules
  if (draft.houseRules !== undefined) {
    converted.house_rules = draft.houseRules;
  } else if (converted.house_rules === undefined) {
    converted.house_rules = null;
  }
  delete converted.houseRules;

  // Max Guests
  if (typeof draft.maxGuests === 'string') {
    converted.max_guests = parseInt(draft.maxGuests, 10);
    if (isNaN(converted.max_guests)) converted.max_guests = null;
  } else if (draft.maxGuests !== undefined) {
    converted.max_guests = draft.maxGuests;
  } else if (converted.max_guests === undefined) {
    converted.max_guests = null;
  }
  if (converted.max_guests === 0) converted.max_guests = null;
  delete converted.maxGuests;

  // Instant Booking
  if (draft.instantBooking !== undefined) {
    converted.instant_booking = draft.instantBooking;
  } else if (converted.instant_booking === undefined) {
    converted.instant_booking = false;
  }
  delete converted.instantBooking;

  // Ensure check_in_time and check_out_time are null if not provided in draft
  delete converted.check_in_time;
  delete converted.check_out_time;

  // Amenities (ensure it's an object or null, not undefined)
  if (converted.amenities === undefined) {
      converted.amenities = null;
  }

  // --- Handle fields directly from Property if they match Property (DB) schema ---
  // Ensure 'id' is not sent for new inserts
  if (converted.id === '' || converted.id === undefined) {
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
