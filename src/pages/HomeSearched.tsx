// Import necessary Ionic React UI components
import { 
  IonPage, 
  IonContent, 
  IonHeader, 
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
} from '@ionic/react';
import { useState, useEffect, useCallback } from 'react';
import { locationOutline, checkmarkCircle, warningOutline, mapOutline } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import { useLocation } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// OpenStreetMap Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GEOCODING_DELAY = 1000; // 1 second delay between requests (rate limiting)

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
    breed_restrictions?: string[];
  };
  parking?: {
    type?: 'garage' | 'carport' | 'off_street' | 'street';
    spots?: number;
  };
  community_pool?: boolean;
  fitness_center?: boolean;
  RoomType?: string[];
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
  check_in_time: string | null;
  check_out_time: string | null;
  instant_booking: boolean | null;
  is_active: boolean | null;
  amenities: RentalAmenities | null;
  created_at: string;
  updated_at: string | null;
  HomeType: string | null;
}

// Interface for Nominatim Geocoding Result
interface NominatimResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  importance: number;
}

// Enhanced Property interface to include geocoding results
interface AddressMatchResult extends Property {
  osmResults?: NominatimResult[];
  matchScore?: number;
  isVerified?: boolean;
  coordinates?: { lat: number; lon: number };
  formatted_address?: string;
  osm_place_id?: string;
}

// Enhanced suggestion interface to be used by the SearchbarWithSuggestions component
interface EnhancedSuggestion {
  text: string;
  type: 'database' | 'geocoded' | 'recent';
  source?: string;
  coordinates?: { lat: number; lon: number };
  property_type?: string | null;
  HomeType?: string | null;
}

// OpenStreetMap Geocoding Services
class GeoCodingService {
  private static lastRequestTime = 0;

