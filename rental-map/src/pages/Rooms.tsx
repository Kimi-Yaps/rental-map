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
  IonButton,
} from '@ionic/react';
import {
  addCircleOutline,
  removeCircleOutline,
  bedOutline,
  add,
} from 'ionicons/icons';
import Stepper from '../components/Stepper';
import NavigationButtons from '../components/NavigationButtons';

interface RoomDetails {
  room_type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'other';
  bed_counts?: { [key: string]: number };
  number_of_bathrooms?: number;
  has_ensuite?: boolean;
  description?: string;
  [key: string]: any;
}

const BED_TYPES = ['King', 'Queen', 'Double', 'Single', 'Bunk Bed'];

const Rooms: React.FC = () => {
  const history = useHistory();
  const [rooms, setRooms] = useState<RoomDetails[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    // Load rooms from Property in localStorage on initial render
    const saved = localStorage.getItem('Property');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setRooms(draft.rooms || []);
      } catch (error) {
        console.error("Failed to parse Property from localStorage", error);
        setRooms([]);
      }
    }
  }, []);

  const saveRoomsToDraft = (updatedRooms: RoomDetails[]) => {
    try {
      const saved = localStorage.getItem('Property');
      const draft = saved ? JSON.parse(saved) : {};
      const updatedDraft = {
        ...draft,
        rooms: updatedRooms,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('Property', JSON.stringify(updatedDraft));
      setToastMessage('Room details saved');
      setShowToast(true);
    } catch (error) {
      console.error('Error saving rooms to localStorage:', error);
      setToastMessage('Error saving room details');
      setShowToast(true);
    }
  };

  const handleRoomChange = (index: number, key: keyof RoomDetails, value: any) => {
    setRooms(prevRooms => {
      const newRooms = [...prevRooms];
      if (newRooms[index]) {
        newRooms[index] = { ...newRooms[index], [key]: value };
      }
      saveRoomsToDraft(newRooms);
      return newRooms;
    });
  };

  const handleAddRoom = () => {
    const newRoom: RoomDetails = {
      room_type: 'bedroom',
      description: '',
      bed_counts: {},
    };
    setRooms(prevRooms => {
      const updatedRooms = [...prevRooms, newRoom];
      saveRoomsToDraft(updatedRooms);
      return updatedRooms;
    });
  };

  const handleRemoveRoom = (index: number) => {
    setRooms(prevRooms => {
      const updatedRooms = prevRooms.filter((_, i) => i !== index);
      saveRoomsToDraft(updatedRooms);
      return updatedRooms;
    });
  };

  const handleBedCountChange = (roomIndex: number, bedType: string, delta: number) => {
    setRooms(prevRooms => {
      const newRooms = [...prevRooms];
      if (newRooms[roomIndex]) {
        const currentBedCounts = newRooms[roomIndex].bed_counts || {};
        const currentCount = currentBedCounts[bedType] || 0;
        const newCount = Math.max(0, currentCount + delta);
        
        newRooms[roomIndex] = {
          ...newRooms[roomIndex],
          bed_counts: {
            ...currentBedCounts,
            [bedType]: newCount,
          },
        };
      }
      saveRoomsToDraft(newRooms);
      return newRooms;
    });
  };

  const handleNext = () => {
    if (rooms.length === 0) {
      setToastMessage('Please add at least one room');
      setShowToast(true);
      return;
    }
    history.push('/photos');
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
                            onDecrement={() => handleRoomChange(index, 'number_of_bathrooms', Math.max(0, (room.number_of_bathrooms || 0) - 1))}
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
        onBack={() => history.push('/location')}
        nextDisabled={rooms.length === 0}
        backPath="/location"
        nextPath="/photos"
      />
    </IonPage>
  );
};

export default Rooms;
