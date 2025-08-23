import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonButton,
  IonItem,
  IonCard,
  IonCardContent,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonLabel,

} from "@ionic/react";
import { useState, useEffect, useCallback } from "react";
import { useIonRouter } from "@ionic/react";
import { useLocation } from "react-router-dom";
import "./Main.css";
import Stepper from "../components/Stepper";
import ConditionalHeader from "../components/ConditionalHeader";
import { searchOutline } from "ionicons/icons";
import MoneyButton from "../components/MoneyButton";
import LoginPage from "../components/LoginPage";

// Define the structure of an enhanced suggestion
export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}

const Home: React.FC = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768); // Adjust breakpoint as needed

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768); // Adjust breakpoint as needed
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  // Form state

  const [checkIn, setCheckIn] = useState<Date | null>(() => {
    const storedCheckIn = localStorage.getItem("checkInDate");
    return storedCheckIn ? new Date(storedCheckIn) : null;
  });
  const [checkOut, setCheckOut] = useState<Date | null>(() => {
    const storedCheckOut = localStorage.getItem("checkOutDate");
    return storedCheckOut ? new Date(storedCheckOut) : null;
  });
  const [guests, setGuests] = useState(() => {
    const storedGuests = localStorage.getItem("guests");
    return storedGuests || "1";
  });

  // State to determine if search is ready
  const [isSearchReady, setIsSearchReady] = useState(false);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return "";
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }, []);

  const setDateInStorage = useCallback((key: string, date: Date | null) => {
    const storedValue = localStorage.getItem(key);
    const newValue = date ? date.toISOString() : null;

    if (storedValue !== newValue) {
      if (newValue) {
        localStorage.setItem(key, newValue);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, []);

  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [enableGeocoding, setEnableGeocoding] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const [showLoginModal, setShowLoginModal] = useState(false);

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
            // const geoapifyResults =
            //   await GeoapifyGeocodingService.autocompleteAddress(term);
            // console.log("Geoapify results:", geoapifyResults.length);

            // const geoSuggestions: EnhancedSuggestion[] = geoapifyResults
            //   .slice(0, 4)
            //   .map((result) => ({
            //     text: result.properties.formatted,
            //     type: "geocoded" as const,
            //     source: "Geoapify",
            //   }));

            // enrichedSuggestions.push(...geoSuggestions);
            // console.log("Geocoding suggestions found:", geoSuggestions.length);
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
            // const typeComparison = typeOrder[a.type] - typeOrder[b.type];
            // if (typeComparison !== 0) return typeComparison;

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
        guests,
        selectedTab,
        enableGeocoding,
        suggestion,
      });

      // Navigate to search results with all parameters
      ionRouter.push("/homeSearched", "forward", "replace", {
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

  const setGuestsInStorage = useCallback((key: string, guestsValue: string) => {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== guestsValue) {
      localStorage.setItem(key, guestsValue);
    }
  }, []);

  const [isLoggedIn] = useState(false); // New state for login status

  const ionRouter = useIonRouter();
  const location = useLocation();

  // Effect to load state from location.state (priority over local storage)
  useEffect(() => {
    if (location.state) {
      // Assuming state is nested like { state: { ... } }
      const navigationState = location.state as {
        state?: {
          // The actual state object is nested
          checkIn?: Date;
          checkOut?: Date;
          guests?: string;
          searchText?: string;
          suggestion?: unknown;
          userType?: string; // Added for login
          selectedDates?: { checkIn: Date; checkOut: Date }; // Added for datePicker
        };
      };

      // Access the nested state object
      const state = navigationState.state;

      if (state) {
        // Ensure the nested state object exists
        // Handle userType for login
        if (state.userType === "normal") {
          // Potentially update UI or state based on userType
          // For now, we just acknowledge it.
        }

        // Handle selectedDates for datePicker
        if (state.selectedDates?.checkIn) {
          setCheckIn(state.selectedDates.checkIn);
          localStorage.setItem(
            "checkInDate",
            state.selectedDates.checkIn.toISOString()
          );
        }
        // If checkIn is provided but checkOut is not, clear checkOut
        if (state.selectedDates?.checkIn && !state.selectedDates?.checkOut) {
          setCheckOut(null);
          localStorage.removeItem("checkOutDate");
        }
        if (state.selectedDates?.checkOut) {
          setCheckOut(state.selectedDates.checkOut);
          localStorage.setItem(
            "checkOutDate",
            state.selectedDates.checkOut.toISOString()
          );
        }
        // If checkOut is provided but checkIn is not, clear checkIn
        if (state.selectedDates?.checkOut && !state.selectedDates?.checkIn) {
          setCheckIn(null);
          localStorage.removeItem("checkInDate");
        }

        // Handle guests, searchText, suggestion from the nested state
        if (state.guests) {
          setGuests(state.guests);
          localStorage.setItem("guests", state.guests);
        }
        if (state.searchText) {
          console.log(
            "Received search text from suggestions page:",
            state.searchText
          );
          console.log(
            "Received suggestion from suggestions page:",
            state.suggestion
          );
        }
      }
      // Clear state after processing
      // This line might need adjustment if it's clearing too much.
      // For now, keeping it as is from the original code.
      ionRouter.push(location.pathname, "none", "replace");
    }
  }, [location.state, location.pathname, ionRouter]);

  // Effect to update isSearchReady state
  useEffect(() => {
    // Check if checkIn, checkOut, and guests are all valid
    // Guests should be a number greater than 0.
    const guestsNum = parseInt(guests, 10);
    const ready =
      !!checkIn &&
      !!checkOut &&
      guests !== "" &&
      !isNaN(guestsNum) &&
      guestsNum > 0;
    setIsSearchReady(ready);
  }, [checkIn, checkOut, guests]);

  // Effects to save state to local storage only when values actually change
  useEffect(() => {
    setDateInStorage("checkInDate", checkIn);
  }, [checkIn, setDateInStorage]);

  useEffect(() => {
    setDateInStorage("checkOutDate", checkOut);
  }, [checkOut, setDateInStorage]);

  useEffect(() => {
    setGuestsInStorage("guests", guests);
  }, [guests, setGuestsInStorage]);

  const handleDatesSelected = useCallback(
    (dates: { checkIn: Date | null; checkOut: Date | null }) => {
      setCheckIn(dates.checkIn);
      setCheckOut(dates.checkOut);
    },
    []
  );

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
                  onClick={() => ionRouter.push("/landlord", "forward")}
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
                <IonGrid className="ion-padding search-grid">
                  <IonRow className="ion-justify-content-center">
                    <IonCol size-xs="12" size-md="10" size-lg="8">
                      <IonCard className="search-card">
                        <IonCardContent className="search-card-content">
                          {/* Search Button that navigates to SearchSuggestionsPage */}
                          <IonButton
                            expand="block"
                            fill="clear"
                            color="medium"
                            onClick={() =>
                              ionRouter.push("/searchSuggestions", "forward")
                            }
                            className="ion-margin-bottom"
                            style={{
                              height: "48px",
                              fontSize: "1rem",
                              "--border-radius":
                                "var(--custom-border-radius-small)",
                              display: "flex",
                              justifyContent: "flex-start",
                              alignItems: "center",
                              paddingLeft: "16px",
                              paddingRight: "16px",
                              textAlign: "left",
                            }}
                            // Conditionally disable the button if search is not ready
                            disabled={!isSearchReady}
                          >
                            <IonIcon
                              icon={searchOutline}
                              slot="start"
                              style={{ marginRight: "8px" }}
                            />
                            <IonLabel
                              style={{
                                flexGrow: 1,
                                color: "var(--ion-color-medium)",
                              }}
                            >
                              Where are you going?
                            </IonLabel>
                          </IonButton>

                          {/* Date and Guest Inputs */}
                          <div className="date-guest-row">
                            {/* Date Picker Button */}
                            <IonButton
                              expand="block"
                              onClick={() => {
                                // Always navigate to calendarMobile
                                ionRouter.push("/calendarMobile", "forward", "replace", {
                                  state: { onDatesSelect: handleDatesSelected },
                                });
                              }}
                              fill={checkIn && checkOut ? "outline" : "clear"}
                              className="date-guest-item pick-dates-button"
                            >
                              {checkIn && checkOut
                                ? `${formatDate(checkIn)} - ${formatDate(
                                    checkOut
                                  )}`
                                : "Check-in / Check-out"}
                            </IonButton>

                            {/* Stepper for Guests */}
                            <div className="date-guest-item guest-stepper-container">
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
                            </div>
                          </div>

                          {/* Search Summary */}
                          {(checkIn || checkOut || guests) && (
                            <div
                              style={{
                                textAlign: "center",
                                marginTop: "15px",
                                padding: "10px",
                                backgroundColor:
                                  "var(--ion-color-secondary-tint)",
                                borderRadius:
                                  "var(--custom-border-radius-small)",
                                fontSize: "14px",
                                color:
                                  "var(--ion-color-secondary-contrast)",
                              }}
                            >
                              {checkIn && checkOut && (
                                <span>
                                  from{" "}
                                  <strong>{formatDate(checkIn)}</strong> to{" "}
                                  <strong>{formatDate(checkOut)}</strong>
                                </span>
                              )}
                              {guests && (
                                <>
                                  <span style={{ whiteSpace: "nowrap" }}>
                                    {checkIn && checkOut ? " , " : ""}
                                    <strong>{guests}</strong> guest
                                    {parseInt(guests) > 1 ? "s" : ""}
                                  </span>
                                </>
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
                  <h3 style={{ color: "var(--ion-color-primary)" }}>
                    Recommended
                  </h3>
                  <p
                    style={{
                      color: "var(--ion-color-medium)",
                      fontSize: "14px",
                    }}
                  >
                    Find great places to stay for your next trip!
                  </p>
                </div>
              </div>
            </IonContent>
          </>
          {/* Render LoginPage as an overlay */}
          <LoginPage
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            userType="normal"
          />
          <MoneyButton/>
        </IonPage>
      )}



export default Home;
