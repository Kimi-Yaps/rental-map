// src/pages/RoomsStepPage.tsx
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
  IonList,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonInput,
  IonAlert,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/react';
import {
  addCircleOutline,
  removeCircleOutline,
  bedOutline,
  add,
  close,
  chevronBackOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import supabase from '../../supabaseConfig';

// Import the user's provided interfaces
interface RoomDetails {
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'other';
  bed_types?: string[]; // Made an array of strings for multiple bed types
  number_of_beds?: number;
  number_of_bathrooms?: number;
  has_ensuite?: boolean;
  description?: string;
  [key: string]: any;
}

// Helper to get or initialize a rental draft from localStorage
// Updated to handle an array of rooms
const getProperty = (): Property => {
  const saved = localStorage.getItem('Property');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure the rooms field is an array, or initialize it
      if (!parsed.rooms || !Array.isArray(parsed.rooms)) {
        parsed.rooms = [];
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse Property from localStorage, initializing new.", e);
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
    amenities: {},
    rooms: [], // Initialize rooms as an empty array
    created_at: new Date().toISOString(),
    updated_at: null,
    HomeType: null,
  };
};

const RoomsStepPage: React.FC = () => {
  const history = useHistory();
  // State for the list of rooms
  const [rooms, setRooms] = useState<RoomDetails[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showBackAlert, setShowBackAlert] = useState(false);

  useEffect(() => {
    // Load rooms from Property in localStorage on initial render
    const draft = getProperty();
    setRooms(draft.rooms || []);
  }, []);

  // Function to save the current rooms to localStorage and Supabase
  const saveRoomsToDraft = async (updatedRooms: RoomDetails[]) => {
    const draft = getProperty();
    const updatedDraft: Property = {
      ...draft,
      rooms: updatedRooms,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('Property', JSON.stringify(updatedDraft));

    // Also save to Supabase if draft has an ID
    if (updatedDraft.id) {
      try {
        const { error } = await supabase
          .from('rental_drafts')
          // Assuming 'rooms' is a JSONB column in your table
          .upsert([{
            id: updatedDraft.id,
            rooms_data: updatedRooms,
            updated_at: updatedDraft.updated_at,
          }], { onConflict: 'id' });

        if (error) {
          console.error('Error saving rooms to Supabase:', error);
        }
      } catch (error) {
        console.error('Error saving rooms to Supabase:', error);
      }
    }
    setToastMessage('Room details saved!');
    setShowToast(true);
    console.log('Rooms saved:', updatedDraft.rooms);
  };

  // Handler for updating a room's details
  const handleRoomChange = (index: number, key: keyof RoomDetails, value: any) => {
    setRooms(prevRooms => {
      const newRooms = [...prevRooms];
      // Ensure the room object exists before trying to update it
      if (newRooms[index]) {
        (newRooms[index] as any)[key] = value;
      }
      saveRoomsToDraft(newRooms);
      return newRooms;
    });
  };

  // Handler for adding a new room
  const handleAddRoom = () => {
    const newRoom: RoomDetails = {
      room_type: 'bedroom', // Default to a bedroom
      description: '',
    };
    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    saveRoomsToDraft(updatedRooms);
  };

  // Handler for removing a room
  const handleRemoveRoom = (index: number) => {
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
    saveRoomsToDraft(updatedRooms);
  };

  // Handler for the "Next" button
  const handleNext = () => {
    saveRoomsToDraft(rooms);
    // You'll need to define the next route, e.g., for pricing or photos
    history.push('/finalReview');
  };

  // Handlers for the "Back" button with confirmation alert
  const handleBack = () => {
    setShowBackAlert(true);
  };

  const confirmBack = async () => {
    setShowBackAlert(false);
    // We'll clear the rooms, but not the whole draft, to avoid losing previous steps
    const draft = getProperty();
    const updatedDraft = { ...draft, rooms: [] };
    localStorage.setItem('Property', JSON.stringify(updatedDraft));

    if (draft.id) {
      try {
        const { error } = await supabase
          .from('rental_drafts')
          .update({ rooms_data: [] })
          .eq('id', draft.id);

        if (error) {
          console.error('Error clearing rooms in Supabase:', error);
        }
      } catch (error) {
        console.error('Error clearing rooms in Supabase:', error);
      }
    }
    history.push('/AmenitiesStepPage');
  };

  const cancelBack = () => {
    setShowBackAlert(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Property Rooms</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        {/* Step Indicator */}
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
            3
          </div>
          <IonText>
            <h2>Room Details</h2>
          </IonText>
        </div>
        <IonText>
          <p>Please provide details for each room in your property.</p>
        </IonText>

        <IonList lines="full" className="ion-no-padding">
          {rooms.map((room, index) => (
            <IonCard key={index} className="ion-margin-top ion-no-margin-horizontal">
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <IonItem lines="none" className="ion-no-padding">
                    <IonIcon icon={bedOutline} slot="start" color="primary" />
                    <IonLabel position="stacked">Room {index + 1}</IonLabel>
                  </IonItem>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={() => handleRemoveRoom(index)}
                    size="small"
                  >
                    <IonIcon icon={removeCircleOutline} slot="icon-only" />
                  </IonButton>
                </div>
                <IonItem lines="none">
                  <IonLabel position="stacked">Room Type</IonLabel>
                  <IonSelect
                    value={room.room_type}
                    onIonChange={(e) => handleRoomChange(index, 'room_type', e.detail.value)}
                  >
                    <IonSelectOption value="bedroom">Bedroom</IonSelectOption>
                    <IonSelectOption value="bathroom">Bathroom</IonSelectOption>
                    <IonSelectOption value="kitchen">Kitchen</IonSelectOption>
                    <IonSelectOption value="living_room">Living Room</IonSelectOption>
                    <IonSelectOption value="dining_room">Dining Room</IonSelectOption>
                    <IonSelectOption value="other">Other</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Conditional fields based on room type */}
                {room.room_type === 'bedroom' && (
                  <>
                    <IonItem>
                      <IonLabel position="stacked">Number of Beds</IonLabel>
                      <IonInput
                        type="number"
                        min="0"
                        value={room.number_of_beds}
                        onIonChange={(e) => handleRoomChange(index, 'number_of_beds', parseInt(e.detail.value!, 10) || 0)}
                      />
                    </IonItem>
                    <IonItem>
                      <IonLabel position="stacked">Bed Types (e.g., 'King', 'Queen')</IonLabel>
                      <IonInput
                        placeholder="Comma-separated bed types"
                        value={room.bed_types?.join(', ') || ''}
                        onIonChange={(e) => handleRoomChange(index, 'bed_types', e.detail.value ? e.detail.value.split(',').map(s => s.trim()) : [])}
                      />
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Has Ensuite Bathroom?</IonLabel>
                      <IonToggle
                        slot="end"
                        checked={room.has_ensuite || false}
                        onIonChange={(e) => handleRoomChange(index, 'has_ensuite', e.detail.checked)}
                      />
                    </IonItem>
                  </>
                )}
                {room.room_type === 'bathroom' && (
                  <IonItem>
                    <IonLabel position="stacked">Number of Bathrooms</IonLabel>
                    <IonInput
                      type="number"
                      min="0"
                      value={room.number_of_bathrooms}
                      onIonChange={(e) => handleRoomChange(index, 'number_of_bathrooms', parseInt(e.detail.value!, 10) || 0)}
                    />
                  </IonItem>
                )}
                <IonItem>
                  <IonLabel position="stacked">Description (optional)</IonLabel>
                  <IonInput
                    placeholder="e.g., 'Master bedroom with a view.'"
                    value={room.description}
                    onIonChange={(e) => handleRoomChange(index, 'description', e.detail.value)}
                  />
                </IonItem>
              </IonCardContent>
            </IonCard>
          ))}
        </IonList>

        <IonButton
          expand="block"
          fill="outline"
          onClick={handleAddRoom}
          className="ion-margin-top"
        >
          <IonIcon icon={add} slot="start" />
          Add Room
        </IonButton>

        <div className="ion-padding-vertical">
          <IonButton expand="block" onClick={handleNext} className="ion-margin-bottom">
            Next
            <IonIcon slot="end" icon={arrowForwardOutline} />
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={handleBack}>
            <IonIcon slot="start" icon={chevronBackOutline} />
            Back
          </IonButton>
        </div>

        {/* Back confirmation alert */}
        <IonAlert
          isOpen={showBackAlert}
          onDidDismiss={cancelBack}
          header="Go Back?"
          message="Going back will clear your current room details. Are you sure you want to continue?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: cancelBack
            },
            {
              text: 'Yes, Go Back',
              role: 'confirm',
              handler: confirmBack
            }
          ]}
        />

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

export default RoomsStepPage;
