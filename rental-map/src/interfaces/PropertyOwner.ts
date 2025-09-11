export interface PropertyOwner {
  id: string; // uuid
  full_name: string;
  email: string;
  phone_number: string;
  ic_number: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  bank_name?: string;
  bank_account_number?: string;
  profile_photo?: {
    url?: string;
    path?: string;
    filename?: string;
    uploaded_at?: string;
  };
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  nickname?: string;
}
