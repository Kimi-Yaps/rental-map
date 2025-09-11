import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonHeader,
  IonToolbar,
  IonIcon
} from "@ionic/react";
import { useState, useEffect } from "react";
import "./Main.css";

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
    <IonPage id="main-content">
      <IonContent className="ion-padding">
        <IonGrid className="ion-no-padding">
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
      </IonContent>
    </IonPage>
  );
};

export default Home;