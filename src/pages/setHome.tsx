import React, { useState, useCallback, useEffect, useMemo, Suspense } from "react";
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
} from "@ionic/react";
import {
  locationOutline,
  saveOutline,
  searchOutline,
  cloudUploadOutline,
} from "ionicons/icons";
// Importing the pre-configured supabase client from the local file
import supabase from '../../supabaseConfig'; 

// Types
interface LatLng {
  lat: number;
  lng: number;
}

interface PropertyData {
  location?: LatLng;
  address?: string;
  searchQuery?: string;
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

// Property type conversion mappings
const PROPERTY_TYPE_MAPPING = {
  'Home': 'home',
  'Hotel': 'hotel',
  'Unique': 'unique'
} as const;

const HOME_TYPE_MAPPING = {
  'Homestay': 'homestay',
  'Entire House': 'entire_house',
  'Bungalow': 'bungalow'
} as const;

// Conversion functions
const convertPropertyTypeForDB = (displayType: string): string => {
  return PROPERTY_TYPE_MAPPING[displayType as keyof typeof PROPERTY_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};

const convertHomeTypeForDB = (displayType: string): string => {
  return HOME_TYPE_MAPPING[displayType as keyof typeof HOME_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};


// Interface for localStorage rental draft data

export interface RentalAmenities {
  wifi_included?: boolean;
  air_conditioning?: boolean;
  in_unit_laundry?: boolean;
  dishwasher?: boolean;
  balcony_patio?: boolean;
  pet_friendly?: {
    dogs_allowed?: boolean;
    cats_allowed?: boolean;
  };
  parking?: {
    type?: 'garage' | 'carport' | 'off_street' | 'street';
    spots?: number;
  };
  community_pool?: boolean;
  fitness_center?: boolean;
  [key: string]: any; // Allows for additional, less structured properties
}

export interface RentalDraft{
  id: string;
  building_name: string | null;
  address: string;
  property_type: string | null;
  house_rules: string | null;
  max_guests: number | null;
  instant_booking: boolean | null;
  is_active: boolean | null;
  amenities: RentalAmenities | null; // Changed from any | null to RentalAmenities | null
  created_at: string;
  updated_at: string | null;
  HomeType: string | null;
}

// Function to convert draft data for database insertion
const prepareDraftForDB = (draft: any) => {
  const converted = { ...draft };
  
  // Convert property type
  if (draft.propertyTypeCategory) {
    converted.propertyTypeDB = convertPropertyTypeForDB(draft.propertyTypeCategory);
  }
  
  // Convert home type
  if (draft.HomeTypesCategory) {
    converted.homeTypeDB = convertHomeTypeForDB(draft.HomeTypesCategory);
  }
  
  return converted;
};

// --- Lazy Map Component ---
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

// --- Geocoding Service using Nominatim ---
class GeoCodingService {
  private static readonly NOMINATIM_BASE_URL =
    "https://nominatim.openstreetmap.org";
  private static readonly GEOCODING_DELAY = 1000;
  private static lastRequestTime = 0;

  static async geocodeAddress(address: string): Promise<NominatimResult[]> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.GEOCODING_DELAY) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.GEOCODING_DELAY - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();

    try {
      const params = new URLSearchParams({
        q: address,
        format: "json",
        addressdetails: "1",
        limit: "8",
        countrycodes: "my,sg,th,id,ph,vn",
        "accept-language": "en",
      });

      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/search?${params}`,
        {
          headers: {
            "User-Agent": "PropertyLocationApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NominatimResult[] = await response.json();
      return data.sort((a, b) => (b.importance || 0) - (a.importance || 0));
    } catch (error) {
      console.error("Geocoding error:", error);
      return [];
    }
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: "json",
        addressdetails: "1",
        "accept-language": "en",
      });

      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/reverse?${params}`,
        {
          headers: {
            "User-Agent": "PropertyLocationApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || "Address not found";
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return "Address not found";
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
const MapTestPage: React.FC = () => {
  const [data, setData] = useState<PropertyData>({
    location: { lat: 2.4312, lng: 103.8403 }, // Default to Malaysia
    address: "",
    searchQuery: "",
  });
  
  const [markerPosition, setMarkerPosition] = useState<LatLng>(
    data.location || { lat: 2.4312, lng: 103.8403 }
  );
  const [searchQuery, setSearchQuery] = useState(data.searchQuery || "");
  const [address, setAddress] = useState<string>(data.address || "");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldZoom, setShouldZoom] = useState(false);
  const [manualAddress, setManualAddress] = useState<string>(data.address || "");
  const [manualMode, setManualMode] = useState(false);
  
  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // LocalStorage draft data
  const [rentalDraft, setRentalDraft] = useState<RentalDraft | null>(null);

  const searchTimeoutRef = React.useRef<NodeJS.Timeout>();

  const mapConfig = {
    mapZoom: 14,
    mapTileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    mapAttribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  };

  // Load localStorage data on component mount
  useEffect(() => {
    const loadDraftData = () => {
      try {
        const saved = localStorage.getItem('rentalDraft');
        if (saved) {
          const draft = JSON.parse(saved);
          setRentalDraft(draft);
          console.log("Loaded rental draft:", draft);
          
          // Debug property type conversions
          if (draft.propertyTypeCategory) {
            const convertedPropertyType = convertPropertyTypeForDB(draft.propertyTypeCategory);
            console.log(`Property Type: ${draft.propertyTypeCategory} → ${convertedPropertyType}`);
          }
          
          if (draft.HomeTypesCategory) {
            const convertedHomeType = convertHomeTypeForDB(draft.HomeTypesCategory);
            console.log(`Home Type: ${draft.HomeTypesCategory} → ${convertedHomeType}`);
          }
        }
      } catch (error) {
        console.error("Error loading rental draft:", error);
        setRentalDraft(null);
      }
    };

    loadDraftData();
  }, []);

  // Update data when location or address changes
  const onUpdate = useCallback((updatedData: Partial<PropertyData>) => {
    setData(prev => ({ ...prev, ...updatedData }));
  }, []);

  // Sync searchQuery to address when not in manual mode
  useEffect(() => {
    if (!manualMode && !showSuggestions && searchQuery !== address) {
      setAddress(searchQuery);
      onUpdate({ address: searchQuery });
    }
  }, [searchQuery, manualMode, showSuggestions, address, onUpdate]);

  // Update address when marker position changes
  useEffect(() => {
    if (!manualMode) {
      const fetchAddress = async () => {
        try {
          const addressText = await GeoCodingService.reverseGeocode(
            markerPosition.lat,
            markerPosition.lng
          );
          setAddress(addressText);
          setManualAddress(addressText);
          setSearchQuery(addressText);
          onUpdate({
            location: markerPosition,
            address: addressText,
            searchQuery: addressText,
          });
        } catch (error) {
          console.error("Error fetching address:", error);
          setAddress("Address not found");
          setSearchQuery("Address not found");
        }
      };
      fetchAddress();
    }
  }, [markerPosition, onUpdate, manualMode]);

  // Debounced search handler
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await GeoCodingService.geocodeAddress(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input
  const handleSearchInput = useCallback(
    (e: CustomEvent) => {
      const value = e.detail.value! || "";
      setSearchQuery(value);
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
    (suggestion: NominatimResult) => {
      const newPosition = {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon),
      };
      setSearchQuery(suggestion.display_name);
      setAddress(suggestion.display_name);
      setManualAddress(suggestion.display_name);
      setMarkerPosition(newPosition);
      setShowSuggestions(false);
      setSuggestions([]);
      setShouldZoom(true);
      onUpdate({
        location: newPosition,
        address: suggestion.display_name,
        searchQuery: suggestion.display_name,
      });
    },
    [onUpdate]
  );

  // Handle location change from map
  const handleLocationChange = useCallback((location: LatLng) => {
    setMarkerPosition(location);
    setShouldZoom(false);
  }, []);

  // Clear suggestions when search query is cleared
  const handleSearchClear = useCallback(() => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  // Toggle manual mode
  const toggleManualMode = useCallback(() => {
    setManualMode((m) => {
      const newMode = !m;
      if (newMode) {
        setManualAddress(address);
      } else {
        setAddress(manualAddress);
        setSearchQuery(manualAddress);
        onUpdate({ address: manualAddress, searchQuery: manualAddress });
        if (manualAddress) {
          GeoCodingService.geocodeAddress(manualAddress).then(results => {
            if (results.length > 0) {
              const firstResult = results[0];
              const newPosition = {
                lat: parseFloat(firstResult.lat),
                lng: parseFloat(firstResult.lon),
              };
              setMarkerPosition(newPosition);
              setShouldZoom(true);
              onUpdate({ location: newPosition });
            }
          }).catch(err => console.error("Geocoding manual address error:", err));
        }
      }
      return newMode;
    });
  }, [address, manualAddress, onUpdate]);

  // Test database insertion with localStorage data
  const handleTestPublish = async () => {
    setIsSubmitting(true);
    try {
      // Get the current rental draft from localStorage
      const currentDraft = localStorage.getItem('rentalDraft');
      let draftData: RentalDraft = {};
      
      if (currentDraft) {
        try {
          draftData = JSON.parse(currentDraft);
        } catch (parseError) {
          console.error("Error parsing rental draft:", parseError);
        }
      }

      // Convert the draft data for database insertion
      const convertedDraft = prepareDraftForDB(draftData);
      
      // Log the converted values for debugging
      console.log("Original draft data:", draftData);
      console.log("Converted draft data:", convertedDraft);
      console.log("Property Type for DB:", convertedDraft.propertyTypeDB);
      console.log("Home Type for DB:", convertedDraft.homeTypeDB);

      // Create variables to store database-ready values
      const propertyTypeDB = convertedDraft.propertyTypeDB || "home";
      const homeTypeDB = convertedDraft.homeTypeDB || "homestay";

      // Combine localStorage data with current location/address data
      // REMOVED 'description' field that was causing the error
      const propertyData = {
        building_name: draftData.propertyName || "Property from Draft",
        address: address || "No address specified",
        property_type: propertyTypeDB, // Using converted variable
        house_rules: draftData.houseRules || "Standard house rules apply",
        max_guests: draftData.maxGuests || 2,
        instant_booking: draftData.instantBooking ?? true,
        is_active: true,
        amenities: draftData.amenities || {
          wifi_included: true,
          air_conditioning: false,
          in_unit_laundry: false,
          dishwasher: false,
          balcony_patio: false,
          pet_friendly: {
            dogs_allowed: false,
            cats_allowed: false,
          },
          parking: {
            type: "street",
            spots: 0
          },
          community_pool: false,
          fitness_center: false,
        },
        HomeType: homeTypeDB, // Using converted variable
        // REMOVED description field - it doesn't exist in the properties table
      };



      console.log("Final property data for database:", propertyData);
      console.log("Database values - Property Type:", propertyTypeDB, "Home Type:", homeTypeDB);

      const { data: insertedData, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select();

      if (error) {
        throw error;
      }

      // Success - clear the draft and show success message
      localStorage.removeItem('rentalDraft');
      setRentalDraft(null);
      
      setToastMessage(`Successfully published property! ID: ${insertedData[0]?.id} | Type: ${propertyTypeDB} | Home: ${homeTypeDB}`);
      setShowToast(true);
      console.log("Successfully inserted property:", insertedData);
      
    } catch (error) {
      console.error("Database insertion error:", error);
      setToastMessage(`Error publishing property: ${error.message}`);
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Test database insertion (original functionality)
  const handleTestInsert = async () => {
    setIsSubmitting(true);
    try {
      const testProperty = {
        building_name: "Test Property",
        address: address || "Test Address",
        property_type: "apartment",
        house_rules: "No smoking",
        max_guests: 4,
        check_in_time: "15:00",
        check_out_time: "11:00",
        instant_booking: true,
        is_active: true,
        amenities: {
          wifi_included: true,
          air_conditioning: true,
          in_unit_laundry: false,
          dishwasher: false,
          balcony_patio: false,
          pet_friendly: {
            dogs_allowed: false,
            cats_allowed: false,
          },
          parking: {
            type: "garage",
            spots: 1
          },
          community_pool: false,
          fitness_center: false,
        },
        HomeType: "apartment"
      };

      const { data: insertedData, error } = await supabase
        .from('properties')
        .insert([testProperty])
        .select();

      if (error) {
        throw error;
      }

      setToastMessage(`Successfully inserted test property with ID: ${insertedData[0]?.id}`);
      setShowToast(true);
      console.log("Inserted test property:", insertedData);
      
    } catch (error) {
      console.error("Database insertion error:", error);
      setToastMessage(`Error inserting property: ${error.message}`);
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Property Location & Publish</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonText>
          <h2>Property Location</h2>
          <p>Select a location and publish your property from draft data</p>
        </IonText>

        {/* Display current draft data if available */}
        {rentalDraft && (
          <IonCard color="success" className="ion-margin-bottom">
            <IonCardContent>
              <IonText color="dark">
                <h3>Draft Data Found</h3>
                <p><strong>Property Type:</strong> {rentalDraft.propertyTypeCategory || 'Not specified'}</p>
                <p><strong>Home Type:</strong> {rentalDraft.HomeTypesCategory || 'Not specified'}</p>
                <p><strong>Last Updated:</strong> {rentalDraft.lastUpdated ? new Date(rentalDraft.lastUpdated).toLocaleString() : 'Unknown'}</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {!rentalDraft && (
          <IonCard color="warning" className="ion-margin-bottom">
            <IonCardContent>
              <IonText color="dark">
                <p><strong>No draft data found in localStorage.</strong> The test publish will use default values.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* Search Bar with Suggestions */}
        <div style={{ position: "relative" }}>
          <IonSearchbar
            placeholder="Search for your property location"
            onIonInput={handleSearchInput}
            onIonClear={handleSearchClear}
            showClearButton="focus"
          />

          {/* Loading indicator */}
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
          {showSuggestions && suggestions.length > 0 && (
            <IonCard
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 1000,
                maxHeight: "300px",
                overflowY: "auto",
                margin: 0,
              }}
            >
              {suggestions.map((suggestion) => (
                <IonItem
                  key={suggestion.place_id}
                  button
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <IonIcon icon={searchOutline} slot="start" color="medium" />
                  <IonLabel>
                    <h3>{suggestion.display_name}</h3>
                    {suggestion.address && (
                      <p>
                        {[
                          suggestion.address.road,
                          suggestion.address.city,
                          suggestion.address.state,
                          suggestion.address.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </IonLabel>
                </IonItem>
              ))}
            </IonCard>
          )}
        </div>

        <IonItem lines="none" className="ion-no-padding">
          <IonLabel>
            <IonText color="medium">
              <p>Can't find the exact location?</p>
            </IonText>
            <IonButton fill="clear" size="small" onClick={toggleManualMode}>
              {manualMode ? "Use Map" : "Enter it manually"}
            </IonButton>
          </IonLabel>
        </IonItem>

        {/* Manual address input */}
        {manualMode && (
          <IonCard color="light">
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Manual Address</IonLabel>
                <IonInput
                  value={manualAddress}
                  placeholder="Type your address manually"
                  onIonInput={(e) => {
                    setManualAddress(e.detail.value!);
                    setAddress(e.detail.value!);
                    onUpdate({ address: e.detail.value! });
                  }}
                />
              </IonItem>
              <IonText color="medium">
                <p>
                  This address will be used for your listing. You can switch back to map mode anytime.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {!manualMode && (
          <div style={{ height: "400px", width: "100%", marginTop: "16px" }}>
            <Suspense fallback={<MapSkeleton />}>
              <LazyMapComponent
                position={markerPosition}
                onLocationChange={handleLocationChange}
                config={mapConfig}
                shouldZoom={shouldZoom}
              />
            </Suspense>
          </div>
        )}

        {/* Display selected address/location */}
        <IonCard className="ion-margin-top">
          <IonCardContent>
            <IonItem lines="none">
              <IonIcon icon={locationOutline} slot="start" color="primary" />
              <IonLabel>
                <h3 className="ion-text-wrap">
                  {manualMode ? manualAddress || "No manual address entered" : address || "Select location on map or search"}
                </h3>
                {data.location && (
                  <p>
                    Coordinates: {data.location.lat.toFixed(6)}, {data.location.lng.toFixed(6)}
                  </p>
                )}
              </IonLabel>
            </IonItem>
          </IonCardContent>
        </IonCard>

        {/* Action Buttons */}
        <div className="ion-margin-top">
          {/* Test Publish Button - Uses localStorage data */}
          <IonButton 
            expand="block" 
            onClick={handleTestPublish} 
            disabled={isSubmitting}
            color="success"
            className="ion-margin-bottom"
          >
            {isSubmitting ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon icon={cloudUploadOutline} slot="start" />
                Test Publish (from Draft)
              </>
            )}
          </IonButton>

          {/* Original Test Insert Button */}
          <IonButton 
            expand="block" 
            onClick={handleTestInsert} 
            disabled={isSubmitting}
            fill="outline"
          >
            {isSubmitting ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon icon={saveOutline} slot="start" />
                Test Insert (Sample Data)
              </>
            )}
          </IonButton>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={4000}
        />
      </IonContent>
    </IonPage>
  );
};

export default MapTestPage;
