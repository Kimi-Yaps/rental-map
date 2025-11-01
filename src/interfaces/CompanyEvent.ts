export interface CompanyEvent {
  id: number;
  title: string;
  description: string | null;
  start_date: string; // Representing date as string
  end_date: string | null; // Representing date as string
  is_published: boolean;
  image_urls: string[];
  user_type: string;
  updated_by: string | null; // UUID represented as string
  created_at: string; // Representing timestamp as string
  updated_at: string; // Representing timestamp as string
}
