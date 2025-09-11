// src/pages/Location.tsx
import React, { useState, useCallback, useEffect, Suspense } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
  IonIcon,
  IonInput,
  IonToast,
  IonSpinner,
  IonSearchbar,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { useIonRouter } from '@ionic/react';
import { locationOutline } from "ionicons/icons";
import NavigationButtons from '../components/NavigationButtons';
import { Property } from "../components/DbCrud";
import { GeoapifyGeocodingService, LatLng, GeoapifyFeature } from '../services/GeoapifyService';

// --- Lazy Map Component ---
const LazyMapComponent = React.lazy(() => import('../components/InteractiveMap'));

// Map component is now imported from InteractiveMap.tsx

// --- Loading Skeleton for Map ---
const MapSkeleton = () => (
  <IonCard>
    <div
      style={{
        height: "400px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--ion-color-light-shade)",
        borderRadius: "8px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <IonSpinner
          name="crescent"
          style={{ width: "32px", height: "32px", marginBottom: "16px" }}
        />
        <IonText color="medium">
          <p>Loading interactive map...</p>
        </IonText>
      </div>
    </div>
  </IonCard>
);

// --- Main Component ---
const Location: React.FC = () => {
  const ionRouter = useIonRouter();
  // Default to a central Malaysian location (e.g., Kuala Lumpur)
  const [markerPosition, setMarkerPosition] = useState<LatLng>({ lat: 2.430917, lng: 103.836113 });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [shouldZoom, setShouldZoom] = useState<boolean>(false);
  const [manualAddress, setManualAddress] = useState<string>("");
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [addressLocked, setAddressLocked] = useState<boolean>(false);

  // Toast states
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // LocalStorage rental draft data
  const [Property, setProperty] = useState<Property | null>(null);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const mapConfig = {
    mapZoom: 14,
    mapTileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    mapAttribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };

  // Test geocoding service function
  const testGeocodingService = useCallback(async () => {
    try {
      console.log('Testing Geoapify geocoding service...');
      const serviceWorking = await GeoapifyGeocodingService.testService();

      if (!serviceWorking) {
        setToastMessage('Location service may not be working properly. Check API key or URL.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Geoapify service test failed:', error);
      setToastMessage('Location service is not available.');
      setShowToast(true);
    }
  }, []);

  // Load localStorage data on component mount
  useEffect(() => {
    const loadDraftData = () => {
      try {
        const saved = localStorage.getItem('Property');
        if (saved) {
          const draft: Property = JSON.parse(saved);
          setProperty(draft);
          console.log("Loaded rental draft:", draft);

          // If location data exists in draft, use it
          if (draft.location && draft.address) {
            setMarkerPosition(draft.location);
            setAddress(draft.address);
            setManualAddress(draft.address);
            setSearchQuery('');
            setAddressLocked(true);
            return;
          }
        }
      } catch (error) {
        console.error("Error loading rental draft:", error);
        setProperty(null);
      }

      // CHANGED: Only set map position, don't fetch address automatically
      setInitialMapPosition();
    };

    const setInitialMapPosition = async () => {
      let initialPosition: LatLng = { lat: 2.430917, lng: 103.836113 }; // Default to Mersing

      try {
        const currentPosition = await GeoapifyGeocodingService.getCurrentPosition();
        if (currentPosition && typeof currentPosition.lat === 'number' && !isNaN(currentPosition.lat) &&
            typeof currentPosition.lng === 'number' && !isNaN(currentPosition.lng)) {
          initialPosition = currentPosition;
          console.log('Using browser geolocation for map position:', initialPosition);
        } else {
          console.log('Browser geolocation failed or returned invalid data. Using default location.');
        }
      } catch (error) {
        console.warn('Error getting initial location from browser geolocation:', error);
        console.log('Falling back to default location.');
      }
      
      setMarkerPosition(initialPosition);
    };

    loadDraftData();
    testGeocodingService();
  }, [testGeocodingService]);

  // Function to save current state to localStorage draft
  const saveCurrentStepToDraft = useCallback(async () => {
    const currentDraft: Property = JSON.parse(localStorage.getItem('Property') || '{}');

    if (!currentDraft.id) {
      currentDraft.id = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const finalAddress = manualMode ? manualAddress : address;
    const updatedDraft: Property = {
      ...currentDraft,
      location: markerPosition,
      address: finalAddress,
      searchQuery: searchQuery,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('Property', JSON.stringify(updatedDraft));
    setProperty(updatedDraft);
  }, [markerPosition, address, searchQuery, manualAddress, manualMode]);

  // Debounced search handler for Geoapify autocomplete
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      // Use autocomplete for better suggestions
      const results = await GeoapifyGeocodingService.autocompleteAddress(query, markerPosition);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
      setToastMessage("Error fetching location suggestions.");
      setShowToast(true);
    } finally {
      setIsSearching(false);
    }
  }, [markerPosition]);

  // Handle search input
  const handleSearchInput = useCallback(
    (e: CustomEvent) => {
      const value = e.detail.value! || "";
      setSearchQuery(value);
      setAddressLocked(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 500);
    },
    [fetchSuggestions]
  );

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: GeoapifyFeature) => {
      const { properties, geometry } = suggestion;
      const newPosition = {
        lat: geometry.coordinates[1],
        lng: geometry.coordinates[0],
      };

      const street = properties.street || '';
      const housenumber = properties.housenumber || '';
      const address_line1 = properties.address_line1 || properties.formatted || '';

      // Construct a more reliable address from parts
      const components = [
        street && housenumber ? `${housenumber} ${street}` : address_line1,
        properties.city,
        properties.state,
        properties.postcode,
        properties.country
      ].filter(Boolean);

      const finalAddress = components[0]; // Street address only
      const fullAddress = components.join(', '); // Complete address

      setSearchQuery(fullAddress); // Show full address in searchbar
      setAddress(finalAddress); // Keep base address for display
      setManualAddress(finalAddress);
      setMarkerPosition(newPosition);
      setShowSuggestions(false);
      setSuggestions([]);
      setShouldZoom(true);
      setAddressLocked(true);

      // Save address components to draft
      const currentDraft = JSON.parse(localStorage.getItem('Property') || '{}');
      const updatedDraft = {
        ...currentDraft,
        address: finalAddress,
        city: properties.city ?? '',
        state: properties.state ?? '',
        postal_code: properties.postcode ?? '',
        country: properties.country ?? '',
        location: newPosition,
      };
      localStorage.setItem('Property', JSON.stringify(updatedDraft));

    },
    []
  );

  // Function to update address when marker is dragged or map is clicked
  const updateAddressFromMap = useCallback(async (location: LatLng) => {
    if (manualMode) {
      console.log("Manual mode on, skipping reverse geocode.");
      return;
    }

    setIsReverseGeocoding(true);
    try {
      const feature = await GeoapifyGeocodingService.reverseGeocode(location.lat, location.lng);
      if (feature) {
        const { properties } = feature;
        const street = properties.street || '';
        const housenumber = properties.housenumber || '';
        const address_line1 = properties.address_line1 || properties.formatted || '';

        // Construct address components
        const streetAddress = street && housenumber ? `${housenumber} ${street}` : address_line1;
        const full_address = [
          streetAddress,
          properties.city,
          properties.state,
          properties.postcode,
          properties.country
        ].filter(Boolean).join(', ');

        // Update both the searchbar and selected location with the full address
        setAddress(streetAddress);
        setManualAddress(streetAddress);
        setSearchQuery(full_address); // Use the full address in the searchbar
        setAddressLocked(true);
        setToastMessage("Complete address updated from map location.");
        setShowToast(true);

        // Save address components to draft
        const currentDraft = JSON.parse(localStorage.getItem('Property') || '{}');
        const updatedDraft = {
          ...currentDraft,
          address: streetAddress,
          city: properties.city ?? '',
          state: properties.state ?? '',
          postal_code: properties.postcode ?? '',
          country: properties.country ?? '',
          location: location,
          full_address: full_address,
          formatted_address: properties.formatted || '',
        };
        localStorage.setItem('Property', JSON.stringify(updatedDraft));
      } else {
        setToastMessage("Could not find address for this location.");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error on marker drag end:", error);
      setToastMessage("Could not update address from map location.");
      setShowToast(true);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [manualMode]);

  // Handle location change from map
  const handleLocationChange = useCallback(async (location: LatLng) => {
    console.log('Location changed to:', location);

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number' || isNaN(location.lat) || isNaN(location.lng)) {
      console.error('Invalid location object:', location);
      setToastMessage('Invalid location coordinates');
      setShowToast(true);
      return;
    }

    if (location.lat < -90 || location.lat > 90 || location.lng < -180 || location.lng > 180) {
      console.error('Coordinates out of valid range:', location);
      setToastMessage('Coordinates are out of valid range');
      setShowToast(true);
      return;
    }

    setMarkerPosition(location);
    setShouldZoom(false);

    // When the location changes on the map (either by clicking or dragging),
    // we now trigger the address update.
    updateAddressFromMap(location);
    
  }, [updateAddressFromMap]);

  // Clear suggestions when search query is cleared
  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setAddressLocked(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Toggle manual mode
  const toggleManualMode = useCallback(() => {
    setManualMode((m) => {
      const newMode = !m;
      setAddressLocked(false);
      
      if (newMode) {
        setManualAddress(address);
        setSearchQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
      } else {
        if (manualAddress) {
          GeoapifyGeocodingService.geocodeAddress(manualAddress).then(results => {
            if (results.length > 0) {
              const firstResult = results[0];
              const newPosition = {
                lat: firstResult.geometry.coordinates[1],
                lng: firstResult.geometry.coordinates[0],
              };
              setMarkerPosition(newPosition);
              setShouldZoom(true);
              setAddress(firstResult.properties.formatted);
              setSearchQuery(firstResult.properties.formatted);
              setAddressLocked(true);
            } else {
              console.warn("Could not geocode manual address:", manualAddress);
              setToastMessage("Could not find coordinates for the manual address. Please refine it.");
              setShowToast(true);
              setAddress(manualAddress);
              setSearchQuery(manualAddress);
            }
          }).catch(err => {
            console.error("Geocoding manual address error:", err);
            setToastMessage("Error geocoding manual address. Using current map coordinates.");
            setShowToast(true);
            setAddress(manualAddress);
            setSearchQuery(manualAddress);
          });
        } else {
          setSearchQuery(address);
        }
      }
      return newMode;
    });
  }, [address, manualAddress]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleNextStep = () => {
    // Validation to ensure address is provided before proceeding
    const finalAddress = manualMode ? manualAddress : address;
    if (!finalAddress || finalAddress.trim() === "") {
      setToastMessage("Please provide a property address before continuing.");
      setShowToast(true);
      return;
    }

    saveCurrentStepToDraft();
    ionRouter.push('/rooms', 'forward');
  };

  const handleBack = () => {
    // No specific action needed here, as the NavigationButtons component handles the alert and navigation
  };

  // Get the display address - show placeholder when empty
  const getDisplayAddress = (): string => {
    if (manualMode) {
      return manualAddress || "Enter your property address manually";
    }
    // Use the search query if available, otherwise fall back to address
    return searchQuery || address || "Search for your property location or click on the map";
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Property Location</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonGrid>
          <IonRow className="ion-align-items-center ion-margin-bottom">
            <IonCol size="auto">
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ion-color-primary-contrast)',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                1
              </div>
            </IonCol>
            <IonCol>
              <IonText color="primary">
                <h2>Location</h2>
              </IonText>
            </IonCol>
          </IonRow>

          {/* Display current draft data if available */}
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="10" size-lg="8">
              
              {!Property && (
                <IonCard color="warning" className="ion-margin-bottom">
                  <IonCardContent>
                    <IonText color="var(--ion-color-warning-contrast)">
                      <p><strong>No draft data found in localStorage.</strong> Please provide your property location.</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}
            </IonCol>
          </IonRow>

          {/* Manual Address Toggle */}
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="10" size-lg="8">
              <IonItem lines="none" className="ion-margin-bottom">
                <IonLabel>Manual Address Entry</IonLabel>
                <IonButton
                  onClick={toggleManualMode}
                  fill={manualMode ? "solid" : "outline"}
                  color={manualMode ? "primary" : "medium"}
                  size="small"
                  className="ion-margin-start"
                >
                  {manualMode ? "Disable Manual Entry" : "Enable Manual Entry"}
                </IonButton>
              </IonItem>
            </IonCol>
          </IonRow>
          
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="10" size-lg="8">
              {manualMode ? (
                <IonItem className="ion-margin-bottom">
                  <IonInput
                    label="Property Address"
                    labelPlacement="floating"
                    value={manualAddress}
                    onIonChange={(e) => setManualAddress(e.detail.value!)}
                    placeholder="Enter your complete property address"
                  />
                </IonItem>
              ) : (
                <div style={{ position: "relative" }}>
                  <IonSearchbar
                    placeholder="Search for your property location (e.g., 123 Main Street, Kuala Lumpur)"
                    onIonInput={handleSearchInput}
                    onIonClear={handleSearchClear}
                    showClearButton="focus"
                    value={searchQuery}
                  />

                  {/* Loading indicator for search */}
                  {isSearching && (
                    <div
                      style={{
                        position: "absolute",
                        right: "50px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 10,
                      }}
                    >
                      <IonSpinner
                        name="crescent"
                        style={{ width: "20px", height: "20px" }}
                      />
                    </div>
                  )}

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && !manualMode && (
                    <IonCard
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        maxHeight: "200px",
                        overflowY: "auto",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                        marginTop: "5px",
                      }}
                    >
                      <IonCardContent className="ion-no-padding">
                        {suggestions.map((suggestion, index) => (
                          <IonItem
                            key={suggestion.properties.place_id || index}
                            button
                            onClick={() => handleSuggestionSelect(suggestion)}
                            detail={false}
                          >
                            <IonIcon icon={locationOutline} slot="start" color="medium" />
                            <IonLabel>
                              <h2>{suggestion.properties.formatted}</h2>
                              {suggestion.properties.confidence && (
                                <p>Confidence: {Math.round(suggestion.properties.confidence * 100)}%</p>
                              )}
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonCardContent>
                    </IonCard>
                  )}
                </div>
              )}
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="10" size-lg="8">
              <IonCard className="ion-margin-top" style={{ height: "400px", width: "100%" }}>
                <IonCardContent className="ion-no-padding" style={{ height: "100%" }}>
                  <Suspense fallback={<MapSkeleton />}>
                    <LazyMapComponent
                      position={markerPosition}
                      onLocationChange={handleLocationChange}
                      config={mapConfig}
                      shouldZoom={shouldZoom}
                    />
                  </Suspense>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="10" size-lg="8">
              <IonItem className="ion-margin-top">
                <IonIcon icon={locationOutline} slot="start" />
                <IonLabel position="stacked">Selected Location Address</IonLabel>
                <IonText>
                  <p className="ion-padding-top ion-padding-bottom">
                    {isReverseGeocoding && !manualMode ? (
                      <>
                        <IonSpinner name="dots" /> Getting address...
                      </>
                    ) : (
                      <span style={{ 
                        color: (!address && !manualAddress) ? 'var(--ion-color-medium)' : 'inherit',
                        fontStyle: (!address && !manualAddress) ? 'italic' : 'normal'
                      }}>
                        {getDisplayAddress()}
                      </span>
                    )}
                  </p>
                </IonText>
              </IonItem>
            </IonCol>
          </IonRow>

          </IonGrid>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          color="dark"
        />
      </IonContent>
      <NavigationButtons
        onNext={handleNextStep}
        onBack={handleBack}
        nextDisabled={!address && !manualAddress}
        backPath="/propertyType"
      />
    </IonPage>
  );
};

export default Location;
