import { IonPage, IonContent, IonHeader, IonGrid , IonRow, IonButton, IonCol } from '@ionic/react';


const HomeBestFit: React.FC = () => {

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonCol>
            <IonButton>
              Hotel-Type Property
            </IonButton>
          </IonCol>
          <IonRow>
            <IonButton>
              Apartment/Flat
            </IonButton>
          </IonRow>
          <IonRow>
            <IonButton>
              Bungalow
            </IonButton>
          </IonRow>
        </IonGrid>
        <IonButton href='/propertyType'>Back</IonButton>
        <IonButton href='/'>Next</IonButton>
      </IonContent>
    </IonPage>
  );
}

export default HomeBestFit;