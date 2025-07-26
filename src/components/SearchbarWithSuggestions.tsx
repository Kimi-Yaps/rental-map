// Import necessary Ionic React components for UI and hooks for state management
import { 
  IonSearchbar, 
  IonCard, 
  IonCardContent, 
  IonItem, 
  IonLabel, 
  IonIcon,
  IonSpinner,
  IonBadge
} from '@ionic/react';
import { useState, useRef, useEffect } from 'react';
import { locationOutline, homeOutline, businessOutline, mapOutline } from 'ionicons/icons';

// Enhanced suggestion interface with metadata
interface EnhancedSuggestion {
  text: string;
  type: 'database' | 'geocoded' | 'recent';
  source?: string;
  coordinates?: { lat: number; lon: number };
  matchCount?: number;
}

// Props interface for the enhanced searchbar component
interface SearchbarWithSuggestionsProps {
  value: string;
  setValue: (val: string) => void;
  fetchSuggestions: (term: string) => Promise<string[]>;
  placeholder?: string;
  maxSuggestions?: number;
  enableGeocoding?: boolean;
  recentSearches?: string[];
  onRecentSearchUpdate?: (searches: string[]) => void;
}

// Main functional component for the enhanced searchbar with intelligent suggestions
const SearchbarWithSuggestions: React.FC<SearchbarWithSuggestionsProps> = ({ 
  value, 
  setValue, 
  fetchSuggestions,
  placeholder = "Search address, unit, or building",
  maxSuggestions = 8,
  enableGeocoding = true,
  recentSearches = [],
  onRecentSearchUpdate
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

  // Enhanced suggestion fetching with categorization
  const fetchEnhancedSuggestions = async (term: string): Promise<EnhancedSuggestion[]> => {
    if (!term || term.length < 2) {
      // Show recent searches when no input
      return recentSearches.slice(0, 3).map(search => ({
        text: search,
        type: 'recent' as const
      }));
    }

    try {
      setLoading(true);
      
      // Fetch suggestions from parent component
      const rawSuggestions = await fetchSuggestions(term);
      
      // Categorize and enhance suggestions
      const enhancedSuggestions: EnhancedSuggestion[] = [];
      
      // Process each suggestion and categorize
      for (const suggestion of rawSuggestions) {
        // Determine suggestion type based on content patterns
        let type: 'database' | 'geocoded' = 'database';
        
        // Check if it looks like a formatted OSM address (contains commas and multiple parts)
        if (suggestion.includes(',') && suggestion.split(',').length >= 3) {
          type = 'geocoded';
        }
        
        // Check for specific address patterns
        const hasStreetNumber = /^\d+/.test(suggestion.trim());
        const hasStreetTypes = /(street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|way|place|pl|court|ct)/i.test(suggestion);
        
        if (hasStreetNumber && hasStreetTypes) {
          type = 'geocoded';
        }

        enhancedSuggestions.push({
          text: suggestion,
          type,
          source: type === 'geocoded' ? 'OpenStreetMap' : 'Database'
        });
      }

      // Add recent searches that match the term
      const matchingRecent = recentSearches
        .filter(recent => 
          recent.toLowerCase().includes(term.toLowerCase()) && 
          !enhancedSuggestions.some(s => s.text === recent)
        )
        .slice(0, 2)
        .map(search => ({
          text: search,
          type: 'recent' as const
        }));

      const allSuggestions = [...enhancedSuggestions, ...matchingRecent];
      
      // Sort suggestions by relevance
      return allSuggestions
        .sort((a, b) => {
          // Prioritize exact matches
          if (a.text.toLowerCase().startsWith(term.toLowerCase()) && !b.text.toLowerCase().startsWith(term.toLowerCase())) return -1;
          if (!a.text.toLowerCase().startsWith(term.toLowerCase()) && b.text.toLowerCase().startsWith(term.toLowerCase())) return 1;
          
          // Then prioritize by type: recent > database > geocoded
          const typeOrder = { recent: 0, database: 1, geocoded: 2 };
          return typeOrder[a.type] - typeOrder[b.type];
        })
        .slice(0, maxSuggestions);
        
    } catch (error) {
      console.error('Error fetching enhanced suggestions:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Debounced input handler
  const handleInput = async (e: CustomEvent) => {
    const val = e.detail.value;
    setValue(val);
    setFocusedIndex(-1);
    
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the suggestion fetching
    debounceRef.current = setTimeout(async () => {
      const results = await fetchEnhancedSuggestions(val);
      setSuggestions(results);
      setShowSuggestions(results.length > 0 || val.length === 0);
    }, 300); // 300ms debounce
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: EnhancedSuggestion) => {
    setValue(suggestion.text);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Update recent searches
    if (onRecentSearchUpdate && suggestion.type !== 'recent') {
      const updatedRecent = [
        suggestion.text,
        ...recentSearches.filter(s => s !== suggestion.text)
      ].slice(0, 5); // Keep only 5 recent searches
      
      onRecentSearchUpdate(updatedRecent);
    }
    
    // Blur the searchbar
    if (searchbarRef.current) {
      searchbarRef.current.setFocus(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
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
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Handle focus and blur events
  const handleFocus = async () => {
    if (value.length === 0) {
      // Show recent searches when focusing empty input
      const recentSuggestions = await fetchEnhancedSuggestions('');
      setSuggestions(recentSuggestions);
    }
    setShowSuggestions(suggestions.length > 0 || value.length === 0);
  };

  const handleBlur = (e: FocusEvent) => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 150);
  };

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

  // Get label for suggestion type
  const getSuggestionLabel = (suggestion: EnhancedSuggestion) => {
    switch (suggestion.type) {
      case 'recent': return 'Recent';
      case 'geocoded': return 'OSM';
      case 'database': return 'DB';
      default: return '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Add keyboard event listeners
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
  }, [showSuggestions, suggestions, focusedIndex]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Enhanced search input field */}
      <IonSearchbar
        ref={searchbarRef}
        value={value}
        onIonInput={handleInput}
        placeholder={placeholder}
        style={{ 
          marginBottom: showSuggestions ? '0' : '15px',
          transition: 'margin-bottom 0.2s ease'
        }}
        showClearButton="focus"
        debounce={0} // We handle debouncing manually
      />
      
      {/* Enhanced suggestions dropdown */}
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <IonCard style={{ margin: 0, boxShadow: 'none' }}>
            <IonCardContent style={{ padding: '0' }}>
              {loading && (
                <IonItem>
                  <IonSpinner name="crescent" style={{ marginRight: '12px' }} />
                  <IonLabel>
                    <p>Searching{enableGeocoding ? ' database and OpenStreetMap' : ' database'}...</p>
                  </IonLabel>
                </IonItem>
              )}
              
              {!loading && suggestions.length === 0 && value.length > 0 && (
                <IonItem>
                  <IonIcon icon={locationOutline} style={{ marginRight: '12px', opacity: 0.5 }} />
                  <IonLabel>
                    <p style={{ color: '#666' }}>No suggestions found</p>
                  </IonLabel>
                </IonItem>
              )}
              
              {!loading && suggestions.map((suggestion, idx) => (
                <IonItem 
                  key={`${suggestion.type}-${idx}`}
                  button 
                  onClick={() => handleSuggestionSelect(suggestion)}
                  style={{
                    backgroundColor: focusedIndex === idx ? '#f0f0f0' : 'transparent',
                    transition: 'background-color 0.1s ease'
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
                          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>
                            Source: {suggestion.source}
                          </p>
                        )}
                      </div>
                      <IonBadge 
                        color={getSuggestionColor(suggestion)}
                        style={{ marginLeft: '8px', fontSize: '10px' }}
                      >
                        {getSuggestionLabel(suggestion)}
                      </IonBadge>
                    </div>
                  </IonLabel>
                </IonItem>
              ))}
              
              {!loading && suggestions.length > 0 && value.length > 0 && (
                <div style={{ 
                  padding: '8px 16px', 
                  borderTop: '1px solid #e0e0e0', 
                  backgroundColor: '#f9f9f9',
                  fontSize: '11px',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  {enableGeocoding ? 
                    'Results from database and OpenStreetMap • Use ↑↓ to navigate' : 
                    'Results from database • Use ↑↓ to navigate'
                  }
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      )}
    </div>
  );
};

export default SearchbarWithSuggestions;