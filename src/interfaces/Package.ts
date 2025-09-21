export interface Package {
  id: number;
  numberOfTenant: number | null;
  location: string | null;
  Contact: Record<string, any> | null;
  ammenities: Record<string, any> | null;
  price: number | null;
  description: string;
  created_at: string;
  icon_url: string | null;
}
