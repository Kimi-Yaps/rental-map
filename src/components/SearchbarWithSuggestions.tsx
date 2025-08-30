// Import necessary Ionic React components for UI and hooks for state management
import { 
  IonSearchbar, 
  IonCard, 
  IonCardContent, 
  IonItem, 
  IonLabel, 
  IonIcon,
  IonSpinner,
  IonBadge,
  IonList,
  IonButton, // Added IonButton
  isPlatform, // Added isPlatform
} from '@ionic/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useIonRouter } from '@ionic/react';
import { locationOutline, homeOutline, businessOutline, mapOutline } from 'ionicons/icons';

// These interfaces match the data structure from the parent component.
// They are needed to correctly type the props and local state.

// Enhanced suggestion interface with metadata
export interface EnhancedSuggestion {
  text: string;
  type: 'database' | 'geocoded' | 'recent';
  source?: string;
  coordinates?: { lat: number; lon: number };
  property_type?: string | null;
  HomeType?: string | null;
}

// Props interface for the enhanced searchbar component
interface SearchbarWithSuggestionsProps {
  value: string;
  setValue: (val: string) => void;
  // This prop's type has been corrected to match the parent's function signature.
  fetchSuggestions: (term: string) => Promise<EnhancedSuggestion[]>;
  placeholder?: string;
  maxSuggestions?: number;
  enableGeocoding?: boolean;
  onSearch?: (term: string, suggestion?: EnhancedSuggestion) => void;
  placeholderColor?: string; // New prop for placeholder color
}

