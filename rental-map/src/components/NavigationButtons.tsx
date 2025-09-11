import React, { useState } from 'react';
import {
  IonButton,
  IonCol,
  IonFooter,
  IonGrid,
  IonRow,
  IonToolbar,
  IonAlert,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';

interface NavigationButtonsProps {
  onNext?: () => void;
  onBack: () => void;
  nextDisabled?: boolean;
  backPath: string;
  alertMessage?: string;
  showNextButton?: boolean;
  rightButton?: React.ReactNode; // New prop for a button on the right
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onNext,
  onBack,
  nextDisabled = false,
  backPath,
  alertMessage = "Going back will clear your current draft data. Are you sure you want to continue?",
  showNextButton = true,
  rightButton, // Destructure the new prop
}) => {
  const history = useHistory();
  const [showBackAlert, setShowBackAlert] = useState(false);

  const handleBackClick = () => {
    setShowBackAlert(true);
  };

  const confirmBack = () => {
    setShowBackAlert(false);
    onBack(); // Call the provided onBack handler first
    history.push(backPath);
  };

  const cancelBack = () => {
    setShowBackAlert(false);
  };

  const handleNextClick = () => {
    onNext && onNext(); // Call the provided onNext handler safely
  };

  return (
    <IonFooter>
      <IonToolbar>
        <IonGrid>
          <IonRow className="ion-align-items-center ion-justify-content-between">
            <IonCol size-xs="6" size-md="6" className="ion-padding-end">
              <IonButton expand="block" fill="outline" size="default" onClick={handleBackClick}>
                Back
              </IonButton>
            </IonCol>
            {showNextButton && (
              <IonCol size-xs="6" size-md="6" className="ion-padding-start">
                <IonButton expand="block" fill="clear" color="primary" onClick={handleNextClick} disabled={nextDisabled}>
                  Next
                </IonButton>
              </IonCol>
            )}
            {!showNextButton && rightButton && (
              <IonCol size-xs="6" size-md="6" className="ion-padding-start">
                {rightButton}
              </IonCol>
            )}
          </IonRow>
        </IonGrid>
      </IonToolbar>
      <IonAlert
        isOpen={showBackAlert}
        onDidDismiss={cancelBack}
        header="Go Back?"
        message={alertMessage}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: cancelBack
          },
          {
            text: 'Yes, Go Back',
            role: 'confirm',
            handler: confirmBack
          }
        ]}
      />
    </IonFooter>
  );
};

export default NavigationButtons;