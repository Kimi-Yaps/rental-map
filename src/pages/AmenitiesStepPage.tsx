// src/pages/AmenitiesStepPage.tsx
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonButton,
} from '@ionic/react';
import {
  wifiOutline,
  businessOutline,
  leafOutline,
  carOutline,
  sunnyOutline,
  fastFoodOutline,
  flashOutline,
  accessibilityOutline,
  pawOutline
} from 'ionicons/icons';
import { Property, RentalAmenities } from "../supabaseClient";
import supabase from '../../supabaseConfig';
import Stepper from '../components/Stepper';
import NavigationButtons from '../components/NavigationButtons';
import ConditionalHeader from '../components/ConditionalHeader';

// Helper to get or initialize rental draft
const getProperty = (): Property => {
  const saved = localStorage.getItem('Property');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse Property from localStorage, initializing new.", e);
      return { 
        id: '',
        building_name: null,
        address: '',
        property_type: null,
        house_rules: null,
        max_guests: null,
        instant_booking: null,
        is_active: null,
        amenities: { parking: { spots: 1 } },
        created_at: new Date().toISOString(),
        updated_at: null
      };
    }
  }
  return { 
    id: '',
    building_name: null,
    address: '',
    property_type: null,
    house_rules: null,
    max_guests: null,
    instant_booking: null,
    is_active: null,
    amenities: { parking: { spots: 1 } },
    created_at: new Date().toISOString(),
    updated_at: null
  };
};

const amenityOptions = [
  { key: 'wifi_included', label: 'Wifi', icon: wifiOutline },
  { key: 'air_conditioning', label: 'Air Conditioning', icon: businessOutline },
  { key: 'in_unit_laundry', label: 'In-Unit Laundry', icon: leafOutline },
  { key: 'dishwasher', label: 'Dishwasher', icon: fastFoodOutline },
  { key: 'balcony_patio', label: 'Balcony/Patio', icon: sunnyOutline },
  { key: 'community_pool', label: 'Community Pool', icon: flashOutline },
  { key: 'fitness_center', label: 'Fitness Center', icon: businessOutline },
  { key: 'pet_friendly', label: 'Pets Allowed', icon: pawOutline },
];