// Main functional component for the enhanced searchbar with intelligent suggestions
const SearchbarWithSuggestions: React.FC<SearchbarWithSuggestionsProps> = ({ 
  value, 
  setValue, 
  fetchSuggestions,
  placeholder = "Search address, unit, or building",
  maxSuggestions = 8,
  enableGeocoding = true,
  onSearch
}) => {
  // Local state management
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  
  // Refs for managing focus and debouncing
  const searchbarRef = useRef<HTMLIonSearchbarElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced handler to fetch suggestions
  const handleFetchSuggestions = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await fetchSuggestions(term);
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [fetchSuggestions]);

  // Handle input changes with a debounce
  const handleInput = (e: CustomEvent) => {
    const val = e.detail.value;
    setValue(val);
    setFocusedIndex(-1);
    
    // New logic: Show/hide suggestions based on input value
    setShowSuggestions(!!val);

    // Clear existing debounce timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set a new debounce timeout to fetch suggestions if the term is long enough
    if (val && val.length >= 2) {
      debounceRef.current = setTimeout(() => {
        handleFetchSuggestions(val);
      }, 300); // 300ms debounce
    } else {
        // If the input is too short, clear the suggestions immediately
        setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: EnhancedSuggestion) => {
    setValue(suggestion.text);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Trigger the onSearch prop
    if (onSearch) {
      onSearch(suggestion.text, suggestion);
    }
    
    // Blur the searchbar
    if (searchbarRef.current) {
      searchbarRef.current.setFocus(false);
    }
  };

  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[focusedIndex]);
        } else if (value && onSearch) {
          onSearch(value); // If no suggestion is selected, perform a search with the current text
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, focusedIndex, value, onSearch, handleSuggestionSelect]);

  // Handle focus and blur events
  const handleFocus = useCallback(() => {
    setShowSuggestions(true);
    // Fetch initial suggestions on focus if there's existing text
    if (value.length >= 2) {
      handleFetchSuggestions(value);
    }
  }, [value, handleFetchSuggestions]);

  const handleBlur = useCallback((e: FocusEvent) => {
    // Delay hiding suggestions to allow clicks to register
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 150);
  }, []);

  // Get appropriate icon for suggestion type
  const getSuggestionIcon = (suggestion: EnhancedSuggestion) => {
    switch (suggestion.type) {
      case 'recent': return homeOutline;
      case 'geocoded': return mapOutline;
      case 'database': return businessOutline;
      default: return locationOutline;
    }
  };

  // Get color for suggestion badge
  const getSuggestionColor = (suggestion: EnhancedSuggestion) => {
    switch (suggestion.type) {
      case 'recent': return 'medium';
      case 'geocoded': return 'success';
      case 'database': return 'primary';
      default: return 'light';
    }
  };

  // Add and clean up keyboard/focus/blur event listeners
  useEffect(() => {
    const searchbarElement = searchbarRef.current?.querySelector('input');
    if (searchbarElement) {
      searchbarElement.addEventListener('keydown', handleKeyDown);
      searchbarElement.addEventListener('focus', handleFocus);
      searchbarElement.addEventListener('blur', handleBlur);
      
      return () => {
        searchbarElement.removeEventListener('keydown', handleKeyDown);
        searchbarElement.removeEventListener('focus', handleFocus);
        searchbarElement.removeEventListener('blur', handleBlur);
      };
    }
  }, [handleKeyDown, handleFocus, handleBlur]);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const router = useIonRouter(); // Initialize useIonRouter

  const handleMobileSearchClick = () => {
    // Navigate to the new page for search suggestions
    router.push('/search-suggestions', 'forward');
  };

  return (
    <div style={{ position: 'relative' }}>
      {isPlatform('mobile') ? (
        <IonButton
          expand="block"
          onClick={handleMobileSearchClick}
          className="ion-margin-bottom"
          color="light"
          style={{
            '--border-radius': 'var(--custom-border-radius-medium)',
            '--box-shadow': 'none',
            '--border-color': 'var(--ion-color-medium-tint)',
            '--border-width': '1px',
            '--background': 'var(--ion-color-light)',
            color: 'var(--ion-color-medium)',
            textAlign: 'left',
            height: '48px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <IonIcon icon={locationOutline} slot="start" />
          <IonLabel>{placeholder}</IonLabel>
        </IonButton>
      ) : (
        <>
          {/* Enhanced search input field */}
          <IonSearchbar
            ref={searchbarRef}
            value={value}
            onIonInput={handleInput}
            placeholder={placeholder}
            className={value ? 'searchbar-filled' : ''}
            style={{ 
              marginBottom: showSuggestions ? '0' : '15px',
              transition: 'margin-bottom 0.2s ease'
            }}
            showClearButton="focus"
            debounce={0} // We handle debouncing manually
          />
          
          {/* Enhanced suggestions dropdown with backdrop filter */}
          {showSuggestions && (suggestions.length > 0 || loading) && (
            <div 
              ref={suggestionsRef}
              style={{ 
                position: 'absolute', 
                top: '100%', 
                left: 0, 
                right: 0, 
                zIndex: 1000, 
                marginTop: '-15px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
                backdropFilter: 'blur(16px) saturate(180%)',
                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                backgroundColor: 'var(--ion-color-light-tint)',
                border: '1px solid var(--ion-color-medium)'
              }}
            >
              <IonCard style={{ 
                margin: 0, 
                boxShadow: 'none',
                backgroundColor: 'transparent'
              }}>
                <IonCardContent style={{ padding: '0' }}>
                  {loading && (
                    <IonItem style={{ backgroundColor: 'transparent' }}>
                      <IonSpinner name="crescent" style={{ marginRight: '12px' }} />
                      <IonLabel>
                        <p>Searching{enableGeocoding ? ' database and OpenStreetMap' : ' database'}...</p>
                      </IonLabel>
                    </IonItem>
                  )}
                  
                  {!loading && suggestions.length === 0 && value.length > 0 && (
                    <IonItem style={{ backgroundColor: 'transparent' }}>
                      <IonIcon icon={locationOutline} style={{ marginRight: '12px', opacity: 0.5 }} />
                      <IonLabel>
                        <p style={{ color: 'var(--ion-color-medium)' }}>No suggestions found</p>
                      </IonLabel>
                    </IonItem>
                  )}
                  
                  {!loading && suggestions.length > 0 && (
                    <IonList style={{ backgroundColor: 'transparent' }}>
                      {suggestions.map((suggestion, idx) => (
                        <IonItem 
                          key={`${suggestion.type}-${idx}`}
                          button 
                          onClick={() => handleSuggestionSelect(suggestion)}
                          style={{
                            backgroundColor: focusedIndex === idx 
                              ? 'var(--ion-color-light-shade)' 
                              : 'transparent',
                            transition: 'background-color 0.2s ease',
                            borderRadius: focusedIndex === idx ? '8px' : '0',
                            margin: focusedIndex === idx ? '2px 8px' : '0'
                          }}
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
                      ))}
                    </IonList>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchbarWithSuggestions;
