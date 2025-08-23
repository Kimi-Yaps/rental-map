import React from 'react';
import { IonPage, IonContent, IonButton, IonText } from '@ionic/react';
import { useIonRouter } from '@ionic/react';

const Profile: React.FC = () => {
  const ionRouter = useIonRouter();
  return (
    <IonPage>
      <IonContent className="ion-padding">
        <IonText color="primary">
          <h2>Welcome to your Profile</h2>
        </IonText>
        <IonButton expand="block" onClick={() => ionRouter.push('/login', 'forward')}>
          Login / Sign Up
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
