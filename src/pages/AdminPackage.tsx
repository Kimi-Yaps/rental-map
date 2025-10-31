
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonBackButton,
  IonButtons,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
} from '@ionic/react';
import React from 'react';

const BookingPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Book Your Stay</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding book-page-content">
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" size-md="8" size-lg="6">
              <IonText className="ion-text-center page-title">
                <h2>Make Your Booking</h2>
              </IonText>

              <IonItem lines="full" className="ion-margin-bottom">
                <IonLabel position="floating">Full Name</IonLabel>
                <IonInput type="text" placeholder="Enter your full name"></IonInput>
              </IonItem>

              <IonItem lines="full" className="ion-margin-bottom">
                <IonLabel position="floating">Email</IonLabel>
                <IonInput type="email" placeholder="Enter your email"></IonInput>
              </IonItem>

              <IonItem lines="full" className="ion-margin-bottom">
                <IonLabel position="floating">Check-in Date</IonLabel>
                <IonInput type="date"></IonInput>
              </IonItem>

              <IonItem lines="full" className="ion-margin-bottom">
                <IonLabel position="floating">Check-out Date</IonLabel>
                <IonInput type="date"></IonInput>
              </IonItem>

              <IonItem lines="full" className="ion-margin-bottom">
                <IonLabel position="floating">Number of Guests</IonLabel>
                <IonInput type="number" placeholder="e.g., 2"></IonInput>
              </IonItem>

              <IonButton expand="block" className="ion-margin-top">
                Confirm Booking
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default BookingPage;
