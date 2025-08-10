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
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  homeOutline, 
  businessOutline, 
  diamondOutline, 
  arrowBackOutline,
  arrowForwardOutline
} from 'ionicons/icons';

// Property type conversion mappings
const PROPERTY_TYPE_MAPPING = {
  'Home': 'home',
  'Hotel': 'hotel',
  'Unique': 'unique'
} as const;

// Conversion function
const convertPropertyTypeForDB = (displayType: string): string => {
  return PROPERTY_TYPE_MAPPING[displayType as keyof typeof PROPERTY_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};

const PropertyType: React.FC = () => {
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const saved = localStorage.getItem('Property');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.property_type) {
          setPropertyType(draft.property_type);
        }
      } catch {
        localStorage.removeItem('Property');
      }
    }
  }, []);

  const handleSelect = (type: string) => {
    setPropertyType(type);
    
    // Convert for database and log conversion
    const dbValue = convertPropertyTypeForDB(type);
    console.log(`Property Type Selected - Display: ${type} → Database: ${dbValue}`);
    
    // Save to localStorage for all property types
    const draft = JSON.parse(localStorage.getItem('Property') || '{}');
    draft.property_type = type; // Save directly to property_type
    if (type !== 'Home') {
      delete draft.HomeType; // Use HomeType instead of HomeTypesCategory
    }
    draft.lastUpdated = new Date().toISOString();
    localStorage.setItem('Property', JSON.stringify(draft));
    
    setToastMessage(`${type} property type selected`);
    setShowToast(true);
    console.log("Property type selected:", type);
  };

  const handleBack = () => {
    // Clear localStorage when going back
    localStorage.removeItem('Property');
    setToastMessage('Draft cleared');
    setShowToast(true);
    
    console.log("localStorage cleared - going back to /landlord");
    history.push('/landlord');
  };

  const handleNext = () => {
    if (!propertyType) return;
    
    // Navigate based on property type
    switch (propertyType) {
      case 'Home':
        history.push('/homeBestFit');
        break;
      case 'Hotel':
        history.push('/HotelRoomTypes');
        break;
      case 'Unique':
        history.push('/UniquePropertyDescription');
        break;
      default:
        console.log("Unknown property type:", propertyType);
    }
  };

  // Property type options with descriptions
  const propertyOptions = [
    {
      type: 'Home',
      title: 'Home-Type Property',
      description: 'Houses, apartments, condos, and residential properties',
      icon: homeOutline,
      color: 'success'
    },
    {
      type: 'Hotel',
      title: 'Hotel-Type Property', 
      description: 'Hotels, motels, resorts, and commercial accommodations',
      icon: businessOutline,
      color: 'primary'
    },
    {
      type: 'Unique',
      title: 'Unique-Type Property',
      description: 'Treehouses, boats, castles, and extraordinary spaces',
      icon: diamondOutline,
      color: 'secondary'
    }
  ];

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center ion-text-center ion-margin-bottom">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <h2>What type of property are you listing?</h2>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Choose the category that best describes your property (no default selection)
              </p>
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
                {propertyOptions.map((option) => {
                  // Use a subtle, less bold outline only when selected
                  const isSelected = propertyType === option.type;
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
            </IonCol>
          </IonRow>

          {/* Selected Property Type Summary */}
          {propertyType && (
            <IonRow className="ion-justify-content-center ion-margin-top">
              <IonCol size-xs="12" size-md="8" size-lg="6">
                <IonCard style={{ backgroundColor: '#f0f8ff' }}>
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={propertyOptions.find(opt => opt.type === propertyType)?.icon} color="primary" />
                      <strong>Selected: {propertyType}-Type Property</strong>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                      Database value: {convertPropertyTypeForDB(propertyType)}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
                      {propertyType === 'Home' && 'Next: Choose specific home type'}
                      {propertyType === 'Hotel' && 'Next: Configure hotel rooms and amenities'}
                      {propertyType === 'Unique' && 'Next: Describe your unique property features'}
                    </p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          {/* Action Buttons */}
          <IonRow className="ion-justify-content-center ion-margin-top">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonGrid>
                <IonRow>
                  <IonCol size-xs="12" size-sm="6">
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
                  <IonCol size-xs="12" size-sm="6">
                    <IonButton
                      expand="block"
                      color={propertyType ? "primary" : "medium"}
                      onClick={handleNext}
                      disabled={!propertyType}
                    >
                      Next
                      <IonIcon icon={arrowForwardOutline} slot="end" />
                    </IonButton>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default PropertyType;