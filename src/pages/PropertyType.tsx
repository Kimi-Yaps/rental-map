import {
  IonPage,
  IonContent,
  IonHeader,
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
  IonFooter,
  IonSpinner // Import IonSpinner

} from '@ionic/react';
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  homeOutline, 
  businessOutline, 
  diamondOutline,
  checkmarkCircleOutline // Import checkmark icon
} from 'ionicons/icons';
import NavigationButtons from '../components/NavigationButtons';
import { PropertyType as DbPropertyType } from '../components/DbCrud';

// Property type mapping to database types
const PROPERTY_TYPE_MAPPING: Record<string, DbPropertyType> = {
  'Home': 'house',
  'Apartment': 'apartment',
  'Condo': 'condo',
  'Studio': 'studio'
};

// Conversion function
const convertPropertyTypeForDB = (displayType: string): string => {
  return PROPERTY_TYPE_MAPPING[displayType as keyof typeof PROPERTY_TYPE_MAPPING] || displayType.toLowerCase().replace(/\s+/g, '_');
};

const PropertyType: React.FC = () => {
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state
  const history = useHistory();

  useEffect(() => {
    setLoading(true);
    try {
      const saved = localStorage.getItem('Property');
      if (saved) {
        const draft = JSON.parse(saved);
        console.log("Loaded draft from localStorage:", draft); // Added debug logging
        if (draft.property_type) {
          // Convert database type back to display type
          const displayType = Object.entries(PROPERTY_TYPE_MAPPING)
            .find(([, dbType]) => dbType === draft.property_type)?.[0];
          if (displayType) {
            setPropertyType(displayType);
            console.log("Property type loaded from 'property_type':", displayType); // Added debug logging
          }
        } else if (draft.HomeType) { // Added for backward compatibility
          const displayType = Object.entries(PROPERTY_TYPE_MAPPING)
            .find(([, dbType]) => dbType === draft.HomeType)?.[0];
          if (displayType) {
            setPropertyType(displayType);
            console.log("Property type loaded from 'HomeType':", displayType); // Added debug logging
          }
        }
      } else {
        console.log("No 'Property' found in localStorage on load."); // Added debug logging
      }
    } catch (error) {
      console.error('Error loading property from localStorage:', error); // Improved error logging
      localStorage.removeItem('Property');
      setToastMessage('Error loading saved property data');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = (type: string) => {
    setPropertyType(type);
    
    // Convert the display type to our database type
    const dbPropertyType = PROPERTY_TYPE_MAPPING[type];
    
    // Save to localStorage
    const draft = JSON.parse(localStorage.getItem('Property') || '{}');
    draft.property_type = dbPropertyType;
    draft.HomeType = dbPropertyType; // Keep for backward compatibility with FinalReviewPage
    draft.updated_at = new Date().toISOString();
    localStorage.setItem('Property', JSON.stringify(draft));
    
    setToastMessage(`${type} selected as your property type`);
    setShowToast(true);
    console.log("Property type selected:", type, "DB value:", dbPropertyType);
    console.log("Saved to localStorage:", JSON.stringify(draft)); // Added debug logging
  };

  const handleBack = () => {
    // When going back to landlord home, we don't need to clear the draft
    // as the user might want to continue later
    history.replace('/landlord');
  };

  const handleNext = () => {
    if (!propertyType) return;

    // Save to localStorage if not already saved
    const draft = JSON.parse(localStorage.getItem('Property') || '{}');
    if (!draft.property_type) {
      draft.property_type = PROPERTY_TYPE_MAPPING[propertyType];
      draft.updated_at = new Date().toISOString();
      localStorage.setItem('Property', JSON.stringify(draft));
    }
    
    // Define the step order for all property types
    const stepOrder = [
      '/location',
      '/amenities',
      '/rooms',
      '/photos',
      '/pricing',
      '/review'
    ];

    // Move to the first step - location for all property types
    history.push(stepOrder[0]);
  };

  // Property type options with descriptions
  const propertyOptions = [
    {
      type: 'House',
      title: 'House',
      description: 'Single-family homes, duplexes, and detached houses',
      icon: homeOutline,
      color: 'success'
    },
    {
      type: 'Apartment',
      title: 'Apartment', 
      description: 'Units in apartment buildings or high-rise complexes',
      icon: businessOutline,
      color: 'primary'
    },
    {
      type: 'Condo',
      title: 'Condominium',
      description: 'Individually owned units in shared buildings',
      icon: businessOutline,
      color: 'tertiary'
    },
    {
      type: 'Studio',
      title: 'Studio',
      description: 'Combined living and sleeping spaces in one room',
      icon: diamondOutline,
      color: 'secondary'
    }
  ];

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
          <p>Loading...</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Select Property Type</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow className="ion-justify-content-center ion-text-center ion-margin-bottom">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonText color="primary">
                <h2>What type of property are you listing?</h2>
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
                {propertyOptions.map((option) => {
                  const isSelected = propertyType === option.type;
                  return (
                    <IonRow key={option.type}>
                      <IonCol>
                        <IonCard
                          button
                      onClick={() => handleSelect(option.type)}
                      color={isSelected ? option.color : undefined}
                      style={{
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        color: isSelected ? 'white' : undefined
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

          {/* Selected Property Type Summary */}
          {propertyType && (
            <IonRow className="ion-justify-content-center ion-margin-top">
              <IonCol size-xs="12" size-md="8" size-lg="6">
                <IonCard color="light">
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={propertyOptions.find(opt => opt.type === propertyType)?.icon} color="primary" />
                      <strong>Selected: {propertyType}-Type Property</strong>
                      <IonIcon icon={checkmarkCircleOutline} color="success" style={{ marginLeft: 'auto' }} /> {/* Added checkmark */}
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                      Database value: {convertPropertyTypeForDB(propertyType)}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                      {propertyType === 'Home' && 'Next: Choose specific home type'}
                      {propertyType === 'Hotel' && 'Next: Configure hotel rooms and amenities'}
                      {propertyType === 'Unique' && 'Next: Describe your unique property features'}
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
            nextDisabled={!propertyType}
            backPath="/landlord"
          />
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default PropertyType;