const AmenitiesStepPage: React.FC = () => {
  const history = useHistory();
  const [amenities, setAmenities] = useState<RentalAmenities>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const draft = getProperty();
    setAmenities(draft.amenities || {});
  }, []);

  const handleAmenityChange = (key: keyof RentalAmenities) => {
    setAmenities(prevAmenities => {
      const newAmenities = { ...prevAmenities };

      if (key === 'pet_friendly') {
        newAmenities.pet_friendly = {
          ...newAmenities.pet_friendly,
          pets_allowed: !newAmenities.pet_friendly?.pets_allowed,
        };
      } else {
        (newAmenities as any)[key] = !(newAmenities as any)[key];
      }
      saveAmenitiesToDraft(newAmenities);
      return newAmenities;
    });
  };

  const handleParkingTypeChange = (type: 'garage' | 'carport' | 'off_street' | 'street') => {
    setAmenities(prevAmenities => {
      const newAmenities = {
        ...prevAmenities,
        parking: {
          ...prevAmenities.parking,
          type: type
        }
      };
      saveAmenitiesToDraft(newAmenities);
      return newAmenities;
    });
  };

  const handleParkingSpotsChange = (spots: number) => {
    setAmenities(prevAmenities => {
      const newAmenities = {
        ...prevAmenities,
        parking: {
          ...prevAmenities.parking,
          spots: spots
        }
      };
      saveAmenitiesToDraft(newAmenities);
      return newAmenities;
    });
  };

  const saveAmenitiesToDraft = async (updatedAmenities: RentalAmenities) => {
    const draft = getProperty();
    const updatedDraft: Property = {
      ...draft,
      amenities: updatedAmenities,
      updated_at: new Date().toISOString(),
    };
    
    localStorage.setItem('Property', JSON.stringify(updatedDraft));
    
    // Supabase save logic removed as per user request
    // if (updatedDraft.id) {
    //   try {
    //     const { error } = await supabase
    //       .from('rental_drafts')
    //       .upsert([{
    //         id: updatedDraft.id,
    //         amenities_data: updatedAmenities,
    //         updated_at: updatedDraft.updated_at,
    //       }], { onConflict: 'id' });

    //     if (error) {
    //       console.error('Error saving amenities to Supabase:', error);
    //     }
    //   } catch (error) {
    //     console.error('Error saving amenities to Supabase:', error);
    //   }
    // }
    
    setToastMessage('Amenities saved to draft!');
    setShowToast(true);
    console.log('Amenities saved:', updatedDraft.amenities);
  };

  const handleNext = () => {
    saveAmenitiesToDraft(amenities);
    history.push('/rooms');
  };

  const handleBack = () => {
    // No specific action needed here, as the NavigationButtons component handles the alert and navigation
  };

  const isAmenitySelected = (key: string): boolean => {
    if (key === 'pet_friendly') {
      return amenities.pet_friendly?.pets_allowed === true;
    }
    // For other boolean amenities
    return (amenities as any)[key] === true;
  };

  return (
    <IonPage>
      <ConditionalHeader color="primary">
          <IonTitle>Property Amenities</IonTitle>
      </ConditionalHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: 'var(--ion-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ion-color-primary-contrast)',
            fontWeight: 'bold',
            marginRight: '10px'
          }}>
            2
          </div>
          <IonText color="primary">
            <h2>Amenities</h2>
          </IonText>
        </div>

        <IonText color="medium">
          <p>What amenities does your property offer?</p>
        </IonText>

        <IonGrid>
          <IonRow>
            {amenityOptions.map(option => (
              <IonCol size="6" size-md="4" key={option.key}>
                <IonCard
                  button
                  onClick={() => handleAmenityChange(option.key as any)}
                  color={isAmenitySelected(option.key) ? 'primary' : 'light'}
                >
                  <IonCardContent className="ion-text-center amenity-card-content">
                    <IonIcon icon={option.icon} style={{ fontSize: '2rem' }} />
                    <IonLabel>{option.label}</IonLabel>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <IonCard className="ion-margin-top ion-no-margin-horizontal">
          <IonCardContent>
            <IonItem lines="none" className="ion-no-padding">
              <IonIcon icon={carOutline} slot="start" color="primary" />
              <IonLabel>Parking</IonLabel>
            </IonItem>
            <IonGrid className="ion-padding-start">
              <IonRow className="ion-align-items-center ion-justify-content-start ion-wrap">
                {['garage', 'carport', 'off_street', 'street'].map(type => (
                  <IonCol size="auto" key={type}>
                    <IonButton
                      fill={amenities.parking?.type === type ? 'solid' : 'outline'}
                      onClick={() => handleParkingTypeChange(type as 'garage' | 'carport' | 'off_street' | 'street')}
                      size="small"
                      className="ion-margin-bottom ion-margin-end"
                    >
                      {type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </IonButton>
                  </IonCol>
                ))}
              </IonRow>
              {amenities.parking?.type && (
                <Stepper 
                  label="Number of Spots:"
                  value={amenities.parking?.spots || 0} 
                  onIncrement={() => handleParkingSpotsChange((amenities.parking?.spots || 0) + 1)}
                  onDecrement={() => handleParkingSpotsChange((amenities.parking?.spots || 0) - 1)}
                  min={0}
                  max={100}
                />
              )}
            </IonGrid>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
      <NavigationButtons
        onNext={handleNext}
        onBack={handleBack}
        backPath="/LocationStepPage"
        nextPath="/rooms"
      />
    </IonPage>
  );
};

export default AmenitiesStepPage;