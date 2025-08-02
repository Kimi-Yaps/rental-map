import supabase from '../supabaseConfig';

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

export interface Property {
  id?: string;
  address_id: string;
  landlord_id: string;
  title: string;
  property_name?: string;
  description?: string;
  property_type: string;
  home_type?: string;
  home_best_fit?: string;
  total_floors?: number;
  max_guests: number;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  price_per_night: number;
  cleaning_fee?: number;
  security_deposit?: number;
  currency?: string;
  house_rules?: string;
  check_in_time?: string;
  check_out_time?: string;
  minimum_stay?: number;
  maximum_stay?: number;
  instant_booking?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface PropertyImage {
  id?: string;
  address_id: string;
  image_path: string; // Your schema uses image_path instead of url
  image_blurhash?: string;
  image_size_bytes?: number;
  image_type?: string;
  is_primary?: boolean;
  uploaded_by?: string;
  created_at?: string;
  video_path?: string; // For videos
  [key: string]: any;
}

export interface PropertyAddressMetadata {
  address_id: string;
  total_floors?: number;
  construction_type?: string;
  accessibility_features?: string;
  PropertyType: string; // Note: Capital P in your schema
}

export interface PropertyAvailability {
  id?: string;
  property_id: string;
  date: string;
  is_available?: boolean;
  price_override?: number;
  minimum_stay_override?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
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

  // Property Addresses CRUD
  async createPropertyAddress(addressData: PropertyAddress) {
    const { data, error } = await supabase
      .from('property_addresses')
      .insert([addressData])
      .select();
    return { data, error };
  },

