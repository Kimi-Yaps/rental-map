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
  IonBadge,
  IonButtons,
  IonMenuButton
} from '@ionic/react';
import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import supabase from '../../supabaseConfig';
import { mapOutline, settingsOutline, moon } from 'ionicons/icons';
import SearchbarWithSuggestions from '../components/SearchbarWithSuggestions';
import './Main.css';
import { RentalAmenities, Property } from '../components/DbCrud';
import Stepper from '../components/Stepper';
import BurgerMenu from '../components/BurgerMenu';

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
  const [guests, setGuests] = useState('1');
  const [selectedTab, setSelectedTab] = useState('home-apts');
  
  // Enhanced search state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [enableGeocoding, setEnableGeocoding] = useState<boolean>(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [selectedPage, setSelectedPage] = useState('home');

  const history = useHistory();

  // Dark Mode Toggle
  const toggleDarkMode = () => {
    document.body.classList.toggle('dark');
    setIsDark(!isDark);
  };

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(prefersDark.matches);
    document.body.classList.toggle('dark', prefersDark.matches);

    prefersDark.addEventListener('change', (mediaQuery) => {
      setIsDark(mediaQuery.matches);
      document.body.classList.toggle('dark', mediaQuery.matches);
    });
  }, []);

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
    <IonPage id="main-content">
      <BurgerMenu selectedPage={selectedPage} setSelectedPage={setSelectedPage} />
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Rental Map</IonTitle>
          <IonItem slot="end" color="primary" lines="none">
            <IonIcon icon={moon} className="ion-padding-end"/>
            <IonToggle checked={isDark} onIonChange={toggleDarkMode} />
          </IonItem>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen>
        <div style={{ background: 'var(--ion-color-background)', color: 'var(--ion-color-text)', minHeight: '100%' }}>
          <IonHeader collapse="condense">
            <IonToolbar color="light">
              <IonTitle size="large">Property Search</IonTitle>
            </IonToolbar>
          </IonHeader>

          {/* Navigation Bar */}
          <IonGrid className="ion-padding-horizontal ion-padding-vertical">
            <IonRow className="ion-align-items-center ion-justify-content-between">
              <IonCol size-xs="12" size-sm="auto" className="navBar">
                <b>RentalMap</b>
              </IonCol>
              <IonCol size-xs="12" size-sm="auto" className="navBar">
                Hotel & Homes
              </IonCol>
              <IonCol size-xs="12" size-sm="auto" className="navBar">
                <IonButton onClick={() => history.push('/landlord')} fill="clear" color="primary">
                  List Your Place
                </IonButton>
              </IonCol>
              <IonCol size-xs="12" size-sm="auto" className="navBar">
                <img id="profile" src="" alt="Profile" style={{ borderRadius: '50%', width: '32px', height: '32px', background: 'var(--ion-color-tertiary)' }}/>
              </IonCol>
              <IonCol size-xs="12" size-sm="auto" className="navBar">
                <span className="currency">RM</span>
              </IonCol>
            </IonRow>
          </IonGrid>

          {/* Search Section */}
          <IonGrid className="ion-padding">
            <IonRow className="ion-justify-content-center">
              <IonCol size-xs="12" size-md="10" size-lg="8">
                <IonCard style={{ borderRadius: 'var(--custom-border-radius-large)', background: 'var(--ion-color-light-tint)' }}>
                  <IonCardContent>
                    <div style={{ textAlign: 'center', marginBottom: '20px', color: 'var(--ion-color-primary)' }}>
                      <h2>Find Your Next Stay</h2>
                    </div>

                    {/* Tab Segment */}
                    <IonSegment 
                      value={selectedTab} 
                      onIonChange={e => setSelectedTab(e.detail.value as string)}
                      style={{ marginBottom: '20px', borderRadius: 'var(--custom-border-radius-medium)', overflow: 'hidden' }}
                    >
                      <IonSegmentButton value="home-apts" style={{ background: selectedTab === 'home-apts' ? 'var(--ion-color-primary)' : 'transparent', color: selectedTab === 'home-apts' ? 'var(--ion-color-primary-contrast)' : 'var(--ion-color-text)' }}>
                        <IonLabel>Home & Apts</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="day-use" style={{ background: selectedTab === 'day-use' ? 'var(--ion-color-primary)' : 'transparent', color: selectedTab === 'day-use' ? 'var(--ion-color-primary-contrast)' : 'var(--ion-color-text)' }}>
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
                          <IonItem style={{ borderRadius: 'var(--custom-border-radius-small)', marginBottom: '10px' }}>
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
                          <IonItem style={{ borderRadius: 'var(--custom-border-radius-small)', marginBottom: '10px' }}>
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
                          <IonItem style={{ borderRadius: 'var(--custom-border-radius-small)', marginBottom: '10px' }}>
                            <Stepper 
                              label="Guests"
                              value={parseInt(guests)} 
                              onIncrement={() => setGuests(String(parseInt(guests) + 1))}
                              onDecrement={() => setGuests(String(parseInt(guests) - 1))}
                              min={1}
                              max={20}
                            />
                          </IonItem>
                        </IonCol>
                      </IonRow>
                    </IonGrid>

                    {/* Advanced Settings Toggle */}
                    <IonItem 
                      button 
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      style={{ marginTop: '10px', borderRadius: 'var(--custom-border-radius-small)' }}
                      lines="none"
                    >
                      <IonIcon icon={settingsOutline} slot="start" color="secondary" />
                      <IonLabel color="secondary">Advanced Search Settings</IonLabel>
                    </IonItem>

                    {/* Advanced Settings Panel */}
                    {showAdvancedSettings && (
                      <IonCard color="light" style={{ margin: '10px 0', borderRadius: 'var(--custom-border-radius-medium)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                        <IonCardContent>
                          <IonItem lines="none" color="transparent">
                            <IonIcon icon={mapOutline} slot="start" color="primary" />
                            <IonLabel>
                              <h3>Enable OpenStreetMap Geocoding</h3>
                              <p>Get enhanced location suggestions</p>
                            </IonLabel>
                            <IonToggle
                              checked={enableGeocoding}
                              onIonToggle={(e) => setEnableGeocoding(e.detail.checked)}
                              color="primary"
                            />
                          </IonItem>
                          
                          {recentSearches.length > 0 && (
                            <div style={{ marginTop: '15px' }}>
                              <IonLabel color="medium">
                                <h4>Recent Searches:</h4>
                              </IonLabel>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '8px' }}>
                                {recentSearches.slice(0, 3).map((search, idx) => (
                                  <IonBadge 
                                    key={idx}
                                    color="tertiary"
                                    style={{ cursor: 'pointer', borderRadius: 'var(--custom-border-radius-small)', padding: '5px 10px' }}
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
                          color="primary"
                          style={{ borderRadius: 'var(--custom-border-radius-medium)' }}
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
                        backgroundColor: 'var(--ion-color-secondary-tint)',
                        borderRadius: 'var(--custom-border-radius-small)',
                        fontSize: '14px',
                        color: 'var(--ion-color-secondary-contrast)'
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

          {/* Recommended Section */}
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--ion-color-primary)' }}>Recommended</h3>
            <p style={{ color: 'var(--ion-color-medium)', fontSize: '14px' }}>
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
            cssClass="custom-alert"
          />

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;