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
  IonText
} from '@ionic/react';

const LandLordHome: React.FC = () => {
  
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Landlord Home</IonTitle>
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
    </IonPage>
  );
};

export default LandLordHome;