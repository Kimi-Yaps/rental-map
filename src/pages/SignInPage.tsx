import {
  IonContent,
  IonGrid,
  IonPage,
  IonRow,
  IonCol,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonImg,
  IonRouterLink,
  IonSegment,
  IonSegmentButton
} from "@ionic/react";
import { useState, useEffect, Fragment } from "react";
import "./Login.scss";


// Define the structure of an enhanced suggestion
export interface EnhancedSuggestion {
  text: string;
  type: "recent" | "database" | "geocoded";
  source: string;
  property_type?: string;
  HomeType?: string;
}

const SignIn: React.FC = () => {
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
     <IonContent className="content" style={{ '--background': 'rgba(246, 239, 229, 1)' }}>

        <IonGrid>
          
          <IonRow className="main-Container">

            

          </IonRow>

        </IonGrid>

      </IonContent>
    </IonPage>
  );
};

export default SignIn;
