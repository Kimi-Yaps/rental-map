// src/pages/LocationStepPage.tsx
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
  IonToggle,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { useHistory } from 'react-router-dom';
import {
  locationOutline,
  searchOutline,
} from "ionicons/icons";
import supabase from '../../supabaseConfig';
import { Property } from "../components/DbCrud";

// LatLng interface
interface LatLng {
  lat: number;
  lng: number;
}

// Geoapify API types
interface GeoapifyProperties {
  formatted: string;
  address_line1?: string;
  address_line2?: string;
  category?: string;
  city?: string;
  country?: string;
  country_code?: string;
  county?: string;
  district?: string;
  postcode?: string;
  state?: string;
  suburb?: string;
  housenumber?: string;
  street?: string;
  name?: string;
  place_id: string;
  confidence?: number;
  distance?: number;
}

interface GeoapifyFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: GeoapifyProperties;
}

interface GeoapifyResponse {
  type: "FeatureCollection";
  features: GeoapifyFeature[];
  query?: {
    text?: string;
    parsed?: any;
  };
}

// --- Lazy Map Component (remains the same) ---
const LazyMapComponent = React.lazy(() =>
  Promise.all([
    import("react-leaflet"),
    import("leaflet"),
    import("leaflet/dist/leaflet.css"),
  ]).then(([leafletModule, L]) => {
    const leaflet = L.default || L;
    delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
    leaflet.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const MapWithInteractions = ({
      position,
      onLocationChange,
      config,
      shouldZoom,
    }: {
      position: LatLng;
      onLocationChange: (location: LatLng) => void;
      config: any;
      shouldZoom: boolean;
    }) => {
      const markerRef = React.useRef<any>(null);
      const mapRef = React.useRef<any>(null);
      const { MapContainer, TileLayer, Marker, useMapEvents } = leafletModule;

      const MapClickHandler = () => {
        useMapEvents({
          click(e: any) {
            const latLng = { lat: e.latlng.lat, lng: e.latlng.lng };
            onLocationChange(latLng);
          },
        });
        return null;
      };

      const MapCenterUpdater = ({
        position,
        shouldZoom,
      }: {
        position: LatLng;
        shouldZoom: boolean;
      }) => {
        const map = useMapEvents({});
        React.useEffect(() => {
          if (map && position && shouldZoom) {
            map.flyTo([position.lat, position.lng], config.mapZoom, {
              animate: true,
              duration: 1.5,
            });
          }
        }, [position, map, shouldZoom]);
        return null;
      };

      const eventHandlers = React.useMemo(
        () => ({
          dragend() {
            const marker = markerRef.current;
            if (marker != null) {
              const newPosition = marker.getLatLng();
              const latLng = { lat: newPosition.lat, lng: newPosition.lng };
              onLocationChange(latLng);
            }
          },
        }),
        [onLocationChange]
      );

      return (
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={config.mapZoom}
          style={{ height: "100%", width: "100%" }}
          preferCanvas={true}
          zoomControl={true}
          attributionControl={true}
          ref={mapRef}
        >
          <TileLayer
            url={config.mapTileUrl}
            attribution={config.mapAttribution}
            maxZoom={18}
            tileSize={256}
            updateWhenIdle={true}
            keepBuffer={2}
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
          />
          <MapClickHandler />
          <MapCenterUpdater position={position} shouldZoom={shouldZoom} />
        </MapContainer>
      );
    };

    return { default: MapWithInteractions };
  })
);

// --- Geoapify Geocoding Service ---
class GeoapifyGeocodingService {
  private static readonly AUTOCOMPLETE_API_KEY = import.meta.env.VITE_GEOAPIFY_AUTOCOMPLETE_API_KEY || '9a225b37e2aa487da7857b3e72048a26';
  private static readonly REVERSE_API_KEY = import.meta.env.VITE_GEOAPIFY_REVERSE_API_KEY || 'cf9ee03b61b14d778e338e910106aa2b';
  private static readonly GEOCODING_API_KEY = import.meta.env.VITE_GEOAPIFY_GEOCODING_API_KEY || 'e38e5df6d2fd4b47aa2517296911458d';
  
