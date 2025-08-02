// src/pages/AmenitiesStepPage.tsx
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonList,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonInput, // Import IonInput for the number of spots
} from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, wifiOutline, businessOutline, leafOutline, carOutline, sunnyOutline, fastFoodOutline, flashOutline, accessibilityOutline } from 'ionicons/icons';
import { RentalAmenities, RentalDraft } from "../components/DbCrud";
import  PublishPropertyButton  from '../pages/PublishPropertyButton';

// Helper to get or initialize rental draft
const getRentalDraft = (): RentalDraft => {
  const saved = localStorage.getItem('rentalDraft');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse rentalDraft from localStorage, initializing new.", e);
      return { id: '', building_name: null, address: '', property_type: null, house_rules: null, max_guests: null, instant_booking: null, is_active: null, amenities: {}, created_at: new Date().toISOString(), updated_at: null };
    }
  }
  return { id: '', building_name: null, address: '', property_type: null, house_rules: null, max_guests: null, instant_booking: null, is_active: null, amenities: {}, created_at: new Date().toISOString(), updated_at: null };
};

const AmenitiesStepPage: React.FC = () => {
  const history = useHistory();
  const [amenities, setAmenities] = useState<RentalAmenities>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Load amenities from rentalDraft in localStorage
    const draft = getRentalDraft();
    setAmenities(draft.amenities || {});
  }, []);

  const handleAmenityChange = (key: keyof RentalAmenities, value: boolean) => {
    setAmenities(prevAmenities => {
      const newAmenities = { ...prevAmenities };

      if (key === 'pet_friendly_dogs' || key === 'pet_friendly_cats') {
        const subKey = key === 'pet_friendly_dogs' ? 'dogs_allowed' : 'cats_allowed';
        newAmenities.pet_friendly = {
          ...newAmenities.pet_friendly,
          [subKey]: value,
        };
      } else {
        (newAmenities as any)[key] = value;
      }
      return newAmenities;
    });
  };

  const handleParkingTypeChange = (type: 'garage' | 'carport' | 'off_street' | 'street') => {
    setAmenities(prevAmenities => ({
      ...prevAmenities,
      parking: {
        ...prevAmenities.parking,
        type: type
      }
    }));
  };

  const handleParkingSpotsChange = (spots: number) => {
    setAmenities(prevAmenities => ({
      ...prevAmenities,
      parking: {
        ...prevAmenities.parking,
        spots: spots
      }
    }));
  };

  const saveAmenitiesToDraft = () => {
    const draft = getRentalDraft();
    const updatedDraft: RentalDraft = {
      ...draft,
      amenities: amenities,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('rentalDraft', JSON.stringify(updatedDraft));
    setToastMessage('Amenities saved to draft!');
    setShowToast(true);
    console.log('Amenities saved:', updatedDraft.amenities);
  };

  const handleNext = () => {
    saveAmenitiesToDraft();
    history.push('/final-review');
  };

  const handleBack = () => {
    saveAmenitiesToDraft();
    history.push('/LocationStepPage');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Property Amenities</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#007bff', // Agoda blue for active step
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '10px'
          }}>
            2
          </div>
          <IonText>
            <h2>Amenities</h2>
          </IonText>
        </div>

        <IonText>
          <p>What amenities does your property offer?</p>
        </IonText>

        <IonList lines="full" className="ion-no-padding">
          <IonItem>
            <IonIcon icon={wifiOutline} slot="start" color="primary" />
            <IonLabel>Wifi Included</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.wifi_included || false}
              onIonChange={(e) => handleAmenityChange('wifi_included', e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={businessOutline} slot="start" color="primary" />
            <IonLabel>Air Conditioning</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.air_conditioning || false}
              onIonChange={(e) => handleAmenityChange('air_conditioning', e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={leafOutline} slot="start" color="primary" />
            <IonLabel>In-Unit Laundry</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.in_unit_laundry || false}
              onIonChange={(e) => handleAmenityChange('in_unit_laundry', e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={fastFoodOutline} slot="start" color="primary" />
            <IonLabel>Dishwasher</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.dishwasher || false}
              onIonChange={(e) => handleAmenityChange('dishwasher', e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={sunnyOutline} slot="start" color="primary" />
            <IonLabel>Balcony / Patio</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.balcony_patio || false}
              onIonChange={(e) => handleAmenityChange('balcony_patio', e.detail.checked)}
            />
          </IonItem>

          <IonCard className="ion-margin-top ion-no-margin-horizontal">
            <IonCardContent>
              <IonItem lines="none" className="ion-no-padding">
                <IonIcon icon={accessibilityOutline} slot="start" color="primary" />
                <IonLabel>Pet Friendly</IonLabel>
              </IonItem>
              <IonGrid className="ion-padding-start">
                <IonRow className="ion-align-items-center">
                  <IonCol size="6">
                    <IonItem lines="none" className="ion-no-padding">
                      <IonLabel>Dogs Allowed</IonLabel>
                      <IonCheckbox
                        slot="end"
                        checked={amenities.pet_friendly?.dogs_allowed || false}
                        onIonChange={(e) => handleAmenityChange('pet_friendly_dogs' as keyof RentalAmenities, e.detail.checked)}
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="6">
                    <IonItem lines="none" className="ion-no-padding">
                      <IonLabel>Cats Allowed</IonLabel>
                      <IonCheckbox
                        slot="end"
                        checked={amenities.pet_friendly?.cats_allowed || false}
                        onIonChange={(e) => handleAmenityChange('pet_friendly_cats' as keyof RentalAmenities, e.detail.checked)}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

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
                {/* Only show "Number of Spots" if a parking type is selected */}
                {amenities.parking?.type && (
                  <IonRow className="ion-align-items-center ion-margin-top">
                    <IonCol size="auto">
                      <IonLabel>Number of Spots:</IonLabel>
                    </IonCol>
                    <IonCol>
                      <IonItem lines="none" className="ion-no-padding">
                        <IonInput
                          type="number"
                          value={amenities.parking?.spots || 0}
                          onIonChange={(e) => handleParkingSpotsChange(parseInt(e.detail.value!, 10) || 0)}
                          min="0"
                          max="100"
                        />
                      </IonItem>
                    </IonCol>
                  </IonRow>
                )}
              </IonGrid>
            </IonCardContent>
          </IonCard>

          <IonItem>
            <IonIcon icon={flashOutline} slot="start" color="primary" />
            <IonLabel>Community Pool</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.community_pool || false}
              onIonChange={(e) => handleAmenityChange('community_pool', e.detail.checked)}
            />
          </IonItem>

          <IonItem>
            <IonIcon icon={businessOutline} slot="start" color="primary" />
            <IonLabel>Fitness Center</IonLabel>
            <IonCheckbox
              slot="end"
              checked={amenities.fitness_center || false}
              onIonChange={(e) => handleAmenityChange('fitness_center', e.detail.checked)}
            />
          </IonItem>
        </IonList>

        <div className="ion-padding-vertical">
          <IonButton expand="block" onClick={handleNext} className="ion-margin-bottom">
            Next
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={handleBack}>
            Back
          </IonButton>
        </div>

        <PublishPropertyButton/>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
        />
      </IonContent>
    </IonPage>
  );
};

export default AmenitiesStepPage;