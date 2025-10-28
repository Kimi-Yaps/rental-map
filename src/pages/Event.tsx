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
  useIonViewWillEnter,
  IonButton
} from "@ionic/react";
import { Fragment, useState } from "react";
import "../Main.scss";
import "../pages/Main.scss"; // Import the SCSS file for styling
import supabase from "../supabaseClient";
import { getAssetUrls, Icons } from "../utils/homeAssets";

// Define the structure for a timeline event for better type safety
interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}


  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));


const EventPage: React.FC = () => {
  // State to track user login status. This is useful for conditionally rendering elements like "Sign In" or "Profile" icons.
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // useIonViewWillEnter is a lifecycle hook that runs when the view is about to enter.
  // It's a good place to fetch data or perform checks that need to happen before the page is displayed.
  useIonViewWillEnter(() => {
    // Function to check the user's login status using Supabase authentication.
    const checkLoginStatus = async () => {
      try {
        // Attempt to get the current session from Supabase.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        // Update the isLoggedIn state based on whether a session exists.
        setIsLoggedIn(!!session);
      } catch (error) {
        // Log any errors encountered during the session check.
        console.error("Error checking login status:", error);
        setIsLoggedIn(false); // Ensure state is false if an error occurs.
      }
    };
    // Call the function to check login status.
    checkLoginStatus();
  });

  // Mock data for the timeline events. This data represents upcoming events and their details.
  // In a real application, this data would likely be fetched from a backend or API.
  const timelineEvents: TimelineEvent[] = [
    {
      date: "2024-01-15",
      title: "Event Kick-off",
      description: "The grand opening of our annual Mersing Festival. Join us for a day of celebration and discovery.",
    },
    {
      date: "2024-01-18",
      title: "Island Hopping Adventure",
      description: "Embark on a thrilling journey to our pristine islands. Experience the best of Mersing's marine life.",
    },
    {
      date: "2024-01-22",
      title: "Cultural Showcase",
      description: "Immerse yourself in the rich culture of Mersing with traditional performances and local crafts.",
    },
    {
      date: "2024-01-25",
      title: "Culinary Delights",
      description: "Savor the authentic flavors of Mersing. A food festival celebrating local cuisine.",
    },
  ];

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
          {timelineEvents.map((event: TimelineEvent, index: number) => (
            <IonRow key={index} className="event-card">
              <IonCol size="12" sizeMd="4" className="event-date-column">
                <div className="event-date">
                  <span className="date-day">{new Date(event.date).getDate()}</span>
                  <span className="date-month">
                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="date-year">
                    {new Date(event.date).getFullYear()}
                  </span>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="8" className="event-details-column">
                <div className="event-content">
                  <h2 className="event-card-title">{event.title}</h2>
                  <p className="event-card-description">{event.description}</p>
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
          ))}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
  };

export default EventPage;

