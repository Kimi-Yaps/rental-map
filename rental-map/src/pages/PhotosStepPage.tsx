// src/pages/PhotosStepPage.tsx
import React, { useState, useEffect } from 'react';
import { useIonRouter } from '@ionic/react';
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
  IonCol,
  IonModal,
  IonButtons
} from '@ionic/react';
import { camera, trashOutline, videocamOutline, close } from 'ionicons/icons';
import supabase from '../supabaseConfig';
import { RentalAmenities, RoomDetails, pricing } from '../components/DbCrud';
import NavigationButtons from '../components/NavigationButtons';
import { v4 as uuidv4 } from 'uuid';
import { savePropertyDraft } from '../services/DraftService';

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

const getProperty = (): Property => {
  const saved = localStorage.getItem('Property');
  let parsed: Partial<Property> = {}; // Use Partial to allow missing fields initially

  if (saved) {
    try {
      parsed = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse Property from localStorage, initializing new.", e);
      // If parsing fails, treat as if no saved data exists
      parsed = {};
    }
  }

  // Ensure photos and videos are arrays
  if (!parsed.photos || !Array.isArray(parsed.photos)) {
    parsed.photos = [];
  }
  if (!parsed.videos || !Array.isArray(parsed.videos)) {
    parsed.videos = [];
  }

  // Merge with default structure, preserving existing values
  return {
    id: parsed.id || '', // Ensure ID is always present
    building_name: parsed.building_name ?? null,
    address: parsed.address ?? '',
    property_type: parsed.property_type ?? null, // Preserve existing or default to null
    house_rules: parsed.house_rules ?? null,
    max_guests: parsed.max_guests ?? null,
    instant_booking: parsed.instant_booking ?? null,
    is_active: parsed.is_active ?? null,
    amenities: parsed.amenities ?? {},
    rooms: parsed.rooms ?? [],
    pricing: parsed.pricing, // Preserve existing pricing
    videos: parsed.videos,
    photos: parsed.photos,
    created_at: parsed.created_at || new Date().toISOString(),
    updated_at: parsed.updated_at ?? null,
    HomeType: parsed.HomeType ?? null, // Preserve existing or default to null
  };
};

const STORAGE_BUCKET_NAME = 'imgvideo-bucket1';

const PhotosStepPage: React.FC = () => {
  const ionRouter = useIonRouter();
  const [photos, setPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState<{ index: number; isVideo: boolean } | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [showDroppableModal, setShowDroppableModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const draft = getProperty();
    setPhotos(draft.photos || []);
    setVideos(draft.videos || []);
  }, []);

  const saveMediaToDraft = async (updatedPhotos: string[], updatedVideos: string[]) => {
    try {
      const draft = getProperty();
      const updatedDraft: Property = {
        ...draft,
        photos: updatedPhotos,
        videos: updatedVideos,
      };

      // Use the DraftService to save
      await savePropertyDraft({
        ...updatedDraft,
        id: draft.id,
        photos: updatedPhotos,
        videos: updatedVideos,
      });

      setToastMessage('Media updated successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('Error saving media to draft:', error);
      setToastMessage('Error saving media. Please try again.');
      setShowToast(true);
    }
  };

  const handleFileChange = async (filesToUpload: FileList | null) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    setIsUploading(true);
    const files = Array.from(filesToUpload);
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
        const fileName = `${propertyId}_${uuidv4()}.${fileExt}`;

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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setToastMessage(`Upload failed: ${errorMessage}`);
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
      const updatedPhotos = [...photos];
      const updatedVideos = [...videos];

      if (showDeleteAlert.isVideo) {
        updatedVideos.splice(showDeleteAlert.index, 1);
        setVideos(updatedVideos);
      } else {
        updatedPhotos.splice(showDeleteAlert.index, 1);
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
    ionRouter.push('/finalReview', 'forward');
  };

  const handleBack = () => {
    ionRouter.push('/pricing', 'back');
  };

  const isVideoUrl = (url: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const fileExtension = url.split('.').pop()?.toLowerCase();
    return !!fileExtension && videoExtensions.includes(`.${fileExtension}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
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
                backgroundColor: 'var(--ion-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ion-color-primary-contrast)',
                fontWeight: 'bold',
                marginRight: '10px'
              }}>
                5
              </div>
            </IonCol>
            <IonCol>
              <IonText color="primary">
                <h2>Property Photos & Videos</h2>
              </IonText>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12">
              <IonText color="medium">
                <p>Upload photos and videos of your property. Good media attracts more tenants.</p>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow className="ion-justify-content-center">
            <IonCol size-xs="12" size-md="8" size-lg="6">
              <IonCard>
                <IonCardContent>
                  <IonItem lines="none">
                    <input
                      type="file"
                      id="fileInput"
                      hidden
                      multiple
                      onChange={(e) => handleFileChange(e.target.files)}
                      accept="image/*,video/*"
                      ref={fileInputRef} // Added ref to the input
                    />
                    <IonButton expand="block" fill="outline" onClick={() => setShowDroppableModal(true)}>
                      <IonIcon icon={camera} slot="start" />
                      Select Media
                    </IonButton>
                  </IonItem>
                  {isUploading && <IonSpinner name="crescent" />}
                  <IonList>
                    {[...photos, ...videos].map((mediaUrl, index) => (
                      <IonItem key={index} button onClick={() => {
                        setSelectedMedia({ url: mediaUrl, isVideo: isVideoUrl(mediaUrl) });
                        setShowMediaModal(true);
                      }}>
                        {isVideoUrl(mediaUrl) ? (
                          <>
                            <IonIcon icon={videocamOutline} slot="start" style={{ marginRight: '10px' }} />
                            <video src={mediaUrl} style={{ width: '100px', height: 'auto', marginRight: '10px' }} />
                          </>
                        ) : (
                          <IonImg src={mediaUrl} style={{ width: '100px', height: 'auto', marginRight: '10px' }} />
                        )}
                        <IonLabel>{isVideoUrl(mediaUrl) ? `Video ${index + 1}` : `Photo ${index + 1}`}</IonLabel>
                        <IonButton
                          slot="end"
                          color="danger"
                          fill="clear"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedia(index, isVideoUrl(mediaUrl));
                          }}
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
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
        />

        {/* Droppable Media Upload Modal */}
        <IonModal isOpen={showDroppableModal} onDidDismiss={() => setShowDroppableModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Upload Media</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDroppableModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div
              style={{
                border: '2px dashed var(--ion-color-medium)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'var(--ion-color-medium)',
                fontSize: '1.2em',
                cursor: 'pointer',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e.dataTransfer.files);
                setShowDroppableModal(false);
              }}
              onClick={() => fileInputRef.current?.click()} // Use the ref to trigger the file input
            >
              <p>Drag & Drop your photos/videos here, or click to browse</p>
            </div>
            {isUploading && <IonSpinner name="crescent" />}
          </IonContent>
        </IonModal>

        <IonModal isOpen={showMediaModal} onDidDismiss={() => setShowMediaModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{selectedMedia?.isVideo ? 'Video Preview' : 'Image Preview'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMediaModal(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            {selectedMedia && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                {selectedMedia.isVideo ? (
                  <video src={selectedMedia.url} controls style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px' }} />
                ) : (
                  <IonImg src={selectedMedia.url} style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px' }} />
                )}
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
      <NavigationButtons
        onNext={handleNext}
        onBack={handleBack}
        backPath="/pricing"
        showNextButton={true}
      />
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
    </IonPage>
  );
};

export default PhotosStepPage;
