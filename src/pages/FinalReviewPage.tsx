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

// Define the interface for the draft property data, including all expected fields
// from previous steps like the location page.
interface DraftProperty {
  building_name?: string;
  address?: string; // Address from the location page
  latitude?: number;  // Latitude from the location page
  longitude?: number; // Longitude from the location page
  property_type?: string;
  HomeType?: string;
  max_guests?: number;
  instant_booking?: boolean;
  house_rules?: string;
  amenities?: {
    wifi_included?: boolean;
    air_conditioning?: boolean;
    in_unit_laundry?: boolean;
    dishwasher?: boolean;
    balcony_patio?: boolean;
    community_pool?: boolean;
    fitness_center?: boolean;
    pet_friendly?: {
      dogs_allowed?: boolean;
      cats_allowed?: boolean;
      breed_restrictions?: string[];
    };
    parking?: {
      type?: string;
      spots?: number;
    };
  };
}

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

              <IonText className="ion-margin-top">
                <h3>Location Details</h3>
                <p><strong>Latitude:</strong> {property.latitude?.toFixed(6) || 'N/A'}</p>
                <p><strong>Longitude:</strong> {property.longitude?.toFixed(6) || 'N/A'}</p>
              </IonText>
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
