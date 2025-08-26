import React from 'react';
import {
  IonContent,
  IonPage,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonText,
  IonIcon
} from '@ionic/react';
import { personCircleOutline, businessOutline } from 'ionicons/icons';
import { useIonRouter, isPlatform } from '@ionic/react';

const LoginSelector: React.FC = () => {
  const ionRouter = useIonRouter();

  const handleSelection = (userType: 'landlord' | 'normal') => {
    if (!isPlatform('android') && !isPlatform('ios')) { // Check if it's a web platform
      // For web, redirect to the unified LoginPage
      ionRouter.push('/login', 'forward', undefined, { state: { userType } });
    } else {
      // For native platforms, use the specific login pages
      if (userType === 'normal') {
        ionRouter.push('/tenant-login', 'forward');
      } else {
        ionRouter.push('/landlord-login', 'forward');
      }
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--ion-background-color': '#FEFEFE', 'color': '#1A1A1A' }}>
        <IonGrid style={{ height: '100%' }}>
          <IonRow className="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
            <IonCol size="12" size-md="8" size-lg="6">
              <IonText className="ion-text-center" color="dark">
                <h1>Welcome to RentalMap</h1>
                <p>Choose how you want to use the platform</p>
              </IonText>

              <IonRow className="ion-justify-content-center ion-margin-top">
                <IonCol size="12" size-md="6">
                  <IonCard className="ion-text-center" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', '--background': '#FFFFFF', 'color': '#1A1A1A' }} onClick={() => handleSelection('normal')}>
                    <IonCardHeader>
                      <IonIcon icon={personCircleOutline} style={{ fontSize: '48px', color: 'var(--ion-color-primary)' }} />
                      <IonCardTitle className="ion-padding-top" color="dark">I'm Looking to Rent</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <p>Browse available properties and find your perfect home</p>
                      <IonButton expand="block" className="ion-margin-top">
                        Continue as Tenant
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="12" size-md="6">
                  <IonCard className="ion-text-center" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', '--background': '#FFFFFF', 'color': '#1A1A1A' }} onClick={() => handleSelection('landlord')}>
                    <IonCardHeader>
                      <IonIcon icon={businessOutline} style={{ fontSize: '48px', color: 'var(--ion-color-primary)' }} />
                      <IonCardTitle className="ion-padding-top" color="dark">I'm a Property Owner</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <p>List your properties and manage your rentals</p>
                      <IonButton expand="block" className="ion-margin-top">
                        Continue as Landlord
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default LoginSelector;
