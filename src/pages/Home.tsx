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
  IonMenuButton,
} from "@ionic/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";
import supabase from "../../supabaseConfig";
import { mapOutline, settingsOutline } from "ionicons/icons";
import SearchbarWithSuggestions from "../components/SearchbarWithSuggestions";
import "./Main.css";
import { RentalAmenities, Property } from "../components/DbCrud";
import Stepper from "../components/Stepper";

import LoginPage from "../components/LoginPage";
import { GeoapifyGeocodingService } from "../services/GeoapifyService";
import ConditionalHeader from "../components/ConditionalHeader";

// Enhanced suggestion interface - MUST match SearchbarWithSuggestions component
interface EnhancedSuggestion {
  text: string;
  type: "database" | "geocoded" | "recent";
  source?: string;
  property_type?: string | null;
  HomeType?: string | null;
}

const Home: React.FC = () => {
  // Form state
  const [searchText, setSearchText] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [selectedTab, setSelectedTab] = useState("day-use");

  // Enhanced search state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [enableGeocoding, setEnableGeocoding] = useState<boolean>(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedPage, setSelectedPage] = useState("home");

  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status
  const [showLoginModal, setShowLoginModal] = useState(false); // State to control login modal visibility

  const history = useHistory();

  // Get table structure to know available columns
  const getTableStructure = async () => {
    try {
      // Updated to use the correct table name
      const { data, error } = await supabase
        .from("properties") // Changed from 'Property' to 'properties'
        .select("*")
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setTableColumns(columns);
        console.log("Available columns:", columns);
      }
    } catch (err: any) {
      console.error("Error getting table structure:", err);
    }
  };

  // FIXED: Enhanced suggestion fetching with proper return type
  const fetchEnhancedSuggestions = useCallback(
    async (term: string): Promise<EnhancedSuggestion[]> => {
      console.log("fetchEnhancedSuggestions called with term:", term);

      if (!term || term.length < 2) {
        console.log("Term too short, returning empty array");
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
            type: "recent" as const,
            source: "Recent Search",
          }));

        enrichedSuggestions.push(...matchingRecent);

        // Fetch database suggestions from multiple possible tables
        try {
          console.log("Fetching database suggestions...");

          // Try properties table first
          const { data: propertiesData, error: propertiesError } =
            await supabase
              .from("properties")
              .select("address, building_name, property_type, HomeType")
              .limit(50);

          if (!propertiesError && propertiesData && propertiesData.length > 0) {
            console.log(
              "Properties data found:",
              propertiesData.length,
              "items"
            );

            propertiesData.forEach((item) => {
              // Check address field
              if (item.address && typeof item.address === "string") {
                const value = item.address.toLowerCase();
                if (value.includes(term.toLowerCase())) {
                  enrichedSuggestions.push({
                    text: item.address,
                    type: "database",
                    source: "Properties Database",
                    property_type: item.property_type,
                    HomeType: item.HomeType,
                  });
                }
              }

              // Check building_name field
              if (
                item.building_name &&
                typeof item.building_name === "string"
              ) {
                const value = item.building_name.toLowerCase();
                if (
                  value.includes(term.toLowerCase()) &&
                  item.building_name !== item.address
                ) {
                  enrichedSuggestions.push({
                    text: item.building_name,
                    type: "database",
                    source: "Properties Database",
                    property_type: item.property_type,
                    HomeType: item.HomeType,
                  });
                }
              }
            });
          }

          // Try address table as fallback
          if (
            enrichedSuggestions.filter((s) => s.type === "database").length ===
            0
          ) {
            console.log("Trying address table...");
            const { data: addressData, error: addressError } = await supabase
              .from("address")
              .select("*")
              .limit(50);

            if (!addressError && addressData && addressData.length > 0) {
              console.log("Address data found:", addressData.length, "items");

              addressData.forEach((item) => {
                const possibleFields = [
                  "street_address",
                  "address",
                  "full_address",
                  "unit_number",
                  "unit",
                  "building_name",
                  "building",
                  "property_name",
                  "city",
                  "town",
                  "area",
                  "state",
                  "province",
                ];

                possibleFields.forEach((field) => {
                  if (item[field] && typeof item[field] === "string") {
                    const value = item[field].toString().toLowerCase();
                    const searchTerm = term.toLowerCase();
                    if (value.includes(searchTerm)) {
                      enrichedSuggestions.push({
                        text: item[field],
                        type: "database",
                        source: "Address Database",
                      });
                    }
                  }
                });
              });
            }
          }

          console.log(
            "Database suggestions found:",
            enrichedSuggestions.filter((s) => s.type === "database").length
          );
        } catch (dbError) {
          console.error("Database suggestions error:", dbError);
        }

        // Get Geoapify suggestions if enabled
        if (enableGeocoding && term.length >= 3) {
          try {
            console.log("Fetching geocoding suggestions...");
            const geoapifyResults =
              await GeoapifyGeocodingService.autocompleteAddress(term);
            console.log("Geoapify results:", geoapifyResults.length);

            const geoSuggestions: EnhancedSuggestion[] = geoapifyResults
              .slice(0, 4)
              .map((result) => ({
                text: result.properties.formatted,
                type: "geocoded" as const,
                source: "Geoapify",
              }));

            enrichedSuggestions.push(...geoSuggestions);
            console.log("Geocoding suggestions found:", geoSuggestions.length);
          } catch (error) {
            console.error("Error fetching Geoapify suggestions:", error);
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

        // Sort suggestions with better logic
        const sortedSuggestions = uniqueSuggestions
          .sort((a, b) => {
            const termLower = term.toLowerCase();
            const aTextLower = a.text.toLowerCase();
            const bTextLower = b.text.toLowerCase();

            // Recent searches first
            if (a.type === "recent" && b.type !== "recent") return -1;
            if (a.type !== "recent" && b.type === "recent") return 1;

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

        console.log("Final sorted suggestions:", sortedSuggestions);
        return sortedSuggestions;
      } catch (err: any) {
        console.error("Error in fetchEnhancedSuggestions:", err);
        return [];
      }
    },
    [enableGeocoding, recentSearches]
  );

  // Enhanced search handler with validation
  const handleSearch = async (
    term?: string,
    suggestion?: EnhancedSuggestion
  ) => {
    const searchTerm = term || searchText;

    if (!searchTerm.trim()) {
      setError("Please enter a search term");
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
        setError("Check-in date cannot be in the past");
        setShowAlert(true);
        return;
      }

      if (checkOutDate <= checkInDate) {
        setError("Check-out date must be after check-in date");
        setShowAlert(true);
        return;
      }
    }

    // Validate guests
    if (guests && (parseInt(guests) < 1 || parseInt(guests) > 20)) {
      setError("Number of guests must be between 1 and 20");
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      // Add to recent searches
      const updatedRecent = [
        searchTerm,
        ...recentSearches.filter((s) => s !== searchTerm),
      ].slice(0, 5);
      setRecentSearches(updatedRecent);

      console.log("Navigating to search results with:", {
        searchText: searchTerm,
        checkIn,
        checkOut,
        guests,
        selectedTab,
        enableGeocoding,
        suggestion,
      });

      // Navigate to search results with all parameters
      history.push({
        pathname: "/homeSearched",
        state: {
          searchText: searchTerm,
          checkIn,
          checkOut,
          guests,
          selectedTab,
          enableGeocoding,
          suggestion,
        },
      });
    } catch (err: any) {
      setError("Failed to perform search. Please try again.");
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  // Initialize component
  useEffect(() => {
    getTableStructure();
  }, []);

  return (
    <IonPage id="main-content">
      <>
        {/* Always render the main content */}
        
        <ConditionalHeader color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
              <img src="/webLogo.svg" alt="Logo" className="header-logo" />
            </IonButtons>
            <IonItem
              slot="end"
              color="primary"
              lines="none"
              className="ion-no-padding"
            >
              <IonButton
                onClick={() => history.push("/landlord")}
                fill="clear"
                color="light"
              >
                List Your Place
              </IonButton>
              {isLoggedIn && (
                <img
                  id="profile"
                  src=""
                  alt="Profile"
                  className="header-profile-img"
                />
              )}
              <span className="currency ion-margin-end">RM</span>
              {/* Add a login button */}
              <IonButton
                onClick={() => setShowLoginModal(true)}
                fill="clear"
                color="light"
              >
                Login
              </IonButton>
            </IonItem>
        </ConditionalHeader>

        <IonContent fullscreen>
          <div
            style={{
              background: "var(--ion-color-background)",
              color: "var(--ion-color-text)",
              minHeight: "100%",
            }}
          >
            

            {/* Search Section */}
            <IonGrid className="ion-padding">
              <IonRow className="ion-justify-content-center">
                <IonCol size-xs="12" size-md="10" size-lg="8">
                  <IonCard className="search-card">
                    <IonCardContent>
                      <div className="ion-text-center ion-margin-bottom ion-color-primary-shade">
                        <h2>Find Your Next Stay</h2>
                      </div>

                      {/* Tab Segment */}
                      {/* Tab Segment */}
                      <IonSegment
                        value={selectedTab}
                        onIonChange={(e) =>
                          setSelectedTab(e.detail.value as string)
                        }
                        className="search-segment"
                      >
                        <IonSegmentButton
                          value="day-use"
                          color={
                            selectedTab === "day-use" ? "primary" : undefined
                          }
                        >
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
                            <IonItem className="date-guest-item">
                              <IonLabel position="stacked">
                                Check-in Date
                              </IonLabel>
                              <IonInput
                                type="date"
                                value={checkIn}
                                onIonInput={(e) => setCheckIn(e.detail.value!)}
                                min={new Date().toISOString().split("T")[0]}
                              />
                            </IonItem>
                          </IonCol>
                          <IonCol size-xs="12" size-sm="4">
                            <IonItem className="date-guest-item">
                              <IonLabel position="stacked">
                                Check-out Date
                              </IonLabel>
                              <IonInput
                                type="date"
                                value={checkOut}
                                onIonInput={(e) => setCheckOut(e.detail.value!)}
                                min={
                                  checkIn ||
                                  new Date().toISOString().split("T")[0]
                                }
                              />
                            </IonItem>
                          </IonCol>
                          <IonCol size-xs="12" size-sm="4">
                            <IonItem className="date-guest-item">
                              <Stepper
                                label="Guests"
                                value={parseInt(guests)}
                                onIncrement={() =>
                                  setGuests(String(parseInt(guests) + 1))
                                }
                                onDecrement={() =>
                                  setGuests(String(parseInt(guests) - 1))
                                }
                                min={1}
                                max={20}
                              />
                            </IonItem>
                          </IonCol>
                        </IonRow>
                      </IonGrid>

                      {/* Search Button */}
                      

                      {/* Search Summary */}
                      {(checkIn || checkOut || guests) && (
                        <div
                          style={{
                            textAlign: "center",
                            marginTop: "15px",
                            padding: "10px",
                            backgroundColor: "var(--ion-color-secondary-tint)",
                            borderRadius: "var(--custom-border-radius-small)",
                            fontSize: "14px",
                            color: "var(--ion-color-secondary-contrast)",
                          }}
                        >
                          {checkIn && checkOut && (
                            <span>
                              {checkIn} to {checkOut}
                            </span>
                          )}
                          {guests && (
                            <span>
                              {checkIn || checkOut ? " • " : ""}
                              {guests} guest{parseInt(guests) > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Recommended Section */}
            <div style={{ padding: "20px", textAlign: "center" }}>
              <h3 style={{ color: "var(--ion-color-primary)" }}>Recommended</h3>
              <p style={{ color: "var(--ion-color-medium)", fontSize: "14px" }}>
                {enableGeocoding
                  ? "Enhanced search with Geoapify integration active"
                  : "Database-only search mode"}
              </p>
            </div>

            {/* Error Alert */}
            <IonAlert
              isOpen={showAlert}
              onDidDismiss={() => setShowAlert(false)}
              header="Search Error"
              message={error || "An unknown error occurred"}
              buttons={[
                {
                  text: "OK",
                  handler: () => setShowAlert(false),
                },
              ]}
              cssClass="custom-alert"
            />
          </div>
        </IonContent>
      </>
      {/* Render LoginPage as an overlay */}
      <LoginPage
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        userType="normal"
      />
    </IonPage>
  );
};

export default Home;
