import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { locationOutline, homeOutline, businessOutline, mapOutline } from 'ionicons/icons';
import { GeoapifyGeocodingService } from '../services/GeoapifyService';
import supabase from '../supabaseConfig';
import LoadingPage from '../components/LoadingPage';

// Enhanced suggestion interface - MUST match SearchbarWithSuggestions component
interface EnhancedSuggestion {
  text: string;
  type: 'database' | 'geocoded' | 'recent';
  source?: string;
  property_type?: string | null;
  HomeType?: string | null;
}

const SearchSuggestionsPage: React.FC = () => {
  const history = useHistory();
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();

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

  const fetchEnhancedSuggestions = useCallback(
    async (term: string = ''): Promise<EnhancedSuggestion[]> => { // Provide a default empty string for 'term'
      if (!term || term.length < 2) {
        return [];
      }

      try {
        const enrichedSuggestions: EnhancedSuggestion[] = [];

        // First, try to get recent searches
        const matchingRecent = recentSearches
          .filter((search) => search.toLowerCase().includes(term.toLowerCase()))
          .slice(0, 2)
          .map((search) => ({
            text: search,
            type: 'recent' as const,
            source: 'Recent Search',
          }));

        enrichedSuggestions.push(...matchingRecent);

        // Fetch database suggestions from multiple possible tables
        try {
          const { data: propertiesData, error: propertiesError } =
            await supabase
              .from('properties')
              .select('address, building_name, property_type, HomeType')
              .limit(50);

          if (!propertiesError && propertiesData && propertiesData.length > 0) {
            propertiesData.forEach((item) => {
              if (item.address && typeof item.address === 'string') {
                const value = item.address.toLowerCase();
                if (value.includes(term.toLowerCase())) {
                  enrichedSuggestions.push({
                    text: item.address,
                    type: 'database',
                    source: 'Properties Database',
                    property_type: item.property_type,
                    HomeType: item.HomeType,
                  });
                }
              }
              if (
                item.building_name &&
                typeof item.building_name === 'string'
              ) {
                const value = item.building_name.toLowerCase();
                if (
                  value.includes(term.toLowerCase()) &&
                  item.building_name !== item.address
                ) {
                  enrichedSuggestions.push({
                    text: item.building_name,
                    type: 'database',
                    source: 'Properties Database',
                    property_type: item.property_type,
                    HomeType: item.HomeType,
                  });
                }
              }
            });
          }

          if (
            enrichedSuggestions.filter((s) => s.type === 'database').length ===
            0
          ) {
            const { data: addressData, error: addressError } = await supabase
              .from('address')
              .select('*')
              .limit(50);

            if (!addressError && addressData && addressData.length > 0) {
              addressData.forEach((item) => {
                const possibleFields = [
                  'street_address',
                  'address',
                  'full_address',
                  'unit_number',
                  'unit',
                  'building_name',
                  'building',
                  'property_name',
                  'city',
                  'town',
                  'area',
                  'state',
                  'province',
                ];

                possibleFields.forEach((field) => {
                  if (item[field] && typeof item[field] === 'string') {
                    const value = item[field].toString().toLowerCase();
                    const searchTerm = term.toLowerCase();
                    if (value.includes(searchTerm)) {
                      enrichedSuggestions.push({
                        text: item[field],
                        type: 'database',
                        source: 'Address Database',
                      });
                    }
                  }
                });
              });
            }
          }
        } catch (dbError) {
          console.error('Database suggestions error:', dbError);
        }

        // Get Geoapify suggestions if enabled
        if (term.length >= 3) { // Assuming geocoding is always enabled on this page
          try {
            const geoapifyResults =
              await GeoapifyGeocodingService.autocompleteAddress(term);

            const geoSuggestions: EnhancedSuggestion[] = geoapifyResults
              .slice(0, 4)
              .map((result) => ({
                text: result.properties.formatted,
                type: 'geocoded' as const,
                source: 'Geoapify',
              }));

            enrichedSuggestions.push(...geoSuggestions);
          } catch (error) {
            console.error('Error fetching Geoapify suggestions:', error);
          }
        }

        // Remove duplicates and sort
        const seen = new Set<string>();
        const uniqueSuggestions = enrichedSuggestions.filter((suggestion) => {
          const normalizedText = suggestion.text.toLowerCase().trim();
          if (seen.has(normalizedText)) {
            return false;
          }
          seen.add(normalizedText);
          return true;
        });

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

        return sortedSuggestions;
      } catch (err: any) {
        console.error('Error in fetchEnhancedSuggestions:', err);
        return [];
      }
    },
    [recentSearches]
  );

  const handleInput = (e: CustomEvent) => {
    const val = e.detail.value;
    setSearchText(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (val && val.length >= 2) {
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        const results = await fetchEnhancedSuggestions(val);
        setSuggestions(results);
        setLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: EnhancedSuggestion) => {
    // Add to recent searches
    const updatedRecent = [
      suggestion.text,
      ...recentSearches.filter((s) => s !== suggestion.text),
    ].slice(0, 5);
    setRecentSearches(updatedRecent);

    // Navigate back to Home page with selected suggestion using query parameters
    // Stringify the suggestion object to pass it as a query parameter
    const encodedSuggestion = encodeURIComponent(JSON.stringify(suggestion));
    history.replace(`/home?searchText=${encodeURIComponent(suggestion.text)}&suggestion=${encodedSuggestion}`);
  };

  const getSuggestionIcon = (suggestion: EnhancedSuggestion) => {
    switch (suggestion.type) {
      case 'recent': return homeOutline;
      case 'geocoded': return mapOutline;
      case 'database': return businessOutline;
      default: return locationOutline;
    }
  };

  const getSuggestionColor = (suggestion: EnhancedSuggestion) => {
    switch (suggestion.type) {
      case 'recent': return 'medium';
      case 'geocoded': return 'success';
      case 'database': return 'primary';
      default: return 'light';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonSearchbar
          value={searchText}
          onIonInput={handleInput}
          placeholder="Search your destination or property"
          showClearButton="focus"
          debounce={0}
        />

        {loading && <LoadingPage />}

        {!loading && suggestions.length === 0 && searchText.length > 0 && (
          <IonItem>
            <IonIcon icon={locationOutline} style={{ marginRight: '12px', opacity: 0.5 }} />
            <IonLabel>No suggestions found</IonLabel>
          </IonItem>
        )}

        {!loading && suggestions.length > 0 && (
          <IonList>
            <IonGrid>
              {suggestions.map((suggestion, idx) => (
                <IonRow key={`${suggestion.type}-${idx}`}>
                  <IonCol size="12">
                    <IonItem
                      button
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <IonIcon
                        icon={getSuggestionIcon(suggestion)}
                        style={{ marginRight: '12px', opacity: 0.7 }}
                      />
                      <IonLabel>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '14px' }}>
                              {suggestion.text}
                            </h3>
                            {suggestion.source && (
                              <p style={{ fontSize: '11px', color: 'var(--ion-color-medium)', margin: 0 }}>
                                From: {suggestion.source}
                              </p>
                            )}
                          </div>
                          <IonBadge
                            color={getSuggestionColor(suggestion)}
                            style={{ marginLeft: '8px', fontSize: '10px' }}
                          >
                            {suggestion.type}
                          </IonBadge>
                        </div>
                      </IonLabel>
                    </IonItem>
                  </IonCol>
                </IonRow>
              ))}
            </IonGrid>
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SearchSuggestionsPage;
