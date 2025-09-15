import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonImg
} from "@ionic/react";
import { useState, useEffect } from "react";
import "./Main.scss";
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
  search:"public/search.svg",
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <IonPage id="main-content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
     <IonContent style={{ '--background': 'rgba(246, 239, 229, 1)' }}>
        <IonGrid>
          <IonImg className="home-move" src={getAssetUrls().move}></IonImg>
          {/* Navigation Row */}
          <IonRow className="ion-justify-content-between ion-align-items-center nav-row">
            {/* Left Navigation Items */}
            <IonCol size="auto" className="ion-no-padding">
              <div className="nav-items-container">
                <IonText className="nav-text ion-margin-end">Book</IonText>
                <IonText className="nav-text ion-margin-end">Packages</IonText>
                <IonText className="nav-text">Event</IonText>
              </div>
            </IonCol>

            <IonCol size="auto">
            <div className="brand-container ion-text-center">
              <IonText className="brand-text">
                <span className="brand-visit">Visit</span>

                {/* Group & + Travel */}
                <span className="brand-center">
                  <span className="brand-ampersand">&amp;</span>
                  <span className="brand-travel">Travel</span>
                </span>

                <span className="brand-location">Mersing</span>
              </IonText>
            </div>
          </IonCol>

          <IonCol size="auto">
            <IonIcon src={Icons.tiktok} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.whatsapp} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.facebook} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.email} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
            <IonIcon src={Icons.search} className="cust-icon"></IonIcon>
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