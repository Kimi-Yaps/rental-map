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
import "./ResizableWindow.scss";

// Define TabButtonProps interface at the top level
interface TabButtonProps {
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
}

// Main component - removed the props that don't belong here
const ResizableWindow: React.FC = () => {
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
    <>
    
        <IonGrid className="window-container">
          <IonRow> {/* Added IonRow */}
            <IonCol className="window-header">

            </IonCol>
          </IonRow> {/* Added IonRow */}
        </IonGrid>

    </>
  );
};

export default ResizableWindow;
