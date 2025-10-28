export interface Booking {
  id: number;
  property_id: string;
  owner_id: string;
  visitor_id: string;
  booking_status: {
    current_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    payment_status: 'unpaid' | 'paid' | 'refunded' | 'overdue';
    special_requests?: string;
    additional_guests?: number;
    cancellation_reason?: string;
    confirmation_status: 'awaiting_confirmation' | 'confirmed' | 'rejected';
  };
  check_in_date: string; // Assuming date strings for simplicity, can be Date objects if needed
  check_out_date: string; // Assuming date strings for simplicity, can be Date objects if needed
  total_guests: number;
  total_price: number;
  created_at: string; // Assuming date strings for simplicity
  updated_at: string; // Assuming date strings for simplicity
  Icon_Url?: {
    property_icon?: string;
    amenity_icons?: string[];
  };
}

export interface Package {
  id: number;
  numberOfTenant: number | null;
  location: string | null;
  Contact: string | null; // Assuming contact information is a string or null
  ammenities: object | null; // Assuming amenities is an object or null
  price: number | null;
  description: string | null; // This will hold the rich text content
  created_at: string;
  icon_url: string | null;
  Title: string | null; // Added Title propertye
  image_urls: string[]; // Added for multiple image URLs
  icon_style?: { // Added to store icon position and zIndex
    position: { x: number; y: number };
    zIndex: number;
  } | null;
}

// Window management interfaces (as provided in the prompt)
export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: number; // Added id to WindowState to match iconStates usage
  position: WindowPosition;
  size: WindowSize;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export interface OpenWindowState extends WindowState {
  pkg: Package;
}
