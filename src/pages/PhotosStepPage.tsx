// src/pages/PhotosStepPage.tsx
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
  IonToast,
  IonSpinner,
  IonImg,
  IonAlert,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { camera, arrowBack, arrowForward, trashOutline, videocamOutline } from 'ionicons/icons';
import supabase from '../../supabaseConfig';
import { RentalAmenities , RoomDetails ,pricing } from '../components/DbCrud';



interface Property {
    id: string;
    building_name: string | null;
    address: string;
    property_type: string | null;
    house_rules: string | null;
    max_guests: number | null;
    instant_booking: boolean | null;
    is_active: boolean | null;
    amenities: RentalAmenities | null;
    rooms: RoomDetails[];
    pricing?: pricing[];
    videos: string[];
    photos: string[];
    created_at: string;
    updated_at: string | null;
    HomeType: string | null;
}

// Helper to get or initialize a rental draft from localStorage
const getProperty = (): Property => {
  const saved = localStorage.getItem('Property');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Ensure the photos and videos fields are arrays
      if (!parsed.photos || !Array.isArray(parsed.photos)) {
        parsed.photos = [];
      }
      if (!parsed.videos || !Array.isArray(parsed.videos)) {
        parsed.videos = [];
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
    rooms: [],
    photos: [], // Initialize photos as an empty array
    videos: [], // Initialize videos as an empty array
    created_at: new Date().toISOString(),
    updated_at: null,
    HomeType: null,
  };
};

// Define the Supabase storage bucket name here.
// You must ensure this bucket exists and is correctly configured in your Supabase project.
const STORAGE_BUCKET_NAME = 'imgvideo-bucket1';

