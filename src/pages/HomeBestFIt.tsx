import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonToast,
  IonText,
  IonToolbar,
  IonTitle,
  IonFooter
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  homeOutline,
  businessOutline,
  golfOutline
} from 'ionicons/icons';
import NavigationButtons from '../components/NavigationButtons';
import ConditionalHeader from '../components/ConditionalHeader';

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

const HomeBestFit: React.FC = () => { // Renamed component here
  const [homeType, setHomeType] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const ionRouter = useIonRouter();

  useEffect(() => {
    const saved = localStorage.getItem('Property');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.HomeType) {
          setHomeType(draft.HomeType);
        }
      } catch {
        localStorage.removeItem('Property');
      }
    }
  }, []);

  const handleSelect = (type: string) => {
    setHomeType(type);
    
    // Convert for database and log conversion
    const dbValue = convertHomeTypeForDB(type);
    console.log(`Home Type Selected - Display: ${type} → Database: ${dbValue}`);
    
    // Save to localStorage
    const draft = JSON.parse(localStorage.getItem('Property') || '{}');
    draft.HomeType = type;
    draft.lastUpdated = new Date().toISOString();
    localStorage.setItem('Property', JSON.stringify(draft));
    
    setToastMessage(`${type} home type selected`);
    setShowToast(true);
    console.log("Home type selected:", type);
  };

  const handleBack = () => {
    // Don't clear localStorage when going back - just go to previous step
    console.log("Going back to /propertyType");
    ionRouter.push('/propertyType', 'back');
  };

  const handleNext = useCallback(() => {
    if (!homeType) return;
    console.log("Moving to next step in property location Step Page");
    ionRouter.push('/location', 'forward');
  }, [ionRouter, homeType]);

  const homeTypeOptions = [
    {
      type: 'Homestay',
      title: 'Homestay property',
      description: 'A private room or entire home offered by a local host for short-term stays.',
      icon: homeOutline,
      color: 'primary'
    },
    {
      type: 'Entire House',
      title: 'Entire House property',
      description: 'A standalone residential property rented as a whole unit, ideal for families or groups.',
      icon: businessOutline,
      color: 'secondary'
    },
    {
      type: 'Bungalow',
      title: 'Bungalow property',
      description: 'A single-story house often with a spacious layout, suitable for a more exclusive experience.',
      icon: golfOutline,
      color: 'tertiary'
    }
  ];

  return (
    <IonPage>
      <ConditionalHeader color="primary">
            <IonTitle>Select Home Type</IonTitle>
      </ConditionalHeader>

      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center ion-text-center ion-margin-bottom">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonText color="primary">
                <h2>Which home-type property are you listing?</h2>
              </IonText>
              <IonText color="medium">
                <p>Choose the category that best describes your property (no default selection)</p>
              </IonText>
            </IonCol>
          </IonRow>

          {/* Toast Messages */}
          <IonToast
            isOpen={showToast}
            message={toastMessage}
            duration={1500}
            onDidDismiss={() => setShowToast(false)}
            position="top"
          />

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonGrid>
                {homeTypeOptions.map((option) => {
                  const isSelected = homeType === option.type;
                  return (
                    <IonRow key={option.type}>
                      <IonCol>
                        <IonCard
                          button
                          onClick={() => handleSelect(option.type)}
                          color={isSelected ? option.color : undefined}
                          style={{
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <IonCardHeader>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <IonIcon
                                icon={option.icon}
                                size="large"
                              />
                              <div>
                                <IonCardTitle>
                                  {option.title}
                                </IonCardTitle>
                              </div>
                            </div>
                          </IonCardHeader>
                          <IonCardContent>
                            <p style={{ margin: 0, fontSize: '14px' }}>
                              {option.description}
                            </p>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    </IonRow>
                  );
                })}
              </IonGrid>
            </IonCol>
          </IonRow>

          {/* Selected Home Type Summary */}
          {homeType && (
            <IonRow className="ion-justify-content-center ion-margin-top">
              <IonCol size-xs="12" size-md="8" size-lg="6">
                <IonCard color="light">
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={homeTypeOptions.find(opt => opt.type === homeType)?.icon} color="primary" />
                      <strong>Selected: {homeType}</strong>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                      Database value: {convertHomeTypeForDB(homeType)}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                      Next: Continue with property listing details
                    </p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>
      </IonContent>
      <IonFooter>
        <IonToolbar>
        <NavigationButtons
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={!homeType}
        backPath="/location"
        />
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default HomeBestFit; // Updated export here
