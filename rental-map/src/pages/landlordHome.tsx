import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonGrid,
  IonHeader,
  IonPage,
  IonRow,
  IonCol,
  IonButton,
  IonToolbar,
  IonTitle,
  IonText,
  IonButtons,
  IonAlert,
  IonCard,
  IonCardContent,
  IonSpinner,
  useIonAlert,
  IonIcon
} from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { supabase } from '../supabaseClient';
import { personCircleOutline, checkmarkCircleOutline, documentsOutline, homeOutline } from 'ionicons/icons';

interface PropertyOwner {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  ic_number: string;
  created_at?: string;
  updated_at?: string;
  is_verified?: boolean;
}

const LandLordHome: React.FC = () => {
  const ionRouter = useIonRouter();
  const [ownerData, setOwnerData] = useState<PropertyOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          ionRouter.push('/login', 'root');
          return;
        }

        // Try to get the owner profile
        const { data: owner, error } = await supabase
          .from('property_owners')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching owner profile:', error);
          setOwnerData(null);
          // Redirect to login if there's a serious error
          ionRouter.push('/login');
          return;
        }

        if (!owner) {
          console.log('No owner profile found, creating one...');
          // Create a basic profile if none exists
          const propertyOwnerData: PropertyOwner = {
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || 'New User',
            email: session.user.email || '',
            phone_number: '',
            ic_number: '',
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: createError } = await supabase
            .from('property_owners')
            .insert([propertyOwnerData]);

          if (createError) {
            console.error('Error creating owner profile:', createError);
            ionRouter.push('/login');
            return;
          }

          setOwnerData(propertyOwnerData);
        } else {
          setOwnerData(owner);
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [ionRouter]);

  const handleListProperty = () => {
    if (!ownerData || !ownerData.phone_number || !ownerData.ic_number) {
      presentAlert({
        header: 'Complete Your Profile',
        message: 'Please complete your landlord profile before listing a property. We need your phone number and IC number for verification.',
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel'
          },
          {
            text: 'Complete Profile',
            role: 'confirm',
            handler: () => {
              ionRouter.push('/landlordProfile');
            }
          }
        ]
      });
      return;
    }
    ionRouter.push("/propertyType", "forward");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Landlord Home</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => ionRouter.push('/landlordProfile', 'forward')}>
              <IonText>{ownerData?.full_name || 'Profile'}</IonText>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        ) : (
          <IonGrid>
            <IonRow className="ion-justify-content-center ion-text-center">
              <IonCol size-xs="12" size-md="8" size-lg="6">
                <IonText color="primary">
                  <h1>Welcome to Property Listing</h1>
                  <p>Complete these steps to start listing your properties</p>
                </IonText>
              </IonCol>
            </IonRow>

            <IonRow className="ion-justify-content-center ion-margin-top">
              {/* Step 1: Registration */}
              <IonCol size="12" size-md="4">
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--ion-color-success)' }} />
                    <h2>Registration</h2>
                    <p>Create your landlord account</p>
                    <IonButton
                      expand="block"
                      color="success"
                      disabled
                    >
                      Completed
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Step 2: Profile Completion */}
              <IonCol size="12" size-md="4">
                <IonCard>
                  <IonCardContent className="ion-text-center">
                    <IonIcon icon={documentsOutline} style={{ fontSize: '2rem', marginBottom: '1rem', color: ownerData?.phone_number && ownerData?.ic_number ? 'var(--ion-color-success)' : 'var(--ion-color-primary)' }} />
                    <h2>Complete Profile</h2>
                    <p>Add your contact and verification details</p>
                    {ownerData?.phone_number && ownerData?.ic_number ? (
                      <IonButton
                        expand="block"
                        color="success"
                        disabled
                      >
                        Completed
                      </IonButton>
                    ) : (
                      <IonButton
                        expand="block"
                        color="primary"
                        routerLink="/landlordProfile"
                      >
                        Complete Profile
                      </IonButton>
                    )}
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Step 3: Start Listing */}
              <IonCol size="12" size-md="4">
                <IonCard className={!ownerData?.phone_number || !ownerData?.ic_number ? 'disabled-card' : ''}>
                  <IonCardContent className="ion-text-center">
                    <IonIcon icon={homeOutline} style={{ fontSize: '2rem', marginBottom: '1rem', color: !ownerData?.phone_number || !ownerData?.ic_number ? 'var(--ion-color-medium)' : 'var(--ion-color-primary)' }} />
                    <h2>Start Listing</h2>
                    <p>List your properties for rent</p>
                    <IonButton
                      expand="block"
                      color="primary"
                      onClick={handleListProperty}
                      disabled={!ownerData?.phone_number || !ownerData?.ic_number}
                    >
                      List Properties
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            <IonRow className="ion-justify-content-center ion-margin-top">
              <IonCol size-xs="12" size-md="4" size-lg="3">
                <IonButton 
                  expand="block" 
                  fill="outline" 
                  routerLink="/"
                >
                  Back to Home
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}

        <style>
          {`
            .disabled-card {
              opacity: 0.7;
              pointer-events: none;
            }
            ion-card {
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            ion-card-content {
              display: flex;
              flex-direction: column;
              height: 100%;
              justify-content: space-between;
            }
            h2 {
              font-size: 1.2rem;
              font-weight: 600;
              margin-bottom: 0.5rem;
            }
            p {
              color: var(--ion-color-medium);
              margin-bottom: 1rem;
            }
          `}
        </style>
      </IonContent>
    </IonPage>
  );
};

export default LandLordHome;