  async getPropertyAddresses() {
    const { data, error } = await supabase
      .from('property_addresses')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async updatePropertyAddress(addressId: string, updates: Partial<PropertyAddress>) {
    const { data, error } = await supabase
      .from('property_addresses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .select();
    return { data, error };
  },

  async deletePropertyAddress(addressId: string) {
    const { data, error } = await supabase
      .from('property_addresses')
      .delete()
      .eq('id', addressId);
    return { data, error };
  },

  // Property Address Metadata CRUD
  async createPropertyAddressMetadata(metadataData: PropertyAddressMetadata) {
    const { data, error } = await supabase
      .from('property_address_metadata')
      .insert([metadataData])
      .select();
    return { data, error };
  },

  async getPropertyAddressMetadata(addressId: string) {
    const { data, error } = await supabase
      .from('property_address_metadata')
      .select('*')
      .eq('address_id', addressId)
      .single();
    return { data, error };
  },

  // Properties CRUD - Enhanced with proper error handling
  async createProperty(propertyData: Property) {
    try {
      // Ensure amenities is properly formatted as array
      const formattedData = {
        ...propertyData,
        amenities: Array.isArray(propertyData.amenities) 
          ? propertyData.amenities 
          : (propertyData.amenities ? [propertyData.amenities] : []),
        currency: propertyData.currency || 'MYR',
        is_active: propertyData.is_active !== undefined ? propertyData.is_active : true,
        instant_booking: propertyData.instant_booking !== undefined ? propertyData.instant_booking : false,
        max_guests: propertyData.max_guests || 1, // Default required by schema
        bedrooms: propertyData.bedrooms || 0, // Default from schema
        bathrooms: propertyData.bathrooms || 0, // Default from schema
      };

      const { data, error } = await supabase
        .from('properties_status')
        .insert([formattedData])
        .select();
      
      return { data, error };
    } catch (err) {
      console.error('Error in createProperty:', err);
      return { data: null, error: err };
    }
  },

  async getProperties(landlordId: string | null = null) {
    let query = supabase
      .from('properties_status')
      .select(`
        *,
        property_addresses(*),
        landlords(
          *,
          users(*)
        )
      `);
    
    if (landlordId) {
      query = query.eq('landlord_id', landlordId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    return { data, error };
  },

  async getProperty(propertyId: string) {
    const { data, error } = await supabase
      .from('properties_status')
      .select(`
        *,
        property_addresses(*),
        landlords(
          *,
          users(*)
        )
      `)
      .eq('id', propertyId)
      .single();
    return { data, error };
  },

  async updateProperty(propertyId: string, updates: Partial<Property>) {
    const { data, error } = await supabase
      .from('properties_status')
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
      .from('properties_status')
      .delete()
      .eq('id', propertyId);
    return { data, error };
  },

  // Property Images/Videos CRUD - Using your actual schema
  async createPropertyImage(imageData: PropertyImage) {
    const { data, error } = await supabase
      .from('property_image_Video')
      .insert([imageData])
      .select();
    return { data, error };
  },

  async getPropertyImages(addressId: string) {
    const { data, error } = await supabase
      .from('property_image_Video')
      .select('*')
      .eq('address_id', addressId)
      .order('is_primary', { ascending: false });
    return { data, error };
  },

  async updatePropertyImage(imageId: string, updates: Partial<PropertyImage>) {
    const { data, error } = await supabase
      .from('property_image_Video')
      .update(updates)
      .eq('id', imageId)
      .select();
    return { data, error };
  },

  async deletePropertyImage(imageId: string) {
    const { data, error } = await supabase
      .from('property_image_Video')
      .delete()
      .eq('id', imageId);
    return { data, error };
  },

  // Property Availability CRUD
  async createAvailability(availabilityData: PropertyAvailability) {
    const { data, error } = await supabase
      .from('property_availability')
      .insert([availabilityData])
      .select();
    return { data, error };
  },

  async getAvailability(propertyId: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('property_availability')
      .select('*')
      .eq('property_id', propertyId);
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data, error } = await query.order('date');
    return { data, error };
  },

  // Enhanced property insertion with validation and transaction-like behavior
  async insertCompleteProperty(propertyData: any, currentUserId: string) {
    try {
      console.log('Starting property insertion process...');
      
      // Step 1: Validate required fields
      const requiredFields = [
        'location', 'address', 'bedrooms', 'bathrooms', 'rentPrice', 
        'propertyType', 'landlordName', 'landlordPhone', 'preferredContact'
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

      // Step 2: Get or create landlord
      let landlordId: string;
      const { data: existingLandlord, error: fetchError } = await this.getLandlordByUserId(currentUserId);
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking landlord:', fetchError);
        throw new Error(`Error checking landlord: ${fetchError.message}`);
      }

      if (existingLandlord) {
        landlordId = existingLandlord.id;
        console.log('Using existing landlord:', landlordId);
        
        // Update landlord info if provided
        if (propertyData.landlordName) {
          await this.updateLandlord(landlordId, {
            business_name: propertyData.landlordName,
          });
        }
      } else {
        console.log('Creating new landlord...');
        // Create new landlord with required stripe_account_id
        const { data: newLandlord, error: createError } = await this.createLandlord({
          user_id: currentUserId,
          stripe_account_id: `acct_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          business_name: propertyData.landlordName || 'Property Owner',
          verification_status: 'pending',
          onboarding_completed: false,
        });

        if (createError || !newLandlord?.[0]) {
          console.error('Error creating landlord:', createError);
          throw new Error(`Failed to create landlord: ${createError?.message || 'No data returned'}`);
        }
        landlordId = newLandlord[0].id;
        console.log('Created new landlord:', landlordId);
      }

      // Step 3: Create property address
      console.log('Creating property address...');
      const addressData: PropertyAddress = {
        street_address: propertyData.address,
        building_name: propertyData.propertyName || null,
        postal_code: null, // You might want to extract this from address
        additional_details: propertyData.location 
          ? `Coordinates: ${propertyData.location.lat}, ${propertyData.location.lng}`
          : null,
        is_verified: false,
      };

      const { data: addressResult, error: addressError } = await this.createPropertyAddress(addressData);
      
      if (addressError || !addressResult?.[0]) {
        console.error('Error creating address:', addressError);
        throw new Error(`Failed to create address: ${addressError?.message || 'No data returned'}`);
      }
      
      const addressId = addressResult[0].id;
      console.log('Created address:', addressId);

      // Step 4: Create property address metadata
      console.log('Creating property address metadata...');
      const metadataData: PropertyAddressMetadata = {
        address_id: addressId,
        PropertyType: propertyData.propertyType, // Note: Capital P as per your schema
        total_floors: propertyData.totalFloors || null,
        construction_type: propertyData.constructionType || null,
        accessibility_features: propertyData.accessibilityFeatures || null,
      };

      const { error: metadataError } = await this.createPropertyAddressMetadata(metadataData);
      if (metadataError) {
        console.warn('Warning: Failed to create address metadata:', metadataError.message);
        // Don't fail the entire process for metadata
      }

      // Step 5: Create property
      console.log('Creating property...');
      const propertyInsertData: Property = {
        address_id: addressId,
        landlord_id: landlordId,
        title: propertyData.propertyName || `${propertyData.propertyType} at ${propertyData.address}`,
        property_name: propertyData.propertyName,
        description: propertyData.description,
        property_type: propertyData.propertyType,
        home_type: propertyData.propertyType,
        home_best_fit: propertyData.furnishing,
        total_floors: propertyData.totalFloors || null,
        max_guests: Math.max((propertyData.bedrooms || 1) * 2, 1), // Ensure at least 1
        bedrooms: propertyData.bedrooms || 0,
        bathrooms: propertyData.bathrooms || 0,
        amenities: propertyData.amenities || [],
        price_per_night: propertyData.rentPrice,
        cleaning_fee: 0,
        security_deposit: propertyData.securityDeposit || 0,
        currency: 'MYR',
        house_rules: Array.isArray(propertyData.rules) 
          ? propertyData.rules.join('; ') 
          : propertyData.rules || null,
        check_in_time: '15:00:00',
        check_out_time: '11:00:00',
        minimum_stay: 1,
        maximum_stay: null,
        instant_booking: false,
        is_active: true,
      };

      const { data: propertyResult, error: propertyError } = await this.createProperty(propertyInsertData);
      
      if (propertyError || !propertyResult?.[0]) {
        console.error('Error creating property:', propertyError);
        throw new Error(`Failed to create property: ${propertyError?.message || 'No data returned'}`);
      }

      const propertyId = propertyResult[0].id;
      console.log('Created property:', propertyId);

      // Step 6: Insert photos (using image_path instead of url)
      if (propertyData.photos && propertyData.photos.length > 0) {
        console.log('Inserting photos...');
        for (let i = 0; i < propertyData.photos.length; i++) {
          const imageData: PropertyImage = {
            address_id: addressId,
            image_path: propertyData.photos[i], // Using image_path as per your schema
            is_primary: i === 0, // First photo is primary
            uploaded_by: currentUserId,
            image_type: 'photo',
          };

          const { error: imageError } = await this.createPropertyImage(imageData);
          if (imageError) {
            console.warn(`Failed to insert photo ${i + 1}:`, imageError.message);
          }
        }
      }

      // Step 7: Insert videos (using video_path field)
      if (propertyData.videos && propertyData.videos.length > 0) {
        console.log('Inserting videos...');
        for (let i = 0; i < propertyData.videos.length; i++) {
          const videoData: PropertyImage = {
            address_id: addressId,
            image_path: '', // Empty for videos
            video_path: propertyData.videos[i], // Using video_path field
            is_primary: false,
            uploaded_by: currentUserId,
            image_type: 'video',
          };

          const { error: videoError } = await this.createPropertyImage(videoData);
          if (videoError) {
            console.warn(`Failed to insert video ${i + 1}:`, videoError.message);
          }
        }
      }

      console.log('Property insertion completed successfully!');
      return {
        success: true,
        propertyId,
        addressId,
        landlordId,
        message: 'Property successfully created'
      };

    } catch (error) {
      console.error('Error in insertCompleteProperty:', error);
      throw error;
    }
  }
};