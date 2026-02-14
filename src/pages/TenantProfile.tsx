import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonAvatar,
  IonText,
  IonIcon,
  IonToast,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import supabase from '../supabaseClient';
import { camera } from 'ionicons/icons';

const TenantProfile: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setFullName(profile.full_name || '');
          setAvatar(profile.avatar_url);
        }
      }
    };
    
    loadProfile();
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `pfp/pfp_Tenant/${userId}_${Date.now()}.${fileExt}`;

    setLoading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('imgvideo-bucket1')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('imgvideo-bucket1')
        .getPublicUrl(filePath);

      if (data) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: data.publicUrl })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }

        setAvatar(data.publicUrl);
        setToastMessage('Profile photo updated successfully');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setToastMessage(error instanceof Error ? error.message : 'Error uploading avatar');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      setToastMessage('Profile updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setToastMessage(error instanceof Error ? error.message : 'Error updating profile');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Tenant Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <div className="ion-text-center ion-margin-bottom">
              <IonAvatar style={{ 
                width: '100px', 
                height: '100px', 
                margin: '0 auto 1rem'
              }}>
                <img 
                  src={avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
                  alt="Profile"
                />
              </IonAvatar>
              
              <IonButton fill="clear" size="small">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <IonIcon icon={camera} slot="start" />
                <IonText>Change Photo</IonText>
              </IonButton>
            </div>

            <IonItem>
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                value={fullName}
                onIonChange={e => setFullName(e.detail.value || '')}
                placeholder="Enter your full name"
              />
            </IonItem>

            <div className="ion-text-center ion-margin-top">
              <IonButton
                expand="block"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color={toastMessage.includes('successfully') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default TenantProfile;
