// LandLordHome.tsx
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
import { useState } from 'react'; // Import useState
import LoginPage from '../components/LoginPage'; // Import LoginPage

const LandLordHome: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for login status
  const [showLoginModal, setShowLoginModal] = useState(false); // State to control login modal visibility

  return (
    <IonPage>
      {/* Always render the main content */}
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Landlord Home</IonTitle>
          <IonButtons slot="end"> {/* Added IonButtons */}
            <IonButton onClick={() => setShowLoginModal(true)} fill="clear" color="light">
              Login
            </IonButton>
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
              <IonButton expand="block" href='/propertyType'>List your Property</IonButton>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size-xs="12" size-md="4" size-lg="3">
              <IonButton expand="block" fill="outline" href='/'>Back</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>

      {/* Render LoginPage as an overlay */}
      <LoginPage
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        userType="landlord"
      />
    </IonPage>
  );
};

export default LandLordHome;