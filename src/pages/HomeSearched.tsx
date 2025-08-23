// Import necessary Ionic React UI components
import { 
  IonPage, 
  IonContent, 
  IonGrid, 
  IonRow, 
  IonButton, 
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSpinner,
  IonAlert,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonChip,
  IonToolbar,
  IonTitle
} from '@ionic/react';
import { useState, useEffect, useCallback } from 'react';
import { locationOutline, checkmarkCircle, warningOutline } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import ConditionalHeader from '../components/ConditionalHeader';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anonymous key are required.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Interface for Rental Amenities
export interface RentalAmenities {
  wifi_included?: boolean;
  air_conditioning?: boolean;
  in_unit_laundry?: boolean;
  dishwasher?: boolean;
  balcony_patio?: boolean;
  pet_friendly?: {
    dogs_allowed?: boolean;
    cats_allowed?: boolean;
  };
  parking?: {
    type?: 'garage' | 'carport' | 'off_street' | 'street';
    spots?: number;
  };
  community_pool?: boolean;
  fitness_center?: boolean;
  [key: string]: any;
}

export interface Pricing {
  id: string;
  property_id: string;
  price_type: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string | null;
}

export interface RoomDetails {
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'other';
  bed_types?: string[];
  number_of_beds?: number;
  number_of_bathrooms?: number;
  has_ensuite?: boolean;
  description?: string;
  [key: string]: any;
}

// Interface for Property
export interface Property {
  id: string;
  building_name: string | null;
  address: string;
  property_type: string | null;
  house_rules: string | null;
  max_guests: number | null;
  instant_booking: boolean | null;
  is_active: boolean | null;
  amenities: RentalAmenities | null;
  rooms: RoomDetails[];
  created_at: string;
  updated_at: string | null;
  HomeType: string | null;
  photos?: string[];
  pricing?: Pricing[];
}

// Enhanced suggestion interface
interface EnhancedSuggestion {
  text: string;
  type: 'database' | 'recent';
  source?: string;
  property_type?: string | null;
  HomeType?: string | null;
}

