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
  IonCardContent
} from '@ionic/react';

import { RentalAmenities } from '../components/DbCrud';

interface RoomDetails {
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'other';
  bed_types?: string[]; // Made an array of strings for multiple bed types
  number_of_beds?: number;
  number_of_bathrooms?: number;
  has_ensuite?: boolean;
  description?: string;
  [key: string]: any;
}

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
  };


import PublishPropertyButton from './PublishPropertyButton';

// The main application component.
const FinalReviewPage: React.FC = () => {
  const [property, setProperty] = useState<DraftProperty | null>(null);

  useEffect(() => {
    // This effect runs once when the component mounts to load the draft data from localStorage.
    const saved = localStorage.getItem('Property');
    if (saved) {
      try {
        setProperty(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse Property from localStorage", e);
        setProperty(null);
      }
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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Review & Publish Property</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            marginRight: '10px'
          }}>
            8
          </div>
          <IonText>
            <h2>Review Your Listing</h2>
          </IonText>
        </div>

        <IonText>
          <p>Please review all the details you've entered before publishing your property.</p>
        </IonText>

        {property ? (
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
                    <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
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
            </IonCardContent>
          </IonCard>
        ) : (
          <IonCard color="warning" className="ion-margin-top">
            <IonCardContent>
              <IonText color="dark">
                <p>No draft property data found. Please go back to previous steps to create a listing.</p>
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        <div className="ion-margin-top">
          <PublishPropertyButton onPublishComplete={handlePublishComplete} />
          <IonButton expand="block" fill="outline" className="ion-margin-top" routerLink="/amenities">
            Go Back to Edit
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FinalReviewPage;
