import React from 'react';
import {
  IonContent,
  IonGrid,
  IonHeader,
  IonPage,
  IonRow,
  IonCol,
  IonButton,
  IonToolbar,
  IonTitle,
  IonText,
  IonButtons // Added IonButtons import
} from '@ionic/react';
import { useIonRouter } from '@ionic/react'; // Import useIonRouter

const LandLordHome: React.FC = () => {
  const ionRouter = useIonRouter();

  return (
    <IonPage>
      {/* Always render the main content */}
       <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Landlord Home</IonTitle>
          <IonButtons slot="end">
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center ion-text-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonText color="primary">
                <h1>List your property on Our Platform</h1>
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="4" size-lg="3">
              <IonButton
                expand="block"
                fill="solid"
                color="primary"
                onClick={() => ionRouter.push("/propertyType", "forward")}
              >
                List your Property
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size-xs="12" size-md="4" size-lg="3">
              <IonButton 
                expand="block" 
                fill="outline" 
                onClick={() => ionRouter.push("/", "back")}
              >
                Back
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      
      </IonContent>

      {/* LoginPage is a full page component, not a modal */}
      {/* It should be routed to directly, not rendered as a child component with modal props */}
    </IonPage>
  );
};

export default LandLordHome;
