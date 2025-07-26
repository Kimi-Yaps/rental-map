import { IonPage, IonContent, IonHeader, IonGrid , IonRow, IonButton} from '@ionic/react';


const PropertyType:React.FC = () => {

    return(
        <IonPage>
              <IonHeader>
              </IonHeader>
              <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow><IonButton>Home-Type Property</IonButton></IonRow>
                    <IonRow><IonButton>Hotel-Type Property</IonButton></IonRow>
                    <IonRow><IonButton>Unique-Type Property</IonButton></IonRow>
                </IonGrid>
                <IonButton href='/landlord'>Back</IonButton>
                <IonButton href='/HomeBestFit'>Next</IonButton>
              </IonContent>
        </IonPage>
    )

}

export default PropertyType;