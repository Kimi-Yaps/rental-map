import {
  IonContent,
  IonGrid,
  IonHeader,
  IonPage,
  IonRow,
  IonTitle,
  IonToolbar,
  IonCol,
  IonInput,
  IonButton,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonSpinner,
  IonAlert,
  IonToggle,
  IonIcon,
  IonBadge
} from '@ionic/react';
import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import supabase from '../../supabaseConfig';
import { mapOutline, settingsOutline } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import './Main.css';
import { RentalAmenities, Property } from '../components/DbCrud';

// OpenStreetMap Nominatim API configuration
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const GEOCODING_DELAY = 1000;

// Enhanced Nominatim result interface
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

// Enhanced suggestion interface - MUST match SearchbarWithSuggestions component
interface EnhancedSuggestion {
  text: string;
  type: 'database' | 'geocoded' | 'recent';
  source?: string;
  property_type?: string | null;
  HomeType?: string | null;
}

// OpenStreetMap Geocoding Service (same as HomeSearched)
class GeoCodingService {
  private static lastRequestTime = 0;

  private static async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < GEOCODING_DELAY) {
      await new Promise(resolve => setTimeout(resolve, GEOCODING_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  static async geocodeAddress(address: string): Promise<NominatimResult[]> {
    try {
      await this.rateLimitDelay();
      
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`,
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
      console.error('Geocoding error:', error);
      return [];
    }
  }
}

const Home: React.FC = () => {
  // Form state
  const [searchText, setSearchText] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [selectedTab, setSelectedTab] = useState('home-apts');
  
  // Enhanced search state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [enableGeocoding, setEnableGeocoding] = useState<boolean>(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const history = useHistory();

  // Get table structure to know available columns
  const getTableStructure = async () => {
    try {
      // Updated to use the correct table name
      const { data, error } = await supabase
        .from('properties') // Changed from 'Property' to 'properties'
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setTableColumns(columns);
        console.log('Available columns:', columns);
      }
    } catch (err: any) {
      console.error('Error getting table structure:', err);
    }
  };

  // FIXED: Enhanced suggestion fetching with proper return type
  const fetchEnhancedSuggestions = useCallback(async (term: string): Promise<EnhancedSuggestion[]> => {
    console.log('fetchEnhancedSuggestions called with term:', term);
    
    if (!term || term.length < 2) {
      console.log('Term too short, returning empty array');
      return [];
    }

    try {
      const enrichedSuggestions: EnhancedSuggestion[] = [];

      // First, try to get recent searches
      const matchingRecent = recentSearches
        .filter(search => search.toLowerCase().includes(term.toLowerCase()))
        .slice(0, 2)
        .map(search => ({
          text: search,
          type: 'recent' as const,
          source: 'Recent Search'
        }));
      
      enrichedSuggestions.push(...matchingRecent);

      // Fetch database suggestions from multiple possible tables
      try {
        console.log('Fetching database suggestions...');
        
        // Try properties table first
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('address, building_name, property_type, HomeType')
          .limit(50);

        if (!propertiesError && propertiesData && propertiesData.length > 0) {
          console.log('Properties data found:', propertiesData.length, 'items');
          
          propertiesData.forEach(item => {
            // Check address field
            if (item.address && typeof item.address === 'string') {
              const value = item.address.toLowerCase();
              if (value.includes(term.toLowerCase())) {
                enrichedSuggestions.push({
                  text: item.address,
                  type: 'database',
                  source: 'Properties Database',
                  property_type: item.property_type,
                  HomeType: item.HomeType
                });
              }
            }
            
            // Check building_name field
            if (item.building_name && typeof item.building_name === 'string') {
              const value = item.building_name.toLowerCase();
              if (value.includes(term.toLowerCase()) && item.building_name !== item.address) {
                enrichedSuggestions.push({
                  text: item.building_name,
                  type: 'database',
                  source: 'Properties Database',
                  property_type: item.property_type,
                  HomeType: item.HomeType
                });
              }
            }
          });
        }

        // Try address table as fallback
        if (enrichedSuggestions.filter(s => s.type === 'database').length === 0) {
          console.log('Trying address table...');
          const { data: addressData, error: addressError } = await supabase
            .from('address')
            .select('*')
            .limit(50);

          if (!addressError && addressData && addressData.length > 0) {
            console.log('Address data found:', addressData.length, 'items');
            
            addressData.forEach(item => {
              const possibleFields = [
                'street_address', 'address', 'full_address',
                'unit_number', 'unit',
                'building_name', 'building', 'property_name',
                'city', 'town', 'area',
                'state', 'province'
              ];
              
              possibleFields.forEach(field => {
                if (item[field] && typeof item[field] === 'string') {
                  const value = item[field].toString().toLowerCase();
                  const searchTerm = term.toLowerCase();
                  if (value.includes(searchTerm)) {
                    enrichedSuggestions.push({
                      text: item[field],
                      type: 'database',
                      source: 'Address Database'
                    });
                  }
                }
              });
            });
          }
        }

        console.log('Database suggestions found:', enrichedSuggestions.filter(s => s.type === 'database').length);
      } catch (dbError) {
        console.error('Database suggestions error:', dbError);
      }

      // Get OpenStreetMap suggestions if enabled
      if (enableGeocoding && term.length >= 3) {
        try {
          console.log('Fetching geocoding suggestions...');
          const osmResults = await GeoCodingService.geocodeAddress(term);
          console.log('OSM results:', osmResults.length);
          
          const geoSuggestions: EnhancedSuggestion[] = osmResults
            .slice(0, 4)
            .map(result => ({
              text: result.display_name,
              type: 'geocoded' as const,
              source: 'OpenStreetMap',
            }));
          
          enrichedSuggestions.push(...geoSuggestions);
          console.log('Geocoding suggestions found:', geoSuggestions.length);
        } catch (error) {
          console.error('Error fetching OSM suggestions:', error);
        }
      }

      // Remove duplicates and sort
      const seen = new Set<string>();
      const uniqueSuggestions = enrichedSuggestions.filter(suggestion => {
        const normalizedText = suggestion.text.toLowerCase().trim();
        if (seen.has(normalizedText)) {
          return false;
        }
        seen.add(normalizedText);
        return true;
      });

      // Sort suggestions with better logic
      const sortedSuggestions = uniqueSuggestions
        .sort((a, b) => {
          const termLower = term.toLowerCase();
          const aTextLower = a.text.toLowerCase();
          const bTextLower = b.text.toLowerCase();
          
          // Recent searches first
          if (a.type === 'recent' && b.type !== 'recent') return -1;
          if (a.type !== 'recent' && b.type === 'recent') return 1;
          
          // Exact matches next
          const aExact = aTextLower === termLower;
          const bExact = bTextLower === termLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Starts with matches
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

    } catch (err: any) {
      console.error('Error in fetchEnhancedSuggestions:', err);
      return [];
    }
  }, [enableGeocoding, recentSearches]);

  // Enhanced search handler with validation
  const handleSearch = async (term?: string, suggestion?: EnhancedSuggestion) => {
    const searchTerm = term || searchText;
    
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      setShowAlert(true);
      return;
    }

    // Validate dates if provided
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        setError('Check-in date cannot be in the past');
        setShowAlert(true);
        return;
      }

      if (checkOutDate <= checkInDate) {
        setError('Check-out date must be after check-in date');
        setShowAlert(true);
        return;
      }
    }

    // Validate guests
    if (guests && (parseInt(guests) < 1 || parseInt(guests) > 20)) {
      setError('Number of guests must be between 1 and 20');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      // Add to recent searches
      const updatedRecent = [
        searchTerm,
        ...recentSearches.filter(s => s !== searchTerm)
      ].slice(0, 5);
      setRecentSearches(updatedRecent);

      console.log('Navigating to search results with:', {
        searchText: searchTerm,
        checkIn,
        checkOut,
        guests,
        selectedTab,
        enableGeocoding,
        suggestion
      });

      // Navigate to search results with all parameters
      history.push({
        pathname: '/homeSearched',
        state: { 
          searchText: searchTerm,
          checkIn,
          checkOut,
          guests,
          selectedTab,
          enableGeocoding,
          suggestion
        }
      });
    } catch (err: any) {
      setError('Failed to perform search. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Initialize component
  useEffect(() => {
    getTableStructure();
  }, []);

  return (
    <IonPage>
      <IonHeader></IonHeader>
      
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Property Search</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Navigation Bar */}
        <IonGrid className="ion-padding-horizontal ion-padding-vertical">
          <IonRow className="ion-align-items-center">
            <IonCol size-xs="12" size-sm="auto" className="navBar">
              Logo
            </IonCol>
            <IonCol size-xs="12" size-sm="auto" className="navBar">
              Hotel & Homes
            </IonCol>
            <IonCol size-xs="12" size-sm="auto" className="navBar">
              <IonButton onClick={() => history.push('/landlord')} fill="clear">
                list your Place
              </IonButton>
            </IonCol>
            <IonCol size-xs="12" size-sm="auto" className="navBar">
              <img id="profile" src="" alt="Profile" />
            </IonCol>
            <IonCol size-xs="12" size-sm="auto" className="navBar">
              <span className="currency">RM</span>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Search Section */}
        <IonGrid className="ion-padding">
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonCard>
                <IonCardContent>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2>Home & Apts</h2>
                  </div>

                  {/* Tab Segment */}
                  <IonSegment 
                    value={selectedTab} 
                    onIonChange={e => setSelectedTab(e.detail.value as string)}
                    style={{ marginBottom: '20px' }}
                  >
                    <IonSegmentButton value="home-apts">
                      <IonLabel>Home & Apts</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="day-use">
                      <IonLabel>Day Use Stay</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>

                  {/* Enhanced Search Input */}
                  <SearchbarWithSuggestions
                    value={searchText}
                    setValue={setSearchText}
                    fetchSuggestions={fetchEnhancedSuggestions}
                    placeholder="Search your destination or property"
                    enableGeocoding={enableGeocoding}
                    maxSuggestions={8}
                    onSearch={handleSearch}
                  />

                  {/* Date and Guest Inputs */}
                  <IonGrid>
                    <IonRow>
                      <IonCol size-xs="12" size-sm="4">
                        <IonItem>
                          <IonLabel position="stacked">Check-in Date</IonLabel>
                          <IonInput
                            type="date"
                            value={checkIn}
                            onIonInput={e => setCheckIn(e.detail.value!)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size-xs="12" size-sm="4">
                        <IonItem>
                          <IonLabel position="stacked">Check-out Date</IonLabel>
                          <IonInput
                            type="date"
                            value={checkOut}
                            onIonInput={e => setCheckOut(e.detail.value!)}
                            min={checkIn || new Date().toISOString().split('T')[0]}
                          />
                        </IonItem>
                      </IonCol>
                      <IonCol size-xs="12" size-sm="4">
                        <IonItem>
                          <IonLabel position="stacked">Guests</IonLabel>
                          <IonInput
                            type="number"
                            value={guests}
                            placeholder="Adults"
                            onIonInput={e => setGuests(e.detail.value!)}
                            min="1"
                            max="20"
                          />
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>

                  {/* Advanced Settings Toggle */}
                  <IonItem 
                    button 
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    style={{ marginTop: '10px' }}
                  >
                    <IonIcon icon={settingsOutline} slot="start" />
                    <IonLabel>Advanced Search Settings</IonLabel>
                  </IonItem>

                  {/* Advanced Settings Panel */}
                  {showAdvancedSettings && (
                    <IonCard style={{ margin: '10px 0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                      <IonCardContent>
                        <IonItem>
                          <IonIcon icon={mapOutline} slot="start" />
                          <IonLabel>
                            <h3>Enable OpenStreetMap Geocoding</h3>
                            <p>Get enhanced location suggestions and address validation</p>
                          </IonLabel>
                          <IonToggle
                            checked={enableGeocoding}
                            onIonToggle={(e) => setEnableGeocoding(e.detail.checked)}
                          />
                        </IonItem>
                        
                        {recentSearches.length > 0 && (
                          <div style={{ marginTop: '15px' }}>
                            <IonLabel>
                              <h4>Recent Searches:</h4>
                            </IonLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                              {recentSearches.slice(0, 3).map((search, idx) => (
                                <IonBadge 
                                  key={idx}
                                  color="medium"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSearchText(search)}
                                >
                                  {search.length > 20 ? search.substring(0, 20) + '...' : search}
                                </IonBadge>
                              ))}
                            </div>
                          </div>
                        )}
                      </IonCardContent>
                    </IonCard>
                  )}

                  {/* Search Button */}
                  <IonRow className="ion-justify-content-center ion-margin-top">
                    <IonCol size-xs="12" size-sm="8" size-md="6">
                      <IonButton 
                        expand="block"
                        onClick={() => handleSearch()}
                        disabled={loading}
                        size="large"
                      >
                        {loading ? (
                          <>
                            <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                            Searching...
                          </>
                        ) : (
                          <>
                            Search Properties
                            {enableGeocoding && (
                              <IonIcon icon={mapOutline} style={{ marginLeft: '8px' }} />
                            )}
                          </>
                        )}
                      </IonButton>
                    </IonCol>
                  </IonRow>

                  {/* Search Summary */}
                  {(checkIn || checkOut || guests) && (
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '15px', 
                      padding: '10px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '666'
                    }}>
                      {checkIn && checkOut && (
                        <span>{checkIn} to {checkOut}</span>
                      )}
                      {guests && (
                        <span>{checkIn || checkOut ? ' • ' : ''}{guests} guest{parseInt(guests) > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Debug Info - Remove in production */}
        {tableColumns.length > 0 && (
          <div style={{ padding: '20px', fontSize: '12px', color: '666' }}>
            <details>
              <summary>Available table columns (for debugging)</summary>
              <p>{tableColumns.join(', ')}</p>
            </details>
          </div>
        )}

        {/* Recommended Section */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Recommended</h3>
          <p style={{ color: '666', fontSize: '14px' }}>
            {enableGeocoding ? 
              'Enhanced search with OpenStreetMap integration active' : 
              'Database-only search mode'
            }
          </p>
        </div>

        {/* Error Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Search Error"
          message={error || 'An unknown error occurred'}
          buttons={[
            {
              text: 'OK',
              handler: () => setShowAlert(false)
            }
          ]}
        />

      </IonContent>
    </IonPage>
  );
};

export default Home;