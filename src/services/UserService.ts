import supabase from '../supabaseConfig';
import { User } from '@supabase/supabase-js';

export async function upsertUserProfile(user: User, userType: 'property_owner' | 'visitor' | 'admin' | null) {
  const { data, error } = await supabase
    .from('profiles') // Assuming your profiles table is named 'profiles'
    .upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email, // Use user_metadata or email as full_name
      avatar_url: user.user_metadata?.avatar_url,
      user_type: userType,
      // Add other fields as necessary from your Profile interface
    }, { onConflict: 'id' }); // Upsert based on the 'id' column

  if (error) {
    console.error('Error upserting user profile:', error.message);
    throw error;
  }
  return data;
}