  private static readonly AUTOCOMPLETE_BASE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
  private static readonly REVERSE_BASE_URL = 'https://api.geoapify.com/v1/geocode/reverse';
  private static readonly GEOCODING_BASE_URL = 'https://api.geoapify.com/v1/geocode/search';
  
  private static readonly GEOCODING_DELAY = 300; // Delay to prevent too many requests for autocomplete
  private static lastRequestTime = 0;
  private static readonly MAX_RETRIES = 2;
  private static readonly REQUEST_TIMEOUT = 10000;

  private static buildUrl(baseUrl: string, params: Record<string, any>): string {
    const url = new URL(baseUrl);
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, String(params[key]));
      }
    }
    return url.toString();
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static validateCoordinates(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180;
  }

  private static async makeRequest<T>(url: string, retryCount = 0): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      console.log(`Making Geoapify request to: ${url} (attempt ${retryCount + 1})`);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`);
      }

      return await response.json() as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        console.error(`Geoapify request timed out after ${this.REQUEST_TIMEOUT}ms`);
        throw new Error('Geoapify request timed out');
      }

      if (retryCount < this.MAX_RETRIES) {
        console.warn(`Geoapify network error, retry ${retryCount + 1}/${this.MAX_RETRIES}:`, error.message);
        await this.delay(2000 * (retryCount + 1));
        return this.makeRequest<T>(url, retryCount + 1);
      }

      throw error;
    }
  }

  // Autocomplete address using Geoapify /v1/geocode/autocomplete
  static async autocompleteAddress(address: string, focusPoint?: LatLng): Promise<GeoapifyFeature[]> {
    if (!address || address.trim().length < 3) {
      return [];
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await this.delay(this.GEOCODING_DELAY - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const params: Record<string, any> = {
      text: address,
      limit: 10,
      apiKey: this.AUTOCOMPLETE_API_KEY,
      filter: 'countrycode:my', // Filter results to Malaysia only
      format: 'geojson'
    };

    if (focusPoint && this.validateCoordinates(focusPoint.lat, focusPoint.lng)) {
      params.bias = `proximity:${focusPoint.lng},${focusPoint.lat}`;
    }

    try {
      const url = this.buildUrl(this.AUTOCOMPLETE_BASE_URL, params);
      const data = await this.makeRequest<GeoapifyResponse>(url);
      console.log('Geoapify Autocomplete Response:', data);
      return data.features || [];
    } catch (error: any) {
      console.error("Geoapify Autocomplete error:", error.message || error);
      throw new Error(`Autocomplete failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Geocode address using Geoapify /v1/geocode/search
  static async geocodeAddress(address: string, focusPoint?: LatLng): Promise<GeoapifyFeature[]> {
    if (!address || address.trim().length < 3) {
      return [];
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await this.delay(this.GEOCODING_DELAY - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const params: Record<string, any> = {
      text: address,
      limit: 10,
      apiKey: this.GEOCODING_API_KEY,
      filter: 'countrycode:my', // Filter results to Malaysia only
      format: 'geojson'
    };

    if (focusPoint && this.validateCoordinates(focusPoint.lat, focusPoint.lng)) {
      params.bias = `proximity:${focusPoint.lng},${focusPoint.lat}`;
    }

    try {
      const url = this.buildUrl(this.GEOCODING_BASE_URL, params);
      const data = await this.makeRequest<GeoapifyResponse>(url);
      console.log('Geoapify Geocode Response:', data);
      return data.features || [];
    } catch (error: any) {
      console.error("Geoapify Geocoding error:", error.message || error);
      throw new Error(`Geocoding failed: ${error.message || 'Unknown error'}`);
    }
  }

  // Reverse geocode using Geoapify /v1/geocode/reverse
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    if (!this.validateCoordinates(lat, lng)) {
      console.error(`Invalid coordinates for reverse geocoding: lat=${lat}, lng=${lng}`);
      throw new Error('Invalid coordinates provided');
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await this.delay(this.GEOCODING_DELAY - timeSinceLastRequest);
    }
    this.lastRequestTime = Date.now();

    const params: Record<string, any> = {
      lat: lat,
      lon: lng,
      limit: 1,
      apiKey: this.REVERSE_API_KEY,
      format: 'geojson'
    };

    try {
      const url = this.buildUrl(this.REVERSE_BASE_URL, params);
      const data = await this.makeRequest<GeoapifyResponse>(url);
      console.log('Geoapify Reverse Geocode Response:', data);

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        // Use formatted address from Geoapify
        return feature.properties.formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } else {
        console.warn('No reverse geocoding results found for:', { lat, lng });
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Fallback to coordinates
      }
    } catch (error: any) {
      console.error("Geoapify Reverse geocoding error:", error.message || error);
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      console.log('Using coordinate fallback:', fallbackAddress);
      return fallbackAddress;
    }
  }

  // Geolocation using browser API
  static async getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.warn('Geolocation request timed out');
        resolve(null);
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          if (this.validateCoordinates(lat, lng)) {
            resolve({ lat, lng });
          } else {
            console.warn('Invalid coordinates from geolocation API:', { lat, lng });
            resolve(null);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.warn('Error getting current position:', error.message);

          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.warn('User denied the request for Geolocation');
              break;
            case error.POSITION_UNAVAILABLE:
              console.warn('Location information is unavailable');
              break;
            case error.TIMEOUT:
              console.warn('The request to get user location timed out');
              break;
          }

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  // Test method to verify service availability
  static async testService(): Promise<boolean> {
    try {
      console.log('Testing Geoapify geocoding service...');
      // Test with a known location in Malaysia
      const results = await this.geocodeAddress('Kuala Lumpur', {lat: 3.1390, lng: 101.6869});
      const serviceWorking = results && results.length > 0;

      if (serviceWorking) {
        console.log('✅ Geoapify service is working, found:', results[0].properties.formatted);
      } else {
        console.warn('⚠️ Geoapify service returned no results for test query');
      }

      return serviceWorking;
    } catch (error: any) {
      console.error('❌ Geoapify service test failed:', error.message);
      return false;
    }
  }
}

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
        backgroundColor: "#f5f5f5",
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
const LocationStepPage: React.FC = () => {
  const history = useHistory();
  // Default to a central Malaysian location (e.g., Kuala Lumpur)
  const [markerPosition, setMarkerPosition] = useState<LatLng>({ lat: 2.430917, lng: 103.836113 });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [address, setAddress] = useState<string>(""); // CHANGED: Start with empty address
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

  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

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
    } catch (error: any) {
      console.error('Geoapify service test failed:', error);
      setToastMessage('Location service is not available.');
      setShowToast(true);
    }
  }, []);

  // MODIFIED: Load localStorage data on component mount - no default address fetching
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
            setSearchQuery(''); // Don't populate search from draft
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
      try {
        // Try browser geolocation first for map positioning only
        const currentPosition = await GeoapifyGeocodingService.getCurrentPosition();
        if (currentPosition) {
          setMarkerPosition(currentPosition);
          console.log('Using browser geolocation for map position:', currentPosition);
          return;
        }
        
        // Fallback to default location if browser geolocation fails
        const defaultLocation = { lat: 2.430917, lng: 103.836113 }; // Mersing coordinates
        setMarkerPosition(defaultLocation);
        console.log('Using default location for map position:', defaultLocation);

      } catch (error) {
        console.warn('Error getting initial location:', error);
        // Final fallback to default location
        const defaultLocation = { lat: 2.430917, lng: 103.836113 }; // Mersing coordinates
        setMarkerPosition(defaultLocation);
        console.log('Using default location for map position:', defaultLocation);
      }
    };

    loadDraftData();
    testGeocodingService();
  }, [testGeocodingService]);

  // Function to save current state to localStorage draft
  const saveCurrentStepToDraft = useCallback(async () => {
    let currentDraft: Property = JSON.parse(localStorage.getItem('Property') || '{}');

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
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
    };

    localStorage.setItem('Property', JSON.stringify(updatedDraft));
    setProperty(updatedDraft);
  }, [markerPosition, address, searchQuery, manualAddress, manualMode]);

  // REMOVED: Automatic reverse geocoding on marker position change
  // The useEffect that automatically fetched address when markerPosition changed has been removed

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
    } catch (error: any) {
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
      const newPosition = {
        lat: suggestion.geometry.coordinates[1], // Geoapify returns [lon, lat]
        lng: suggestion.geometry.coordinates[0],
      };
      setSearchQuery(suggestion.properties.formatted);
      setAddress(suggestion.properties.formatted);
      setManualAddress(suggestion.properties.formatted);
      setMarkerPosition(newPosition);
      setShowSuggestions(false);
      setSuggestions([]);
      setShouldZoom(true);
      setAddressLocked(true);
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
      const fetchedAddress = await GeoapifyGeocodingService.reverseGeocode(location.lat, location.lng);
      setAddress(fetchedAddress);
      setManualAddress(fetchedAddress);
      setSearchQuery(fetchedAddress);
      setAddressLocked(true);
      setToastMessage("Address updated from map.");
      setShowToast(true);
    } catch (error: any) {
      console.error("Error on marker drag end:", error);
      setToastMessage("Could not update address from map location.");
      setShowToast(true);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [manualMode]);

  // MODIFIED: Handle location change from map
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
    // ADDED: Validation to ensure address is provided before proceeding
    const finalAddress = manualMode ? manualAddress : address;
    if (!finalAddress || finalAddress.trim() === "") {
      setToastMessage("Please provide a property address before continuing.");
      setShowToast(true);
      return;
    }

    saveCurrentStepToDraft();
    history.push('/amenities');
  };

  const handleBack = () => {
    localStorage.removeItem('Property');
    setToastMessage('Draft cleared');
    setShowToast(true);
    history.push('/propertyType');
  };

  // MODIFIED: Get the display address - show placeholder when empty
  const getDisplayAddress = (): string => {
    if (manualMode) {
      return manualAddress || "Enter your property address manually";
    }
    return address || "Search for your property location or click on the map";
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
                backgroundColor: '#007bff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                1
              </div>
            </IonCol>
            <IonCol>
              <IonText>
                <h2>Location</h2>
              </IonText>
            </IonCol>
          </IonRow>

          {/* Display current draft data if available */}
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="10" size-lg="8">
              {Property && (
                <IonCard color="success" className="ion-margin-bottom">
                  <IonCardContent>
                    <IonText color="dark">
                      <h3>Draft Data Found</h3>
                      <p><strong>Property Type:</strong> {Property.property_type || 'Not specified'}</p>
                      <p><strong>Home Type:</strong> {Property.HomeType || 'Not specified'}</p>
                      <p><strong>Last Updated:</strong> {Property.updated_at ? new Date(Property.updated_at).toLocaleString() : 'Unknown'}</p>
                      <p><strong>Draft Address:</strong> {Property.address || 'Not specified'}</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              )}

              {!Property && (
                <IonCard color="warning" className="ion-margin-bottom">
                  <IonCardContent>
                    <IonText color="dark">
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
                <IonLabel>Enter Address Manually</IonLabel>
                <IonToggle
                  checked={manualMode}
                  onIonChange={toggleManualMode}
                  aria-label="Toggle manual address entry"
                />
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
                        color: (!address && !manualAddress) ? '#666' : 'inherit',
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

          <IonRow className="ion-justify-content-center ion-padding-top">
            <IonCol size-xs="12" size-md="6">
              <IonButton expand="block" onClick={handleNextStep}>
                Continue
              </IonButton>
            </IonCol>
            <IonCol size-xs="12" size-md="6">
              <IonButton expand="block" fill="outline" onClick={handleBack} color="danger">
                Back and Clear Draft
              </IonButton>
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
    </IonPage>
  );
};

export default LocationStepPage;