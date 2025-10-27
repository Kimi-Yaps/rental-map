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
} from "@ionic/react";
import { Fragment, useState } from "react";
import "../Main.scss";
import supabase from "../supabaseConfig";
import { getAssetUrls, Icons } from "../utils/homeAssets";

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<string | null>(null); // e.g., 'admin', 'tenant'

  useIonViewWillEnter(() => {
    const checkLoginStatusAndProfile = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session) {
          setIsLoggedIn(true);
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("user_type")
            .eq("id", session.user.id)
            .single();

          if (profileError) throw profileError;

          let currentUserType = null; // Declare currentUserType here

          if (
            profileData &&
            profileData.user_type &&
            profileData.user_type.type
          ) {
            currentUserType = profileData.user_type.type;
          } else {
            // Default to 'tenant' if user_type is not set or missing in profile
            // Ensure user_type is set in Supabase
            currentUserType = "tenant";
            try {
              // Add try-catch for the update operation
              await supabase
                .from("profiles")
                .update({ user_type: { type: "tenant" } })
                .eq("id", session.user.id);
            } catch (updateError) {
              console.error(
                "Error updating user_type in profiles:",
                updateError
              );
              // Optionally, handle this error more gracefully, e.g., show a message to the user
            }
          }
          setUserType(currentUserType); // Set the state after determining the type
        } else {
          setIsLoggedIn(false);
          setUserType(null); // Logged out
        }
      } catch (error) {
        console.error("Error checking login status or profile:", error);
        setIsLoggedIn(false);
        setUserType(null);
      }
    };
    checkLoginStatusAndProfile();
  });

  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));

  return (
    <IonPage
      id="main-content"
      style={{ "--background": "rgba(246, 239, 229, 1)" }}
    >
      <IonContent style={{ "--background": "rgba(246, 239, 229, 1)" }}>
        <IonGrid>
          <IonItem
            lines="none"
            className="infinite-scroll"
            style={{ "--background": "rgb(231, 223, 213)" }}
          >
            <div className="scroll-content">{scrollItems}</div>
          </IonItem>

          {/* Navigation Row */}
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
                {/* Link to the new Event page */}
                <IonRouterLink routerLink="/event" className="no-style-link">
                  <IonText className="nav-text">Event</IonText>
                </IonRouterLink>
              </div>
            </IonCol>

            <IonRouterLink routerLink="/home" className="no-style-link">
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

        <IonGrid className="frontPageContainer">
          <IonImg
            className="home-Bg"
            src={getAssetUrls().homeBackground}
          ></IonImg>
          <IonImg className="home-Poly" src={getAssetUrls().polygon}></IonImg>
          <IonImg className="home-Elips" src={getAssetUrls().elips}></IonImg>
        </IonGrid>

      </IonContent>
    </IonPage>
  );
};

export default Home;
