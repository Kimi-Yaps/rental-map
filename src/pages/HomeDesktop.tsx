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

interface EnhancedSuggestion {
  text: string;
  type: "database" | "geocoded" | "recent";
  source?: string;
  property_type?: string | null;
  HomeType?: string | null;
}

interface HomeDesktopProps {
  searchText: string;
  setSearchText: (text: string) => void;
  fetchEnhancedSuggestions: (term: string) => Promise<EnhancedSuggestion[]>;
  handleSearch: (term?: string, suggestion?: EnhancedSuggestion) => void;
  checkIn: string;
  setCheckIn: (date: string) => void;
  checkOut: string;
  setCheckOut: (date: string) => void;
  guests: string;
  setGuests: (num: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  enableGeocoding: boolean;
  isLoggedIn: boolean;
  setShowLoginModal: (show: boolean) => void;
  history: ReturnType<typeof useHistory>;
  error: string | null;
  showAlert: boolean;
  setShowAlert: (show: boolean) => void;
}

const HomeDesktop: React.FC<HomeDesktopProps> = ({
  searchText,
  setSearchText,
  fetchEnhancedSuggestions,
  handleSearch,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  guests,
  setGuests,
  selectedTab,
  setSelectedTab,
  enableGeocoding,
  isLoggedIn,
  setShowLoginModal,
  history,
  error,
  showAlert,
  setShowAlert,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  return (
    <IonPage id="main-content">
      <>
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
            <IonGrid className="ion-padding">
              <IonRow className="ion-justify-content-center">
                <IonCol size-xs="12" size-md="10" size-lg="8">
                  <IonCard className="search-card">
                    <IonCardContent>
                      <div className="ion-text-center ion-margin-bottom ion-color-primary-shade">
                        <h2>Find Your Next Stay</h2>
                      </div>

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

                      <SearchbarWithSuggestions
                        value={searchText}
                        setValue={setSearchText}
                        fetchSuggestions={fetchEnhancedSuggestions}
                        placeholder="Search your destination or property"
                        enableGeocoding={enableGeocoding}
                        maxSuggestions={8}
                        onSearch={handleSearch}
                      />
                    </IonCardContent>

                    <IonGrid>
                      <IonRow className="date-guest-row">
                        <IonCol>
                          <IonItem className="date-guest-item">
                            <IonButton>Pick Dates</IonButton>
                          </IonItem>
                        </IonCol>

                        <IonCol>
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
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            <div style={{ padding: "20px", textAlign: "center" }}>
              <h3 style={{ color: "var(--ion-color-primary)" }}>Recommended</h3>
              <p style={{ color: "var(--ion-color-medium)", fontSize: "14px" }}>
                {enableGeocoding
                  ? "Enhanced search with Geoapify integration active"
                  : "Database-only search mode"}
              </p>
            </div>

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
      <LoginPage
        isOpen={false} // This will be controlled by Home.tsx
        onClose={() => setShowLoginModal(false)}
        userType="normal"
      />
    </IonPage>
  );
};

export default HomeDesktop;
