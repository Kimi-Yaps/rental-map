import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonRouterLink,
  IonButton,
  IonImg
} from "@ionic/react";
import { useState, useEffect } from "react";
import "./BookPage.scss";
import ResizableWindow from '../components/ResizableWindow';
import supabase from "../supabaseConfig";

export const Icons = {
  camera: "public/camera.svg",
  noise: "public/rectangle-noise.webp",
  cart: "public/cart.svg",
  browsePage: "public/browsepage.svg",
  malayFlag: "public/flag-malaysia.svg",
  user: "public/profile-fill.svg",
};

// Define the structure of an enhanced suggestion
export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}

// Define TabButtonProps interface at the top level
interface TabButtonProps {
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
}

// Main component - removed the props that don't belong here
const BookPackage: React.FC = () => {
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

  // Handler for the tab button
  const handleTabButtonClick = () => {
    console.log("Tab button clicked");
    // Add your logic here
  };

  return (
    <IonPage id="main-content">
        <IonContent className="content">
          {/* Moved camera icon to be a sibling of background-noise */}
          <IonImg src={Icons.noise} className="background-noise"></IonImg>
          <IonImg src={Icons.camera} className="centered-icon"></IonImg>

          <IonGrid className="booking-nav-container">
          <IonRow className="booking-nav">
            
            {/* Empty column for spacing if needed */}
            <IonCol size="auto">
              {/* Add logo or other elements here if needed */}
            </IonCol>

            {/* Main navigation icons */}
            <IonCol className="icon-list">
              
              <IonRouterLink routerLink="/SignIn" className="no-style-link">
                <IonText className="nav-SignIn ion-margin-end">Sign In</IonText>
              </IonRouterLink>

              <IonIcon src={Icons.malayFlag} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.cart} className="cust-icon"></IonIcon>
              <IonIcon src={Icons.user} className="cust-icon"></IonIcon>
              
              {/* Tab Button */}
              <IonButton
                fill="clear"
                className="custom-tab-button"
                onClick={handleTabButtonClick}
                disabled={false}
              >
                {/* top accent strip */}
                <div className="tab-accent-strip" />
                
                {/* counter */}
                <span className="tab-counter">
                  0
                </span>
              </IonButton>
              
            </IonCol>
            
          </IonRow>
        </IonGrid>

        <ResizableWindow />

        {/* Rest of your page content goes here */}
        <IonGrid>
          <IonRow>
            <IonCol>
            </IonCol>
          </IonRow>
        </IonGrid>

      </IonContent>
    </IonPage>
  );
};

export default BookPackage;
