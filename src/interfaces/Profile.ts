export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  nickname: string | null;
  user_id: string | null;
  user_type: { [key: string]: any } | null;
}
