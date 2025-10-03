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
import supabase from "../supabaseConfig";
import { storageService } from "../services/storage";

export const getAssetUrls = () => ({
  move: storageService.getPublicUrl('Asset/moving.webp'),
  elips: storageService.getPublicUrl('Asset/ellipse_bg.webp'),
  polygon: storageService.getPublicUrl('Asset/polygon_bg.webp'),
  homeBackground: storageService.getPublicUrl('Asset/PulauHarimau09.webp')
})

export const Icons = {
  cart: "public/cart.svg",
  email:"public/email.svg",
  facebook:"public/facebook.svg",
  malayFlag:"public/flag-malaysia.svg",
  instagram:"public/instagram.svg",
  user: "public/profile-fill.svg",
  tiktok:"public/tiktok-circle.svg",
  whatsapp:"public/whatsapp-filled.svg",
  home: "public/home.svg",
};

// Define the structure of an enhanced suggestion
export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}

const Home: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useIonViewWillEnter(() => {
    const checkLoginStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error("Error checking login status:", error);
        setIsLoggedIn(false);
      }
    };
    checkLoginStatus();
  });

  const scrollItems = Array.from({ length: 7 }, (_, i) => (
    <Fragment key={i}>
      <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
      <IonLabel aria-hidden="true">Book Your Place Now</IonLabel>
    </Fragment>
  ));
  

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setIsLoggedIn(false);
    } catch (error: any) {
      console.error("Error signing out:", error.message);
    }
  };

  return (
    <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
     <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonGrid>
          <IonItem lines="none" className="infinite-scroll" style={{'--background':'rgb(231, 223, 213)'}}>
              <div className="scroll-content">
                {scrollItems}
              </div>
            </IonItem>
            
          {/* Navigation Row */}
          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            {/* Left Navigation Items */}
            <IonCol size="auto" className="ion-no-padding">
              <div className="nav-items-container">
                <IonText className="nav-text ion-margin-end">Book</IonText>
                <IonRouterLink routerLink="/bookPackage" className="no-style-link">
                   <IonText className="nav-text ion-margin-end">Packages</IonText>
                </IonRouterLink>
               
                <IonText className="nav-text">Event</IonText>
              </div>
            </IonCol>

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

            <IonCol size="auto" className="icon-row">
            {!isLoggedIn && (
              <IonRouterLink routerLink="/SignIn" className="no-style-link">
                <IonText className="nav-SignIn ion-margin-end">Sign In</IonText>
              </IonRouterLink>
            )}
            {isLoggedIn && (
              <IonButton onClick={handleSignOut}>Sign Out</IonButton>
            )}
            <IonIcon src={Icons.tiktok} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.whatsapp} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.facebook} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.email} className="cust-icon"></IonIcon>

             {isLoggedIn &&( <IonRouterLink routerLink="/profile" className="no-style-link">
              <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
            </IonRouterLink>)}
            
            <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
          </IonCol>
          </IonRow>
        </IonGrid>

          <IonGrid className="frontPageContainer">
            <IonImg className="home-Bg" src={getAssetUrls().homeBackground}></IonImg>
            <IonImg className="home-Poly" src={getAssetUrls().polygon}></IonImg>
            <IonImg className="home-Elips" src={getAssetUrls().elips}></IonImg>
          </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Home;