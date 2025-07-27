import {
  IonPage,
  IonContent,
  IonHeader,
  IonGrid,
  IonRow,
  IonButton,
  IonToolbar,
  IonTitle,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  homeOutline,
  businessOutline,
  arrowBackOutline,
  arrowForwardOutline,
  golfOutline
} from 'ionicons/icons';

const HomeTypes: React.FC = () => {
  const [homeTypes, setHomeTypes] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const saved = localStorage.getItem('rentalDraft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.HomeTypesCategory && draft.HomeTypesCategory === 'Home') {
          setHomeTypes(draft.HomeTypesCategory);
        }
      } catch {
        localStorage.removeItem('rentalDraft');
      }
    }
  }, []);

  const handleSelect = (type: string) => {
    setHomeTypes(type);
    // If not Home, remove draft data
    if (type !== 'Home') {
      localStorage.removeItem('rentalDraft');
    } else {
      // Save to localStorage only for Home
      const draft = JSON.parse(localStorage.getItem('rentalDraft') || '{}');
      draft.HomeTypesCategory = type;
      draft.lastUpdated = new Date().toISOString();
      localStorage.setItem('rentalDraft', JSON.stringify(draft));
    }
    setToastMessage(`${type} property type selected`);
    setShowToast(true);
    console.log("Property type selected:", type);
  };

  const handleBack = () => {
    // Clear localStorage when going back
    localStorage.removeItem('rentalDraft');
    setToastMessage('Draft cleared');
    setShowToast(true);
    
    console.log("localStorage cleared - going back to /landlord");
    history.push('/landlord');
  };



  const handleNext = () => {
    if (!HomeTypes) return;
    
    // Navigate based on property type
    switch (homeTypes) {
      case 'Homestay':
        history.push('/homeBestFit');
        break;
      case 'Entire House':
        history.push('/HotelRoomTypes');
        break;
      case 'Bungalow':
        history.push('/UniquePropertyDescription');
        break;
      default:
        console.log("Unknown property type:", HomeTypes);
    }
  };
  const HomeTypes = [
    {
      type: 'Homestay',
      title: 'Homestay property',
      description: 'A private room or entire home offered by a local host for short-term stays.',
      icon: homeOutline,
      color: 'orange'
    },
    {
      type: 'Entire House',
      title: 'Entire House property',
      description: 'A standalone residential property rented as a whole unit, ideal for families or groups.',
      icon: businessOutline,
      color: 'purple'
    },
    {
      type: 'Bungalow',
      title: 'Bungalow property',
      description: 'A single-story house often with a spacious layout, suitable for a more exclusive experience.',
      icon: golfOutline,
      color: 'blue'
    }
  ];
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select which home types</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2>which home-type property are you listing?</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Choose the category that best describes your property (no default selection)
          </p>
        </div>

        {/* Toast Messages */}
        <IonToast
          isOpen={showToast}
          message={toastMessage}
          duration={1500}
          onDidDismiss={() => setShowToast(false)}
          position="top"
        />

        <IonGrid>
          {HomeTypes.map((option) => {
            // Use a subtle, less bold outline only when selected
            const isSelected = homeTypes === option.type;
            const outlineColor = `var(--ion-color-${option.color}-tint, #b3e5fc)`; // fallback to a light tint
            return (
              <IonRow key={option.type}>
                <IonCol>
                  <IonCard
                    button
                    onClick={() => handleSelect(option.type)}
                    style={{
                      boxShadow: isSelected ? `0 0 0 1.5px ${outlineColor}` : 'none',
                      border: isSelected ? `1.5px solid ${outlineColor}` : '1px solid #e0e0e0',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <IonCardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <IonIcon
                          icon={option.icon}
                          size="large"
                          color={isSelected ? option.color : 'medium'}
                        />
                        <div>
                          <IonCardTitle
                            color={isSelected ? option.color : undefined}
                          >
                            {option.title}
                          </IonCardTitle>
                        </div>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: isSelected ? 'inherit' : '#666'
                      }}>
                        {option.description}
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            );
          })}
        </IonGrid>

        {/* Selected Property Type Summary */}
        {HomeTypes && (
          <IonCard style={{ marginTop: '20px', backgroundColor: '#f0f8ff' }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={HomeTypes.find(opt => opt.type === homeTypes)?.icon} color="primary" />
                <strong>Selected: {homeTypes}-Type Property</strong>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                {homeTypes === 'Homestay' && 'Next: Return to previous page for home setup'}
                {homeTypes === 'Hotel' && 'Next: Configure hotel rooms and amenities'}
                {homeTypes === 'Unique' && 'Next: Describe your unique property features'}
              </p>
            </IonCardContent>
          </IonCard>
        )}

        {/* Action Buttons */}
        <IonGrid style={{ marginTop: '30px' }}>
          <IonRow>
            <IonCol size="6">
              <IonButton
                expand="block"
                fill="outline"
                color="medium"
                onClick={handleBack}
              >
                <IonIcon icon={arrowBackOutline} slot="start" />
                Back
              </IonButton>
            </IonCol>
            <IonCol size="6">
              <IonButton
                expand="block"
                color={HomeTypes ? "primary" : "medium"}
                onClick={handleNext}
                disabled={!HomeTypes}
              >
                Next
                <IonIcon icon={arrowForwardOutline} slot="end" />
              </IonButton>
            </IonCol>
          </IonRow>


        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default HomeTypes;
