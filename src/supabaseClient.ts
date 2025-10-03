import { createClient, Session } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client for web
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database Types based on your schema
export interface Profile {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  nickname?: string | null;
  user_id?: string | null;
  user_type?: {
    type: 'admin' | 'tenant';
  } | null;
}

export interface PropertyOwner {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  ic_number?: string | null;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Package {
  id: number;
  numberOfTenant?: number | null;
  location?: string | null;
  Contact?: Record<string, unknown>; // jsonb
  ammenities?: Record<string, unknown>; // jsonb
  price?: number | null;
  description?: string | null;
  created_at: string;
  icon_url?: string | null;
  'Pulau Name'?: string | null;
}

// Enhanced database service with proper typing
export const dbService = {
  // Profiles CRUD
  async createProfile(profileData: Omit<Profile, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  async upsertProfile(profileData: Profile) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profileData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single();
    return { data, error };
  },

  // Property Owners CRUD
  async createPropertyOwner(ownerData: Omit<PropertyOwner, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('property_owners')
      .insert([{
        ...ownerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  async getPropertyOwner(ownerId: string) {
    const { data, error } = await supabase
      .from('property_owners')
      .select('*')
      .eq('id', ownerId)
      .single();
    return { data, error };
  },

  async updatePropertyOwner(ownerId: string, updates: Partial<PropertyOwner>) {
    const { data, error } = await supabase
      .from('property_owners')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ownerId)
      .select()
      .single();
    return { data, error };
  },

  // Packages CRUD
  async getPackages() {
    const { data, error } = await supabase
      .from('Packages')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getPackage(packageId: number) {
    const { data, error } = await supabase
      .from('Packages')
      .select('*')
      .eq('id', packageId)
      .single();
    return { data, error };
  },

  async createPackage(packageData: Omit<Package, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('Packages')
      .insert([{
        ...packageData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  async updatePackage(packageId: number, updates: Partial<Package>) {
    const { data, error } = await supabase
      .from('Packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single();
    return { data, error };
  },

  async deletePackage(packageId: number) {
    const { data, error } = await supabase
      .from('Packages')
      .delete()
      .eq('id', packageId);
    return { data, error };
  },

  // Utility functions
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // New function to check login status
  async isUserLoggedIn() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking session:', error);
      return false;
    }
    return session !== null;
  },

  // Function to get profile if user is logged in and profile exists
  async getProfileIfLoggedIn() {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return { profile: null, error: sessionError };
    }

    if (!session?.user) {
      return { profile: null, error: null }; // Not logged in
    }

    const { data: profile, error: profileError } = await dbService.getProfile(session.user.id);
    if (profileError) {
      console.error('Error getting profile:', profileError);
      return { profile: null, error: profileError };
    }

    return { profile, error: null };
  }
};

// Auth state change listener helper
export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
