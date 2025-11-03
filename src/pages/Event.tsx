import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonItem,
  IonLabel,
  IonIcon,
  IonRouterLink,
  IonImg,
  IonButton
} from "@ionic/react";
import { Fragment, useState, useEffect } from "react"; // Import useEffect
import "../Main.scss";
import "../pages/Main.scss"; // Import the SCSS file for styling
import supabase from "../supabaseClient";
import { getAssetUrls, Icons } from "../utils/homeAssets";
import { CompanyEvent } from "../interfaces/CompanyEvent"; // Import the new CompanyEvent interface
import Footer from "../components/Footer";
// Removed the redundant TimelineEvent interface as CompanyEvent will be used directly.

  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));


const EventPage: React.FC = () => {
  // State to track user login status.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // State for fetched events
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  // State for error handling
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to check the user's login status
    const checkLoginStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (err) {
        console.error("Error checking login status:", err);
        setIsLoggedIn(false);
      }
    };

    // Function to fetch events from Supabase
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('company_events')
          .select('*')
          .order('start_date', { ascending: true }); // Order by start_date

        if (fetchError) {
          throw fetchError;
        }
        // Ensure dates are strings for display, as CompanyEvent expects strings
        const formattedEvents = data?.map(event => ({
          ...event,
          start_date: event.start_date ? new Date(event.start_date).toISOString().split('T')[0] : '', // Add null/validity check
          end_date: event.end_date ? new Date(event.end_date).toISOString().split('T')[0] : null,
          created_at: event.created_at ? new Date(event.created_at).toISOString() : '', // Add null/validity check
          updated_at: event.updated_at ? new Date(event.updated_at).toISOString() : '', // Add null/validity check
        })) || [];
        setEvents(formattedEvents);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        // Display more detailed error info during development
        setError(err.message || "Failed to load events. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    // Create an async function to call both checkLoginStatus and fetchEvents
    const loadData = async () => {
      await checkLoginStatus();
      await fetchEvents();
    };

    // Call the async function
    loadData();
  }, []); // Empty dependency array = run once on mount

  // The main JSX structure for the Event Page.
  return (
    <IonPage
  id="main-content"
  className="events-page"
  style={{
    '--background': 'rgba(246, 239, 229, 1)',
    fontFamily: "'Kaisei Tokumin', serif",
  }}
>
      <IonContent
        style={{
          '--background': 'rgba(246, 239, 229, 1)',
          '--ion-background-color': 'rgba(246, 239, 229, 1)',
          padding: '0 2em'
        }}
      >
        <IonGrid className="event-header">

        <IonItem
            lines="none"
            className="infinite-scroll"
            style={{ "--background": "rgb(231, 223, 213)" }}
          >
            <IonCol className="scroll-content">{scrollItems}</IonCol>
          </IonItem>

          {/* Navigation Row */}
          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            <IonCol size="auto" className="ion-no-padding">
              <div className="nav-items-container">
                <IonRouterLink routerLink="/visitorPackages" className="no-style-link">
                  <IonText className="nav-text ion-margin-end">Explore Packages</IonText>
                </IonRouterLink>
                <IonRouterLink routerLink="/event" className="no-style-link">
                  <IonText className="nav-text">Event</IonText>
                </IonRouterLink>
              </div>
            </IonCol>

            <IonRouterLink routerLink="/Home" className="no-style-link">
              <IonCol size="auto">
                <div className="brand-container ion-text-center">
                  <IonText className="brand-text">
                    <span className="brand-visit">Visit</span>
                    <span className="brand-center">
                      <span className="brand-ampersand">&</span>
                      <span className="brand-travel">Travel</span>
                    </span>
                    <span className="brand-location">Mersing</span>
                  </IonText>
                </div>
              </IonCol>
            </IonRouterLink>

            <IonCol size="auto" className="icon-row">
              {!isLoggedIn && (
                <IonRouterLink routerLink="/SignIn" className="no-style-link">
                  <IonText className="nav-SignIn ion-margin-end">Sign In</IonText>
                </IonRouterLink>
              )}
              <IonIcon src={Icons.tiktok} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.whatsapp} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.facebook} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.email} className="cust-icon"></IonIcon>
              {isLoggedIn && (
                <IonRouterLink routerLink="/profile" className="no-style-link">
                  <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
                </IonRouterLink>
              )}
              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Hero Section */}
        <div className="event-hero">
          <IonGrid>
            <IonRow className="ion-justify-content-center">
              <IonCol size="12" sizeMd="8" className="ion-text-center">
                <h1 className="event-title">Upcoming Events in Mersing</h1>
                <p className="event-subtitle">
                  Discover the vibrant events happening in Mersing. Plan your visit
                  around these exciting occasions!
                </p>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Events Grid */}
        <IonGrid className="events-grid">
          {isLoading ? (
            <p style={{ textAlign: 'center', width: '100%' }}>Loading events...</p>
          ) : error ? (
            <p style={{ color: 'red', textAlign: 'center', width: '100%' }}>{error}</p>
          ) : events.length === 0 ? (
            <p style={{ textAlign: 'center', width: '100%' }}>
              No upcoming events found. Check back later or contact us for more information.
            </p>
          ) : (
            events.map((event: CompanyEvent) => ( // Use CompanyEvent type here
              <IonRow key={event.id} className="event-card"> {/* Use event.id for key */}
                <IonCol size="12" sizeMd="4" className="event-date-column">
                  <div className="event-date">
                    <span className="date-day">{new Date(event.start_date).getDate()}</span> {/* Use start_date */}
                    <span className="date-month">
                      {new Date(event.start_date).toLocaleString('default', { month: 'short' })} {/* Use start_date */}
                    </span>
                    <span className="date-year">
                      {new Date(event.start_date).getFullYear()} {/* Use start_date */}
                    </span>
                  </div>
                </IonCol>
                <IonCol size="12" sizeMd="8" className="event-details-column">
                  <div className="event-content">
                    <h2 className="event-card-title">{event.title}</h2> {/* Use title */}
                    <p className="event-card-description">{event.description}</p> {/* Use description */}
                    <IonButton
                      fill="clear"
                      className="event-learn-more"
                      style={{
                        textDecoration: 'none',
                        '--background-hover': 'transparent'
                      }}
                      color="medium"
                    >
                      <span style={{ textDecoration: 'none', color: '#503216' }}>Learn More</span>
                      <IonIcon slot="end" src={Icons.arrowForward} style={{ color: '#503216' }}></IonIcon>
                    </IonButton>
                  </div>
                </IonCol>
              </IonRow>
            ))
          )}
        </IonGrid>
      </IonContent>
      <Footer />
    </IonPage>
  );
  };

export default EventPage;
