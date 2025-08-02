import {
  IonPage,
  IonContent,
  IonHeader,
  IonGrid,
  IonRow,
  IonButton,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import {
  homeOutline,
  businessOutline,
  arrowBackOutline,
  arrowForwardOutline,
  golfOutline
} from 'ionicons/icons';

// Home type conversion mappings
const HOME_TYPE_MAPPING = {
  'Homestay': 'homestay',
  'Entire House': 'entire_house',
  'Bungalow': 'bungalow'
} as const;

// Conversion function
const convertHomeTypeForDB = (displayType: string): string => {
  return HOME_TYPE_MAPPING[displayType as keyof typeof HOME_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};

const HomeTypes: React.FC = () => {
  const [homeType, setHomeType] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const saved = localStorage.getItem('rentalDraft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.HomeTypesCategory) {
          setHomeType(draft.HomeTypesCategory);
        }
      } catch {
        localStorage.removeItem('rentalDraft');
      }
    }
  }, []);

  const handleSelect = (type: string) => {
    setHomeType(type);
    
    // Convert for database and log conversion
    const dbValue = convertHomeTypeForDB(type);
    console.log(`Home Type Selected - Display: ${type} → Database: ${dbValue}`);
    
    // Save to localStorage
    const draft = JSON.parse(localStorage.getItem('rentalDraft') || '{}');
    draft.HomeTypesCategory = type;
    draft.homeTypeDB = dbValue; // Store converted value too
    draft.lastUpdated = new Date().toISOString();
    localStorage.setItem('rentalDraft', JSON.stringify(draft));
    
    setToastMessage(`${type} home type selected`);
    setShowToast(true);
    console.log("Home type selected:", type);
  };

  const handleBack = () => {
    // Don't clear localStorage when going back - just go to previous step
    console.log("Going back to /propertyType");
    history.push('/propertyType');
  };

  const handleNext = useCallback(() => {
    if (!homeType) return;
    console.log("Moving to next step in property listing flow");
    history.push('/PropertyListingFlow');
  }, [history, homeType]);

  const homeTypeOptions = [
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
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2>Which home-type property are you listing?</h2>
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
          {homeTypeOptions.map((option) => {
            // Use a subtle, less bold outline only when selected
            const isSelected = homeType === option.type;
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

        {/* Selected Home Type Summary */}
        {homeType && (
          <IonCard style={{ marginTop: '20px', backgroundColor: '#f0f8ff' }}>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IonIcon icon={homeTypeOptions.find(opt => opt.type === homeType)?.icon} color="primary" />
                <strong>Selected: {homeType}</strong>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                Database value: {convertHomeTypeForDB(homeType)}
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                Next: Continue with property listing details
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
                color={homeType ? "primary" : "medium"}
                onClick={handleNext}
                disabled={!homeType}
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