const PhotosStepPage: React.FC = () => {
  const history = useHistory();
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState<{ index: number; isVideo: boolean } | null>(null);

  useEffect(() => {
    const draft = getProperty();
    setPhotos(draft.photos || []);
    setVideos(draft.videos || []);
  }, []);

  const saveMediaToDraft = async (updatedPhotos: string[], updatedVideos: string[]) => {
    const draft = getProperty();
    const updatedDraft: Property = {
      ...draft,
      photos: updatedPhotos,
      videos: updatedVideos,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('Property', JSON.stringify(updatedDraft));

    if (updatedDraft.id) {
      try {
        const { error } = await supabase
          .from('rental_drafts')
          .upsert([{
            id: updatedDraft.id,
            photos: updatedPhotos,
            videos: updatedVideos,
            updated_at: updatedDraft.updated_at,
          }], { onConflict: 'id' });

        if (error) {
          console.error('Error saving media to Supabase:', error);
        }
      } catch (error) {
        console.error('Error saving media to Supabase:', error);
      }
    }
    setToastMessage('Media updated successfully!');
    setShowToast(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    setIsUploading(true);
    const files = Array.from(event.target.files);
    const draft = getProperty();
    const propertyId = draft.id;

    if (!propertyId) {
      setToastMessage('Property ID not found. Please complete previous steps first.');
      setShowToast(true);
      setIsUploading(false);
      return;
    }

    const uploadPromises = files.map(async (file) => {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}_${Date.now()}.${fileExt}`;
        
        const isVideo = file.type.startsWith('video/');
        const filePath = isVideo
          ? `Propertie/Propertie_Video/${fileName}`
          : `Propertie/Propertie_Img/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET_NAME)
          .getPublicUrl(filePath);

        return { url: publicUrl, isVideo };
      } catch (error) {
        console.error('Upload error:', error);
        setToastMessage(`Upload failed: ${error.message}`);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const newPhotos = results
      .filter((result): result is { url: string; isVideo: boolean } => result !== null && !result.isVideo)
      .map(result => result.url);
    
    const newVideos = results
      .filter((result): result is { url: string; isVideo: boolean } => result !== null && result.isVideo)
      .map(result => result.url);

    if (newPhotos.length > 0 || newVideos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos];
      const updatedVideos = [...videos, ...newVideos];
      setPhotos(updatedPhotos);
      setVideos(updatedVideos);
      saveMediaToDraft(updatedPhotos, updatedVideos);
      setToastMessage('Media uploaded successfully!');
    } else {
      setToastMessage('Some media failed to upload.');
    }

    setShowToast(true);
    setIsUploading(false);
  };

  const handleDeleteMedia = (index: number, isVideo: boolean) => {
    setShowDeleteAlert({ index, isVideo });
  };

  const confirmDelete = async () => {
    if (showDeleteAlert !== null) {
      let updatedPhotos = [...photos];
      let updatedVideos = [...videos];

      if (showDeleteAlert.isVideo) {
        updatedVideos = videos.filter((_, index) => index !== showDeleteAlert.index);
        setVideos(updatedVideos);
      } else {
        updatedPhotos = photos.filter((_, index) => index !== showDeleteAlert.index);
        setPhotos(updatedPhotos);
      }
      
      saveMediaToDraft(updatedPhotos, updatedVideos);
    }
    setShowDeleteAlert(null);
  };

  const cancelDelete = () => {
    setShowDeleteAlert(null);
  };

  const handleNext = () => {
    saveMediaToDraft(photos, videos);
    history.push('/finalReview');
  };

  const handleBack = () => {
    history.push('/pricingStepPage');
  };
  
  // Helper function to check if a URL is a video based on its extension
  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const fileExtension = url.split('.').pop()?.toLowerCase();
    return fileExtension && videoExtensions.includes(`.${fileExtension}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Upload Media</IonTitle>
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
                backgroundColor: '#007bff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                5
              </div>
            </IonCol>
            <IonCol>
              <IonText>
                <h2>Property Photos & Videos</h2>
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonText>
                <p>Upload photos and videos of your property. Good media attracts more tenants.</p>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonCard>
                <IonCardContent>
                  <IonItem lines="none">
                    <input type="file" id="fileInput" hidden multiple onChange={handleFileChange} accept="image/*,video/*" />
                    <IonButton expand="block" fill="outline" onClick={() => document.getElementById('fileInput')?.click()}>
                      <IonIcon icon={camera} slot="start" />
                      Select Media
                    </IonButton>
                  </IonItem>
                  {isUploading && <IonSpinner name="crescent" />}
                  <IonList>
                    {[...photos, ...videos].map((mediaUrl, index) => (
                      <IonItem key={index}>
                        {isVideoUrl(mediaUrl) ? (
                          <>
                            <IonIcon icon={videocamOutline} slot="start" style={{ marginRight: '10px' }}/>
                            <video src={mediaUrl} controls style={{ width: '100px', height: 'auto', marginRight: '10px' }} />
                          </>
                        ) : (
                          <IonImg src={mediaUrl} style={{ width: '100px', height: 'auto', marginRight: '10px' }} />
                        )}
                        <IonLabel>{isVideoUrl(mediaUrl) ? `Video ${index + 1}` : `Photo ${index + 1}`}</IonLabel>
                        <IonButton
                          slot="end"
                          color="danger"
                          fill="clear"
                          onClick={() => handleDeleteMedia(index, isVideoUrl(mediaUrl))}
                        >
                          <IonIcon icon={trashOutline} slot="icon-only" />
                        </IonButton>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow className="ion-padding-vertical ion-justify-content-center">
            <IonCol size-xs="12" size-md="6">
              <IonButton expand="block" onClick={handleNext} className="ion-margin-bottom">
                Next
                <IonIcon slot="end" icon={arrowForward} />
              </IonButton>
            </IonCol>
            <IonCol size-xs="12" size-md="6">
              <IonButton expand="block" fill="outline" onClick={handleBack}>
                <IonIcon slot="start" icon={arrowBack} />
                Back
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonAlert
          isOpen={showDeleteAlert !== null}
          onDidDismiss={cancelDelete}
          header={'Delete Media?'}
          message={'Are you sure you want to delete this file?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: cancelDelete,
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: confirmDelete,
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default PhotosStepPage;
