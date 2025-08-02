// src/pages/FinalReviewPage.tsx
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonText, IonButton, IonCard, IonCardContent } from '@ionic/react'; // Import IonCard, IonCardContent
import PublishPropertyButton from './PublishPropertyButton';
import { RentalDraft } from "../components/DbCrud";

const FinalReviewPage: React.FC = () => {
  const [rentalDraft, setRentalDraft] = useState<RentalDraft | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('rentalDraft');
    if (saved) {
      try {
        setRentalDraft(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse rental draft from localStorage", e);
        setRentalDraft(null);
      }
    }
  }, []);

  const handlePublishComplete = (success: boolean, message: string) => {
    console.log(`Publish result: ${success ? 'Success' : 'Failure'} - ${message}`);
    // Optional: After successful publish, you might want to redirect
    // or clear the displayed draft.
    if (success) {
      setRentalDraft(null); // Clear displayed draft as it's now published
      // history.push('/dashboard'); // Example: Redirect to a dashboard
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

        {/* Display a summary of rentalDraft here */}
        {rentalDraft ? (
          <IonCard className="ion-margin-top">
            <IonCardContent>
              <IonText>
                <h3>Property Details</h3>
                <p><strong>Building Name:</strong> {rentalDraft.propertyName || rentalDraft.building_name || 'N/A'}</p>
                <p><strong>Address:</strong> {rentalDraft.address || 'N/A'}</p>
                <p><strong>Property Type:</strong> {rentalDraft.propertyTypeCategory || 'N/A'}</p>
                <p><strong>Home Type:</strong> {rentalDraft.HomeTypesCategory || 'N/A'}</p>
                <p><strong>Max Guests:</strong> {rentalDraft.maxGuests || 'N/A'}</p>
                <p><strong>Instant Booking:</strong> {rentalDraft.instantBooking ? 'Yes' : 'No'}</p>
                <p><strong>House Rules:</strong> {rentalDraft.houseRules || 'N/A'}</p>
                <p><strong>Check-in Time:</strong> {rentalDraft.check_in_time || 'N/A'}</p>
                <p><strong>Check-out Time:</strong> {rentalDraft.check_out_time || 'N/A'}</p>
              </IonText>

              {rentalDraft.amenities && (
                <IonText className="ion-margin-top">
                  <h3>Amenities</h3>
                  <ul>
                    {rentalDraft.amenities.wifi_included && <li>Wi-Fi</li>}
                    {rentalDraft.amenities.air_conditioning && <li>Air Conditioning</li>}
                    {rentalDraft.amenities.in_unit_laundry && <li>In-unit Laundry</li>}
                    {rentalDraft.amenities.dishwasher && <li>Dishwasher</li>}
                    {rentalDraft.amenities.balcony_patio && <li>Balcony/Patio</li>}
                    {rentalDraft.amenities.community_pool && <li>Community Pool</li>}
                    {rentalDraft.amenities.fitness_center && <li>Fitness Center</li>}
                    {rentalDraft.amenities.pet_friendly && (rentalDraft.amenities.pet_friendly.dogs_allowed || rentalDraft.amenities.pet_friendly.cats_allowed) && (
                      <li>Pet Friendly ({rentalDraft.amenities.pet_friendly.dogs_allowed && 'Dogs '}{rentalDraft.amenities.pet_friendly.cats_allowed && 'Cats '})
                        {rentalDraft.amenities.pet_friendly.breed_restrictions && rentalDraft.amenities.pet_friendly.breed_restrictions.length > 0 &&
                          ` (Restrictions: ${rentalDraft.amenities.pet_friendly.breed_restrictions.join(', ')})`}
                      </li>
                    )}
                    {rentalDraft.amenities.parking && rentalDraft.amenities.parking.type && (
                      <li>Parking: {rentalDraft.amenities.parking.type} ({rentalDraft.amenities.parking.spots || 'N/A'} spots)</li>
                    )}
                  </ul>
                </IonText>
              )}
               <IonText className="ion-margin-top">
                <h3>Location Details</h3>
                <p><strong>Latitude:</strong> {rentalDraft.latitude?.toFixed(6) || 'N/A'}</p>
                <p><strong>Longitude:</strong> {rentalDraft.longitude?.toFixed(6) || 'N/A'}</p>
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
          <IonButton expand="block" fill="outline" className="ion-margin-top" routerLink="/amenities"> {/* Adjust route to your previous step */}
            Go Back to Edit
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FinalReviewPage;