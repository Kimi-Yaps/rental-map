import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonText,
  IonButton,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFooter,
  isPlatform
} from '@ionic/react';
import NavigationButtons from '../components/NavigationButtons';
import { RentalAmenities, RoomDetails, pricing } from '../components/DbCrud';
import { useHistory } from 'react-router-dom';
import ConditionalHeader from '../components/ConditionalHeader';

// Define the interface for the draft property data, including all expected fields
// from previous steps like the location page.
interface DraftProperty {
  building_name?: string;
  address?: string; // Address from the location page
  property_type?: string;
  HomeType?: string;
  max_guests?: number;
  instant_booking?: boolean;
  house_rules?: string;
  rooms?: RoomDetails[];
  amenities?: RentalAmenities;
  pricing?: pricing[];
  photos?: string[]; // Add photos field
}

import PublishPropertyButton from './PublishPropertyButton';

// The main application component.
const FinalReviewPage: React.FC = () => {
  const [property, setProperty] = useState<DraftProperty | null>(null);
  const history = useHistory();

  useEffect(() => {
    // This effect runs once when the component mounts to load the draft data from localStorage.
    const saved = localStorage.getItem('Property');
    if (saved) {
      try {
        const parsedProperty = JSON.parse(saved);
        setProperty(parsedProperty);
        console.log("Loaded property from localStorage:", parsedProperty);
      } catch (e) {
        console.error("Failed to parse Property from localStorage", e);
        setProperty(null);
      }
    } else {
      console.log("No property found in localStorage.");
    }
  }, []);

  const handlePublishComplete = (success: boolean, message: string) => {
    console.log(`Publish result: ${success ? 'Success' : 'Failure'} - ${message}`);
    if (success) {
      // Clear the draft data from state and local storage on successful publish.
      setProperty(null);
      localStorage.removeItem('Property');
    }
  };

  const handleBack = () => {
    history.push('/photos');
  };

  return (
    <IonPage>
      <ConditionalHeader color="primary">
            <IonTitle>Review & Publish Property</IonTitle>
      </ConditionalHeader>
      <IonContent fullscreen className="ion-padding">
        <IonGrid>
          <IonRow className="ion-align-items-center ion-margin-bottom">
            <IonCol size="auto">
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
                6
              </div>
            </IonCol>
            <IonCol>
              <IonText color="primary">
                <h2>Review Your Listing</h2>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <IonText color="medium">
                <p>Please review all the details you've entered before publishing your property.</p>
              </IonText>
            </IonCol>
          </IonRow>

          {property ? (
            <IonRow>
              <IonCol size="12">
                <IonCard className="ion-margin-top">
                  <IonCardContent>
                    <IonText>
                      <h3>Property Details</h3>
                      <p><strong>Building Name:</strong> {property.building_name || 'N/A'}</p>
                      <p><strong>Address:</strong> {property.address || 'N/A'}</p>
                      <p><strong>Property Type:</strong> {property.property_type || 'N/A'}</p>
                      <p><strong>Home Type:</strong> {property.HomeType || 'N/A'}</p>
                      <p><strong>Max Guests:</strong> {property.max_guests ?? 'N/A'}</p>
                      <p><strong>Instant Booking:</strong> {property.instant_booking ? 'Yes' : 'No'}</p>
                      <p><strong>House Rules:</strong> {property.house_rules || 'N/A'}</p>
                    </IonText>

                    {property.amenities && (
                      <IonText className="ion-margin-top">
                        <h3>Amenities</h3>
                        <ul>
                          {property.amenities.wifi_included && <li>Wi-Fi</li>}
                          {property.amenities.air_conditioning && <li>Air Conditioning</li>}
                          {property.amenities.in_unit_laundry && <li>In-unit Laundry</li>}
                          {property.amenities.dishwasher && <li>Dishwasher</li>}
                          {property.amenities.balcony_patio && <li>Balcony/Patio</li>}
                          {property.amenities.community_pool && <li>Community Pool</li>}
                          {property.amenities.fitness_center && <li>Fitness Center</li>}
                          {property.amenities.pet_friendly && (property.amenities.pet_friendly.dogs_allowed || property.amenities.pet_friendly.cats_allowed) && (
                            <li>
                              Pet Friendly ({[
                                property.amenities.pet_friendly.dogs_allowed ? 'Dogs' : '',
                                property.amenities.pet_friendly.cats_allowed ? 'Cats' : ''
                              ].filter(Boolean).join(' & ')})
                            </li>
                          )}
                          {property.amenities.parking?.type && (
                            <li>Parking: {property.amenities.parking.type} ({property.amenities.parking.spots ?? 'N/A'} spots)</li>
                          )}
                        </ul>
                      </IonText>
                    )}

                    {property.rooms && property.rooms.length > 0 && (
                      <IonText className="ion-margin-top">
                        <h3>Rooms</h3>
                        {property.rooms.map((room, index) => (
                          <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid var(--ion-color-medium)', paddingBottom: '10px' }}>
                            <p><strong>Room {index + 1}: {room.room_type}</strong></p>
                            {room.description && <p>Description: {room.description}</p>}
                            {room.number_of_beds && <p>Beds: {room.number_of_beds}</p>}
                            {room.bed_types && <p>Bed Types: {room.bed_types.join(', ')}</p>}
                            {room.has_ensuite && <p>Ensuite Bathroom</p>}
                            {room.number_of_bathrooms && <p>Bathrooms: {room.number_of_bathrooms}</p>}
                          </div>
                        ))}
                      </IonText>
                    )}

                    {property.pricing && property.pricing.length > 0 && (
                      <IonText className="ion-margin-top">
                        <h3>Pricing</h3>
                        {property.pricing.map((price, index) => (
                          <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid var(--ion-color-medium)', paddingBottom: '10px' }}>
                            <p><strong>{price.price_type.replace(/_/g, ' ')}:</strong> {price.amount} {price.currency}</p>
                          </div>
                        ))}
                      </IonText>
                    )}

                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          ) : (
            <IonRow>
              <IonCol size="12">
                <IonCard color="warning" className="ion-margin-top">
                  <IonCardContent>
                    <IonText color="var(--ion-color-warning-contrast)">
                      <p>No draft property data found. Please go back to previous steps to create a listing.</p>
                    </IonText>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>
        <IonGrid className="ion-padding"> {/* Added padding for consistency */}
          <IonRow className="ion-align-items-center ion-justify-content-between">
            <IonCol size-xs="12" size-md="12"> {/* Changed size-xs to 12 to make it full width */}
              <NavigationButtons
                onBack={handleBack}
                backPath="/photos"
                showNextButton={false}
                rightButton={<IonButton expand="block" size="medium" onClick={() => { /* handle publish click */ }}>Publish</IonButton>}
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default FinalReviewPage;