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
  diamondOutline
} from 'ionicons/icons';
import NavigationButtons from '../components/NavigationButtons';
import supabase from '../supabaseConfig'; // Import supabase

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
  const [loading, setLoading] = useState(true); // Add loading state
  const history = useHistory();

  useEffect(() => {
    const checkUserRole = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setToastMessage('You must be logged in to access this page.');
          setShowToast(true);
          history.replace('/login'); // Redirect to login if not logged in
          return;
        }

        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id);

        if (error) {
          console.error('Error fetching profile:', error.message);
          setToastMessage('Error fetching user profile.');
          setShowToast(true);
          history.replace('/home'); // Redirect on profile fetch error
          return;
        }

        if (!profiles || profiles.length === 0) {
          console.error('No profile found for this user.');
          setToastMessage('Your profile could not be found. Please try logging in again.');
          setShowToast(true);
          // Log out the user to force a new login, which should create the profile.
          await supabase.auth.signOut();
          history.replace('/login');
          return;
        }

        if (profiles.length > 1) {
          console.warn('Multiple profiles found for this user. Using the first one.');
        }

        const profile = profiles[0];

        if (profile && profile.user_type === 'property_owner') {
          // User is a landlord, proceed with loading property type
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
        } else {
          setToastMessage('Access Denied: Only landlords can list properties.');
          setShowToast(true);
          history.replace('/home'); // Redirect if not a landlord
        }
      } catch (error) { // Remove 'any' type
        console.error('Authentication or profile check failed:', (error as Error).message);
        setToastMessage('An error occurred during authentication.');
        setShowToast(true);
        history.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [history]);

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
    history.replace('/landlord');
  };

  const handleNext = () => {
    if (!propertyType) return;
    
    // Navigate based on property type
    switch (propertyType) {
      case 'Home':
        history.replace('/homeBestFit');
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
