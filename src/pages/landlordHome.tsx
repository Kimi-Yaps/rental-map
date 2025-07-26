// LandLordHome.tsx
import { IonPage, IonContent, IonHeader, IonButton } from '@ionic/react';

const LandLordHome: React.FC = () => {
  
  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>List your property on Our Platform</h1>
        <IonButton href='/propertyType'>List your Property</IonButton>
        <IonButton href='/'>Back</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default LandLordHome;