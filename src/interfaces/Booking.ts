// Define the structure for booking status
interface BookingStatus {
  current_status: string;
  payment_status: string;
  special_requests: string | null;
  additional_guests: number | null;
  cancellation_reason: string | null;
  confirmation_status: string;
}

// Define the structure for a booking
export interface Booking {
  id: number;
  property_id: string; // UUIDs are typically represented as strings
  owner_id: string;    // UUIDs are typically represented as strings
  tenant_id: string;   // UUIDs are typically represented as strings
  booking_status: BookingStatus;
  check_in_date: string; // Dates are often represented as strings in JSON/API responses
  check_out_date: string; // Dates are often represented as strings in JSON/API responses
  total_guests: number;
  total_price: number;
  created_at?: string; // Optional, as it has a default value and might not always be present in fetched data
  updated_at?: string; // Optional, as it has a default value and might not always be present in fetched data
}

// Inferring Package interface from usage in ResizableWindow.tsx
export interface Package {
  id: number; // Assuming 'id' is a number based on common practice for primary keys
  Title: string;
  description: string | null;
  price: number | null;
  location: string | null;
  numberOfTenant: number | null;
  ammenities: Record<string, any> | null;
  image_urls: string[];
  icon_url?: string | null; // Optional based on usage
}

// Inferring OpenWindowState interface from usage in ResizableWindow.tsx
export interface OpenWindowState {
  pkg: Package | null; // pkg is used as windowState.pkg
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}
