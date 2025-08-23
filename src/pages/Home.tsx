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
   useIonRouter
} from "@ionic/react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from '../supabaseClient';
import { useLocation } from "react-router-dom";
import "./Main.css";
import Stepper from "../components/Stepper";
import ConditionalHeader from "../components/ConditionalHeader";
import { searchOutline, personCircleOutline } from "ionicons/icons";
import MoneyButton from "../components/MoneyButton";

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

  const setGuestsInStorage = useCallback((key: string, guestsValue: string) => {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== guestsValue) {
      localStorage.setItem(key, guestsValue);
    }
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);

  // Check auth session on mount and on auth state change
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setIsLoggedIn(true);
        // Fetch profile avatar and full_name
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', session.user.id)
          .maybeSingle();
        
        setProfileAvatar(profile?.avatar_url || null);

        if (profile?.full_name) {
          const names = profile.full_name.split(' ').filter((n: string) => n.length > 0);
          setUserDisplayName(names.slice(0, 2).join(' '));
        } else {
          setUserDisplayName(null);
        }
      } else {
        setIsLoggedIn(false);
        setProfileAvatar(null);
        setUserDisplayName(null);
      }
    };
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => subscription.unsubscribe();
  }, []);

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
            <img src="/webLogo.svg" alt="Logo" className="header-logo" style={{ paddingLeft: 24 }} />
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
              style={{ paddingRight: 24 }}
            >
              List Your Place
            </IonButton>

            <span className="currency ion-margin-end">RM</span>
            
            {isLoggedIn ? (
              <>
                <IonButton
                  onClick={() => ionRouter.push("/profile", "forward")}
                  fill="clear"
                  color="light"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {profileAvatar ? (
                    <img
                      id="profile"
                      src={profileAvatar}
                      alt="Profile"
                      className="header-profile-img"
                      style={{ width: 32, height: 32, borderRadius: '50%' }}
                    />
                  ) : (
                    <IonIcon icon={personCircleOutline} style={{ fontSize: 28 }} />
                  )}
                  {userDisplayName && <IonLabel>{userDisplayName}</IonLabel>}
                </IonButton>
              </>
            ) : (
              <IonButton
                onClick={() => ionRouter.push("/login", "forward")}
                fill="clear"
                color="light"
              >
                Sign In
              </IonButton>
            )}
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
                        onClick={() => {
                          ionRouter.push("/homeSearched", "forward");
                        }}
                        className="ion-margin-bottom"
                        style={{
                          height: "48px",
                          fontSize: "1rem",
                          "--border-radius":
                            "var(--custom-border-radius-small)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          paddingLeft: "16px",
                          paddingRight: "16px",
                          textAlign: "center",
                          width: '100%'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          <IonIcon
                            icon={searchOutline}
                            style={{ marginRight: "8px" }}
                          />
                          <IonLabel
                            style={{
                              color: "var(--ion-color-medium)",
                              margin: 0,
                              cursor: 'pointer',
                              userSelect: 'none',
                              fontWeight: 500,
                            }}
                          >
                            Where are you going?
                          </IonLabel>
                        </span>
                      </IonButton>

                      {/* Date and Guest Inputs */}
                      <div className="date-guest-row">
                        {/* Date Picker Button */}
                        <IonButton
                          expand="block"
                          onClick={() => {
                            // Always navigate to calendarMobile
                            ionRouter.push(
                              "/calendarMobile",
                              "forward",
                              "replace",
                              {
                                state: { onDatesSelect: handleDatesSelected },
                              }
                            );
                          }}
                          fill={checkIn && checkOut ? "outline" : "clear"}
                          className="date-guest-item pick-dates-button"
                        >
                          {checkIn && checkOut
                            ? `${formatDate(checkIn)} - ${formatDate(checkOut)}`
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
                            backgroundColor: "var(--ion-color-secondary-tint)",
                            borderRadius: "var(--custom-border-radius-small)",
                            fontSize: "14px",
                            color: "var(--ion-color-secondary-contrast)",
                          }}
                        >
                          {checkIn && checkOut && (
                            <span>
                              from <strong>{formatDate(checkIn)}</strong> to{" "}
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
              <h3 style={{ color: "var(--ion-color-primary)" }}>Explore Top Rentals</h3>
              <p
                style={{
                  color: "var(--ion-color-medium)",
                  fontSize: "14px",
                }}
              >
                Discover the best places to stay, handpicked for you!
              </p>
            </div>
          </div>
        </IonContent>
      </>
      <MoneyButton />
    </IonPage>
  );
};

export default Home;