// Main component
const HomeSearched: React.FC = () => {
  const location = useLocation<{ searchText?: string }>();
  
  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchText || '');

  // Build display address string from property data
  const buildAddressString = (property: Property): string => {
    const parts = [
      property.building_name,
      property.address,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Fetch properties from Supabase
  const fetchProperties = async (term?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('properties')
        .select(`
          *,
          pricing (*)
        `)
        .eq('is_active', true);

      // Add search filter if term provided
      if (term && term.trim()) {
        const safeTerm = term.replace(/"/g, '""'); // Escape double quotes for PostgREST
        query = query.or(`address.ilike."%${safeTerm}%",building_name.ilike."%${safeTerm}%",property_type.ilike."%${safeTerm}%",HomeType.ilike."%${safeTerm}%"`);
      }

      const { data: propertiesData, error } = await query;

      if (error) {
        throw error;
      }

      setProperties(propertiesData || []);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'An error occurred while fetching data');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggestions for searchbar
  const fetchSuggestions = useCallback(async (term: string): Promise<EnhancedSuggestion[]> => {
    if (!term || term.length < 2) {
      return [];
    }
    
    try {
      const safeTerm = term.replace(/"/g, '""'); // Escape double quotes for PostgREST
      const { data, error } = await supabase
        .from('properties')
        .select('address, building_name, property_type, HomeType')
        .or(`address.ilike."%${safeTerm}%",building_name.ilike."%${safeTerm}%",property_type.ilike."%${safeTerm}%",HomeType.ilike."%${safeTerm}%"`)
        .eq('is_active', true)
        .limit(10);
        
      if (error) {
        console.error('Supabase error:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }
      
      const suggestions: EnhancedSuggestion[] = [];
      
      data.forEach(item => {
        const termLower = term.toLowerCase();
        
        // Check address matches
        if (item.address && item.address.toLowerCase().includes(termLower)) {
          suggestions.push({
            text: item.address,
            type: 'database',
            source: 'Address',
            property_type: item.property_type,
            HomeType: item.HomeType
          });
        }
        
        // Check building name matches (avoid duplicates)
        if (item.building_name && 
            item.building_name.toLowerCase().includes(termLower) && 
            item.building_name !== item.address) {
          suggestions.push({
            text: item.building_name,
            type: 'database',
            source: 'Building',
            property_type: item.property_type,
            HomeType: item.HomeType
          });
        }
        
        // Check property type matches
        if (item.property_type && 
            item.property_type.toLowerCase().includes(termLower) &&
            !suggestions.find(s => s.text === item.property_type)) {
          suggestions.push({
            text: item.property_type,
            type: 'database',
            source: 'Property Type',
            property_type: item.property_type,
            HomeType: item.HomeType
          });
        }
        
        // Check home type matches
        if (item.HomeType && 
            item.HomeType.toLowerCase().includes(termLower) &&
            !suggestions.find(s => s.text === item.HomeType)) {
          suggestions.push({
            text: item.HomeType,
            type: 'database',
            source: 'Home Type',
            property_type: item.property_type,
            HomeType: item.HomeType
          });
        }
      });

      // Remove duplicates and sort
      const seen = new Set<string>();
      const uniqueSuggestions = suggestions.filter(suggestion => {
        const normalizedText = suggestion.text.toLowerCase().trim();
        if (seen.has(normalizedText)) {
          return false;
        }
        seen.add(normalizedText);
        return true;
      });

      return uniqueSuggestions
        .sort((a, b) => {
          const termLower = term.toLowerCase();
          const aStarts = a.text.toLowerCase().startsWith(termLower);
          const bStarts = b.text.toLowerCase().startsWith(termLower);
          
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          return a.text.length - b.text.length;
        })
        .slice(0, 8);
      
    } catch (error) {
      console.error('Error in fetchSuggestions:', error);
      return [];
    }
  }, []);

  const handleRefresh = () => {
    fetchProperties(searchTerm);
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Format price display
  const formatPrice = (pricing?: Pricing[]) => {
    if (!pricing || pricing.length === 0) return null;
    
    const dailyPrice = pricing.find(p => p.price_type === 'daily');
    const monthlyPrice = pricing.find(p => p.price_type === 'monthly');
    
    if (dailyPrice) {
      return `${dailyPrice.currency} ${dailyPrice.amount}/day`;
    } else if (monthlyPrice) {
      return `${monthlyPrice.currency} ${monthlyPrice.amount}/month`;
    }
    
    return `${pricing[0].currency} ${pricing[0].amount}`;
  };

  useEffect(() => {
    fetchProperties(searchTerm);
  }, [searchTerm]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Search Results</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding" onIonRefresh={handleRefresh}>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <SearchbarWithSuggestions
                value={searchTerm}
                setValue={setSearchTerm}
                fetchSuggestions={fetchSuggestions}
                onSearch={handleSearch}
                placeholder="Search by address, building name, property type, or home type"
              />
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    Properties
                    <IonChip color="primary" style={{ marginLeft: '8px' }}>
                      <IonLabel>{properties.length} found</IonLabel>
                    </IonChip>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton 
                    fill="outline" 
                    onClick={handleRefresh}
                    disabled={loading}
                    style={{ marginBottom: '16px' }}
                  >
                    {loading ? <IonSpinner name="crescent" /> : 'Refresh Data'}
                  </IonButton>

                  {loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <IonSpinner name="crescent" />
                      <p>Loading properties...</p>
                    </div>
                  )}

                  {!loading && properties.length > 0 && (
                    <IonList>
                      {properties.map((property) => (
                        <IonItem key={property.id}>
                          <IonLabel>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                              <h2 style={{ margin: 0, marginRight: '8px' }}>
                                {buildAddressString(property) || `Property ${property.id}`}
                              </h2>
                              {property.is_active && (
                                <IonChip color="success">
                                  <IonIcon icon={checkmarkCircle} />
                                  <IonLabel>Active</IonLabel>
                                </IonChip>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              {property.property_type && (
                                <IonChip color="medium">
                                  <IonLabel>{property.property_type}</IonLabel>
                                </IonChip>
                              )}
                              {property.HomeType && (
                                <IonChip color="tertiary">
                                  <IonLabel>{property.HomeType}</IonLabel>
                                </IonChip>
                              )}
                            </div>

                            {formatPrice(property.pricing) && (
                              <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: 'bold', color: 'var(--ion-color-success)' }}>
                                {formatPrice(property.pricing)}
                              </p>
                            )}
                            
                            {property.max_guests && (
                              <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--ion-color-medium)' }}>
                                <IonIcon icon={locationOutline} style={{ marginRight: '4px' }} />
                                Max {property.max_guests} guests
                              </p>
                            )}

                            {property.instant_booking && (
                              <p style={{ margin: '4px 0', fontSize: '14px', color: 'var(--ion-color-primary)' }}>
                                ⚡ Instant Booking Available
                              </p>
                            )}
                            
                            {property.amenities && (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--ion-color-text)' }}>
                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Amenities:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {property.amenities.wifi_included && <IonChip size="small" color="light">Wi-Fi</IonChip>}
                                  {property.amenities.air_conditioning && <IonChip size="small" color="light">A/C</IonChip>}
                                  {property.amenities.in_unit_laundry && <IonChip size="small" color="light">Laundry</IonChip>}
                                  {property.amenities.dishwasher && <IonChip size="small" color="light">Dishwasher</IonChip>}
                                  {property.amenities.balcony_patio && <IonChip size="small" color="light">Balcony</IonChip>}
                                  {property.amenities.community_pool && <IonChip size="small" color="light">Pool</IonChip>}
                                  {property.amenities.fitness_center && <IonChip size="small" color="light">Gym</IonChip>}
                                  {property.amenities.pet_friendly?.dogs_allowed && <IonChip size="small" color="light">Dog Friendly</IonChip>}
                                  {property.amenities.pet_friendly?.cats_allowed && <IonChip size="small" color="light">Cat Friendly</IonChip>}
                                  {property.amenities.parking && <IonChip size="small" color="light">Parking</IonChip>}
                                </div>
                              </div>
                            )}

                            {property.rooms && property.rooms.length > 0 && (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--ion-color-text)' }}>
                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Rooms:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {property.rooms.map((room, index) => (
                                    <IonChip key={index} size="small" color="secondary">
                                      {room.room_type.replace('_', ' ')}
                                      {room.number_of_beds && ` (${room.number_of_beds} beds)`}
                                    </IonChip>
                                  ))}
                                </div>
                              </div>
                            )}

                            {property.house_rules && (
                              <details style={{ marginTop: '8px' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--ion-color-medium)' }}>
                                  House Rules
                                </summary>
                                <p style={{ fontSize: '12px', marginTop: '4px', padding: '8px', background: 'var(--ion-color-light-shade)', borderRadius: '4px' }}>
                                  {property.house_rules}
                                </p>
                              </details>
                            )}
                          </IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                  )}

                  {!loading && properties.length === 0 && !error && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <IonIcon icon={warningOutline} style={{ fontSize: '48px', color: 'var(--ion-color-medium)' }} />
                      <p>No properties found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Error"
          message={error || 'An unknown error occurred'}
          buttons={[
            {
              text: 'OK',
              handler: () => setShowAlert(false)
            },
            {
              text: 'Retry',
              handler: () => {
                setShowAlert(false);
                fetchProperties(searchTerm);
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default HomeSearched;
