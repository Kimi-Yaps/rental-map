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
  IonList,
  IonListHeader,
  IonToast,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { camera, business, card, call } from 'ionicons/icons';
import { PropertyOwner } from '../interfaces/PropertyOwner';

const LandlordProfile: React.FC = () => {
  const [ownerData, setOwnerData] = useState<Partial<PropertyOwner>>({});
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  interface Property {
    id: string;
    title: string;
    address: string;
    monthly_rent: number;
    owner_id: string;
  }
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data: owner, error } = await supabase
          .from('property_owners')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          setToastMessage('Error loading profile: ' + error.message);
          setShowToast(true);
          return;
        }
        
        if (owner) {
          setOwnerData(owner);
        }

        // Load properties owned by this landlord
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', session.user.id);

        if (propertiesError) {
          setToastMessage('Error loading properties: ' + propertiesError.message);
          setShowToast(true);
          return;
        }

        if (propertiesData) {
          setProperties(propertiesData);
        }
      }
    };
    
    loadProfile();
  }, []);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `pfp/pfp_Landlord/${userId}_${Date.now()}.${fileExt}`;

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
        const profile_photo = {
          url: data.publicUrl,
          path: filePath,
          filename: file.name,
          uploaded_at: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('property_owners')
          .update({ profile_photo })
          .eq('id', userId);

        if (updateError) {
          throw updateError;
        }

        setOwnerData(prev => ({
          ...prev,
          profile_photo
        }));
        setToastMessage('Profile photo updated successfully');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setToastMessage(error instanceof Error ? error.message : 'Error uploading profile photo');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const updates = {
        ...ownerData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('property_owners')
        .update(updates)
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
          <IonTitle>Landlord Profile</IonTitle>
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
                  src={ownerData.profile_photo?.url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} 
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
              <IonLabel position="stacked">Full Name *</IonLabel>
              <IonInput
                value={ownerData.full_name}
                onIonChange={e => setOwnerData(prev => ({ ...prev, full_name: e.detail.value || '' }))}
                placeholder="Enter your full name"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email *</IonLabel>
              <IonInput
                value={ownerData.email}
                onIonChange={e => setOwnerData(prev => ({ ...prev, email: e.detail.value || '' }))}
                type="email"
                placeholder="Enter your email"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Phone Number *</IonLabel>
              <IonInput
                value={ownerData.phone_number}
                onIonChange={e => setOwnerData(prev => ({ ...prev, phone_number: e.detail.value || '' }))}
                type="tel"
                placeholder="Enter your phone number"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">IC Number *</IonLabel>
              <IonInput
                value={ownerData.ic_number}
                onIonChange={e => setOwnerData(prev => ({ ...prev, ic_number: e.detail.value || '' }))}
                placeholder="Enter your IC number"
                required
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Bank Name</IonLabel>
              <IonInput
                value={ownerData.bank_name}
                onIonChange={e => setOwnerData(prev => ({ ...prev, bank_name: e.detail.value || '' }))}
                placeholder="Enter your bank name"
              />
            </IonItem>

            <IonItem className="ion-margin-bottom">
              <IonLabel position="stacked">Bank Account Number</IonLabel>
              <IonInput
                value={ownerData.bank_account_number}
                onIonChange={e => setOwnerData(prev => ({ ...prev, bank_account_number: e.detail.value || '' }))}
                placeholder="Enter your bank account number"
              />
            </IonItem>

            <div className="ion-text-center">
              <IonButton
                expand="block"
                onClick={handleUpdateProfile}
                disabled={loading || !ownerData.full_name || !ownerData.email || !ownerData.phone_number || !ownerData.ic_number}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardContent>
            <IonList>
              <IonListHeader>
                <IonLabel>
                  <h1>Your Properties</h1>
                </IonLabel>
              </IonListHeader>
              
              {properties.map(property => (
                <IonItem key={property.id}>
                  <IonIcon icon={business} slot="start" />
                  <IonLabel>
                    <h2>{property.title}</h2>
                    <p>{property.address}</p>
                    <p>RM {property.monthly_rent}/month</p>
                  </IonLabel>
                </IonItem>
              ))}

              {properties.length === 0 && (
                <IonItem>
                  <IonLabel className="ion-text-center">
                    <p>No properties listed yet</p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>

            <div className="ion-text-center ion-margin-top">
              <IonButton
                expand="block"
                routerLink="/landlord"
                color="secondary"
              >
                Add New Property
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

export default LandlordProfile;
