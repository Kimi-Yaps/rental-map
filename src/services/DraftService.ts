import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export interface RentalDraft {
  id: string;
  owner_id: string;
  property_type?: string | null;
  title?: string | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  bathrooms?: number | null;
  size_sqft?: number | null;
  bedrooms?: Record<string, any> | null;
  amenities?: Record<string, any> | null;
  pricetype?: Record<string, any> | null;
  photos?: string[] | null;
  videos?: string[] | null;
  created_at?: string;
  updated_at?: string | null;
  HomeType?: string | null; // Added for consistency
}

export const savePropertyDraft = async (draft: Partial<RentalDraft>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If no ID exists, create one
    if (!draft.id) {
      draft.id = uuidv4();
    }

    const { error } = await supabase
      .from('rental_drafts')
      .upsert({
        ...draft,
        owner_id: user.id,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Save to localStorage as well
    localStorage.setItem('Property', JSON.stringify({
      ...draft,
      owner_id: user.id,
      updated_at: new Date().toISOString()
    }));

    return draft.id;
  } catch (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

export const getPropertyDraft = async (draftId?: string) => {
  try {
    // First try localStorage
    const savedDraft = localStorage.getItem('Property');
    if (savedDraft) {
      return JSON.parse(savedDraft);
    }

    // If not in localStorage and we have a draftId, try Supabase
    if (draftId) {
      const { data, error } = await supabase
        .from('rental_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (error) throw error;
      if (data) {
        localStorage.setItem('Property', JSON.stringify(data));
        return data;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting draft:', error);
    throw error;
  }
};

export const updatePropertyDraft = async (draftId: string, updates: Partial<RentalDraft>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('rental_drafts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', draftId)
      .eq('owner_id', user.id);

    if (error) throw error;

    // Update localStorage as well
    const currentDraft = localStorage.getItem('Property');
    if (currentDraft) {
      const updatedDraft = {
        ...JSON.parse(currentDraft),
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('Property', JSON.stringify(updatedDraft));
    }
  } catch (error) {
    console.error('Error updating draft:', error);
    throw error;
  }
};
