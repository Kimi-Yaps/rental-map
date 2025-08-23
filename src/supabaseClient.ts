import supabase from './supabaseConfig';

// --- Types matching your actual database schema ---
export interface User {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  [key: string]: any;
}

export interface Landlord {
  id?: string;
  user_id: string;
  stripe_account_id: string; // Required in your schema
  business_name?: string;
  bank_name?: string;
  bank_account_number?: string;
  verification_status?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PropertyAddress {
  id?: string;
  street_address: string;
  building_name?: string;
  postal_code?: string;
  additional_details?: string;
  is_verified?: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface RentalAmenities extends Record<string, any> {}

export interface Property {
  id?: string;
  owner_id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  property_type: string;
  bathrooms: number;
  size_sqft: number;
  monthly_rent: number;
  deposit_amount: number;
  is_available?: boolean;
  images?: any; // jsonb
  amenities?: Record<string, any>; // jsonb
  created_at?: string;
  updated_at?: string;
  bedrooms?: Record<string, any>; // jsonb
  [key: string]: any;
}


// --- Enhanced Database Service matching your schema ---
export const dbService = {
  // Users CRUD
  async createUser(userData: User) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select();
    return { data, error };
  },

  async getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();
    return { data, error };
  },

  // Landlords CRUD
  async createLandlord(landlordData: Landlord) {
    // Ensure stripe_account_id is provided (required in your schema)
    const dataWithDefaults = {
      ...landlordData,
      stripe_account_id: landlordData.stripe_account_id || `acct_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    };

    const { data, error } = await supabase
      .from('landlords')
      .insert([dataWithDefaults])
      .select();
    return { data, error };
  },

  async getLandlord(landlordId: string) {
    const { data, error } = await supabase
      .from('landlords')
      .select(`*, users(*)`)
      .eq('id', landlordId)
      .single();
    return { data, error };
  },

  async getLandlordByUserId(userId: string) {
    const { data, error } = await supabase
      .from('landlords')
      .select(`*, users(*)`)
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  async updateLandlord(landlordId: string, updates: Partial<Landlord>) {
    const { data, error } = await supabase
      .from('landlords')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', landlordId)
      .select();
    return { data, error };
  },

  // Properties CRUD - Enhanced with proper error handling
  async createProperty(propertyData: Property) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select();
      
      return { data, error };
    } catch (err) {
      console.error('Error in createProperty:', err);
      return { data: null, error: err };
    }
  },

  async getProperties(ownerId: string | null = null) {
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_owners(*)
      `);
    
    if (ownerId) {
      query = query.eq('owner_id', ownerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async getProperty(propertyId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_owners(*)
      `)
      .eq('id', propertyId)
      .single();
    return { data, error };
  },

  async updateProperty(propertyId: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', propertyId)
      .select();
    return { data, error };
  },

  async deleteProperty(propertyId: string) {
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);
    return { data, error };
  },

  // Enhanced property insertion with validation and transaction-like behavior
  async insertCompleteProperty(propertyData: any, currentUserId: string) {
    try {
      console.log('Starting property insertion process...');
      
      // Step 1: Validate required fields
      const requiredFields = [
        'title', 'description', 'address', 'city', 'state', 'postal_code',
        'property_type', 'bathrooms', 'size_sqft', 'monthly_rent', 'deposit_amount'
      ];
      
      const missingFields = requiredFields.filter(field => {
        const value = propertyData[field];
        return value === undefined || value === null || 
               (typeof value === 'number' && isNaN(value)) ||
               (typeof value === 'string' && value.trim() === '');
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Step 2: Get or create property owner (landlord)
      let ownerId: string;
      const { data: existingOwner, error: fetchError } = await this.getLandlordByUserId(currentUserId);
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking property owner:', fetchError);
        throw new Error(`Error checking property owner: ${fetchError.message}`);
      }

      if (existingOwner) {
        ownerId = existingOwner.id;
        console.log('Using existing property owner:', ownerId);
        
        // Update owner info if provided
        if (propertyData.ownerName) { // Assuming ownerName is passed in propertyData
          await this.updateLandlord(ownerId, {
            business_name: propertyData.ownerName,
          });
        }
      } else {
        console.log('Creating new property owner...');
        // Create new landlord with required stripe_account_id
        const { data: newOwner, error: createError } = await this.createLandlord({
          user_id: currentUserId,
          stripe_account_id: `acct_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          business_name: propertyData.ownerName || 'Property Owner',
          verification_status: 'pending',
          onboarding_completed: false,
        });

        if (createError || !newOwner?.[0]) {
          console.error('Error creating property owner:', createError);
          throw new Error(`Failed to create property owner: ${createError?.message || 'No data returned'}`);
        }
        ownerId = newOwner[0].id;
        console.log('Created new property owner:', ownerId);
      }

      // Step 3: Create property
      console.log('Creating property...');
      const propertyInsertData: Property = {
        owner_id: ownerId,
        title: propertyData.title,
        description: propertyData.description,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        postal_code: propertyData.postal_code,
        property_type: propertyData.property_type,
        bathrooms: propertyData.bathrooms,
        size_sqft: propertyData.size_sqft,
        monthly_rent: propertyData.monthly_rent,
        deposit_amount: propertyData.deposit_amount,
        is_available: propertyData.is_available !== undefined ? propertyData.is_available : true,
        images: propertyData.images || null,
        amenities: propertyData.amenities || null,
        bedrooms: propertyData.bedrooms || null,
      };

      const { data: propertyResult, error: propertyError } = await this.createProperty(propertyInsertData);
      
      if (propertyError || !propertyResult?.[0]) {
        console.error('Error creating property:', propertyError);
        throw new Error(`Failed to create property: ${propertyError?.message || 'No data returned'}`);
      }

      const propertyId = propertyResult[0].id;
      console.log('Created property:', propertyId);

      console.log('Property insertion completed successfully!');
      return {
        success: true,
        propertyId,
        ownerId,
        message: 'Property successfully created'
      };

    } catch (error) {
      console.error('Error in insertCompleteProperty:', error);
      throw error;
    }
  }
};
