// src/components/PublishPropertyButton.tsx
import React, { useState, useCallback } from 'react';
import { IonButton, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { cloudUploadOutline } from 'ionicons/icons';
import supabase from '../../supabaseConfig';
import { RentalDraft } from '../components/DbCrud'; // Import RentalDraft from the shared types file
import { prepareDraftForDB } from '../components/DataConvertion'; // Import the conversion function from its new utility file

interface PublishPropertyButtonProps {
 // Optional: A callback to notify parent components of success/failure
 onPublishComplete?: (success: boolean, message: string) => void;
}

const PublishPropertyButton: React.FC<PublishPropertyButtonProps> = ({ onPublishComplete }) => {
 const [isPublishing, setIsPublishing] = useState(false);
 const [showToast, setShowToast] = useState(false);
 const [toastMessage, setToastMessage] = useState('');

 const handlePublish = useCallback(async () => {
  setIsPublishing(true);
  let success = false;
  let message = '';
  try {
   // Get the current rental draft from localStorage
   const currentDraftString = localStorage.getItem('rentalDraft');
   let draftData: RentalDraft = {};

   if (currentDraftString) {
    try {
     draftData = JSON.parse(currentDraftString);
    } catch (parseError) {
     console.error("Error parsing rental draft from localStorage:", parseError);
     throw new Error("Failed to load saved property data.");
    }
   } else {
    throw new Error("No property draft found to publish.");
   }

   // Convert the draft data for database insertion using the utility function
   const convertedDraft = prepareDraftForDB(draftData);

   console.log("Original draft data for publish:", draftData);
   console.log("Converted draft data for publish:", convertedDraft);
   // Optional: Add more console logs for specific fields if debugging conversion
   console.log("Property Type for DB:", convertedDraft.property_type);
   console.log("Home Type for DB:", convertedDraft.HomeType);
   console.log("Address for DB:", convertedDraft.address);
   console.log("Latitude for DB:", convertedDraft.latitude);
   console.log("Longitude for DB:", convertedDraft.longitude);


   // Insert into Supabase
   const { data: insertedData, error } = await supabase
    .from('properties')
    .insert([convertedDraft]) // Use the prepared draft
    .select();

   if (error) {
    throw error;
   }

   // Success - clear the draft and show success message
   localStorage.removeItem('rentalDraft');
   message = `Successfully published property! ID: ${insertedData[0]?.id || 'N/A'}`;
   success = true;
   console.log("Successfully inserted property:", insertedData);

  } catch (error: any) {
   console.error("Database publishing error:", error);
   message = `Error publishing property: ${error.message || 'Unknown error'}`;
   success = false;
  } finally {
   setIsPublishing(false);
   setToastMessage(message);
   setShowToast(true);
   if (onPublishComplete) {
    onPublishComplete(success, message);
   }
  }
 }, [onPublishComplete]);

 return (
  <>
   <IonButton
    expand="block"
    onClick={handlePublish}
    disabled={isPublishing}
    color="success"
   >
    {isPublishing ? (
     <IonSpinner name="crescent" />
    ) : (
     <>
      <IonIcon icon={cloudUploadOutline} slot="start" />
      Publish Property (Step 8)
     </>
    )}
   </IonButton>
   <IonToast
    isOpen={showToast}
    onDidDismiss={() => setShowToast(false)}
    message={toastMessage}
    duration={4000}
   />
  </>
 );
};

export default PublishPropertyButton;
