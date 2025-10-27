import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonLabel,
  IonImg,
  useIonViewWillEnter,
  IonItem, // Added
  IonIcon, // Added
  IonRouterLink, // Added
} from "@ionic/react";
import { Fragment, useState } from "react";
import "../Main.scss"; // Added from Home.tsx
import "../pages/VisitorPackages.scss";
import supabase from "../supabaseConfig";
import { getAssetUrls, Icons } from "../utils/homeAssets"; // Added Icons

const VisitorPackage: React.FC = () => {
  // State for authentication and user role (from original VisitorPackages.tsx)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Removed userType as it's not used and causing ESLint warnings.
  // const [userType, setUserType] = useState<string | null>(null); // e.g., 'admin', 'tenant'

  useIonViewWillEnter(() => {
    const checkLoginStatusAndProfile = async () => {
      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          setIsLoggedIn(true);

          // Fetch user profile
          const { error: profileError } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", session.user.id)
            .single();

          if (profileError) throw profileError;
        } else {
          // Handle not logged in state
          setIsLoggedIn(false);
          // setUserType(null);
        }
      } catch (error) {
        console.error("Error checking login status or profile:", error);
        setIsLoggedIn(false);
        // setUserType(null);
      }
    };

    checkLoginStatusAndProfile();
  });

  // Example scrolling items (static content) - from original VisitorPackages.tsx
  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));

  // Mock data for travel/tourism packages - from original VisitorPackages.tsx
  const packages = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    imageUrl: null, // Placeholder left empty for now
    title: "Pulau Hujung",
    price: "RM260 per Night",
  }));

  // Mock data for local services - from original VisitorPackages.tsx
  const services = Array.from({ length: 4 }, (_, i) => ({
    id: i + 5,
    imageUrl: null, // Placeholder left empty for now
    title: "Pulau Hujung",
    price: "RM260 per Night",
  }));

  return (
    <IonPage
      id="main-content"
      style={{ "--background": "rgba(246, 239, 229, 1)" }} // Applied from Home.tsx
    >
      <IonContent style={{ "--background": "rgba(246, 239, 229, 1)" }}>
        {" "}
        {/* Applied from Home.tsx */}
        <IonGrid>
          {/* Infinite Scroll Section - from Home.tsx */}
          <IonItem
            lines="none"
            className="infinite-scroll"
            style={{ "--background": "rgb(231, 223, 213)" }}
          >
            <div className="scroll-content">{scrollItems}</div>
          </IonItem>

          {/* Navigation Row - from Home.tsx */}
          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            {/* Left Navigation Items */}
            <IonCol size="auto" className="ion-no-padding">
              <div className="nav-items-container">
                {/* New link for visitor packages */}
                <IonRouterLink
                  routerLink="/visitorPackages"
                  className="no-style-link"
                >
                  <IonText className="nav-text ion-margin-end">
                    Explore Packages
                  </IonText>
                </IonRouterLink>
                {/* Link to the Event page itself. */}
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

                    {/* Group & + Travel */}
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
                  <IonText className="nav-SignIn ion-margin-end">
                    Sign In
                  </IonText>
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
        {/* New Title and Paragraph */}
        <IonGrid className="ion-text-center ion-padding-top ion-padding-bottom" 
         style={{marginBottom: '2em' }}>
          <IonRow>
            <IonCol size="12">
              <IonText
                style={{
                  fontFamily: "'Kaisei Tokumin', serif",
                  fontSize: "1.8em",
                  fontWeight: "bold",
                }}
              >
                Explore, Stay, and Discover
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonText
                style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1em"}}
              >
                Plan your perfect getaway with Visit Mersing. We offer complete
                tourism Mersing packages, specializing in exhilarating Island
                Hopping adventures to stunning destinations
              </IonText>
            </IonCol>
          </IonRow>
        </IonGrid>
        {/* Original Content Sections from VisitorPackages.tsx */}
        {/* Section: Available In Mersing */}
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonText className="section-title">Available In Mersing </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            {packages.map((pkg) => (
              <IonCol size="12" size-sm="6" size-md="3" key={pkg.id}>
                <div className="package-card">
                  {pkg.imageUrl ? (
                    <IonImg src={pkg.imageUrl} alt={pkg.title} />
                  ) : (
                    <div className="image-placeholder"></div>
                  )}
                  <IonText className="package-title">{pkg.title}</IonText>
                  <IonText className="package-price">{pkg.price}</IonText>
                </div>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
        {/* Section: Available Services */}
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonText className="section-title">Available Services </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            {services.map((service) => (
              <IonCol size="12" size-sm="6" size-md="3" key={service.id}>
                <div className="package-card">
                  {service.imageUrl ? (
                    <IonImg src={service.imageUrl} alt={service.title} />
                  ) : (
                    <div className="image-placeholder"></div>
                  )}
                  <IonText className="package-title">{service.title}</IonText>
                  <IonText className="package-price">{service.price}</IonText>
                </div>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default VisitorPackage;
