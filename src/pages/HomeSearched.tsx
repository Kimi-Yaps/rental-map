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
  IonBadge,
  IonToggle,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import { useState, useEffect, useCallback } from 'react';
import { locationOutline, checkmarkCircle, warningOutline, mapOutline } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import { useLocation } from 'react-router-dom';
import supabase from '../supabaseConfig'; // Adjust the path if needed

// OpenStreetMap Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GEOCODING_DELAY = 1000; // 1 second delay between requests (rate limiting)

// Types
interface PropertyAddress {
  id: number;
  building_name?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  osm_place_id?: string;
  address_verified?: boolean;
  formatted_address?: string;
  [key: string]: any;
}

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

interface AddressMatchResult extends PropertyAddress {
  osmResults?: NominatimResult[];
  matchScore?: number;
  isVerified?: boolean;
  coordinates?: { lat: number; lon: number };
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
  static calculateAddressMatch(property: PropertyAddress, osmResult: NominatimResult): number {
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
    if (property.street_address && osmResult.address?.road) {
      factors++;
      const streetSimilarity = this.stringSimilarity(
        property.street_address.toLowerCase(),
        osmResult.address.road.toLowerCase()
      );
      score += streetSimilarity * 0.4;
    }

    // Compare city
    if (property.city && osmResult.address?.city) {
      factors++;
      const citySimilarity = this.stringSimilarity(
        property.city.toLowerCase(),
        osmResult.address.city.toLowerCase()
      );
      score += citySimilarity * 0.2;
    }

    // Compare postal code
    if (property.postal_code && osmResult.address?.postcode) {
      factors++;
      if (property.postal_code === osmResult.address.postcode) {
        score += 0.1;
      }
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
  const [propertyAddresses, setPropertyAddresses] = useState<AddressMatchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [geocodingProgress, setGeocodingProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState(location.state?.searchText || '');
  const [enableGeocoding, setEnableGeocoding] = useState<boolean>(true);
  const [searchMode, setSearchMode] = useState<'database' | 'geocoded'>('database');

  // Build full address string from property data
  const buildAddressString = (property: PropertyAddress): string => {
    const parts = [
      property.building_name,
      property.street_address,
      property.city,
      property.state,
      property.postal_code
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // Enhanced address geocoding and matching
  const geocodeAndMatchAddresses = useCallback(async (addresses: PropertyAddress[]) => {
    if (!enableGeocoding || addresses.length === 0) return addresses;
    
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
            } : undefined
          };
          
          // Update formatted address if we have a good match
          if (bestMatch && bestScore > 0.5) {
            matchedProperty.formatted_address = bestMatch.display_name;
            matchedProperty.osm_place_id = bestMatch.place_id;
          }
          
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
  }, [enableGeocoding]);

  // Fetch property addresses with optional geocoding
  const fetchPropertyAddresses = async (term?: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: property_addresses, error } = await supabase
        .from('property_addresses')
        .select('*'); // Select all fields now

      if (error) {
        throw error;
      }

      let filtered = property_addresses || [];
      
      // Apply search filter
      if (term) {
        filtered = filtered.filter(property => {
          const fieldsToSearch = Object.keys(property).filter(key => 
            typeof property[key] === 'string'
          );
          return fieldsToSearch.some(field => 
            property[field]?.toLowerCase().includes(term.toLowerCase())
          );
        });
      }

      // Geocode and match addresses if enabled
      const matchedAddresses = await geocodeAndMatchAddresses(filtered);
      
      // Sort by match score if geocoding is enabled
      if (enableGeocoding) {
        matchedAddresses.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
      
      setPropertyAddresses(matchedAddresses);
    } catch (err: any) {
      console.error('Error fetching property addresses:', err);
      setError(err.message || 'An error occurred while fetching data');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced suggestions with geocoding
  const fetchSuggestions = async (term: string): Promise<string[]> => {
    if (!term || term.length < 2) return [];
    
    try {
      // First get database suggestions
      const { data: allData, error } = await supabase
        .from('property_addresses')
        .select('*')
        .limit(50);
        
      if (error || !allData) return [];
      
      const dbSuggestions = new Set<string>();
      allData.forEach(item => {
        const possibleFields = [
          'street_address', 'building_name', 'city', 'state'
        ];
        
        possibleFields.forEach(field => {
          if (item[field] && typeof item[field] === 'string') {
            const value = item[field].toString().toLowerCase();
            if (value.includes(term.toLowerCase())) {
              dbSuggestions.add(item[field]);
            }
          }
        });
      });

      // Get geocoding suggestions if enabled
      let geoSuggestions: string[] = [];
      if (enableGeocoding && term.length > 3) {
        try {
          const osmResults = await GeoCodingService.geocodeAddress(term);
          geoSuggestions = osmResults
            .slice(0, 3)
            .map(result => result.display_name);
        } catch (error) {
          console.error('Error fetching geo suggestions:', error);
        }
      }
      
      // Combine and deduplicate suggestions
      const allSuggestions = [...Array.from(dbSuggestions), ...geoSuggestions];
      return [...new Set(allSuggestions)].slice(0, 8);
      
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  };

  const handleRefresh = () => {
    fetchPropertyAddresses(searchTerm);
  };

  // Get verification status icon and color
  const getVerificationStatus = (property: AddressMatchResult) => {
    if (!property.matchScore) return { icon: warningOutline, color: 'medium', text: 'Not verified' };
    if (property.matchScore > 0.8) return { icon: checkmarkCircle, color: 'success', text: 'Verified' };
    if (property.matchScore > 0.5) return { icon: warningOutline, color: 'warning', text: 'Partial match' };
    return { icon: warningOutline, color: 'danger', text: 'Poor match' };
  };

  useEffect(() => {
    fetchPropertyAddresses(searchTerm);
  }, [searchTerm]);

  return (
    <IonPage>
      <IonHeader>
        {/* Optional: Add header content here */}
      </IonHeader>
      
      <IonContent className="ion-padding">
        <SearchbarWithSuggestions
          value={searchTerm}
          setValue={setSearchTerm}
          fetchSuggestions={fetchSuggestions}
        />

        {/* Controls */}
        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel>Enable OpenStreetMap Geocoding</IonLabel>
              <IonToggle 
                checked={enableGeocoding} 
                onIonToggle={(e) => setEnableGeocoding(e.detail.checked)}
              />
            </IonItem>
            
            <IonSegment 
              value={searchMode} 
              onIonChange={(e) => setSearchMode(e.detail.value as 'database' | 'geocoded')}
            >
              <IonSegmentButton value="database">
                <IonLabel>Database Search</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="geocoded">
                <IonLabel>Geographic Search</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonCardContent>
        </IonCard>

        <IonGrid>
          <IonRow>
            <IonCol>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>
                    Property Addresses
                    {enableGeocoding && (
                      <IonBadge color="primary" style={{ marginLeft: '8px' }}>
                        OSM Enhanced
                      </IonBadge>
                    )}
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
                      <p>Loading property addresses...</p>
                    </div>
                  )}

                  {!loading && propertyAddresses.length > 0 && (
                    <IonList>
                      {propertyAddresses.map((property, idx) => {
                        const status = getVerificationStatus(property);
                        return (
                          <IonItem key={property.id ?? idx}>
                            <IonLabel>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <h2 style={{ margin: 0, marginRight: '8px' }}>
                                  {buildAddressString(property) || `Property ${property.id ?? idx}`}
                                </h2>
                                {enableGeocoding && (
                                  <IonChip color={status.color}>
                                    <IonIcon icon={status.icon} />
                                    <IonLabel>{status.text}</IonLabel>
                                  </IonChip>
                                )}
                              </div>
                              
                              {enableGeocoding && property.matchScore !== undefined && (
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

                  {!loading && propertyAddresses.length === 0 && !error && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <IonIcon icon={warningOutline} style={{ fontSize: '48px', color: '#ccc' }} />
                      <p>No property addresses found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
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
                fetchPropertyAddresses(searchTerm);
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default HomeSearched;