  // Rate limiting to respect Nominatim usage policy
  private static async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < GEOCODING_DELAY) {
      await new Promise(resolve => setTimeout(resolve, GEOCODING_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  // Geocode a single address using Nominatim
  static async geocodeAddress(address: string): Promise<NominatimResult[]> {
    try {
      await this.rateLimitDelay();
      
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PropertySearchApp/1.0' // Required by Nominatim
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  // Reverse geocode coordinates to get address
  static async reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
    try {
      await this.rateLimitDelay();
      
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'PropertySearchApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Calculate address similarity score (0-1)
  static calculateAddressMatch(property: Property, osmResult: NominatimResult): number {
    let score = 0;
    let factors = 0;

    // Compare building/house number
    if (property.building_name && osmResult.address?.house_number) {
      factors++;
      if (property.building_name.toLowerCase().includes(osmResult.address.house_number.toLowerCase())) {
        score += 0.3;
      }
    }

    // Compare street address
    if (property.address && osmResult.address?.road) {
      factors++;
      const streetSimilarity = this.stringSimilarity(
        property.address.toLowerCase(),
        osmResult.address.road.toLowerCase()
      );
      score += streetSimilarity * 0.4;
    }
    return factors > 0 ? score / factors : 0;
  }

  // Simple string similarity calculation
  private static stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  // Calculate edit distance between strings
  private static editDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Main component
const HomeSearched: React.FC = () => {
  const location = useLocation<{ searchText?: string }>();
  
  // State management
  const [properties, setProperties] = useState<AddressMatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [geocodingProgress, setGeocodingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchText || '');

  // Build full address string from property data
  const buildAddressString = (property: Property): string => {
    const parts = [
      property.building_name,
      property.address,
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Enhanced address geocoding and matching
  const geocodeAndMatchAddresses = useCallback(async (addresses: Property[]) => {
    setGeocodingProgress(true);
    const matchedAddresses: AddressMatchResult[] = [];
    
    try {
      for (let i = 0; i < addresses.length; i++) {
        const property = addresses[i];
        const addressString = buildAddressString(property);
        
        if (addressString.trim()) {
          console.log(`Geocoding ${i + 1}/${addresses.length}: ${addressString}`);
          
          const osmResults = await GeoCodingService.geocodeAddress(addressString);
          
          let bestMatch: NominatimResult | null = null;
          let bestScore = 0;
          
          // Find best matching result
          for (const osmResult of osmResults) {
            const matchScore = GeoCodingService.calculateAddressMatch(property, osmResult);
            if (matchScore > bestScore) {
              bestScore = matchScore;
              bestMatch = osmResult;
            }
          }
          
          const matchedProperty: AddressMatchResult = {
            ...property,
            osmResults,
            matchScore: bestScore,
            isVerified: bestScore > 0.7,
            coordinates: bestMatch ? {
              lat: parseFloat(bestMatch.lat),
              lon: parseFloat(bestMatch.lon)
            } : undefined,
            formatted_address: bestMatch?.display_name,
            osm_place_id: bestMatch?.place_id
          };
          
          matchedAddresses.push(matchedProperty);
        } else {
          matchedAddresses.push({ ...property, matchScore: 0 });
        }
      }
    } catch (error) {
      console.error('Geocoding batch error:', error);
    } finally {
      setGeocodingProgress(false);
    }
    
    return matchedAddresses;
  }, []);

  // Fetch property addresses with optional geocoding
  const fetchProperties = async (term?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: propertiesData, error } = await supabase
        .from('properties') 
        .select('*');

      if (error) {
        throw error;
      }

      let filtered = propertiesData || [];
      
      // Apply search filter (client-side for now, consider server-side for large datasets)
      if (term) {
        filtered = filtered.filter(property => {
          const fieldsToSearch = Object.keys(property).filter(key => 
            typeof (property as any)[key] === 'string'
          );
          return fieldsToSearch.some(field => 
            (property as any)[field]?.toLowerCase().includes(term.toLowerCase())
          );
        });
      }

      // Geocode and match addresses (always enabled)
      const matchedAddresses = await geocodeAndMatchAddresses(filtered);
      
      // Sort by match score (always enabled)
      matchedAddresses.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      
      setProperties(matchedAddresses);
    } catch (err: any) {
      console.error('Error fetching properties:', err);
      setError(err.message || 'An error occurred while fetching data');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced suggestions with geocoding - FIXED VERSION
  const fetchSuggestions = useCallback(async (term: string): Promise<EnhancedSuggestion[]> => {
    console.log('fetchSuggestions called with term:', term);
    
    if (!term || term.length < 2) {
      console.log('Term too short, returning empty array');
      return [];
    }
    
    try {
      const enrichedSuggestions: EnhancedSuggestion[] = [];

      // First get database suggestions with better error handling
      try {
        console.log('Fetching database suggestions...');
        const { data: allData, error } = await supabase
          .from('properties') 
          .select('address, building_name, property_type, HomeType')
          .limit(50);
          
        if (error) {
          console.error('Supabase error:', error);
        } else if (allData && allData.length > 0) {
          console.log('Database data found:', allData.length, 'items');
          
          allData.forEach(item => {
            // Check both address and building_name fields
            const addressMatch = item.address && item.address.toLowerCase().includes(term.toLowerCase());
            const buildingMatch = item.building_name && item.building_name.toLowerCase().includes(term.toLowerCase());
            
            if (addressMatch) {
              enrichedSuggestions.push({
                text: item.address,
                type: 'database',
                source: 'Property Database',
                property_type: item.property_type,
                HomeType: item.HomeType
              });
            }
            
            if (buildingMatch && item.building_name !== item.address) {
              enrichedSuggestions.push({
                text: item.building_name,
                type: 'database',
                source: 'Property Database',
                property_type: item.property_type,
                HomeType: item.HomeType
              });
            }
          });
          
          console.log('Database suggestions found:', enrichedSuggestions.length);
        } else {
          console.log('No database data found');
        }
      } catch (dbError) {
        console.error('Database suggestions error:', dbError);
      }

      // Get geocoding suggestions with better error handling
      let geoSuggestions: EnhancedSuggestion[] = [];
      if (term.length >= 3) { // Reduced from 4 to 3 for more responsive suggestions
        try {
          console.log('Fetching geocoding suggestions...');
          const osmResults = await GeoCodingService.geocodeAddress(term);
          console.log('OSM results:', osmResults.length);
          
          geoSuggestions = osmResults
            .slice(0, 4) // Increased from 3 to 4
            .map(result => ({
              text: result.display_name,
              type: 'geocoded' as const,
              source: 'OpenStreetMap',
              coordinates: { lat: parseFloat(result.lat), lon: parseFloat(result.lon) }
            }));
          
          console.log('Geocoding suggestions found:', geoSuggestions.length);
        } catch (geoError) {
          console.error('Error fetching geo suggestions:', geoError);
        }
      }
      
      // Combine and deduplicate suggestions
      const allSuggestions = [...enrichedSuggestions, ...geoSuggestions];
      console.log('Total suggestions before deduplication:', allSuggestions.length);
      
      // Better deduplication - normalize text for comparison
      const seen = new Set<string>();
      const uniqueSuggestions = allSuggestions.filter(suggestion => {
        const normalizedText = suggestion.text.toLowerCase().trim();
        if (seen.has(normalizedText)) {
          return false;
        }
        seen.add(normalizedText);
        return true;
      });

      console.log('Unique suggestions:', uniqueSuggestions.length);

      // Sort suggestions with better logic
      const sortedSuggestions = uniqueSuggestions
        .sort((a, b) => {
          const termLower = term.toLowerCase();
          const aTextLower = a.text.toLowerCase();
          const bTextLower = b.text.toLowerCase();
          
          // Exact matches first
          const aExact = aTextLower === termLower;
          const bExact = bTextLower === termLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Starts with matches next
          const aStarts = aTextLower.startsWith(termLower);
          const bStarts = bTextLower.startsWith(termLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          
          // Database results before geocoded
          const typeOrder = { database: 0, geocoded: 1, recent: 2 };
          const typeComparison = typeOrder[a.type] - typeOrder[b.type];
          if (typeComparison !== 0) return typeComparison;
          
          // Shorter text first (more specific)
          return a.text.length - b.text.length;
        })
        .slice(0, 8);

      console.log('Final sorted suggestions:', sortedSuggestions);
      return sortedSuggestions;
      
    } catch (error) {
      console.error('Error in fetchSuggestions:', error);
      return [];
    }
  }, []);

  const handleRefresh = () => {
    fetchProperties(searchTerm);
  };

  const handleSearch = useCallback((term: string, suggestion?: EnhancedSuggestion) => {
    console.log('Search triggered:', { term, suggestion });
    setSearchTerm(term);
    // The useEffect will trigger fetchProperties when searchTerm changes
  }, []);

  // Get verification status icon and color
  const getVerificationStatus = (property: AddressMatchResult) => {
    if (!property.matchScore) return { icon: warningOutline, color: 'medium', text: 'Not verified' };
    if (property.matchScore > 0.8) return { icon: checkmarkCircle, color: 'success', text: 'Verified' };
    if (property.matchScore > 0.5) return { icon: warningOutline, color: 'warning', text: 'Partial match' };
    return { icon: warningOutline, color: 'danger', text: 'Poor match' };
  };

  useEffect(() => {
    fetchProperties(searchTerm);
  }, [searchTerm]);

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <SearchbarWithSuggestions
          value={searchTerm}
          setValue={setSearchTerm}
          fetchSuggestions={fetchSuggestions}
          onSearch={handleSearch}
          placeholder="Search by address, building name, or location"
        />

        <IonGrid>
          <IonRow>
            <IonCol>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    Properties
                    <IonChip color="primary" style={{ marginLeft: '8px' }}>
                        <IonIcon icon={mapOutline} />
                        <IonLabel>OSM Enhanced</IonLabel>
                    </IonChip>
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton 
                    fill="outline" 
                    onClick={handleRefresh}
                    disabled={loading || geocodingProgress}
                    style={{ marginBottom: '16px' }}
                  >
                    {loading || geocodingProgress ? <IonSpinner name="crescent" /> : 'Refresh Data'}
                  </IonButton>

                  {geocodingProgress && (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <IonIcon icon={mapOutline} style={{ fontSize: '24px', marginRight: '8px' }} />
                      <span>Geocoding addresses with OpenStreetMap...</span>
                    </div>
                  )}

                  {loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <IonSpinner name="crescent" />
                      <p>Loading properties...</p>
                    </div>
                  )}

                  {!loading && properties.length > 0 && (
                    <IonList>
                      {properties.map((property, idx) => {
                        const status = getVerificationStatus(property);
                        return (
                          <IonItem key={property.id ?? idx}>
                            <IonLabel>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <h2 style={{ margin: 0, marginRight: '8px' }}>
                                  {buildAddressString(property) || `Property ${property.id ?? idx}`}
                                </h2>
                                <IonChip color={status.color}>
                                  <IonIcon icon={status.icon} />
                                  <IonLabel>{status.text}</IonLabel>
                                </IonChip>
                              </div>
                              
                              {property.matchScore !== undefined && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                  Match Score: {(property.matchScore * 100).toFixed(1)}%
                                </p>
                              )}
                              
                              {property.coordinates && (
                                <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}>
                                  <IonIcon icon={locationOutline} style={{ marginRight: '4px' }} />
                                  {property.coordinates.lat.toFixed(6)}, {property.coordinates.lon.toFixed(6)}
                                </p>
                              )}
                              
                              {property.formatted_address && (
                                <p style={{ margin: '4px 0', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                                  OSM: {property.formatted_address}
                                </p>
                              )}
                              
                              {property.amenities && (
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#555' }}>
                                  <p style={{ margin: '4px 0', fontWeight: 'bold' }}>Amenities:</p>
                                  <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                                    {property.amenities.wifi_included && <li>• Wi-Fi Included</li>}
                                    {property.amenities.air_conditioning && <li>• Air Conditioning</li>}
                                    {property.amenities.in_unit_laundry && <li>• In-Unit Laundry</li>}
                                    {property.amenities.dishwasher && <li>• Dishwasher</li>}
                                    {property.amenities.balcony_patio && <li>• Balcony/Patio</li>}
                                    {property.amenities.community_pool && <li>• Community Pool</li>}
                                    {property.amenities.fitness_center && <li>• Fitness Center</li>}

                                    {property.amenities.pet_friendly && (
                                      <li>
                                        • Pet Friendly:
                                        {property.amenities.pet_friendly.dogs_allowed && ' Dogs Allowed'}
                                        {property.amenities.pet_friendly.cats_allowed && ' Cats Allowed'}
                                        {property.amenities.pet_friendly.breed_restrictions && property.amenities.pet_friendly.breed_restrictions.length > 0 && (
                                          ` (Restrictions: ${property.amenities.pet_friendly.breed_restrictions.join(', ')})`
                                        )}
                                      </li>
                                    )}

                                    {property.amenities.parking && (
                                      <li>
                                        • Parking: {property.amenities.parking.type}
                                        {property.amenities.parking.spots && ` (${property.amenities.parking.spots} spots)`}
                                      </li>
                                    )}

                                    {property.amenities.RoomType && property.amenities.RoomType.length > 0 && (
                                      <li>
                                        • Room Types: {property.amenities.RoomType.join(', ')}
                                      </li>
                                    )}

                                    {Object.entries(property.amenities).map(([key, value]) => {
                                      if (['wifi_included', 'air_conditioning', 'in_unit_laundry', 'dishwasher', 
                                           'balcony_patio', 'community_pool', 'fitness_center', 
                                           'pet_friendly', 'parking', 'RoomType'].includes(key)) {
                                        return null;
                                      }
                                      if (typeof value === 'boolean' && value) {
                                        return <li key={key}>• {key.replace(/_/g, ' ')}</li>;
                                      }
                                      if (typeof value === 'string' || typeof value === 'number') {
                                        return <li key={key}>• {key.replace(/_/g, ' ')}: {String(value)}</li>;
                                      }
                                      return null;
                                    })}
                                  </ul>
                                </div>
                              )}
                              
                              <details style={{ marginTop: '8px' }}>
                                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#666' }}>
                                  Raw Data
                                </summary>
                                <pre style={{ fontSize: '10px', marginTop: '8px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                                  {JSON.stringify(property, null, 2)}
                                </pre>
                              </details>
                            </IonLabel>
                          </IonItem>
                        );
                      })}
                    </IonList>
                  )}

                  {!loading && properties.length === 0 && !error && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <IonIcon icon={warningOutline} style={{ fontSize: '48px', color: '#ccc' }} />
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