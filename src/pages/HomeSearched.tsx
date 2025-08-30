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
  IonHeader
} from '@ionic/react';
import { useState, useEffect, useCallback } from 'react';
import { checkmarkCircle, warningOutline } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Property as DbProperty } from '../components/DbCrud';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anonymous key are required.");
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Use types from DbCrud
type Property = DbProperty;

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
      property.address,
      property.city,
      property.state,
      property.postal_code
    ].filter(Boolean);
    return parts.join(', ');
  };

  // Fetch properties from Supabase (no join, just properties table)
  const fetchProperties = async (term?: string) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('properties')
        .select('*');
      // Only show available properties
      query = query.eq('is_available', true);

      // Add search filter if term provided
      if (term && term.trim()) {
          const safeTerm = term.replace(/"/g, '""'); // Escape double quotes for PostgREST
          query = query.or(`address.ilike."%${safeTerm}%",city.ilike."%${safeTerm}%",state.ilike."%${safeTerm}%",property_type.ilike."%${safeTerm}%"`);
        query = query.or(`address.ilike."%${safeTerm}%",title.ilike."%${safeTerm}%",city.ilike."%${safeTerm}%",state.ilike."%${safeTerm}%",property_type.ilike."%${safeTerm}%"`);
      }

      const { data: propertiesData, error } = await query;

      if (error) {
        throw error;
      }

      setProperties(propertiesData || []);
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      if (err instanceof Error) {
        console.error('Error fetching properties:', err.message);
        setError(err.message || 'An error occurred while fetching data');
      } else {
        console.error('An unknown error occurred:', err);
        setError('An unknown error occurred');
      }
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
      const { data, error }: { data: any[] | null; error: unknown } = await supabase
        .from('properties')
        .select('address, building_name, property_type, HomeType')
        .or(`address.ilike."%${safeTerm}%",building_name.ilike."%${safeTerm}%",property_type.ilike."%${safeTerm}%",HomeType.ilike."%${safeTerm}%"`)
        .eq('is_active', true)
        .limit(10);
        
      if (error) {
        if (error instanceof Error) {
          console.error('Error in fetchSuggestions:', error.message);
        } else {
          console.error('An unknown error occurred in fetchSuggestions:', error);
        }
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
      
    } catch (error) { // Correctly structured catch block
      console.error('An unexpected error occurred during fetchSuggestions:', error);
      return [];
    }
  }, []);

  const handleRefresh = () => {
    fetchProperties(searchTerm);
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  useEffect(() => {
    fetchProperties(searchTerm);
  }, [searchTerm]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding"> {/* Removed onIonRefresh prop */}
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
                              {property.is_available && (
                                <IonChip color="success">
                                  <IonIcon icon={checkmarkCircle} />
                                  <IonLabel>Available</IonLabel>
                                </IonChip>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                              {property.property_type && (
                                <IonChip color="medium">
                                  <IonLabel>{property.property_type}</IonLabel>
                                </IonChip>
                              )}
                              <IonChip color="tertiary">
                                <IonLabel>{property.size_sqft} sqft</IonLabel>
                              </IonChip>
                              <IonChip color="tertiary">
                                <IonLabel>{property.bathrooms} bath</IonLabel>
                              </IonChip>
                            </div>

                            {/* Removed formatPrice and monthly_rent display */}
                            
                            {/* No max_guests or instant_booking in schema */}
                            
                            {property.amenities && typeof property.amenities === 'object' && (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--ion-color-text)' }}>
                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Amenities:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {Object.entries(property.amenities).map(([key, value]) =>
                                    value ? (
                                      <IonChip color="light" key={key}>{key.replace(/_/g, ' ')}</IonChip>
                                    ) : null
                                  )}
                                </div>
                              </div>
                            )}

                            {property.bedrooms && typeof property.bedrooms === 'object' && (
                              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--ion-color-text)' }}>
                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Bedrooms:</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {Object.entries(property.bedrooms).map(([key, value], idx) => (
                                    <IonChip color="secondary" key={idx}>
                                      {key.replace(/_/g, ' ')}: {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </IonChip>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Removed house_rules display */}
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
