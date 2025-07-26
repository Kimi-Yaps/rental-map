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
import { createClient } from '@supabase/supabase-js';
import { mapOutline, settingsOutline } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import './Home.css';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      const { data, error } = await supabase
        .from('property_addresses')
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

  // Enhanced suggestion fetching with OpenStreetMap integration
  const fetchEnhancedSuggestions = useCallback(async (term: string): Promise<string[]> => {
    if (!term || term.length < 2) return [];

    try {
      // Fetch database suggestions
      const { data: allData, error } = await supabase
        .from('property_addresses')
        .select('*')
        .limit(100);

      if (error) {
        console.error('Error fetching database suggestions:', error);
        return [];
      }

      const dbSuggestions = new Set<string>();
      
      if (allData) {
        allData.forEach(item => {
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
                dbSuggestions.add(item[field]);
              }
            }
          });
        });
      }

      // Get OpenStreetMap suggestions if enabled
      let osmSuggestions: string[] = [];
      if (enableGeocoding && term.length > 3) {
        try {
          const osmResults = await GeoCodingService.geocodeAddress(term);
          osmSuggestions = osmResults
            .slice(0, 4) // Limit OSM suggestions
            .map(result => result.display_name);
        } catch (error) {
          console.error('Error fetching OSM suggestions:', error);
        }
      }

      // Combine suggestions and remove duplicates
      const allSuggestions = [...Array.from(dbSuggestions), ...osmSuggestions];
      const uniqueSuggestions = [...new Set(allSuggestions)];
      
      // Sort by relevance (exact matches first, then partial matches)
      return uniqueSuggestions
        .sort((a, b) => {
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          const termLower = term.toLowerCase();
          
          // Exact matches first
          if (aLower.startsWith(termLower) && !bLower.startsWith(termLower)) return -1;
          if (!aLower.startsWith(termLower) && bLower.startsWith(termLower)) return 1;
          
          // Then by length (shorter first)
          return a.length - b.length;
        })
        .slice(0, 8);

    } catch (err: any) {
      console.error('Error in fetchEnhancedSuggestions:', err);
      return [];
    }
  }, [enableGeocoding]);

  // Enhanced search handler with validation
  const handleSearch = async () => {
    if (!searchText.trim()) {
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
        searchText,
        ...recentSearches.filter(s => s !== searchText)
      ].slice(0, 5);
      setRecentSearches(updatedRecent);

      // Navigate to search results with all parameters
      history.push({
        pathname: '/homeSearched',
        state: { 
          searchText,
          checkIn,
          checkOut,
          guests,
          selectedTab,
          enableGeocoding
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
        <IonGrid>
          <IonRow>
            <IonCol size="2" className="navBar">Logo</IonCol>
            <IonCol size="2" className="navBar">Hotel & Homes</IonCol>
            <IonCol size="2" className="navBar">
              <a href="/landlord">list your Place</a>
            </IonCol>
            <IonCol size="2" className="navBar">
              <img id="profile" src="" alt="Profile" />
            </IonCol>
            <IonCol size="2" className="navBar">
              <span className="currency">RM</span>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Search Section */}
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
          <IonCard>
            <IonCardContent>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2>Home & Apts</h2>
                {enableGeocoding}
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
                recentSearches={recentSearches}
                onRecentSearchUpdate={setRecentSearches}
                maxSuggestions={8}
              />

              {/* Date and Guest Inputs */}
              <IonGrid>
                <IonRow>
                  <IonCol size="4">
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
                  <IonCol size="4">
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
                  <IonCol size="4">
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
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <IonButton 
                  onClick={handleSearch}
                  disabled={loading}
                  style={{ maxWidth: '250px', width: '100%', maxHeight: '40px', margin: '8px', justifyContent: 'center', alignItems: 'center', display: 'flex' }}
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
              </div>

              {/* Search Summary */}
              {(checkIn || checkOut || guests) && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '15px', 
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#666'
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
        </div>

        {/* Debug Info - Remove in production */}
        {tableColumns.length > 0 && (
          <div style={{ padding: '20px', fontSize: '12px', color: '#666' }}>
            <details>
              <summary>Available table columns (for debugging)</summary>
              <p>{tableColumns.join(', ')}</p>
            </details>
          </div>
        )}

        {/* Recommended Section */}
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Recommended</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
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