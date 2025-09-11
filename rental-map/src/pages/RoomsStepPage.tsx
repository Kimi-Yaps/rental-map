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
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/react';
import {
  addCircleOutline,
  removeCircleOutline,
  bedOutline,
  add,
} from 'ionicons/icons';
import supabase from '../supabaseConfig';
import Stepper from '../components/Stepper';
import NavigationButtons from '../components/NavigationButtons';
import { RoomDetails, Property as DbProperty } from '../components/DbCrud';

interface Property extends DbProperty {
  // Override or add client-side specific fields if necessary
  rooms: RoomDetails[]; // Ensure rooms is an array of RoomDetails
  building_name?: string | null; // Make nullable
  house_rules?: string | null; // Make nullable
  max_guests?: number | null; // Make nullable
  instant_booking?: boolean | null; // Make nullable
  is_active?: boolean | null; // Make nullable
  HomeType?: string; // Align with DbProperty's HomeType
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
    owner_id: '', // DbProperty requires owner_id
    address: '',
    property_type: 'apartment', // Default to a valid PropertyType
    bathrooms: 0, // DbProperty requires bathrooms
    bedrooms: {}, // DbProperty requires bedrooms
    pricetype: { currency: 'USD' }, // DbProperty requires pricetype
    rooms: [], // Initialize rooms as an empty array
    created_at: new Date().toISOString(),
    HomeType: undefined, // Initialize as undefined to match DbProperty
  };
};

const RoomsStepPage: React.FC = () => {
  const history = useHistory();
  // State for the list of rooms
  const [rooms, setRooms] = useState<RoomDetails[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // Removed showBackAlert as it's not used with the current NavigationButtons setup

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
  const handleRoomChange = <K extends keyof RoomDetails>(index: number, key: K, value: RoomDetails[K]) => {
    setRooms(prevRooms => {
      const newRooms = [...prevRooms];
      // Ensure the room object exists before trying to update it
      if (newRooms[index]) {
        newRooms[index][key] = value;
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
    history.push('/pricing');
  };

  // Handlers for the "Back" button (removed confirmation alert as it's not used)
  const handleBack = () => {
    // We'll clear the rooms, but not the whole draft, to avoid losing previous steps
    const draft = getProperty();
    const updatedDraft = { ...draft, rooms: [] };
    localStorage.setItem('Property', JSON.stringify(updatedDraft));

    if (draft.id) {
      try {
        supabase
          .from('rental_drafts')
          .update({ rooms_data: [] })
          .eq('id', draft.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error clearing rooms in Supabase:', error);
            }
          });
      } catch (error) {
        console.error('Error clearing rooms to Supabase:', error);
      }
    }
    history.push('/amenities');
  };

  const BED_TYPES = ['King', 'Queen', 'Double', 'Single', 'Bunk Bed'];

  const handleBedCountChange = (roomIndex: number, bedType: string, delta: number) => {
    setRooms(prevRooms => {
      const newRooms = [...prevRooms];
      if (newRooms[roomIndex]) {
        const currentBedCounts = newRooms[roomIndex].bed_counts || {};
        const currentCount = currentBedCounts[bedType] || 0;
        const newCount = Math.max(0, currentCount + delta); // Ensure count doesn't go below 0

        const updatedBedCounts = {
          ...currentBedCounts,
          [bedType]: newCount,
        };

        newRooms[roomIndex].bed_counts = updatedBedCounts;
      }
      saveRoomsToDraft(newRooms); // Save to draft after state is updated
      return newRooms;
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Property Rooms</IonTitle>
        </IonToolbar>
      </IonHeader>
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
                3
              </div>
            </IonCol>
            <IonCol>
              <IonText color="primary">
                <h2>Room Details</h2>
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonText color="medium">
                <p>Please provide details for each room in your property.</p>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
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
                          <IonItem lines="none">
                            <IonLabel position="stacked">Bed Types</IonLabel>
                          </IonItem>
                          <IonGrid className="ion-padding-horizontal">
                            {BED_TYPES.map((bedType) => (
                              <IonRow key={bedType} className="ion-align-items-center ion-margin-bottom">
                                <IonCol size="6">
                                  <IonLabel>{bedType}</IonLabel>
                                </IonCol>
                                <IonCol size="6" className="ion-text-end">
                                  <IonButton
                                    onClick={() => handleBedCountChange(index, bedType, -1)}
                                    disabled={(room.bed_counts?.[bedType] || 0) <= 0}
                                    fill="clear"
                                    size="small"
                                  >
                                    <IonIcon icon={removeCircleOutline} />
                                  </IonButton>
                                  <IonText className="ion-padding-horizontal">
                                    {room.bed_counts?.[bedType] || 0}
                                  </IonText>
                                  <IonButton
                                    onClick={() => handleBedCountChange(index, bedType, 1)}
                                    fill="clear"
                                    size="small"
                                  >
                                    <IonIcon icon={addCircleOutline} />
                                  </IonButton>
                                </IonCol>
                              </IonRow>
                            ))}
                          </IonGrid>
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
                          <Stepper
                            label="Number of Bathrooms"
                            value={room.number_of_bathrooms || 0}
                            onIncrement={() => handleRoomChange(index, 'number_of_bathrooms', (room.number_of_bathrooms || 0) + 1)}
                            onDecrement={() => handleRoomChange(index, 'number_of_bathrooms', (room.number_of_bathrooms || 0) - 1)}
                            min={0}
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
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleAddRoom}
                className="ion-margin-top"
              >
                <IonIcon icon={add} slot="start" />
                Add Room
              </IonButton>
            </IonCol>
          </IonRow>

          </IonGrid>

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
        backPath="/amenities"
      />
    </IonPage>
  );
};

export default RoomsStepPage;
