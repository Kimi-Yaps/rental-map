// src/components/PublishPropertyButton.tsx
import React, { useState, useCallback } from 'react';
import { IonButton, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import { cloudUploadOutline } from 'ionicons/icons';
import supabase from '../../supabaseConfig';
import { Property } from '../components/DbCrud'; // Import RentalDraft from the shared types file
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
      const currentDraftString = localStorage.getItem('Property');
      if (!currentDraftString) {
        throw new Error("No property draft found to publish.");
      }

      const draftData: Property = JSON.parse(currentDraftString);
      // Destructure photos from draftData
      const { pricing, photos, ...propertyData } = draftData;

      // Add photos to the property data to be saved
      const convertedDraft = {
        ...prepareDraftForDB(propertyData),
        photos: photos, // Add photos here
      };

      const { data: insertedProperty, error: propertyError } = await supabase
        .from('properties')
        .upsert([convertedDraft], { onConflict: 'id' })
        .select()
        .single();

      if (propertyError) {
        throw propertyError;
      }

      if (!insertedProperty) {
        throw new Error("Failed to publish property.");
      }

      const propertyId = insertedProperty.id;

      if (pricing && pricing.length > 0) {
        const pricingToInsert = pricing.map(p => ({ ...p, property_id: propertyId }));
        const { error: pricingError } = await supabase
          .from('pricing')
          .upsert(pricingToInsert, { onConflict: 'property_id,price_type' });

        if (pricingError) {
          throw pricingError;
        }
      }

      localStorage.removeItem('Property');
      message = `Successfully published property! ID: ${propertyId}`;
      success = true;
      console.log("Successfully published property and pricing:", insertedProperty);

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
            Publish Property
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
